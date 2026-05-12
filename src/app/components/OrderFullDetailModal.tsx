"use client";

import { useMemo } from "react";
import type { Order, OrderItem } from "@/types/order";

import BasicInfoSection from "@/app/components/sections/orders/BasicInfoSection";
import AssetsSection from "@/app/components/sections/orders/AssetsSection";
import VariantsSection from "@/app/components/sections/orders/VariantsSection";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";

type Props = {
  order: Order;
  open: boolean;
  onClose: () => void;
  onViewFull?: () => void;
};

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
            id: item.furniture_snapshot.id,
            name: item.furniture_snapshot.name ?? undefined,
            description: item.furniture_snapshot.description ?? undefined,
            category: item.furniture_snapshot.category ?? undefined,
            base_price: item.furniture_snapshot.base_price ?? undefined,
            model_url: item.furniture_snapshot.model_url ?? undefined,
            width_cm: item.furniture_snapshot.width_cm ?? undefined,
            depth_cm: item.furniture_snapshot.depth_cm ?? undefined,
            height_cm: item.furniture_snapshot.height_cm ?? undefined,
            images: item.furniture_snapshot.images ?? undefined,
          }
        : undefined,

      variant_snapshot: item.variant_snapshot
        ? {
            id: item.variant_snapshot.id,
            name: item.variant_snapshot.name ?? undefined,
            texture_url: item.variant_snapshot.texture_url ?? undefined,
            preview_image_url:
              item.variant_snapshot.preview_image_url ?? undefined,
            price_adjustment:
              item.variant_snapshot.price_adjustment ?? undefined,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="bg-[#FAF6F1] w-full max-w-7xl max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* =========================================================
           HEADER (studio style)
        ========================================================= */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E8D7C8] bg-white">

          <div>
            <h2 className="text-lg font-semibold text-[#3A2B22]">
              Order #{order.order_reference_code}
            </h2>
            <p className="text-xs text-[#7A6A5A]">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-2">

            {onViewFull && (
              <button
                onClick={onViewFull}
                className="text-xs px-3 py-1 rounded-xl bg-[#7A4E2D] text-white hover:bg-[#663D22] transition"
              >
                Full View
              </button>
            )}

            <button
              onClick={onClose}
              className="text-sm px-3 py-1 rounded-xl hover:bg-[#F0E2D6] transition text-[#3A2B22]"
            >
              ✕
            </button>

          </div>
        </div>

        {/* =========================================================
           BODY
        ========================================================= */}
        <div className="overflow-y-auto p-6 space-y-10">

          {/* =======================================================
             ITEMS
          ======================================================= */}
          {items.map((item, index) => {
            const snapshot = item.furniture_snapshot;
            const variant = item.variant_snapshot;

            const modelUrl =
              item.model_snapshot_url || snapshot?.model_url;

            if (!snapshot) {
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#E8D7C8] bg-white p-4 text-sm text-[#7A6A5A]"
                >
                  No snapshot for item {index + 1}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-[#E8D7C8] bg-white overflow-hidden shadow-sm"
              >

                {/* ITEM HEADER */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-[#F0E2D6]">

                  <h3 className="font-semibold text-[#3A2B22]">
                    {snapshot.name ?? "Unnamed"} × {item.quantity}
                  </h3>

                  <span className="text-xs text-[#7A6A5A]">
                    Item {index + 1}
                  </span>

                </div>

                {/* ITEM BODY */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">

                  {/* 3D VIEWER (highlighted like product hero) */}
                  <div className="rounded-2xl bg-[#FAF6F1] border border-[#E8D7C8] flex items-center justify-center min-h-[320px] p-3">

                    {modelUrl ? (
                      <Furniture3DViewer
                        modelUrl={modelUrl}
                        selectedVariantTextureUrl={variant?.texture_url}
                      />
                    ) : (
                      <div className="text-[#7A6A5A] text-sm">
                        No 3D model available
                      </div>
                    )}

                  </div>

                  {/* DETAILS */}
                  <div className="space-y-5">

                    <BasicInfoSection items={[item]} />
                    <AssetsSection items={[item]} />
                    <VariantsSection items={[item]} />

                  </div>

                </div>
              </div>
            );
          })}

          {/* =======================================================
             ORDER SUMMARY (premium card style)
          ======================================================= */}
          <div className="rounded-2xl border border-[#E8D7C8] bg-white p-6 space-y-3">

            <h3 className="font-semibold text-[#3A2B22]">
              Order Summary
            </h3>

            <div className="text-sm text-[#7A6A5A] space-y-1">

              <div className="flex justify-between">
                <span>Customer</span>
                <span className="text-[#3A2B22] font-medium">
                  {order.customer_name ?? "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Method</span>
                <span className="text-[#3A2B22] font-medium capitalize">
                  {order.delivery_method ?? "-"}
                </span>
              </div>

              {order.delivery_method !== "pickup" && (
                <div className="flex justify-between">
                  <span>Phone</span>
                  <span className="text-[#3A2B22] font-medium">
                    {order.phone_number ?? "-"}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>
                  {order.delivery_method === "pickup" ? "Pickup" : "Address"}
                </span>
                <span className="text-[#3A2B22] font-medium text-right max-w-[60%]">
                  {order.delivery_method === "pickup"
                    ? order.pickup_location ?? "Store / Warehouse"
                    : order.delivery_address ?? "-"}
                </span>
              </div>

            </div>

            <div className="border-t border-[#F0E2D6] pt-3 flex justify-between font-semibold text-[#3A2B22]">
              <span>Total Items: {totalItems}</span>
              <span>₱{totalPrice.toLocaleString()}</span>
            </div>

          </div>

          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#3A2B22] text-white py-3 hover:bg-black transition"
          >
            Close
          </button>

        </div>
      </div>
    </div>
  );
}