"use client";

import { Image as ImageIcon, X } from "lucide-react";

type Props = {
  files: File[] | null;
  onRemove: (index: number) => void;
};

export default function ChatImagePreview({ files, onRemove }: Props) {
  if (!files || files.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* HEADER */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4A97A]/15 text-[#D4A97A]">
          <ImageIcon size={11} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">
          Attached Images
        </p>
        <span className="text-[10px] text-white/20">({files.length})</span>
      </div>

      {/* STRIP */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#2A1F14]">
        {files.map((file, index) => {
          const previewUrl = URL.createObjectURL(file);
          return (
            <div
              key={`${file.name}-${index}`}
              className="
                group relative h-[80px] min-w-[80px] flex-shrink-0
                overflow-hidden rounded-xl
                border border-[#2A1F14] bg-[#0B0704]
                transition-all hover:border-[#D4A97A]/30
              "
            >
              <img
                src={previewUrl}
                alt={`Preview ${index}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                onLoad={() => URL.revokeObjectURL(previewUrl)}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />

              {/* File name */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1">
                <p className="truncate text-[9px] text-white/70">{file.name}</p>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="
                  absolute right-1 top-1
                  flex h-5 w-5 items-center justify-center
                  rounded-full bg-black/70 text-white/80
                  backdrop-blur-sm
                  hover:bg-black/90 hover:text-white
                  transition-all
                "
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}