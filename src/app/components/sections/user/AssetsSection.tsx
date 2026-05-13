"use client";

import type { ImageUI } from "@/types/furniture-ui";

type Props = {
  state: { images: ImageUI[] };
};

export default function AssetsSection({ state }: Props) {
  const images = state.images?.filter((i) => !i.isDeleted) ?? [];

  if (images.length === 0) return null;

  return (
    <div className="space-y-4">
      <p className="font-semibold text-[#D4A97A] text-xs uppercase tracking-widest">Gallery</p>

      <div className="gap-2 grid grid-cols-3">
        {images.map((img) => (
          <div
            key={img.id ?? img.clientId}
            className="relative bg-white/[0.03] border border-white/5 rounded-xl aspect-square overflow-hidden"
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            {img.isPrimary && (
              <div className="top-2 left-2 absolute bg-[#D4A97A]/20 px-2 py-0.5 border border-[#D4A97A]/30 rounded-full font-medium text-[#D4A97A] text-[9px]">
                Main
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}