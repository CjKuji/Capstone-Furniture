"use client";

import {
  ImagePlus,
  SendHorizonal,
} from "lucide-react";

type Props = {
  message: string;

  setMessage: (
    value: string
  ) => void;

  files: File[];

  setFiles: (
    files: File[]
  ) => void;

  onSend: () => void;
};

export default function ChatInput({
  message,
  setMessage,
  files,
  setFiles,
  onSend,
}: Props) {
  /**
   * =========================================================
   * ENTER SEND
   * =========================================================
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      onSend();
    }
  };

  /**
   * =========================================================
   * FILE PICKER
   * =========================================================
   */
  const handleFiles = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = Array.from(
      e.target.files || []
    );

    setFiles([
      ...files,
      ...selected,
    ]);

    /**
     * IMPORTANT:
     * reset input so same file can re-upload
     */
    e.target.value = "";
  };

  /**
   * =========================================================
   * DISABLED STATE
   * =========================================================
   */
  const isDisabled =
    !message.trim() &&
    files.length === 0;

  return (
    <div className="rounded-3xl border border-[#E8D9CC] bg-white p-3 shadow-sm">
      <div className="flex items-end gap-3">
        {/* =================================================
            FILE BUTTON
        ================================================= */}
        <div className="flex-shrink-0">
          <label
            htmlFor="chat-file"
            className="
              flex
              h-11
              w-11
              cursor-pointer
              items-center
              justify-center
              rounded-2xl
              border
              border-[#E8D9CC]
              bg-[#FAF7F2]
              text-[#8C593F]
              transition
              hover:bg-[#F3E8DC]
            "
          >
            <ImagePlus
              size={18}
            />
          </label>

          <input
            id="chat-file"
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={
              handleFiles
            }
          />
        </div>

        {/* =================================================
            TEXTAREA
        ================================================= */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            rows={1}
            placeholder="Write a message..."
            className="
              min-h-[44px]
              max-h-36
              w-full
              resize-none
              border-0
              bg-transparent
              px-1
              py-2
              text-[14px]
              text-[#2B1D16]
              outline-none
              placeholder:text-[#A28B78]
            "
          />
        </div>

        {/* =================================================
            SEND BUTTON
        ================================================= */}
        <button
          type="button"
          onClick={onSend}
          disabled={isDisabled}
          className={`
            flex
            h-11
            min-w-[48px]
            items-center
            justify-center
            rounded-2xl
            px-4
            transition-all

            ${
              isDisabled
                ? `
                  cursor-not-allowed
                  bg-[#EADFD3]
                  text-[#B59E8A]
                `
                : `
                  bg-[#8C593F]
                  text-white
                  shadow-sm
                  hover:bg-[#77482E]
                `
            }
          `}
        >
          <SendHorizonal
            size={17}
          />
        </button>
      </div>

      {/* ===================================================
          FOOTER HINT
      =================================================== */}
      <div className="mt-2 px-1">
        <p className="text-[11px] text-[#9A8472]">
          Press Enter to send •
          Shift + Enter for new
          line
        </p>
      </div>
    </div>
  );
}