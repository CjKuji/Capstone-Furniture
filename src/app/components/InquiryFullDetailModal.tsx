"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import {
  X,
  Info,
  ImageIcon,
  Maximize2,
  Layers,
  FileText,
} from "lucide-react";
import ImageLightbox from "@/app/components/ImageLightbox";

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{ url: string; id?: string }[]>([]);
  const [lightboxTitle, setLightboxTitle] = useState("");

  const handleImageClick = (images: { url: string; id?: string }[], itemTitle: string) => {
    setLightboxImages(images);
    setLightboxTitle(itemTitle);
    setLightboxOpen(true);
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const sortedItems = useMemo(() => {
    return [...inquiry_items].sort((a, b) => a.id.localeCompare(b.id));
  }, [inquiry_items]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-0 sm:p-6 overflow-hidden"
      style={{
        zIndex: 99999,
        backgroundColor: "transparent",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.2s ease-in-out",
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full flex flex-col rounded-none sm:rounded-2xl h-screen sm:h-[calc(100vh-48px)] max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-[90%] xl:max-w-[85%] 2xl:max-w-[1600px] shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden border-0 sm:border border-white/[0.06] bg-[#0A0705]"
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/50 to-transparent flex-shrink-0" />

        {/* HEADER */}
        <div
          className="flex items-center justify-between px-5 sm:px-8 py-4 shrink-0 bg-[#0E0A07]"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4A97A]/70 mb-0.5">
              Inquiry Details
            </p>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              Full Inquiry Breakdown
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/[0.06] transition-all duration-200 text-xs"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-8 space-y-8 focus:outline-none custom-scrollbar bg-gradient-to-b from-[#0A0705] to-[#070504]">
          {sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12">
              <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 mb-3">
                <Info className="w-6 h-6 text-neutral-500" />
              </div>
              <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
                No items or manufacturing details are currently assigned to this entry.
              </p>
            </div>
          ) : (
            sortedItems.map((item, index) => (
              <InquiryItemViewer
                key={item.id}
                item={item}
                index={index}
                onImageClick={handleImageClick}
              />
            ))
          )}

          {/* INQUIRY SUMMARY */}
          {sortedItems.length > 0 && (
            <div className="rounded-2xl p-5 sm:p-6 space-y-5 bg-[#0E0A07]/40 border border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-3.5 bg-[#D4A97A] rounded-full" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Inquiry Summary</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                <div className="flex justify-between items-baseline gap-4 py-1.5 border-b border-white/[0.03]">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 shrink-0">Total Items</span>
                  <span className="text-xs font-medium text-white/70 text-right">{sortedItems.length}</span>
                </div>
                <div className="flex justify-between items-baseline gap-4 py-1.5 border-b border-white/[0.03]">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 shrink-0">Total Quantity</span>
                  <span className="text-xs font-medium text-white/70 text-right">
                    {sortedItems.reduce((sum, i) => sum + (i.quantity ?? 0), 0)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                  Items Configured: <span className="text-white font-semibold ml-1.5">{sortedItems.length}</span>
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-200 border border-white/[0.04] bg-white/[0.01] text-white/40 hover:bg-white/[0.03] hover:text-white/70 active:scale-[0.99]"
          >
            Close Detail Overview
          </button>
        </div>
      </div>

      <ImageLightbox
        images={lightboxImages}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={lightboxTitle}
      />
    </div>,
    document.body
  );
}

function InquiryItemViewer({ item, index, onImageClick }: { 
  item: InquiryItem; 
  index: number;
  onImageClick: (images: { url: string; id?: string }[], itemTitle: string) => void;
}) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

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

  return (
    <div className="rounded-2xl overflow-hidden bg-[#0D0907]/60 border border-white/[0.04] shadow-inner">
      <div
        className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-white/[0.02]"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1 h-4 rounded-full shrink-0" style={{ background: "#D4A97A" }} />
          <h3 className="text-xs sm:text-sm font-semibold text-white truncate tracking-wide">
            {item.title || "Custom Item Component"}
            <span className="text-white/20 font-normal mx-2 text-xs">×</span>
            <span className="text-sm font-bold text-[#D4A97A]">{item.quantity}</span>
          </h3>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full shrink-0 ml-2 border bg-[#D4A97A]/5 text-[#D4A97A] border-[#D4A97A]/20">
          Item {index + 1}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6 items-start">
        <div className="lg:col-span-5 w-full min-w-0">
          {resolvedImageUrl ? (
            <div
              className="relative w-full rounded-xl overflow-hidden bg-[#050302] aspect-square sm:aspect-video lg:aspect-square border border-white/[0.04] shadow-2xl cursor-zoom-in group"
              onClick={() => onImageClick(
                sortedImages.map(img => ({ url: resolvedImageUrl!, id: img.id })),
                item.title || `Item ${index + 1}`
              )}
            >
              <img
                src={resolvedImageUrl}
                alt={item.title || "Item image"}
                className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 text-white/70 text-[10px] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3 h-3" />
                {sortedImages.length > 1 ? `${sortedImages.length} images` : 'View full size'}
              </div>
            </div>
          ) : (
            <div className="rounded-xl flex items-center justify-center aspect-square sm:aspect-video lg:aspect-square w-full bg-[#050302] border border-white/[0.04]">
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800 mb-1">
                <ImageIcon className="w-6 h-6 text-neutral-500" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                No Image Available
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6 w-full min-w-0">
          {/* Item Details */}
          <div className="w-full bg-white/[0.01] p-4 rounded-xl border border-white/[0.02]">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#A68056] uppercase bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 inline-block">
                  Item Index: {(index + 1).toString().padStart(2, "0")}
                </span>
                <h4 className="font-bold text-base text-white tracking-wide leading-tight mt-2">
                  {item.title || "Custom Requested Item"}
                </h4>
              </div>

              <hr className="border-neutral-900" />

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-neutral-900/40 border border-neutral-800 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] block font-medium text-neutral-500 uppercase tracking-wider">Quantity</span>
                    <span className="text-xs font-mono font-bold text-[#D4A97A] mt-0.5 block">{item.quantity} Units</span>
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/40 border border-neutral-800 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] block font-medium text-neutral-500 uppercase tracking-wider">Item ID</span>
                    <span className="text-xs font-mono text-neutral-300 font-medium mt-0.5 block truncate max-w-[80px]">
                      {item.id?.substring(0, 8).toUpperCase() || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {item.description && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#A68056] tracking-wider block">
                    Description
                  </span>
                  <div className="text-sm text-neutral-300 bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl leading-relaxed whitespace-pre-wrap font-sans shadow-inner">
                    {item.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image Gallery */}
          {sortedImages.length > 0 && (
            <div className="w-full bg-white/[0.01] p-4 rounded-xl border border-white/[0.02]">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase text-[#A68056] tracking-wider block">
                  Attached Images ({sortedImages.length})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImgIndex(thumbIdx);
                        }}
                        className={`relative w-20 h-20 rounded-xl border overflow-hidden bg-neutral-900 flex-shrink-0 transition-all duration-200 ${
                          activeImgIndex === thumbIdx
                            ? "border-[#D4A97A] ring-2 ring-[#D4A97A]/30 scale-105 shadow-xl"
                            : "border-neutral-800 hover:border-neutral-600"
                        }`}
                      >
                        <img src={finalThumbUrl} alt="Preview" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          {(item.unit_price !== undefined || item.total_price !== undefined) && (
            <div className="p-4 rounded-xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 space-y-2.5 select-none shadow-lg">
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
      </div>
    </div>
  );
}