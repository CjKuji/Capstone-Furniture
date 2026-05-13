"use client";

import { useEffect } from "react";
import { X, Smartphone, Monitor } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  modelUrl: string;
  name?: string;
};

export default function ARModal({ open, onClose, modelUrl, name }: Props) {
  // Close on Escape key + lazily load model-viewer (browser-only, once)
  useEffect(() => {
    if (!customElements.get("model-viewer")) {
      import("@google/model-viewer");
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="z-50 fixed inset-0 flex flex-col bg-[#0A0705]/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-white/5 border-b">
        <div>
          <p className="font-semibold text-[#D4A97A] text-xs uppercase tracking-widest">
            View in Your Space
          </p>
          {name && (
            <p className="mt-0.5 text-white/50 text-sm">{name}</p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close AR viewer"
          className="p-2 border border-white/10 hover:border-white/20 rounded-full text-white/50 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Platform hint */}
      <div className="flex justify-center items-center gap-6 bg-white/[0.02] px-4 py-2.5 border-white/5 border-b text-white/30 text-xs">
        <span className="flex items-center gap-1.5">
          <Smartphone className="w-3 h-3 text-[#D4A97A]" />
          Android — tap &ldquo;View in your space&rdquo; for full AR
        </span>
        <span className="bg-white/10 w-px h-3" />
        <span className="flex items-center gap-1.5">
          <Monitor className="w-3 h-3" />
          Desktop / iOS — interactive 3D preview
        </span>
      </div>

      {/* model-viewer */}
      <div className="relative flex-1">
        <model-viewer
          src={modelUrl}
          alt={name ?? "Furniture 3D model"}
          ar
          ar-modes="scene-viewer webxr quick-look"
          ar-scale="auto"
          camera-controls
          auto-rotate
          environment-image="neutral"
          style={{ width: "100%", height: "100%", background: "transparent" }}
        />
      </div>
    </div>
  );
}
