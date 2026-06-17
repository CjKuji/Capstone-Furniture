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
  HelpCircle,
} from "lucide-react";

import Navbar from "@/app/components/Navbar";
import CustomerFurnitureCard from "@/app/components/CustomerCard";
import Reveal from "@/app/components/Reveal";
import PageTransition from "@/app/components/PageTransition";
import TutorialWidget from "@/app/components/TutorialWidget";
import { useFurniturePublicList } from "@/hooks/useFurniture";
import type { FurniturePublicListItem } from "@/types/furniture-public";

export default function HomePage() {
  const router = useRouter();

  const { data: furniture, isLoading, isError, error, refetch } =
    useFurniturePublicList();

  const items = furniture ?? [];

  return (
    <PageTransition>
      <div className="relative bg-[#0F0A06] min-h-screen font-sans text-white overflow-x-hidden">
        
        {/* ═══════════════════════════════════════════════════════
            FIXED NAVBAR
            Added: fixed, top-0, left-0, w-full, and z-50 
        ═══════════════════════════════════════════════════════ */}
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>

        {/* ═══════════════════════════════════════════════════════
            HERO 
            Added: pt-20 (padding-top) so the content starts 
            below the fixed Navbar.
        ═══════════════════════════════════════════════════════ */}
        <section className="relative flex flex-col justify-center items-center px-4 sm:px-6 min-h-[92dvh] pt-20 overflow-hidden text-center">
          {/* glow blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <div className="top-20 -left-40 absolute bg-[#7A4E2D]/20 blur-[120px] rounded-full w-[400px] sm:w-[500px] h-[400px] sm:h-[500px]" />
            <div className="-right-40 bottom-20 absolute bg-[#D4A97A]/10 blur-[100px] rounded-full w-[300px] sm:w-[400px] h-[300px] sm:h-[400px]" />
          </div>

          {/* AI BADGE */}
          <Reveal delay={0.05}>
            <div className="inline-flex items-center gap-2 bg-[#D4A97A]/10 mb-5 sm:mb-6 px-3 sm:px-4 py-1.5 border border-[#D4A97A]/30 rounded-full font-medium text-[#D4A97A] text-[10px] sm:text-xs uppercase tracking-widest">
              <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              AI-Powered Custom Furniture
            </div>
          </Reveal>

          {/* HEADLINE */}
          <Reveal delay={0.15}>
            <h1 className="mx-auto max-w-4xl font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.08] tracking-tight">
              Furniture Built
              <span className="block text-[#D4A97A]">Around Your Vision</span>
            </h1>
          </Reveal>

          {/* SUBHEAD */}
          <Reveal delay={0.25}>
            <p className="mx-auto mt-5 sm:mt-6 max-w-xl sm:max-w-2xl text-white/50 text-sm sm:text-base lg:text-lg leading-relaxed px-2">
              Every piece is crafted to order — browse designs, customize finishes,
              preview in 3D or AR, then collaborate with our production team until
              it's perfect.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={0.35}>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 mt-8 sm:mt-10 w-full px-2">
              <button
                onClick={() => router.push("/catalog")}
                className="group flex items-center justify-center gap-2 bg-[#D4A97A] hover:bg-[#C4976A] px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-semibold text-[#1C1209] text-sm transition w-full sm:w-auto"
              >
                Explore Designs
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => router.push("/catalog")}
                className="px-6 sm:px-7 py-3 sm:py-3.5 border border-white/20 hover:border-white/40 rounded-full font-medium text-white/70 hover:text-white text-sm transition w-full sm:w-auto"
              >
                How It Works
              </button>
            </div>
          </Reveal>

          {/* TRUST PILLS */}
          <Reveal delay={0.45}>
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mt-8 sm:mt-12 px-2">
              {["3D & AR Preview", "Made to Order", "Custom Finishes", "Chat with Craftsmen"].map((pill) => (
                <span
                  key={pill}
                  className="flex items-center gap-1.5 bg-white/5 px-2.5 sm:px-3 py-1 border border-white/10 rounded-full text-white/50 text-[10px] sm:text-xs"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#D4A97A] shrink-0" />
                  {pill}
                </span>
              ))}
            </div>
          </Reveal>

          {/* SCROLL CUE */}
          <div className="bottom-3 sm:bottom-4 left-1/2 absolute -translate-x-1/2 animate-bounce" aria-hidden>
            <div className="flex justify-center items-start pt-1.5 border-2 border-white/20 rounded-full w-6 h-10">
              <div className="bg-[#D4A97A] rounded-full w-1 h-2" />
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="bg-white/[0.03] px-4 sm:px-6 py-8 sm:py-10 border-white/5 border-y">
          <div className="gap-6 sm:gap-8 grid grid-cols-2 md:grid-cols-4 mx-auto max-w-5xl text-center">
            {[
              ["100%", "Made to Order"],
              ["3D + AR", "Live Preview"],
              ["Custom", "Wood & Finishes"],
              ["Direct", "Craftsman Chat"],
            ].map(([val, label], i) => (
              <Reveal key={label} delay={i * 0.08} from="bottom">
                <div>
                  <p className="font-bold text-[#D4A97A] text-2xl sm:text-3xl">{val}</p>
                  <p className="mt-1 text-white/40 text-xs sm:text-sm">{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FEATURED COLLECTION */}
        <section className="px-4 sm:px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal from="bottom" delay={0.05}>
              <div 
                id="inquiry-highlight-card"
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#1C1209] via-[#160E07] to-transparent mb-12 p-6 sm:p-8 border border-white/5 rounded-2xl scroll-mt-24"
              >
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 bg-[#D4A97A]/10 mb-3 px-2.5 py-1 rounded-md text-[#D4A97A] text-xs font-semibold tracking-wider uppercase">
                    <HelpCircle className="w-3.5 h-3.5" /> Have a Specific Blueprint?
                  </div>
                  <h3 className="font-bold text-white text-lg sm:text-xl">
                    Looking for dimensions or wood profiles not shown below?
                  </h3>
                  <p className="mt-2 text-white/50 text-xs sm:text-sm leading-relaxed">
                    Every piece on WoodForge serves as a launching pad. Submit an inquiry for explicit custom configurations, sizing alternatives, or custom architectural project quotes.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/inquiry")}
                  className="group flex items-center justify-center gap-2 bg-[#D4A97A]/10 hover:bg-[#D4A97A] border border-[#D4A97A]/30 hover:border-transparent px-5 py-3 rounded-full font-medium text-[#D4A97A] hover:text-[#1C1209] text-xs uppercase tracking-wider transition shrink-0 whitespace-nowrap"
                >
                  Start Custom Inquiry
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </Reveal>

            <Reveal>
              <div className="mb-3 sm:mb-4 font-semibold text-[#D4A97A] text-xs uppercase tracking-widest">
                Featured Designs
              </div>
              <div className="flex justify-between items-end">
                <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight">
                  Handcrafted
                  <br />
                  <span className="text-white/40">Collections</span>
                </h2>
                <button
                  onClick={() => router.push("/catalog")}
                  className="group flex items-center gap-1 text-white/50 hover:text-[#D4A97A] text-sm transition shrink-0 ml-4"
                >
                  View all
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </Reveal>

            {isError && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-red-500/10 mt-6 sm:mb-6 px-4 sm:px-5 py-4 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <span>Failed to load designs. {error instanceof Error ? error.message : ""}</span>
                <button
                  onClick={() => refetch()}
                  className="bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-full text-xs transition shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="gap-4 sm:gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-8 sm:mt-10">
              {(isLoading ? Array.from({ length: 6 }) : items.slice(0, 6)).map((item, idx) => {
                if (isLoading || !item) {
                  return (
                    <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                      <div className="bg-white/5 h-44 sm:h-52 animate-pulse" />
                      <div className="space-y-3 p-4 sm:p-5">
                        <div className="bg-white/5 rounded-full w-3/4 h-4 animate-pulse" />
                        <div className="bg-white/5 rounded-full w-1/2 h-3 animate-pulse" />
                      </div>
                    </div>
                  );
                }
                const furnitureItem = item as FurniturePublicListItem;
                return (
                  <Reveal key={furnitureItem.id} delay={idx * 0.07}>
                    <CustomerFurnitureCard item={furnitureItem} />
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* AI + TECHNOLOGY SECTION */}
        <section className="px-4 sm:px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="bg-gradient-to-br from-[#1C1209] to-[#0F0A06] border border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
                    <div className="inline-flex items-center gap-2 bg-[#D4A97A]/10 mb-4 px-3 py-1 rounded-full w-fit font-medium text-[#D4A97A] text-xs uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" /> AI-Powered
                    </div>
                    <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight">
                      See It Before
                      <br />
                      <span className="text-[#D4A97A]">It's Built</span>
                    </h2>
                    <p className="mt-4 text-white/50 text-sm leading-relaxed">
                      Our platform uses 3D rendering and Augmented Reality so you can place
                      your future furniture in your actual room — before a single nail is hammered.
                    </p>

                    <ul className="space-y-3 mt-6 sm:mt-8">
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
                      className="group flex items-center gap-2 bg-[#D4A97A] hover:bg-[#C4976A] mt-8 sm:mt-10 px-5 sm:px-6 py-3 rounded-full w-fit font-semibold text-[#1C1209] text-sm transition"
                    >
                      Try It Now
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>

                  <div className="relative flex justify-center items-center bg-[#D4A97A]/5 p-6 sm:p-10 min-h-[260px] sm:min-h-[340px]">
                    <div className="absolute inset-0 flex justify-center items-center pointer-events-none" aria-hidden>
                      <div className="bg-[#D4A97A]/10 blur-3xl rounded-full w-48 sm:w-64 h-48 sm:h-64" />
                    </div>
                    <div className="relative space-y-3 w-full max-w-[280px] sm:max-w-xs">
                      <div className="bg-[#1C1209]/80 backdrop-blur p-4 sm:p-5 border border-white/10 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="flex justify-center items-center bg-[#D4A97A]/20 rounded-xl w-9 sm:w-10 h-9 sm:h-10 text-[#D4A97A] shrink-0">
                            <Box className="w-4 sm:w-5 h-4 sm:h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">3D Viewer</p>
                            <p className="text-white/40 text-xs">Rotate · Zoom · Inspect</p>
                          </div>
                        </div>
                        <div className="flex justify-center items-center bg-white/5 mt-4 rounded-xl h-24 sm:h-28 text-white/20 text-xs">
                          GLB model preview
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-[#1C1209]/80 backdrop-blur p-3.5 sm:p-4 border border-white/10 rounded-2xl">
                        <div className="flex justify-center items-center bg-[#D4A97A]/20 rounded-xl w-9 h-9 text-[#D4A97A] shrink-0">
                          <Scan className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">AR Preview</p>
                          <p className="text-white/40 text-xs">Place in your room</p>
                        </div>
                        <span className="bg-green-500/20 ml-auto px-2 py-0.5 rounded-full text-[10px] text-green-400 shrink-0">
                          Live
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-4 sm:px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="mb-3 sm:mb-4 font-semibold text-[#D4A97A] text-xs uppercase tracking-widest">
                Our Process
              </div>
              <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl">
                From Idea to{" "}
                <span className="text-white/40">Doorstep</span>
              </h2>
            </Reveal>

            <div className="gap-4 sm:gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-8 sm:mt-12">
              {[
                {
                  step: "01",
                  icon: <Layers className="w-5 sm:w-6 h-5 sm:h-6" />,
                  title: "Choose a Design",
                  desc: "Browse our catalog of curated, made-to-order furniture designs.",
                },
                {
                  step: "02",
                  icon: <Sparkles className="w-5 sm:w-6 h-5 sm:h-6" />,
                  title: "Customize & Preview",
                  desc: "Select wood, finish, and texture. Preview live in 3D or place it in AR.",
                },
                {
                  step: "03",
                  icon: <MessageSquare className="w-5 sm:w-6 h-5 sm:h-6" />,
                  title: "Collaborate",
                  desc: "Chat directly with our craftsmen. Request changes before production starts.",
                },
                {
                  step: "04",
                  icon: <CheckCircle2 className="w-5 sm:w-6 h-5 sm:h-6" />,
                  title: "Receive Your Piece",
                  desc: "We build it, you approve it. Pickup or delivery — your choice.",
                },
              ].map(({ step, icon, title, desc }, i) => (
                <Reveal key={step} delay={i * 0.1} from="bottom">
                  <div className="group relative bg-white/[0.03] hover:bg-white/[0.05] p-5 sm:p-6 border border-white/5 hover:border-[#D4A97A]/20 rounded-2xl overflow-hidden transition">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex justify-center items-center bg-[#D4A97A]/10 rounded-xl w-10 sm:w-12 h-10 sm:h-12 text-[#D4A97A]">
                        {icon}
                      </div>
                      <span className="font-bold text-white/5 group-hover:text-white/10 text-3xl sm:text-4xl transition">
                        {step}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
                    <p className="mt-2 text-white/40 text-xs sm:text-sm leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="px-4 sm:px-6 py-16 sm:py-24">
          <Reveal from="bottom">
            <div className="bg-[#D4A97A] mx-auto px-5 sm:px-8 py-10 sm:py-14 lg:py-16 rounded-2xl sm:rounded-3xl max-w-4xl text-center">
              <h2 className="font-bold text-[#1C1209] text-2xl sm:text-3xl lg:text-4xl">
                Ready to Build Your Perfect Piece?
              </h2>
              <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-[#3A2B22]/70 text-sm sm:text-base">
                Join our made-to-order community. Every order starts with a conversation.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 mt-6 sm:mt-8">
                <button
                  onClick={() => router.push("/catalog")}
                  className="group flex items-center justify-center gap-2 bg-[#1C1209] hover:bg-[#2F1E0F] px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold text-white text-sm transition w-full sm:w-auto"
                >
                  Browse the Catalog
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => router.push("/auth/register")}
                  className="px-6 sm:px-8 py-3 sm:py-3.5 border-[#1C1209]/30 border-2 hover:border-[#1C1209] rounded-full font-medium text-[#1C1209] text-sm transition w-full sm:w-auto"
                >
                  Create an Account
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#0F0A06] px-4 sm:px-6 py-10 sm:py-14 border-white/5 border-t">
          <div className="mx-auto max-w-7xl">
            <div className="gap-8 sm:gap-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="col-span-2 lg:col-span-2">
                <p className="font-bold text-[#D4A97A] text-xl tracking-widest">
                  WOOD<span className="text-white">FORGE</span>
                </p>
                <p className="mt-3 max-w-xs text-white/30 text-sm leading-relaxed">
                  Made-to-order furniture crafted with precision and powered by 3D & AR technology.
                </p>
              </div>
              <div>
                <p className="mb-3 sm:mb-4 font-semibold text-white/30 text-xs uppercase tracking-widest">Shop</p>
                <ul className="space-y-2 text-white/50 text-sm">
                  {["All Designs", "Living Room", "Bedroom", "Dining"].map((l) => (
                    <li key={l}>
                      <button onClick={() => router.push("/catalog")} className="hover:text-[#D4A97A] transition text-left">
                        {l}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 sm:mb-4 font-semibold text-white/30 text-xs uppercase tracking-widest">Company</p>
                <ul className="space-y-2 text-white/50 text-sm">
                  {["About Us", "Our Process", "Contact", "Privacy Policy"].map((l) => (
                    <li key={l}>
                      <a href="#" className="hover:text-[#D4A97A] transition">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-10 sm:mt-12 pt-6 sm:pt-8 border-white/5 border-t">
              <p className="text-white/20 text-xs text-center sm:text-left">
                &copy; {new Date().getFullYear()} WoodForge. All rights reserved.
              </p>
              <div className="flex gap-4 sm:gap-5 text-white/30 text-xs">
                {["Instagram", "Pinterest", "Facebook"].map((s) => (
                  <a key={s} href="#" className="hover:text-[#D4A97A] transition">{s}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>

        <TutorialWidget />
      </div>
    </PageTransition>
  );
}