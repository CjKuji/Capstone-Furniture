"use client";

import type { FurnitureCategory } from "@/types/furniture";

/* ========================================================= */

type BasicInfoState = {
  name: string;
  description: string;
  categoryId: string | null;
  basePrice: number | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
};

/* ========================================================= */

type Props = {
  state: BasicInfoState;
  categories: FurnitureCategory[];
};

/* ========================================================= */

export default function BasicInfoSection({
  state,
  categories,
}: Props) {
  /* Resolve category safely */
  const categoryName =
    categories.find((c) => c.id === state.categoryId)?.name ??
    "Uncategorized";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

      {/* HEADER */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Furniture Details
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          View product information
        </p>
      </div>

      {/* NAME */}
      <div>
        <label className="text-xs font-medium text-gray-600">
          Name
        </label>

        <input
          value={state.name}
          readOnly
          className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50"
        />
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="text-xs font-medium text-gray-600">
          Description
        </label>

        <textarea
          value={state.description}
          readOnly
          rows={4}
          className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 resize-none"
        />
      </div>

      {/* CATEGORY + PRICE */}
      <div className="grid grid-cols-2 gap-4">

        <div>
          <label className="text-xs font-medium text-gray-600">
            Category
          </label>

          <input
            value={categoryName}
            readOnly
            className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">
            Base Price
          </label>

          <input
            value={state.basePrice ?? 0}
            readOnly
            className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50"
          />
        </div>

      </div>

      {/* DIMENSIONS */}
      <div>
        <label className="text-xs font-medium text-gray-600">
          Dimensions (cm)
        </label>

        <div className="grid grid-cols-3 gap-3 mt-2">

          <input
            value={state.widthCm ?? "-"}
            readOnly
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50"
          />

          <input
            value={state.depthCm ?? "-"}
            readOnly
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50"
          />

          <input
            value={state.heightCm ?? "-"}
            readOnly
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50"
          />

        </div>
      </div>

    </div>
  );
}