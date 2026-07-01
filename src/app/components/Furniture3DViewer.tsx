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
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  Environment,
} from "@react-three/drei";

import { computeRealScale, computeARInfo } from "@/lib/3D/nomarlizeFurnitureModel";
import ARModal from "./ARModal";
import { Scan, AlertTriangle, Loader2 } from "lucide-react";

/* =========================================================
    TYPES
========================================================= */

type Dimensions = {
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
};

type ModelProps = {
  url: string;
  textureUrl?: string | null;
  dimensions?: Dimensions;
  onReady?: () => void;
};

type XRNavigator = Navigator & {
  xr?: {
    isSessionSupported?: (mode: string) => Promise<boolean>;
  };
};

type WebGLRendererWithCleanup = THREE.WebGLRenderer & {
  _cleanupContextLostListener?: () => void;
};

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

function Model({ url, textureUrl, dimensions, onReady }: ModelProps) {
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

  const { scale, offset } = useMemo(() => {
    const calculatedScale = dimensions
      ? computeRealScale(clonedScene, dimensions)
      : 1;

    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return {
      scale: calculatedScale,
      offset: {
        x: -center.x * calculatedScale,
        y: -box.min.y * calculatedScale,
        z: -center.z * calculatedScale,
      },
    };
  }, [clonedScene, dimensions]);

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
  dimensions?: Dimensions;
  eventSource: HTMLElement | null;
  onReady?: () => void;
};

function SafeCanvas({
  modelUrl,
  textureUrl,
  dimensions,
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
      setModelReady(false);
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
        className={`absolute inset-0 z-10 flex items-center justify-center bg-[#050302] transition-opacity duration-500 ease-out pointer-events-none ${
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
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={1} />
          <Environment preset="city" />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#E5E5E5" transparent opacity={0.1} />
          </mesh>
          <Suspense fallback={null}>
            <Model
              key={modelUrl}
              url={modelUrl}
              textureUrl={textureUrl}
              dimensions={dimensions}
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
}: {
  modelUrl: string;
  selectedVariantTextureUrl?: string | null;
  dimensions?: Dimensions;
  onReady?: () => void;
}) {
  const [arOpen, setArOpen] = useState(false);
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  // ── Pre-parse GLB outside Canvas to compute AR info ──
  const { scene: preloadedScene } = useGLTF(modelUrl.trim() ? modelUrl : "");
  const arInfo = useMemo(() => {
    if (!preloadedScene || !modelUrl.trim()) {
      return { arScale: "1 1 1", arYOffsetM: 0 };
    }
    return computeARInfo(preloadedScene, dimensions ?? {});
  }, [preloadedScene, dimensions, modelUrl]);

  const containerCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) setContainerElement(node);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkAR = async () => {
        const xrNavigator = navigator as XRNavigator;
        const supported = !!(xrNavigator.xr && await xrNavigator.xr.isSessionSupported?.("immersive-ar"));
        setArSupported(supported);
      };
      checkAR();
    }
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
        onClose={() => setArOpen(false)}
        modelUrl={modelUrl}
        arScale={arInfo.arScale}
        arYOffsetM={arInfo.arYOffsetM}
      />

      <div
        ref={containerCallbackRef}
        className="relative w-full overflow-hidden rounded-2xl min-h-60 sm:min-h-80 md:min-h-95 lg:min-h-105 bg-[#0F0A06] border border-white/10"
      >
        {/* BUTTON CONTRAST FIX: Added dark backdrop and high-contrast text */}
        <button
          onClick={() => arSupported !== false && setArOpen(true)}
          disabled={arSupported === false}
          className={`absolute top-3 right-3 z-10 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all shadow-xl
            ${arSupported === false 
              ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed" 
              : "bg-[#D4A97A] hover:bg-[#C4976A] text-[#1C1209] border border-[#D4A97A]"}`}
        >
          {arSupported === false ? <AlertTriangle size={14} /> : <Scan size={14} />}
          <span>{arSupported === false ? "AR Unsupported" : "View in Space"}</span>
        </button>

        <div className="absolute inset-0">
          <SafeCanvas
            modelUrl={modelUrl}
            textureUrl={selectedVariantTextureUrl}
            dimensions={dimensions}
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