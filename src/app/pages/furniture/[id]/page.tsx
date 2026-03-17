"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { FurnitureItemAdmin, FurnitureSize } from "@/types/furniture";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";

// ---------------- SIZE MAPPING ----------------
const sizeMap: Record<FurnitureSize, number> = {
  small: 0.5,
  medium: 2,
  large: 3,
};

function mapSizeToNumber(size: FurnitureSize | null | undefined): number | null {
  if (!size) return null;
  return sizeMap[size];
}

// ---------------- DEBUG LOGGER ----------------
const sendDebug = async (message: string) => {
  try {
    await fetch("/api/ar-debug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (err) {
    console.error("Debug send failed", err);
  }
};

// ---------------- PAGE COMPONENT ----------------
export default function FurnitureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const furnitureId = params?.id as string;

  const [furniture, setFurniture] = useState<FurnitureItemAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [size, setSize] = useState<FurnitureSize>("medium");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Mobi|Android/i.test(navigator.userAgent);

  // ---------------- FETCH FURNITURE ----------------
  useEffect(() => {
    const fetchFurniture = async () => {
      try {
        const { data, error } = await supabase
          .from("furniture")
          .select(`
            *,
            material:material_id(id,name),
            color:color_id(id,name,hex_code),
            category:category_id(id,name)
          `)
          .eq("id", furnitureId)
          .single();

        if (error) throw error;
        if (!data) return setFurniture(null);

        const materialRelation = data.material?.[0] ?? undefined;
        const colorRelation = data.color?.[0] ?? undefined;
        const categoryRelation = data.category?.[0] ?? undefined;
        const sizeNumeric = mapSizeToNumber(data.size ?? null);

        setFurniture({
          ...data,
          size: data.size ?? "medium",
          size_numeric: sizeNumeric,
          material: materialRelation,
          color: colorRelation,
          category: categoryRelation,
        });

        setSize(data.size ?? "medium");

        sendDebug("Furniture loaded: " + data.name);
      } catch (err) {
        console.error("Failed to fetch furniture:", err);
        sendDebug("Furniture fetch error");
        setFurniture(null);
      } finally {
        setLoading(false);
      }
    };

    if (furnitureId) fetchFurniture();
  }, [furnitureId]);

  // ---------------- PLACE ORDER ----------------
  const handleOrder = async () => {
    if (!furniture) return;
    setOrdering(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to place an order.");
      setOrdering(false);
      return;
    }

    try {
      const { data: configData, error: configError } = await supabase
        .from("furniture_configurations")
        .insert({
          user_id: user.id,
          furniture_id: furniture.id,
          selected_size: size,
          selected_color_id: furniture.color?.id ?? null,
          selected_material_id: furniture.material?.id ?? null,
        })
        .select()
        .single();

      if (configError) throw configError;

      const { error: orderError } = await supabase
        .from("furniture_orders")
        .insert({
          user_id: user.id,
          configuration_id: configData.id,
          status: "pending",
          total_price: furniture.base_price ?? 0,
        });

      if (orderError) throw orderError;

      alert("Order placed successfully!");
      router.push("/pages/orders");
    } catch (err) {
      console.error("Failed to place order:", err);
      alert("Failed to place order.");
    } finally {
      setOrdering(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 text-black font-semibold">
        Loading furniture...
      </div>
    );

  if (!furniture)
    return (
      <div className="text-center py-20 text-black font-semibold">
        Furniture not found.
      </div>
    );

  // ---------------- RENDER ----------------
  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 md:p-8 lg:p-12">
      <button
        className="mb-4 text-[#A16B4C] font-semibold hover:underline"
        onClick={() => router.back()}
      >
        ← Back
      </button>

      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
        {/* LEFT SIDE */}
        <div className="flex-1 flex flex-col gap-4 relative">
          <div className="bg-white shadow-lg rounded-xl overflow-hidden flex justify-center items-center min-h-[28rem] md:min-h-[32rem] relative">
            <Furniture3DViewer
              modelUrl={furniture.model_url}
              selectedColor={furniture.color?.hex_code ?? undefined}
              selectedSize={mapSizeToNumber(size) ?? 1}
            />
            <button className="absolute top-2 left-2 bg-[#A16B4C] text-white px-2 py-1 rounded hover:bg-[#8C593F]">
              Edit
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-96 flex flex-col gap-4">
          {/* DESCRIPTION */}
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col gap-2 sticky top-20">
            <h1 className="text-2xl md:text-3xl font-bold text-black">{furniture.name}</h1>
            <p className="text-black">{furniture.description ?? "No description available"}</p>

            <div className="flex flex-col gap-1 text-black mt-2">
              <span><strong>Size:</strong> {size}</span>
              <span><strong>Material:</strong> {furniture.material?.name ?? "Unknown"}</span>
              <span className="flex items-center gap-2">
                <strong>Color:</strong>
                <span className="w-5 h-5 rounded border" style={{ backgroundColor: furniture.color?.hex_code ?? "#ffffff" }} />
                {furniture.color?.name ?? "Unknown"}
              </span>
              <span><strong>Category:</strong> {furniture.category?.name ?? "Uncategorized"}</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col gap-3">
            {/* AR BUTTON REDIRECT */}
            {furniture.model_url && isMobile && (
              <button
                className="px-4 py-2 bg-[#A16B4C] text-white rounded hover:bg-[#8C593F]"
                onClick={() => router.push(`/pages/furniture/ar/${furniture.id}`)}
              >
                View in AR
              </button>
            )}

            <button
              disabled={ordering}
              className="px-6 py-3 bg-[#8C593F] text-white rounded-lg hover:bg-[#A16B4C] transition shadow-md font-semibold disabled:opacity-50"
              onClick={handleOrder}
            >
              {ordering ? "Placing Order..." : "Order Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}