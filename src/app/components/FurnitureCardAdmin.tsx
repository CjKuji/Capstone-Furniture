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
     SAFE DATA
  ========================================================= */

  const images = item.images ?? [];
  const variants = item.variants ?? [];

  const primaryImage =
    images.find((img) => img.is_primary)?.image_url ||
    images[0]?.image_url ||
    "/placeholder.png";

  const categoryName = item.category?.name || "Uncategorized";
  const price = item.base_price ?? 0;

  const imageCount = images.length;
  const variantCount = variants.length;

  const hasModel = Boolean(item.model_url);

  const width = item.width_cm;
  const depth = item.depth_cm;
  const height = item.height_cm;

  const dimensionText =
    width || depth || height
      ? `${width ?? "-"} × ${depth ?? "-"} × ${height ?? "-"} cm`
      : "No dimensions set";

  const status = item.publish_status ?? "draft";

  const statusStyle: Record<string, string> = {
    published: "bg-black text-white",
    draft: "bg-white text-black border border-black/20",
    archived: "bg-black/10 text-black",
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="group flex flex-col h-[420px] rounded-2xl border border-black/10 bg-white overflow-hidden transition hover:shadow-lg">

      {/* ================= IMAGE ================= */}
      <div className="relative h-44 bg-white overflow-hidden flex-shrink-0">

        <img
          src={primaryImage}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
        />

        {/* STATUS */}
        <div
          className={`absolute top-3 left-3 px-3 py-1 text-[11px] font-semibold rounded-full ${statusStyle[status]}`}
        >
          {status}
        </div>

        {/* BADGES */}
        <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">

          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black text-white text-[10px] font-medium">
            <ImageIcon size={12} />
            {imageCount}
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white text-black text-[10px] font-medium border border-black/10">
            <Package size={12} />
            {variantCount}
          </div>

          {hasModel && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white text-black text-[10px] font-medium border border-black/10">
              <Box size={12} />
              3D
            </div>
          )}

        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="p-5 flex flex-col flex-1 space-y-3">

        {/* TITLE + PRICE */}
        <div className="flex justify-between gap-3">

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black truncate">
              {item.name}
            </h3>

            <p className="text-xs font-medium text-black mt-1">
              {categoryName}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-black">
              ₱{price.toLocaleString()}
            </p>
            <p className="text-[10px] font-medium text-black">
              base price
            </p>
          </div>

        </div>

        {/* DESCRIPTION (FIXED HEIGHT SAFE) */}
        <div className="h-[40px]">
          {item.description ? (
            <p className="text-xs font-medium text-black leading-snug line-clamp-2">
              {item.description}
            </p>
          ) : (
            <p className="text-xs font-medium text-black">
              No description added
            </p>
          )}
        </div>

        {/* DIMENSIONS */}
        <div className="rounded-xl border border-black/10 p-3 flex items-center gap-2">

          <Ruler size={14} className="text-black" />

          <span className="text-xs font-medium text-black">
            {dimensionText}
          </span>

        </div>

        {/* ACTIONS (ALWAYS BOTTOM FIXED) */}
        <div className="mt-auto flex gap-2">

          <button
            onClick={() => onEdit(item)}
            className="flex-1 h-10 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            <Pencil size={14} />
            Manage
          </button>

          <button
            onClick={() => onDelete(item.id)}
            className="h-10 w-10 rounded-xl border border-black text-black flex items-center justify-center hover:bg-black hover:text-white transition"
          >
            <Trash2 size={16} />
          </button>

        </div>

      </div>
    </div>
  );
}