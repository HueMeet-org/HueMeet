"use client";

import { ConversationParticipant } from "@/types/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useUserPresence } from "@/hooks/use-presence";
import { ConnectedUsers } from "@/types/user";

interface ChatHeaderProps {
    participant: ConversationParticipant;
}

export function ChatHeader({ participant }: ChatHeaderProps) {
    const isOnline = useUserPresence(participant.username);
    const presence = (isOnline ? 'online' : 'offline') as ConnectedUsers['presence'];

    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/80 backdrop-blur-sm shrink-0">
            {/* Back button – visible on all sizes, navigates to messages list */}
            <Link href="/messages">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer rounded-full"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>

            {/* Avatar + status */}
            <Link
                href={`/profile/${participant.username}`}
                className="flex items-center gap-3 flex-1 min-w-0"
            >
                <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-sm font-semibold">
                            {participant.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>

                    {/* Online indicator */}
                    <span
                        className={cn(
                            "absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-card",
                            presence === 'online' ? "bg-green-500" : "bg-slate-400"
                        )}
                    />
                </div>

                {/* Name + status text */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold truncate leading-tight">
                        {participant.name}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">
                        {presence === 'online' ? (
                            "Online"
                        ) : participant.lastSeen ? (
                            `Last seen ${formatLastSeen(participant.lastSeen)}`
                        ) : (
                            "Offline"
                        )}
                    </p>
                </div>
            </Link>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer rounded-full hidden sm:inline-flex"
                >
                    <Phone className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer rounded-full hidden sm:inline-flex"
                >
                    <Video className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer rounded-full"
                >
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function formatLastSeen(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
