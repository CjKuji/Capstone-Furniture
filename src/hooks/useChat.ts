"use client";

import {
  useEffect,
  useCallback,
  useRef,
} from "react";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getConversationByOrder,
  getMessages,
  sendMessage,
  uploadChatImage,
  markConversationAsRead,
} from "@/services/chat/chatService";

import { supabase } from "@/lib/supabase";
import { chatKeys } from "@/lib/chatKeys";

import type { Message } from "@/types/chat";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */
type SenderType =
  | "customer"
  | "admin"
  | "system";

type ReaderType =
  | "customer"
  | "admin";

type Props = {
  orderId: string;
  readerType?: ReaderType;
};

/**
 * =========================================================
 * HOOK
 * =========================================================
 */
export function useChat({
  orderId,
  readerType = "customer",
}: Props) {
  const queryClient = useQueryClient();

  const hasMarkedRead = useRef(false);

  /**
   * =========================================================
   * CONVERSATION
   * =========================================================
   */
  const conversationQuery = useQuery({
    queryKey: chatKeys.conversation(orderId),

    queryFn: async () => {
      console.log(
        "[CHAT] FETCH CONVERSATION",
        orderId
      );

      return getConversationByOrder(orderId);
    },

    enabled: !!orderId,
  });

  const conversationId =
    conversationQuery.data?.id ?? null;

  /**
   * =========================================================
   * RESET READ FLAG
   * =========================================================
   */
  useEffect(() => {
    hasMarkedRead.current = false;
  }, [conversationId]);

  /**
   * =========================================================
   * MESSAGES
   * =========================================================
   */
  const messagesQuery = useQuery<Message[]>({
    queryKey: chatKeys.messages(
      conversationId ?? ""
    ),

    queryFn: async () => {
      console.log(
        "[CHAT] FETCH MESSAGES",
        conversationId
      );

      return getMessages(
        conversationId as string
      );
    },

    enabled: !!conversationId,
  });

  /**
   * =========================================================
   * LOCAL SYNC
   * =========================================================
   */
  const syncMessage = useCallback(
    (msg: Message) => {
      if (!conversationId) return;

      queryClient.setQueryData<Message[]>(
        chatKeys.messages(conversationId),

        (old = []) => {
          const exists = old.some(
            (m) => m.id === msg.id
          );

          if (exists) return old;

          return [...old, msg];
        }
      );
    },
    [conversationId, queryClient]
  );

  /**
   * =========================================================
   * SEND MESSAGE
   * =========================================================
   */
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,

    onSuccess: (newMessage) => {
      console.log(
        "[CHAT] MESSAGE SENT",
        newMessage
      );

      syncMessage(newMessage);
    },

    onError: (error) => {
      console.error(
        "[CHAT] SEND ERROR",
        error
      );
    },
  });

  /**
   * =========================================================
   * SEND
   * =========================================================
   */
  const send = async ({
    message,
    file,
    senderType = "customer",
  }: {
    message?: string;
    file?: File | null;
    senderType?: SenderType;
  }) => {
    console.log("[CHAT] SEND START");

    if (!conversationId) {
      console.error(
        "[CHAT] NO CONVERSATION ID"
      );

      throw new Error(
        "Conversation not found"
      );
    }

    /**
     * =========================================================
     * AUTH
     * =========================================================
     */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("[CHAT] USER", user);

    if (authError) {
      console.error(
        "[CHAT] AUTH ERROR",
        authError
      );

      throw authError;
    }

    if (!user?.id) {
      throw new Error(
        "User not authenticated"
      );
    }

    /**
     * =========================================================
     * IMAGE
     * =========================================================
     */
    let imageUrl: string | null = null;

    if (file) {
      console.log(
        "[CHAT] UPLOADING IMAGE"
      );

      imageUrl =
        await uploadChatImage(
          file,
          conversationId
        );

      console.log(
        "[CHAT] IMAGE URL",
        imageUrl
      );
    }

    /**
     * =========================================================
     * VALIDATION
     * =========================================================
     */
    const trimmed =
      message?.trim() ?? "";

    if (!trimmed && !imageUrl) {
      console.warn(
        "[CHAT] EMPTY MESSAGE"
      );

      return;
    }

    /**
     * =========================================================
     * SEND
     * =========================================================
     */
    return sendMessageMutation.mutateAsync({
      conversationId,
      senderId: user.id,
      message: trimmed,
      imageUrl,
      senderType,
    });
  };

  /**
   * =========================================================
   * MARK AS READ
   * =========================================================
   */
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await markConversationAsRead({
        conversationId,
        readerType,
      });

      console.log(
        "[CHAT] MARKED AS READ"
      );
    } catch (err) {
      console.error(
        "[CHAT] MARK READ ERROR",
        err
      );
    }
  }, [conversationId, readerType]);

  /**
   * =========================================================
   * REALTIME
   * =========================================================
   */
  useEffect(() => {
    if (!conversationId) return;

    console.log(
      "[CHAT] SUBSCRIBING",
      conversationId
    );

    const channel = supabase.channel(
      `chat:${conversationId}`
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },

      (payload) => {
        console.log(
          "[CHAT] REALTIME INSERT",
          payload
        );

        syncMessage(
          payload.new as Message
        );
      }
    );

    channel.subscribe((status) => {
      console.log(
        "[CHAT] REALTIME STATUS:",
        status
      );
    });

    return () => {
      console.log(
        "[CHAT] REMOVE CHANNEL"
      );

      supabase.removeChannel(channel);
    };
  }, [conversationId, syncMessage]);

  /**
   * =========================================================
   * AUTO MARK READ
   * =========================================================
   */
  useEffect(() => {
    if (!conversationId) return;

    if (hasMarkedRead.current)
      return;

    hasMarkedRead.current = true;

    markAsRead();
  }, [conversationId, markAsRead]);

  return {
    conversation:
      conversationQuery.data ?? null,

    messages:
      messagesQuery.data ?? [],

    isLoading:
      conversationQuery.isLoading ||
      messagesQuery.isLoading,

    send,
    markAsRead,

    conversationId,
  };
}