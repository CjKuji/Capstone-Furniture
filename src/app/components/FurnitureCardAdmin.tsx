"use client";

import { Trash2, Image as ImageIcon, Box } from "lucide-react";
import type { FurnitureItemAdmin } from "@/types/furniture";

export interface FurnitureCardProps {
  item: FurnitureItemAdmin;
  onEdit: (item: FurnitureItemAdmin) => void;
  onDelete: (id: string) => void;
  onView?: (url: string) => void;
}

export default function FurnitureCard({
  item,
  onEdit,
  onDelete,
  onView,
}: FurnitureCardProps) {
  const images = item.furniture_images ?? [];
  const variants = item.furniture_variants ?? [];

  const primaryImage =
    images.find((img) => img.is_primary)?.image_url ||
    images[0]?.image_url ||
    "/placeholder.png";

  const categoryName = item.furniture_categories?.name ?? "Uncategorized";

  const price = item.base_price ?? 0;
  const imageCount = images.length;
  const hasModel = Boolean(item.model_url);

  const defaultVariant =
    variants.find((v) => v.is_default) || variants[0];

  const status = item.publish_status ?? "draft";

  const statusStyle: Record<string, string> = {
    published: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    draft: "bg-amber-500/10 text-amber-600 border-amber-200",
    archived: "bg-neutral-200 text-neutral-600 border-neutral-300",
  };

  return (
    <div className="group bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all">

      {/* ================= IMAGE ================= */}
      <div className="relative h-44 w-full bg-neutral-100">

        <img
          src={primaryImage}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition"
        />

        {/* STATUS */}
        <div
          className={`absolute top-3 left-3 text-[11px] px-2 py-1 rounded-md border font-medium backdrop-blur ${statusStyle[status]}`}
        >
          {status}
        </div>

        {/* IMAGE COUNT */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] bg-black/60 text-white px-2 py-1 rounded-md">
          <ImageIcon size={12} />
          {imageCount}
        </div>

        {/* MODEL BADGE */}
        {hasModel && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[11px] bg-white/90 px-2 py-1 rounded-md border text-neutral-700">
            <Box size={12} />
            3D
          </div>
        )}
      </div>

      {/* ================= CONTENT ================= */}
      <div className="p-4 space-y-4">

        {/* TITLE + PRICE */}
        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900 truncate">
              {item.name}
            </h3>

            <p className="text-xs text-neutral-500 truncate">
              {categoryName}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-neutral-900">
              ₱{price.toLocaleString()}
            </p>
            <p className="text-[11px] text-neutral-400">
              base
            </p>
          </div>
        </div>

        {/* VARIANT PREVIEW */}
        {defaultVariant && (
          <div className="flex items-center justify-between text-xs border border-neutral-100 rounded-lg px-3 py-2 bg-neutral-50">
            <div className="flex items-center gap-2 min-w-0">
              {defaultVariant.preview_image_url && (
                <img
                  src={defaultVariant.preview_image_url}
                  className="w-5 h-5 rounded object-cover border"
                />
              )}
              <span className="text-neutral-700 truncate">
                {defaultVariant.name}
              </span>
            </div>

            <span className="text-neutral-500">
              +₱{defaultVariant.price_adjustment ?? 0}
            </span>
          </div>
        )}

        {/* META */}
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{imageCount} images</span>
          <span>{variants.length} variants</span>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 pt-2 border-t border-neutral-100">

          <button
            onClick={() => onEdit(item)}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-black transition"
          >
            Manage
          </button>

          <button
            onClick={() => onDelete(item.id)}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>

        </div>
      </div>
    </div>
  );
}