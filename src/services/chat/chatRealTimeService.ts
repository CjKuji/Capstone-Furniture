import { supabase } from "@/lib/supabase";

/**
 * =========================================================
 * SUBSCRIBE TO MESSAGES (REALTIME)
 * =========================================================
 */
export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: any) => void
) {
  const channel = supabase
    .channel(`chat:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}