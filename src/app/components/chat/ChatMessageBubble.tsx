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
  /**
   * =========================================================
   * TYPES
   * =========================================================
   */
  const isSystem =
    msg.sender_type === "system";

  const isAdmin =
    msg.sender_type === "admin";

  /**
   * =========================================================
   * SYSTEM MESSAGE
   * =========================================================
   */
  if (isSystem) {
    return (
      <div className="my-6 flex justify-center">
        <div className="rounded-full border border-[#E8D9CC] bg-[#F7F1E8] px-4 py-2 text-[11px] text-[#8C593F] shadow-sm">
          {msg.message}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        flex
        w-full
        ${isMine ? "justify-end" : "justify-start"}
        ${isGroupedTop ? "mt-1.5" : "mt-5"}
      `}
    >
      {/* =====================================================
          MESSAGE WRAPPER
      ===================================================== */}
      <div
        className={`
          flex
          flex-col
          max-w-[82%]
          sm:max-w-[75%]
          ${isMine ? "items-end" : "items-start"}
        `}
      >
        {/* =====================================================
            SENDER INFO
        ===================================================== */}
        {showSenderName &&
          !isMine && (
            <div className="mb-1 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-[#2B1D16]">
                  {senderName}
                </span>

                <span
                  className={`
                    rounded-full px-2 py-[2px]
                    text-[9px] font-semibold uppercase tracking-wide
                    ${
                      isAdmin
                        ? "bg-[#8C593F]/10 text-[#8C593F]"
                        : "bg-[#EEE7DE] text-[#6B584B]"
                    }
                  `}
                >
                  {senderRole}
                </span>
              </div>
            </div>
          )}

        {/* =====================================================
            MESSAGE BUBBLE
        ===================================================== */}
        <div
          className={`
            relative
            overflow-hidden
            border
            px-4
            py-3
            shadow-sm
            transition-all

            ${
              isMine
                ? `
                  bg-[#8C593F]
                  border-[#8C593F]
                  text-white
                `
                : `
                  bg-white
                  border-[#E8D9CC]
                  text-[#2B1D16]
                `
            }

            ${
              isGroupedTop
                ? isMine
                  ? "rounded-[22px] rounded-tr-md"
                  : "rounded-[22px] rounded-tl-md"
                : "rounded-[22px]"
            }

            ${
              isGroupedBottom
                ? isMine
                  ? "rounded-br-lg"
                  : "rounded-bl-lg"
                : ""
            }
          `}
        >
          {/* =================================================
              MESSAGE TEXT
          ================================================= */}
          {msg.message && (
            <p
              className={`
                whitespace-pre-wrap
                break-words
                text-[14px]
                leading-relaxed
                ${
                  isMine
                    ? "text-white"
                    : "text-[#2B1D16]"
                }
              `}
            >
              {msg.message}
            </p>
          )}

          {/* =================================================
              IMAGE
          ================================================= */}
          {msg.image_url && (
            <div
              className={
                msg.message
                  ? "mt-3"
                  : ""
              }
            >
              <ChatImageMessage
                imageUrl={msg.image_url}
              />
            </div>
          )}

          {/* =================================================
              TIME
          ================================================= */}
          {!isGroupedBottom && (
            <div
              className={`
                mt-2
                flex
                items-center
                gap-1
                text-[10px]

                ${
                  isMine
                    ? "justify-end text-white/70"
                    : "justify-start text-[#8C593F]/60"
                }
              `}
            >
              <span>
                {formatPHTime(
                  msg.created_at
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}