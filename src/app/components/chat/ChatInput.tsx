"use client";

import { ImagePlus, SendHorizonal } from "lucide-react";

type Props = {
  message: string;
  setMessage: (value: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  onSend: () => void;
};

export default function ChatInput({
  message,
  setMessage,
  files,
  setFiles,
  onSend,
}: Props) {
  /* ── ENTER SEND ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  /* ── FILE PICKER ── */
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles([...files, ...selected]);
    e.target.value = "";
  };

  const isDisabled = !message.trim() && files.length === 0;

  return (
    <div className="rounded-2xl border border-[#2A1F14] bg-[#0B0704] p-2.5">
      <div className="flex items-end gap-2">
        {/* FILE BUTTON */}
        <div className="flex-shrink-0">
          <label
            htmlFor="chat-file"
            className="
              flex h-10 w-10 cursor-pointer items-center justify-center
              rounded-xl border border-[#2A1F14] bg-white/[0.03]
              text-white/35
              hover:bg-white/[0.07] hover:text-[#D4A97A]
              transition-all
            "
          >
            <ImagePlus size={16} />
          </label>
          <input
            id="chat-file"
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={handleFiles}
          />
        </div>

        {/* TEXTAREA */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Write a message…"
            className="
              min-h-[40px] max-h-32 w-full
              resize-none border-0 bg-transparent
              px-1 py-2
              text-[13px] text-white/80
              outline-none
              placeholder:text-white/20
            "
          />
        </div>

        {/* SEND BUTTON */}
        <button
          type="button"
          onClick={onSend}
          disabled={isDisabled}
          className={`
            flex h-10 min-w-[44px] items-center justify-center
            rounded-xl px-3.5
            transition-all duration-200
            ${isDisabled
              ? "cursor-not-allowed bg-white/[0.03] text-white/15"
              : "bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E8C98A] text-[#0E0A06] shadow-[0_2px_8px_rgba(212,169,122,0.25)] hover:brightness-105 hover:shadow-[0_4px_16px_rgba(212,169,122,0.35)]"
            }
          `}
        >
          <SendHorizonal size={15} />
        </button>
      </div>

      {/* HINT */}
      <div className="mt-1.5 px-1">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/15">
          Enter to send · Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}