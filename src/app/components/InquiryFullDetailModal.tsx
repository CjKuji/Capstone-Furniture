"use client";

import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  X, 
  Hammer, 
  Info, 
  ImageIcon, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  Layers,
  FileText
} from "lucide-react";

// Matches your precise hook data signatures perfectly
interface InquiryImage {
  id: string;
  inquiry_item_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface InquiryItem {
  id: string;
  inquiry_id: string;
  title: string | null;
  description: string;
  quantity: number;
  unit_price?: number;  // Optionalized to safely bind to raw customized structural inquiries
  total_price?: number; // Optionalized to safely bind to raw customized structural inquiries
  created_at: string;
  updated_at: string;
  inquiry_images: InquiryImage[]; 
}

interface InquiryFullDetailModalProps {
  open: boolean;
  onClose: () => void;
  inquiry_items?: InquiryItem[];
}

export default function InquiryFullDetailModal({ open, onClose, inquiry_items = [] }: InquiryFullDetailModalProps) {
  // Prevent scrolling behind the modal backdrop overlay when active
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 transition-all duration-300 animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#3A2A1A] bg-gradient-to-b from-[#0F0A06] to-[#070503] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col group/modal">
        
        {/* Subtle decorative top copper glow border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A97A]/30 to-transparent" />

        {/* HEADER SECTION */}
        <div className="flex items-center justify-between border-b border-[#231A10] pb-4 mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D4A97A]/5 border border-[#D4A97A]/10">
              <Hammer className="w-4 h-4 text-[#D4A97A]" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white">Design Specifications</h3>
              <p className="text-[10px] text-white/40 font-medium mt-0.5">Review configuration parameters & structural blueprints</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2 text-white/40 hover:bg-white/5 hover:text-white transition-all duration-200 border border-transparent hover:border-white/5 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BLUEPRINT STREAM VIEWPORT CONTAINER */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-[#231A10] scrollbar-track-transparent custom-scrollbar">
          {inquiry_items.length === 0 ? (
            <div className="w-full py-12 text-center border border-dashed border-[#231A10] rounded-2xl bg-black/10 p-6">
              <Info className="w-6 h-6 mx-auto text-white/20 mb-2" />
              <p className="text-xs italic text-white/40">No configuration blueprint datasets linked to this interface instance.</p>
            </div>
          ) : (
            inquiry_items.map((item, index) => (
              <InquiryItemRow key={item.id || index} item={item} index={index} />
            ))
          )}
        </div>

        {/* FOOTER SUMMARY COUNTER */}
        <div className="mt-5 pt-4 border-t border-[#231A10] flex items-center justify-between text-[11px] text-white/40 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-[#D4A97A]/60" /> Total Component Modules: {inquiry_items.length}
          </span>
          <span className="font-mono bg-[#140F0A] px-2.5 py-1 rounded-md border border-[#231A10]">
            SECURE ACCESS LAYER
          </span>
        </div>
      </div>
    </div>
  );
}

function InquiryItemRow({ item, index }: { item: InquiryItem; index: number }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Sort images safely by order metrics
  const sortedImages = useMemo(() => {
    if (!item.inquiry_images || item.inquiry_images.length === 0) return [];
    return [...item.inquiry_images].sort((a, b) => a.sort_order - b.sort_order);
  }, [item.inquiry_images]);

  // Map image records directly to live public links 
  const resolvedImageUrl = useMemo(() => {
    if (sortedImages.length === 0) return null;
    let rawPath = sortedImages[activeImgIndex]?.image_url?.trim();
    if (!rawPath) return null;

    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      return rawPath;
    }

    if (rawPath.startsWith("inquiries/")) {
      rawPath = rawPath.replace("inquiries/", "");
    }

    const { data } = supabase.storage
      .from("inquiries") 
      .getPublicUrl(rawPath);

    return data?.publicUrl || null;
  }, [sortedImages, activeImgIndex]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  // Keyboard context tracking triggers for active lightboxes
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, sortedImages]);

  return (
    <div className="border border-[#231A10] bg-gradient-to-b from-white/[0.01] to-transparent rounded-xl p-4.5 space-y-4 hover:border-[#D4A97A]/20 transition-all duration-300 relative">
      
      {/* TITLE BAR & DECORATIVE PILL LABELS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.03] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest text-[#A68056] uppercase bg-[#A68056]/5 px-2 py-0.5 rounded border border-[#A68056]/10 shrink-0">
            Module 0{index + 1}
          </span>
          <h4 className="font-bold text-[13px] text-white tracking-wide truncate max-w-[280px]">
            {item.title || "Custom Configuration Item"}
          </h4>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-center text-[11px] text-white/50 bg-black/30 px-2.5 py-1 rounded-lg border border-[#231A10]">
          <span className="font-medium">Quantity:</span>
          <span className="font-mono font-bold text-[#D4A97A]">{item.quantity} units</span>
        </div>
      </div>

      {/* DYNAMIC BLUEPRINT IMAGE SLIDER BOX FRAME */}
      {resolvedImageUrl ? (
        <div className="space-y-3">
          <div 
            onClick={() => setIsLightboxOpen(true)}
            className="relative w-full h-56 rounded-xl overflow-hidden border border-[#2A1E13] bg-[#070503] flex items-center justify-center p-3 group cursor-zoom-in hover:border-[#D4A97A]/40 transition-all duration-300 shadow-inner"
          >
            {/* Dark aesthetic canvas subtle cross grid texture behind alpha layers */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#110c08_1px,transparent_1px),linear-gradient(to_bottom,#110c08_1px,transparent_1px)] bg-[size:16px_16px] opacity-40 pointer-events-none" />

            <img 
              src={resolvedImageUrl} 
              alt={`${item.title || "Blueprint reference"} - Variant view ${activeImgIndex + 1}`} 
              className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03] z-10"
              key={resolvedImageUrl}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const debugContainer = document.getElementById(`debug-panel-${item.id || index}-${activeImgIndex}`);
                if (debugContainer) debugContainer.style.display = "flex";
              }}
            />

            {/* HOVER INDICATION EXPANDING OVERLAY BUTTON */}
            <div className="absolute top-3 right-3 bg-black/80 rounded-xl p-2 border border-white/10 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-20 pointer-events-none backdrop-blur-md">
              <Maximize2 className="w-3.5 h-3.5 text-[#D4A97A]" />
            </div>

            {/* ERROR BOUNDARY PANEL VISUAL */}
            <div 
              id={`debug-panel-${item.id || index}-${activeImgIndex}`}
              style={{ display: "none" }}
              className="w-full h-full flex flex-col items-center justify-center gap-2 text-center text-white/50 p-4 z-20"
            >
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 mb-1">
                <ImageIcon className="w-5 h-5 text-amber-500/80 animate-pulse" />
              </div>
              <div className="space-y-1 px-4 w-full">
                <p className="text-xs font-bold text-amber-500">Asset Stream Failed</p>
                <p className="text-[9px] text-white/30 max-w-xs font-mono bg-black/80 p-1.5 rounded-lg border border-white/5 mx-auto truncate select-all">
                  {resolvedImageUrl}
                </p>
              </div>
            </div>

            {/* DIRECTIONAL CAROUSEL CONTROLS (< and >) */}
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl bg-black/80 border border-[#3A2A1A] p-2 text-white/60 hover:text-[#D4A97A] hover:bg-black transition-all duration-200 opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm shadow-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-black/80 border border-[#3A2A1A] p-2 text-white/60 hover:text-[#D4A97A] hover:bg-black transition-all duration-200 opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm shadow-md"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* LOWER MINI MATRIX MATRIX SELECTOR ROW */}
          <div className="flex flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-[80%] no-scrollbar custom-scrollbar">
              {sortedImages.map((img, thumbIdx) => {
                let thumbPath = img.image_url?.trim();
                let finalThumbUrl = thumbPath;
                if (thumbPath && !thumbPath.startsWith("http")) {
                  if (thumbPath.startsWith("inquiries/")) thumbPath = thumbPath.replace("inquiries/", "");
                  finalThumbUrl = supabase.storage.from("inquiries").getPublicUrl(thumbPath).data?.publicUrl || "";
                }

                return (
                  <button
                    key={img.id || thumbIdx}
                    onClick={() => setActiveImgIndex(thumbIdx)}
                    className={`relative w-11 h-11 rounded-lg border overflow-hidden bg-[#070503] flex-shrink-0 transition-all duration-200 p-0.5 ${
                      activeImgIndex === thumbIdx 
                        ? "border-[#D4A97A] ring-1 ring-[#D4A97A]/40 scale-105 shadow-md shadow-black" 
                        : "border-[#231A10] hover:border-white/20 hover:scale-102"
                    }`}
                  >
                    <img src={finalThumbUrl} alt="thumbnail" className="w-full h-full object-cover rounded-md" />
                  </button>
                );
              })}
            </div>

            {sortedImages.length > 1 && (
              <span className="text-[10px] font-mono font-bold text-white/40 bg-[#0F0A06] border border-[#231A10] px-2.5 py-1 rounded-lg flex-shrink-0 shadow-sm">
                {activeImgIndex + 1} <span className="text-white/10 mx-0.5">/</span> {sortedImages.length}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full py-6 px-4 flex flex-col items-center justify-center gap-2 border border-dashed border-[#2A1E13] rounded-xl bg-black/20 text-center">
          <FileText className="w-5 h-5 text-white/10" />
          <span className="text-[11px] text-white/40 block font-medium">No attached blueprint references found.</span>
        </div>
      )}

      {/* CRITICAL DATA / BUILD INSTRUCTIONS */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-black uppercase text-[#A68056]/70 tracking-[0.1em] block">
          Client Specification Overview:
        </span>
        <div className="text-[12px] text-white/70 bg-[#070503]/80 border border-[#1A130B] p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap font-sans">
          {item.description ? (
            <span className="italic">&ldquo;{item.description}&rdquo;</span>
          ) : (
            <span className="text-white/30 text-[11px] italic">No text annotations were compiled for this module structure.</span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* IMMERSIVE LIGHTBOX EXPANSION SCREEN PORTAL */}
      {/* ========================================================================= */}
      {isLightboxOpen && resolvedImageUrl && (
        <div 
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
        >
          {/* Top Global Data Layer */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10 pointer-events-none">
            <div className="bg-black/70 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md shadow-xl">
              <p className="text-xs font-bold font-mono text-[#D4A97A] tracking-wide">{item.title || "Module Item Details"}</p>
              <p className="text-[10px] text-white/40 mt-0.5 font-medium">Full Scale Resolution Profile &bull; View Variant {activeImgIndex + 1}</p>
            </div>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="pointer-events-auto rounded-xl bg-black/70 border border-white/10 p-2.5 text-white/60 hover:text-white hover:bg-black transition-all duration-200 backdrop-blur-md shadow-xl active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Central Workspace Canvas Wrapper */}
          <div className="relative w-full max-w-5xl h-[75vh] flex items-center justify-center select-none">
            {sortedImages.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-20 rounded-xl bg-black/70 border border-white/10 p-3.5 text-white/70 hover:text-white hover:bg-black transition-all backdrop-blur-sm active:scale-95 shadow-2xl"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img 
              src={resolvedImageUrl} 
              alt="High Resolution Layout Display" 
              onClick={(e) => e.stopPropagation()} 
              className="max-w-full max-h-full object-contain rounded-xl shadow-[0_30px_70px_rgba(0,0,0,0.9)] border border-white/5 animate-in zoom-in-95 duration-300"
            />

            {sortedImages.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-20 rounded-xl bg-black/70 border border-white/10 p-3.5 text-white/70 hover:text-white hover:bg-black transition-all backdrop-blur-sm active:scale-95 shadow-2xl"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Horizontal Lower Index Controller Strip */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="mt-6 flex flex-col items-center gap-3 bg-gradient-to-b from-[#140F0A] to-[#0A0705] border border-[#231A10] p-3 rounded-2xl backdrop-blur-md max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-2 overflow-x-auto max-w-full py-0.5 no-scrollbar custom-scrollbar">
              {sortedImages.map((img, thumbIdx) => {
                let thumbPath = img.image_url?.trim();
                let finalThumbUrl = thumbPath;
                if (thumbPath && !thumbPath.startsWith("http")) {
                  if (thumbPath.startsWith("inquiries/")) thumbPath = thumbPath.replace("inquiries/", "");
                  finalThumbUrl = supabase.storage.from("inquiries").getPublicUrl(thumbPath).data?.publicUrl || "";
                }

                return (
                  <button
                    key={`lightbox-thumb-${img.id || thumbIdx}`}
                    onClick={() => setActiveImgIndex(thumbIdx)}
                    className={`relative w-12 h-12 rounded-xl border overflow-hidden bg-black flex-shrink-0 transition-all duration-200 p-0.5 ${
                      activeImgIndex === thumbIdx 
                        ? "border-[#D4A97A] ring-2 ring-[#D4A97A]/20 scale-105 shadow-xl" 
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img src={finalThumbUrl} alt="thumbnail" className="w-full h-full object-cover rounded-lg" />
                  </button>
                );
              })}
            </div>

            {sortedImages.length > 1 && (
              <span className="text-[11px] font-mono font-bold text-white/50 bg-black/40 border border-white/5 px-3 py-1 rounded-lg">
                {activeImgIndex + 1} <span className="text-[#D4A97A]/30 mx-1">/</span> {sortedImages.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}