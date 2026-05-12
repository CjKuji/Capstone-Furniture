"use client";

import ChatImageMessage from "./ChatMessageImages";
import { formatPHTime } from "@/utils/chatDate";
import type { Message } from "@/types/chat";

type Props = {
  msg: Message;
  isMine: boolean;
  senderName: string;
  senderRole: string;
  showSenderName: boolean;
  isGroupedTop: boolean;
  isGroupedBottom: boolean;
};

export default function ChatMessageBubble({
  msg,
  isMine,
  senderName,
  senderRole,
  showSenderName,
  isGroupedTop,
  isGroupedBottom,
}: Props) {
  const isSystem = msg.sender_type === "system";

  return (
    <div
      className={`
        flex
        ${isMine ? "justify-end" : "justify-start"}
        ${isGroupedTop ? "mt-1" : "mt-3"}
      `}
    >
      {/* ================= BUBBLE ================= */}
      <div
        className={`
          max-w-[75%]
          px-4 py-2
          shadow-sm
          border
          transition-all duration-200

          ${
            isSystem
              ? "bg-gray-100 text-gray-500 border-gray-200 italic"
              : isMine
              ? "bg-[#8C593F] text-white border-[#8C593F]"
              : "bg-white text-[#2B1D16] border-[#E8D9CC]"
          }

          ${
            isGroupedTop
              ? isMine
                ? "rounded-2xl rounded-tr-md"
                : "rounded-2xl rounded-tl-md"
              : "rounded-2xl"
          }
        `}
      >
        {/* ================= SYSTEM ================= */}
        {isSystem && (
          <div className="text-center text-[11px] text-gray-500 mb-1">
            System message
          </div>
        )}

        {/* ================= SENDER INFO ================= */}
        {showSenderName && !isMine && !isSystem && (
          <div className="mb-1">
            <div className="text-[11px] font-semibold text-[#2B1D16]">
              {senderName}
            </div>

            <div className="text-[10px] text-[#8C593F]/70 mt-[1px]">
              {senderRole}
            </div>
          </div>
        )}

        {/* ================= TEXT ================= */}
        {msg.message && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.message}
          </p>
        )}

        {/* ================= IMAGE ================= */}
        {msg.image_url && (
          <div className="mt-2 overflow-hidden rounded-xl">
            <ChatImageMessage imageUrl={msg.image_url} />
          </div>
        )}

        {/* ================= TIME ================= */}
        {!isGroupedBottom && !isSystem && (
          <div
            className={`
              mt-2 text-[10px]
              ${isMine ? "text-white/70 text-right" : "text-[#8C593F]/60 text-left"}
            `}
          >
            {formatPHTime(msg.created_at)}
          </div>
        )}
      </div>
    </div>
  );
}