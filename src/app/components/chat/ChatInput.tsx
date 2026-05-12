"use client";

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
  /**
   * =========================================================
   * ENTER SEND
   * =========================================================
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      console.log("[CHAT INPUT] ENTER SEND");

      onSend();
    }
  };

  /**
   * =========================================================
   * DISABLE STATE
   * =========================================================
   */
  const isDisabled =
    !message.trim() && files.length === 0;

  return (
    <div className="flex items-center gap-2 w-full">

      {/* FILE BUTTON */}
      <label
        htmlFor="chat-file"
        className="
          w-10 h-10
          flex items-center justify-center
          rounded-xl border
          bg-[#FAF7F2]
          cursor-pointer
          shrink-0
        "
      >
        +
      </label>

      {/* FILE INPUT */}
      <input
        type="file"
        multiple
        accept="image/*"
        hidden
        id="chat-file"
        onChange={(e) => {
          const selected = Array.from(
            e.target.files || []
          );

          console.log(
            "[CHAT INPUT] FILES:",
            selected
          );

          setFiles(selected);
        }}
      />

      {/* TEXT INPUT */}
      <input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Write a message..."
        className="
          flex-1
          bg-transparent
          outline-none
          text-sm
        "
      />

      {/* SEND BUTTON */}
      <button
        type="button"
        onClick={() => {
          console.log(
            "[CHAT INPUT] BUTTON SEND"
          );

          onSend();
        }}
        disabled={isDisabled}
        className="
          px-4 py-2
          rounded-xl
          bg-[#8C593F]
          text-white
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      >
        Send
      </button>
    </div>
  );
}