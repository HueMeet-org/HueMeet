"use client";

import { Message } from "@/types/messages";
import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface ChatBubbleProps {
    message: Message;
    isGroupedWithPrevious: boolean;
}

export function ChatBubble({ message, isGroupedWithPrevious }: ChatBubbleProps) {
    const isOwn = message.isMessageFromCurrentUser;

    return (
        <div
            className={cn(
                "flex w-full",
                isOwn ? "justify-end" : "justify-start",
                isGroupedWithPrevious ? "mt-0.5" : "mt-3"
            )}
        >
            <div
                className={cn(
                    "relative max-w-[75%] sm:max-w-[65%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed",
                    "animate-in fade-in slide-in-from-bottom-1 duration-200",
                    isOwn
                        ? "bg-primary text-primary-foreground rounded-tr-md"
                        : "bg-muted text-foreground rounded-tl-md"
                )}
            >
                {/* Message content */}
                <p className="whitespace-pre-wrap">{message.content}</p>

                {/* Time + status row */}
                <div
                    className={cn(
                        "flex items-center gap-1 mt-1",
                        isOwn ? "justify-end" : "justify-start"
                    )}
                >
                    <span
                        className={cn(
                            "text-[10px] select-none",
                            isOwn
                                ? "text-primary-foreground/60"
                                : "text-muted-foreground"
                        )}
                    >
                        {formatMessageTime(message.createdAt)}
                    </span>

                    {isOwn && (
                        message.isRead
                            ? <CheckCheck className="h-3.5 w-3.5 text-blue-300" />
                            : <Check className="h-3.5 w-3.5 text-primary-foreground/60" />
                    )}
                </div>
            </div>
        </div>
    );
}

function formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
