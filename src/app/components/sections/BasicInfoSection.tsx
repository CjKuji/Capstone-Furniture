"use client";

import type { FurnitureCategory } from "@/types/furniture";

/* ========================================================= */

type BasicInfoState = {
  name: string;
  description: string;
  categoryId: string;
  basePrice: number | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
};

/* ========================================================= */

type Props = {
  state: BasicInfoState;

  setField: <K extends keyof BasicInfoState>(
    key: K,
    value: BasicInfoState[K]
  ) => void;

  categories: FurnitureCategory[];
};

/* ========================================================= */

export default function BasicInfoSection({
  state,
  setField,
  categories,
}: Props) {
  const {
    name,
    description,
    categoryId,
    basePrice,
    widthCm,
    depthCm,
    heightCm,
  } = state;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

      {/* HEADER */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Basic Information
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Core product details and pricing
        </p>
      </div>

      <div className="space-y-4">

        {/* NAME */}
        <div>
          <label className="text-xs font-medium text-gray-600">
            Furniture Name
          </label>
          <input
            value={name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Premium Sofa"
            className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-xs font-medium text-gray-600">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setField("description", e.target.value)}
            rows={4}
            placeholder="Short description of the furniture..."
            className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* CATEGORY + PRICE */}
        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="text-xs font-medium text-gray-600">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
              className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              Base Price
            </label>
            <input
              type="number"
              value={basePrice ?? ""}
              onChange={(e) =>
                setField(
                  "basePrice",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              placeholder="0.00"
              className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

        </div>

        {/* DIMENSIONS */}
        <div>
          <label className="text-xs font-medium text-gray-600">
            Dimensions (W × D × H cm)
          </label>

          <div className="grid grid-cols-3 gap-3 mt-2">

            <input
              type="number"
              value={widthCm ?? ""}
              onChange={(e) =>
                setField(
                  "widthCm",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              placeholder="Width"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <input
              type="number"
              value={depthCm ?? ""}
              onChange={(e) =>
                setField(
                  "depthCm",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              placeholder="Depth"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <input
              type="number"
              value={heightCm ?? ""}
              onChange={(e) =>
                setField(
                  "heightCm",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              placeholder="Height"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />

          </div>
        </div>

      </div>
    </div>
  );
}