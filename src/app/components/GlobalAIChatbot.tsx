"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAIChat } from "@/hooks/useAIChat";
import { useAIChatContext } from "@/app/context/AIChatContext";

const SUGGESTED_QUESTIONS = [
  "What furniture do you have available?",
  "What's a fair price for a dining table?",
  "How do I care for wooden furniture?",
  "What wood type is most durable?",
];

export default function GlobalAIChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reads furniture context set by any page
  const { furnitureContext } = useAIChatContext();
  const { messages, isThinking, sendMessage, clearChat } = useAIChat();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    sendMessage(input, furnitureContext ?? undefined);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (q: string) => {
    sendMessage(q, furnitureContext ?? undefined);
  };

  if (!mounted) return null;

  return createPortal(
    <div data-chatbot-root>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4A97A] shadow-lg hover:bg-[#C4956A] transition-all hover:scale-105 active:scale-95 print:hidden"
        style={{ boxShadow: "0 8px 32px rgba(212,169,122,0.35)" }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5l10 10"
              stroke="#0B0704"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.03 2 11c0 2.76 1.3 5.23 3.37 6.94L4 22l4.5-1.5C9.6 20.83 10.78 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2z"
              fill="#0B0704"
            />
            <circle cx="8.5" cy="11" r="1.2" fill="#D4A97A" />
            <circle cx="12" cy="11" r="1.2" fill="#D4A97A" />
            <circle cx="15.5" cy="11" r="1.2" fill="#D4A97A" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={"fixed z-50 left-1/2 -translate-x-1/2 bottom-6 print:hidden " +
            "sm:bottom-24 sm:left-auto sm:translate-x-0 sm:right-6 " +
            "flex flex-col w-[95vw] max-w-[420px] sm:w-[360px] h-[60vh] sm:h-[520px] " +
            "rounded-3xl overflow-hidden bg-[#0B0704] border border-[#2A1F14]"}
          style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between px-4 py-3 bg-[#0E0B06]/80 border-b border-[#2A1F14] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#D4A97A]/15 flex items-center justify-center">
                <span className="text-[#D4A97A] text-xs">✦</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white/80 leading-none">
                  WoodForge Assistant
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {furnitureContext
                    ? `Viewing: ${furnitureContext.name}`
                    : "Ask me anything about furniture"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-2 py-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/[0.06] transition-all duration-200 text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-[#2A1F14] scrollbar-track-transparent">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-[#D4A97A]/10 flex items-center justify-center">
                  <span className="text-[#D4A97A] text-xl">✦</span>
                </div>
                <div>
                  <p className="text-sm text-white/60 font-medium">
                    {furnitureContext
                      ? `Ask about the ${furnitureContext.name}`
                      : "How can I help?"}
                  </p>
                  <p className="text-xs text-white/30 mt-1 max-w-[220px]">
                    {furnitureContext
                      ? "I can help with sizing, pricing, materials, and recommendations."
                      : "Ask about furniture, pricing, materials, or your orders."}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full mt-2">
                  {(furnitureContext
                    ? [
                        `Will the ${furnitureContext.name} fit in my 4x4m room?`,
                        `Is ₱${furnitureContext.price?.toLocaleString()} a fair price?`,
                        `What finish would you recommend for this?`,
                        `How do I maintain this piece?`,
                      ]
                    : SUGGESTED_QUESTIONS
                  ).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestion(q)}
                      className="text-left text-xs text-white/40 border border-[#2A1F14] rounded-xl px-3 py-2 hover:border-[#3A2F20] hover:text-white/60 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-[#D4A97A]/15 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <span className="text-[#D4A97A] text-[9px]">✦</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#D4A97A]/15 text-white/80 rounded-tr-sm"
                      : "bg-[#1A1208] text-white/70 rounded-tl-sm border border-[#2A1F14]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="h-6 w-6 rounded-full bg-[#D4A97A]/15 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <span className="text-[#D4A97A] text-[9px]">✦</span>
                </div>
                <div className="bg-[#1A1208] border border-[#2A1F14] rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#D4A97A]/40 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#D4A97A]/40 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#D4A97A]/40 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#2A1F14] px-3 py-3 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about furniture..."
                rows={1}
                className="flex-1 resize-none bg-[#1A1208] border border-[#2A1F14] rounded-xl px-3 py-2.5 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#3A2F20] transition-colors"
                style={{ maxHeight: "80px", overflowY: "auto" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#D4A97A] text-[#0B0704] disabled:opacity-30 hover:bg-[#C4956A] transition-all active:scale-95"
                aria-label="Send message"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 14L14 8L2 2v4.5l8 1.5-8 1.5V14z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}