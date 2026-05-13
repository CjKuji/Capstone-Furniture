"use client";

import { useRouter } from "next/navigation";
import { Box, Layers, ArrowRight, Scan } from "lucide-react";

import type { FurniturePublicListItem } from "@/types/furniture-public";

interface Props {
  item: FurniturePublicListItem;
}

export default function CustomerFurnitureCard({ item }: Props) {
  const router = useRouter();

  const primaryImage =
    (item as any)?.thumbnail_url ??
    (item as any)?.primary_image ??
    (item as any)?.image_url ??
    (item as any)?.images?.[0]?.url ??
    null;

  const categoryName = item.category?.name ?? "Uncategorized";
  const price = item.base_price ?? 0;
  const hasModel = !!(item as any).hasModel;
  const variantCount = (item as any).variantCount ?? 0;

  return (
    <div
      onClick={() => router.push(`/furniture/${item.id}`)}
      className="group relative flex flex-col bg-white/[0.03] hover:bg-white/[0.06] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/5 hover:border-[#D4A97A]/20 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
    >
      {/* IMAGE */}
      <div className="relative bg-white/5 h-56 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="flex justify-center items-center w-full h-full">
            <Box className="w-10 h-10 text-white/10" />
          </div>
        )}

        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A06]/80 via-transparent to-transparent" />

        {/* top: category pill */}
        <div className="top-3 left-3 absolute">
          <span className="bg-black/50 backdrop-blur-sm px-2.5 py-1 border border-white/10 rounded-full font-medium text-[10px] text-white/60 capitalize">
            {categoryName}
          </span>
        </div>

        {/* top-right: feature badges */}
        <div className="top-3 right-3 absolute flex flex-col items-end gap-1.5">
          {hasModel && (
            <span className="flex items-center gap-1 bg-[#D4A97A]/20 backdrop-blur-sm px-2 py-0.5 border border-[#D4A97A]/20 rounded-full font-medium text-[#D4A97A] text-[10px]">
              <Box className="w-2.5 h-2.5" /> 3D
            </span>
          )}
          {variantCount > 0 && (
            <span className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] text-white/50">
              <Layers className="w-2.5 h-2.5" /> {variantCount} finish{variantCount !== 1 ? "es" : ""}
            </span>
          )}
        </div>

        {/* hover overlay */}
        <div className="absolute inset-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-2 bg-[#D4A97A] shadow-lg px-5 py-2 rounded-full font-semibold text-[#1C1209] text-sm">
            <Scan className="w-4 h-4" />
            View & Customize
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-1 gap-3 p-5">
        {/* name + price */}
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-white group-hover:text-[#D4A97A] text-sm truncate transition-colors">
              {item.name}
            </h3>
            {item.description && (
              <p className="mt-1 text-white/30 text-xs line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-white text-sm">
              ₱{price.toLocaleString()}
            </p>
            <p className="text-[10px] text-white/25">starting at</p>
          </div>
        </div>

        {/* dimensions */}
        {(item.width_cm || item.depth_cm || item.height_cm) && (
          <p className="text-[11px] text-white/20">
            {item.width_cm ?? "–"} × {item.depth_cm ?? "–"} × {item.height_cm ?? "–"} cm
          </p>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/furniture/${item.id}`);
          }}
          className="flex justify-center items-center gap-2 mt-auto py-2.5 border border-white/10 hover:border-[#D4A97A]/40 group-hover:border-[#D4A97A]/20 rounded-lg w-full font-medium text-white/50 hover:text-[#D4A97A] text-xs transition"
        >
          Explore Design
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
