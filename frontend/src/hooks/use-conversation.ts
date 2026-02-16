import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    getMessages,
    getParticipant,
    sendMessage,
    markMessagesAsRead,
    mapRowToMessage
} from "@/lib/messages/service";
import { Message } from "@/types/messages";

interface FileType {
    url: string;
    name: string;
    type: string;
    size: number;
}

export function useConversation(conversationId: string, userId: string | null) {
    const queryClient = useQueryClient();
    const supabase = createClient();
    // Memoize keys to prevent unstable references
    const keys = useMemo(() => ({
        messages: ["messages", conversationId] as const,
        participant: ["participant", conversationId] as const,
    }), [conversationId]);

    // Fetch Participant
    const { data: participant, isLoading: loadingParticipant } = useQuery({
        queryKey: keys.participant,
        queryFn: () => userId ? getParticipant(conversationId, userId) : null,
        enabled: !!userId && !!conversationId,
        staleTime: Infinity, // Participant details rarely change
    });

    // Fetch Messages
    const { data: messages = [], isLoading: loadingMessages } = useQuery({
        queryKey: keys.messages,
        queryFn: () => userId ? getMessages(conversationId, userId) : [],
        enabled: !!userId && !!conversationId,
    });

    // Send Message Mutation (with Optimistic Updates)
    const { mutate: send } = useMutation({
        mutationFn: ({ content, receiverId, file }: { content: string; receiverId: string; file?: FileType }) =>
            sendMessage(conversationId, userId!, receiverId, content, file),

        onMutate: async ({ content, receiverId, file }) => {
            // Cancel outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: keys.messages });

            const previousMessages = queryClient.getQueryData<Message[]>(keys.messages);

            // Create optimistic message
            const optimisticMsg: Message = {
                id: `temp-${Date.now()}`,
                conversationId,
                senderId: userId!,
                receiverId,
                content,
                createdAt: new Date().toISOString(),
                isRead: false,
                isMessageFromCurrentUser: true,
                iv: "unencrypted",
                fileUrl: file?.url,
                fileName: file?.name,
                fileType: file?.type,
                fileSize: file?.size,
            };

            // Update cache instantly
            queryClient.setQueryData<Message[]>(keys.messages, (old = []) => [...(old || []), optimisticMsg]);

            return { previousMessages };
        },
        onError: (_err, _newTodo, context) => {
            // Rollback on error
            if (context?.previousMessages) {
                queryClient.setQueryData(keys.messages, context.previousMessages);
            }
        },
        onSuccess: (sentMessage) => {
            // Replace the temp message with the actual one from DB
            queryClient.setQueryData<Message[]>(keys.messages, (old = []) =>
                old.map(msg => msg.id.startsWith("temp-") ? sentMessage : msg)
            );
        },
    });

    // Realtime Subscription
    useEffect(() => {
        if (!userId || !conversationId) return;

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
                async (payload) => {
                    const newMsg = await mapRowToMessage(payload.new, userId);

                    // Only add if it's NOT from us (ours are handled via mutation success)
                    if (!newMsg.isMessageFromCurrentUser) {
                        queryClient.setQueryData<Message[]>(keys.messages, (old = []) => {
                            if (old.some(m => m.id === newMsg.id)) return old;
                            return [...old, newMsg];
                        });

                        // Mark as read immediately since we are viewing it
                        markMessagesAsRead(conversationId, userId);
                    }
                })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
                async (payload) => {
                    const updatedMsg = await mapRowToMessage(payload.new, userId);

                    queryClient.setQueryData<Message[]>(keys.messages, (old = []) =>
                        old.map(msg => msg.id === updatedMsg.id ? updatedMsg : msg)
                    );
                })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [conversationId, userId, queryClient, keys.messages, supabase]);

    return {
        messages,
        participant,
        loading: loadingMessages || loadingParticipant,
        sendMessage: (content: string, file?: any) => {
            if (participant) send({ content, receiverId: participant.id, file });
        }
    };
}
