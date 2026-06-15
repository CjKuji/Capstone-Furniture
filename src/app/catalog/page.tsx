"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, Box, Sparkles } from "lucide-react";

import Navbar from "@/app/components/Navbar";
import CustomerFurnitureCard from "@/app/components/CustomerCard";
import Reveal from "@/app/components/Reveal";
import PageTransition from "@/app/components/PageTransition";
import { useFurniturePublicList } from "@/hooks/useFurniture";

export default function CatalogPage() {
  const { data: furniture = [], isLoading, isError, refetch } =
    useFurniturePublicList();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    furniture.forEach((item) => {
      const cat = item.category?.name;
      if (cat) set.add(cat);
    });
    return ["all", ...Array.from(set)];
  }, [furniture]);

  const filtered = useMemo(() => {
    return furniture.filter((item) => {
      const term = search.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(term) ||
        (item.description?.toLowerCase().includes(term) ?? false);
      const matchesCategory =
        category === "all" || item.category?.name === category;
      const price = Number(item.base_price ?? 0);
      const matchesMin = minPrice === "" || price >= Number(minPrice);
      const matchesMax = maxPrice === "" || price <= Number(maxPrice);
      return matchesSearch && matchesCategory && matchesMin && matchesMax;
    });
  }, [furniture, search, category, minPrice, maxPrice]);

  const hasActiveFilters =
    search !== "" || category !== "all" || minPrice !== "" || maxPrice !== "";

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <PageTransition>
    <div className="bg-[#0F0A06] min-h-screen font-sans text-white">
      <Navbar />

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-12 border-white/5 border-b">
        <div className="mx-auto max-w-7xl">
          <Reveal>
          <p className="mb-2 font-semibold text-[#D4A97A] text-xs uppercase tracking-widest">
            WoodForge Studio
          </p>
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-end gap-4">
            <div>
              <h1 className="font-bold text-4xl sm:text-5xl leading-tight tracking-tight">
                Design
                <span className="text-white/20"> Collection</span>
              </h1>
              <p className="mt-2 text-white/40 text-sm">
                Every piece is made to order — browse, customize, and preview in 3D or AR.
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A97A]" />
              <span>
                {isLoading ? "Loading…" : `${filtered.length} designs available`}
              </span>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ── STICKY FILTER BAR ───────────────────────────── */}
      <div className="top-16 z-40 sticky bg-[#0F0A06]/95 backdrop-blur-md border-white/5 border-b">
        <div className="mx-auto px-4 sm:px-6 max-w-7xl">

          {/* top row: search + filter toggle */}
          <div className="flex items-center gap-3 py-3">
            {/* search */}
            <div className="flex flex-1 items-center gap-2 bg-white/[0.04] px-3 py-2 border border-white/10 focus-within:border-[#D4A97A]/40 rounded-lg transition">
              <Search className="w-4 h-4 text-white/30 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search designs, materials…"
                className="bg-transparent outline-none w-full text-white placeholder:text-white/25 text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
                </button>
              )}
            </div>

            {/* filter toggle */}
            <button
              onClick={() => setFiltersOpen((p) => !p)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
                filtersOpen
                  ? "border-[#D4A97A]/40 bg-[#D4A97A]/10 text-[#D4A97A]"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="flex justify-center items-center bg-[#D4A97A] rounded-full w-4 h-4 font-bold text-[#1C1209] text-[10px]">
                  !
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-white/30 hover:text-[#D4A97A] text-xs transition"
              >
                Clear
              </button>
            )}
          </div>

          {/* category pills */}
          <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ${
                  category === cat
                    ? "bg-[#D4A97A] text-[#1C1209]"
                    : "border border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat === "all" ? "All Designs" : cat}
              </button>
            ))}
          </div>

          {/* expanded price filters */}
          {filtersOpen && (
            <div className="flex flex-wrap items-center gap-3 py-3 border-white/5 border-t">
              <span className="text-white/30 text-xs">Price range:</span>
              <div className="flex items-center gap-2 bg-white/[0.04] px-3 py-1.5 border border-white/10 rounded-lg">
                <span className="text-white/30 text-xs">₱</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) =>
                    setMinPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="bg-transparent outline-none w-20 text-white placeholder:text-white/25 text-sm"
                />
              </div>
              <span className="text-white/20">—</span>
              <div className="flex items-center gap-2 bg-white/[0.04] px-3 py-1.5 border border-white/10 rounded-lg">
                <span className="text-white/30 text-xs">₱</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="bg-transparent outline-none w-20 text-white placeholder:text-white/25 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── GRID ────────────────────────────────────────── */}
      <section className="mx-auto px-4 sm:px-6 py-12 max-w-7xl">

        {/* error banner */}
        {isError && (
          <div className="flex justify-between items-center gap-4 bg-red-500/10 mb-8 px-5 py-4 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <span>Failed to load designs.</span>
            <button
              onClick={() => refetch()}
              className="bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-full text-xs transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* results count */}
        {!isLoading && !isError && (
          <p className="mb-6 text-white/25 text-xs">
            {filtered.length} {filtered.length === 1 ? "design" : "designs"} found
            {hasActiveFilters && " · filtered"}
          </p>
        )}

        {/* card grid */}
        <div className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="bg-white/5 h-56 animate-pulse" />
                  <div className="space-y-3 p-5">
                    <div className="bg-white/5 rounded-full w-3/4 h-4 animate-pulse" />
                    <div className="bg-white/5 rounded-full w-1/2 h-3 animate-pulse" />
                    <div className="bg-white/5 rounded-lg w-full h-8 animate-pulse" />
                  </div>
                </div>
              ))
            : filtered.map((item, idx) => (
  <Reveal 
    key={item.id} 
    delay={Math.min(idx, 7) * 0.06} 
    from="bottom" 
    className="w-full h-full" 
  >
    <CustomerFurnitureCard item={item} />
  </Reveal>
))}
        </div>

        {/* empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col justify-center items-center py-32 text-center">
            <div className="flex justify-center items-center bg-white/5 mb-4 rounded-2xl w-16 h-16">
              <Box className="w-7 h-7 text-white/20" />
            </div>
            <p className="font-medium text-white/40 text-base">No designs match your filters</p>
            <p className="mt-1 text-white/20 text-sm">Try adjusting your search or clearing filters</p>
            <button
              onClick={clearFilters}
              className="mt-6 px-5 py-2 border border-white/10 hover:border-[#D4A97A]/40 rounded-full text-white/40 hover:text-[#D4A97A] text-sm transition"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>
    </div>
    </PageTransition>
  );
}
