"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Plus } from "lucide-react";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";
import FurnitureCard from "@/app/components/FurnitureCard";
import { supabase } from "@/lib/supabase";
import { generateThumbnail } from "@/lib/generateThumbnail";
import type { FurnitureItem, FurnitureSize } from "../../../types/furniture";

/* ---------------- SIZE MAPPING ---------------- */
const sizeMap: Record<FurnitureSize, number> = {
  small: 0.5,
  medium: 1,
  large: 2,
};

function mapSizeToNumber(size: FurnitureSize | ""): number | undefined {
  if (!size) return undefined;
  return sizeMap[size];
}

function mapNumberToSize(num: number | null | undefined): FurnitureSize | "" {
  if (num == null) return ""; // covers both null and undefined
  if (num <= 0.5) return "small";
  if (num <= 1) return "medium";
  return "large";
}

const sizes: FurnitureSize[] = ["small", "medium", "large"];

export default function AdminFurniture() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null);
  const [viewerModelUrl, setViewerModelUrl] = useState("");

  /* ---------------- FORM STATE ---------------- */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [size, setSize] = useState<FurnitureSize | "">("");
  const [materialId, setMaterialId] = useState("");
  const [colorId, setColorId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  /* ---------------- DATA STATE ---------------- */
  const [materials, setMaterials] = useState<{ id: string; name: string }[]>([]);
  const [colors, setColors] = useState<{ id: string; name: string; hex_code: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  /* ---------------- FETCH MATERIALS / COLORS / CATEGORIES ---------------- */
  const fetchMaterialsColorsCategories = async () => {
    try {
      const { data: materialsData, error: matError } = await supabase
        .from("furniture_materials")
        .select("id,name");
      const { data: colorsData, error: colorError } = await supabase
        .from("furniture_colors")
        .select("id,name,hex_code");
      const { data: categoriesData, error: catError } = await supabase
        .from("furniture_categories")
        .select("id,name");

      if (matError || colorError || catError) throw matError || colorError || catError;

      setMaterials(materialsData || []);
      setColors(colorsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch materials, colors, or categories");
    }
  };

  /* ---------------- FETCH FURNITURE ---------------- */
  const fetchFurniture = async () => {
    try {
      const { data, error } = await supabase.from("furniture").select("*");
      if (error) throw error;
      setFurniture(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch furniture");
    }
  };

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth/login");
        return;
      }
      setUser(data.user);
      await fetchMaterialsColorsCategories();
      await fetchFurniture();
    };
    init();
  }, [router]);

  if (!user)
    return <div className="text-center mt-20 text-lg text-black">Loading...</div>;

  /* ---------------- OPEN MODAL ---------------- */
const openModal = (item?: FurnitureItem & { size_numeric?: number | null }) => {
  setSelectedFurniture(item ?? null);

  setName(item?.name ?? "");
  setSlug(item?.slug ?? "");
  setDescription(item?.description ?? "");
  setFile(null);

  // Convert numeric DB size to string for dropdown
  setSize(mapNumberToSize(item?.size_numeric ?? null));

  setMaterialId(item?.material_id ?? "");
  setColorId(item?.color_id ?? "");
  setCategoryId(item?.category_id ?? "");

  setIsModalOpen(true);
};

