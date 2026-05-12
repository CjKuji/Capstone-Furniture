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
     LOADING
  ========================================================= */
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF6F1] text-[#3A2B22] font-medium">
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
        <p className="font-semibold">Unable to load designs</p>

        <p className="text-sm opacity-70">
          {error instanceof Error ? error.message : "Something went wrong"}
        </p>

        <button
          onClick={() => refetch()}
          className="rounded-xl bg-[#2F241C] px-5 py-2 text-white hover:bg-[#3A2B22] transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const items = furniture ?? [];

  return (
    <div className="min-h-screen bg-[#FAF6F1] text-[#3A2B22] font-sans">
      <Navbar />

      {/* =========================================================
         HERO (refined warmth + consistency with cards)
      ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F6E9DB] via-[#FAF6F1] to-[#F3E2D2] px-6 py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2">

          <div>
            <h1 className="text-5xl font-bold leading-tight md:text-6xl">
              Furniture Designed
              <span className="text-[#7A4E2D]"> Around You</span>
            </h1>

            <p className="mt-6 text-lg text-[#5A4636] leading-relaxed">
              A made-to-order furniture system where every piece is designed,
              customized, and previewed before production — including 3D and AR visualization.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => router.push("/catalog")}
                className="rounded-xl bg-[#7A4E2D] px-8 py-4 text-white shadow-md hover:bg-[#663D22] transition"
              >
                Explore Designs
              </button>

              <button
                onClick={() => router.push("/catalog")}
                className="rounded-xl border border-[#7A4E2D] px-8 py-4 text-[#7A4E2D] hover:bg-[#7A4E2D] hover:text-white transition"
              >
                View Collection
              </button>
            </div>

            <p className="mt-6 text-sm text-[#6A5646]">
              ✦ Made-to-order only • ✦ Custom finishes • ✦ 3D + AR preview
            </p>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-[#EAD7C5] blur-2xl opacity-70" />
              <img
                src="/hero-furniture.png"
                alt="Furniture design system"
                className="relative max-h-[420px] rounded-2xl object-contain shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
         HOW IT WORKS (soft card system aligned with catalog)
      ========================================================= */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">

          <h2 className="mb-10 text-3xl font-bold text-[#3A2B22]">
            How It Works
          </h2>

          <div className="grid gap-6 md:grid-cols-4">

            {[
              ["Choose Design", "Select curated furniture designs."],
              ["Select Finish", "Wood types, textures, and variants."],
              ["Preview in 3D / AR", "Visualize before production starts."],
              ["Chat & Produce", "Direct collaboration with production team."],
            ].map(([title, desc], i) => (
              <div
                key={i}
                className="rounded-2xl bg-white border border-[#EFE2D6] p-6 shadow-sm hover:shadow-md transition"
              >
                <p className="text-sm font-semibold text-[#3A2B22]">
                  {i + 1}. {title}
                </p>
                <p className="mt-2 text-sm text-[#6A5646]">{desc}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* =========================================================
         DESIGN COLLECTION (aligned grid spacing + card harmony)
      ========================================================= */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-[#3A2B22]">
              Design Collection
            </h2>

            <button
              onClick={() => router.push("/catalog")}
              className="text-[#7A4E2D] hover:underline text-sm"
            >
              View All →
            </button>
          </div>

          {/* IMPORTANT: match card spacing system */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CustomerFurnitureCard key={item.id} item={item} />
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================
         PRODUCTION PROMISE (now matches card aesthetic)
      ========================================================= */}
      <section className="bg-[#F0E2D6] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">

          <h2 className="text-3xl font-bold text-[#3A2B22]">
            Production Begins With Collaboration
          </h2>

          <p className="mt-4 text-[#5A4636] leading-relaxed">
            Every order is confirmed through conversation. You can request changes,
            approve finishes, and track progress directly with the production team.
          </p>

          <button
            onClick={() => router.push("/catalog")}
            className="mt-8 rounded-xl bg-[#7A4E2D] px-10 py-4 text-white hover:bg-[#663D22] transition shadow-md"
          >
            Browse Designs
          </button>

        </div>
      </section>

      {/* =========================================================
         FOOTER (softened to match system)
      ========================================================= */}
      <footer className="border-t border-[#E8D7C8] bg-[#FAF6F1] py-10 text-center text-[#5A4636]">
        <p>© {new Date().getFullYear()} Formcraft Studio</p>

        <div className="mt-4 flex justify-center gap-6 text-sm">
          <a className="hover:text-[#7A4E2D]" href="#">Instagram</a>
          <a className="hover:text-[#7A4E2D]" href="#">Pinterest</a>
          <a className="hover:text-[#7A4E2D]" href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}