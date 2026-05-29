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

  /** 1. FETCH CONVERSATION */
  const conversationQuery = useQuery({
    queryKey: chatKeys.conversation(orderId),
    queryFn: () => getConversationByOrder(orderId),
    enabled: !!orderId,
  });

  const conversationId = conversationQuery.data?.id ?? null;

  /** 2. FETCH MESSAGES */
  const messagesQuery = useQuery<Message[]>({
    queryKey: chatKeys.messages(conversationId ?? ""),
    queryFn: () => getMessages(conversationId as string),
    enabled: !!conversationId,
  });

  /** 3. SYNC HELPER (With Debugging) */
  const syncMessage = useCallback(
    (msg: Message) => {
      if (!conversationId) return;
      const queryKey = chatKeys.messages(conversationId);

      console.log("[DEBUG] Syncing message into cache:", msg.id);

      queryClient.setQueryData<Message[]>(queryKey, (old = []) => {
        const exists = old.some((m) => m.id === msg.id);
        if (exists) {
          console.log("[DEBUG] Message already exists in cache, skipping.");
          return old;
        }
        return [...old, msg].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    },
    [conversationId, queryClient]
  );

  /** 4. REALTIME LISTENER (The Faucet) */
  useEffect(() => {
    if (!conversationId) return;

    console.log(`[DEBUG] Initializing Realtime for: ${conversationId}`);

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
          console.log("[DEBUG] REALTIME PAYLOAD RECEIVED:", payload);
          syncMessage(payload.new as Message);
        }
      )
      .subscribe((status) => {
        console.log(`[DEBUG] Subscription status: ${status}`);
        if (status === "CHANNEL_ERROR") {
          console.error("[DEBUG] Realtime Channel Error. Check RLS or Publication settings.");
        }
      });

    return () => {
      console.log("[DEBUG] Cleaning up Realtime channel.");
      supabase.removeChannel(channel);
    };
  }, [conversationId, syncMessage]);

  /** 5. SEND ACTION */
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (newMessage) => {
      console.log("[DEBUG] Send success, updating local cache.");
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
      console.log("[DEBUG] Uploading image...");
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

  /** 6. MARK AS READ */
  const markAsRead = useCallback(() => {
    if (!conversationId) return;
    markConversationAsRead({ conversationId, readerType });
    // Invalidate locally so UI updates
    queryClient.invalidateQueries({ queryKey: chatKeys.conversation(orderId) });
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