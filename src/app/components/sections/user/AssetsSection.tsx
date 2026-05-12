"use client";

import type { ImageUI } from "@/types/furniture-ui";

type Props = {
  state: { images: ImageUI[] };
};

export default function AssetsSection({ state }: Props) {
  const images = state.images?.filter((i) => !i.isDeleted) ?? [];

  return (
    <div className="space-y-6">

      {/* TITLE */}
      <div>
        <h3 className="text-sm font-semibold text-[#3A2B22]">
          Images
        </h3>
        <p className="text-xs text-[#7A6A5A] mt-1">
          Product visual references
        </p>
      </div>

      {images.length === 0 ? (
        <div className="text-sm text-[#9A8A7A]">
          No images available
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">

          {images.map((img) => (
            <div
              key={img.id ?? img.clientId}
              className="relative overflow-hidden rounded-xl bg-white border border-[#E8D7C8]"
            >
              <img
                src={img.url}
                className="h-24 w-full object-cover"
              />

              {img.isPrimary && (
                <div className="absolute top-2 left-2 text-[10px] bg-black/70 text-white px-2 py-1 rounded">
                  Main
                </div>
              )}
            </div>
          ))}

        </div>
      )}
    </div>
  );
}