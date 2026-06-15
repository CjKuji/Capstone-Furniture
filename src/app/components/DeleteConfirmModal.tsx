"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Trash2, AlertTriangle } from "lucide-react";

/* ========================================================= */

type Props = {
  isOpen: boolean;
  itemName: string | null;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

/* ========================================================= */

export default function DeleteConfirmModal({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
}: Props) {
  const [isAnimateIn, setIsAnimateIn]   = useState(false);
  const [deleting, setDeleting]         = useState(false);

  const frame1Ref = useRef<number | null>(null);
  const frame2Ref = useRef<number | null>(null);

  const clearFrames = useCallback(() => {
    if (frame1Ref.current !== null) { cancelAnimationFrame(frame1Ref.current); frame1Ref.current = null; }
    if (frame2Ref.current !== null) { cancelAnimationFrame(frame2Ref.current); frame2Ref.current = null; }
  }, []);

  useEffect(() => {
    clearFrames();

    if (!isOpen) {
      setIsAnimateIn(false);
      setDeleting(false);
      return;
    }

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    frame1Ref.current = requestAnimationFrame(() => {
      frame2Ref.current = requestAnimationFrame(() => {
        setIsAnimateIn(true);
      });
    });

    return () => {
      clearFrames();
      document.body.style.overflow = original;
    };
  }, [isOpen, clearFrames]);

  const handleConfirm = useCallback(async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }, [onConfirm]);

  /* keyboard: Escape = cancel */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, deleting, onCancel]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className={`
        fixed inset-0 z-[999999] flex items-center justify-center p-4
        backdrop-blur-md transition-all duration-200
        ${isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}
      `}
      style={{ backgroundColor: "rgba(4, 2, 1, 0.88)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onCancel(); }}
    >
      <div
        className={`
          relative w-full max-w-sm
          bg-[#0D0806] border border-white/[0.06] rounded-2xl
          shadow-[0_32px_80px_rgba(0,0,0,0.9)]
          overflow-hidden
          transition-all duration-300 ease-out
          ${isAnimateIn ? "scale-100 translate-y-0 opacity-100" : "scale-[0.96] translate-y-3 opacity-0"}
        `}
        style={{ willChange: "transform, opacity" }}
      >
        {/* top accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

        {/* body */}
        <div className="p-7 flex flex-col items-center text-center gap-5">

          {/* icon */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-500/8 border border-red-500/15">
              <Trash2 className="w-7 h-7 text-red-400/80" />
            </div>
            {/* warning pip */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0D0806] border border-white/[0.06] flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-amber-400/80" />
            </div>
          </div>

          {/* copy */}
          <div className="space-y-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Delete Furniture Item
            </h2>

            {itemName && (
              <p className="text-[13px] text-white/50 leading-relaxed">
                You are about to delete{" "}
                <span className="text-white/80 font-semibold">"{itemName}"</span>.
              </p>
            )}

            {/* irreversible warning */}
            <div className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/8 border border-red-500/15">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/70 shrink-0" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-400/80">
                This action cannot be undone
              </p>
            </div>

            <p className="text-[12px] text-white/30 leading-relaxed pt-1">
              All associated images, 3D model files, and variant data will be
              permanently removed and{" "}
              <span className="text-white/50 font-medium">cannot be recovered</span>.
            </p>
          </div>
        </div>

        {/* footer */}
        <div
          className="flex items-center gap-3 px-6 py-4 bg-[#090604]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-200 border border-white/[0.06] bg-white/[0.02] text-white/40 hover:bg-white/[0.05] hover:text-white/70 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-200 bg-red-600/80 hover:bg-red-600 text-white active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-[0_4px_20px_rgba(239,68,68,0.15)] flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-3 h-3" />
                Delete Forever
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}