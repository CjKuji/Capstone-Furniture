"use client";

import { useRef, useState } from "react";

type Props = {
  imageUrl?: string | null;
  onClick?: (url: string) => void;
};

export default function ChatImageMessage({
  imageUrl,
  onClick,
}: Props) {
  const [open, setOpen] = useState(false);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  if (!imageUrl) return null;

  /**
   * ================= RESET LOGIC (SAFE) =================
   * Centralized reset function instead of effects
   */
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  /**
   * ================= OPEN =================
   */
  const handleOpen = () => {
    setOpen(true);
    resetView();
    onClick?.(imageUrl);
  };

  /**
   * ================= CLOSE =================
   */
  const handleClose = () => {
    setOpen(false);
    resetView();
  };

  /**
   * ================= ZOOM =================
   */
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    setScale((prev) => {
      const next = prev - e.deltaY * 0.0015;
      return Math.min(Math.max(next, 1), 5);
    });
  };

  /**
   * ================= DRAG =================
   */
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

    setPosition((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  const handleMouseUp = () => {
    dragging.current = false;
  };

  /**
   * ================= DOUBLE CLICK =================
   */
  const handleDoubleClick = () => {
    setScale((prev) => (prev > 1 ? 1 : 2.5));
    setPosition({ x: 0, y: 0 });
  };

  return (
    <>
      {/* THUMBNAIL */}
      <div className="mt-2 flex justify-start">
        <div className="w-full max-w-[260px] aspect-[4/3] rounded-xl overflow-hidden border border-[#E8D9CC] bg-[#F7F1E8] shadow-sm">
          <img
            src={imageUrl}
            alt="Chat image"
            onClick={handleOpen}
            className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition"
          />
        </div>
      </div>

      {/* FULL VIEW */}
      {open && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-6"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-6xl h-[85vh] bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center z-10"
            >
              ✕
            </button>

            {/* IMAGE AREA */}
            <div
              className="w-full h-full flex items-center justify-center"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={imageUrl}
                alt="Full view"
                draggable={false}
                className="select-none max-w-[95%] max-h-[95%] object-contain transition-transform duration-100"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  cursor: scale > 1 ? "grab" : "zoom-in",
                }}
              />
            </div>

            <div className="absolute bottom-3 text-xs text-[#8C593F]/70">
              Scroll to zoom • Drag to move • Double click to toggle zoom • Esc to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}