/* ---------------- SAVE FURNITURE ---------------- */
const handleSaveFurniture = async () => {
  if (!name || (!file && !selectedFurniture)) {
    alert("Furniture name and GLB file required.");
    return;
  }

  let model_url = selectedFurniture?.model_url || "";
  let thumbnail_url: string | null = selectedFurniture?.thumbnail_url ?? null;

  try {
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `furniture/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("furniture-models")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("furniture-models")
        .getPublicUrl(filePath);
      model_url = urlData.publicUrl;

      const blob = await generateThumbnail(model_url);
      const thumbName = `thumb-${Date.now()}.png`;
      const thumbPath = `thumbnails/${thumbName}`;
      const { error: thumbError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbPath, blob, { contentType: "image/png" });
      if (!thumbError) {
        const { data } = supabase.storage.from("thumbnails").getPublicUrl(thumbPath);
        thumbnail_url = data.publicUrl;
      }
    }

    const payload: Partial<FurnitureItem & { size_numeric?: number | null }> = {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description,
      category_id: categoryId || null,
      model_url,
      thumbnail_url,
      size: size || null, // string for UI / TS
      size_numeric: size ? mapSizeToNumber(size) : null, // numeric for DB
      material_id: materialId || null,
      color_id: colorId || null,
      is_published: true,
    };

    if (selectedFurniture) {
      const { error } = await supabase
        .from("furniture")
        .update(payload)
        .eq("id", selectedFurniture.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("furniture")
        .insert([payload]);
      if (error) throw error;
    }

    setIsModalOpen(false);
    fetchFurniture();
  } catch (err: unknown) {
    if (err instanceof Error) alert(err.message);
    else alert("Unexpected error occurred");
  }
};

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this furniture?")) return;

    const { error } = await supabase
      .from("furniture")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchFurniture();
  };

  /* ---------------- VIEWER ---------------- */
  const openViewer = (url: string) => {
    setViewerModelUrl(url);
    setIsViewerOpen(true);
  };

/* ---------------- UI ---------------- */
return (
  <div className="flex min-h-screen bg-white text-black">
    <AdminSidebar activePage="furniture" setActivePage={() => {}} />

    <main className="flex-1 p-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-black">Furniture</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition"
        >
          <Plus size={18} /> Add Furniture
        </button>
      </div>

      {/* FURNITURE GRID */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {furniture.map((item) => (
          <FurnitureCard
            key={item.id}
            item={item}
            onEdit={openModal}
            onView={openViewer}
            onDelete={handleDelete}
          />
        ))}
      </div>

     {isModalOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white w-full max-w-md rounded-lg shadow-lg flex flex-col gap-4
                    max-h-screen overflow-y-auto p-6">
      
      <h2 className="text-xl font-bold mb-2 text-black">
        {selectedFurniture ? "Edit Furniture" : "Add Furniture"}
      </h2>

      {/* FORM FIELDS */}
      <div className="flex flex-col gap-3">
        <label className="font-semibold">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Furniture name"
          className="w-full border border-black p-2 rounded text-black bg-white"
        />

        <label className="font-semibold">Slug (optional)</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug"
          className="w-full border border-black p-2 rounded text-black bg-white"
        />

        <label className="font-semibold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full border border-black p-2 rounded text-black bg-white resize-none"
        />

              <label className="font-semibold">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-black p-2 rounded text-black bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <label className="font-semibold">3D Model (.glb/.gltf)</label>
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-black"
              />

              <label className="font-semibold">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as FurnitureSize)}
                className="w-full border border-black p-2 rounded text-black bg-white"
              >
                <option value="">Select Size</option>
                {sizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <label className="font-semibold">Material</label>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full border border-black p-2 rounded text-black bg-white"
              >
                <option value="">Select Material</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <label className="font-semibold">Color</label>
              <select
                value={colorId}
                onChange={(e) => setColorId(e.target.value)}
                className="w-full border border-black p-2 rounded text-black bg-white"
              >
                <option value="">Select Color</option>
                {colors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  const url = file ? URL.createObjectURL(file) : selectedFurniture?.model_url;
                  if (!url) return alert("Upload a GLB first.");
                  openViewer(url);
                }}
                className="w-full py-2 bg-black text-white rounded hover:bg-gray-900 transition"
              >
                View 3D Model
              </button>
            </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => setIsModalOpen(false)}
          className="px-4 py-2 border border-black rounded text-black bg-white hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveFurniture}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-900 transition"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
      {/* 3D VIEWER */}
      {isViewerOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 overflow-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl p-6">

            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-black">3D Model Viewer</h2>
              <button
                onClick={() => setIsViewerOpen(false)}
                className="border border-black px-3 py-1 rounded text-black hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>

            <div className="h-[500px] w-full">
              <Furniture3DViewer
                modelUrl={viewerModelUrl}
                selectedColor={colors.find((c) => c.id === colorId)?.hex_code}
                selectedSize={mapSizeToNumber(size)}
              />
            </div>
          </div>
        </div>
      )}

    </main>
  </div>
);
}