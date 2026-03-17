"use client";

import { useRouter } from "next/navigation";
import type { FurnitureItemAdmin } from "../../types/furniture";

interface Props {
  item: FurnitureItemAdmin;
}

export default function CustomerFurnitureCard({ item }: Props) {
  const router = useRouter();

  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition flex flex-col cursor-pointer"
      onClick={() => router.push(`/pages/furniture/${item.id}`)}
    >
      {/* IMAGE */}
      <img
        src={item.thumbnail_url ?? "/placeholder.png"}
        alt={item.name}
        className="w-full h-64 object-cover"
      />

      {/* DETAILS */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-xl font-semibold">{item.name}</h3>

        <p className="text-[#6B584B] mt-2 line-clamp-3">
          {item.description ?? "No description available"}
        </p>

        <div className="mt-4 text-sm text-[#6B584B] space-y-1">
          <div>Size: {item.size ?? "medium"}</div>
          <div>Material: {item.material?.name ?? "Unknown"}</div>
          <div>
            Color{" "}
            <span
              className="inline-block w-4 h-4 rounded-full border"
              style={{ backgroundColor: item.color?.hex_code ?? "#ffffff" }}
            />{" "}
            {item.color?.name ?? "Unknown"}
          </div>
          <div>Category: {item.category?.name ?? "Uncategorized"}</div>
        </div>

        <button
          type="button"
          className="mt-6 py-3 bg-[#A16B4C] text-white rounded-lg hover:bg-[#8C593F] transition"
        >
          View Furniture
        </button>
      </div>
    </div>
  );
}