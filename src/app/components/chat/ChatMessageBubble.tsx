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
  const isAdmin = msg.sender_type === "admin";

  /* ── SYSTEM MESSAGE ── */
  if (isSystem) {
    return (
      <div className="my-5 flex justify-center">
        <div className="
          rounded-full border border-[#2A1F14] bg-[#160F08]
          px-4 py-1.5
          text-[10px] font-black uppercase tracking-[0.14em] text-[#7A5C3A]
        ">
          {msg.message}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        flex w-full
        ${isMine ? "justify-end" : "justify-start"}
        ${isGroupedTop ? "mt-1" : "mt-4"}
      `}
    >
      <div
        className={`
          flex flex-col max-w-[80%] sm:max-w-[72%]
          ${isMine ? "items-end" : "items-start"}
        `}
      >
        {/* SENDER LABEL */}
        {showSenderName && !isMine && (
          <div className="mb-1 flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-white/60">{senderName}</span>
            <span className={`
              rounded-full px-2 py-[2px]
              text-[8px] font-black uppercase tracking-[0.12em]
              ${isAdmin
                ? "bg-[#D4A97A]/10 text-[#D4A97A] border border-[#D4A97A]/20"
                : "bg-white/[0.05] text-white/35 border border-white/10"}
            `}>
              {senderRole}
            </span>
          </div>
        )}

        {/* BUBBLE */}
        <div
          className={`
            relative overflow-hidden border px-4 py-3
            shadow-sm transition-all

            ${isMine
              ? "bg-[#C49A6C] border-[#C49A6C] text-[#0E0A06]"
              : "bg-[#160F08] border-[#2A1F14] text-white/80"}

            ${isGroupedTop
              ? isMine
                ? "rounded-[20px] rounded-tr-md"
                : "rounded-[20px] rounded-tl-md"
              : "rounded-[20px]"}

            ${isGroupedBottom
              ? isMine
                ? "rounded-br-md"
                : "rounded-bl-md"
              : ""}
          `}
        >
          {/* TEXT */}
          {msg.message && (
            <p className={`
              whitespace-pre-wrap break-words text-[13px] leading-relaxed
              ${isMine ? "text-[#0E0A06]" : "text-white/75"}
            `}>
              {msg.message}
            </p>
          )}

          {/* IMAGE */}
          {msg.image_url && (
            <div className={msg.message ? "mt-3" : ""}>
              <ChatImageMessage imageUrl={msg.image_url} />
            </div>
          )}

          {/* TIME */}
          {!isGroupedBottom && (
            <div className={`
              mt-1.5 flex items-center gap-1 text-[9px]
              ${isMine ? "justify-end text-[#0E0A06]/50" : "justify-start text-white/25"}
            `}>
              <span>{formatPHTime(msg.created_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}