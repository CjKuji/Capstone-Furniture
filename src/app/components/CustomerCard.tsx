"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Box,
  Layers,
  ArrowRight,
  Scan,
  ImageIcon,
  ShoppingCart,
  CheckCircle2,
  Loader2,
  Lock,
  X,
} from "lucide-react";

import type { FurniturePublicListItem } from "@/types/furniture-public";
import { useCart } from "@/hooks/useCart";
import { useUser } from "@/hooks/useUser"; // ✅ Added to track authentication state
import { getFurniturePublicById } from "@/services/furniturePublic";

interface Props {
  item: FurniturePublicListItem;
}

export default function CustomerFurnitureCard({ item }: Props) {
  const router = useRouter();
  const { authUser } = useUser(); // ✅ Check if user session exists
  const { isInCart, toggleItem, removeItem } = useCart();

  const [loadingCart, setLoadingCart] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // ✅ Floating window control state

  const inCart = isInCart(item.id);

  const primaryImage = item.thumbnail_url ?? null;
  const imagesCount  = item.imageCount    ?? 0;
  const categoryName = item.category?.name ?? "Uncategorized";
  const price        = item.base_price     ?? 0;
  const hasModel     = Boolean(item.hasModel);
  const variantCount = item.variantCount  ?? 0;

  const navigateToDetail = () => {
    router.push(`/furniture/${item.id}`);
  };

  async function handleCartToggle(e: React.MouseEvent) {
    e.stopPropagation();

    // ── GUEST REDIRECT TRAP ──
    if (!authUser) {
      setShowAuthModal(true);
      return;
    }

    // If already in cart, just remove
    if (inCart) {
      removeItem(item.id);
      return;
    }

    try {
      setLoadingCart(true);
      const detail = await getFurniturePublicById(item.id);
      
      if (!detail) throw new Error("Failed to fetch furniture detail structure");

      const cartItem = {
        id:            item.id,
        name:          item.name,
        base_price:    price,
        variants: (detail.variants ?? []).map((v) => ({
          id:               v.id,
          name:             v.name,
          price_adjustment: Number(v.price_adjustment ?? 0),
        })),
        thumbnail_url: item.thumbnail_url ?? null,
        description:   item.description   ?? null,
        category:      item.category      ?? null,
        width_cm:      item.width_cm      ?? null,
        depth_cm:      item.depth_cm      ?? null,
        height_cm:     item.height_cm     ?? null,
        hasModel,
        imageCount:    imagesCount,
      };

      toggleItem(cartItem);
    } catch (err) {
      console.error("Add to cart failed:", err);
    } finally {
      setLoadingCart(false);
    }
  }

  return (
    <>
      <div
        onClick={navigateToDetail}
        className={`
          group relative flex flex-col
          bg-white/[0.03] hover:bg-white/[0.06]
          border rounded-2xl overflow-hidden
          transition-all duration-300 cursor-pointer
          hover:shadow-[0_8px_40px_rgba(0,0,0,0.45)]
          ${inCart
            ? "border-[#D4A97A]/50 shadow-[0_0_0_1px_rgba(212,169,122,0.15),0_4px_24px_rgba(212,169,122,0.07)]"
            : "border-white/5 hover:border-[#D4A97A]/25"}
        `.trim()}
      >
        {/* ═══════════════ IMAGE ═══════════════ */}
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

          {/* vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A06]/90 via-transparent to-transparent" />

          {/* category badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-black/80 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full font-medium text-[10px] text-white/90 capitalize shadow-lg">
              {categoryName}
            </span>
          </div>

          {/* top-right badges */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {hasModel && (
              <span className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 border border-white/15 rounded-full font-medium text-[#D4A97A] text-[10px] shadow-sm">
                <Box className="w-2.5 h-2.5" /> 3D
              </span>
            )}
            {variantCount > 0 && (
              <span className="flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-full text-[10px] text-white/90 shadow-lg">
                <Layers className="w-2.5 h-2.5" />
                {variantCount} finish{variantCount !== 1 ? "es" : ""}
              </span>
            )}
            {imagesCount > 0 && (
              <span className="flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-full text-[10px] text-white/90 shadow-lg">
                <ImageIcon className="w-2.5 h-2.5" />
                {imagesCount} image{imagesCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* hover overlay */}
          <div className="absolute inset-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 bg-[#D4A97A] shadow-lg px-5 py-2 rounded-full font-semibold text-[#1C1209] text-sm transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <Scan className="w-4 h-4" />
              View &amp; Customize
            </div>
          </div>

          {/* in-cart ribbon */}
          {inCart && authUser && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#D4A97A]/90 backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3 text-[#1C1209]" />
              <span className="text-[10px] font-black tracking-widest uppercase text-[#1C1209]">
                In Cart
              </span>
            </div>
          )}
        </div>

        {/* ═══════════════ CONTENT ═══════════════ */}
        <div className="flex flex-col flex-1 gap-3 p-5">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white group-hover:text-[#D4A97A] text-sm truncate transition-colors">
                {item.name}
              </h3>
              {item.description && (
                <p className="mt-1 text-white/40 text-xs line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-white text-sm">
                ₱{price.toLocaleString()}
              </p>
              <p className="text-[10px] text-white/30">starting at</p>
            </div>
          </div>

          {/* dimensions */}
          {(item.width_cm || item.depth_cm || item.height_cm) && (
            <p className="text-[11px] text-white/30">
              {item.width_cm ?? "–"} × {item.depth_cm ?? "–"} × {item.height_cm ?? "–"} cm
            </p>
          )}

          {/* CTA row */}
          <div className="flex gap-2 mt-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateToDetail();
              }}
              className="flex flex-1 justify-center items-center gap-2 py-2.5 border border-white/10 hover:border-[#D4A97A]/50 rounded-lg font-medium text-white/60 hover:text-[#D4A97A] text-xs transition-all duration-300"
            >
              Explore
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Add to Cart button */}
            <button
              type="button"
              onClick={handleCartToggle}
              disabled={loadingCart}
              aria-label={!authUser ? "Login to add item" : inCart ? "Remove from cart" : "Add to cart"}
              className={`
                flex items-center justify-center gap-1.5
                px-3 py-2.5 rounded-lg border
                font-semibold text-xs
                transition-all duration-200 shrink-0
                disabled:opacity-60 disabled:cursor-not-allowed
                ${!authUser 
                  ? "border-white/5 bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60" // Muted Grey style for Guest Users
                  : inCart
                    ? "border-[#D4A97A]/50 bg-[#D4A97A]/10 text-[#D4A97A] shadow-[0_0_10px_rgba(212,169,122,0.15)]"
                    : "border-white/10 hover:border-[#D4A97A]/40 bg-transparent text-white/40 hover:text-[#D4A97A] hover:bg-[#D4A97A]/5"
                }
              `.trim()}
            >
              {loadingCart ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : !authUser ? (
                <>
                  <Lock className="w-3.5 h-3.5 opacity-70" />
                  <span className="hidden sm:inline">Add</span>
                </>
              ) : inCart ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ FLOATING LOGIN MODAL ═══════════════ */}
      {showAuthModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAuthModal(false)}
        >
          <div 
            className="relative w-full max-w-sm p-6 text-center border bg-[#1C1209] border-white/10 rounded-2xl shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D4A97A]/10 border border-[#D4A97A]/20 text-[#D4A97A] mb-4">
              <ShoppingCart className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-white tracking-wide">
              Login Required
            </h3>
            <p className="mt-2 text-xs text-white/50 leading-relaxed">
              Please sign in to save blueprints, build out customized orders, and manage items in your cart.
            </p>

            {/* Action CTAs */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  router.push("/auth/login");
                }}
                className="w-full bg-[#D4A97A] hover:bg-[#C4976A] py-2.5 rounded-xl font-semibold text-[#1C1209] text-sm transition shadow-lg"
              >
                Sign In Now
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2.5 rounded-xl border border-white/10 font-medium text-white/60 hover:text-white hover:bg-white/5 text-sm transition"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}