"use client";

import { useMemo, memo, useState, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import type { Order, OrderItem } from "@/types/order";
import type { Conversation } from "@/hooks/useConversationList";
import { Maximize2 } from "lucide-react";

import BasicInfoSection from "@/app/components/sections/orders/BasicInfoSection";
import AssetsSection from "@/app/components/sections/orders/AssetsSection";
import VariantsSection from "@/app/components/sections/orders/VariantsSection";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";
import ImageLightbox from "@/app/components/ImageLightbox";

/* =========================================================
    ITEM COMPONENT
========================================================= */
const OrderItemViewer = memo(
  function OrderItemViewer({
    item,
    index,
    onImageClick,
  }: {
    item: OrderItem;
    index: number;
    onImageClick: (images: { url: string; id?: string }[], itemName: string) => void;
  }) {
    const snapshot = item.furniture_snapshot;
    const variant = item.variant_snapshot;
    const modelUrl = item.model_snapshot_url;

    // Memoize dimensions to prevent infinite re-renders with Suspense
    const dimensions = useMemo(
      () => ({
        width_cm: snapshot?.width_cm,
        depth_cm: snapshot?.depth_cm,
        height_cm: snapshot?.height_cm,
      }),
      [snapshot?.width_cm, snapshot?.depth_cm, snapshot?.height_cm]
    );

    const itemImages = useMemo(() => {
      if (!snapshot?.images || !Array.isArray(snapshot.images)) return [];
      const images: { url: string; id?: string }[] = [];
      for (const img of snapshot.images) {
        if (typeof img === 'string') {
          if (img) images.push({ url: img, id: undefined });
        } else if (typeof img === 'object' && img !== null) {
          const imgObj = img as Record<string, unknown>;
          const url = typeof imgObj.image_url === 'string' ? imgObj.image_url : typeof imgObj.url === 'string' ? imgObj.url : '';
          if (url) {
            images.push({
              url,
              id: typeof imgObj.id === 'string' ? imgObj.id : undefined,
            });
          }
        }
      }
      return images;
    }, [snapshot]);

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
                <Suspense fallback={
                  <div className="flex items-center justify-center w-full h-full min-h-[200px] bg-[#050302]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#D4A97A] border-t-transparent rounded-full animate-spin" />
                      <span className="text-white/40 text-[10px] font-medium uppercase tracking-widest">Loading 3D Model</span>
                    </div>
                  </div>
                }>
                  <Furniture3DViewer
                    key={modelUrl}
                    modelUrl={modelUrl}
                    selectedVariantTextureUrl={variant?.texture_url}
                    dimensions={dimensions}
                  />
                </Suspense>
              </div>
            ) : itemImages.length > 0 ? (
              <div
                className="relative w-full rounded-xl overflow-hidden bg-[#050302] aspect-square sm:aspect-video lg:aspect-square border border-white/[0.04] shadow-2xl cursor-zoom-in group"
                onClick={() => onImageClick(itemImages, snapshot.name ?? `Item ${index + 1}`)}
              >
                <img
                  src={itemImages[0].url}
                  alt={snapshot.name ?? "Item image"}
                  className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 text-white/70 text-[10px] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3 h-3" />
                  {itemImages.length > 1 ? `${itemImages.length} images` : 'View full size'}
                </div>
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
                <AssetsSection 
                  items={[item]} 
                  onImageClick={(imgs, idx) => onImageClick(imgs, snapshot.name ?? `Item ${index + 1}`)}
                />
              </div>
              <div className="w-full flex flex-col bg-white/[0.01] p-4 rounded-xl border border-white/[0.02]">
                <VariantsSection items={[item]} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  // Custom comparison: only skip re-render if item.id and index are the same
  // This prevents unnecessary re-mounts when parent updates from realtime subscriptions
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.index === nextProps.index
    );
  }
);

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

type SnapshotLike = {
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  base_price?: number | null;
  model_url?: string | null;
  model_snapshot_url?: string | null;
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
  dimensions?: {
    width_cm?: number | null;
    depth_cm?: number | null;
    height_cm?: number | null;
  } | null;
  images?: unknown;
};

