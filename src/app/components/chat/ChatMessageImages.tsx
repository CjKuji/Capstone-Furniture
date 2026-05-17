"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  imageUrl?: string | null;
  onClick?: (url: string) => void;
};

export default function ChatImageMessage({ imageUrl, onClick }: Props) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    resetView();
  }, [resetView]);

  /* ESC CLOSE — must be before early return */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  if (!imageUrl) return null;

  const handleOpen = () => {
    resetView();
    setOpen(true);
    onClick?.(imageUrl);
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

  return (
    <>
      {/* THUMBNAIL */}
      <div className="mt-2 flex justify-start">
        <button
          onClick={handleOpen}
          className="
            group overflow-hidden rounded-xl
            border border-[#2A1F14] bg-[#0B0704]
            transition-all hover:border-[#D4A97A]/30
            hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]
          "
        >
          <div className="relative aspect-[4/3] w-full max-w-[260px] overflow-hidden bg-[#0B0704]">
            <img
              src={imageUrl}
              alt="Chat attachment"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#2A1F14] px-3 py-2">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/25">
              Image attachment
            </span>
            <span className="text-[10px] font-bold text-[#D4A97A]/60 group-hover:text-[#D4A97A] transition-colors">
              Open →
            </span>
          </div>
        </button>
      </div>

      {/* FULLSCREEN VIEWER */}
      {open && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-sm"
          onClick={handleClose}
        >
          {/* TOP BAR */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-black/40 px-5 py-4 backdrop-blur">
            <div>
              <p className="text-[12px] font-bold text-white/80">Image Preview</p>
              <p className="text-[10px] text-white/30">Scroll to zoom · Drag to pan · Double-click to toggle</p>
            </div>
            <button
              onClick={handleClose}
              className="
                flex h-9 w-9 items-center justify-center
                rounded-full border border-white/10 bg-white/[0.05]
                text-white/50 text-sm
                hover:bg-white/[0.10] hover:text-white/80
                transition-all
              "
            >
              ✕
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
              src={imageUrl}
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

          {/* BOTTOM HINT */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/[0.07] bg-black/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/30 backdrop-blur">
            Double click to toggle zoom
          </div>
        </div>
      )}
    </>
  );
}