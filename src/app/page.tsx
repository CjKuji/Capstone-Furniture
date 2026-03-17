"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { supabase } from "@/lib/supabase";
import type { FurnitureItemAdmin, FurnitureSize } from "@/types/furniture";
import CustomerFurnitureCard from "@/app/components/CustomerCard";

// ---------------- SIZE MAPPING ----------------
const sizeMap: Record<FurnitureSize, number> = {
  small: 0.5,
  medium: 1,
  large: 2,
};

function mapSizeToNumber(size: FurnitureSize | null | undefined): number | null {
  if (!size) return null;
  return sizeMap[size];
}

export default function HomePage() {
  const [furniture, setFurniture] = useState<FurnitureItemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ---------------- FETCH FURNITURE ----------------
  useEffect(() => {
    const fetchFurniture = async () => {
      try {
        const { data, error } = await supabase
          .from("furniture")
          .select(`
            *,
            material:material_id(id,name),
            color:color_id(id,name,hex_code),
            category:category_id(id,name)
          `)
          .eq("is_published", true);

        if (error) throw error;

        const mapped: FurnitureItemAdmin[] = (data ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug ?? undefined,
          description: item.description ?? undefined,
          model_url: item.model_url,
          thumbnail_url: item.thumbnail_url ?? "/placeholder.png",
          base_price: item.base_price ?? undefined,
          size: item.size ?? null,
          size_numeric: mapSizeToNumber(item.size ?? null),
          is_published: item.is_published,
          created_at: item.created_at,
          updated_at: item.updated_at,
          material: item.material ?? undefined,
          color: item.color ?? undefined,
          category: item.category ?? undefined,
        }));

        setFurniture(mapped);
      } catch (err) {
        console.error("Error fetching furniture:", err);
        alert("Failed to load furniture");
      } finally {
        setLoading(false);
      }
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
    <div className="min-h-screen bg-[#FFF8F0] font-sans text-[#4B3F3F]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-[#FFF0E0] to-[#FFF8F0] py-32 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Design Your Perfect Furniture
            </h1>
            <p className="text-[#6B584B] text-lg mb-8">
              Explore beautifully crafted furniture and customize it in 3D. Adjust size, materials, and colors, then visualize it in your space.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => router.push("/catalog")}
                className="px-8 py-4 bg-[#A16B4C] text-white rounded-lg hover:bg-[#8C593F] transition shadow-lg"
              >
                Browse Catalog
              </button>
              <button
                onClick={() => router.push("/catalog")}
                className="px-8 py-4 border border-[#A16B4C] text-[#A16B4C] rounded-lg hover:bg-[#A16B4C] hover:text-white transition"
              >
                Explore Designs
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="/hero-furniture.png"
              alt="Furniture showcase"
              className="max-h-[420px] object-contain drop-shadow-xl rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* FEATURED FURNITURE */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10 flex-wrap">
            <h2 className="text-3xl font-bold">Featured Furniture</h2>
            <button
              onClick={() => router.push("/catalog")}
              className="text-[#A16B4C] font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {furniture.map((item) => (
              <CustomerFurnitureCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-20 px-6 bg-[#FFF0E0]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
          <p className="text-[#6B584B] mb-6">
            Have questions or need assistance? Our team is here to help you.
          </p>
          <a
            href="mailto:support@furniture3d.com"
            className="px-6 py-3 bg-[#A16B4C] text-white rounded-lg hover:bg-[#8C593F] transition shadow-md"
          >
            Email Support
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-[#4B3F3F] border-t border-[#E6D9C8]">
        <div className="mb-4">
          © {new Date().getFullYear()} Furniture3D. All rights reserved.
        </div>
        <div className="flex justify-center gap-6">
          <a href="#" className="hover:text-[#A16B4C]">Facebook</a>
          <a href="#" className="hover:text-[#A16B4C]">Instagram</a>
          <a href="#" className="hover:text-[#A16B4C]">Pinterest</a>
        </div>
      </footer>
    </div>
  );
}