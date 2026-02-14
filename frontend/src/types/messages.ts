export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    iv: string;
    createdAt: string;
    isRead: boolean;
    isMessageFromCurrentUser: boolean;
}

export interface ConversationParticipant {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    isOnline: boolean;
    lastSeen?: string;
}