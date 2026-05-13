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
      <div className="flex justify-center items-center bg-[#FAF6F1] h-screen font-medium text-[#3A2B22]">
        Loading handcrafted designs...
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */
  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center gap-4 bg-[#FAF6F1] h-screen text-red-600">
        <p className="font-semibold">Unable to load designs</p>

        <p className="opacity-70 text-sm">
          {error instanceof Error ? error.message : "Something went wrong"}
        </p>

        <button
          onClick={() => refetch()}
          className="bg-[#2F241C] hover:bg-[#3A2B22] px-5 py-2 rounded-xl text-white transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const items = furniture ?? [];

  return (
    <div className="bg-[#FAF6F1] min-h-screen font-sans text-[#3A2B22]">
      <Navbar />

      {/* =========================================================
         HERO (refined warmth + consistency with cards)
      ========================================================= */}
      <section className="relative bg-gradient-to-br from-[#F6E9DB] via-[#FAF6F1] to-[#F3E2D2] px-6 py-28 overflow-hidden">
        <div className="items-center gap-14 grid md:grid-cols-2 mx-auto max-w-7xl">

          <div>
            <h1 className="font-bold text-5xl md:text-6xl leading-tight">
              Furniture Designed
              <span className="text-[#7A4E2D]"> Around You</span>
            </h1>

            <p className="mt-6 text-[#5A4636] text-lg leading-relaxed">
              A made-to-order furniture system where every piece is designed,
              customized, and previewed before production — including 3D and AR visualization.
            </p>

            <div className="flex flex-wrap gap-4 mt-10">
              <button
                onClick={() => router.push("/catalog")}
                className="bg-[#7A4E2D] hover:bg-[#663D22] shadow-md px-8 py-4 rounded-xl text-white transition"
              >
                Explore Designs
              </button>

              <button
                onClick={() => router.push("/catalog")}
                className="hover:bg-[#7A4E2D] px-8 py-4 border border-[#7A4E2D] rounded-xl text-[#7A4E2D] hover:text-white transition"
              >
                View Collection
              </button>
            </div>

            <p className="mt-6 text-[#6A5646] text-sm">
              ✦ Made-to-order only • ✦ Custom finishes • ✦ 3D + AR preview
            </p>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-6 bg-[#EAD7C5] opacity-70 blur-2xl rounded-3xl" />
              <img
                src="/hero-furniture.png"
                alt="Furniture design system"
                className="relative shadow-xl rounded-2xl max-h-[420px] object-contain"
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

          <h2 className="mb-10 font-bold text-[#3A2B22] text-3xl">
            How It Works
          </h2>

          <div className="gap-6 grid md:grid-cols-4">

            {[
              ["Choose Design", "Select curated furniture designs."],
              ["Select Finish", "Wood types, textures, and variants."],
              ["Preview in 3D / AR", "Visualize before production starts."],
              ["Chat & Produce", "Direct collaboration with production team."],
            ].map(([title, desc], i) => (
              <div
                key={i}
                className="bg-white shadow-sm hover:shadow-md p-6 border border-[#EFE2D6] rounded-2xl transition"
              >
                <p className="font-semibold text-[#3A2B22] text-sm">
                  {i + 1}. {title}
                </p>
                <p className="mt-2 text-[#6A5646] text-sm">{desc}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* =========================================================
         FEATURED COLLECTION (professional layout)
      ========================================================= */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">

          <div className="flex justify-between items-center mb-10">
            <h2 className="font-bold text-[#3A2B22] text-3xl">
              Design Collection
            </h2>

            <button
              onClick={() => router.push("/catalog")}
              className="text-[#7A4E2D] text-sm hover:underline"
            >
              View All →
            </button>
          </div>

          {/* Featured top designs (show 6 latest) */}
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {(items.length === 0 ? Array.from({ length: 3 }) : items.slice(0, 6)).map((item, idx) => (
              <div key={(item as any)?.id ?? idx}>
                {item ? (
                  <CustomerFurnitureCard key={(item as any).id} item={item} />
                ) : (
                  <div className="bg-white shadow-sm p-6 border border-[#EFE2D6] rounded-2xl">
                    <div className="bg-[#EAD7C5] rounded-md h-40 animate-pulse" />
                    <div className="bg-[#F3E2D2] mt-4 rounded w-3/4 h-4 animate-pulse" />
                    <div className="bg-[#F3E2D2] mt-2 rounded w-1/2 h-3 animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================
         PRODUCTION PROMISE (now matches card aesthetic)
      ========================================================= */}
      <section className="bg-[#F0E2D6] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">

          <h2 className="font-bold text-[#3A2B22] text-3xl">
            Production Begins With Collaboration
          </h2>

          <p className="mt-4 text-[#5A4636] leading-relaxed">
            Every order is confirmed through conversation. You can request changes,
            approve finishes, and track progress directly with the production team.
          </p>

          <button
            onClick={() => router.push("/catalog")}
            className="bg-[#7A4E2D] hover:bg-[#663D22] shadow-md mt-8 px-10 py-4 rounded-xl text-white transition"
          >
            Browse Designs
          </button>

        </div>
      </section>

      {/* =========================================================
         FOOTER (softened to match system)
      ========================================================= */}
      <footer className="bg-[#FAF6F1] py-10 border-[#E8D7C8] border-t text-[#5A4636] text-center">
        <p>© {new Date().getFullYear()} Formcraft Studio</p>

        <div className="flex justify-center gap-6 mt-4 text-sm">
          <a className="hover:text-[#7A4E2D]" href="#">Instagram</a>
          <a className="hover:text-[#7A4E2D]" href="#">Pinterest</a>
          <a className="hover:text-[#7A4E2D]" href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}