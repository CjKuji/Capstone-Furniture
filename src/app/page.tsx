"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Scan,
  Box,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Layers,
  Cpu,
} from "lucide-react";

import Navbar from "@/app/components/Navbar";
import CustomerFurnitureCard from "@/app/components/CustomerCard";
import Reveal from "@/app/components/Reveal";
import PageTransition from "@/app/components/PageTransition";
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

  const items = furniture ?? [];

  // Do NOT block the full page render — only the cards section shows loading/error states
  return (
    <PageTransition>
    <div className="bg-[#0F0A06] min-h-screen font-sans text-white">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════
          HERO — full-bleed dark with warm gradient overlay
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col justify-center items-center px-4 min-h-[92vh] overflow-hidden text-center">
        {/* background glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="top-20 -left-40 absolute bg-[#7A4E2D]/20 blur-[120px] rounded-full w-[500px] h-[500px]" />
          <div className="-right-40 bottom-20 absolute bg-[#D4A97A]/10 blur-[100px] rounded-full w-[400px] h-[400px]" />
        </div>

        {/* AI badge */}
        <Reveal delay={0.05}>
        <div className="inline-flex items-center gap-2 bg-[#D4A97A]/10 mb-6 px-4 py-1.5 border border-[#D4A97A]/30 rounded-full font-medium text-[#D4A97A] text-xs uppercase tracking-widest">
          <Cpu className="w-3.5 h-3.5" />
          AI-Powered Custom Furniture
        </div>
        </Reveal>

        {/* headline */}
        <Reveal delay={0.15}>
        <h1 className="mx-auto max-w-4xl font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight">
          Furniture Built
          <span className="block text-[#D4A97A]">Around Your Vision</span>
        </h1>
        </Reveal>

        <Reveal delay={0.25}>
        <p className="mx-auto mt-6 max-w-2xl text-white/50 text-base sm:text-lg leading-relaxed">
          Every piece is crafted to order — browse designs, customize finishes, preview
          in 3D or AR, then collaborate with our production team until it's perfect.
        </p>
        </Reveal>

        {/* CTAs */}
        <Reveal delay={0.35}>
        <div className="flex flex-wrap justify-center items-center gap-4 mt-10">
          <button
            onClick={() => router.push("/catalog")}
            className="group flex items-center gap-2 bg-[#D4A97A] hover:bg-[#C4976A] px-7 py-3.5 rounded-full font-semibold text-[#1C1209] text-sm transition"
          >
            Explore Designs
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => router.push("/catalog")}
            className="px-7 py-3.5 border border-white/20 hover:border-white/40 rounded-full font-medium text-white/70 hover:text-white text-sm transition"
          >
            How It Works
          </button>
        </div>
        </Reveal>

        {/* trust pills */}
        <Reveal delay={0.45}>
        <div className="flex flex-wrap justify-center items-center gap-3 mt-12">
          {[
            "3D & AR Preview",
            "Made to Order",
            "Custom Finishes",
            "Chat with Craftsmen",
          ].map((pill) => (
            <span
              key={pill}
              className="flex items-center gap-1.5 bg-white/5 px-3 py-1 border border-white/10 rounded-full text-white/50 text-xs"
            >
              <CheckCircle2 className="w-3 h-3 text-[#D4A97A]" />
              {pill}
            </span>
          ))}
        </div>
        </Reveal>

        {/* scroll cue */}
        <div className="bottom-8 left-1/2 absolute -translate-x-1/2 animate-bounce">
          <div className="flex justify-center items-start pt-1.5 border-2 border-white/20 rounded-full w-6 h-10">
            <div className="bg-[#D4A97A] rounded-full w-1 h-2" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS STRIP
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white/[0.03] px-4 py-10 border-white/5 border-y">
        <div className="gap-8 grid grid-cols-2 md:grid-cols-4 mx-auto max-w-5xl text-center">
          {[
            ["100%", "Made to Order"],
            ["3D + AR", "Live Preview"],
            ["Custom", "Wood & Finishes"],
            ["Direct", "Craftsman Chat"],
          ].map(([val, label], i) => (
            <Reveal key={label} delay={i * 0.08} from="bottom">
            <div>
              <p className="font-bold text-[#D4A97A] text-3xl">{val}</p>
              <p className="mt-1 text-white/40 text-sm">{label}</p>
            </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURED COLLECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal>
          <div className="mb-4 font-semibold text-[#D4A97A] text-xs uppercase tracking-widest">
            Featured Designs
          </div>
          <div className="flex justify-between items-end">
            <h2 className="font-bold text-3xl sm:text-4xl leading-tight">
              Handcrafted
              <br />
              <span className="text-white/40">Collections</span>
            </h2>
            <button
              onClick={() => router.push("/catalog")}
              className="group flex items-center gap-1 text-white/50 hover:text-[#D4A97A] text-sm transition"
            >
              View all
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          </Reveal>

          {isError && (
            <div className="flex justify-between items-center gap-4 bg-red-500/10 mb-6 px-5 py-4 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <span>Failed to load designs. {error instanceof Error ? error.message : ""}</span>
              <button
                onClick={() => refetch()}
                className="bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-full text-xs transition shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          <div className="gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-10">
            {(isLoading ? Array.from({ length: 6 }) : items.slice(0, 6)).map(
              (item, idx) =>
                isLoading || !item ? (
                  <div
                    key={idx}
                    className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden"
                  >
                    <div className="bg-white/5 h-52 animate-pulse" />
                    <div className="space-y-3 p-5">
                      <div className="bg-white/5 rounded-full w-3/4 h-4 animate-pulse" />
                      <div className="bg-white/5 rounded-full w-1/2 h-3 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <Reveal key={(item as any).id} delay={idx * 0.07}>
                  <CustomerFurnitureCard key={(item as any).id} item={item} />
                  </Reveal>
                )
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          AI + TECHNOLOGY SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal>
          <div className="bg-gradient-to-br from-[#1C1209] to-[#0F0A06] border border-white/5 rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* left text */}
              <div className="flex flex-col justify-center p-10 lg:p-14">
                <div className="inline-flex items-center gap-2 bg-[#D4A97A]/10 mb-4 px-3 py-1 rounded-full w-fit font-medium text-[#D4A97A] text-xs uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> AI-Powered
                </div>
                <h2 className="font-bold text-3xl sm:text-4xl leading-tight">
                  See It Before
                  <br />
                  <span className="text-[#D4A97A]">It's Built</span>
                </h2>
                <p className="mt-4 text-white/50 text-sm leading-relaxed">
                  Our platform uses 3D rendering and Augmented Reality so you can place
                  your future furniture in your actual room — before a single nail is hammered.
                  Tweak finishes, swap materials, and confirm dimensions in real time.
                </p>

                <ul className="space-y-3 mt-8">
                  {[
                    { icon: <Box className="w-4 h-4" />, label: "Interactive 3D Model Viewer" },
                    { icon: <Scan className="w-4 h-4" />, label: "Augmented Reality Room Preview" },
                    { icon: <Layers className="w-4 h-4" />, label: "Live Texture & Finish Swapping" },
                    { icon: <MessageSquare className="w-4 h-4" />, label: "Real-time Chat with Production Team" },
                  ].map(({ icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-white/60 text-sm">
                      <span className="flex justify-center items-center bg-[#D4A97A]/10 rounded-lg w-8 h-8 text-[#D4A97A] shrink-0">
                        {icon}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push("/catalog")}
                  className="group flex items-center gap-2 bg-[#D4A97A] hover:bg-[#C4976A] mt-10 px-6 py-3 rounded-full w-fit font-semibold text-[#1C1209] text-sm transition"
                >
                  Try It Now
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* right visual */}
              <div className="relative flex justify-center items-center bg-[#D4A97A]/5 p-10 min-h-[340px]">
                <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                  <div className="bg-[#D4A97A]/10 blur-3xl rounded-full w-64 h-64" />
                </div>
                <div className="relative space-y-3 w-full max-w-xs">
                  {/* mock AR/3D card UI */}
                  <div className="bg-[#1C1209]/80 backdrop-blur p-5 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="flex justify-center items-center bg-[#D4A97A]/20 rounded-xl w-10 h-10 text-[#D4A97A]">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">3D Viewer</p>
                        <p className="text-white/40 text-xs">Rotate · Zoom · Inspect</p>
                      </div>
                    </div>
                    <div className="flex justify-center items-center bg-white/5 mt-4 rounded-xl h-28 text-white/20 text-xs">
                      GLB model preview
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-[#1C1209]/80 backdrop-blur p-4 border border-white/10 rounded-2xl">
                    <div className="flex justify-center items-center bg-[#D4A97A]/20 rounded-xl w-9 h-9 text-[#D4A97A]">
                      <Scan className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">AR Preview</p>
                      <p className="text-white/40 text-xs">Place in your room</p>
                    </div>
                    <span className="bg-green-500/20 ml-auto px-2 py-0.5 rounded-full text-[10px] text-green-400">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS — process steps
      ═══════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal>
          <div className="mb-4 font-semibold text-[#D4A97A] text-xs uppercase tracking-widest">
            Our Process
          </div>
          <h2 className="font-bold text-3xl sm:text-4xl">
            From Idea to{" "}
            <span className="text-white/40">Doorstep</span>
          </h2>
          </Reveal>

          <div className="gap-6 grid sm:grid-cols-2 lg:grid-cols-4 mt-12">
            {[
              {
                step: "01",
                icon: <Layers className="w-6 h-6" />,
                title: "Choose a Design",
                desc: "Browse our catalog of curated, made-to-order furniture designs.",
              },
              {
                step: "02",
                icon: <Sparkles className="w-6 h-6" />,
                title: "Customize & Preview",
                desc: "Select wood, finish, and texture. Preview live in 3D or place it in AR.",
              },
              {
                step: "03",
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Collaborate",
                desc: "Chat directly with our craftsmen. Request changes before production starts.",
              },
              {
                step: "04",
                icon: <CheckCircle2 className="w-6 h-6" />,
                title: "Receive Your Piece",
                desc: "We build it, you approve it. Pickup or delivery — your choice.",
              },
            ].map(({ step, icon, title, desc }, i) => (
              <Reveal key={step} delay={i * 0.1} from="bottom">
              <div
                className="group relative bg-white/[0.03] hover:bg-white/[0.05] p-6 border border-white/5 hover:border-[#D4A97A]/20 rounded-2xl overflow-hidden transition"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex justify-center items-center bg-[#D4A97A]/10 rounded-xl w-12 h-12 text-[#D4A97A]">
                    {icon}
                  </div>
                  <span className="font-bold text-white/5 group-hover:text-white/10 text-4xl transition">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="mt-2 text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <Reveal from="bottom">
        <div className="bg-[#D4A97A] mx-auto px-8 py-16 rounded-3xl max-w-4xl overflow-hidden text-center">
          <h2 className="font-bold text-[#1C1209] text-3xl sm:text-4xl">
            Ready to Build Your Perfect Piece?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#3A2B22]/70">
            Join our made-to-order community. Every order starts with a conversation.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 mt-8">
            <button
              onClick={() => router.push("/catalog")}
              className="group flex items-center gap-2 bg-[#1C1209] hover:bg-[#2F1E0F] px-8 py-3.5 rounded-full font-semibold text-white text-sm transition"
            >
              Browse the Catalog
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => router.push("/auth/register")}
              className="px-8 py-3.5 border-[#1C1209]/30 border-2 hover:border-[#1C1209] rounded-full font-medium text-[#1C1209] text-sm transition"
            >
              Create an Account
            </button>
          </div>
        </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-[#0F0A06] px-4 sm:px-6 py-14 border-white/5 border-t">
        <div className="mx-auto max-w-7xl">
          <div className="gap-10 grid sm:grid-cols-2 lg:grid-cols-4">
            {/* brand */}
            <div className="lg:col-span-2">
              <p className="font-bold text-[#D4A97A] text-xl tracking-widest">
                WOOD<span className="text-white">FORGE</span>
              </p>
              <p className="mt-3 max-w-xs text-white/30 text-sm leading-relaxed">
                Made-to-order furniture crafted with precision and powered by 3D & AR technology.
              </p>
            </div>
            {/* links */}
            <div>
              <p className="mb-4 font-semibold text-white/30 text-xs uppercase tracking-widest">Shop</p>
              <ul className="space-y-2 text-white/50 text-sm">
                {["All Designs", "Living Room", "Bedroom", "Dining"].map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => router.push("/catalog")}
                      className="hover:text-[#D4A97A] transition"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 font-semibold text-white/30 text-xs uppercase tracking-widest">Company</p>
              <ul className="space-y-2 text-white/50 text-sm">
                {["About Us", "Our Process", "Contact", "Privacy Policy"].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-[#D4A97A] transition">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex sm:flex-row flex-col justify-between items-center gap-4 mt-12 pt-8 border-white/5 border-t">
            <p className="text-white/20 text-xs">
              © {new Date().getFullYear()} WoodForge. All rights reserved.
            </p>
            <div className="flex gap-4 text-white/30 text-xs">
              {["Instagram", "Pinterest", "Facebook"].map((s) => (
                <a key={s} href="#" className="hover:text-[#D4A97A] transition">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
    </PageTransition>
  );
}