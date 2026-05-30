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
   * FIXED: CONTINUOUS MARK AS READ
   * Triggers when modal opens AND whenever new messages arrive while open.
   */
  useEffect(() => {
    if (open && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only mark as read if the last message came from the OTHER person
      if (lastMessage.sender_id !== currentUserId) {
        markAsRead();
      }
    } else if (open) {
      // Still trigger on open even if messages are empty (initial sync)
      markAsRead();
    }
  }, [open, messages, markAsRead, currentUserId]);

  /** ── AUTO SCROLL ── */
  useEffect(() => {
    if (!open) return;
    const scrollTimeout = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(scrollTimeout);
  }, [messages, open]);

  /** ── ESCAPE KEY ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSend = async () => {
    const text = message.trim();
    const selectedFiles = files;
    if (!text && selectedFiles.length === 0) return;

    setMessage("");
    setFiles([]);

    try {
      await send({
        message: text || undefined,
        file: selectedFiles[0] ?? null,
        senderType,
      });
    } catch (err) {
      setMessage(text);
      setFiles(selectedFiles);
    }
  };

  if (!open || !order?.id) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[88vh] flex flex-col rounded-3xl overflow-hidden bg-[#0B0704] border border-[#2A1F14] shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
        
        <header className="flex items-center justify-between px-5 py-4 bg-[#0E0B06]/80 backdrop-blur border-b border-[#2A1F14] flex-shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/25">Order Chat</p>
              <span className="text-[#2A1F14]">·</span>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#D4A97A]/60">#{order.order_reference_code}</p>
            </div>
            <h2 className="text-sm font-semibold text-white/80">Support Conversation</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2A1F14] bg-white/[0.03] text-white/35 text-xs hover:bg-white/[0.07] transition-all">✕</button>
        </header>

        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin scrollbar-thumb-[#2A1F14] scrollbar-track-transparent">
          <ChatMessages messages={messages} isLoading={isLoading} currentUserId={currentUserId} senderType={senderType} />
          <div ref={bottomRef} className="h-px w-full" />
        </main>

        <footer className="border-t border-[#2A1F14] bg-[#0E0B06]/60 px-4 py-3 space-y-3 flex-shrink-0">
          <ChatImagePreview files={files} onRemove={(idx) => setFiles(prev => prev.filter((_, i) => i !== idx))} />
          <ChatInput message={message} setMessage={setMessage} files={files} setFiles={setFiles} onSend={handleSend} />
        </footer>
      </div>
    </div>,
    document.body
  );
}