"use client";

import { useRouter } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import CustomerFurnitureCard from "@/app/components/CustomerCard";

import { useFurniturePublicList } from "@/hooks/useFurniture";

export default function HomePage() {
  const router = useRouter();

  const {
    data: furniture,
    isLoading,
    isError,
    error,
    refetch,
  } = useFurniturePublicList();

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-[#4B3F3F] font-semibold text-lg">
        Loading furniture...
      </div>
    );
  }

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-red-600">
        <p>Failed to load furniture</p>

        <p className="text-sm opacity-70">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>

        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const items = furniture ?? [];

  /* =========================================================
     UI
  ========================================================= */

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
              Explore beautifully crafted furniture and customize it in 3D.
              Adjust size, materials, and colors, then visualize it in your space.
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
            {items.map((item) => (
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