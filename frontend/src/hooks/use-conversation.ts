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
import { uploadFile } from "@/lib/fileUpload";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface FileType {
    url: string;          // fresh signed URL — used for optimistic preview & returned to cache
    storagePath: string;  // UUID filename in storage — stored in DB so URL can be regenerated
    name: string;         // original display name shown in the chat bubble
    type: string;
    size: number;
    fileIv?: string;
}

export function useConversation(conversationId: string, userId: string | null) {
    const queryClient = useQueryClient();
    const supabase = createClient();
    const messageKey = ["messages", conversationId] as const;
    const participantKey = ["participant", conversationId] as const;


    // Fetch Participant
    const { data: participant, isLoading: loadingParticipant } = useQuery({
        queryKey: participantKey,
        queryFn: () => userId ? getParticipant(conversationId, userId) : null,
        enabled: !!userId && !!conversationId,
        staleTime: Infinity, // Participant details rarely change
    });

    // Fetch Messages
    const { data: messages = [], isLoading: loadingMessages } = useQuery({
        queryKey: messageKey,
        queryFn: () => userId ? getMessages(conversationId, userId) : [],
        enabled: !!userId && !!conversationId,
    });

    // Send Message Mutation (with Optimistic Updates)
    const { mutate: send } = useMutation({
        mutationFn: ({ content, receiverId, file, auraScore }: { content: string; receiverId: string; file?: FileType; auraScore: number }) =>
            sendMessage(conversationId, userId!, receiverId, content, auraScore, file),

        onMutate: async ({ content, receiverId, file }) => {
            // Cancel outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: messageKey });

            const previousMessages = queryClient.getQueryData<Message[]>(messageKey);

            // Create optimistic message — use the signed URL that was already resolved
            // before send() was called (passed in via file.url).
            const optimisticMsg: Message = {
                id: `temp-${Date.now()}`,
                conversationId,
                senderId: userId!,
                receiverId,
                content,
                createdAt: new Date().toISOString(),
                isRead: false,
                isMessageFromCurrentUser: true,
                isEncrypted: content.length > 0,
                iv: "unencrypted",
                fileUrl: file?.url,
                fileName: file?.name,
                fileType: file?.type,
                fileSize: file?.size,
                fileIv: file?.fileIv,
                auraScore: 0,
            };

            // Update cache instantly
            queryClient.setQueryData<Message[]>(messageKey, (old = []) => [...(old || []), optimisticMsg]);

            return { previousMessages };
        },
        onError: (_err, _newTodo, context) => {
            // Rollback on error
            if (context?.previousMessages) {
                queryClient.setQueryData(messageKey, context.previousMessages);
            }
        },
        onSuccess: (sentMessage) => {
            // Replace the temp message with the actual one from DB
            queryClient.setQueryData<Message[]>(messageKey, (old = []) =>
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
                async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {

                    const newMsg = await mapRowToMessage(payload.new as Record<string, unknown>, userId);

                    // Only add if it's NOT from us (ours are handled via mutation success)
                    if (!newMsg.isMessageFromCurrentUser) {
                        queryClient.setQueryData<Message[]>(messageKey, (old = []) => {
                            if (old.some(m => m.id === newMsg.id)) return old;
                            return [...old, newMsg];
                        });

                        // Mark as read immediately since we are viewing it
                        markMessagesAsRead(conversationId, userId);
                    }
                })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
                (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                    const updated = payload.new as Record<string, unknown>;
                    queryClient.setQueryData<Message[]>(messageKey, (old = []) =>
                        old.map(msg =>
                            msg.id === updated.id
                                ? { ...msg, isRead: updated.is_read as boolean }
                                : msg
                        )
                    );
                })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [conversationId, userId, queryClient]);

    return {
        messages,
        participant,
        loading: loadingMessages || loadingParticipant,
        sendMessage: async (content: string, auraScore: number, file?: File) => {
            if (!participant) return;
            let uploadedFile: FileType | undefined;
            if (file) {
                const localPreviewUrl = URL.createObjectURL(file);
                // Upload the (encrypted) file and get back its storage path
                const result = await uploadFile(file, userId!, participant.id);

                uploadedFile = {
                    url: localPreviewUrl,            // used for immediate display
                    storagePath: result.name,  // UUID path stored in DB
                    name: file.name,           // original display name
                    type: file.type,
                    size: file.size,
                    fileIv: result.fileIv,
                };
            }
            send({ content, receiverId: participant.id, file: uploadedFile, auraScore });
        }
    };
}
