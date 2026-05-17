"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Box } from "lucide-react";

import FurnitureCard from "@/app/components/FurnitureCardAdmin";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";
import FurnitureAdminModal from "@/app/components/FurnitureAdminModal";

import type {
  FurnitureItemAdmin,
  FurnitureCategory,
  FurnitureFormPayload,
} from "@/types/furniture";

import { useFurniture } from "@/hooks/useFurnitureAdmin";
import { useFurnitureViewer } from "@/hooks/useFurnitureViewer";
import { getCategories } from "@/services/furnitureService";
import { useUser } from "@/hooks/useUser";

export default function AdminFurniture() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const { viewer, openViewer } = useFurnitureViewer();

  const {
    data: furniture = [],
    loading,
    create,
    update,
    remove,
  } = useFurniture();

  /* ================= STATE ================= */

  const [categories, setCategories] = useState<FurnitureCategory[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    item: FurnitureItemAdmin | null;
  }>({
    isOpen: false,
    mode: "create",
    item: null,
  });

  /* ================= CATEGORIES ================= */

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getCategories();
        setCategories(result ?? []);
      } catch (err) {
        console.error("CATEGORY_FETCH_ERROR", err);
      }
    };

    loadCategories();
  }, []);

  /* ================= FILTER ================= */

  const filteredFurniture = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return furniture;

    return furniture.filter((item) => {
      const name = item.name?.toLowerCase() ?? "";
      const description = item.description?.toLowerCase() ?? "";
      const category = item.category?.name?.toLowerCase() ?? "";

      return (
        name.includes(keyword) ||
        description.includes(keyword) ||
        category.includes(keyword)
      );
    });
  }, [furniture, search]);

  /* ================= ACTIONS ================= */

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this furniture item?")) return;
      await remove(id);
    },
    [remove]
  );

  const handleView = useCallback(
    (item: FurnitureItemAdmin) => {
      if (!item.model_url) return;
      openViewer({
        modelUrl: item.model_url,
        variants: item.variants ?? [],
      });
    },
    [openViewer]
  );

  const handleSave = useCallback(
    async (id: string | null, form: FurnitureFormPayload) => {
      if (!userId) return;
      setSaving(true);
      try {
        if (modalState.mode === "create") {
          await create({ payload: form, userId });
        } else {
          if (!id) return;
          await update({ id, payload: form });
        }
        setModalState({ isOpen: false, mode: "create", item: null });
      } catch (err) {
        console.error("SAVE_ERROR", err);
      } finally {
        setSaving(false);
      }
    },
    [create, update, modalState.mode, userId]
  );

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-[#0F0A06] text-white p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-end justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Furniture Inventory
          </h1>
          <p className="text-sm text-white/40">
            Manage AR-ready furniture assets
          </p>
        </div>

        <button
          disabled={!userId}
          onClick={() =>
            setModalState({ isOpen: true, mode: "create", item: null })
          }
          className="flex items-center gap-2 bg-[#D4A97A] text-[#1C1209] px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          <Plus size={16} />
          Add Furniture
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3">
        <Search className="w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search furniture..."
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
        />
        <span className="text-xs text-white/30">
          {filteredFurniture.length} items
        </span>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-sm text-white/40">Loading furniture...</div>
      )}

      {/* GRID */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredFurniture.map((item) => (
            <FurnitureCard
              key={item.id}
              item={item}
              onEdit={() =>
                setModalState({ isOpen: true, mode: "edit", item })
              }
              onDelete={() => handleDelete(item.id)}
              onView={() => handleView(item)}
            />
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredFurniture.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Box className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/40 text-sm">No furniture found</p>
          <p className="text-white/20 text-xs mt-1">
            Try adjusting your search
          </p>
        </div>
      )}

      {/* MODAL */}
      {modalState.isOpen && (
        <FurnitureAdminModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          item={modalState.item}
          categories={categories}
          onClose={() =>
            setModalState({ isOpen: false, mode: "create", item: null })
          }
          onSave={handleSave}
        />
      )}

      {/* MUTATION STATUS */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-black/90 border border-white/10 text-white text-xs px-4 py-2 rounded-lg">
          Saving changes...
        </div>
      )}

      {/* 3D VIEWER */}
      {viewer && (
        <Furniture3DViewer
          modelUrl={viewer.modelUrl}
          selectedVariantTextureUrl={viewer.activeTexture ?? null}
        />
      )}
    </main>
  );
}