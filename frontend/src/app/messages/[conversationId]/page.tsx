"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatHeader } from "@/components/chat-header";
import { ChatBubble } from "@/components/chat-bubble";
import { ChatInput } from "@/components/chat-input";
import { ChatDateSeparator } from "@/components/chat-date-separator";
import { Message } from "@/types/messages";
import { createClient } from "@/lib/supabase/client";
import { useConversation } from "@/hooks/use-conversation";

export default function ConversationPage() {
    const params = useParams();
    const conversationId = params.conversationId as string;
    const supabase = createClient();
    const [userId, setUserId] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Get current user
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
            setAuthLoading(false);
        };
        getUser();
    }, []);

    // Use custom hook for conversation logic
    const { messages, participant, loading, sendMessage } = useConversation(conversationId, userId);

    // ── Auto-scroll to bottom ──
    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    useEffect(() => {
        if (!loading && messages.length > 0) {
            scrollToBottom("instant");
        }
    }, [loading, messages.length]); // Added messages.length to dependency

    // Scroll on new messages
    useEffect(() => {
        if (!loading && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages.length, loading, scrollToBottom]);


    // ── Loading skeleton ──
    if (authLoading || loading) {
        return (
            <Card className="h-[85vh] flex flex-col m-0 p-0 gap-0 overflow-hidden">
                {/* Header skeleton */}
                <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                {/* Messages skeleton */}
                <div className="flex-1 p-4 space-y-4">
                    <div className="flex justify-start">
                        <Skeleton className="h-12 w-48 rounded-2xl" />
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-16 w-56 rounded-2xl" />
                    </div>
                    <div className="flex justify-start">
                        <Skeleton className="h-10 w-40 rounded-2xl" />
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-20 w-64 rounded-2xl" />
                    </div>
                    <div className="flex justify-start">
                        <Skeleton className="h-12 w-52 rounded-2xl" />
                    </div>
                </div>
                {/* Input skeleton */}
                <div className="border-t p-4 shrink-0">
                    <Skeleton className="h-10 w-full rounded-2xl" />
                </div>
            </Card>
        );
    }

    if (!participant) {
        return (
            <Card className="h-[85vh] flex items-center justify-center">
                <p className="text-muted-foreground">Conversation not found</p>
            </Card>
        );
    }

    return (
        <Card className="h-[85vh] flex flex-col m-0 p-0 gap-0 overflow-hidden">
            {/* Header */}
            <ChatHeader participant={participant} />

            {/* Messages area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 custom-scrollbar"
            >
                <div className="relative min-h-full">
                    {messages.map((msg, idx) => {
                        const prev = idx > 0 ? messages[idx - 1] : null;
                        const showDate = shouldShowDateSeparator(msg, prev);
                        const isGrouped =
                            prev !== null &&
                            !showDate &&
                            prev.senderId === msg.senderId &&
                            timeDiffMinutes(prev.createdAt, msg.createdAt) < 2;

                        return (
                            <React.Fragment key={msg.id}>
                                {showDate && (
                                    <ChatDateSeparator date={msg.createdAt} />
                                )}
                                <div className="cursor-default">
                                    <ChatBubble
                                        message={msg}
                                        isGroupedWithPrevious={isGrouped}
                                    />
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <ChatInput
                onSendMessage={sendMessage}
                disabled={false}
            />
        </Card>
    );
}

// ── Helpers ──

function shouldShowDateSeparator(
    current: Message,
    previous: Message | null
): boolean {
    if (!previous) return true;
    const curDate = new Date(current.createdAt).toDateString();
    const prevDate = new Date(previous.createdAt).toDateString();
    return curDate !== prevDate;
}

function timeDiffMinutes(a: string, b: string): number {
    return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 60000;
}