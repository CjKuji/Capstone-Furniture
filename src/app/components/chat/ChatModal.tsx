"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useChat } from "@/hooks/useChat";
import type { Order } from "@/types/order";

import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatImagePreview from "./ChatImagePreview";

type Props = {
  open: boolean;
  onClose: () => void;
  order: Order;
  currentUserId?: string;
  senderType?: "customer" | "admin";
};

export default function ChatModal({
  open,
  onClose,
  order,
  currentUserId,
  senderType = "customer",
}: Props) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { messages, isLoading, send, markAsRead } = useChat({
    orderId: order?.id ?? "",
    readerType: senderType,
  });

  /**
   * ── MARK AS READ ──
   * Triggers once when modal opens.
   */
  useEffect(() => {
    if (open) {
      markAsRead();
    }
  }, [open, markAsRead]);

  /**
   * ── AUTO SCROLL (MESSENGER STYLE) ──
   * Scrolls to bottom whenever the messages array changes (new message sent or received).
   */
  useEffect(() => {
    if (!open) return;

    // Use requestAnimationFrame to ensure the DOM has finished painting the new message
    const scrollTimeout = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    return () => clearTimeout(scrollTimeout);
  }, [messages, open]); // Watching 'messages' captures content changes, not just length

  /**
   * ── ESCAPE KEY TO CLOSE ──
   */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /**
   * ── HANDLE SEND ──
   */
  const handleSend = async () => {
    const text = message.trim();
    const selectedFiles = files;

    if (!text && selectedFiles.length === 0) return;

    // 1. CLEAR UI IMMEDIATELY (Instant Feedback)
    setMessage("");
    setFiles([]);

    try {
      // 2. SEND IN BACKGROUND
      // The useChat hook handles the optimistic local update
      await send({
        message: text || undefined,
        file: selectedFiles[0] ?? null,
        senderType,
      });
    } catch (err) {
      console.error("[CHAT_MODAL] Send failed:", err);
      // Rollback UI text if the send failed completely
      setMessage(text);
      setFiles(selectedFiles);
    }
  };

  if (!open || !order?.id) return null;

  return createPortal(
    /* BACKDROP */
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      
      {/* MODAL CONTAINER */}
      <div className="
        w-full max-w-3xl h-[88vh] flex flex-col
        rounded-3xl overflow-hidden
        bg-[#0B0704]
        border border-[#2A1F14]
        shadow-[0_32px_80px_rgba(0,0,0,0.8)]
      ">

        {/* ── HEADER ── */}
        <header className="
          flex items-center justify-between
          px-5 py-4
          bg-[#0E0B06]/80 backdrop-blur
          border-b border-[#2A1F14]
          flex-shrink-0
        ">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/25">
                Order Chat
              </p>
              <span className="text-[#2A1F14]">·</span>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#D4A97A]/60">
                #{order.order_reference_code}
              </p>
            </div>
            <h2 className="text-sm font-semibold text-white/80">
              Support Conversation
            </h2>
          </div>

          <button
            onClick={onClose}
            className="
              flex h-8 w-8 items-center justify-center
              rounded-full border border-[#2A1F14] bg-white/[0.03]
              text-white/35 text-xs
              hover:bg-white/[0.07] hover:text-white/60 hover:border-[#D4A97A]/20
              transition-all
            "
          >
            ✕
          </button>
        </header>

        {/* ── MESSAGES SCROLL AREA ── */}
        <main 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-5 min-h-0 scrollbar-thin scrollbar-thumb-[#2A1F14] scrollbar-track-transparent"
        >
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            currentUserId={currentUserId}
            senderType={senderType}
          />
          {/* Scroll Anchor */}
          <div ref={bottomRef} className="h-px w-full" />
        </main>

        {/* ── INPUT CONSOLE ── */}
        <footer className="
          border-t border-[#2A1F14]
          bg-[#0E0B06]/60
          px-4 py-3 space-y-3
          flex-shrink-0
        ">
          <ChatImagePreview
            files={files}
            onRemove={(index) =>
              setFiles((prev) => prev.filter((_, i) => i !== index))
            }
          />
          <ChatInput
            message={message}
            setMessage={setMessage}
            files={files}
            setFiles={setFiles}
            onSend={handleSend}
          />
        </footer>
      </div>
    </div>,
    document.body
  );
}