"use client";

import { useMemo } from "react";
import { getDateLabel } from "@/utils/chatDate";

import ChatMessageBubble from "./ChatMessageBubble";
import type { Message } from "@/types/chat";

type Props = {
  messages: Message[];
  isLoading: boolean;
  currentUserId?: string;
  senderType?: "customer" | "admin";
};

export default function ChatMessages({
  messages,
  isLoading,
  currentUserId,
  senderType = "customer",
}: Props) {
  const rendered = useMemo(() => {
    if (!messages?.length) return [];

    return messages.map((msg, index, arr) => {
      const prev = arr[index - 1];
      const next = arr[index + 1];

      const isMine = currentUserId
        ? msg.sender_id === currentUserId
        : msg.sender_type === senderType;

      const currentDate = getDateLabel(msg.created_at);
      const prevDate = prev ? getDateLabel(prev.created_at) : null;

      const showDateSeparator = currentDate !== prevDate;

      const prevSameSender =
        prev &&
        prev.sender_id === msg.sender_id &&
        getDateLabel(prev.created_at) === currentDate;

      const nextSameSender =
        next &&
        next.sender_id === msg.sender_id &&
        getDateLabel(next.created_at) === currentDate;

      const senderName = isMine
        ? "You"
        : msg.sender_type === "admin"
          ? "Admin"
          : "Customer";

      return {
        msg,
        isMine,
        senderName,
        senderRole: msg.sender_type,
        showDateSeparator,
        dateLabel: currentDate,
        showSenderName: !prevSameSender,
        isGroupedTop: !!prevSameSender,
        isGroupedBottom: !!nextSameSender,
      };
    });
  }, [messages, currentUserId, senderType]);

  /* ── LOADING ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-[#D4A97A]/30 border-t-[#D4A97A] animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/25 animate-pulse">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

  /* ── EMPTY ── */
  if (!messages.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#2A1F14] bg-[#160F08]">
            <span className="text-[#7A5C3A] text-lg">✦</span>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/30">
            No messages yet
          </p>
          <p className="text-[10px] text-white/20">
            Start the conversation below
          </p>
        </div>
      </div>
    );
  }

  /* ── LIST ── */
  return (
    <div className="flex flex-col gap-1">
      {rendered.map((item) => (
        <div key={item.msg.id}>
          {/* DATE CHIP */}
          {item.showDateSeparator && (
            <div className="flex items-center gap-3 py-4">
              <div className="h-px flex-1 bg-[#2A1F14]" />
              <div className="rounded-full border border-[#2A1F14] bg-[#0B0704] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#7A5C3A]">
                {item.dateLabel}
              </div>
              <div className="h-px flex-1 bg-[#2A1F14]" />
            </div>
          )}

          {/* BUBBLE */}
          <ChatMessageBubble
            msg={item.msg}
            isMine={item.isMine}
            senderName={item.senderName}
            senderRole={item.senderRole}
            showSenderName={item.showSenderName}
            isGroupedTop={item.isGroupedTop}
            isGroupedBottom={item.isGroupedBottom}
          />
        </div>
      ))}
    </div>
  );
}