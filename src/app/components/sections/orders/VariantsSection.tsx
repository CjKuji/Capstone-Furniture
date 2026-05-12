"use client";

import { useState } from "react";

/**
 * =========================================================
 * UI-SAFE TYPES (MATCH order.ts SNAPSHOT STYLE)
 * =========================================================
 */
type VariantSnapshot = {
  id: string;
  name?: string;
  preview_image_url?: string | null;
  texture_url?: string | null;
  price_adjustment?: number | null;
};

type OrderItem = {
  id: string;

  variant_snapshot?: VariantSnapshot | null;

  furniture_snapshot?: {
    name?: string | null;
  } | null;
};

type Props = {
  items?: OrderItem[] | null;

  onApplyVariant?: (
    itemId: string,
    variant: VariantSnapshot | null
  ) => void;
};

export default function OrderVariantsSection({
  items,
  onApplyVariant,
}: Props) {
  const safeItems = Array.isArray(items) ? items : [];

  /**
   * Track selected variant per item
   */
  const [activeVariants, setActiveVariants] = useState<
    Record<string, string | null>
  >({});

  if (!safeItems.length) {
    return (
      <div className="border rounded-xl p-4 text-sm text-gray-400">
        No variant snapshot available
      </div>
    );
  }

  const handleApply = (
    item: OrderItem,
    variant: VariantSnapshot | null
  ) => {
    setActiveVariants((prev) => ({
      ...prev,
      [item.id]: variant?.id ?? null,
    }));

    onApplyVariant?.(item.id, variant);
  };

  return (
    <div className="border rounded-xl p-4 space-y-6">

      {/* HEADER */}
      <div>
        <h3 className="font-semibold">Variant Snapshot</h3>
        <p className="text-xs text-gray-500">
          Apply variants for preview (locked from order snapshot)
        </p>
      </div>

      {/* ITEMS */}
      {safeItems.map((item, index) => {
        const snapshot = item.variant_snapshot;

        const isActive =
          activeVariants[item.id] === snapshot?.id;

        return (
          <div key={item.id} className="space-y-3">

            {/* ITEM HEADER */}
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold">
                Item {index + 1}
              </p>

              <p className="text-xs text-gray-500">
                {item.furniture_snapshot?.name ?? "Unnamed Item"}
              </p>
            </div>

            {/* VARIANT BLOCK */}
            {!snapshot ? (
              <div className="text-sm text-gray-400">
                No variant snapshot for this item
              </div>
            ) : (
              <div
                className={`flex items-center gap-4 p-3 border rounded-xl transition ${
                  isActive
                    ? "border-black bg-gray-100"
                    : "bg-gray-50"
                }`}
              >

                {/* IMAGE */}
                <div className="w-12 h-12 rounded overflow-hidden border bg-white">
                  {snapshot.preview_image_url ? (
                    <img
                      src={snapshot.preview_image_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-[10px] text-gray-400 flex items-center justify-center h-full">
                      No Img
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {snapshot.name ?? "Unnamed Variant"}
                  </div>

                  <div className="text-xs text-gray-500">
                    {snapshot.price_adjustment
                      ? `+₱${Number(
                          snapshot.price_adjustment
                        ).toLocaleString()}`
                      : "No price change"}
                  </div>
                </div>

                {/* ACTION */}
                <button
                  onClick={() =>
                    handleApply(
                      item,
                      isActive ? null : snapshot
                    )
                  }
                  className={`text-xs px-3 py-1 rounded border transition ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {isActive ? "Applied" : "Apply"}
                </button>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}