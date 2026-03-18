"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { FurnitureItemAdmin, FurnitureSize } from "@/types/furniture";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";

// ---------------- SIZE MAPPING ----------------
const sizeMap: Record<FurnitureSize, number> = {
  small: 0.5,
  medium: 1,
  large: 2,
};

function mapSizeToNumber(size: FurnitureSize | null | undefined): number {
  if (!size) return 1;
  return sizeMap[size] ?? 1;
}

export default function FurnitureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const furnitureId = params?.id as string;

  const [furniture, setFurniture] = useState<FurnitureItemAdmin | null>(null);
  const [materials, setMaterials] = useState<{ id: string; texture_url?: string | null; name: string }[]>([]);
  const [colors, setColors] = useState<{ id: string; hex_code: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  // ---------------- CONFIGURATION STATE ----------------
  const [size, setSize] = useState<FurnitureSize>("medium");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string>("");

  // ---------------- MODAL STATE ----------------
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configSize, setConfigSize] = useState<FurnitureSize>("medium");
  const [configMaterialId, setConfigMaterialId] = useState("");
  const [configColorId, setConfigColorId] = useState("");

  // ---------------- FETCH OPTIONS ----------------
  const fetchOptions = useCallback(async () => {
    const { data: mats } = await supabase.from("furniture_materials").select("id,name,texture_url");
    const { data: cols } = await supabase.from("furniture_colors").select("id,name,hex_code");
    const { data: cats } = await supabase.from("furniture_categories").select("id,name");

    setMaterials(mats || []);
    setColors(cols || []);
    setCategories(cats || []);
  }, []);

  // ---------------- FETCH FURNITURE ----------------
  const fetchFurniture = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("furniture")
        .select("*")
        .eq("id", furnitureId)
        .single();
      if (error) throw error;
      if (!data) return setFurniture(null);

      setFurniture(data);
      setSize(data.size ?? "medium");
      setSelectedMaterialId(data.material_id ?? "");
      setSelectedColorId(data.color_id ?? "");
    } catch (err) {
      console.error(err);
      setFurniture(null);
    } finally {
      setLoading(false);
    }
  }, [furnitureId]);

  useEffect(() => {
    if (!furnitureId) return;
    fetchOptions();
    fetchFurniture();
  }, [furnitureId, fetchOptions, fetchFurniture]);

  // ---------------- OPEN CONFIG MODAL ----------------
  const openConfigModal = () => {
    if (!furniture) return;
    setConfigSize(furniture.size ?? "medium");
    setConfigMaterialId(furniture.material_id ?? "");
    setConfigColorId(furniture.color_id ?? "");
    setIsConfigModalOpen(true);
  };

  // ---------------- PLACE ORDER ----------------
  const handleOrder = async (useChanges = false) => {
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
          selected_size: useChanges ? configSize : size,
          selected_color_id: useChanges ? configColorId : selectedColorId || undefined,
          selected_material_id: useChanges ? configMaterialId : selectedMaterialId || undefined,
        })
        .select()
        .single();

      if (configError || !configData) throw configError;

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
      router.push("/orders");
    } catch (err) {
      console.error(err);
      alert("Failed to place order.");
    } finally {
      setOrdering(false);
      setIsConfigModalOpen(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-black font-semibold">Loading furniture...</div>;
  if (!furniture) return <div className="text-center py-20 text-black font-semibold">Furniture not found.</div>;

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);
  const selectedColor = colors.find((c) => c.id === selectedColorId);

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 md:p-8 lg:p-12">
      <button className="mb-4 text-[#A16B4C] font-semibold hover:underline" onClick={() => router.back()}>
        ← Back
      </button>

      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
        {/* LEFT SIDE: 3D Viewer */}
        <div className="flex-1 flex flex-col gap-4 relative">
          <div className="bg-white shadow-lg rounded-xl overflow-hidden flex justify-center items-center min-h-[28rem] md:min-h-[32rem] relative">
            <Furniture3DViewer
              modelUrl={furniture.model_url}
              selectedColor={selectedColor?.hex_code ?? undefined}
              selectedMaterialTextureUrl={selectedMaterial?.texture_url ?? undefined}
              selectedSize={mapSizeToNumber(size)}
            />

            <button
              className="absolute top-2 left-2 bg-[#A16B4C] text-white px-3 py-1 rounded hover:bg-[#8C593F]"
              onClick={openConfigModal}
            >
              Configure
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: Info & Actions */}
        <div className="w-full md:w-96 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col gap-2 sticky top-20">
            <h1 className="text-2xl md:text-3xl font-bold text-black">{furniture.name}</h1>
            <p className="text-black whitespace-pre-line">{furniture.description ?? "No description available"}</p>
            <div className="flex flex-col gap-1 text-black mt-2">
              <span><strong>Size:</strong> {size}</span>
              <span><strong>Material:</strong> {selectedMaterial?.name ?? "Unknown"}</span>
              <span className="flex items-center gap-2">
                <strong>Color:</strong>
                <span className="w-5 h-5 rounded border" style={{ backgroundColor: selectedColor?.hex_code ?? "#ffffff" }} />
                {selectedColor?.name ?? "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- CONFIGURATION MODAL ---------------- */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg flex flex-col max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-2 text-black">Edit Configuration</h2>

            {/* 3D Viewer Preview */}
            <div className="h-[400px] w-full mb-4 border rounded">
              <Furniture3DViewer
                modelUrl={furniture.model_url}
                selectedColor={colors.find((c) => c.id === configColorId)?.hex_code}
                selectedMaterialTextureUrl={materials.find((m) => m.id === configMaterialId)?.texture_url ?? undefined}
                selectedSize={mapSizeToNumber(configSize)}
              />
            </div>

            {/* CONFIG FORM */}
            <div className="flex flex-col gap-3">
              <label className="font-semibold">Size</label>
              <select
                value={configSize}
                onChange={(e) => setConfigSize(e.target.value as FurnitureSize)}
                className="w-full border border-black p-2 rounded text-black bg-white"
              >
                {Object.keys(sizeMap).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <label className="font-semibold">Material</label>
              <select
                value={configMaterialId}
                onChange={(e) => setConfigMaterialId(e.target.value)}
                className="w-full border border-black p-2 rounded text-black bg-white"
              >
                <option value="">Select Material</option>
                {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <label className="font-semibold">Color</label>
              <select
                value={configColorId}
                onChange={(e) => setConfigColorId(e.target.value)}
                className="w-full border border-black p-2 rounded text-black bg-white"
              >
                <option value="">Select Color</option>
                {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 border border-black rounded text-black bg-white hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOrder(true)}
                className="px-4 py-2 bg-[#8C593F] text-white rounded hover:bg-[#A16B4C] transition"
                disabled={ordering}
              >
                {ordering ? "Ordering..." : "Order with Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}