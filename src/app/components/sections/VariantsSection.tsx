"use client";

import type { VariantUI } from "@/types/furniture-ui";

/* ========================================================= */

type VariantKeyed = {
  id?: string;
  clientId: string;
};

/* ========================================================= */

type Props = {
  variants: VariantUI[];

  addVariant: () => void;

  updateVariant: <K extends keyof VariantUI>(
    key: string,
    field: K,
    value: VariantUI[K]
  ) => void;

  removeVariant: (key: string) => void;

  setActiveVariantId: (id: string) => void;
  activeVariantId: string | null;

  handleVariantFile: (key: string, file: File | null) => void;

  getKey: (v: VariantKeyed) => string;
};

/* ========================================================= */

export default function VariantsSection({
  variants,
  addVariant,
  updateVariant,
  removeVariant,
  setActiveVariantId,
  activeVariantId,
  handleVariantFile,
  getKey,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Variants
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Optional materials / texture overrides
          </p>
        </div>

        <button
          onClick={addVariant}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
        >
          + Add Variant
        </button>

      </div>

      {/* LIST */}
      <div className="space-y-4">

        {variants
          .filter((v) => !v.isDeleted)
          .map((v) => {
            const key = getKey(v);

            const preview =
              v.previewUrl ||
              v.texture_url ||
              v.textureUrl;

            return (
              <div
                key={key}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex gap-4"
              >

                {/* PREVIEW */}
                <div className="w-14 h-14 rounded-xl border bg-white overflow-hidden flex items-center justify-center">

                  {preview ? (
                    <img
                      src={preview}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      No Img
                    </span>
                  )}

                </div>

                {/* FIELDS */}
                <div className="flex-1 space-y-3">

                  {/* NAME */}
                  <input
                    value={v.name}
                    onChange={(e) =>
                      updateVariant(key, "name", e.target.value)
                    }
                    placeholder="Variant name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                  {/* PRICE */}
                  <input
                    type="number"
                    value={v.priceAdjustment ?? ""}
                    onChange={(e) =>
                      updateVariant(
                        key,
                        "priceAdjustment",
                        e.target.value === ""
                          ? null
                          : Number(e.target.value)
                      )
                    }
                    placeholder="Add price"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                  {/* FILE */}
                  <input
                    type="file"
                    onChange={(e) =>
                      handleVariantFile(
                        key,
                        e.target.files?.[0] ?? null
                      )
                    }
                    className="w-full text-sm"
                  />

                </div>

                {/* ACTIONS */}
                <div className="flex flex-col gap-2">

                  <button
                    type="button"
                    onClick={() => setActiveVariantId(key)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                      activeVariantId === key
                        ? "bg-green-100 text-green-700"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Apply
                  </button>

                  <button
                    onClick={() => removeVariant(key)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>

                </div>

              </div>
            );
          })}

      </div>

    </div>
  );
}