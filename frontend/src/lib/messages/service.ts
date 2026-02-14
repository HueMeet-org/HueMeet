import { Message, ConversationParticipant } from "@/types/messages";
import { createClient } from "../supabase/client";
import { getSharedKeyForChat } from "../userKeyManager";
import { decryptMessage, encryptMessage } from "../encryption";


export async function getParticipant(conversationId: string, userId: string): Promise<ConversationParticipant | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("conversations")
        .select("connection_id")
        .eq("id", conversationId)
        .single();

    if (error) {
        throw error;
    }

    const { data: connectionData } = await supabase
        .from("connections")
        .select(`
            sender_id,
            receiver_id,
            sender:profiles!sender_id(id, full_name, username, avatar_url),
            receiver:profiles!receiver_id(id, full_name, username, avatar_url)
        `)
        .eq("id", data.connection_id)
        .single();

    if (connectionData) {
        const sender = Array.isArray(connectionData.sender) ? connectionData.sender[0] : connectionData.sender;
        const receiver = Array.isArray(connectionData.receiver) ? connectionData.receiver[0] : connectionData.receiver;
        const isUserSender = connectionData.sender_id === userId;
        const otherUser = isUserSender ? receiver : sender;

        return {
            id: otherUser.id as string,
            name: (otherUser.full_name || otherUser.username) as string,
            username: otherUser.username as string,
            avatarUrl: otherUser.avatar_url as string | undefined,
            isOnline: false, // Will be updated by presence
            lastSeen: undefined,
        };
    }

    return null;
}

export async function getMessages(conversationId: string, userId: string): Promise<Message[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("messages")
        .select(`
            id,
            conversation_id,
            sender_id,
            receiver_id,
            content,
            iv,
            created_at,
            is_read
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    if (!data || data.length === 0) {
        return [];
    }

    // map the data using row to messages
    // this also decrypts the message content
    const messages = await Promise.all(data.map(async (row) => await mapRowToMessage(row, userId)));

    return messages;
}

// create conversation participant
export async function createConversationParticipant(
    conversationId: string,
    userId: string
): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from("conversation_participants")
        .insert({
            conversation_id: conversationId,
            user_id: userId,
        });

    if (error) {
        // Ignore duplicate key error (participant already exists)
        if (error.code === '23505') {
            return;
        }
        throw error;
    }
}

// ── Send a message to Supabase ──
export async function sendMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string
): Promise<Message> {
    const supabase = createClient();
    // Get shared key for THIS specific chat
    let sharedKey: CryptoKey | null = null;
    try {
        sharedKey = await getSharedKeyForChat(senderId, receiverId);
    } catch (e) {
        console.warn("Encryption keys missing, sending unencrypted message:", e);
    }

    let messageContent = content;
    let messageIv = "unencrypted";

    if (sharedKey) {
        const encryptedMessage = await encryptMessage(content, sharedKey);
        messageContent = encryptedMessage.ciphertext;
        messageIv = encryptedMessage.iv;
    }

    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            receiver_id: receiverId,
            content: messageContent,
            iv: messageIv,
        })
        .select("*")
        .single();

    if (error) {
        console.error("Supabase sendMessage error:", error.message, "| code:", error.code, "| details:", error.details);
        throw new Error(`Failed to send message: ${error.message}`);
    }

    return {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        content: content, // Return plaintext so UI doesn't flicker to ciphertext
        iv: data.iv,
        createdAt: data.created_at,
        isRead: data.is_read,
        isMessageFromCurrentUser: true,
    };
}

// Mark all unread messages in a conversation as read
// Only marks messages where the current user is the receiver
export async function markMessagesAsRead(
    conversationId: string,
    userId: string
): Promise<void> {
    console.log("Marking messages as read for conversation:", conversationId, "and user:", userId);
    const supabase = createClient();

    const { data, error: updateError } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("receiver_id", userId)
        .eq("is_read", false)
        .select("*");

    if (updateError) {
        console.error("Failed to mark messages as read:", updateError);
    } else {
        console.log(`Updated ${data?.length || 0} messages`); // Check if any rows updated
    }
}

// ── Map a raw Supabase row to the Message type ──
// Used by the realtime subscription to convert incoming payloads
export async function mapRowToMessage(
    row: Record<string, unknown>,
    userId: string
): Promise<Message> {
    const otherUserId = row.sender_id === userId ? row.receiver_id as string : row.sender_id as string;
    let sharedKey: CryptoKey | null = null;
    try {
        sharedKey = await getSharedKeyForChat(userId, otherUserId);
    } catch (e) {
        console.warn("Could not get shared key (recipient might not have keys setup yet). Messages will stay encrypted.", e);
        // We continue without a shared key
    }
    let decryptedContent = "";
    if (row.iv === "unencrypted") {
        decryptedContent = row.content as string;
    } else if (sharedKey) {
        try {
            decryptedContent = await decryptMessage(
                {
                    ciphertext: row.content as string,
                    iv: row.iv as string
                },
                sharedKey
            );
        } catch (error) {
            console.error("Failed to decrypt message:", row.id, error);
            decryptedContent = "Error decrypting message";
        }
    }
    return {
        id: row.id as string,
        conversationId: row.conversation_id as string,
        senderId: row.sender_id as string,
        receiverId: row.receiver_id as string,
        content: decryptedContent,
        iv: row.iv as string,
        createdAt: row.created_at as string,
        isRead: row.is_read as boolean,
        isMessageFromCurrentUser: (row.sender_id as string) === userId,
    };
}