"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatHeader } from "@/components/chat-header";
import { ChatBubble } from "@/components/chat-bubble";
import { ChatInput } from "@/components/chat-input";
import { ChatDateSeparator } from "@/components/chat-date-separator";
import { Message, ConversationParticipant } from "@/types/messages";
import {
    getMessages,
    getParticipant,
    sendMessage,
    markMessagesAsRead,
    mapRowToMessage
} from "@/lib/messages/service";
import { createClient } from "@/lib/supabase/client";

export default function ConversationPage() {
    const params = useParams();
    const conversationId = params.conversationId as string;
    const supabase = createClient();

    const [messages, setMessages] = useState<Message[]>([]);
    const [participant, setParticipant] = useState<ConversationParticipant | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    // Keep userId in a ref so the realtime callback always sees latest value
    const userIdRef = useRef<string | null>(null);

    // ── Fetch conversation data ──
    useEffect(() => {
        const load = async () => {
            setLoading(true);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);
            userIdRef.current = user.id;

            // Get messages + participant in parallel
            const [msgs, part] = await Promise.all([
                getMessages(conversationId, user.id),
                getParticipant(conversationId, user.id),
            ]);

            setMessages(msgs);
            setParticipant(part);
            setLoading(false);

            // Mark unread messages as read when opening the conversation
            await markMessagesAsRead(conversationId, user.id);
        };
        load();
    }, [conversationId]);

    // Supabase Realtime subscription
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    const currentUserId = userIdRef.current;
                    if (!currentUserId) return;

                    const newMsg = await mapRowToMessage(payload.new, currentUserId);

                    // Only add if it's from the other user (our own messages
                    // are already added optimistically)
                    if (!newMsg.isMessageFromCurrentUser) {
                        setMessages((prev) => {
                            // Prevent duplicates
                            if (prev.some((m) => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });

                        // Auto-mark as read since the user is viewing this conversation
                        markMessagesAsRead(conversationId, currentUserId);
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    const currentUserId = userIdRef.current;
                    if (!currentUserId) return;

                    const updatedMsg = await mapRowToMessage(payload.new, currentUserId);

                    // Update the message in state (e.g. is_read changed)
                    setMessages((prev) =>
                        prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, conversationId]);

    // ── Auto-scroll to bottom ──
    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    useEffect(() => {
        if (!loading && messages.length > 0) {
            scrollToBottom("instant");
        }
    }, [loading]);

    // Scroll on new messages
    useEffect(() => {
        if (!loading && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages.length]);

    // ── Send message handler ──
    const handleSendMessage = async (content: string) => {
        if (!userId || !participant || sending) return;

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: Message = {
            id: tempId,
            conversationId,
            senderId: userId,
            receiverId: participant.id,
            content,
            createdAt: new Date().toISOString(),
            isRead: false,
            isMessageFromCurrentUser: true,
            iv: "unencrypted",
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        setSending(true);

        try {
            const sentMsg = await sendMessage(
                conversationId,
                userId,
                participant.id,
                content
            );

            // Replace optimistic message with the real one from DB
            setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? sentMsg : m))
            );
        } catch (error) {
            console.error("Failed to send message:", error instanceof Error ? error.message : error);
            // Remove the optimistic message on failure
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
        } finally {
            setSending(false);
        }
    };

    // ── Loading skeleton ──
    if (loading) {
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
                                <div
                                    className="cursor-default"
                                >
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
                onSendMessage={handleSendMessage}
                disabled={sending}
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