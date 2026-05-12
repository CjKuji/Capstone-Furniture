"use client";

import {
  Trash2,
  Image as ImageIcon,
  Box,
  Package,
  Pencil,
  Ruler,
} from "lucide-react";

import type { FurnitureItemAdmin } from "@/types/furniture";

export interface FurnitureCardProps {
  item: FurnitureItemAdmin;
  onEdit: (item: FurnitureItemAdmin) => void;
  onDelete: (id: string) => void;
}

export default function FurnitureCard({
  item,
  onEdit,
  onDelete,
}: FurnitureCardProps) {
  /* =========================================================
     FIXED FIELD ACCESS (MATCH YOUR NEW TYPES)
  ========================================================= */

  const images = item.images ?? [];
  const variants = item.variants ?? [];

  const primaryImage =
    images.find((img) => img.is_primary)?.image_url ||
    images[0]?.image_url ||
    "/placeholder.png";

  const categoryName = item.category?.name ?? "Uncategorized";

  const price = item.base_price ?? 0;

  const imageCount = images.length;
  const variantCount = variants.length;

  const hasModel = Boolean(item.model_url);

  const width = item.width_cm ?? null;
  const depth = item.depth_cm ?? null;
  const height = item.height_cm ?? null;

  const dimensionText =
    width !== null || depth !== null || height !== null
      ? `${width ?? "-"} × ${depth ?? "-"} × ${height ?? "-"} cm`
      : "No dimensions";

  const status = item.publish_status ?? "draft";

  const statusStyle: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    draft: "bg-amber-50 text-amber-700 border border-amber-200",
    archived: "bg-gray-100 text-gray-600 border border-gray-200",
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-300">

      {/* IMAGE */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
        />

        {/* STATUS */}
        <div
          className={`absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-md font-medium capitalize ${statusStyle[status]}`}
        >
          {status}
        </div>

        {/* BADGES */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-[10px] bg-black/75 text-white px-2 py-1 rounded-md">
            <ImageIcon size={12} />
            {imageCount}
          </div>

          <div className="flex items-center gap-1 text-[10px] bg-white text-gray-700 px-2 py-1 rounded-md border">
            <Package size={12} />
            {variantCount}
          </div>

          {hasModel && (
            <div className="flex items-center gap-1 text-[10px] bg-white text-gray-700 px-2 py-1 rounded-md border">
              <Box size={12} />
              3D
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-4">

        {/* TITLE */}
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {item.name}
            </h3>

            <p className="text-xs text-gray-500 mt-0.5">
              {categoryName}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-gray-900">
              ₱{price.toLocaleString()}
            </p>

            <p className="text-[10px] text-gray-400">
              base price
            </p>
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

        {/* ACTIONS */}
        <div className="pt-3 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 h-9 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black transition flex items-center justify-center gap-2"
          >
            <Pencil size={14} />
            Manage
          </button>

          <button
            onClick={() => onDelete(item.id)}
            title="Delete"
            className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition flex items-center justify-center"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}