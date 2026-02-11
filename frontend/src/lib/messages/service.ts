import { Message, ConversationParticipant } from "@/types/messages";
import { createClient } from "../supabase/client";


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
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    // map the data to Message type
    const messages = data.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        createdAt: msg.created_at,
        isRead: msg.is_read,
        isMessageFromCurrentUser: msg.sender_id === userId,
    }));

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

    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            receiver_id: receiverId,
            content,
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
        content: data.content,
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
export function mapRowToMessage(
    row: Record<string, unknown>,
    userId: string
): Message {
    return {
        id: row.id as string,
        conversationId: row.conversation_id as string,
        senderId: row.sender_id as string,
        receiverId: row.receiver_id as string,
        content: row.content as string,
        createdAt: row.created_at as string,
        isRead: row.is_read as boolean,
        isMessageFromCurrentUser: (row.sender_id as string) === userId,
    };
}