"use client";

import React, {
  useMemo,
  useEffect,
  useRef,
  Suspense,
  useState,
  useCallback,
} from "react";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
} from "@react-three/drei";

import ARModal from "./ARModal";
import { Scan, Loader2 } from "lucide-react";

/* =========================================================
    TYPES
========================================================= */

type Dimensions = {
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
};

type DimensionInputs = {
  width_cm: string;
  depth_cm: string;
  height_cm: string;
};

type ModelProps = {
  url: string;
  textureUrl?: string | null;
  scale?: [number, number, number];
  onReady?: () => void;
};

type WebGLRendererWithCleanup = THREE.WebGLRenderer & {
  _cleanupContextLostListener?: () => void;
};

async function createScaledPreviewGlb(
  modelUrl: string,
  scale: [number, number, number]
): Promise<Blob> {
  const response = await fetch(modelUrl);
  if (!response.ok) {
    throw new Error(`Could not load the saved model for AR preview (${response.status}).`);
  }
  const data = await response.arrayBuffer();
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  loader.setDRACOLoader(dracoLoader);
  loader.setMeshoptDecoder(MeshoptDecoder);

  const scene = await new Promise<THREE.Group>((resolve, reject) => {
    loader.parse(
      data,
      "",
      (gltf) => resolve(gltf.scene),
      (error) => reject(error)
    );
  }).finally(() => dracoLoader.dispose());

  scene.scale.multiply(new THREE.Vector3(...scale));
  scene.updateMatrixWorld(true);

  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    new GLTFExporter().parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else reject(new Error("Could not encode the scaled AR preview as a GLB."));
      },
      (error) => reject(error),
      {
        binary: true,
        onlyVisible: true,
        trs: true,
        maxTextureSize: 2048,
      }
    );
  });

  return new Blob([buffer], { type: "model/gltf-binary" });
}

/* =========================================================
    FALLBACK
========================================================= */

function ViewerFallback({
  message = "Loading 3D Model",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center px-4 space-y-3">
      <Loader2 className="w-5 h-5 animate-spin text-[#D4A97A]" />
      <span className="text-white/40 text-[11px] font-medium tracking-[0.15em] uppercase">
        {message}
      </span>
    </div>
  );
}

/* =========================================================
    MODEL LAYER
========================================================= */

