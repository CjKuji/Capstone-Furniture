"use client";

import { useMemo } from "react";
import type { Order, OrderItem } from "@/types/order";

import BasicInfoSection from "@/app/components/sections/orders/BasicInfoSection";
import AssetsSection from "@/app/components/sections/orders/AssetsSection";
import VariantsSection from "@/app/components/sections/orders/VariantsSection";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";

/* ========================================================= */

type Props = {
  order: Order;
  open: boolean;
  onClose: () => void;
  onViewFull?: () => void;
};

/* ========================================================= */

export default function OrderFullDetailModal({
  order,
  open,
  onClose,
  onViewFull,
}: Props) {

  const items: OrderItem[] = useMemo(() => {
    return (order.order_items ?? []).map((item) => ({
      ...item,

      furniture_snapshot: item.furniture_snapshot
        ? {
            id:          item.furniture_snapshot.id,
            name:        item.furniture_snapshot.name        ?? undefined,
            description: item.furniture_snapshot.description ?? undefined,
            category:    item.furniture_snapshot.category    ?? undefined,
            base_price:  item.furniture_snapshot.base_price  ?? undefined,
            model_url:   item.furniture_snapshot.model_url   ?? undefined,
            width_cm:    item.furniture_snapshot.width_cm    ?? undefined,
            depth_cm:    item.furniture_snapshot.depth_cm    ?? undefined,
            height_cm:   item.furniture_snapshot.height_cm   ?? undefined,
            images:      item.furniture_snapshot.images      ?? undefined,
          }
        : undefined,

      variant_snapshot: item.variant_snapshot
        ? {
            id:                item.variant_snapshot.id,
            name:              item.variant_snapshot.name              ?? undefined,
            texture_url:       item.variant_snapshot.texture_url       ?? undefined,
            preview_image_url: item.variant_snapshot.preview_image_url ?? undefined,
            price_adjustment:  item.variant_snapshot.price_adjustment  ?? undefined,
          }
        : undefined,
    }));
  }, [order.order_items]);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity ?? 0), 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + (i.total_price ?? 0), 0),
    [items]
  );

  if (!open) return null;

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

      <div
        className="w-full max-w-7xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: "#120C07", border: "1px solid rgba(212,169,122,0.15)" }}
      >

        {/* ── HEADER ── */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Order #{order.order_reference_code}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(212,169,122,0.5)" }}>
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onViewFull && (
              <button
                onClick={onViewFull}
                className="text-xs px-3 py-1.5 rounded-xl font-medium transition"
                style={{
                  background: "rgba(212,169,122,0.12)",
                  color: "#D4A97A",
                  border: "1px solid rgba(212,169,122,0.2)",
                }}
              >
                Full View
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="overflow-y-auto p-6 space-y-8">

          {/* ── ORDER ITEMS ── */}
          {items.map((item, index) => {
            const snapshot = item.furniture_snapshot;
            const variant  = item.variant_snapshot;
            const modelUrl = item.model_snapshot_url || snapshot?.model_url;

            if (!snapshot) {
              return (
                <div
                  key={item.id}
                  className="rounded-xl p-4 text-sm"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  No snapshot for item {index + 1}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >

                {/* ITEM HEADER */}
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
                    <h3 className="text-sm font-semibold text-white">
                      {snapshot.name ?? "Unnamed"} × {item.quantity}
                    </h3>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(212,169,122,0.1)",
                      color: "rgba(212,169,122,0.6)",
                      border: "1px solid rgba(212,169,122,0.15)",
                    }}
                  >
                    Item {index + 1}
                  </span>
                </div>

                {/* ITEM BODY */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5">

                  {/* 3D VIEWER */}
                  <div
                    className="rounded-2xl flex items-center justify-center min-h-[320px] overflow-hidden"
                    style={{
                      background: "#0F0A06",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    {modelUrl ? (
                      <Furniture3DViewer
                        modelUrl={modelUrl}
                        selectedVariantTextureUrl={variant?.texture_url}
                      />
                    ) : (
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>
                        No 3D model available
                      </p>
                    )}
                  </div>

                  {/* DETAIL SECTIONS */}
                  <div className="space-y-4">
                    <BasicInfoSection items={[item]} />
                    <AssetsSection    items={[item]} />
                    <VariantsSection  items={[item]} />
                  </div>

                </div>
              </div>
            );
          })}

          {/* ── ORDER SUMMARY ── */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >

            <div className="flex items-center gap-3">
              <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
              <h3 className="text-sm font-semibold text-white">Order Summary</h3>
            </div>

            <div className="space-y-2">
              {[
                { label: "Customer",  value: order.customer_name },
                { label: "Method",    value: order.delivery_method },
                ...(order.delivery_method !== "pickup"
                  ? [{ label: "Phone", value: order.phone_number }]
                  : []),
                {
                  label: order.delivery_method === "pickup" ? "Pickup" : "Address",
                  value: order.delivery_method === "pickup"
                    ? (order.pickup_location ?? "Store / Warehouse")
                    : order.delivery_address,
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-6">
                  <span className="text-xs text-white/35 shrink-0">{label}</span>
                  <span className="text-xs font-medium text-white/75 text-right capitalize">
                    {value ?? "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div
              className="flex justify-between items-center pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-sm text-white/50">
                Total Items: <span className="text-white font-semibold">{totalItems}</span>
              </span>
              <span className="text-lg font-bold" style={{ color: "#D4A97A" }}>
                ₱{totalPrice.toLocaleString()}
              </span>
            </div>

          </div>

          {/* ── CLOSE ── */}
          <button
            onClick={onClose}
            className="w-full rounded-xl py-3 text-sm font-semibold transition"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Close
          </button>

        </div>
      </div>
    </div>
  );
}