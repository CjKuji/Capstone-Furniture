"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";
import type { Order, OrderItem } from "@/types/order";
import type { Conversation } from "@/hooks/useConversationList";

import BasicInfoSection from "@/app/components/sections/orders/BasicInfoSection";
import AssetsSection from "@/app/components/sections/orders/AssetsSection";
import VariantsSection from "@/app/components/sections/orders/VariantsSection";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";

/* =========================================================
    TYPES
========================================================= */
type Props = {
  order: Order;
  open: boolean;
  onClose: () => void;
  onViewFull?: () => void;
  conversation?: Conversation;
};

/* =========================================================
    COMPONENT
========================================================= */
export default function OrderFullDetailModal({
  order,
  open,
  onClose,
  onViewFull,
}: Props) {
  /**
   * NO scroll-lock useEffect here.
   *
   * Previously this component ran:
   * document.body.style.overflow = "hidden"
   *
   * The Navbar ALSO has a scroll-lock useEffect for its mobile menu:
   * document.body.style.overflow = menuOpen ? "hidden" : ""
   * cleanup: document.body.style.overflow = ""
   *
   * When the modal mounted and set overflow:hidden, any subsequent
   * re-render of the Navbar (e.g. triggered by the same React batch
   * that opened the modal) ran that effect's cleanup → reset overflow
   * to "" → triggered a browser reflow → React flushed pending async
   * state in useUser → authUser briefly appeared null → Navbar flashed
   * "Get Started".
   *
   * Scroll locking is handled by OrderCard's parent page
   * (CustomerOrdersPage) which already locks body scroll when the
   * payment modal is open, and the modal panel itself is overflow-y-auto
   * so internal scrolling works fine without a body lock.
   *
   * If you need scroll lock for this modal specifically, do it in
   * OrderCard (the direct parent) in a single consolidated effect,
   * not here — so there is only ever ONE owner of body.style.overflow.
   */

  /* ── MEMOIZED DATA NORMALIZATION ── */
  const items: OrderItem[] = useMemo(() => {
    const orderItems = order?.order_items;
    if (!orderItems) return [];

    return orderItems.map((item) => {
      const snapshot = item.furniture_snapshot;
      const rawDimensions = (snapshot as any)?.dimensions;

      // Ensure historical row URLs and snapshot nested strings are perfectly cleaned 
      const rawUrl = item.model_snapshot_url || (snapshot as any)?.model_url || (snapshot as any)?.model_snapshot_url;
      const sanitizedModelUrl = typeof rawUrl === "string" ? rawUrl.trim() : undefined;

      return {
        ...item,
        model_snapshot_url: sanitizedModelUrl,
        furniture_snapshot: snapshot
          ? {
              id: snapshot.id,
              name: snapshot.name ?? undefined,
              description: snapshot.description ?? undefined,
              category: snapshot.category ?? undefined,
              base_price: snapshot.base_price ?? undefined,
              model_url: sanitizedModelUrl,
              width_cm: rawDimensions?.width_cm ?? (snapshot as any)?.width_cm ?? undefined,
              depth_cm: rawDimensions?.depth_cm ?? (snapshot as any)?.depth_cm ?? undefined,
              height_cm: rawDimensions?.height_cm ?? (snapshot as any)?.height_cm ?? undefined,
              images: snapshot.images ?? undefined,
            }
          : undefined,
        variant_snapshot: item.variant_snapshot
          ? {
              id: item.variant_snapshot.id,
              name: item.variant_snapshot.name ?? undefined,
              texture_url: item.variant_snapshot.texture_url?.trim() ?? undefined,
              preview_image_url: item.variant_snapshot.preview_image_url?.trim() ?? undefined,
              price_adjustment: item.variant_snapshot.price_adjustment ?? undefined,
            }
          : undefined,
      };
    });
  }, [order?.order_items]);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity ?? 0), 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + (i.total_price ?? 0), 0),
    [items]
  );

  // Early return if the modal is closed to prevent unnecessary DOM insertions via portal
  if (!open) return null;

  if (!order || !order.id) {
    return createPortal(
      <div
        className="fixed inset-0 flex items-center justify-center p-4 backdrop-blur-md bg-black/80"
        style={{ zIndex: 99999 }}
      >
        <div className="w-full max-w-md bg-[#0A0705] border border-white/[0.06] rounded-2xl p-8 text-center shadow-2xl animate-pulse">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4A97A]">
            Initializing Order Manifest...
          </p>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    /**
     * Backdrop is fully opaque from frame 1 — no opacity transition on
     * the backdrop itself. Only the inner panel animates.
     * This prevents the Navbar from ever being visible through a
     * semi-transparent or fading-in backdrop.
     */
    <div
      className="fixed inset-0 flex items-center justify-center p-0 sm:p-6 backdrop-blur-md overflow-hidden"
      style={{
        zIndex: 99999,
        backgroundColor: "rgba(6, 4, 3, 0.85)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Only the panel gets the entry animation */}
      <div
        className={`
          relative w-full flex flex-col
          rounded-none sm:rounded-2xl
          h-screen sm:h-[calc(100vh-48px)]
          max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px]
          shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden
          border-0 sm:border border-white/[0.06] bg-[#0A0705]
          transition-all duration-500
          translate-y-0 scale-100 opacity-100
        `}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()} // Hardens the UI panel against backdrop click bubbles
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/50 to-transparent flex-shrink-0" />

        {/* HEADER */}
        <div
          className="flex items-center justify-between px-5 sm:px-8 py-4 shrink-0 bg-[#0E0A07]"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4A97A]/70 mb-0.5">
              Detailed Breakdown
            </p>
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                Order #{order.order_reference_code ?? "Pending"}
              </h2>
              <span className="text-xs text-white/30 hidden sm:inline">·</span>
              <p className="text-xs text-white/40 font-medium hidden sm:inline">
                {totalItems} item{totalItems !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {order.created_at && (
              <p className="text-[11px] text-white/30 font-medium text-right mr-1 hidden md:block">
                Placed {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </p>
            )}
            {onViewFull && (
              <button
                onClick={onViewFull}
                className="text-[10px] px-3.5 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all duration-200 flex items-center bg-[#D4A97A]/10 text-[#D4A97A] border border-[#D4A97A]/20 hover:bg-[#D4A97A]/15 active:scale-95"
              >
                Full View
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/[0.06] transition-all duration-200 text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-8 space-y-8 focus:outline-none custom-scrollbar bg-gradient-to-b from-[#0A0705] to-[#070504]">
          {items.map((item, index) => {
            const snapshot = item.furniture_snapshot;
            const variant = item.variant_snapshot;
            const modelUrl = item.model_snapshot_url;

            if (!snapshot) {
              return (
                <div
                  key={item.id}
                  className="rounded-xl p-8 text-xs text-center border border-dashed border-white/[0.06] bg-white/[0.01] text-white/25"
                >
                  Missing historical snapshot layout available for Item {index + 1}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden bg-[#0D0907]/60 border border-white/[0.04] shadow-inner"
              >
                <div
                  className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-white/[0.02]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1 h-4 rounded-full shrink-0" style={{ background: "#D4A97A" }} />
                    <h3 className="text-xs sm:text-sm font-semibold text-white truncate tracking-wide">
                      {snapshot.name ?? "Unnamed Design"}
                      <span className="text-white/20 font-normal mx-2 text-xs">×</span>
                      <span className="text-sm font-bold text-[#D4A97A]">{item.quantity}</span>
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full shrink-0 ml-2 border bg-[#D4A97A]/5 text-[#D4A97A] border-[#D4A97A]/20">
                    Item {index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6 items-start">
                  <div className="lg:col-span-5 w-full min-w-0">
                    {modelUrl ? (
                      <div className="relative w-full rounded-xl overflow-hidden bg-[#050302] aspect-square sm:aspect-video lg:aspect-square border border-white/[0.04] shadow-2xl">
                        {open ? (
                          <Furniture3DViewer
                            modelUrl={modelUrl}
                            selectedVariantTextureUrl={variant?.texture_url}
                            dimensions={{
                              width_cm: snapshot.width_cm,
                              depth_cm: snapshot.depth_cm,
                              height_cm: snapshot.height_cm,
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#050302]">
                            <div className="text-[10px] text-[#D4A97A] font-bold uppercase tracking-[0.25em]">
                              Loading Space...
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl flex items-center justify-center aspect-square sm:aspect-video lg:aspect-square w-full bg-[#050302] border border-white/[0.04]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                          No 3D Space Available
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-7 flex flex-col gap-6 w-full min-w-0">
                    <div className="w-full bg-white/[0.01] p-4 rounded-xl border border-white/[0.02]">
                      <BasicInfoSection items={[item]} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                      <div className="w-full flex flex-col bg-white/[0.01] p-4 rounded-xl border border-white/[0.02]">
                        <AssetsSection items={[item]} />
                      </div>
                      <div className="w-full flex flex-col bg-white/[0.01] p-4 rounded-xl border border-white/[0.02]">
                        <VariantsSection items={[item]} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* FULFILLMENT SUMMARY */}
          <div className="rounded-2xl p-5 sm:p-6 space-y-5 bg-[#0E0A07]/40 border border-white/[0.04]">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-3.5 bg-[#D4A97A] rounded-full" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Fulfillment Summary</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
              <div className="flex justify-between items-baseline gap-4 py-1.5 border-b border-white/[0.03]">
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 shrink-0">Customer</span>
                <span className="text-xs font-medium text-white/70 text-right capitalize truncate max-w-[75%]">{order.customer_name ?? "—"}</span>
              </div>
              <div className="flex justify-between items-baseline gap-4 py-1.5 border-b border-white/[0.03]">
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 shrink-0">Method</span>
                <span className="text-xs font-medium text-white/70 text-right capitalize truncate max-w-[75%]">{order.delivery_method ?? "—"}</span>
              </div>
              {order.delivery_method !== "pickup" && (
                <div className="flex justify-between items-baseline gap-4 py-1.5 border-b border-white/[0.03]">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 shrink-0">Contact</span>
                  <span className="text-xs font-medium text-white/70 text-right capitalize truncate max-w-[75%]">{order.phone_number ?? "—"}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline gap-4 py-1.5 border-b border-white/[0.03]">
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 shrink-0">
                  {order.delivery_method === "pickup" ? "Pickup Point" : "Shipping Destination"}
                </span>
                <span className="text-xs font-medium text-white/70 text-right capitalize truncate max-w-[75%]">
                  {order.delivery_method === "pickup" ? (order.pickup_location ?? "Store Warehouse") : (order.delivery_address ?? "—")}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                Aggregated Units: <span className="text-white font-semibold ml-1.5">{totalItems}</span>
              </span>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4A97A] mb-0.5">Calculated Total</p>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#E8C98A]">
                  ₱{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-200 border border-white/[0.04] bg-white/[0.01] text-white/40 hover:bg-white/[0.03] hover:text-white/70 active:scale-[0.99]"
          >
            Close Detail Overview
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}