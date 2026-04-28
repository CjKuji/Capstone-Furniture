"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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

const DEBUG = true;

const log = (...args: any[]) => {
  if (DEBUG) console.log("🟦 [ADMIN FURNITURE]", ...args);
};

const err = (...args: any[]) => {
  console.error("🟥 [ADMIN FURNITURE ERROR]", ...args);
};

/* ========================================================= */

export default function AdminFurniture() {
  const { user, loading: userLoading } = useUser();
  const userId = user?.id ?? null;

  const isMounted = useRef(true);

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
    mutating,
    create,
    update,
    remove,
  } = useFurniture();

  /* ========================================================= */
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* =========================================================
     CATEGORIES
  ========================================================= */

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        log("FETCH_CATEGORIES_START");

        const result = await getCategories();

        if (!active || !isMounted.current) return;

        setCategories(result ?? []);

        log("FETCH_CATEGORIES_SUCCESS", result);
      } catch (e) {
        err("FETCH_CATEGORIES_FAILED", e);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  /* ========================================================= */
  const list = useMemo(() => furniture ?? [], [furniture]);

  const filteredFurniture = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return list;

    return list.filter((item) => {
      const name = item.name?.toLowerCase() ?? "";
      const description = item.description?.toLowerCase() ?? "";
      const category = item.furniture_categories?.name?.toLowerCase() ?? "";

      return (
        name.includes(keyword) ||
        description.includes(keyword) ||
        category.includes(keyword)
      );
    });
  }, [list, search]);

  /* ========================================================= */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this furniture item?")) return;

      try {
        await remove(id);
        log("DELETE_SUCCESS", id);
      } catch (e) {
        err("DELETE_FAILED", e);
      }
    },
    [remove]
  );

  /* ========================================================= */
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

      log("VIEW_OPENED", item.id);
    },
    [openViewer]
  );

  /* =========================================================
     🔥 FIXED SAVE (NO RACE CONDITION)
  ========================================================= */

  const handleSave = useCallback(
    async (id: string | null, form: FurnitureFormPayload) => {
      log("SAVE_START", {
        id,
        mode: modalState.mode,
        userId,
        userLoading,
      });

      // 🚨 HARD GUARD (fixes your bug)
      if (!userId) {
        err("SAVE_BLOCKED_NO_USER (user not ready yet)");
        return;
      }

      try {
        if (modalState.mode === "create") {
          log("CREATE_FLOW");
          await create(form, userId);
          log("CREATE_SUCCESS");
        } else {
          if (!id) {
            err("UPDATE_BLOCKED_NO_ID");
            return;
          }

          log("UPDATE_FLOW", id);
          await update(id, form);
          log("UPDATE_SUCCESS", id);
        }

        if (!isMounted.current) return;

        setModalState({
          isOpen: false,
          mode: "create",
          item: null,
        });

        log("MODAL_CLOSED_AFTER_SAVE");
      } catch (e) {
        err("SAVE_FAILED", e);
      }
    },
    [create, update, modalState.mode, userId, userLoading]
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
          disabled={!userId}
          onClick={() => {
            log("OPEN_CREATE_MODAL");
            setModalState({
              isOpen: true,
              mode: "create",
              item: null,
            });
          }}
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-black transition disabled:opacity-50"
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

      {/* MODAL */}
      {modalState.isOpen && (
        <FurnitureAdminModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          item={modalState.item}
          onClose={() => {
            log("MODAL_CLOSE");
            setModalState({
              isOpen: false,
              mode: "create",
              item: null,
            });
          }}
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

      {/* VIEWER */}
      {viewer && (
        <Furniture3DViewer
          modelUrl={viewer.modelUrl}
          selectedVariantTextureUrl={viewer.activeTexture ?? null}
        />
      )}
    </main>
  );
}