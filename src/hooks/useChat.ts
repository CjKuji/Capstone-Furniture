"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { chatKeys } from "@/lib/chatKeys";
import {
  getConversationByOrder,
  getMessages,
  sendMessage,
  uploadChatImage,
  markConversationAsRead,
} from "@/services/chat/chatService";

import type { Message } from "@/types/chat";

type SenderType = "customer" | "admin" | "system";
type ReaderType = "customer" | "admin";

type Props = {
  orderId: string;
  readerType?: ReaderType;
};

export function useChat({ orderId, readerType = "customer" }: Props) {
  const queryClient = useQueryClient();

  const conversationQuery = useQuery({
    queryKey: chatKeys.conversation(orderId),
    queryFn: () => getConversationByOrder(orderId),
    enabled: !!orderId,
  });

  const conversationId = conversationQuery.data?.id ?? null;

  const messagesQuery = useQuery<Message[]>({
    queryKey: chatKeys.messages(conversationId ?? ""),
    queryFn: () => getMessages(conversationId as string),
    enabled: !!conversationId,
  });

  const syncMessage = useCallback(
    (msg: Message) => {
      if (!conversationId) return;
      const queryKey = chatKeys.messages(conversationId);

      queryClient.setQueryData<Message[]>(queryKey, (old = []) => {
        const exists = old.some((m) => m.id === msg.id);
        if (exists) return old;
        return [...old, msg].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    },
    [conversationId, queryClient]
  );

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-room-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          syncMessage(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, syncMessage]);

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (newMessage) => {
      syncMessage(newMessage);
    },
  });

  const send = async ({
    message,
    file,
    senderType = "customer",
  }: {
    message?: string;
    file?: File | null;
    senderType?: SenderType;
  }) => {
    if (!conversationId) throw new Error("Conversation not found");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let imageUrl: string | null = null;
    if (file) {
      imageUrl = await uploadChatImage(file, conversationId);
    }

    const trimmed = message?.trim() ?? "";
    if (!trimmed && !imageUrl) return;

    return sendMessageMutation.mutateAsync({
      conversationId,
      senderId: user.id,
      message: trimmed,
      imageUrl: imageUrl ?? null,
      senderType: senderType ?? "customer",
    });
  };

  /** * FIXED: MARK AS READ (With Optimistic Cache Update) 
   * This immediately clears the unread count in the UI before the DB call finishes.
   */
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    const convKey = chatKeys.conversation(orderId);
    const unreadField = readerType === "customer" ? "customer_unread_count" : "admin_unread_count";

    // Optimistically set unread count to 0
    queryClient.setQueryData(convKey, (old: any) => {
      if (!old) return old;
      return { ...old, [unreadField]: 0 };
    });

    try {
      await markConversationAsRead({ conversationId, readerType });
    } catch (err) {
      console.error("Failed to mark as read:", err);
      queryClient.invalidateQueries({ queryKey: convKey });
    }
  }, [conversationId, orderId, queryClient, readerType]);

  return {
    conversation: conversationQuery.data ?? null,
    messages: messagesQuery.data ?? [],
    isLoading: conversationQuery.isLoading || messagesQuery.isLoading,
    isSending: sendMessageMutation.isPending,
    send,
    markAsRead,
    conversationId,
  };
}