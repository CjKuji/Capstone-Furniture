"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FurnitureContext {
  name: string;
  category?: string;
  price: number;
  width?: number;
  depth?: number;
  height?: number;
  description?: string;
}

export function useAIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Get session on mount and listen for auth changes
  useEffect(() => {
    // Get current session immediately
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    // Keep in sync if user logs in/out mid-session
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const sendMessage = useCallback(
    async (input: string, furnitureContext?: FurnitureContext) => {
      const text = input.trim();
      if (!text || isThinking) return;

      setError(null);

      const userMsg: AIMessage = { role: "user", content: text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsThinking(true);

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            messages: updatedMessages,
            furnitureContext,
            userId, // null for guests, uuid for logged-in users
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Request failed");
        }

        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I'm having trouble right now. Please try again.",
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [messages, isThinking, userId]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isThinking,
    error,
    userId,
    sendMessage,
    clearChat,
  };
}