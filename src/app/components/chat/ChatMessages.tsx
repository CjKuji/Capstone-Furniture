"use client";

import { useMemo } from "react";
import { getDateLabel } from "@/utils/chatDate";

import ChatMessageBubble from "./ChatMessageBubble";
import type { Message } from "@/types/chat";

type Props = {
  messages: Message[];
  isLoading: boolean;
  currentUserId?: string;
};

export default function ChatMessages({
  messages,
  isLoading,
  currentUserId,
}: Props) {
  /**
   * =========================================================
   * MEMOIZED RENDER DATA
   * =========================================================
   */
  const rendered = useMemo(() => {
    if (!messages?.length) return [];

    return messages.map((msg, index, arr) => {
      const prev = arr[index - 1];
      const next = arr[index + 1];

      const isMine = msg.sender_id === currentUserId;
      const isSystem = msg.sender_type === "system";

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

      const senderName = isSystem
        ? "System"
        : isMine
          ? "You"
          : msg.sender?.name ||
            (msg.sender_type === "admin" ? "Admin" : "Customer");

      const senderRole = isSystem ? "system" : msg.sender_type;

      return {
        msg,
        isMine,
        isSystem,
        senderName,
        senderRole,
        showDateSeparator,
        dateLabel: currentDate,
        showSenderName: !prevSameSender,
        isGroupedTop: !!prevSameSender,
        isGroupedBottom: !!nextSameSender,
      };
    });
  }, [messages, currentUserId]);

  /**
   * =========================================================
   * LOADING STATE
   * =========================================================
   */
  if (isLoading) {
    return (
      <p className="text-sm text-[#8C593F] text-center mt-10">
        Loading conversation...
      </p>
    );
  }

  /**
   * =========================================================
   * EMPTY STATE
   * =========================================================
   */
  if (!messages.length) {
    return (
      <p className="text-sm text-[#8C593F] text-center mt-10">
        No messages yet — start the conversation
      </p>
    );
  }

  /**
   * =========================================================
   * UI
   * =========================================================
   */
  return (
    <div className="space-y-2">
      {rendered.map((item) => (
        <div key={item.msg.id}>
          {/* DATE SEPARATOR */}
          {item.showDateSeparator && (
            <div className="flex justify-center my-4">
              <div className="text-[11px] px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8D9CC] text-[#8C593F] shadow-sm">
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