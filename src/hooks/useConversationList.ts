"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* =========================================================
   TYPES
========================================================= */

export type Conversation = {
  id: string;
  order_id: string | null;
  user_id: string;
  admin_id: string;

  customer_unread_count: number;
  admin_unread_count: number;

  last_message: string | null;
  last_message_at: string | null;

  created_at: string;
  updated_at: string;
};

type Props = {
  userId: string;
  role: "customer" | "admin";
};

/* =========================================================
   HOOK
========================================================= */

export function useConversationList({ userId, role }: Props) {
  const queryClient = useQueryClient();

  /* =========================================================
     FETCH (FULLY SAFE + NO UNION TYPES)
  ========================================================= */

  const conversationsQuery = useQuery<Conversation[], Error>({
    queryKey: ["conversations", userId],
    enabled: !!userId,

    queryFn: async (): Promise<Conversation[]> => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) throw new Error(error.message);

      // ALWAYS force array type
      return (data ?? []) as Conversation[];
    },
  });

  /* =========================================================
     NORMALIZED ARRAY (CRITICAL FIX)
  ========================================================= */

  const conversations: Conversation[] = Array.isArray(
    conversationsQuery.data
  )
    ? conversationsQuery.data
    : [];

  /* =========================================================
     UNREAD HELPER
  ========================================================= */

  const getUnreadCount = useCallback(
    (conversation: Conversation): number => {
      if (!conversation) return 0;

      return role === "customer"
        ? conversation.customer_unread_count ?? 0
        : conversation.admin_unread_count ?? 0;
    },
    [role]
  );

  /* =========================================================
     REALTIME SYNC (SAFE MERGE)
  ========================================================= */

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          const updated = payload.new as Partial<Conversation> | null;
          if (!updated?.id) return;

          queryClient.setQueryData<Conversation[]>(
            ["conversations", userId],
            (old = []) => {
              const exists = old.some((c) => c.id === updated.id);

              const merged: Conversation[] = exists
                ? old.map((c) =>
                    c.id === updated.id
                      ? { ...c, ...updated }
                      : c
                  )
                : ([updated as Conversation, ...old] as Conversation[]);

              return merged.sort(
                (a, b) =>
                  new Date(b.last_message_at ?? 0).getTime() -
                  new Date(a.last_message_at ?? 0).getTime()
              );
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  /* =========================================================
     CACHE UPDATE
  ========================================================= */

  const updateConversationCache = useCallback(
    (
      conversationId: string,
      updater: (c: Conversation) => Conversation
    ) => {
      queryClient.setQueryData<Conversation[]>(
        ["conversations", userId],
        (old = []) =>
          old.map((c) =>
            c.id === conversationId ? updater(c) : c
          )
      );
    },
    [queryClient, userId]
  );

  /* =========================================================
     CLEAR UNREAD
  ========================================================= */

  const clearUnread = useCallback(
    (conversationId: string) => {
      updateConversationCache(conversationId, (c) => ({
        ...c,
        customer_unread_count:
          role === "customer" ? 0 : c.customer_unread_count,
        admin_unread_count:
          role === "admin" ? 0 : c.admin_unread_count,
      }));
    },
    [updateConversationCache, role]
  );

  /* =========================================================
     RETURN
  ========================================================= */

  return {
    conversations, // ✅ always clean Conversation[]
    isLoading: conversationsQuery.isLoading,

    getUnreadCount,
    updateConversationCache,
    clearUnread,
  };
}