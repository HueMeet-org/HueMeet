import { Message, ConversationParticipant } from "@/types/messages";
import { createClient } from "../supabase/client";
import { getSharedKeyForChat } from "../userKeyManager";
import { decryptMessage, encryptMessage } from "../encryption";
import { getFileUrl } from "../fileUpload";
import { toast } from "sonner";
import { updateProfileAuraScore } from "../profile/service";


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
            file_url,
            file_name,
            file_type,
            file_size,
            file_iv,
            created_at,
            is_read,
            aura
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
    content: string,
    auraScore: number,
    file?: {
        url: string;         // signed URL — returned to cache for immediate display
        storagePath: string; // UUID filename stored in DB
        name: string;
        type: string;
        size: number;
        fileIv?: string;
    }
): Promise<Message> {
    const supabase = createClient();
    // Get shared key for THIS specific chat
    let sharedKey: CryptoKey | null = null;
    try {
        sharedKey = await getSharedKeyForChat(senderId, receiverId);
    } catch (e) {
        toast.error("Failed To Send Message!!");
        throw new Error("Failed to get shared key for chat");
    }

    let messageContent = content;
    let messageIv: string | null = null;

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
            // Store the storage path, not a signed URL — signed URLs expire after 1 hour.
            // A fresh URL is generated at read time via getFileUrl().
            file_url: file?.storagePath ?? null,
            file_name: file?.name,
            file_type: file?.type,
            file_size: file?.size,
            file_iv: file?.fileIv ?? null,
            aura: auraScore,
        })
        .select("*")
        .single();

    if (error) {
        console.error("Supabase sendMessage error:", error.message, "| code:", error.code, "| details:", error.details);
        throw new Error(`Failed to send message: ${error.message}`);
    }

    // after sending the message, update the profile aura score
    await updateProfileAuraScore(auraScore);

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
        isEncrypted: false,
        fileUrl: file?.url,
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size,
        fileIv: file?.fileIv ?? null,
        auraScore: auraScore,
    };
}

// Mark all unread messages in a conversation as read
// Only marks messages where the current user is the receiver
export async function markMessagesAsRead(
    conversationId: string,
    userId: string
): Promise<void> {
    const supabase = createClient();

    const { error: updateError } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("receiver_id", userId)
        .eq("is_read", false)
        .select("*");

    if (updateError) {
        console.error("Failed to mark messages as read:", updateError);
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
    let isEncrypted = true;

    if (sharedKey) {
        try {
            decryptedContent = await decryptMessage(
                {
                    ciphertext: row.content as string,
                    iv: row.iv as string
                },
                sharedKey
            );
            isEncrypted = false;
        } catch (error) {
            // console.log("Failed to decrypt message:", row.id, error);
            decryptedContent = ""; // Clear content on decryption failure
        }
    } else {
        decryptedContent = ""; // Clear content if no shared key available
    }

    // Resolve file URL: the DB stores the storage path.
    // We pass the stored path directly. The FileAttachment component will fetch and decrypt on demand.
    const resolvedFileUrl: string | null = (row.file_url as string) || null;

    return {
        id: row.id as string,
        conversationId: row.conversation_id as string,
        senderId: row.sender_id as string,
        receiverId: row.receiver_id as string,
        content: decryptedContent,
        isEncrypted,
        iv: row.iv as string,
        createdAt: row.created_at as string,
        isRead: row.is_read as boolean,
        isMessageFromCurrentUser: (row.sender_id as string) === userId,
        fileUrl: resolvedFileUrl,
        fileName: row.file_name as string | null,
        fileType: row.file_type as string | null,
        fileSize: row.file_size as number | null,
        fileIv: row.file_iv as string | null,
        auraScore: row.aura as number,
    };
}