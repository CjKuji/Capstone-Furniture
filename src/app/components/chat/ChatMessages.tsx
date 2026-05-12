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
  /**
   * =========================================================
   * PREPARE RENDER STRUCTURE
   * =========================================================
   */
  const rendered = useMemo(() => {
    if (!messages?.length) return [];

    return messages.map((msg, index, arr) => {
      const prev = arr[index - 1];
      const next = arr[index + 1];

      /**
       * =====================================================
       * CLEAN OWNERSHIP LOGIC (ONLY ADMIN / CUSTOMER)
       * =====================================================
       */
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
        senderRole: msg.sender_type, // only admin/customer
        showDateSeparator,
        dateLabel: currentDate,
        showSenderName: !prevSameSender,
        isGroupedTop: !!prevSameSender,
        isGroupedBottom: !!nextSameSender,
      };
    });
  }, [messages, currentUserId, senderType]);

  /**
   * =========================================================
   * LOADING STATE
   * =========================================================
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-sm text-[#8C593F] animate-pulse">
          Loading conversation...
        </p>
      </div>
    );
  }

  /**
   * =========================================================
   * EMPTY STATE
   * =========================================================
   */
  if (!messages.length) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-center space-y-1">
          <p className="text-sm text-[#8C593F]">
            No messages yet
          </p>
          <p className="text-xs text-[#B08A74]">
            Start the conversation below
          </p>
        </div>
      </div>
    );
  }

  /**
   * =========================================================
   * CHAT LIST UI
   * =========================================================
   */
  return (
    <div className="flex flex-col gap-3">
      {rendered.map((item) => (
        <div key={item.msg.id} className="space-y-2">

          {/* DATE CHIP */}
          {item.showDateSeparator && (
            <div className="flex justify-center py-2">
              <div className="text-[11px] px-3 py-1 rounded-full bg-white/70 border border-[#E8D9CC] text-[#8C593F] shadow-sm backdrop-blur">
                {item.dateLabel}
              </div>
            </div>
          )}

          {/* MESSAGE */}
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