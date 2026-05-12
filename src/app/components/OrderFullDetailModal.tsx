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

  /**
   * =========================================================
   * NORMALIZE FOR UI (NULL → UNDEFINED CLEAN FIX)
   * =========================================================
   */
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

  /**
   * =========================================================
   * TOTALS
   * =========================================================
   */
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

      <div className="bg-white w-full max-w-7xl max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
          <div>
            <h2 className="text-lg font-semibold">
              Order #{order.order_reference_code}
            </h2>
            <p className="text-xs text-gray-500">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-2">
            {onViewFull && (
              <button
                onClick={onViewFull}
                className="text-xs px-3 py-1 rounded bg-[#8C593F] text-white"
              >
                View Full Order
              </button>
            )}

            <button
              onClick={onClose}
              className="text-sm px-2 py-1 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto p-6 space-y-8">

          {items.map((item, index) => {
            const snapshot = item.furniture_snapshot;
            const variant = item.variant_snapshot;

            const modelUrl =
              item.model_snapshot_url || snapshot?.model_url;

            if (!snapshot) {
              return (
                <div
                  key={item.id}
                  className="border rounded-xl p-4 text-sm text-gray-400"
                >
                  No snapshot for item {index + 1}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="border rounded-xl p-4 space-y-4 bg-white"
              >

                {/* HEADER */}
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    Item {index + 1} — {snapshot.name ?? "Unnamed"}
                  </h3>

                  <span className="text-xs text-gray-500">
                    x{item.quantity}
                  </span>
                </div>

                {/* CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* 3D VIEW */}
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center min-h-[300px]">
                    {modelUrl ? (
                      <Furniture3DViewer
                        modelUrl={modelUrl}
                        selectedVariantTextureUrl={
                          variant?.texture_url ?? undefined
                        }
                      />
                    ) : (
                      <div className="text-gray-400">
                        No 3D model available
                      </div>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="space-y-4">
                    <BasicInfoSection items={[item]} />
                    <AssetsSection items={[item]} />
                    <VariantsSection items={[item]} />
                  </div>

                </div>
              </div>
            );
          })}

          {/* SUMMARY */}
          <div className="border rounded-xl p-4 text-sm space-y-2">

            <div className="font-semibold">Order Summary</div>

            <div>Customer: {order.customer_name ?? "-"}</div>
            <div>Method: {order.delivery_method ?? "-"}</div>

            {order.delivery_method !== "pickup" && (
              <div>Phone: {order.phone_number ?? "-"}</div>
            )}

            {order.delivery_method === "pickup" ? (
              <div>
                Pickup Location: {order.pickup_location ?? "Store / Warehouse"}
              </div>
            ) : (
              <div>Address: {order.delivery_address ?? "-"}</div>
            )}

            <div className="pt-2 border-t mt-2 font-semibold">
              <div>Total Items: {totalItems}</div>
              <div>Total Price: ₱{totalPrice.toLocaleString()}</div>
            </div>

          </div>

          <button
            onClick={onClose}
            className="w-full bg-black text-white py-2 rounded-xl"
          >
            Close
          </button>

        </div>
      </div>
    </div>
  );
}