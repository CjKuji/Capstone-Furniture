"use client";

import { useMemo, useState } from "react";

import Navbar from "@/app/components/Navbar";
import CustomerFurnitureCard from "@/app/components/CustomerCard";
import { useFurniturePublicList } from "@/hooks/useFurniture";

export default function CatalogPage() {
  const { data: furniture = [], isLoading, isError, error, refetch } =
    useFurniturePublicList();

  /**
   * =========================================================
   * FILTER STATE
   * =========================================================
   */
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  /**
   * =========================================================
   * CATEGORIES (SAFE)
   * =========================================================
   */
  const categories = useMemo(() => {
    const set = new Set<string>();

    furniture.forEach((item) => {
      const cat = item.category?.name;
      if (cat) set.add(cat);
    });

    return ["all", ...Array.from(set)];
  }, [furniture]);

  /**
   * =========================================================
   * FILTER LOGIC
   * =========================================================
   */
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

  /**
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF6F1]">
        Loading designs...
      </div>
    );
  }

  /**
   * =========================================================
   * ERROR
   * =========================================================
   */
  if (isError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#FAF6F1] text-red-600">
        <p>Failed to load designs</p>
        <button onClick={() => refetch()} className="bg-black text-white px-4 py-2 rounded">
          Retry
        </button>
      </div>
    );
  }

  /**
   * =========================================================
   * UI
   * =========================================================
   */
  return (
    <div className="min-h-screen bg-[#FAF6F1] text-[#3A2B22]">
      <Navbar />

      {/* HEADER */}
      <section className="px-6 py-10">
        <h1 className="text-4xl font-bold">Design Collection</h1>

        {/* FILTERS */}
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search designs..."
            className="border px-3 py-2 rounded"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) =>
              setMinPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="border px-3 py-2 rounded"
          />

          <input
            type="number"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) =>
              setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="border px-3 py-2 rounded"
          />
        </div>
      </section>

      {/* GRID */}
      <section className="px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((item) => (
            <CustomerFurnitureCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}