"use client";

import { useEffect } from "react";
import { X, Smartphone, Monitor } from "lucide-react";

type ARModalProps = {
  open: boolean;
  onClose: () => void;
  modelUrl: string;
  name?: string;
};

export default function ARModal({ open, onClose, modelUrl, name }: ARModalProps) {
  useEffect(() => {
    // Lazy load the web component only on the client side
    if (typeof window !== "undefined" && !customElements.get("model-viewer")) {
      import("@google/model-viewer").catch(console.error);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      // Lock background scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  if (!open) return null;

  /**
   * The Escape Hatch: 
   * By casting the string to 'any', we bypass the JSX IntrinsicElements 
   * check entirely. This solves the Namespace conflict and the 
   * "Property does not exist" error simultaneously.
   */
  const ModelViewer: any = "model-viewer";

  return (
    <div className="z-[100] fixed inset-0 flex flex-col bg-[#0A0705]/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-white/5 border-b">
        <div>
          <p className="font-semibold text-[#D4A97A] text-[10px] uppercase tracking-[0.2em]">
            Augmented Reality
          </p>
          {name && <h2 className="mt-0.5 text-white/80 text-sm font-medium">{name}</h2>}
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-2 border border-white/10 hover:border-[#D4A97A]/40 rounded-full text-white/40 hover:text-white transition-all active:scale-90"
          aria-label="Close viewer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Device Guides */}
      <div className="flex justify-center items-center gap-8 bg-white/[0.02] px-4 py-3 border-white/5 border-b text-white/30 text-[11px]">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#D4A97A]" />
          <span>Mobile: Tap <strong>"View in Space"</strong></span>
        </div>
        <div className="w-px h-3 bg-white/10 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          <span>Desktop: Orbit with mouse</span>
        </div>
      </div>

      {/* Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <ModelViewer
          src={modelUrl}
          alt={name ?? "3D Furniture Model"}
          ar
          ar-modes="scene-viewer webxr quick-look"
          ar-scale="auto"
          camera-controls
          auto-rotate
          environment-image="neutral"
          shadow-intensity="1"
          className="w-full h-full bg-transparent outline-none"
        />
      </div>
    </div>
  );
}