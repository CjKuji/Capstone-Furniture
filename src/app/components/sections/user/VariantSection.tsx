"use client";

import type { VariantUI } from "@/types/furniture-ui";

type Props = {
  variants: VariantUI[];
  activeVariantId: string | null;
  setActiveVariantId: (id: string | null) => void;
};

export default function VariantsSection({
  variants,
  activeVariantId,
  setActiveVariantId,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

      {/* HEADER */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Variants
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Apply a material to the 3D model • switch anytime
        </p>
      </div>

      {/* LIST */}
      <div className="space-y-3">

        {variants
          .filter((v) => !v.isDeleted)
          .map((v) => {
            const key = v.id ?? v.clientId;
            const isActive = activeVariantId === key;

            return (
              <div
                key={key}
                className={`w-full flex items-center gap-4 p-3 border rounded-xl transition
                  ${isActive
                    ? "border-[#8C593F] bg-[#FFF4EC]"
                    : "border-gray-200 hover:bg-gray-50"
                  }`}
              >

                {/* PREVIEW */}
                <div className="w-12 h-12 rounded-lg overflow-hidden border bg-white">
                  {v.previewUrl ? (
                    <img
                      src={v.previewUrl}
                      className="w-full h-full object-cover"
                      alt={v.name}
                    />
                  ) : (
                    <div className="text-[10px] text-gray-400 flex items-center justify-center h-full">
                      No Img
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {v.name}
                  </div>

                  <div className="text-xs text-gray-500">
                    {v.priceAdjustment
                      ? `+₱${v.priceAdjustment}`
                      : "No price change"}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2">

                  {/* APPLY / SWITCH */}
                  <button
                    type="button"
                    onClick={() => setActiveVariantId(key)}
                    className={`text-xs px-3 py-1 rounded-full border transition
                      ${isActive
                        ? "bg-[#8C593F] text-white border-[#8C593F]"
                        : "text-[#8C593F] border-[#8C593F] hover:bg-[#FFF4EC]"
                      }
                    `}
                  >
                    {isActive ? "Applied" : "Apply"}
                  </button>

                  {/* REMOVE */}
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => setActiveVariantId(null)}
                      className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
                      title="Remove variant"
                    >
                      ✕
                    </button>
                  )}

                </div>
              </div>
            );
          })}

      </div>
    </div>
  );
}