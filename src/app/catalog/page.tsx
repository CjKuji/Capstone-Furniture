"use client";

import { useMemo, useState } from "react";

import Navbar from "@/app/components/Navbar";
import CustomerFurnitureCard from "@/app/components/CustomerCard";
import { useFurniturePublicList } from "@/hooks/useFurniture";

export default function CatalogPage() {
  const { data: furniture = [], isLoading, isError, error, refetch } =
    useFurniturePublicList();

  /* =========================================================
     FILTER STATE
  ========================================================= */
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  /* =========================================================
     CATEGORIES
  ========================================================= */
  const categories = useMemo(() => {
    const set = new Set<string>();

    furniture.forEach((item) => {
      const cat = item.category?.name;
      if (cat) set.add(cat);
    });

    return ["all", ...Array.from(set)];
  }, [furniture]);

  /* =========================================================
     FILTER LOGIC
  ========================================================= */
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

  /* =========================================================
     LOADING
  ========================================================= */
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF6F1] text-[#3A2B22]">
        Loading handcrafted designs...
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */
  if (isError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#FAF6F1] text-red-600">
        <p className="font-medium">Failed to load designs</p>

        <button
          onClick={() => refetch()}
          className="rounded-xl bg-[#7A4E2D] px-5 py-2 text-white hover:bg-[#663D22] transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F1] text-[#3A2B22]">
      <Navbar />

      {/* =========================================================
         HEADER (tight + structured)
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Design Collection
          </h1>
          <p className="text-sm text-[#6A5646]">
            Browse curated furniture designs made for customization and production.
          </p>
        </div>
      </section>

      {/* =========================================================
         FILTER BAR (sticky showroom-style panel)
      ========================================================= */}
      <section className="sticky top-[72px] z-40 border-y border-[#E8D7C8] bg-[#FAF6F1]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* SEARCH */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search furniture designs..."
              className="w-full lg:w-80 rounded-xl border border-[#E8D7C8] bg-white px-4 py-2 text-sm outline-none focus:border-[#7A4E2D] transition"
            />

            {/* FILTER GROUP */}
            <div className="flex flex-wrap gap-3">

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-[#E8D7C8] bg-white px-3 py-2 text-sm text-[#3A2B22] outline-none focus:border-[#7A4E2D] transition"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Min ₱"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-24 rounded-xl border border-[#E8D7C8] bg-white px-3 py-2 text-sm outline-none focus:border-[#7A4E2D] transition"
              />

              <input
                type="number"
                placeholder="Max ₱"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-24 rounded-xl border border-[#E8D7C8] bg-white px-3 py-2 text-sm outline-none focus:border-[#7A4E2D] transition"
              />

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================
         RESULTS
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* results meta */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-[#6A5646]">
            {filtered.length} designs found
          </p>
        </div>

        {/* GRID (tighter, more curated feel) */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <CustomerFurnitureCard key={item.id} item={item} />
          ))}
        </div>

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="mt-20 text-center text-[#6A5646]">
            No designs match your filters.
          </div>
        )}

      </section>
    </div>
  );
}