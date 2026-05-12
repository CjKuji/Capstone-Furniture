"use client";

import { useState } from "react";

type VariantSnapshot = {
  id: string;
  name?: string;
  preview_image_url?: string | null;
  price_adjustment?: number | null;
};

type OrderItem = {
  id: string;
  variant_snapshot?: VariantSnapshot | null;
  furniture_snapshot?: { name?: string } | null;
};

type Props = {
  items?: OrderItem[] | null;
  onApplyVariant?: (itemId: string, variant: VariantSnapshot | null) => void;
};

export default function OrderVariantsSection({
  items,
  onApplyVariant,
}: Props) {
  const safe = Array.isArray(items) ? items : [];

  const [active, setActive] = useState<Record<string, string | null>>({});

  if (!safe.length) {
    return (
      <div className="rounded-2xl bg-white p-5 text-sm text-gray-400">
        No variants available
      </div>
    );
  }

  const apply = (item: OrderItem, v: VariantSnapshot | null) => {
    setActive((p) => ({
      ...p,
      [item.id]: v?.id ?? null,
    }));

    onApplyVariant?.(item.id, v);
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E8D7C8] p-5 space-y-6">

      {/* HEADER */}
      <div>
        <h3 className="font-semibold text-[#3A2B22]">
          Variants
        </h3>
        <p className="text-xs text-[#7A6A5A]">
          Preview selectable finishes
        </p>
      </div>

      {safe.map((item, i) => {
        const v = item.variant_snapshot;
        const isActive = active[item.id] === v?.id;

        return (
          <div key={item.id} className="space-y-3">

            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#3A2B22]">
                Item {i + 1}
              </span>
              <span className="text-[#7A6A5A]">
                {item.furniture_snapshot?.name ?? "Unnamed"}
              </span>
            </div>

            {!v ? (
              <div className="text-sm text-gray-400">
                No variant available
              </div>
            ) : (
              <div
                className={`flex items-center gap-4 p-3 rounded-xl border transition ${
                  isActive
                    ? "border-[#3A2B22] bg-[#F3E6DA]"
                    : "border-[#E8D7C8] bg-[#FAF6F1]"
                }`}
              >

                <img
                  src={v.preview_image_url ?? ""}
                  className="w-12 h-12 rounded-lg object-cover bg-white border"
                />

                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {v.name}
                  </p>

                  <p className="text-xs text-[#7A6A5A]">
                    {v.price_adjustment
                      ? `+₱${v.price_adjustment.toLocaleString()}`
                      : "No adjustment"}
                  </p>
                </div>

                <button
                  onClick={() => apply(item, isActive ? null : v)}
                  className="text-xs px-3 py-1 rounded-lg bg-[#3A2B22] text-white hover:bg-black"
                >
                  {isActive ? "Remove" : "Apply"}
                </button>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}