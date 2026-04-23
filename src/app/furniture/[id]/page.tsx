"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { FurnitureItemAdmin, FurnitureSize } from "@/types/furniture";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";

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
  const [materials, setMaterials] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);

  const [size, setSize] = useState<FurnitureSize>("medium");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [selectedColorId, setSelectedColorId] = useState("");

  const fetchOptions = useCallback(async () => {
    const { data: mats } = await supabase.from("furniture_materials").select("*");
    const { data: cols } = await supabase.from("furniture_colors").select("*");

    setMaterials(mats || []);
    setColors(cols || []);
  }, []);

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

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);
  const selectedColor = colors.find((c) => c.id === selectedColorId);

  const handleSaveDesign = async () => {
    if (!furniture) return;

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Login required.");
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.from("furniture_configurations").insert({
        user_id: user.id,
        furniture_id: furniture.id,
        selected_size: size,
        selected_material_id: selectedMaterialId || null,
        selected_color_id: selectedColorId || null,
        design_name: `${furniture.name} Design`,
      });

      if (error) throw error;

      alert("Design saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save design.");
    } finally {
      setSaving(false);
    }
  };

  const handleOrder = async () => {
    if (!furniture) return;

    setOrdering(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Login required.");
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
          selected_material_id: selectedMaterialId || null,
          selected_color_id: selectedColorId || null,
          design_name: `${furniture.name} Order`,
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

      alert("Order placed!");
      router.push("/orders");
    } catch (err) {
      console.error(err);
      alert("Failed to place order.");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="text-center py-20 font-semibold">Loading...</div>;
  if (!furniture) return <div className="text-center py-20 font-semibold">Not found.</div>;

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-3 md:p-6 lg:p-8">
      <button className="mb-3 text-[#A16B4C] text-sm font-medium hover:underline" onClick={() => router.back()}>
        ← Back
      </button>

      <div className="flex flex-col md:flex-row gap-4 max-w-6xl mx-auto">
        
        {/* LEFT: 3D VIEW */}
        <div className="flex-1 bg-white shadow rounded-lg flex items-center justify-center min-h-[22rem] md:min-h-[26rem]">
          <Furniture3DViewer
            modelUrl={furniture.model_url}
            selectedColor={selectedColor?.hex_code}
            selectedMaterialTextureUrl={selectedMaterial?.texture_url}
            selectedSize={mapSizeToNumber(size)}
          />
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="w-full md:w-80 flex flex-col gap-3">

          <div className="bg-white p-4 rounded-lg shadow flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-black">{furniture.name}</h2>

            <label className="text-sm font-medium">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as FurnitureSize)}
              className="border p-1.5 rounded text-sm"
            >
              {Object.keys(sizeMap).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <label className="text-sm font-medium">Material</label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="border p-1.5 rounded text-sm"
            >
              <option value="">Select</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <label className="text-sm font-medium">Color</label>
            <select
              value={selectedColorId}
              onChange={(e) => setSelectedColorId(e.target.value)}
              className="border p-1.5 rounded text-sm"
            >
              <option value="">Select</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* BUTTONS */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveDesign}
                disabled={saving}
                className="flex-1 text-sm border border-black py-1.5 rounded hover:bg-gray-100"
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={handleOrder}
                disabled={ordering}
                className="flex-1 text-sm bg-[#8C593F] text-white py-1.5 rounded hover:bg-[#A16B4C]"
              >
                {ordering ? "..." : "Order"}
              </button>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-black whitespace-pre-line">
              {furniture.description ?? "No description"}
            </p>

            <div className="mt-2 text-xs text-black">
              <div><strong>Price:</strong> ₱{furniture.base_price}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}