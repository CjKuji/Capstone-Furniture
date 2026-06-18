"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  Hammer, 
  DoorOpen, 
  Grid, 
  Armchair, 
  MapPin, 
  Clock, 
  Sparkles, 
  ChevronRight,
  PhoneCall,
  ArrowRight,
  HelpCircle,
  Box,
  Scan,
  Layers,
  MessageSquare
} from "lucide-react";

import Navbar from "@/app/components/Navbar";
import Reveal from "@/app/components/Reveal";
import PageTransition from "@/app/components/PageTransition";
import TutorialWidget from "@/app/components/TutorialWidget";

export default function AboutBLSashFactory() {
  const router = useRouter();

  return (
    <PageTransition>
      <div className="relative bg-[#0F0A06] min-h-screen font-sans text-white overflow-x-hidden antialiased print:bg-white print:text-black">
        
        {/* ═══════════════════════════════════════════════════════
            FIXED NAVBAR BLOCK
        ═══════════════════════════════════════════════════════ */}
        <div className="fixed top-0 left-0 w-full z-50 print:hidden">
          <Navbar />
        </div>

        {/* ═══════════════════════════════════════════════════════
            HERO STORY SECTION (Padded for Navbar alignment)
        ═══════════════════════════════════════════════════════ */}
        <section className="relative px-4 sm:px-6 pt-28 pb-12 max-w-7xl mx-auto space-y-10">
          
          {/* Ambient Glow Blobs matching Home configuration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="top-20 -left-40 absolute bg-[#7A4E2D]/10 blur-[120px] rounded-full w-[400px] h-[400px] print:hidden" />
            <div className="-right-40 top-40 absolute bg-[#D4A97A]/5 blur-[100px] rounded-full w-[300px] h-[300px] print:hidden" />
          </div>

          {/* Sub-Header / Breadcrumb metadata bar */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 print:border-black/20 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-1 bg-[#D4A97A] rounded-full shadow-[0_0_8px_rgba(212,169,122,0.3)] print:bg-amber-700 print:shadow-none" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white print:text-black">
                  About Our Factory
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-white/40 print:text-black/60 font-medium">
                BL Sash Factory &bull; Premium Made-to-Order Woodworks
              </p>
            </div>

            {/* Location Badge */}
            <div className="flex items-center space-x-3 text-xs bg-white/[0.02] border border-white/5 print:border-black/10 shadow-2xl px-4 py-2 rounded-xl self-start sm:self-auto print:shadow-none">
              <MapPin size={14} className="text-[#D4A97A]" />
              <span className="text-white/60 print:text-black/70 font-medium tracking-wide">
                Workshop Location: <span className="text-white font-semibold ml-0.5">Olongapo City, PH</span>
              </span>
            </div>
          </div>

          {/* Core Story Layout */}
          <Reveal delay={0.05}>
            <div className="relative bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden print:bg-white print:text-black print:border-black/20 print:shadow-none">
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[#D4A97A]/20 to-transparent print:hidden" />
              
              <div className="max-w-4xl space-y-4 relative z-10">
                <span className="text-[10px] font-bold text-[#D4A97A] print:text-amber-800 uppercase tracking-widest block">
                  Crafting Your Vision, One Detail at a Time
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white/95 print:text-black">
                  The Olongapo Standard for Custom Woodworking
                </h2>
                <p className="text-sm text-white/60 print:text-black/80 font-normal leading-relaxed">
                  Based in the heart of Olongapo City, <strong className="text-[#D4A97A] font-semibold">BL Sash Factory</strong> is a trusted destination for premium, made-to-order furniture and architectural woodwork. We specialize in transforming raw lumber into beautiful, functional, and durable pieces tailored precisely to your structural dimensions and design taste.
                </p>
                <p className="text-sm text-white/60 print:text-black/80 font-normal leading-relaxed">
                  Unlike mass-produced, assembly-line alternatives, everything we build is crafted with intentionality. From sleek modern kitchen cabinets to timeless solid wood main doors and ergonomically designed chairs, we prioritize the unique structural requirements of our clients. Our master carpenters blend time-honored techniques with contemporary engineering to deliver woodwork built to weather decades of use.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CORE OFFERINGS & SPECIALIZATIONS
        ═══════════════════════════════════════════════════════ */}
        <section className="relative px-4 sm:px-6 pb-16 max-w-7xl mx-auto space-y-6">
          <Reveal>
            <div className="flex items-center space-x-2">
              <Hammer size={14} className="text-[#D4A97A] print:text-amber-700" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 print:text-black/50">
                Made-To-Order Specializations
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            {/* CABINETS */}
            <Reveal delay={0.1}>
              <AboutCard 
                title="Custom Cabinetry" 
                icon={Grid}
                description="Kitchen showcases, bedroom wardrobes, bathroom vanities, and modular storage units perfectly optimized to fit your room's precise floor plans."
              />
            </Reveal>

            {/* DOORS */}
            <Reveal delay={0.15}>
              <AboutCard 
                title="Premium Doors & Sashes" 
                icon={DoorOpen}
                description="Architectural main entrances, traditional panel-sash doors, sleek internal room doors, and heavy-duty wooden frames engineered for structural alignment."
              />
            </Reveal>

            {/* CHAIRS & FURNITURE */}
            <Reveal delay={0.2}>
              <AboutCard 
                title="Bespoke Chairs & Seating" 
                icon={Armchair}
                description="Ergonomic dining sets, heavy-duty lounge frames, accent seating, and custom counter stools combining balanced stability with exquisite finish."
              />
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            FACTORY QUICK FACTS & SCHEDULE PIPELINE
        ═══════════════════════════════════════════════════════ */}
        <section className="relative px-4 sm:px-6 pb-24 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start relative z-10">
            
            {/* STRUCTURAL WHY CHOOSE US LIST */}
            <Reveal delay={0.25} className="lg:col-span-2">
              <div className="bg-white/[0.01] border border-white/5 print:border-black/20 rounded-2xl p-6 space-y-4 shadow-2xl print:shadow-none">
                <h3 className="text-xs font-bold text-white/90 print:text-black/80 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
                  <Sparkles size={14} className="text-[#D4A97A]" /> Why Choose Our Custom Pipeline?
                </h3>
                
                <ul className="space-y-4 pt-1 text-sm">
                  <li className="flex items-start gap-3">
                    <ChevronRight size={16} className="text-[#D4A97A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white print:text-black font-semibold block">100% Dimensional Accuracy</strong>
                      <span className="text-white/40 print:text-black/60 text-xs">No generic templates. Every build matches your custom measurements down to the millimeter.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <ChevronRight size={16} className="text-[#D4A97A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white print:text-black font-semibold block">Hand-Selected Material Grading</strong>
                      <span className="text-white/40 print:text-black/60 text-xs">You choose the lumber species, grain flow, staining hues, and hardware tailored to your structural environments.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <ChevronRight size={16} className="text-[#D4A97A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white print:text-black font-semibold block">Olongapo Community Trust</strong>
                      <span className="text-white/40 print:text-black/60 text-xs">Transparent local processing times, zero hidden middleman markup fees, and direct-to-carpenter communication pathways.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </Reveal>

            {/* WORKSHOP HOURS & CALL TO ACTION */}
            <Reveal delay={0.3}>
              <div className="bg-white/[0.01] border border-white/5 print:border-black/20 rounded-2xl p-5 space-y-5 shadow-xl print:shadow-none">
                <h3 className="text-xs font-bold text-white/40 print:text-black/50 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={13} className="text-[#D4A97A]" /> Workshop Schedule
                </h3>

                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                    <span className="text-white/60">Monday - Friday</span>
                    <span className="text-[#D4A97A] font-mono">8:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                    <span className="text-white/60">Saturday</span>
                    <span className="text-[#D4A97A] font-mono">8:00 AM - 1:00 PM</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-white/[0.01] border border-white/5 text-white/20">
                    <span>Sunday</span>
                    <span className="italic uppercase text-[10px]">Closed for rest</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 text-center">
                  <p className="text-[11px] text-white/40 italic mb-4">
                    Have measurements or raw blueprints ready? Reach our team to initiate a configuration map.
                  </p>
                  <button 
                    onClick={() => router.push("/inquiry")}
                    className="w-full py-2.5 rounded-xl bg-[#D4A97A]/10 hover:bg-[#D4A97A] border border-[#D4A97A]/30 hover:border-transparent text-[#D4A97A] hover:text-[#1C1209] font-bold text-xs tracking-wide uppercase transition duration-200 flex items-center justify-center gap-2"
                  >
                    <PhoneCall size={13} /> Book Consultation
                  </button>
                </div>
              </div>
            </Reveal>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            FOOTER (Synchronized directly with HomePage architecture)
        ═══════════════════════════════════════════════════════ */}
        <footer className="bg-[#0F0A06] px-4 sm:px-6 py-10 sm:py-14 border-white/5 border-t relative z-10 print:hidden">
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

        {/* Global Floating Utilities */}
        <TutorialWidget />
      </div>
    </PageTransition>
  );
}

/* =========================================================
   SUB-COMPONENT: THEMED ABOUT SPECIALIZATION CARD
========================================================= */
function AboutCard({
  title,
  icon: IconComponent,
  description
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}) {
  return (
    <div className="border border-white/5 text-white print:text-black bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl p-5 transition-all duration-300 flex flex-col group hover:border-[#D4A97A]/20 shadow-lg print:shadow-none break-inside-avoid">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5 w-full">
        <p className="text-xs font-bold text-white/80 print:text-black/90 uppercase tracking-widest">{title}</p>
        <IconComponent size={15} className="text-[#D4A97A]/70 transition-transform group-hover:scale-110 duration-200 shrink-0" />
      </div>
      <div className="pt-3 flex-1 flex flex-col justify-between">
        <p className="text-xs text-white/40 print:text-black/60 leading-relaxed font-normal whitespace-normal break-words">
          {description}
        </p>
      </div>
    </div>
  );
}