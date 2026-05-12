"use client";

import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Box,
  Package,
  Ruler,
  Eye,
  Sparkles,
} from "lucide-react";

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
    "/placeholder.png";

  const categoryName = item.category?.name ?? "Uncategorized";
  const price = item.base_price ?? 0;

  const dimensionText =
    item.width_cm || item.depth_cm || item.height_cm
      ? `${item.width_cm ?? "-"} × ${item.depth_cm ?? "-"} × ${
          item.height_cm ?? "-"
        } cm`
      : "No dimensions";

  return (
    <div
      onClick={() => router.push(`/furniture/${item.id}`)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* IMAGE SECTION */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        {/* top badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] bg-white/90 text-gray-800 px-2 py-1 rounded-full backdrop-blur">
            <Sparkles size={12} />
            Made to order
          </span>
        </div>

        {/* bottom badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-[10px] bg-black/70 text-white px-2 py-1 rounded-full backdrop-blur">
            <ImageIcon size={12} />
            {(item as any).imageCount ?? 0}
          </div>

          <div className="flex items-center gap-1 text-[10px] bg-black/70 text-white px-2 py-1 rounded-full backdrop-blur">
            <Package size={12} />
            {(item as any).variantCount ?? 0}
          </div>

          <div className="flex items-center gap-1 text-[10px] bg-black/70 text-white px-2 py-1 rounded-full backdrop-blur">
            <Box size={12} />
            {(item as any).hasModel ? "3D available" : "No 3D"}
          </div>
        </div>

        {/* hover CTA overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center bg-black/30">
          <div className="px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-medium shadow-lg flex items-center gap-2">
            <Eye size={14} />
            Quick View
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5 space-y-4">
        {/* TITLE + PRICE */}
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-gray-700 transition">
              {item.name}
            </h3>

            <p className="text-xs text-gray-500 mt-1">{categoryName}</p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-base font-semibold text-gray-900">
              ₱{price.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400">starting price</p>
          </div>
        </div>

        {/* DESCRIPTION */}
        {item.description ? (
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">No description available</p>
        )}

        {/* DIMENSIONS */}
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          <Ruler size={13} className="text-gray-400" />
          {dimensionText}
        </div>

        {/* ACTION BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/furniture/${item.id}`);
          }}
          className="w-full h-10 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          <Eye size={15} />
          View & Customize
        </button>
      </div>
    </div>
  );
}