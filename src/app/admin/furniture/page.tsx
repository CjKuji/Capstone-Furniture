"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import AdminSidebar from "@/app/components/AdminSidebar";
import FurnitureCard from "@/app/components/FurnitureCardAdmin";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";
import AddFurnitureModal from "@/app/components/AddFurnitureModal";
import EditFurnitureModal from "@/app/components/EditFurnitureModal";

import type {
  FurnitureItemAdmin,
  FurnitureCategory,
  FurnitureFormPayload,
} from "@/types/furniture";

import { useFurniture } from "@/hooks/useFurniture";
import { useFurnitureViewer } from "@/hooks/useFurnitureViewer";
import { useUser } from "@/hooks/useUser";

import { getCategories } from "@/services/furnitureService";

/* ========================================================= */

export default function AdminFurniture() {
  const router = useRouter();

  /* ================= AUTH (CENTRALIZED) ================= */

  const { user, loading: authLoading, isAdmin } = useUser();

  /* ================= UI STATE ================= */

  const [categories, setCategories] = useState<FurnitureCategory[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<FurnitureItemAdmin | null>(null);

  /* ================= VIEWER ================= */

  const { viewer, openViewer } = useFurnitureViewer();

  /* =========================================================
     ROLE GUARD (CLIENT-SIDE SAFETY)
  ========================================================= */

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace("/auth/login");
    }
  }, [authLoading, user, isAdmin, router]);

  const userId = user?.id;

  /* =========================================================
     FURNITURE HOOK
  ========================================================= */

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

    const loadCategories = async () => {
      try {
        const data = await getCategories();
        if (active) setCategories(data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
     HANDLERS
  ========================================================= */

  const handleCloseAddModal = useCallback(() => {
    setIsAddOpen(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditingItem(null);
  }, []);

  /* ---------------- CREATE ---------------- */

  const handleCreate = useCallback(
    async (form: FurnitureFormPayload) => {
      if (!userId) return;

      const success = await create(form, userId);

      if (success) handleCloseAddModal();
    },
    [create, userId, handleCloseAddModal]
  );

  /* ---------------- UPDATE ---------------- */

  const handleUpdate = useCallback(
    async (id: string, form: FurnitureFormPayload) => {
      const success = await update(id, form);

      if (success) handleCloseEditModal();
    },
    [update, handleCloseEditModal]
  );

  /* ---------------- DELETE ---------------- */

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm("Delete this furniture?");
      if (!confirmed) return;

      await remove(id);
    },
    [remove]
  );

  /* ---------------- VIEW ---------------- */

  const handleView = useCallback(
    (item: FurnitureItemAdmin) => {
      if (!item.model_url) return;

      const defaultVariant =
        item.furniture_variants?.find((v) => v.is_default) ??
        item.furniture_variants?.[0];

      openViewer({
        modelUrl: item.model_url,
        activeTexture: defaultVariant?.texture_url ?? null,
      });
    },
    [openViewer]
  );

  /* =========================================================
     LOADING GUARD
  ========================================================= */

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-neutral-500">
        Loading admin panel...
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <AdminSidebar />

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
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm"
          >
            <Plus size={16} />
            Add Furniture
          </button>
        </div>

        {/* CONTROL BAR */}
        <div className="flex items-center justify-between gap-4 border bg-white rounded-xl p-3">
          <input
            placeholder="Search furniture..."
            className="flex-1 text-sm outline-none px-2"
          />

          <div className="text-xs text-neutral-500">
            {(furniture ?? []).length} items
          </div>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="text-sm text-neutral-500">
            Loading furniture...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {(furniture ?? []).map((item) => (
              <FurnitureCard
                key={item.id}
                item={item}
                onEdit={() => setEditingItem(item)}
                onDelete={() => handleDelete(item.id)}
                onView={() => handleView(item)}
              />
            ))}
          </div>
        )}

        {/* ADD MODAL */}
        <AddFurnitureModal
          isOpen={isAddOpen}
          onClose={handleCloseAddModal}
          onSave={handleCreate}
          categories={categories}
        />

        {/* EDIT MODAL */}
        {editingItem && (
          <EditFurnitureModal
            isOpen={!!editingItem}
            item={editingItem}
            onClose={handleCloseEditModal}
            onSave={handleUpdate}
            categories={categories}
          />
        )}

        {/* MUTATION INDICATOR */}
        {mutating && (
          <div className="fixed bottom-4 right-4 bg-black text-white text-xs px-3 py-2 rounded">
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
    </div>
  );
}