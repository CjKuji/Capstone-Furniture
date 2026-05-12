"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

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
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /**
   * =========================================================
   * FIX: PASS readerType (IMPORTANT)
   * =========================================================
   */
  const { messages, isLoading, send } = useChat({
    orderId: order?.id ?? "",
    readerType: senderType, // ✅ FIXED
  });

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    if (!open) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, open]);

  /* ================= ESC CLOSE ================= */
  useEffect(() => {
    if (!viewerImage) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerImage(null);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewerImage]);

  /* ================= SEND ================= */
  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;

    const text = message.trim();
    const selectedFiles = files;

    setMessage("");
    setFiles([]);

    try {
      await send({
        message: text || undefined,
        file: selectedFiles[0] ?? undefined,
        senderType,
      });
    } catch (err) {
      console.error(err);
      setMessage(text);
      setFiles(selectedFiles);
    }
  };

  if (!open || !order?.id) return null;

  return createPortal(
    <>
      {/* MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-[#FAF7F2] border border-[#E8D9CC]">

          {/* HEADER */}
          <div className="px-5 py-4 flex justify-between bg-white border-b border-[#E8D9CC]">
            <div>
              <h2 className="text-sm font-semibold text-[#2B1D16]">
                Order Conversation
              </h2>
              <p className="text-xs text-[#8C593F]">
                #{order.order_reference_code}
              </p>
            </div>

            <button onClick={onClose}>✕</button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              currentUserId={currentUserId}
            />

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="border-t bg-white px-4 py-3 space-y-3">

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
          </div>
        </div>
      </div>

      {/* IMAGE VIEWER */}
      {viewerImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setViewerImage(null)}
        >
          <div className="relative w-full max-w-4xl h-[80vh]">
            <Image
              src={viewerImage}
              alt="Chat image"
              fill
              className="object-contain rounded-xl"
              priority
            />
          </div>
        </div>
      )}
    </>,
    document.body
  );
}