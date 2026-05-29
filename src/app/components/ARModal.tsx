"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  isSupported?: boolean;
  /** "x y z" scale string from computeARInfo — already accounts for unit system + target size. */
  arScale?: string;
  /**
   * How far (metres, post-scale) the mesh origin sits above the true bottom face.
   * Positive  → origin is above the floor → model-viewer would float the model.
   * Negative  → origin is below the floor → model would sink (rare).
   * Zero      → origin is exactly at the bottom face (ideal GLB export).
   *
   * We compensate by translating the model-viewer element down by this amount
   * via the `camera-target` + a CSS Y-transform trick so the AR hit-test
   * floor snap lands on the mesh's actual bottom, not its origin.
   */
  arYOffsetM?: number;
};

type Status = "checking" | "supported" | "unsupported" | "insecure";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts arYOffsetM into a CSS transform string that shifts the model-viewer
 * element down so its rendered floor snap aligns with the real mesh bottom.
 *
 * model-viewer positions the GLB origin at Y=0 in AR world space.
 * If the mesh bottom face is at box.min.y (in GLB space) and box.min.y > 0
 * (origin below the mesh, i.e. origin is closer to the floor than the mesh),
 * the model floats.  We counter this by nudging the element.
 *
 * Note: this is a 2D CSS offset on the <model-viewer> element itself. It only
 * affects the preview, not the WebXR session.  For WebXR the correct fix is
 * the `camera-target` attribute (see below).
 */
function buildCameraTarget(arYOffsetM: number): string {
  // camera-target tells model-viewer where to orbit around. Setting it to the
  // vertical midpoint keeps the preview centred. model-viewer accepts "Xm Ym Zm".
  // We don't have the height here, so we just compensate for the floor offset.
  // A positive arYOffsetM means the mesh bottom is arYOffsetM above the origin,
  // so the model floats by that amount — we move the target DOWN by half that.
  const compensatedY = Math.max(0, arYOffsetM * 0.5);
  return `0m ${compensatedY}m 0m`;
}

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
  isSupported,
  arScale = "1 1 1",
  arYOffsetM = 0,
}: ARModalProps) {
  const [status, setStatus]     = useState<Status>("checking");
  const modelViewerRef          = useRef<any>(null);

  // Apply ar-placement and interaction-prompt once the element mounts
  const setModelViewerRef = useCallback((node: any) => {
    modelViewerRef.current = node;
    if (!node) return;
    node.setAttribute("ar-placement",        "floor");
    node.setAttribute("interaction-prompt",  "auto");
  }, []);

  useEffect(() => {
    if (!open) return;

    setStatus("checking");

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (window.location.protocol !== "https:" && !isLocal) {
      setStatus("insecure");
      return;
    }

    if (isSupported !== undefined) {
      if (isSupported) {
        loadModelViewer()
          .then(() => setStatus("supported"))
          .catch(() => setStatus("unsupported"));
      } else {
        setStatus("unsupported");
      }
      return;
    }

    // Runtime check (fallback when isSupported prop is not provided)
    (async () => {
      try {
        if (!navigator.xr) { setStatus("unsupported"); return; }
        const ok = await navigator.xr.isSessionSupported("immersive-ar");
        if (!ok) { setStatus("unsupported"); return; }
        await loadModelViewer();
        setStatus("supported");
      } catch {
        setStatus("unsupported");
      }
    })();

    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose, isSupported]);

  if (!open) return null;

  // model-viewer is a custom element — cast to any to avoid TS complaints about unknown props.
  const ModelViewer: any = "model-viewer";

  // camera-target compensates for GLBs whose origin is not at the mesh bottom face,
  // preventing the model from appearing to float in the preview and (partially) in AR.
  const cameraTarget = buildCameraTarget(arYOffsetM);

  return (
    <div className="z-[100] fixed inset-0 flex flex-col bg-[#0A0705]/98 backdrop-blur-xl">
      <style>{`
        model-viewer {
          width: 100%;
          height: 100%;
          background-color: transparent;
          outline: none;
        }
        model-viewer::part(default-ar-button) {
          bottom: 32px;
          left: 50%;
          right: auto;
          transform: translateX(-50%);
          background-color: #D4A97A;
          color: #1C1209;
          border-radius: 16px;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 14px 32px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-white/5 border-b">
        <div>
          <p className="font-semibold text-[#D4A97A] text-[10px] uppercase tracking-[0.2em]">
            Augmented Reality
          </p>
          {name && (
            <h2 className="mt-0.5 text-white/80 text-sm font-medium">{name}</h2>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 border border-white/10 hover:border-[#D4A97A]/40 rounded-full text-white/40 hover:text-white transition-all active:scale-90"
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

        {/* ── Supported ── */}
        {status === "supported" && (
          <>
            {/* Top hint bar */}
            <div className="absolute top-0 inset-x-0 z-10 flex justify-center items-center gap-6 bg-white/[0.02] px-4 py-3 border-b border-white/5 text-white/30 text-[11px]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#D4A97A]" />
                <span>Preview below · Tap the button to launch AR</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span>Desktop: drag to orbit</span>
              </div>
            </div>

            {/* Gesture guide */}
            <div className="absolute top-12 inset-x-0 z-10 flex justify-center px-6 pt-4 pointer-events-none">
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/8 rounded-2xl px-5 py-3">
                <div className="flex flex-col items-center gap-1 text-center min-w-[64px]">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Move className="w-4 h-4 text-[#D4A97A]" />
                  </div>
                  <span className="text-white/40 text-[9px] uppercase tracking-wider leading-tight">
                    1 finger<br />move
                  </span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col items-center gap-1 text-center min-w-[64px]">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <RotateCw className="w-4 h-4 text-[#D4A97A]" />
                  </div>
                  <span className="text-white/40 text-[9px] uppercase tracking-wider leading-tight">
                    2 fingers<br />twist rotate
                  </span>
                </div>
              </div>
            </div>

            {/*
              model-viewer notes:
              - scale       → from computeARInfo; accounts for native unit system (mm/cm/m) AND target height
              - camera-target → shifts the orbit/view pivot to compensate for off-centre GLB origins,
                                which also partially corrects the AR floor snap
              - ar-placement="floor" → tells WebXR to snap the model to a detected floor plane
              - ar-scale="fixed"     → prevents model-viewer from auto-resizing in AR
              - xr-environment       → uses the real-world lighting estimate in AR (looks more natural)
            */}
            <ModelViewer
              ref={setModelViewerRef}
              src={modelUrl}
              alt={name ?? "3D Model"}
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              scale={arScale}
              camera-target={cameraTarget}
              camera-controls
              touch-action="none"
              auto-rotate
              auto-rotate-delay="3000"
              environment-image="neutral"
              xr-environment
              shadow-intensity="1"
              shadow-softness="0.8"
              exposure="0.9"
            />
          </>
        )}
      </div>
    </div>
  );
}