"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Box, Layers, ArrowRight, Scan, ImageIcon, ShoppingCart, Check, Loader2 } from "lucide-react";

import type { FurniturePublicListItem } from "@/types/furniture-public";

import { useCart } from "@/hooks/useCart";
import { getFurniturePublicById } from "@/services/furniturePublic";

interface Props {
  item: FurniturePublicListItem;
}

export default function CustomerFurnitureCard({ item }: Props) {
  const router = useRouter();
  const { isInCart, toggleItem } = useCart();
  const [adding, setAdding] = useState(false);

  /* ========================
     IMAGE LOGIC (FROM SERVICE)
  ======================== */

  const primaryImage = item.thumbnail_url ?? null;
  const imagesCount = (item as any).imageCount ?? 0;

  /* ========================
     META
  ======================== */

  const categoryName = item.category?.name ?? "Uncategorized";
  const price = item.base_price ?? 0;

  const hasModel = Boolean((item as any).hasModel);

  const variantCount =
    (item as any).variantCount ?? (item as any)?.variants?.length ?? 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isInCart(item.id)) {
      // Remove from cart immediately
      toggleItem({
        id: item.id,
        name: item.name,
        base_price: item.base_price,
        variants: [],
        thumbnail_url: item.thumbnail_url,
        description: item.description,
        category: item.category,
        width_cm: item.width_cm,
        depth_cm: item.depth_cm,
        height_cm: item.height_cm,
        hasModel: item.hasModel,
        imageCount: item.imageCount,
      });
      return;
    }

    setAdding(true);
    try {
      // Fetch full detail to get variant data
      const detail = await getFurniturePublicById(item.id);
      toggleItem({
        id: detail.id,
        name: detail.name,
        base_price: detail.base_price,
        variants: detail.variants.map((v) => ({
          id: v.id,
          name: v.name,
          price_adjustment: v.price_adjustment,
        })),
        thumbnail_url: item.thumbnail_url,
        description: item.description,
        category: item.category,
        width_cm: item.width_cm,
        depth_cm: item.depth_cm,
        height_cm: item.height_cm,
        hasModel: item.hasModel,
        imageCount: item.imageCount,
      });
    } catch {
      // Fallback: add without variants
      toggleItem({
        id: item.id,
        name: item.name,
        base_price: item.base_price,
        variants: [],
        thumbnail_url: item.thumbnail_url,
        description: item.description,
        category: item.category,
        width_cm: item.width_cm,
        depth_cm: item.depth_cm,
        height_cm: item.height_cm,
        hasModel: item.hasModel,
        imageCount: item.imageCount,
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      onClick={() => router.push(`/furniture/${item.id}`)}
      className="group relative flex flex-col bg-white/[0.03] hover:bg-white/[0.06] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/5 hover:border-[#D4A97A]/20 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
    >
      {/* ================= IMAGE ================= */}
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

        {/* ================= CATEGORY ================= */}
        <div className="absolute top-3 left-3">
          <span className="bg-black/70 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full font-medium text-[10px] text-white/80 capitalize shadow-lg">
            {categoryName}
          </span>
        </div>

        {/* ================= BADGES ================= */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">

          {/* 3D */}
      {hasModel && (
  <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 border border-white/15 rounded-full font-medium text-[#D4A97A] text-[10px] shadow-sm">
    <Box className="w-2.5 h-2.5" /> 3D
  </span>
)}

          {/* FINISHES */}
          {variantCount > 0 && (
            <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-full text-[10px] text-white/80 shadow-lg">
              <Layers className="w-2.5 h-2.5" />
              {variantCount} finish{variantCount !== 1 ? "es" : ""}
            </span>
          )}

          {/* IMAGES */}
          {imagesCount > 0 && (
            <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-full text-[10px] text-white/80 shadow-lg">
              <ImageIcon className="w-2.5 h-2.5" />
              {imagesCount} image{imagesCount !== 1 ? "s" : ""}
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

      {/* ================= CONTENT ================= */}
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
            {item.width_cm ?? "–"} × {item.depth_cm ?? "–"} ×{" "}
            {item.height_cm ?? "–"} cm
          </p>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/furniture/${item.id}`);
            }}
            className="flex justify-center items-center gap-2 py-2.5 border border-white/10 hover:border-[#D4A97A]/40 group-hover:border-[#D4A97A]/20 rounded-lg flex-1 font-medium text-white/50 hover:text-[#D4A97A] text-xs transition"
          >
            Explore Design
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className={`flex justify-center items-center gap-1.5 py-2.5 px-3 rounded-lg font-medium text-xs transition-all duration-200 ${
              isInCart(item.id)
                ? "bg-[#D4A97A]/20 border border-[#D4A97A]/40 text-[#D4A97A] hover:bg-[#D4A97A]/30"
                : "bg-[#D4A97A] border border-[#D4A97A] text-[#1C1209] hover:bg-[#D4A97A]/90"
            } ${adding ? "opacity-60 pointer-events-none" : ""}`}
          >
            {adding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Adding...
              </>
            ) : isInCart(item.id) ? (
              <>
                <Check className="w-3.5 h-3.5" />
                In Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}