"use client";

type Props = {
  files: File[] | null;
  onRemove: (index: number) => void;
};

export default function ChatImagePreview({ files, onRemove }: Props) {
  if (!files || files.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {files.map((file, index) => {
        const previewUrl = URL.createObjectURL(file);

        return (
          <div
            key={index}
            className="
              relative
              min-w-[80px] max-w-[80px]
              h-[80px]
              rounded-xl
              overflow-hidden
              border border-[#E8D9CC]
              bg-[#FAF7F2]
              flex-shrink-0
            "
          >
            {/* IMAGE */}
            <img
              src={previewUrl}
              alt="preview"
              className="w-full h-full object-cover"
              onLoad={() => URL.revokeObjectURL(previewUrl)} // cleanup
            />

            {/* REMOVE BUTTON */}
            <button
              onClick={() => onRemove(index)}
              className="
                absolute top-1 right-1
                w-5 h-5
                rounded-full
                bg-black/60 text-white
                text-[10px]
                flex items-center justify-center
              "
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}