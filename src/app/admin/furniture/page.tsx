"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Box, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";

import FurnitureAdminModal from "@/app/components/FurnitureAdminModal";
import DeleteConfirmModal from "@/app/components/DeleteConfirmModal";

import type {
  FurnitureItemAdmin,
  FurnitureCategory,
  FurnitureFormPayload,
} from "@/types/furniture";

import { useFurniture } from "@/hooks/useFurnitureAdmin";
import { getCategories } from "@/services/furnitureService";
import { useUser } from "@/hooks/useUser";

export default function AdminFurniture() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const { data: furniture = [], loading, create, update, remove } = useFurniture();

  const [categories, setCategories] = useState<FurnitureCategory[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "base_price" | "created_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [saving, setSaving] = useState(false);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    item: FurnitureItemAdmin | null;
  }>({ isOpen: false, mode: "create", item: null });

  const [deleteState, setDeleteState] = useState<{
    isOpen: boolean;
    item: FurnitureItemAdmin | null;
  }>({ isOpen: false, item: null });

  useEffect(() => {
    getCategories()
      .then((r) => setCategories(r ?? []))
      .catch((e) => console.error("CATEGORY_FETCH_ERROR", e));
  }, []);

  const filteredFurniture = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    let list = furniture.filter((item) => {
      if (keyword) {
        const name = item.name?.toLowerCase() ?? "";
        const category = item.category?.name?.toLowerCase() ?? "";
        if (!name.includes(keyword) && !category.includes(keyword)) return false;
      }
      if (filterCategory && item.category?.id !== filterCategory) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [furniture, search, filterCategory, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const openCreate = useCallback(() => {
    setModalState({ isOpen: true, mode: "create", item: null });
  }, []);

  const openEdit = useCallback((item: FurnitureItemAdmin) => {
    setModalState({ isOpen: true, mode: "edit", item });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const openDeleteConfirm = useCallback((item: FurnitureItemAdmin) => {
    setDeleteState({ isOpen: true, item });
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteState({ isOpen: false, item: null });
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteState.item) return;
    await remove(deleteState.item.id);
    closeDeleteConfirm();
  }, [deleteState.item, remove, closeDeleteConfirm]);

  const handleSave = useCallback(
    async (id: string | null, form: FurnitureFormPayload) => {
      setSaving(true);
      try {
        if (modalState.mode === "create") {
          if (!userId) {
            alert("Unable to create asset. Your session user ID could not be verified.");
            return;
          }
          await create({ payload: form, userId });
        } else {
          if (!id) return;
          await update({ id, payload: form });
        }
      } catch (err) {
        console.error("SAVE_ERROR", err);
      } finally {
        setSaving(false);
      }
    },
    [create, update, modalState.mode, userId]
  );

  const SortIcon = ({ k }: { k: typeof sortKey }) => {
    if (sortKey !== k) return null;
    return sortDir === "asc"
      ? <ChevronUp size={11} className="inline ml-0.5 opacity-70" />
      : <ChevronDown size={11} className="inline ml-0.5 opacity-70" />;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      published: "bg-emerald-400/10 text-emerald-400",
      draft: "bg-yellow-400/10 text-yellow-400",
      archived: "bg-white/5 text-white/30",
    };
    return map[s] ?? "bg-white/5 text-white/30";
  };

  return (
    <main className="min-h-screen bg-[#0F0A06] text-white p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Furniture Inventory</h1>
          <p className="text-sm text-white/40">Manage AR-ready furniture assets</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-[#D4A97A] text-[#1C1209] px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity sm:justify-start"
        >
          <Plus size={16} />
          Add Furniture
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <div className="flex items-center gap-2 bg-[#1A120C] border border-[#D4A97A]/20 rounded-xl px-4 py-2.5 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#D4A97A]/50 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or category…"
            className="flex-1 bg-transparent outline-none text-sm text-white/90 placeholder:text-[#D4A97A]/30"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#1A120C] border border-[#D4A97A]/20 rounded-xl px-3 py-2.5 text-sm text-white/90 outline-none cursor-pointer"
          >
            <option value="" className="bg-[#1A120C] text-white/90">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#1A120C] text-white/90">{c.name}</option>
            ))}
          </select>
          <span className="flex items-center justify-start text-xs text-[#D4A97A]/60 px-1 shrink-0 sm:justify-center">
            {filteredFurniture.length} item{filteredFurniture.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* TABLE / CARDS */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : filteredFurniture.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Box className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/40 text-sm">No furniture found</p>
          <p className="text-white/20 text-xs mt-1">
            {search.trim() || filterCategory
              ? "Try adjusting your filters"
              : "Add your first furniture item to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden rounded-2xl border border-white/10 overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-white/40 font-medium text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">
                    <button onClick={() => toggleSort("name")} className="hover:text-white transition flex items-center gap-1">
                      Name <SortIcon k="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Dimensions</th>
                  <th className="text-left px-4 py-3">
                    <button onClick={() => toggleSort("base_price")} className="hover:text-white transition flex items-center gap-1">
                      Price <SortIcon k="base_price" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">
                    <button onClick={() => toggleSort("created_at")} className="hover:text-white transition flex items-center gap-1">
                      Added <SortIcon k="created_at" />
                    </button>
                  </th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFurniture.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.images?.[0]?.image_url ? (
                          <img
                            src={item.images[0].image_url}
                            alt={item.name}
                            className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                            <Box size={14} className="text-white/20" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[180px]">{item.name}</p>
                          {item.variants?.length > 0 && (
                            <p className="text-[11px] text-white/30">{item.variants.length} variant{item.variants.length !== 1 ? "s" : ""}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50 hidden sm:table-cell">
                      {item.category?.name ?? <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs hidden md:table-cell whitespace-nowrap">
                      {item.width_cm && item.depth_cm && item.height_cm
                        ? `${item.width_cm}×${item.depth_cm}×${item.height_cm} cm`
                        : <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                      ₱{item.base_price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${statusBadge(item.publish_status)}`}>
                        {item.publish_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs hidden lg:table-cell whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition justify-end">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(item)}
                          className="p-1.5 rounded-lg hover:bg-red-950/40 text-white/40 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredFurniture.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.images?.[0]?.image_url ? (
                      <img
                        src={item.images[0].image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                        <Box size={15} className="text-white/20" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{item.name}</p>
                      <p className="text-xs text-white/40 truncate">{item.category?.name ?? "Uncategorized"}</p>
                      <p className="mt-1 text-[11px] text-white/40">
                        {item.width_cm && item.depth_cm && item.height_cm
                          ? `${item.width_cm}×${item.depth_cm}×${item.height_cm} cm`
                          : "Dimensions pending"}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${statusBadge(item.publish_status)}`}>
                    {item.publish_status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/25">Price</p>
                    <p className="text-sm font-semibold text-[#D4A97A]">₱{item.base_price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(item)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-400 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <FurnitureAdminModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        item={modalState.item}
        categories={categories}
        onClose={closeModal}
        onSave={handleSave}
      />

      <DeleteConfirmModal
        isOpen={deleteState.isOpen}
        itemName={deleteState.item?.name ?? null}
        onConfirm={handleDeleteConfirmed}
        onCancel={closeDeleteConfirm}
      />

      {saving && (
        <div className="fixed bottom-4 right-4 z-[99999] bg-black/90 border border-white/10 text-white text-xs px-4 py-2 rounded-lg shadow-xl">
          Saving changes…
        </div>
      )}
    </main>
  );
}
