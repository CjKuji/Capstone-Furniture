"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Box, Layers, ArrowRight, ImageIcon, ShoppingCart, Check, Loader2 } from "lucide-react";

import type { FurniturePublicListItem } from "@/types/furniture-public";

import { useCart } from "@/hooks/useCart";
import { useUser } from "@/hooks/useUser";
import AuthRequiredModal from "@/app/components/AuthRequiredModal";
import { getFurniturePublicById } from "@/services/furniturePublic";

interface Props {
  item: FurniturePublicListItem;
}

export default function CustomerFurnitureCard({ item }: Props) {
  const router = useRouter();
  const { authUser } = useUser();
  const { isInCart, toggleItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

    if (!authUser) {
      setShowAuthModal(true);
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
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && event.key === "Enter") {
          router.push(`/furniture/${item.id}`);
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`View ${item.name} design details`}
      className="group relative flex h-full flex-col bg-[var(--surface)] hover:shadow-[0_12px_32px_rgba(59,40,27,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
    >
      {/* ================= IMAGE ================= */}
      <div className="relative bg-[var(--surface-alt)] h-44 overflow-hidden">

        {primaryImage ? (
          <img
            src={primaryImage}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="flex justify-center items-center w-full h-full">
            <Box className="w-10 h-10 text-[var(--text-muted)]/40" />
          </div>
        )}

        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--wood-dark)]/70 via-transparent to-transparent" />

        {/* ================= CATEGORY ================= */}
        <div className="absolute top-3 left-3">
          <span className="bg-[var(--wood-dark)]/85 backdrop-blur-md border border-[var(--surface)]/40 px-2.5 py-1 rounded-full font-medium text-[10px] text-[var(--surface)] capitalize shadow-lg">
            {categoryName}
          </span>
        </div>

        {/* ================= BADGES ================= */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">

          {/* 3D */}
      {hasModel && (
  <span className="flex items-center gap-1 bg-[var(--wood-dark)]/85 backdrop-blur-md px-2 py-0.5 border border-[var(--surface)]/40 rounded-full font-medium text-[var(--surface-caramel)] text-[10px] shadow-sm">
    <Box className="w-2.5 h-2.5" /> 3D
  </span>
)}

          {/* FINISHES */}
          {variantCount > 0 && (
            <span className="flex items-center gap-1 bg-[var(--wood-dark)]/85 backdrop-blur-md border border-[var(--surface)]/40 px-2 py-0.5 rounded-full text-[10px] text-[var(--surface)] shadow-lg">
              <Layers className="w-2.5 h-2.5" />
              {variantCount} finish{variantCount !== 1 ? "es" : ""}
            </span>
          )}

          {/* IMAGES */}
          {imagesCount > 0 && (
            <span className="flex items-center gap-1 bg-[var(--wood-dark)]/85 backdrop-blur-md border border-[var(--surface)]/40 px-2 py-0.5 rounded-full text-[10px] text-[var(--surface)] shadow-lg">
              <ImageIcon className="w-2.5 h-2.5" />
              {imagesCount} image{imagesCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex flex-col flex-1 gap-2 p-3.5">

        {/* name + price */}
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[var(--text)] group-hover:text-[var(--primary)] text-sm truncate transition-colors">
              {item.name}
            </h3>

            {item.description && (
              <p className="mt-1 text-[var(--text-muted)] text-xs line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="font-semibold text-[var(--text)] text-sm">
              ₱{price.toLocaleString()}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">starting at</p>
          </div>
        </div>

        {/* dimensions */}
        {(item.width_cm || item.depth_cm || item.height_cm) && (
          <p className="text-[11px] text-[var(--text-muted)]">
            {item.width_cm ?? "–"} × {item.depth_cm ?? "–"} ×{" "}
            {item.height_cm ?? "–"} cm
          </p>
        )}

        {/* One primary action; the card itself opens design details. */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--primary)]">
            View details
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </span>
          <button
            type="button"
            title="Add this furniture item to your cart"
            onClick={handleAddToCart}
            disabled={adding}
            className={`flex min-h-10 justify-center items-center gap-1.5 py-2 px-3 rounded-lg font-medium text-xs transition-all duration-200 ${
              isInCart(item.id)
                ? "bg-[var(--surface-caramel)] border border-[var(--primary)] text-[var(--text)] hover:bg-[var(--surface-alt)] hover:shadow-lg"
                : "bg-[var(--primary)] border border-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] hover:shadow-xl"
            } ${adding ? "opacity-60 pointer-events-none" : "shadow-lg"}`}
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
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
      <AuthRequiredModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}