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
        group relative flex h-full min-h-0 flex-col cursor-pointer sm:flex-row
        bg-[var(--surface)] hover:bg-[var(--surface)]
        border rounded-2xl overflow-hidden
        transition-all duration-300
        hover:shadow-[0_12px_32px_rgba(59,40,27,0.12)]
        ${selected
          ? "border-[var(--accent)] shadow-[0_0_0_1px_rgba(196,127,42,0.22),0_4px_28px_rgba(59,40,27,0.12)]"
          : "border-[var(--border)] hover:border-[var(--accent)]"}
      `}
    >
      {/* ── IMAGE ── */}
      <div className="relative bg-[var(--surface-alt)] h-36 overflow-hidden sm:h-auto sm:min-h-[9rem] sm:w-40 sm:shrink-0 lg:w-48">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="flex justify-center items-center w-full h-full">
            <Box className="w-10 h-10 text-[var(--text-muted)]/40" />
          </div>
        )}

        {category && (
          <div className="absolute top-3 left-3">
            <span className="bg-[var(--wood-dark)]/90 backdrop-blur-md border border-[var(--on-wood)]/30 px-2.5 py-1 rounded-full font-medium text-[10px] text-[var(--on-wood)] capitalize shadow-lg">
              {category}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {hasModel && (
            <span className="flex items-center gap-1 bg-[var(--wood-dark)]/90 backdrop-blur-md px-2 py-0.5 border border-[var(--on-wood)]/30 rounded-full font-medium text-[var(--on-wood)] text-[10px]">
              <Box className="w-2.5 h-2.5" /> 3D
            </span>
          )}
          {vCount > 0 && (
            <span className="flex items-center gap-1 bg-[var(--wood-dark)]/90 backdrop-blur-md border border-[var(--on-wood)]/30 px-2 py-0.5 rounded-full text-[10px] text-[var(--on-wood)]">
              <Layers className="w-2.5 h-2.5" />
              {vCount} finish{vCount !== 1 ? "es" : ""}
            </span>
          )}
          {imgCount > 0 && (
            <span className="flex items-center gap-1 bg-[var(--wood-dark)]/90 backdrop-blur-md border border-[var(--on-wood)]/30 px-2 py-0.5 rounded-full text-[10px] text-[var(--on-wood)]">
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
              ? "bg-[var(--accent)]/10 backdrop-blur-[1px]"
              : "bg-transparent group-hover:bg-[var(--wood-dark)]/10 group-hover:backdrop-blur-[1px]"}
          `}
        >
          <div
            className={`
              flex items-center justify-center rounded-full border-2 w-10 h-10
              transition-all duration-300 shadow-lg
              ${selected
                ? "border-[var(--accent)] bg-[var(--accent)] scale-100 opacity-100"
                : "border-[var(--on-wood)]/75 bg-[var(--wood-dark)]/65 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100"}
            `}
          >
            <CheckCircle2 className={`w-5 h-5 ${selected ? "text-[var(--wood-dark)]" : "text-[var(--on-wood)]"}`} />
          </div>
        </div>

        {selected && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-[var(--accent)]/95 backdrop-blur-sm">
            <CheckCircle2 className="w-3 h-3 text-[var(--wood-dark)]" />
            <span className="text-[10px] font-black tracking-widest uppercase text-[var(--wood-dark)]">
              Selected
            </span>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex flex-col flex-1 gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3
                className={`font-semibold text-sm truncate transition-colors ${
                  selected ? "text-[var(--primary)]" : "text-[var(--text)] group-hover:text-[var(--primary)]"
                }`}
              >
                {item.name}
              </h3>
              {desc && (
                <p className="mt-0.5 text-[var(--text-muted)] text-xs line-clamp-2 leading-relaxed">
                  {desc}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-[var(--text)] text-sm">₱{item.base_price.toLocaleString()}</p>
              <p className="text-[10px] text-[var(--text-muted)]">base price</p>
            </div>
          </div>

          {vCount > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.variants.slice(0, 4).map((v) => (
                <span
                  key={v.id}
                  className="px-2 py-0.5 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] text-[10px] text-[var(--text-muted)]"
                >
                  {v.name}
                  {v.price_adjustment !== 0 && (
                    <span className="ml-1 text-[var(--primary)]">
                      {v.price_adjustment > 0 ? "+" : ""}₱{v.price_adjustment.toLocaleString()}
                    </span>
                  )}
                </span>
              ))}
              {vCount > 4 && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                  +{vCount - 4} more
                </span>
              )}
            </div>
          )}

          {(w || d || h) && (
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              {w ?? "–"} × {d ?? "–"} × {h ?? "–"} cm
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-1 gap-2 sm:mt-0 sm:w-40 sm:shrink-0 sm:flex-col sm:items-stretch sm:border-l sm:border-[var(--border)] sm:pl-3 lg:w-44">
          <p className="text-[10px] text-[var(--text-muted)] sm:text-right">
            {selected ? "Click to deselect" : "Click to select for order"}
          </p>

          <div className="flex items-center gap-1.5 shrink-0 lg:justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/furniture/${item.id}`);
              }}
              aria-label="View furniture details"
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--primary)] hover:text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all"
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
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--danger)] hover:text-[var(--danger)] hover:border-[var(--danger)] hover:bg-[var(--danger-tint)] transition-all"
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
      <div className="customer-cart-page bg-[var(--bg)] min-h-screen font-sans text-[var(--text)]">
        <main className="mx-auto max-w-7xl px-4 sm:px-8 xl:px-12 py-6 sm:py-8">

          {/* ── HEADER ── */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-6 pb-4 border-b border-[var(--border)] gap-4">
            <div>
              <p className="inline-flex items-center gap-2 bg-[var(--surface-alt)] mb-2 px-3 py-1 border border-[var(--border)] rounded-full font-semibold text-[var(--primary)] text-[9px] uppercase tracking-widest">
                <ShoppingBag className="w-3 h-3" />
                Customer Portal
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
                My <span className="text-[var(--primary)]">Cart</span>
              </h1>
              {count > 0 && (
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                  Select the designs you want to order, then click Place Order.
                </p>
              )}
            </div>

            <button
              onClick={() => router.push("/catalog")}
              className="flex items-center gap-1.5 min-h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)] text-[var(--primary)] text-xs font-semibold transition-colors shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              Browse Designs
            </button>
          </header>

          {/* ── EMPTY STATE ── */}
          {count === 0 && (
            <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-10 text-center sm:py-12">
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--primary)]">
                <ShoppingBag className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-[var(--text)]">
                  You haven’t added any designs yet.
                </h2>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[var(--text-muted)]">
                  Browse our collection and add a design you’d like to order.
                </p>
              </div>
              <button
                onClick={() => router.push("/catalog")}
                className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-semibold text-[var(--primary-foreground)] transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
              >
                Browse Designs
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── CONTROLS BAR ── */}
          {count > 0 && (
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={allSelected ? clearSelection : selectAll}
                  className="flex min-h-10 items-center gap-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)] text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                      allSelected ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border)]"
                    }`}
                  >
                    {allSelected && (
                      <span className="text-[var(--primary-foreground)] text-[8px] font-black">✓</span>
                    )}
                  </div>
                  {allSelected ? "Deselect all" : "Select all"}
                </button>

                {selectedCount > 0 && (
                  <span className="text-[11px] text-[var(--primary)] font-semibold">
                    {selectedCount} selected
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  clearCart();
                  clearSelection();
                }}
                className="flex min-h-10 items-center gap-1.5 px-2 rounded-lg text-[11px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>
          )}

          {/* ── CARD GRID ── */}
          {count > 0 && (
            <div className="grid grid-cols-1 gap-3 mb-8">
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
            <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-8 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/95 to-transparent pointer-events-none">
              <div className="pointer-events-auto mx-auto max-w-lg">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md px-4 py-3 shadow-[0_8px_30px_rgba(59,40,27,0.18)]">
                  
                  {isUnauthenticated ? (
                    /* RE-AUTHENTICATION INTERCEPT ACTION DISPLAY */
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <LogIn className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-xs font-medium">Session timed out. Please sign in.</span>
                      </div>
                      <button
                        onClick={() => router.push("/login")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        Sign In
                      </button>
                    </div>
                  ) : (
                    /* REGULAR ACTIVE USER CHECKOUT PROMPT FLOW */
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          Ready to order
                        </p>
                        <p className="text-sm font-semibold text-[var(--text)] truncate">
                          {selectedCount} design{selectedCount !== 1 ? "s" : ""} selected
                          <span className="text-[var(--primary)] ml-2">
                            ₱{baseTotalPrice.toLocaleString()}
                            <span className="text-[var(--text-muted)] font-normal text-[10px]"> base</span>
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => setOrderOpen(true)}
                        className="
                          flex items-center gap-2 shrink-0
                          px-5 py-2.5 rounded-xl
                          bg-[var(--primary)] hover:bg-[var(--primary-hover)]
                          text-[var(--primary-foreground)] font-bold text-[11px] uppercase tracking-[0.12em]
                          shadow-[0_2px_12px_rgba(59,40,27,0.18)]
                          active:brightness-95 transition-all
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]
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
        </main>

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