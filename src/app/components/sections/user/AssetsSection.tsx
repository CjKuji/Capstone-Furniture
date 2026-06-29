"use client";

import type { ImageUI } from "@/types/furniture-ui";
import { Maximize2 } from "lucide-react";

type Props = {
  state: { images: ImageUI[] };
  onImageClick?: (images: { url: string; id?: string }[], startIndex: number) => void;
};

export default function AssetsSection({ state, onImageClick }: Props) {
  const images = state.images?.filter((i) => !i.isDeleted) ?? [];

  if (images.length === 0) return null;

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          Gallery
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <button
            key={img.id ?? img.clientId}
            onClick={(e) => {
              e.stopPropagation();
              onImageClick?.(images.map(i => ({ url: i.url, id: i.id })), idx);
            }}
            className="relative group aspect-square rounded-xl overflow-hidden text-left"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: img.isPrimary
                ? "1.5px solid rgba(212,169,122,0.4)"
                : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* PRIMARY BADGE */}
            {img.isPrimary && (
              <div
                className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold"
                style={{
                  background: "rgba(212,169,122,0.2)",
                  border: "1px solid rgba(212,169,122,0.35)",
                  color: "#D4A97A",
                }}
              >
                Main
              </div>
            )}

            {/* HOVER OVERLAY */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "rgba(212,169,122,0.06)" }}
            />
            
            {/* CLICK INDICATOR */}
            {onImageClick && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                  <Maximize2 className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

    </div>
  );
}