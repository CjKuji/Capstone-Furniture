"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";

import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatImagePreview from "./ChatImagePreview";

// Base parameters required by both structural types
type BaseProps = {
  open: boolean;
  onClose: () => void;
  currentUserId?: string;
  senderType?: "customer" | "admin";
};

// Discriminated Union types allowing both legacy code and new code to pass verification
type LegacyOrderProps = BaseProps & {
  order: any;
  context?: never;
};

type NewPolymorphicProps = BaseProps & {
  context: {
    type: "order" | "inquiry";
    data: any;
  };
  order?: never;
};

type Props = LegacyOrderProps | NewPolymorphicProps;

export default function ChatModal({
  open,
  onClose,
  order,
  context,
  currentUserId,
  senderType = "customer",
}: Props) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);

  /* ─────────────────────────────────────────────────────────
      POLYMORPHIC CONTEXT RESOLUTION ENGINE
  ───────────────────────────────────────────────────────── */
  const { isOrder, entityData } = useMemo(() => {
    if (context) {
      return {
        isOrder: context.type === "order",
        entityData: context.data,
      };
    }
    const inferIsOrder = !!(order?.order_reference_code || order?.status);
    return {
      isOrder: inferIsOrder,
      entityData: order,
    };
  }, [context, order]);

  const orderId = isOrder ? entityData?.id : null;
  const inquiryId = !isOrder ? entityData?.id : null;

  const {
    conversation,
    messages,
    isLoading,
    isFetchingOlder,
    hasOlderMessages,
    loadOlderMessages,
    send,
    markAsRead,
    conversationId,
  } = useChat({
    orderId,
    inquiryId,
    readerType: senderType,
  });

  /* ── MARK AS READ: Bulletproof, Dynamic Realtime Invalidation ── */
  useEffect(() => {
    // Halt execution if modal is shut or conversation references aren't ready
    if (!open || !conversationId || !conversation) return;

    // Direct data resolution from current cache snapshot state
    const currentUnreadCount = senderType === "customer"
      ? conversation.customer_unread_count
      : conversation.admin_unread_count;

    // Trigger update if there are outstanding messages to clear
    if (typeof currentUnreadCount === "number" && currentUnreadCount > 0) {
      markAsRead();
    }
  }, [open, conversationId, conversation, senderType, markAsRead]);

  /* ── AUTO-SCROLL LOGIC ── */
  useEffect(() => {
    if (!open) return;
    if (!isNearBottomRef.current) return;
    const t = setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      60
    );
    return () => clearTimeout(t);
  }, [messages, open]);

  useEffect(() => {
    if (!open || isLoading) return;
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [open, isLoading]);

  const prevMessageCountRef = useRef(messages.length);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (messages.length > prevMessageCountRef.current) {
      const newScrollHeight = container.scrollHeight;
      const delta = newScrollHeight - prevScrollHeightRef.current;
      if (delta > 0 && !isNearBottomRef.current) {
        container.scrollTop += delta;
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 120;

    if (container.scrollTop < 80 && hasOlderMessages && !isFetchingOlder) {
      prevScrollHeightRef.current = container.scrollHeight;
      loadOlderMessages();
    }
  }, [hasOlderMessages, isFetchingOlder, loadOlderMessages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !open) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [open, handleScroll]);

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
    const selectedFiles = [...files];
    if (!text && selectedFiles.length === 0) return;

    setMessage("");
    setFiles([]);
    isNearBottomRef.current = true;

    try {
      if (text) {
        await send({ message: text, file: null, senderType });
      }
      for (const file of selectedFiles) {
        await send({ message: undefined, file, senderType });
      }
    } catch {
      setMessage(text);
      setFiles(selectedFiles);
    }
  };

  if (!open || !entityData?.id) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[88vh] flex flex-col rounded-3xl overflow-hidden bg-[#0B0704] border border-[#2A1F14] shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
        <header className="flex items-center justify-between px-5 py-4 bg-[#0E0B06]/80 backdrop-blur border-b border-[#2A1F14] flex-shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/25">
                {isOrder ? "Order Chat" : "Inquiry Chat"}
              </p>
              <span className="text-[#2A1F14]">·</span>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#D4A97A]/60">
                {isOrder 
                  ? `#${entityData.order_reference_code || entityData.id.slice(0, 8)}` 
                  : `#${entityData.id.slice(0, 8)}`}
              </p>
            </div>
            <h2 className="text-sm font-semibold text-white/80">Support Conversation</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2A1F14] bg-white/[0.03] text-white/35 text-xs hover:bg-white/[0.07] transition-all">✕</button>
        </header>

        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin scrollbar-thumb-[#2A1F14] scrollbar-track-transparent">
          {isFetchingOlder && <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 text-[#D4A97A]/40 animate-spin" /></div>}
          {hasOlderMessages && !isFetchingOlder && (
            <div className="flex justify-center py-2 mb-2">
              <button 
                onClick={() => { 
                  prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight ?? 0; 
                  loadOlderMessages(); 
                }} 
                className="text-[10px] font-semibold uppercase tracking-widest text-[#D4A97A]/50 hover:text-[#D4A97A] transition px-4 py-1.5 rounded-full border border-[#2A1F14] hover:border-[#D4A97A]/30"
              >
                Load earlier messages
              </button>
            </div>
          )}
          <ChatMessages messages={messages} isLoading={isLoading} currentUserId={currentUserId} senderType={senderType} />
          <div ref={bottomRef} className="h-px w-full" />
        </main>

        <footer className="border-t border-[#2A1F14] bg-[#0E0B06]/60 px-4 py-3 space-y-3 flex-shrink-0">
          <ChatImagePreview files={files} onRemove={(idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))} />
          <ChatInput message={message} setMessage={setMessage} files={files} setFiles={setFiles} onSend={handleSend} />
        </footer>
      </div>
    </div>,
    document.body
  );
}