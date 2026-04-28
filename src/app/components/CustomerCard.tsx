"use client";

import { useRouter } from "next/navigation";

import {
  Image as ImageIcon,
  Box,
  Package,
  Ruler,
  Eye,
} from "lucide-react";

import type { FurniturePublicListItem } from "@/types/furniture-public";

interface Props {
  item: FurniturePublicListItem;
}

export default function CustomerFurnitureCard({ item }: Props) {
  const router = useRouter();

  /* =========================================================
     DATA (FROM UPDATED PUBLIC LIST API)
  ========================================================= */

  const primaryImage =
    item.thumbnail_url ?? "/placeholder.png"; // 🔥 FIXED

  const categoryName = item.category?.name ?? "Uncategorized";

  const price = item.base_price ?? 0;

  const dimensionText =
    item.width_cm || item.depth_cm || item.height_cm
      ? `${item.width_cm ?? "-"} × ${item.depth_cm ?? "-"} × ${
          item.height_cm ?? "-"
        } cm`
      : "No dimensions";

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      onClick={() => router.push(`/furniture/${item.id}`)}
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-300 cursor-pointer"
    >
      {/* =====================================================
          IMAGE
      ====================================================== */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
        />

        {/* BADGES */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          {/* IMAGE COUNT */}
          <div className="flex items-center gap-1 text-[10px] bg-black/75 text-white px-2 py-1 rounded-md">
            <ImageIcon size={12} />
            {item.imageCount}
          </div>

          {/* VARIANT COUNT */}
          <div className="flex items-center gap-1 text-[10px] bg-white text-gray-700 px-2 py-1 rounded-md border">
            <Package size={12} />
            {item.variantCount}
          </div>

          {/* MODEL STATUS */}
          <div className="flex items-center gap-1 text-[10px] bg-white text-gray-700 px-2 py-1 rounded-md border">
            <Box size={12} />
            {item.hasModel ? "3D" : "No 3D"}
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <div className="p-4 space-y-4">
        {/* TITLE + PRICE */}
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {item.name}
            </h3>

            {/* CATEGORY NAME */}
            <p className="text-xs text-gray-500 mt-0.5">
              {categoryName}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-gray-900">
              ₱{price.toLocaleString()}
            </p>

            <p className="text-[10px] text-gray-400">base price</p>
          </div>
        </div>

        {/* DESCRIPTION */}
        {item.description ? (
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">
            No description
          </p>
        )}

        {/* DIMENSIONS */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Ruler size={13} className="text-gray-500" />

            <span className="text-[11px] text-gray-600">
              {dimensionText}
            </span>
          </div>
        </div>

        {/* ACTION */}
        <div className="pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/furniture/${item.id}`);
            }}
            className="w-full h-9 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black transition flex items-center justify-center gap-2"
          >
            <Eye size={14} />
            View Furniture
          </button>
        </div>
      </div>
    </div>
  );
}