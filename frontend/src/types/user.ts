export interface UserProfile {
    imageUrl: string;
    username: string;
    fullName: string;
}

export interface UserProfileComplete {
    imageUrl: string;
    username: string;
    fullName: string;
    bio: string;
    interests_count: number;
    connections_count: number;
    aura: number;
}

export type UserPresence = "online" | "offline" | "away" | "typing"

export interface ConnectedUsers {
  id: string
  userId: string
  name: string
  username: string
  avatarUrl?: string

  lastMessage?: string
  lastMessageAt: string
  unreadCount: number

  presence: UserPresence
}