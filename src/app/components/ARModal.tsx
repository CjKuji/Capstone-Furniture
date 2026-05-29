"use client";

import { useEffect, useState } from "react";
import { X, Smartphone, Monitor, AlertCircle } from "lucide-react";

type ARModalProps = {
  open: boolean;
  onClose: () => void;
  modelUrl: string;
  name?: string;
};

export default function ARModal({ open, onClose, modelUrl, name }: ARModalProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Lazy load model-viewer
      if (!customElements.get("model-viewer")) {
        import("@google/model-viewer").catch(console.error);
      }

      // Check support specifically for AR
      const checkSupport = async () => {
        const viewer = document.createElement("model-viewer") as any;
        // Check if the browser can handle AR at all
        const canDoAR = viewer.canActivateAR;
        setIsSupported(canDoAR);
      };
      checkSupport();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  if (!open) return null;

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
          className="p-2 border border-white/10 hover:border-[#D4A97A]/40 rounded-full text-white/40 hover:text-white transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Viewport or Compatibility Message */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col items-center justify-center">
        {isSupported === false ? (
          <div className="flex flex-col items-center text-center px-10 max-w-md">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-[#D4A97A]" />
            </div>
            <h3 className="text-white text-lg font-medium mb-2">Device Not Compatible</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Your device or browser doesn&apos;t support the AR features required to view this model in your space. Try using the latest version of Chrome on an AR-enabled mobile device.
            </p>
          </div>
        ) : (
          <>
            {/* Device Guides */}
            <div className="absolute top-0 inset-x-0 flex justify-center items-center gap-8 bg-white/[0.02] px-4 py-3 border-white/5 border-b text-white/30 text-[11px] z-10">
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

            <ModelViewer
              src={modelUrl}
              alt={name ?? "3D Furniture Model"}
              ar
              // IMPORTANT: webxr is prioritized to prevent the Google App from crashing
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="auto"
              camera-controls
              auto-rotate
              environment-image="neutral"
              shadow-intensity="1"
              className="w-full h-full bg-transparent outline-none"
            >
              <button slot="ar-button" className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#D4A97A] hover:bg-[#C4976A] text-[#1C1209] px-8 py-3 rounded-xl font-bold text-sm shadow-2xl transition-all active:scale-95">
                VIEW IN YOUR SPACE
              </button>
            </ModelViewer>
          </>
        )}
      </div>
    </div>
  );
}