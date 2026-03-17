"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { FurnitureItemAdmin, FurnitureSize } from "@/types/furniture";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";
import QRCode from "react-qr-code";

/* ---------------- SIZE MAPPING ---------------- */
const sizeMap: Record<FurnitureSize, number> = {
  small: 0.5,
  medium: 2,
  large: 3,
};

function mapSizeToNumber(size: FurnitureSize | null | undefined): number | null {
  if (!size) return null;
  return sizeMap[size];
}

/* ---------------- PAGE COMPONENT ---------------- */
export default function FurnitureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const furnitureId = params?.id as string;

  const [furniture, setFurniture] = useState<FurnitureItemAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  // customization state
  const [size, setSize] = useState<FurnitureSize>("medium");
  const [colorId, setColorId] = useState<string | null>(null);
  const [materialId, setMaterialId] = useState<string | null>(null);

  // AR state
  const [arUrl, setArUrl] = useState<string | null>(null);

  /* ---------------- FETCH FURNITURE ---------------- */
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
        setColorId(colorRelation?.id ?? null);
        setMaterialId(materialRelation?.id ?? null);
      } catch (err) {
        console.error("Failed to fetch furniture:", err);
        setFurniture(null);
      } finally {
        setLoading(false);
      }
    };

    if (furnitureId) fetchFurniture();
  }, [furnitureId]);

  /* ---------------- PLACE ORDER ---------------- */
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
          selected_color_id: colorId,
          selected_material_id: materialId,
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

  /* ---------------- GENERATE AR LINK ---------------- */
  const handleGenerateAR = () => {
    if (!furniture?.model_url) {
      alert("No model available for AR view.");
      return;
    }
    setArUrl(furniture.model_url); // public bucket URL
  };

  if (loading)
    return <div className="text-center py-20 text-black font-semibold">Loading furniture...</div>;
  if (!furniture)
    return <div className="text-center py-20 text-black font-semibold">Furniture not found.</div>;

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 md:p-8 lg:p-12">
      <button
        className="mb-4 text-[#A16B4C] font-semibold hover:underline"
        onClick={() => router.back()}
      >
        ← Back
      </button>

      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
        {/* LEFT: 3D Viewer + Details */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white shadow-lg rounded-xl overflow-hidden flex justify-center items-center min-h-[28rem] md:min-h-[32rem]">
            <Furniture3DViewer
              modelUrl={furniture.model_url}
              selectedColor={furniture.color?.hex_code ?? undefined}
              selectedSize={mapSizeToNumber(size) ?? 1}
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-black">{furniture.name}</h1>
            <p className="text-black">{furniture.description ?? "No description available"}</p>

            <div className="flex flex-col gap-1 text-black mt-2">
              <span><strong>Size:</strong> {size}</span>
              <span><strong>Material:</strong> {furniture.material?.name ?? "Unknown"}</span>
              <span className="flex items-center gap-2">
                <strong>Color:</strong>
                <span
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: furniture.color?.hex_code ?? "#ffffff" }}
                />
                {furniture.color?.name ?? "Unknown"}
              </span>
              <span><strong>Category:</strong> {furniture.category?.name ?? "Uncategorized"}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Customization + Actions + AR */}
        <div className="w-full md:w-96 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col gap-3 sticky top-20">
            <h2 className="text-xl md:text-2xl font-semibold text-black">Customize</h2>

            {/* Size */}
            <div className="flex flex-col gap-2">
              <label className="text-black font-medium">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as FurnitureSize)}
                className="border rounded px-3 py-2"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Material */}
            <div className="flex flex-col gap-2">
              <label className="text-black font-medium">Material</label>
              <select
                value={materialId ?? ""}
                onChange={(e) => setMaterialId(e.target.value)}
                className="border rounded px-3 py-2"
              >
                {furniture.material && <option value={furniture.material.id}>{furniture.material.name}</option>}
              </select>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-2">
              <label className="text-black font-medium">Color</label>
              <input
                type="color"
                value={furniture.color?.hex_code ?? "#ffffff"}
                onChange={(e) => setColorId(furniture.color?.id ?? null)}
                className="w-16 h-10 cursor-pointer"
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col gap-3">
            <button
              className="px-6 py-3 bg-[#A16B4C] text-white rounded-lg hover:bg-[#8C593F] transition shadow-md font-semibold"
              onClick={handleGenerateAR}
            >
              Generate AR View 🔗
            </button>

            {arUrl && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <QRCode value={arUrl} size={128} />
                <a
                  href={arUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A16B4C] hover:underline mt-1 break-words text-center"
                >
                  Open AR Link
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(arUrl)}
                  className="px-3 py-1 mt-1 bg-[#A16B4C] text-white rounded hover:bg-[#8C593F] transition"
                >
                  Copy Link 🔗
                </button>

                            </div>
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