function Model({ url, textureUrl, scale = [1, 1, 1], onReady }: ModelProps) {
  const { scene } = useGLTF(url);
  const hasReportedReady = useRef(false);
  const lastUrlRef = useRef(url);

  // Reset onReady flag when URL changes
  useEffect(() => {
    if (lastUrlRef.current !== url) {
      lastUrlRef.current = url;
      hasReportedReady.current = false;
    }
  }, [url]);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => m.clone());
      } else {
        mesh.material = (mesh.material as THREE.Material).clone();
      }
    });
    return clone;
  }, [scene]);

  const { offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene, true);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return {
      offset: {
        x: -center.x * scale[0],
        y: -box.min.y * scale[1],
        z: -center.z * scale[2],
      },
    };
  }, [clonedScene, scale]);

  const originalMaps = useRef<Map<string, THREE.Texture | null>>(new Map());

  // Report ready once on mount
  useEffect(() => {
    if (!onReady) return;
    if (hasReportedReady.current) return;

    hasReportedReady.current = true;
    onReady();
  }, [onReady]);

  useEffect(() => {
    originalMaps.current.clear();
    clonedScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat, i) => {
        const key = `${mesh.uuid}_${i}`;
        originalMaps.current.set(key, (mat as THREE.MeshStandardMaterial).map ?? null);
      });
    });
  }, [clonedScene]);

  useEffect(() => {
    let disposed = false;
    let activeTexture: THREE.Texture | null = null;

    const resetOriginalTextures = () => {
      clonedScene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat, i) => {
          const key = `${mesh.uuid}_${i}`;
          const original = originalMaps.current.get(key) ?? null;
          (mat as THREE.MeshStandardMaterial).map = original;
          (mat as THREE.MeshStandardMaterial).needsUpdate = true;
        });
      });
    };

    if (!textureUrl || textureUrl.trim() === "") {
      resetOriginalTextures();
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      activeTexture = texture;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 3);

      clonedScene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          (mat as THREE.MeshStandardMaterial).map = texture;
          (mat as THREE.MeshStandardMaterial).needsUpdate = true;
        });
      });
    }, undefined, () => resetOriginalTextures());

    return () => {
      disposed = true;
      if (activeTexture) activeTexture.dispose();
    };
  }, [textureUrl, clonedScene]);

  useEffect(() => {
    return () => {
      clonedScene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            const material = mat as THREE.MeshStandardMaterial;
            material.map?.dispose();
            material.dispose();
          });
        }
      });
    };
  }, [clonedScene]);

  return (
    <group position={[offset.x, offset.y, offset.z]} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

/* =========================================================
    SAFE CANVAS LAYER
========================================================= */

type SafeCanvasProps = {
  modelUrl: string;
  textureUrl?: string | null;
  previewScale?: [number, number, number];
  eventSource: HTMLElement | null;
  onReady?: () => void;
};

function SafeCanvas({
  modelUrl,
  textureUrl,
  previewScale = [1, 1, 1],
  eventSource,
  onReady,
}: SafeCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const [contextKey, setContextKey] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const rendererRef = useRef<WebGLRendererWithCleanup | null>(null);
  const previousModelUrlRef = useRef(modelUrl);
  const hasMountedRef = useRef(false);

  // Preload model immediately
  useEffect(() => {
    if (!modelUrl.trim()) return;
    useGLTF.preload(modelUrl);
  }, [modelUrl]);

  // Reset modelReady when model URL changes
  useEffect(() => {
    if (previousModelUrlRef.current !== modelUrl) {
      previousModelUrlRef.current = modelUrl;
      requestAnimationFrame(() => setModelReady(false));
    }
  }, [modelUrl]);

  // Mount canvas once container has dimensions
  useEffect(() => {
    if (!eventSource) return;

    const checkAndMount = () => {
      const hasSize = eventSource.clientWidth > 0 && eventSource.clientHeight > 0;

      if (hasSize) {
        if (!hasMountedRef.current) {
          hasMountedRef.current = true;
          setMounted(true);
        }
        return;
      }

      if (!hasMountedRef.current) {
        setMounted(false);
      }
    };

    // Check immediately
    checkAndMount();

    // Watch for resize
    const resizeObserver = new ResizeObserver(checkAndMount);
    resizeObserver.observe(eventSource);

    return () => resizeObserver.disconnect();
  }, [eventSource]);

  // Handle WebGL context loss
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) return;
      if (rendererRef.current?.getContext().isContextLost()) {
        setContextKey((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Cleanup renderer
  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        const gl = rendererRef.current;
        gl._cleanupContextLostListener?.();
        gl.dispose();
        rendererRef.current = null;
      }
    };
  }, [contextKey]);

  // Notify parent when model is fully ready
  useEffect(() => {
    if (modelReady && onReady) {
      onReady();
    }
  }, [modelReady, onReady]);

  if (!modelUrl.trim()) return <ViewerFallback message="No Model File" />;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl">
      {/* Smooth fade placeholder - stays in DOM for clean animation */}
      <div 
        className={`absolute inset-0 z-10 flex items-center justify-center bg-[#707070] transition-opacity duration-500 ease-out pointer-events-none ${
          modelReady ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <ViewerFallback message={mounted ? "Loading 3D Model" : "Initializing"} />
      </div>

      {/* Render Canvas immediately once container is ready - no delays */}
      {mounted && (
        <Canvas
          key={`isolated-context-${contextKey}`}
          eventSource={eventSource ?? undefined}
          camera={{ position: [1.5, 1.2, 3], fov: 45 }}
          style={{ width: "100%", height: "100%" }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
          }}
          onCreated={({ gl }) => {
            const renderer = gl as WebGLRendererWithCleanup;
            rendererRef.current = renderer;
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            const canvasElement = renderer.domElement;
            const handleContextLost = (event: Event) => {
              event.preventDefault();
              if (rendererRef.current === renderer) setContextKey((prev) => prev + 1);
            };

            canvasElement.addEventListener("webglcontextlost", handleContextLost, false);
            renderer._cleanupContextLostListener = () => {
              canvasElement.removeEventListener("webglcontextlost", handleContextLost);
            };
          }}
        >
          <color attach="background" args={["#707070"]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={1} />
          <Environment preset="city" />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#A0A0A0" roughness={1} />
          </mesh>
          <Suspense fallback={null}>
            <Model
              key={modelUrl}
              url={modelUrl}
              textureUrl={textureUrl}
              scale={previewScale}
              onReady={() => setModelReady(true)}
            />
          </Suspense>
          <OrbitControls makeDefault target={[0, 0.4, 0]} enableDamping dampingFactor={0.08} />
        </Canvas>
      )}
    </div>
  );
}

/* =========================================================
    MAIN VIEWPORT
========================================================= */

export default function Furniture3DViewer({
  modelUrl,
  selectedVariantTextureUrl,
  dimensions,
  onReady,
  allowDimensionPreview = true,
}: {
  modelUrl: string;
  selectedVariantTextureUrl?: string | null;
  dimensions?: Dimensions;
  onReady?: () => void;
  allowDimensionPreview?: boolean;
}) {
  const [arOpen, setArOpen] = useState(false);
  const [arPreparing, setArPreparing] = useState(false);
  const [arPreviewError, setArPreviewError] = useState<string | null>(null);
  const [arModelUrl, setArModelUrl] = useState<string | null>(null);
  const arRunIdRef = useRef(0);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [useCustomDimensions, setUseCustomDimensions] = useState(false);
  const [appliedCustomDimensions, setAppliedCustomDimensions] = useState<Dimensions | null>(null);
  const initialDimensionInputs = useMemo(
    () => ({
      width_cm: dimensions?.width_cm?.toString() ?? "",
      depth_cm: dimensions?.depth_cm?.toString() ?? "",
      height_cm: dimensions?.height_cm?.toString() ?? "",
    }),
    [dimensions]
  );
  const [dimensionInputs, setDimensionInputs] = useState<DimensionInputs>(initialDimensionInputs);

  const clampRatio = 0.25;
  const parseDimensionInput = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const parsedDimensionInputs = useMemo(() => ({
    width: parseDimensionInput(dimensionInputs.width_cm),
    depth: parseDimensionInput(dimensionInputs.depth_cm),
    height: parseDimensionInput(dimensionInputs.height_cm),
  }), [dimensionInputs]);

  const getDimensionWarning = (
    value: number | null,
    base: number | null,
    label: string
  ) => {
    if (base == null || value == null) return null;
    const ratio = value / base;
    if (ratio > 1 + clampRatio) {
      return `${label} is much larger than the product and may look too big.`;
    }
    if (ratio < 1 - clampRatio) {
      return `${label} is much smaller than the product and may look too small.`;
    }
    return null;
  };

  const dimensionWarnings = useMemo(() => {
    return {
      width: getDimensionWarning(parsedDimensionInputs.width, dimensions?.width_cm ?? null, "Width"),
      depth: getDimensionWarning(parsedDimensionInputs.depth, dimensions?.depth_cm ?? null, "Depth"),
      height: getDimensionWarning(parsedDimensionInputs.height, dimensions?.height_cm ?? null, "Height"),
    };
  }, [parsedDimensionInputs, dimensions]);


  const dimensionWarning = useMemo(() => {
    const warnings = Object.values(dimensionWarnings).filter(Boolean);
    return warnings.length > 0
      ? `One or more values may make the preview look incorrect.`
      : null;
  }, [dimensionWarnings]);

  const isCustomDimensionsValid = useMemo(() => {
    return (
      parsedDimensionInputs.width != null &&
      parsedDimensionInputs.depth != null &&
      parsedDimensionInputs.height != null
    );
  }, [parsedDimensionInputs]);

  const customDimensions = useMemo(() => {
    if (!useCustomDimensions) return dimensions;
    return appliedCustomDimensions ?? dimensions;
  }, [useCustomDimensions, dimensions, appliedCustomDimensions]);

  const previewScale = useMemo(() => {
    if (!allowDimensionPreview || !useCustomDimensions) return [1, 1, 1] as [number, number, number];
    const ratio = (target?: number | null, base?: number | null) =>
      target != null && base != null && Number.isFinite(target) &&
        Number.isFinite(base) && target > 0 && base > 0
        ? target / base
        : 1;
    return [
      ratio(customDimensions?.width_cm, dimensions?.width_cm),
      ratio(customDimensions?.height_cm, dimensions?.height_cm),
      ratio(customDimensions?.depth_cm, dimensions?.depth_cm),
    ] as [number, number, number];
  }, [allowDimensionPreview, useCustomDimensions, customDimensions, dimensions]);
  const hasCustomPreviewScale = previewScale.some((scale) => Math.abs(scale - 1) > 0.0001);

  useEffect(() => {
    if (!arModelUrl?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(arModelUrl);
  }, [arModelUrl]);

  const handleDimensionInputChange = (field: keyof DimensionInputs, value: string) => {
    setDimensionInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleDimensionInputBlur = (field: keyof DimensionInputs) => {
    const value = dimensionInputs[field];
    if (value.trim() !== "") return;

    setDimensionInputs((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const handleCloseAr = () => {
    arRunIdRef.current += 1;
    setArOpen(false);
    setArModelUrl(null);
  };

  const handleOpenAr = async () => {
    setArPreviewError(null);
    if (!hasCustomPreviewScale) {
      setArModelUrl(null);
      setArOpen(true);
      return;
    }

    const myRun = ++arRunIdRef.current;
    setArPreparing(true);
    try {
      const previewBlob = await createScaledPreviewGlb(modelUrl, previewScale);
      if (myRun !== arRunIdRef.current) return;
      setArModelUrl(URL.createObjectURL(previewBlob));
      setArOpen(true);
    } catch (error) {
      console.error("[AR preview GLB generation failed]", error);
      if (myRun === arRunIdRef.current) {
        setArPreviewError(
          error instanceof Error ? error.message : "Could not prepare the preview model for AR."
        );
      }
    } finally {
      if (myRun === arRunIdRef.current) setArPreparing(false);
    }
  };

  const handleOpenDimensionModal = () => {
    const previewDimensions = useCustomDimensions
      ? appliedCustomDimensions ?? dimensions
      : dimensions;

    setDimensionInputs({
      width_cm: previewDimensions?.width_cm?.toString() ?? "",
      depth_cm: previewDimensions?.depth_cm?.toString() ?? "",
      height_cm: previewDimensions?.height_cm?.toString() ?? "",
    });
    setShowDimensionModal(true);
  };

  const handleDimensionCancel = () => {
    setShowDimensionModal(false);
  };

  const handleResetDimensions = () => {
    setDimensionInputs(initialDimensionInputs);
  };

  const handleDimensionSave = () => {
    if (!isCustomDimensionsValid) return;
    arRunIdRef.current += 1;
    setArPreparing(false);

    const savedDimensions = {
      width_cm: parsedDimensionInputs.width!,
      depth_cm: parsedDimensionInputs.depth!,
      height_cm: parsedDimensionInputs.height!,
    };

    const baseDimensions = {
      width_cm: dimensions?.width_cm ?? null,
      depth_cm: dimensions?.depth_cm ?? null,
      height_cm: dimensions?.height_cm ?? null,
    };

    const isBaseDimensions =
      savedDimensions.width_cm === baseDimensions.width_cm &&
      savedDimensions.depth_cm === baseDimensions.depth_cm &&
      savedDimensions.height_cm === baseDimensions.height_cm;

    if (isBaseDimensions) {
      setAppliedCustomDimensions(null);
      setUseCustomDimensions(false);
    } else {
      setAppliedCustomDimensions(savedDimensions);
      setUseCustomDimensions(true);
    }

    setShowDimensionModal(false);
  };

  const containerCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) setContainerElement(node);
  }, []);

  if (!modelUrl.trim()) {
    return (
      <div className="flex items-center justify-center w-full min-h-60 rounded-2xl bg-black/5 border border-black/10 text-black/40 text-[13px] font-medium">
        No model available
      </div>
    );
  }

  return (
    <>
      <ARModal
        open={arOpen}
        onClose={handleCloseAr}
        modelUrl={arModelUrl ?? modelUrl}
      />


      {allowDimensionPreview && showDimensionModal && (
        <div className="fixed inset-0 z-110 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0D0A08]/95 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#D4A97A]">
                  Preview Dimensions (preview only)
                </h2>
                <p className="mt-3 text-sm text-white/70">
                  Enter dimensions to resize each axis in the viewer and AR. Saved model dimensions and the stored model are not changed.
                </p>
              </div>
              <button
                onClick={handleResetDimensions}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-white/70 transition hover:border-[#D4A97A]/40"
              >
                Reset
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Width (cm)", field: "width_cm", warning: dimensionWarnings.width },
                { label: "Depth (cm)", field: "depth_cm", warning: dimensionWarnings.depth },
                { label: "Height (cm)", field: "height_cm", warning: dimensionWarnings.height },
              ].map(({ label, field, warning }) => (
                <label key={field} className="space-y-2 text-xs text-white/70">
                  <span className="block font-semibold text-[11px] text-white/80">{label}</span>
                  <input
                    value={dimensionInputs[field as keyof DimensionInputs]}
                    onChange={(event) => handleDimensionInputChange(field as keyof DimensionInputs, event.target.value)}
                    onBlur={() => handleDimensionInputBlur(field as keyof DimensionInputs)}
                    inputMode="decimal"
                    className={`w-full rounded-2xl px-3 py-3 text-sm outline-none transition focus:border-[#D4A97A] ${warning ? "border border-amber-300 bg-amber-300/10 text-white" : "border border-white/10 bg-white/5 text-white"}`}
                  />
                  <p className="min-h-5 text-[10px] text-amber-200 leading-snug">
                    {warning ?? "\u00A0"}
                  </p>
                </label>
              ))}
            </div>
            {dimensionWarning && (
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
                {dimensionWarning}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleDimensionSave}
                disabled={!isCustomDimensionsValid}
                className="w-full rounded-2xl bg-[#D4A97A] px-4 py-3 text-sm font-semibold text-[#1C1209] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply and continue
              </button>
              <button
                onClick={handleDimensionCancel}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerCallbackRef}
        className="relative w-full overflow-hidden rounded-2xl min-h-60 sm:min-h-80 md:min-h-95 lg:min-h-105 bg-[#0F0A06] border border-white/10"
      >
        {/* BUTTON CONTRAST FIX: Added dark backdrop and high-contrast text */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {allowDimensionPreview && (
            <button
              onClick={handleOpenDimensionModal}
              disabled={arPreparing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all shadow-xl bg-white/10 text-white border border-white/10 hover:bg-white/15"
            >
              Change Dimension (preview only)
            </button>
          )}
          <button
            onClick={handleOpenAr}
            disabled={arPreparing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all shadow-xl bg-[#D4A97A] hover:bg-[#C4976A] text-[#1C1209] border border-[#D4A97A]"
          >
            <Scan size={14} />
            <span>{arPreparing ? "Preparing AR Preview…" : "View in Space"}</span>
          </button>
        </div>

        {arPreviewError && (
          <p
            role="alert"
            className="absolute top-16 right-3 z-10 max-w-sm rounded-xl border border-red-400/20 bg-black/80 px-3 py-2 text-xs text-red-200"
          >
            {arPreviewError}
          </p>
        )}

        <div className="absolute inset-0">
          <SafeCanvas
            modelUrl={modelUrl}
            textureUrl={selectedVariantTextureUrl}
            previewScale={previewScale}
            onReady={onReady}
            eventSource={containerElement}
          />
        </div>

        {/* GUIDANCE TEXT CONTRAST FIX: Semi-transparent pill background */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white/50 text-[10px] font-medium tracking-widest uppercase">
            Orbit to rotate
          </p>
        </div>
      </div>
    </>
  );
}