/* =========================================================
    COMPONENT
========================================================= */
const OrderFullDetailModalInner = ({
  order,
  open,
  onClose,
  onViewFull,
}: Props) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{ url: string; id?: string }[]>([]);
  const [lightboxTitle, setLightboxTitle] = useState("");

  const handleImageClick = useCallback((images: { url: string; id?: string }[], itemName: string) => {
    setLightboxImages(images);
    setLightboxTitle(itemName);
    setLightboxOpen(true);
  }, []);

  /* ── MEMOIZED DATA NORMALIZATION ── */
  const items: OrderItem[] = useMemo(() => {
    const orderItems = order?.order_items;
    if (!orderItems) return [];

    return orderItems.map((item) => {
      const snapshot = item.furniture_snapshot;
      const snapshotData = snapshot as SnapshotLike | undefined;
      const rawDimensions = snapshotData?.dimensions;

      // Ensure historical row URLs and snapshot nested strings are perfectly cleaned 
      const rawUrl = item.model_snapshot_url || snapshotData?.model_url || snapshotData?.model_snapshot_url;
      const sanitizedModelUrl = typeof rawUrl === "string" ? rawUrl.trim() : undefined;

      return {
        ...item,
        model_snapshot_url: sanitizedModelUrl,
        furniture_snapshot: snapshot
          ? {
              id: snapshotData?.id ?? item.furniture_id,
              name: snapshotData?.name ?? undefined,
              description: snapshotData?.description ?? undefined,
              category: snapshotData?.category ?? undefined,
              base_price: snapshotData?.base_price ?? undefined,
              model_url: sanitizedModelUrl,
              width_cm: rawDimensions?.width_cm ?? snapshotData?.width_cm ?? undefined,
              depth_cm: rawDimensions?.depth_cm ?? snapshotData?.depth_cm ?? undefined,
              height_cm: rawDimensions?.height_cm ?? snapshotData?.height_cm ?? undefined,
              images: snapshotData?.images ?? undefined,
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
      } as OrderItem;
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

  if (!order?.id) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-0 sm:p-6 overflow-hidden"
      style={{
        zIndex: 99999,
        backgroundColor: "transparent",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.2s ease-in-out",
      }}
      onClick={onClose}
    >
      <div
        className={`relative w-full flex flex-col rounded-none sm:rounded-2xl h-screen sm:h-[calc(100vh-48px)] max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden border-0 sm:border border-white/[0.06] bg-[#0A0705]`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
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
          {items.map((item, index) => (
            <OrderItemViewer
              key={item.id}
              item={item}
              index={index}
              onImageClick={handleImageClick}
            />
          ))}

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

      <ImageLightbox
        images={lightboxImages}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={lightboxTitle}
      />
    </div>,
    document.body
  );
};

// Memoize the modal to prevent unnecessary re-renders from parent realtime updates
// Only re-render when order data actually used by the modal changes
export default memo(OrderFullDetailModalInner, (prevProps, nextProps) => {
  const prevOrder = prevProps.order;
  const nextOrder = nextProps.order;
  
  // If order ID changes, must re-render
  if (prevOrder.id !== nextOrder.id) return false;
  
  // If open state changes, must re-render
  if (prevProps.open !== nextProps.open) return false;
  
  // If onClose callback changes, must re-render
  if (prevProps.onClose !== nextProps.onClose) return false;
  
  // If onViewFull callback changes, must re-render
  if (prevProps.onViewFull !== nextProps.onViewFull) return false;
  
  // Check only the fields that the modal actually renders
  // Use optional chaining and nullish coalescing for safe comparison
  if ((prevOrder.order_reference_code ?? null) !== (nextOrder.order_reference_code ?? null)) return false;
  if ((prevOrder.created_at ?? null) !== (nextOrder.created_at ?? null)) return false;
  if ((prevOrder.customer_name ?? null) !== (nextOrder.customer_name ?? null)) return false;
  if ((prevOrder.delivery_method ?? null) !== (nextOrder.delivery_method ?? null)) return false;
  if ((prevOrder.phone_number ?? null) !== (nextOrder.phone_number ?? null)) return false;
  if ((prevOrder.pickup_location ?? null) !== (nextOrder.pickup_location ?? null)) return false;
  if ((prevOrder.delivery_address ?? null) !== (nextOrder.delivery_address ?? null)) return false;
  if (prevOrder.order_items !== nextOrder.order_items) return false;
  if ((prevOrder.quote_total_price ?? null) !== (nextOrder.quote_total_price ?? null)) return false;
  if ((prevOrder.charge_status ?? null) !== (nextOrder.charge_status ?? null)) return false;
  if ((prevOrder.final_total_price ?? null) !== (nextOrder.final_total_price ?? null)) return false;
  
  // If we get here, the modal doesn't need to re-render
  return true;
});