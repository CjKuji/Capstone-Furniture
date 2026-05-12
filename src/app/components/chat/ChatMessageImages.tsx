"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const dragging = useRef(false);

  const lastPos = useRef({
    x: 0,
    y: 0,
  });

  /**
   * =========================================================
   * RESET VIEW
   * =========================================================
   */
  const resetView = useCallback(() => {
    setScale(1);

    setPosition({
      x: 0,
      y: 0,
    });
  }, []);

  /**
   * =========================================================
   * CLOSE
   * =========================================================
   */
  const handleClose = useCallback(() => {
    setOpen(false);

    resetView();
  }, [resetView]);

  /**
   * =========================================================
   * ESC CLOSE
   * FIXED:
   * Hook now always runs BEFORE conditional return
   * =========================================================
   */
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [open, handleClose]);

  /**
   * =========================================================
   * EARLY RETURN
   * MUST BE AFTER HOOKS
   * =========================================================
   */
  if (!imageUrl) {
    return null;
  }

  /**
   * =========================================================
   * OPEN
   * =========================================================
   */
  const handleOpen = () => {
    resetView();

    setOpen(true);

    onClick?.(imageUrl);
  };

  /**
   * =========================================================
   * ZOOM
   * =========================================================
   */
  const handleWheel = (
    e: React.WheelEvent
  ) => {
    e.preventDefault();

    setScale((prev) => {
      const next =
        prev - e.deltaY * 0.0015;

      return Math.min(
        Math.max(next, 1),
        5
      );
    });
  };

  /**
   * =========================================================
   * DRAG START
   * =========================================================
   */
  const handleMouseDown = (
    e: React.MouseEvent
  ) => {
    if (scale <= 1) return;

    dragging.current = true;

    lastPos.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  /**
   * =========================================================
   * DRAG MOVE
   * =========================================================
   */
  const handleMouseMove = (
    e: React.MouseEvent
  ) => {
    if (!dragging.current) return;

    const dx =
      e.clientX - lastPos.current.x;

    const dy =
      e.clientY - lastPos.current.y;

    lastPos.current = {
      x: e.clientX,
      y: e.clientY,
    };

    setPosition((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  /**
   * =========================================================
   * DRAG END
   * =========================================================
   */
  const handleMouseUp = () => {
    dragging.current = false;
  };

  /**
   * =========================================================
   * DOUBLE CLICK TOGGLE
   * =========================================================
   */
  const handleDoubleClick = () => {
    setScale((prev) =>
      prev > 1 ? 1 : 2.5
    );

    setPosition({
      x: 0,
      y: 0,
    });
  };

  return (
    <>
      {/* =====================================================
          THUMBNAIL
      ===================================================== */}
      <div className="mt-2 flex justify-start">
        <button
          onClick={handleOpen}
          className="group overflow-hidden rounded-2xl border border-[#E7D8CA] bg-white shadow-sm transition-all hover:shadow-md"
        >
          {/* IMAGE */}
          <div className="relative aspect-[4/3] w-full max-w-[280px] overflow-hidden bg-[#F6EFE6]">
            <img
              src={imageUrl}
              alt="Chat attachment"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />

            {/* HOVER OVERLAY */}
            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/5" />
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between border-t border-[#F3E8DC] px-3 py-2">
            <span className="text-[11px] font-medium text-[#5F4A3B]">
              Image attachment
            </span>

            <span className="text-[11px] text-[#8C593F]">
              Open
            </span>
          </div>
        </button>
      </div>

      {/* =====================================================
          FULLSCREEN VIEWER
      ===================================================== */}
      {open && (
        <div
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm"
          onClick={handleClose}
        >
          {/* =================================================
              TOP BAR
          ================================================= */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/30 px-5 py-4 backdrop-blur">
            <div>
              <p className="text-sm font-medium text-white">
                Image Preview
              </p>

              <p className="text-xs text-white/60">
                Scroll to zoom • Drag to move
              </p>
            </div>

            <button
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          {/* =================================================
              IMAGE STAGE
          ================================================= */}
          <div
            className="flex h-full w-full items-center justify-center overflow-hidden p-6"
            onClick={(e) =>
              e.stopPropagation()
            }
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={
              handleDoubleClick
            }
          >
            <img
              src={imageUrl}
              alt="Expanded image"
              draggable={false}
              className="select-none object-contain transition-transform duration-100"
              style={{
                maxWidth: "92%",
                maxHeight: "88%",
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor:
                  scale > 1
                    ? dragging.current
                      ? "grabbing"
                      : "grab"
                    : "zoom-in",
              }}
            />
          </div>

          {/* =================================================
              BOTTOM HELP
          ================================================= */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[11px] text-white/70 backdrop-blur">
            Double click to toggle zoom
          </div>
        </div>
      )}
    </>
  );
}