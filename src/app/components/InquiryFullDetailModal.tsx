"use client";

import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  X, 
  Info, 
  ImageIcon, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  Layers,
  FileText,
  Hash,
  Package,
  Calendar,
  Compass,
  LayoutGrid
} from "lucide-react";

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
  unit_price?: number;  
  total_price?: number; 
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
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  // Safely adjust state during render phase if inputs dynamically decrease
  if (inquiry_items.length > 0 && selectedItemIndex >= inquiry_items.length) {
    setSelectedItemIndex(0);
  }

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const currentActiveItem = inquiry_items[selectedItemIndex] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300 animate-in fade-in">
      
      {/* GLOBAL MODAL CONTAINER */}
      <div className="relative w-full max-w-6xl h-[85vh] min-h-[550px] rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl flex flex-col overflow-hidden">
        
        {/* TOP HEADER BAR */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 shrink-0 bg-neutral-900/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#D4A97A]/10 border border-[#D4A97A]/30">
              <Package className="w-5 h-5 text-[#D4A97A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-neutral-100 flex items-center gap-2">
                Inquiry Item Specifications
                <span className="text-[11px] font-mono tracking-normal font-medium bg-neutral-800 border border-neutral-700 text-[#D4A97A] px-2 py-0.5 rounded-md">
                  Details View
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Review full requested structural items, descriptions, and dynamic visuals</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-xl p-2.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all duration-200 border border-transparent active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* INTERACTIVE WORKSPACE SPLIT-VIEW */}
        {inquiry_items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-neutral-950">
            <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 mb-3">
              <Info className="w-6 h-6 text-neutral-500" />
            </div>
            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
              No items or manufacturing details are currently assigned to this entry.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            
            {/* LEFT SIDE: ITEM TRACK NAVIGATION LIST */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-row md:flex-col shrink-0 bg-neutral-900/20 overflow-x-auto md:overflow-y-auto p-3 gap-2 custom-scrollbar select-none">
              <div className="hidden md:block px-2 pb-1.5 pt-0.5">
                <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-[#D4A97A]" /> Included Items ({inquiry_items.length})
                </span>
              </div>
              {inquiry_items.map((item, idx) => {
                const isActive = idx === selectedItemIndex;
                return (
                  <button
                    key={item.id || idx}
                    onClick={() => setSelectedItemIndex(idx)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 shrink-0 md:shrink-1 w-56 md:w-auto relative ${
                      isActive 
                        ? "bg-neutral-900 border-neutral-700 text-white shadow-md" 
                        : "bg-transparent border-transparent text-neutral-400 hover:bg-neutral-900/40 hover:text-neutral-200"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#D4A97A] rounded-r-full" />
                    )}
                    <div className={`p-1.5 rounded-lg border text-xs font-mono font-bold shrink-0 ${
                      isActive ? "bg-neutral-800 border-neutral-600 text-[#E6C39C]" : "bg-neutral-900 border-neutral-800 text-neutral-500"
                    }`}>
                      {(idx + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate tracking-wide">
                        {item.title || "Custom Item Component"}
                      </p>
                      <p className="text-[11px] opacity-60 truncate mt-0.5">
                        Quantity: {item.quantity} pcs
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* RIGHT SIDE: SELECTION VIEWPORT */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden p-6 gap-6 bg-neutral-950">
              {currentActiveItem && (
                <ActiveItemViewport key={currentActiveItem.id} item={currentActiveItem} index={selectedItemIndex} />
              )}
            </div>

          </div>
        )}

        {/* BOTTOM METRIC SYSTEM FOOTER */}
        <div className="mt-auto px-6 py-3.5 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500 bg-neutral-900/30 shrink-0 select-none">
          <span className="flex items-center gap-2 font-medium">
            <Layers className="w-4 h-4 text-neutral-500" /> 
            Viewing Item: <span className="font-mono text-neutral-300">{(selectedItemIndex + 1).toString().padStart(2, "0")} of {inquiry_items.length.toString().padStart(2, "0")}</span>
          </span>
          <span className="font-mono bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800 tracking-wider text-neutral-400 flex items-center gap-1.5 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> FILE MANAGER SECURE
          </span>
        </div>
      </div>
    </div>
  );
}

function ActiveItemViewport({ item, index }: { item: InquiryItem; index: number }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Reset focus back to index 0 whenever the visible item row switches
  useEffect(() => {
    setActiveImgIndex(0);
  }, [item.id]);

  const sortedImages = useMemo(() => {
    if (!item.inquiry_images || item.inquiry_images.length === 0) return [];
    return [...item.inquiry_images].sort((a, b) => a.sort_order - b.sort_order);
  }, [item.inquiry_images]);

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
    <>
      {/* COLUMN A: VISUAL VIEWPORT DISPLAY */}
      <div className="flex-1 flex flex-col min-h-0 space-y-4 lg:max-w-xl xl:max-w-2xl w-full">
        {resolvedImageUrl ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* LARGE FRAME VIEWPORT */}
            <div 
              onClick={() => setIsLightboxOpen(true)}
              className="flex-1 relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/30 flex items-center justify-center p-6 group cursor-zoom-in hover:border-neutral-700 transition-all duration-300 shadow-inner min-h-[260px]"
            >
              <img 
                src={resolvedImageUrl} 
                alt={`${item.title || "Item attachment"} - Visual ${activeImgIndex + 1}`} 
                className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 ease-out group-hover:scale-[1.01] z-10"
                key={resolvedImageUrl}
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const debugContainer = document.getElementById(`viewport-err-${item.id}-${activeImgIndex}`);
                  if (debugContainer) debugContainer.style.display = "flex";
                }}
              />

              {/* OVERLAY UTILITY CHIPS */}
              <div className="absolute top-4 left-4 bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-300 font-medium z-20 flex items-center gap-1.5 select-none pointer-events-none shadow-md">
                <Compass className="w-3.5 h-3.5 text-[#D4A97A]" /> Click Image to Expand
              </div>

              <div className="absolute top-4 right-4 bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-20 pointer-events-none shadow-md">
                <Maximize2 className="w-4 h-4 text-[#D4A97A]" />
              </div>

              {/* FLOATING IMAGE RATIO INDICATOR */}
              {sortedImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full text-xs font-mono font-bold text-neutral-300 backdrop-blur-md shadow-xl select-none z-20">
                  {activeImgIndex + 1} <span className="text-neutral-650 mx-0.5">/</span> {sortedImages.length}
                </div>
              )}

              {/* FALLBACK FILE SYSTEM DISRUPTION CHIP CONTAINER */}
              <div 
                id={`viewport-err-${item.id}-${activeImgIndex}`}
                style={{ display: "none" }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-neutral-400 p-6 z-20 bg-neutral-950"
              >
                <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800 mb-1">
                  <ImageIcon className="w-6 h-6 text-neutral-500" />
                </div>
                <p className="text-xs font-bold text-neutral-300">Image Failed to Fetch</p>
                <p className="text-[11px] text-neutral-500 max-w-xs font-mono bg-neutral-900 p-2 rounded-xl border border-neutral-800 truncate select-all mx-auto">
                  {resolvedImageUrl}
                </p>
              </div>

              {/* CAROUSEL DIRECTIONAL HOVER BUTTON CONTROLS */}
              {sortedImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all duration-200 opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm shadow-xl active:scale-90"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all duration-200 opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm shadow-xl active:scale-90"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* HORIZONTAL CAROUSEL PREVIEW SLIDER STRIP */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full no-scrollbar custom-scrollbar shrink-0 select-none">
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
                    className={`relative w-14 h-14 rounded-xl border overflow-hidden bg-neutral-900 flex-shrink-0 transition-all duration-200 p-0.5 ${
                      activeImgIndex === thumbIdx 
                        ? "border-[#D4A97A] ring-2 ring-[#D4A97A]/20 scale-102 shadow-md shadow-black" 
                        : "border-neutral-800 hover:border-neutral-600"
                    }`}
                  >
                    <img src={finalThumbUrl} alt="Visual track attachment item preview" className="w-full h-full object-cover rounded-lg" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2.5 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10 text-center p-8 min-h-[200px]">
            <FileText className="w-6 h-6 text-neutral-600" />
            <span className="text-xs text-neutral-500 font-medium">No attached image files uploaded for this item.</span>
          </div>
        )}
      </div>

      {/* COLUMN B: ARCHITECTURAL SPECIFICATIONS AND METADATA */}
      <div className="lg:w-80 xl:w-96 shrink-0 flex flex-col justify-between space-y-5 border-t lg:border-t-0 lg:border-l border-neutral-800 pt-5 lg:pt-0 lg:pl-6 min-h-0">
        
        {/* STRUCTURAL SPECS GRID DETAILS */}
        <div className="space-y-5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#A68056] uppercase bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 inline-block">
              Item Index: {(index + 1).toString().padStart(2, "0")}
            </span>
            <h4 className="font-bold text-base text-white tracking-wide leading-tight mt-1">
              {item.title || "Custom Requested Item"}
            </h4>
          </div>

          <hr className="border-neutral-900" />

          {/* PARAMETRIC INFORMATION METRIC CARDS */}
          <div className="grid grid-cols-2 gap-2.5 select-none">
            
            <div className="p-3 bg-neutral-900/40 border border-neutral-800 rounded-xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] block font-medium text-neutral-500 uppercase tracking-wider">Quantity</span>
                <span className="text-xs font-mono font-bold text-[#D4A97A] mt-0.5 block">{item.quantity} Units</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-900/40 border border-neutral-800 rounded-xl flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] block font-medium text-neutral-500 uppercase tracking-wider">Item ID</span>
                <span className="text-xs font-mono text-neutral-300 font-medium mt-0.5 block truncate max-w-[80px]">
                  {item.id?.substring(0, 8).toUpperCase() || "N/A"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-neutral-900/40 border border-neutral-800 rounded-xl flex items-center gap-3 col-span-2">
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] block font-medium text-neutral-500 uppercase tracking-wider">Date Logged</span>
                <span className="text-xs font-mono text-neutral-300 font-medium mt-0.5 block">
                  {item.created_at ? new Date(item.created_at).toLocaleString("en-US", { hour12: true, dateStyle: "medium", timeStyle: "short" }) : "Unassigned Trace"}
                </span>
              </div>
            </div>

          </div>

          {/* COMPONENT DESCRIPTIONS CARD */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-[#A68056] tracking-wider block">
              Item Requirements & Notes
            </span>
            <div className="text-sm text-neutral-300 bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl leading-relaxed whitespace-pre-wrap font-sans shadow-inner">
              {item.description ? (
                <span className="text-neutral-200 block">&ldquo;{item.description}&rdquo;</span>
              ) : (
                <span className="text-neutral-500 text-xs italic block py-1">
                  No written specifications attached to this item.
                </span>
              )}
            </div>
          </div>

        </div>

        {/* FINANCIAL CALCULATED VALUE LEDGER TRACKER */}
        {(item.unit_price !== undefined || item.total_price !== undefined) && (
          <div className="p-4 rounded-xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 space-y-2.5 select-none shrink-0 shadow-lg">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-medium">Price per Unit</span>
              <span className="font-mono font-bold text-neutral-200">
                {item.unit_price ? `₱${item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "₱0.00"}
              </span>
            </div>
            <div className="h-[1px] bg-neutral-800" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Combined Total</span>
              <span className="text-base font-mono font-black text-[#D4A97A]">
                {item.total_price ? `₱${item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "₱0.00"}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* EXPANDED INTERACTIVE LIGHTBOX VIEW COMPONENT */}
      {/* ========================================================================= */}
      {isLightboxOpen && resolvedImageUrl && (
        <div 
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
        >
          {/* Lightbox Fixed Overlay Floating Controls Header */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10 pointer-events-none">
            <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl backdrop-blur-md shadow-2xl">
              <p className="text-xs font-bold font-mono text-[#D4A97A] tracking-wide">{item.title || "Image attachment overview"}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Expanded Resolution View &bull; Image {activeImgIndex + 1}</p>
            </div>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="pointer-events-auto rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all duration-200 backdrop-blur-md shadow-2xl active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Central High Resolution Image Frame Screen Layer */}
          <div className="relative w-full max-w-5xl h-[75vh] flex items-center justify-center">
            {sortedImages.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-20 rounded-xl bg-neutral-900/90 border border-neutral-800 p-4 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all backdrop-blur-sm active:scale-95 shadow-2xl"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img 
              src={resolvedImageUrl} 
              alt="High resolution detailed attachment" 
              onClick={(e) => e.stopPropagation()} 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-neutral-800 animate-in zoom-in-95 duration-200"
            />

            {sortedImages.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-20 rounded-xl bg-neutral-900/90 border border-neutral-800 p-4 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all backdrop-blur-sm active:scale-95 shadow-2xl"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Expanded Lightbox Thumbnail Strip Navigation Controller */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="mt-6 flex flex-col items-center gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl max-w-md w-full shadow-2xl"
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
                        : "border-neutral-800 hover:border-neutral-600"
                    }`}
                  >
                    <img src={finalThumbUrl} alt="thumbnail thumbnail asset navigation element" className="w-full h-full object-cover rounded-lg" />
                  </button>
                );
              })}
            </div>

            {sortedImages.length > 1 && (
              <span className="text-xs font-mono font-bold text-neutral-400 bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-lg">
                {activeImgIndex + 1} <span className="text-[#D4A97A]/40 mx-1">/</span> {sortedImages.length}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}