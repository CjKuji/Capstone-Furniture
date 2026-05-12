"use client";

import {
  Image as ImageIcon,
  X,
} from "lucide-react";

type Props = {
  files: File[] | null;

  onRemove: (
    index: number
  ) => void;
};

export default function ChatImagePreview({
  files,
  onRemove,
}: Props) {
  /**
   * =========================================================
   * EMPTY
   * =========================================================
   */
  if (
    !files ||
    files.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E8DC] text-[#8C593F]">
          <ImageIcon
            size={13}
          />
        </div>

        <p className="text-[12px] font-medium text-[#6B584B]">
          Attached Images
        </p>

        <span className="text-[11px] text-[#A28B78]">
          ({files.length})
        </span>
      </div>

      {/* =====================================================
          PREVIEW STRIP
      ===================================================== */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#E8D9CC]">
        {files.map(
          (file, index) => {
            const previewUrl =
              URL.createObjectURL(
                file
              );

            return (
              <div
                key={`${file.name}-${index}`}
                className="
                  group
                  relative
                  h-[92px]
                  min-w-[92px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-[#E8D9CC]
                  bg-white
                  shadow-sm
                  transition-all
                  hover:shadow-md
                "
              >
                {/* =========================================
                    IMAGE
                ========================================= */}
                <img
                  src={previewUrl}
                  alt={`Preview ${index}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  onLoad={() =>
                    URL.revokeObjectURL(
                      previewUrl
                    )
                  }
                />

                {/* =========================================
                    OVERLAY
                ========================================= */}
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />

                {/* =========================================
                    FILE NAME
                ========================================= */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                  <p className="truncate text-[10px] text-white">
                    {file.name}
                  </p>
                </div>

                {/* =========================================
                    REMOVE BUTTON
                ========================================= */}
                <button
                  type="button"
                  onClick={() =>
                    onRemove(index)
                  }
                  className="
                    absolute
                    right-1.5
                    top-1.5
                    flex
                    h-6
                    w-6
                    items-center
                    justify-center
                    rounded-full
                    bg-black/65
                    text-white
                    backdrop-blur-sm
                    transition
                    hover:bg-black/80
                  "
                >
                  <X size={12} />
                </button>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}