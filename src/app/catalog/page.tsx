"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";

type Furniture = {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  base_price: number;
  furniture_categories?: { name: string }[];
};

export default function CatalogPage() {
  const router = useRouter();
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH FURNITURE ---------------- */
  useEffect(() => {
    const fetchFurniture = async () => {
      const { data, error } = await supabase
        .from("furniture")
        .select(`
          id,
          name,
          description,
          thumbnail_url,
          base_price,
          furniture_categories(name)
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFurniture(data as Furniture[]);
      } else if (error) {
        console.error("Failed to fetch furniture:", error.message);
      }

      setLoading(false);
    };

    fetchFurniture();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-[#4B3F3F] font-semibold text-lg">
        Loading furniture...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">

      {/* NAVBAR handles its own user fetching */}
      <Navbar />

      {/* PAGE HEADER */}
      <section className="px-8 py-12">
        <h1 className="text-4xl font-bold text-[#4B3F3F] mb-2">
          Furniture Catalog
        </h1>
        <p className="text-[#6B584B]">
          Explore and customize furniture in 3D before ordering.
        </p>
      </section>

      {/* FURNITURE GRID */}
      <section className="px-8 pb-16">
        {furniture.length === 0 ? (
          <div className="text-center text-[#6B584B] mt-20">
            No furniture available yet.
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {furniture.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer flex flex-col"
                onClick={() => router.push(`/pages/furniture/${item.id}`)}
              >
                {/* IMAGE */}
                <div className="h-56 bg-[#F6F1EB]">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#6B584B]">
                      No Image
                    </div>
                  )}
                </div>

                {/* DETAILS */}
                <div className="p-4 flex flex-col flex-1">
                  <h2 className="text-lg font-semibold text-[#4B3F3F]">
                    {item.name}
                  </h2>

                  <p className="text-sm text-[#6B584B] mt-1">
                    {item.furniture_categories?.[0]?.name ?? "Uncategorized"}
                  </p>

                  <p className="mt-3 font-semibold text-[#A16B4C]">
                    ₱{item.base_price.toLocaleString()}
                  </p>

                  <button
                    className="mt-auto mt-4 py-2 bg-[#A16B4C] text-white rounded hover:bg-[#8C593F] transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/pages/furniture/${item.id}`);
                    }}
                  >
                    View Furniture
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}