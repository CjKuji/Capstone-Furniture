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
          className="rounded-lg bg-[#2F241C] px-5 py-2 text-white hover:bg-[#3A2B22]"
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
         HERO (SYSTEM EXPLANATION)
      ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F5E8DA] via-[#FAF6F1] to-[#F3E2D2] px-6 py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2">

          {/* TEXT */}
          <div>
            <h1 className="text-5xl font-bold leading-tight md:text-6xl">
              Design Furniture That Is
              <span className="text-[#7A4E2D]"> Actually Built for You</span>
            </h1>

            <p className="mt-6 text-lg text-[#5A4636]">
              This is not a store — it is a made-to-order furniture system.
              Choose a design, select finish variants, preview in 3D and AR,
              then collaborate with us through chat until production begins.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => router.push("/catalog")}
                className="rounded-xl bg-[#7A4E2D] px-8 py-4 text-white shadow-lg hover:bg-[#663D22]"
              >
                Explore Designs
              </button>

              <button
                onClick={() => router.push("/catalog")}
                className="rounded-xl border border-[#7A4E2D] px-8 py-4 text-[#7A4E2D] hover:bg-[#7A4E2D] hover:text-white"
              >
                View Collection
              </button>
            </div>

            <p className="mt-6 text-sm text-[#6A5646]">
              ✦ Design-first system • ✦ Finish variants only • ✦ 3D + AR preview
            </p>
          </div>

          {/* IMAGE */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-[#EAD7C5] blur-2xl opacity-60" />
              <img
                src="/hero-furniture.png"
                alt="Furniture design system"
                className="relative max-h-[420px] rounded-2xl object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
         HOW IT WORKS (CRITICAL UX FLOW)
      ========================================================= */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">

          <h2 className="mb-10 text-3xl font-bold">How It Works</h2>

          <div className="grid gap-6 md:grid-cols-4">

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold">1. Choose Design</p>
              <p className="mt-2 text-sm text-gray-600">
                Select from curated furniture designs.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold">2. Select Finish</p>
              <p className="mt-2 text-sm text-gray-600">
                Pick variants like oak, walnut, matte, patterned wood.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold">3. Preview in 3D / AR</p>
              <p className="mt-2 text-sm text-gray-600">
                See how it looks in real space before production.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold">4. Chat & Produce</p>
              <p className="mt-2 text-sm text-gray-600">
                Admin confirms order and production starts via chat updates.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
         FEATURED DESIGNS
      ========================================================= */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Design Collection</h2>

            <button
              onClick={() => router.push("/catalog")}
              className="text-[#7A4E2D] hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CustomerFurnitureCard key={item.id} item={item} />
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================
         CHAT + PRODUCTION PROMISE (IMPORTANT DIFFERENTIATOR)
      ========================================================= */}
      <section className="bg-[#EFE2D6] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">

          <h2 className="text-3xl font-bold">
            Production Starts With Conversation
          </h2>

          <p className="mt-4 text-[#5A4636]">
            After ordering, you don’t just wait — you communicate directly with the
            production team through chat. Updates, approvals, and progress are all transparent.
          </p>

          <button
            onClick={() => router.push("/catalog")}
            className="mt-8 rounded-xl bg-[#7A4E2D] px-10 py-4 text-white hover:bg-[#663D22]"
          >
            Browse Designs
          </button>

        </div>
      </section>

      {/* =========================================================
         FOOTER
      ========================================================= */}
      <footer className="border-t border-[#E5D5C7] bg-[#FAF6F1] py-10 text-center text-[#5A4636]">
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