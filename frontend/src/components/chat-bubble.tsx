"use client";

import { Message } from "@/types/messages";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, FileIcon, Download } from "lucide-react";
import Link from "next/link";

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
                {/* File Attachment */}
                {message.fileUrl && (
                    <div className={cn("mb-2", !message.content && "mb-0")}>
                        {message.fileType?.startsWith("image/") ? (
                            <div className="relative rounded-lg overflow-hidden my-1">
                                <img
                                    src={message.fileUrl}
                                    alt={message.fileName || "Image"}
                                    className="object-cover max-h-75 w-auto h-auto rounded-lg"
                                />
                            </div>
                        ) : (
                            <Link
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                    isOwn ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" : "bg-background/50 border-border hover:bg-background/80"
                                )}
                            >
                                <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                                    <FileIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate max-w-37.5">{message.fileName || "File"}</p>
                                    <p className="text-xs opacity-70">{message.fileSize ? (message.fileSize / 1024).toFixed(0) + " KB" : "Unknown size"}</p>
                                </div>
                                <Download className="h-4 w-4 shrink-0 opacity-70" />
                            </Link>
                        )}
                    </div>
                )}

                {/* Message content */}
                {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}

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
