import { supabase } from "@/lib/supabase";

let channel: any = null;
let listeners: ((payload: any) => void)[] = [];

export function initConversationsChannel() {
  if (channel) return channel;

  channel = supabase
    .channel("global-conversations-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
      },
      (payload) => {
        listeners.forEach((fn) => fn(payload));
      }
    )
    .subscribe();

  return channel;
}

export function subscribeToConversations(fn: (payload: any) => void) {
  initConversationsChannel();

  listeners.push(fn);

  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}