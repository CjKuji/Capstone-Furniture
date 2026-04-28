"use client";

import { useState, useMemo } from "react";
import type { Order } from "@/types/order";

import BasicInfoSection from "@/app/components/sections/orders/BasicInfoSection";
import AssetsSection from "@/app/components/sections/orders/AssetsSection";
import VariantsSection from "@/app/components/sections/orders/VariantsSection";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";

type Props = {
  order: Order;
  open: boolean;
  onClose: () => void;
};

export default function OrderFullDetailModal({
  order,
  open,
  onClose,
}: Props) {
  /**
   * =========================================================
   * ALL HOOKS ALWAYS RUN FIRST (MANDATORY RULE)
   * =========================================================
   */

  const mappedItems = useMemo(() => {
    const items = Array.isArray(order.order_items)
      ? order.order_items
      : [];

    return items.map((item) => ({
      id: item.id,
      furniture: item.furniture_snapshot,
      variant: item.variant_snapshot,
      modelUrl: item.model_snapshot_url,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
    }));
  }, [order.order_items]);

  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const activeItem = useMemo(() => {
    if (!mappedItems.length) return null;
    if (!activeItemId) return mappedItems[0];

    return (
      mappedItems.find((i) => i.id === activeItemId) ??
      mappedItems[0]
    );
  }, [mappedItems, activeItemId]);

  const basicInfoState = activeItem?.furniture
    ? {
        id: activeItem.furniture.id,
        name: activeItem.furniture.name ?? "—",
        description:
          activeItem.furniture.description ??
          `Order ${order.order_reference_code} • Status: ${order.status}`,

        category: activeItem.furniture.category ?? "Furniture",
        base_price: activeItem.furniture.base_price ?? 0,

        width_cm: activeItem.furniture.width_cm ?? null,
        depth_cm: activeItem.furniture.depth_cm ?? null,
        height_cm: activeItem.furniture.height_cm ?? null,

        model_url: activeItem.furniture.model_url ?? null,
      }
    : null;

  const images = mappedItems.flatMap((item) => {
    const imgs = item.furniture?.images;
    if (!Array.isArray(imgs)) return [];

    return imgs.map((img, idx) => ({
      id: `${item.id}-${idx}`,
      url: img.url,
      isPrimary: img.isPrimary ?? false,
    }));
  });

  const variants = useMemo(() => {
    return mappedItems
      .filter((item) => item.variant)
      .map((item, index) => {
        const v = item.variant;

        return {
          id: item.id,
          clientId: item.id,
          name: v?.name ?? "Variant",

          texture_url: v?.texture_url ?? null,
          preview_image_url: v?.preview_image_url ?? null,

          price_adjustment: Number(v?.price_adjustment ?? 0),

          isActive: true,
          isDeleted: false,
          isDefault: index === 0,
        };
      });
  }, [mappedItems]);

  const totalItems = mappedItems.reduce(
    (sum, i) => sum + (i.quantity ?? 0),
    0
  );

  const totalPrice = mappedItems.reduce(
    (sum, i) => sum + (i.totalPrice ?? 0),
    0
  );

  /**
   * =========================================================
   * NOW SAFE TO CONDITIONALLY RENDER
   * =========================================================
   */
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              Order #{order.order_reference_code}
            </h2>

            <p className="text-xs text-gray-500">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <button onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">

          {/* LEFT: BASE MODEL ONLY */}
          <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-center min-h-[500px]">
            {activeItem?.furniture?.model_url ? (
              <Furniture3DViewer
                modelUrl={activeItem.furniture.model_url}
                selectedVariantTextureUrl={null}
              />
            ) : (
              <div className="text-gray-400">
                No 3D model available for this item
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-6 overflow-y-auto">

            {mappedItems.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {mappedItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveItemId(item.id)}
                    className={`px-3 py-1 text-xs rounded border ${
                      activeItem?.id === item.id
                        ? "bg-black text-white"
                        : "bg-white"
                    }`}
                  >
                    Item {item.quantity}
                  </button>
                ))}
              </div>
            )}

            <BasicInfoSection snapshot={basicInfoState} />
            <AssetsSection images={images} />

            <VariantsSection
              variants={variants}
              activeVariantId={activeItem?.variant?.id ?? null}
              setActiveVariantId={() => {}}
            />

           <div className="border rounded-xl p-4 text-sm space-y-2">
  <div className="font-semibold">Order Summary</div>

  <div>Customer: {order.customer_name ?? "-"}</div>

  <div>Method: {order.delivery_method ?? "-"}</div>

  {/* PHONE ONLY FOR DELIVERY */}
  {order.delivery_method !== "pickup" && (
    <div>Phone: {order.phone_number ?? "-"}</div>
  )}

  {/* DELIVERY vs PICKUP CONDITIONAL */}
  {order.delivery_method === "pickup" ? (
    <div>
      Pickup Location: {order.pickup_location ?? "Store / Warehouse"}
    </div>
  ) : (
    <div>Address: {order.delivery_address ?? "-"}</div>
  )}

  <div className="pt-2 border-t mt-2">
    <div>Total Items: {totalItems}</div>
    <div>Total Price: ₱{totalPrice.toLocaleString()}</div>
  </div>
</div>

            <button
              onClick={onClose}
              className="w-full bg-black text-white py-2 rounded"
            >
              Close
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}