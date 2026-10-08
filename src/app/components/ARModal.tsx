"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { ComponentType, HTMLAttributes, ReactNode, Ref } from "react";
import {
  X,
  Smartphone,
  Monitor,
  AlertCircle,
  ShieldAlert,
  Move,
  RotateCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ARModalProps = {
  open: boolean;
  onClose: () => void;
  modelUrl: string;
  name?: string;
};

type Status = "checking" | "supported" | "unsupported" | "insecure" | "error";
type ModelViewerProps = HTMLAttributes<HTMLElement> & {
  src: string;
  alt: string;
  ar?: boolean;
  "ar-modes"?: string;
  "ar-scale"?: string;
  "ar-placement"?: string;
  "interaction-prompt"?: string;
  "camera-controls"?: boolean;
  "touch-action"?: string;
  "auto-rotate"?: boolean;
  "auto-rotate-delay"?: string;
  "environment-image"?: string;
  "xr-environment"?: boolean;
  "shadow-intensity"?: string;
  "shadow-softness"?: string;
  exposure?: string;
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Loads @google/model-viewer if not already registered.
 */
async function loadModelViewer(): Promise<void> {
  if (!customElements.get("model-viewer")) {
    await import("@google/model-viewer");
  }
  await customElements.whenDefined("model-viewer");
}

// ---------------------------------------------------------------------------
// ARModal
// ---------------------------------------------------------------------------

export default function ARModal({
  open,
  onClose,
  modelUrl,
  name,
}: ARModalProps) {
  const [status, setStatus] = useState<Status>("checking");
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [canActivateAR, setCanActivateAR] = useState<boolean | null>(null);
  const modelViewerRef = useRef<HTMLElement | null>(null);
  const loadListenerRef = useRef<(() => void) | null>(null);

  const setModelViewerRef = useCallback((node: HTMLElement | null) => {
    if (modelViewerRef.current && loadListenerRef.current) {
      modelViewerRef.current.removeEventListener("load", loadListenerRef.current);
    }
    modelViewerRef.current = node;
    if (!node) return;

    const handleLoad = () => {
      const available = (node as HTMLElement & { canActivateAR?: boolean }).canActivateAR === true;
      setCanActivateAR(available);
      setStatus(available ? "supported" : "unsupported");
    };
    loadListenerRef.current = handleLoad;
    node.addEventListener("load", handleLoad, { once: true });
  }, []);

  useEffect(() => {
    if (!open) return;

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (window.location.protocol !== "https:" && !isLocal) {
      Promise.resolve().then(() => setStatus("insecure"));
      return;
    }

    let cancelled = false;
    loadModelViewer()
      .then(() => {
        if (!cancelled) {
          setStatus("checking");
          setCanActivateAR(null);
          setViewerLoaded(true);
        }
      })
      .catch((error) => {
        console.error("[AR model-viewer load failed]", error);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [open, modelUrl]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // model-viewer is a custom element with attributes not included in React's built-in types.
  const ModelViewer = "model-viewer" as unknown as ComponentType<ModelViewerProps>;

  return (
    <div className="ar-modal-root z-[100] fixed inset-0 flex flex-col bg-[#0A0705]/98 backdrop-blur-xl overscroll-contain">
      <style>{`
        .ar-modal-root model-viewer.ar-modal-viewer {
          width: 100%;
          height: 100%;
          background-color: transparent;
          outline: none;
        }
        .ar-modal-root model-viewer.ar-modal-viewer::part(default-ar-button) {
          display: none;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-white/5 border-b">
        <div>
          <p className="font-semibold text-[#D4A97A] text-[10px] uppercase tracking-[0.2em]">
            Augmented Reality
          </p>
          {name && (
            <h2 className="mt-0.5 text-white/80 text-xs sm:text-sm font-medium truncate max-w-[70vw]">{name}</h2>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 border border-white/10 hover:border-[#D4A97A]/40 rounded-full text-white/40 hover:text-white transition-all active:scale-90 shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center overflow-hidden">

        {/* ── Insecure context ── */}
        {status === "insecure" && (
          <div className="flex flex-col items-center text-center px-10 max-w-md animate-in fade-in zoom-in duration-300">
            <ShieldAlert className="w-12 h-12 text-red-400 mb-6" />
            <h3 className="text-white text-lg font-medium mb-2">Security Block</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              AR features require a <strong>Secure Connection (HTTPS)</strong>.
              Local IP testing (192.168.x.x) is blocked by mobile browsers.
            </p>
          </div>
        )}

        {/* ── Checking ── */}
        {status === "checking" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#D4A97A]/20 border-t-[#D4A97A] rounded-full animate-spin" />
            <p className="text-white/30 text-[10px] uppercase tracking-widest">
              Checking AR support…
            </p>
          </div>
        )}

        {/* ── Unsupported ── */}
        {status === "unsupported" && (
          <div className="flex flex-col items-center text-center px-10 max-w-md animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-12 h-12 text-[#D4A97A] mb-6 opacity-50" />
            <h3 className="text-white text-lg font-medium mb-2">AR Not Available</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              This device doesn&apos;t support AR. On Android, ensure{" "}
              <strong>Google Play Services for AR</strong> is installed and up to date.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center text-center px-10 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-400 mb-6" />
            <h3 className="text-white text-lg font-medium mb-2">AR Viewer Failed to Load</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              The model viewer could not be loaded. Check your connection and try again.
            </p>
          </div>
        )}

        {/* ── Supported ── */}
        {viewerLoaded && canActivateAR !== false && status !== "insecure" && status !== "error" && (
          <>
            {/* Top hint bar */}
            <div className="absolute top-0 inset-x-0 z-10 flex justify-center items-center bg-gradient-to-b from-black/45 to-transparent px-4 pt-3 pb-6 text-white/40 text-[10px] sm:text-[11px] pointer-events-none">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 backdrop-blur-md px-3 py-1.5">
                <Smartphone className="w-4 h-4 text-[#D4A97A]" />
                <span>Move phone slowly, then tap Start AR</span>
              </div>
              <div className="hidden md:flex items-center gap-2 ml-4">
                <Monitor className="w-4 h-4" />
                <span>Desktop: drag to orbit</span>
              </div>
            </div>

            {/* Gesture guide */}
            <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-10 flex justify-center px-4 pointer-events-none">
              <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5">
                <div className="flex flex-col items-center gap-1 text-center min-w-[58px]">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Move className="w-4 h-4 text-[#D4A97A]" />
                  </div>
                  <span className="text-white/40 text-[9px] uppercase tracking-wider leading-tight">
                    1 finger<br />move
                  </span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col items-center gap-1 text-center min-w-[58px]">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <RotateCw className="w-4 h-4 text-[#D4A97A]" />
                  </div>
                  <span className="text-white/40 text-[9px] uppercase tracking-wider leading-tight">
                    2 fingers<br />twist rotate
                  </span>
                </div>
              </div>
            </div>

            <ModelViewer
              key={modelUrl}
              ref={setModelViewerRef}
              className="ar-modal-viewer"
              src={modelUrl}
              alt={name ?? "3D Model"}
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              ar-placement="floor"
              interaction-prompt="auto"
              camera-controls
              touch-action="none"
              auto-rotate
              auto-rotate-delay="3000"
              environment-image="neutral"
              xr-environment
              shadow-intensity="1"
              shadow-softness="0.8"
              exposure="0.9"
            >
              {/* slot="ar-button" replaces model-viewer's default circle FAB with our own informative button */}
              <button
                slot="ar-button"
                style={{
                  position: 'absolute',
                  bottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#D4A97A',
                  color: '#1C1209',
                  border: 'none',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '13px 26px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
                View in Your Space
              </button>
            </ModelViewer>
          </>
        )}
      </div>
    </div>
  );
}