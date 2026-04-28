"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";

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

/* ========================================================= */

export default function AdminFurniture() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [categories, setCategories] = useState<FurnitureCategory[]>([]);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    item: FurnitureItemAdmin | null;
  }>({
    isOpen: false,
    mode: "create",
    item: null,
  });

  const [search, setSearch] = useState("");

  const { viewer, openViewer } = useFurnitureViewer();

  const {
    data: furniture,
    loading,
    mutating,
    create,
    update,
    remove,
  } = useFurniture();

  /* =========================================================
     CATEGORIES
  ========================================================= */

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const result = await getCategories();
        if (!active) return;
        setCategories(result ?? []);
      } catch (err) {
        console.error("[AdminFurniture] categories error:", err);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
     LIST
  ========================================================= */

  const list = useMemo(() => furniture ?? [], [furniture]);

  const filteredFurniture = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return list;

    return list.filter((item) => {
      const name = item.name?.toLowerCase() ?? "";
      const description = item.description?.toLowerCase() ?? "";
      const category =
        item.furniture_categories?.name?.toLowerCase() ?? "";

      return (
        name.includes(keyword) ||
        description.includes(keyword) ||
        category.includes(keyword)
      );
    });
  }, [list, search]);

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this furniture item?")) return;
      await remove(id);
    },
    [remove]
  );

  /* =========================================================
     VIEW
  ========================================================= */

  const handleView = useCallback(
    (item: FurnitureItemAdmin) => {
      if (!item.model_url) return;

      const variant =
        item.furniture_variants?.find((v) => v.is_default) ??
        item.furniture_variants?.[0];

      openViewer({
        modelUrl: item.model_url,
        activeTexture: variant?.texture_url ?? null,
      });
    },
    [openViewer]
  );

  /* =========================================================
     🔥 FIXED: UNIFIED SAVE HANDLER (NO UNION TYPES)
  ========================================================= */

  const handleSave = useCallback(
    async (id: string | null, form: FurnitureFormPayload) => {
      if (modalState.mode === "create") {
        if (!userId) return false;

        const success = await create(form, userId);

        if (success) {
          setModalState({
            isOpen: false,
            mode: "create",
            item: null,
          });
        }

        return success;
      }

      if (!id) return false;

      const success = await update(id, form);

      if (success) {
        setModalState({
          isOpen: false,
          mode: "create",
          item: null,
        });
      }

      return success;
    },
    [create, update, modalState.mode, userId]
  );

  /* ========================================================= */

  return (
    <main className="flex-1 p-8 space-y-6">

      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Furniture Inventory
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage AR-ready furniture assets
          </p>
        </div>

        <button
          onClick={() =>
            setModalState({
              isOpen: true,
              mode: "create",
              item: null,
            })
          }
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-black transition"
        >
          <Plus size={16} />
          Add Furniture
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex items-center justify-between gap-4 border border-neutral-200 bg-white rounded-xl p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search furniture..."
          className="flex-1 text-sm outline-none px-2 bg-transparent"
        />

        <div className="text-xs text-neutral-500">
          {filteredFurniture.length} items
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredFurniture.map((item) => (
          <FurnitureCard
            key={item.id}
            item={item}
            onEdit={() =>
              setModalState({
                isOpen: true,
                mode: "edit",
                item,
              })
            }
            onDelete={() => handleDelete(item.id)}
            onView={() => handleView(item)}
          />
        ))}
      </div>

      {/* UNIFIED MODAL */}
      {modalState.isOpen && (
        <FurnitureAdminModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          item={modalState.item}
          onClose={() =>
            setModalState({
              isOpen: false,
              mode: "create",
              item: null,
            })
          }
          onSave={handleSave}
          categories={categories}
        />
      )}

      {/* LOADING */}
      {mutating && (
        <div className="fixed bottom-4 right-4 bg-black text-white text-xs px-4 py-2 rounded-lg">
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