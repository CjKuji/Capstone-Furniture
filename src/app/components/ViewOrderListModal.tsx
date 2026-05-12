"use client";

import { useState } from "react";
import type { Order } from "@/types/order";

import OrderFullDetailModal from "@/app/components/OrderFullDetailModal";

type Props = {
  open: boolean;
  onClose: () => void;
  order: Order;
};

export default function ViewOrderListModal({
  open,
  onClose,
  order,
}: Props) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);

  if (!open) return null;

  const items = order.order_items ?? [];

  const handleViewItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowFull(true);
  };

  return (
    <>
      {/* =====================================================
          LIST MODAL
      ====================================================== */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-6">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Order Items ({items.length})
            </h2>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* LIST */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {items.map((item) => {
              const furniture = item.furniture_snapshot;
              const variant = item.variant_snapshot;

              return (
                <div
                  key={item.id}
                  className="border rounded-xl p-3 flex justify-between items-start"
                >
                  {/* LEFT */}
                  <div>
                    <p className="font-semibold text-sm">
                      {furniture?.name || "Item"}
                    </p>

                    {variant?.name && (
                      <p className="text-xs text-gray-500">
                        {variant.name}
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  {/* RIGHT */}
                  <div className="text-right space-y-2">
                    <p className="font-semibold text-sm">
                      ₱{Number(item.total_price ?? 0).toLocaleString()}
                    </p>

                    {/* VIEW BUTTON PER ITEM */}
                    <button
                      onClick={() => handleViewItem(item.id)}
                      className="text-xs px-3 py-1 bg-[#8C593F] text-white rounded hover:opacity-90"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FOOTER */}
          <div className="mt-5 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          FULL DETAIL MODAL (FOCUSED ITEM)
      ====================================================== */}
      {showFull && (
        <OrderFullDetailModal
          open={showFull}
          onClose={() => setShowFull(false)}
          order={order}
        />
      )}
    </>
  );
}