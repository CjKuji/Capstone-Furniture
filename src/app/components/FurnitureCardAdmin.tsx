"use client";

import {
  Trash2,
  Image as ImageIcon,
  Package,
  Pencil,
  Box,
} from "lucide-react";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

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

  const width = item.width_cm;
  const depth = item.depth_cm;
  const height = item.height_cm;

  const status = item.publish_status ?? "draft";

  const statusStyle: Record<string, string> = {
    published: "bg-[#D4A97A]/20 text-[#D4A97A] border border-[#D4A97A]/30",
    draft: "bg-white/10 text-white/50 border border-white/10",
    archived: "bg-red-500/10 text-red-400 border border-red-500/20",
  };

  return (
    <div
      className="group relative flex flex-col bg-white/[0.03]
      hover:bg-white/[0.06] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
      border border-white/5 hover:border-[#D4A97A]/20
      rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
    >
      {/* ================= IMAGE ================= */}
      <div className="relative bg-white/5 h-56 overflow-hidden">

        <img
          src={primaryImage}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A06]/80 via-transparent to-transparent" />

        {/* top-left: status */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full border backdrop-blur-md text-[10px] font-medium capitalize ${statusStyle[status]}`}
          >
            {status}
          </span>
        </div>

        {/* ================= BADGES (FIXED HIERARCHY) ================= */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">

          {/* 3D (TOP PRIORITY) */}
          {hasModel && (
            <span className="flex items-center gap-1
              bg-black/70 backdrop-blur-md
              px-2 py-0.5 rounded-full
              border border-white/15
              text-[10px] text-[#D4A97A] font-medium shadow-sm">
              <Box className="w-2.5 h-2.5" />
              3D
            </span>
          )}

          {/* FINISH (VARIANTS) */}
          <span className="flex items-center gap-1
            bg-black/60 backdrop-blur-md
            px-2 py-0.5 rounded-full
            border border-white/10
            text-[10px] text-white/70">
            <Package className="w-2.5 h-2.5" />
            {variantCount} Finish{variantCount !== 1 ? "es" : ""}
          </span>

          {/* IMAGES (ALWAYS READABLE) */}
          <span className="flex items-center gap-1
            bg-black/60 backdrop-blur-md
            px-2 py-0.5 rounded-full
            border border-white/10
            text-[10px] text-white/70">
            <ImageIcon className="w-2.5 h-2.5" />
            {imageCount} Image{imageCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* hover CTA */}
        <div className="absolute inset-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="flex items-center gap-2 bg-[#D4A97A]
            shadow-lg px-5 py-2 rounded-full font-semibold
            text-[#1C1209] text-sm"
          >
            <Pencil className="w-4 h-4" />
            Manage Item
          </button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex flex-col flex-1 gap-3 p-5">

        {/* name + price */}
        <div className="flex justify-between items-start gap-3">

          <div className="min-w-0">
            <h3 className="font-semibold text-white group-hover:text-[#D4A97A] text-sm truncate transition-colors">
              {item.name}
            </h3>

            <p className="mt-1 text-white/30 text-xs capitalize">
              {categoryName}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="font-semibold text-white text-sm">
              ₱{price.toLocaleString()}
            </p>
            <p className="text-[10px] text-white/25">base price</p>
          </div>
        </div>

        {/* description */}
        <p className="text-[11px] text-white/20 line-clamp-2 leading-relaxed">
          {item.description || "No description provided"}
        </p>

        {/* dimensions */}
        {(width || depth || height) && (
          <p className="text-[11px] text-white/20">
            {width ?? "–"} × {depth ?? "–"} × {height ?? "–"} cm
          </p>
        )}

        {/* CTA row */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="flex justify-center items-center gap-2 mt-auto py-2.5
          border border-white/10 hover:border-[#D4A97A]/40
          group-hover:border-[#D4A97A]/20 rounded-lg w-full
          font-medium text-white/50 hover:text-[#D4A97A] text-xs transition"
        >
          Manage Design
          <Pencil className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* delete */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="text-[11px] text-white/20 hover:text-red-400 transition self-end"
        >
          Delete
        </button>

      </div>
    </div>
  );
}