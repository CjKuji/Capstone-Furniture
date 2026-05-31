"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

type Props = {
  imageUrls?: string[] | null;
  onClick?: (url: string) => void;
};

export default function ChatImageMessage({ imageUrls, onClick }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const isOpen = lightboxIndex !== null;
  const urls = imageUrls ?? [];
  const count = urls.length;

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
    resetView();
  }, [resetView]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    resetView();
    setLightboxIndex((i) => (i === null || i === 0 ? count - 1 : i - 1));
  }, [count, resetView]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    resetView();
    setLightboxIndex((i) => (i === null || i === count - 1 ? 0 : i + 1));
  }, [count, resetView]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") { resetView(); setLightboxIndex((i) => (i === null || i === 0 ? count - 1 : i - 1)); }
      if (e.key === "ArrowRight") { resetView(); setLightboxIndex((i) => (i === null || i === count - 1 ? 0 : i + 1)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose, count, resetView]);

  if (!count) return null;

  const gridClass =
    count === 1 ? "grid-cols-1" :
    count === 2 ? "grid-cols-2" :
    "grid-cols-3";

  const handleOpen = (index: number) => {
    resetView();
    setLightboxIndex(index);
    onClick?.(urls[index]);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => Math.min(Math.max(prev - e.deltaY * 0.0015, 1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = () => { dragging.current = false; };

  const handleDoubleClick = () => {
    setScale((prev) => (prev > 1 ? 1 : 2.5));
    setPosition({ x: 0, y: 0 });
  };

  const currentUrl = lightboxIndex !== null ? urls[lightboxIndex] : null;

  return (
    <>
      {/* GRID */}
      <div className={`mt-2 grid gap-1 ${gridClass} ${count === 1 ? "max-w-[260px]" : "max-w-[320px]"}`}>
        {urls.map((url, i) => (
          <button
            key={url + i}
            onClick={() => handleOpen(i)}
            className="
              group relative overflow-hidden rounded-xl
              border border-[#2A1F14] bg-[#0B0704]
              transition-all hover:border-[#D4A97A]/30
              hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]
            "
          >
            <div className={`relative overflow-hidden bg-[#0B0704] ${count === 1 ? "aspect-[4/3]" : "aspect-square"}`}>
              <img
                src={url}
                alt={`Image ${i + 1}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20 flex items-center justify-center">
                <ZoomIn
                  size={18}
                  className="text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg"
                />
              </div>
              {/* Count badge on last tile when overflow */}
              {count > 9 && i === 8 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-bold text-lg">
                  +{count - 8}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* LIGHTBOX */}
      {isOpen && currentUrl && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-sm"
          onClick={handleClose}
        >
          {/* TOP BAR */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-black/40 px-5 py-4 backdrop-blur">
            <div>
              <p className="text-[12px] font-bold text-white/80">Image Preview</p>
              <p className="text-[10px] text-white/30">
                {count > 1 ? `${(lightboxIndex ?? 0) + 1} / ${count} · ` : ""}
                Scroll to zoom · Drag to pan · Double-click to toggle
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/50 text-sm hover:bg-white/[0.10] hover:text-white/80 transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* IMAGE STAGE */}
          <div
            className="flex h-full w-full items-center justify-center overflow-hidden p-6"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={currentUrl}
              alt="Expanded image"
              draggable={false}
              className="select-none object-contain transition-transform duration-100 rounded-xl"
              style={{
                maxWidth: "92%",
                maxHeight: "86%",
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor: scale > 1 ? (dragging.current ? "grabbing" : "grab") : "zoom-in",
              }}
            />
          </div>

          {/* PREV / NEXT */}
          {count > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/60 hover:bg-black/80 hover:text-white transition-all backdrop-blur"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/60 hover:bg-black/80 hover:text-white transition-all backdrop-blur"
              >
                <ChevronRight size={18} />
              </button>

              {/* DOT INDICATORS */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {urls.slice(0, 9).map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); resetView(); setLightboxIndex(i); }}
                    className={`h-1.5 rounded-full transition-all ${i === lightboxIndex ? "w-5 bg-[#D4A97A]" : "w-1.5 bg-white/25 hover:bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* HINT (single image) */}
          {count === 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/[0.07] bg-black/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/30 backdrop-blur">
              Double click to toggle zoom
            </div>
          )}
        </div>
      )}
    </>
  );
}