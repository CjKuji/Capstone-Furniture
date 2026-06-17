"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { chatKeys } from "@/lib/chatKeys";
import {
  getOrCreateConversation,
  getMessagesPaginated,
  sendMessage,
  uploadChatImage,
  markConversationAsRead,
} from "@/services/chat/chatService";

import type { Message, SenderType } from "@/services/chat/chatService";

type ReaderType = "customer" | "admin";

type Props = {
  orderId?: string | null;
  inquiryId?: string | null;
  readerType?: ReaderType;
  fallbackAdminId?: string;
};

export const MESSAGES_PAGE_SIZE = 30;

export function useChat({ 
  orderId = null, 
  inquiryId = null, 
  readerType = "customer",
  fallbackAdminId = "00000000-0000-0000-0000-000000000000"
}: Props) {
  const queryClient = useQueryClient();

  // Enforce validation to prevent deadlock requests
  const hasValidContext = !!orderId || !!inquiryId;

  // Build a dynamic context descriptor key to safely isolate cache entries inside React Query
  const contextCacheKey = orderId ? `order-${orderId}` : `inquiry-${inquiryId}`;

  /* ─────────────────────────────────────────────────────────
      STEP 1: Fetch or Create Polymorphic Conversation Thread
  ───────────────────────────────────────────────────────── */
  const conversationQuery = useQuery({
    queryKey: chatKeys.conversation(contextCacheKey),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to build chat streams.");

      return getOrCreateConversation({
        userId: user.id,
        adminId: fallbackAdminId,
        orderId,
        inquiryId,
      });
    },
    enabled: hasValidContext,
    staleTime: 0, // 🌟 FIXED: Set to 0 so re-opening the modal forces an immediate network verification sync
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const conversationId = conversationQuery.data?.id ?? null;

  /* ─────────────────────────────────────────────────────────
      STEP 2: Paginated messages
  ───────────────────────────────────────────────────────── */
  const messagesQuery = useInfiniteQuery<Message[]>({
    queryKey: chatKeys.messagesPaginated(conversationId ?? ""),
    queryFn: ({ pageParam }) =>
      getMessagesPaginated({
        conversationId: conversationId as string,
        before: pageParam as string | undefined,
        limit: MESSAGES_PAGE_SIZE,
      }),
    enabled: !!conversationId,
    initialPageParam: undefined,
    getPreviousPageParam: (firstPage) => {
      if (!firstPage || firstPage.length < MESSAGES_PAGE_SIZE) return undefined;
      return firstPage[0]?.created_at;
    },
    getNextPageParam: () => undefined,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const messages: Message[] = (messagesQuery.data?.pages ?? []).flat();

  /* ─────────────────────────────────────────────────────────
      REALTIME — Sync messages (Replaces matching temp message)
  ───────────────────────────────────────────────────────── */
  const syncMessage = useCallback(
    (msg: Message) => {
      if (!conversationId) return;
      const queryKey = chatKeys.messagesPaginated(conversationId);

      queryClient.setQueryData<{ pages: Message[][]; pageParams: any[] }>(
        queryKey,
        (old) => {
          if (!old) return old;

          const updatedPages = old.pages.map((page, index) => {
            if (index === old.pages.length - 1) {
              if (page.some((m) => m.id === msg.id)) {
                return page;
              }

              const tempIndex = page.findIndex(
                (m) =>
                  String(m.id).startsWith("temp-") &&
                  m.sender_id === msg.sender_id &&
                  ((msg.message && m.message === msg.message) ||
                    (msg.image_url && m.image_url === msg.image_url))
              );

              if (tempIndex !== -1) {
                const newPage = [...page];
                newPage[tempIndex] = msg;
                return newPage;
              }

              return [...page, msg].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            }
            return page;
          });

          return {
            ...old,
            pages: updatedPages,
          };
        }
      );
    },
    [conversationId, queryClient]
  );

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-room-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          syncMessage(payload.new as Message);
          queryClient.invalidateQueries({ queryKey: chatKeys.conversation(contextCacheKey) });
          // Invalidate parent dashboard list caches when new messages pop in live
          queryClient.invalidateQueries({ queryKey: ["conversations"], exact: false });
        }
      )
      // WATCH UPDATE BINDINGS: Synchronizes counter indicators globally when any workspace agent triggers a read mutation
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${conversationId}` },
        (payload) => {
          queryClient.setQueryData(chatKeys.conversation(contextCacheKey), payload.new);
          // 🌟 Push update layout signals instantly out to the parent view lists
          queryClient.invalidateQueries({ queryKey: ["conversations"], exact: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, contextCacheKey, syncMessage, queryClient]);

  /* ─────────────────────────────────────────────────────────
      SEND — Optimized with Optimistic Updates
  ───────────────────────────────────────────────────────── */
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.messagesPaginated(conversationId!) });
      const previous = queryClient.getQueryData(chatKeys.messagesPaginated(conversationId!));

      syncMessage({
        id: "temp-" + Date.now(),
        conversation_id: conversationId!,
        sender_id: newMsg.senderId,
        message: newMsg.message || null,
        image_url: newMsg.imageUrl || null,
        sender_type: newMsg.senderType,
        created_at: new Date().toISOString(),
        is_system: false,
      } as Message);

      return { previous };
    },
    onError: (err, newMsg, context) => {
      queryClient.setQueryData(chatKeys.messagesPaginated(conversationId!), context?.previous);
    },
  });

  const send = async ({ 
    message, 
    file, 
    senderType,
    sender_type 
  }: { 
    message?: string; 
    file?: File | null; 
    senderType?: SenderType;
    sender_type?: SenderType;
  }) => {
    if (!conversationId) throw new Error("Conversation not found");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let imageUrl: string | null = null;
    if (file) imageUrl = await uploadChatImage(file, conversationId);

    const trimmed = message?.trim() ?? "";
    if (!trimmed && !imageUrl) return;

    // Direct fallback hierarchy resolution engine
    const resolvedSenderType = senderType || sender_type || readerType || "customer";

    return sendMessageMutation.mutateAsync({
      conversationId,
      senderId: user.id,
      message: trimmed,
      imageUrl: imageUrl ?? null,
      senderType: resolvedSenderType,
    });
  };

  /* ─────────────────────────────────────────────────────────
      MARK AS READ (Using chatService Mutation Layer Explicitly)
  ───────────────────────────────────────────────────────── */
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;
    const convKey = chatKeys.conversation(contextCacheKey);
    const unreadField = readerType === "customer" ? "customer_unread_count" : "admin_unread_count";

    // 1. Instantly target and clear the reader's counter inside the client-side cache
    queryClient.setQueryData(convKey, (old: any) => {
      if (!old) return old;
      return { 
        ...old, 
        [unreadField]: 0 
      };
    });

    try {
      // 2. Correctly use the chatService function to match your database parameter layout
      await markConversationAsRead({ conversationId, readerType });
      
      // 3. Keep cache states strictly synchronized with your database records
      queryClient.invalidateQueries({ queryKey: convKey });
      // 🌟 FIXED: Tell TanStack to instantly flag your dashboard parent page lists to update badge interfaces
      queryClient.invalidateQueries({ queryKey: ["conversations"], exact: false });
    } catch (err) {
      console.error("Failed to update conversation unread row indicators:", err);
      queryClient.invalidateQueries({ queryKey: convKey });
    }
  }, [conversationId, contextCacheKey, queryClient, readerType]);

  return {
    conversation: conversationQuery.data ?? null,
    messages,
    isLoading: conversationQuery.isLoading || messagesQuery.isLoading,
    isSending: sendMessageMutation.isPending,
    isFetchingOlder: messagesQuery.isFetchingPreviousPage,
    hasOlderMessages: messagesQuery.hasPreviousPage ?? false,
    loadOlderMessages: messagesQuery.fetchPreviousPage,
    send,
    markAsRead,
    conversationId,
  };
}