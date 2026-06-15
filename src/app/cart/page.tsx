"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Trash2,
  Eye,
  Box,
  Layers,
  ImageIcon,
  LogIn,
} from "lucide-react";

import { useCart } from "@/hooks/useCart";
import { useUser } from "@/hooks/useUser";
import type { CartFurnitureItem } from "@/app/components/CartContext";
import Navbar from "@/app/components/Navbar";
import PlaceOrderModal from "@/app/components/PlaceOrderModal";
import PageTransition from "@/app/components/PageTransition";

/* ─────────────────────────────────────────────────────────────
    CartFurnitureCard
───────────────────────────────────────────────────────────── */
function CartFurnitureCard({
  item,
  selected,
  onToggleSelect,
  onRemove,
}: {
  item: CartFurnitureItem;
  selected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
}) {
  const router = useRouter();
  const thumbnail = item.thumbnail_url ?? null;
  const category  = item.category?.name ?? null;
  const desc      = item.description ?? null;
  const w         = item.width_cm  ?? null;
  const d         = item.depth_cm  ?? null;
  const h         = item.height_cm ?? null;
  const hasModel  = Boolean(item.hasModel);
  const imgCount  = item.imageCount ?? 0;
  const vCount    = item.variants.length;

  return (
    <div
      onClick={onToggleSelect}
      className={`
        group relative flex flex-col cursor-pointer
        bg-white/[0.03] hover:bg-white/[0.055]
        border rounded-2xl overflow-hidden
        transition-all duration-300
        hover:shadow-[0_8px_40px_rgba(0,0,0,0.45)]
        ${selected
          ? "border-[#D4A97A]/55 shadow-[0_0_0_1px_rgba(212,169,122,0.18),0_4px_28px_rgba(212,169,122,0.09)]"
          : "border-white/[0.06] hover:border-[#D4A97A]/20"}
      `}
    >
      {/* ── IMAGE ── */}
      <div className="relative bg-white/5 h-56 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="flex justify-center items-center w-full h-full">
            <Box className="w-10 h-10 text-white/10" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A06]/90 via-transparent to-transparent" />

        {category && (
          <div className="absolute top-3 left-3">
            <span className="bg-black/80 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full font-medium text-[10px] text-white/90 capitalize shadow-lg">
              {category}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {hasModel && (
            <span className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 border border-white/15 rounded-full font-medium text-[#D4A97A] text-[10px]">
              <Box className="w-2.5 h-2.5" /> 3D
            </span>
          )}
          {vCount > 0 && (
            <span className="flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-full text-[10px] text-white/90">
              <Layers className="w-2.5 h-2.5" />
              {vCount} finish{vCount !== 1 ? "es" : ""}
            </span>
          )}
          {imgCount > 0 && (
            <span className="flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-full text-[10px] text-white/90">
              <ImageIcon className="w-2.5 h-2.5" />
              {imgCount}
            </span>
          )}
        </div>

        <div
          className={`
            absolute inset-0 flex items-center justify-center
            transition-all duration-300
            ${selected
              ? "bg-[#D4A97A]/10 backdrop-blur-[1px]"
              : "bg-black/0 group-hover:bg-black/15 group-hover:backdrop-blur-[1px]"}
          `}
        >
          <div
            className={`
              flex items-center justify-center rounded-full border-2 w-10 h-10
              transition-all duration-300 shadow-lg
              ${selected
                ? "border-[#D4A97A] bg-[#D4A97A] scale-100 opacity-100"
                : "border-white/40 bg-black/40 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100"}
            `}
          >
            <CheckCircle2 className={`w-5 h-5 ${selected ? "text-[#1C1209]" : "text-white/70"}`} />
          </div>
        </div>

        {selected && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[#D4A97A]/90 backdrop-blur-sm">
            <CheckCircle2 className="w-3 h-3 text-[#1C1209]" />
            <span className="text-[10px] font-black tracking-widest uppercase text-[#1C1209]">
              Selected
            </span>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex flex-col flex-1 gap-2.5 p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className={`font-semibold text-sm truncate transition-colors ${
                selected ? "text-[#D4A97A]" : "text-white/90 group-hover:text-[#D4A97A]"
              }`}
            >
              {item.name}
            </h3>
            {desc && (
              <p className="mt-0.5 text-white/35 text-xs line-clamp-2 leading-relaxed">
                {desc}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-white text-sm">₱{item.base_price.toLocaleString()}</p>
            <p className="text-[10px] text-white/30">base price</p>
          </div>
        </div>

        {vCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.variants.slice(0, 4).map((v) => (
              <span
                key={v.id}
                className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] text-white/45"
              >
                {v.name}
                {v.price_adjustment !== 0 && (
                  <span className="ml-1 text-[#D4A97A]/60">
                    {v.price_adjustment > 0 ? "+" : ""}₱{v.price_adjustment.toLocaleString()}
                  </span>
                )}
              </span>
            ))}
            {vCount > 4 && (
              <span className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/25">
                +{vCount - 4} more
              </span>
            )}
          </div>
        )}

        {(w || d || h) && (
          <p className="text-[10px] text-white/20">
            {w ?? "–"} × {d ?? "–"} × {h ?? "–"} cm
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1 gap-2">
          <p className="text-[10px] text-white/30">
            {selected ? "Click to deselect" : "Click to select for order"}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/furniture/${item.id}`);
              }}
              aria-label="View furniture details"
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-white/[0.06] text-white/40 hover:text-[#D4A97A] hover:border-[#D4A97A]/30 hover:bg-[#D4A97A]/5 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label="Remove from cart"
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-white/[0.06] text-white/20 hover:text-red-400 hover:border-red-500/30 hover:bg-red-950/20 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
    Helper: Map CartFurnitureItem → Minimal shape
───────────────────────────────────────────────────────────── */
function toModalFurniture(item: CartFurnitureItem) {
  return {
    id:         item.id,
    name:       item.name,
    base_price: Number(item.base_price),
    variants:   item.variants.map((v) => ({
      id:               v.id,
      name:             v.name,
      price_adjustment: Number(v.price_adjustment),
    })),
  };
}

/* ─────────────────────────────────────────────────────────────
    CART PAGE
───────────────────────────────────────────────────────────── */
export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, clearCart, count } = useCart();
  const { user } = useUser();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [orderOpen,   setOrderOpen]   = useState(false);

  // Guard evaluation logic to watch if the profile session contextual mapping has dropped
  const isUnauthenticated = user === null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll      = () => setSelectedIds(new Set(items.map((i) => i.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const selectedItems = useMemo(() => items.filter((i) => selectedIds.has(i.id)), [items, selectedIds]);
  const selectedCount = selectedItems.length;
  const allSelected   = count > 0 && selectedCount === count;

  const baseTotalPrice = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + Number(item.base_price), 0);
  }, [selectedItems]);

  const handleSuccess = () => {
    selectedItems.forEach((i) => removeItem(i.id));
    setSelectedIds(new Set());
  };

  const modalFurnitureItems = useMemo(() => selectedItems.map(toModalFurniture), [selectedItems]);

  return (
    <PageTransition>
      <div className="bg-[#0F0A06] min-h-screen font-sans text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">

          {/* ── HEADER ── */}
          <div className="flex items-start justify-between mb-8 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A97A] mb-1.5">
                WoodForge Studio
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
                {count === 0 ? (
                  "Your cart is empty"
                ) : (
                  <>
                    {count} design{count !== 1 ? "s" : ""}
                    <span className="text-white/20 font-normal"> in cart</span>
                  </>
                )}
              </h1>
              {count > 0 && (
                <p className="mt-1.5 text-xs text-white/30">
                  Select the designs you want to order, then click Place Order.
                </p>
              )}
            </div>

            <button
              onClick={() => router.push("/catalog")}
              className="flex items-center gap-1.5 mt-1 text-white/30 hover:text-[#D4A97A] text-xs font-medium transition-colors shrink-0 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              Catalog
            </button>
          </div>

          {/* ── EMPTY STATE ── */}
          {count === 0 && (
            <div className="flex flex-col items-center justify-center gap-6 py-28 text-center">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/8 bg-white/[0.02]">
                  <ShoppingBag className="w-9 h-9 text-white/12" />
                </div>
                <div className="absolute -inset-3 rounded-full border border-[#D4A97A]/8 animate-ping" />
              </div>
              <div className="space-y-2">
                <p className="text-white/45 text-sm font-medium">Nothing saved yet</p>
                <p className="text-white/20 text-xs max-w-xs leading-relaxed">
                  Browse the catalog and tap the cart icon on any design to save it here.
                </p>
              </div>
              <button
                onClick={() => router.push("/catalog")}
                className="flex items-center gap-2 bg-[#D4A97A] hover:bg-[#C4976A] text-[#1C1209] font-bold text-xs uppercase tracking-[0.12em] px-7 py-3.5 rounded-full transition-all hover:shadow-[0_4px_20px_rgba(212,169,122,0.3)]"
              >
                Browse Designs
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── CONTROLS BAR ── */}
          {count > 0 && (
            <div className="flex items-center justify-between mb-5 gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={allSelected ? clearSelection : selectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-[#D4A97A]/30 text-[11px] font-semibold text-white/40 hover:text-[#D4A97A] transition-all"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                      allSelected ? "bg-[#D4A97A] border-[#D4A97A]" : "border-white/25"
                    }`}
                  >
                    {allSelected && (
                      <span className="text-[#1C1209] text-[8px] font-black">✓</span>
                    )}
                  </div>
                  {allSelected ? "Deselect all" : "Select all"}
                </button>

                {selectedCount > 0 && (
                  <span className="text-[11px] text-[#D4A97A]/70 font-medium">
                    {selectedCount} selected
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  clearCart();
                  clearSelection();
                }}
                className="flex items-center gap-1.5 text-[11px] text-white/20 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>
          )}

          {/* ── CARD GRID ── */}
          {count > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {items.map((item) => (
                <CartFurnitureCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  onRemove={() => {
                    removeItem(item.id);
                    setSelectedIds((prev) => {
                      const n = new Set(prev);
                      n.delete(item.id);
                      return n;
                    });
                  }}
                />
              ))}
            </div>
          )}

          {/* ── STICKY BOTTOM BAR ── */}
          {selectedCount > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3 bg-gradient-to-t from-[#0F0A06] via-[#0F0A06]/95 to-transparent pointer-events-none">
              <div className="pointer-events-auto mx-auto max-w-lg">
                <div className="flex items-center gap-3 rounded-2xl border border-[#2A1F14] bg-[#130D07]/95 backdrop-blur-md px-4 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
                  
                  {isUnauthenticated ? (
                    /* RE-AUTHENTICATION INTERCEPT ACTION DISPLAY */
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="flex items-center gap-2 text-white/40">
                        <LogIn className="w-4 h-4 text-[#D4A97A]" />
                        <span className="text-xs font-medium">Session timed out. Please sign in.</span>
                      </div>
                      <button
                        onClick={() => router.push("/login")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#D4A97A] hover:bg-white text-[#0E0A06] font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
                      >
                        Sign In
                      </button>
                    </div>
                  ) : (
                    /* REGULAR ACTIVE USER CHECKOUT PROMPT FLOW */
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
                          Ready to order
                        </p>
                        <p className="text-sm font-semibold text-white/80 truncate">
                          {selectedCount} design{selectedCount !== 1 ? "s" : ""} selected
                          <span className="text-[#D4A97A] ml-2">
                            ₱{baseTotalPrice.toLocaleString()}
                            <span className="text-white/25 font-normal text-[10px]"> base</span>
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => setOrderOpen(true)}
                        className="
                          flex items-center gap-2 shrink-0
                          px-5 py-2.5 rounded-xl
                          bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E0B882]
                          text-[#0E0A06] font-black text-[11px] uppercase tracking-[0.12em]
                          shadow-[0_2px_12px_rgba(212,169,122,0.35)]
                          hover:brightness-105 hover:shadow-[0_4px_24px_rgba(212,169,122,0.45)]
                          active:brightness-95 transition-all
                        "
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Place Order
                      </button>
                    </>
                  )}
                  
                </div>
              </div>
            </div>
          )}

          {selectedCount > 0 && <div className="h-24" />}
        </div>

        {/* ── PLACE ORDER MODAL ── */}
        {orderOpen && selectedCount > 0 && !isUnauthenticated && (
          <PlaceOrderModal
            open={orderOpen}
            onClose={() => setOrderOpen(false)}
            furniture={modalFurnitureItems}
            onSuccess={() => {
              handleSuccess();
              setOrderOpen(false);
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}