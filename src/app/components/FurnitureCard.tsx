"use client";

import { Edit, Trash2, Eye } from "lucide-react";
import type { FurnitureItemAdmin } from "../../types/furniture";

interface FurnitureCardProps {
  item: FurnitureItemAdmin;
  onEdit: (item: FurnitureItemAdmin) => void;
  onDelete: (id: string) => void;
  onView: (url: string) => void;
}

export default function AdminFurnitureCard({ item, onEdit, onDelete, onView }: FurnitureCardProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition duration-300 overflow-hidden flex flex-col border border-gray-200">

      {/* IMAGE + DELETE ICON */}
      <div className="relative h-64 w-full">
        <img
          src={item.thumbnail_url ?? "/placeholder.png"}
          alt={item.name || "Furniture Thumbnail"}
          className="w-full h-full object-cover"
        />

        {/* DELETE BUTTON top-right */}
        <button
          type="button"
          aria-label="Delete furniture"
          onClick={() => onDelete(item.id)}
          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg shadow-lg hover:bg-red-700 transition"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* DETAILS */}
      <div className="p-6 flex flex-col flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h2>
        <p className="text-gray-700 text-sm mb-5 line-clamp-3">
          {item.description ?? "No description available."}
        </p>

        <div className="flex flex-wrap gap-4 mb-6 text-gray-600 text-sm">
          {item.size_numeric && (
            <span>
              <strong>Size:</strong> {item.size_numeric} m
            </span>
          )}
          {item.material?.name && (
            <span>
              <strong>Material:</strong> {item.material.name}
            </span>
          )}
          {item.color?.name && (
            <span className="flex items-center gap-1">
              <strong>Color:</strong>
              <span
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: item.color.hex_code }}
              />
              {item.color.name}
            </span>
          )}
          {item.category?.name && (
            <span>
              <strong>Category:</strong> {item.category.name}
            </span>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-auto flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => onView(item.model_url)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            <Eye size={16} /> View 3D
          </button>

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition"
          >
            <Edit size={16} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}