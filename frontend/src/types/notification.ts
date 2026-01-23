export interface Notification {
    id: string;
    type: 'missed_call' | 'unread_message' | 'aura_update' | 'alert';
    title: string;
    description: string;
    imageUrl?: string;
    createdAt: string;
    isRead: boolean;
}