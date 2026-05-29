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

import { computeRealScale } from "@/lib/3D/nomarlizeFurnitureModel";
import ARModal from "./ARModal";
import { Scan } from "lucide-react";

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
};

/* =========================================================
    FALLBACK
========================================================= */

function ViewerFallback({
  message = "Unable to load 3D model",
}: {
  message?: string;
}) {
  return (
    <div
      className="flex items-center justify-center w-full h-full text-center px-4 animate-pulse"
      style={{
        color: "rgba(255,255,255,0.35)",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}

/* =========================================================
    MODEL LAYER
========================================================= */

function Model({ url, textureUrl, dimensions }: ModelProps) {
  const { scene } = useGLTF(url);

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
            if ((mat as any).map) (mat as any).map.dispose();
            mat.dispose();
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
};

function SafeCanvas({
  modelUrl,
  textureUrl,
  dimensions,
  eventSource,
}: SafeCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const [contextKey, setContextKey] = useState(0);
  const [hasValidDimensions, setHasValidDimensions] = useState(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!eventSource) return;
    const checkDimensions = () => {
      setHasValidDimensions(eventSource.clientWidth > 0 && eventSource.clientHeight > 0);
    };
    checkDimensions();
    const resizeObserver = new ResizeObserver(() => checkDimensions());
    resizeObserver.observe(eventSource);
    return () => resizeObserver.disconnect();
  }, [eventSource]);

  useEffect(() => {
    if (!hasValidDimensions) return;
    const timeout = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(timeout);
  }, [hasValidDimensions]);

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

  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        const gl = rendererRef.current;
        if ((gl as any)._cleanupContextLostListener) (gl as any)._cleanupContextLostListener();
        gl.dispose();
        rendererRef.current = null;
      }
    };
  }, [contextKey]);

  if (!modelUrl.trim()) return <ViewerFallback message="No 3D model available" />;
  if (!hasValidDimensions || !mounted) return <ViewerFallback message="Preparing layout..." />;

  return (
    <Canvas
      key={`isolated-context-${contextKey}`}
      eventSource={eventSource ?? undefined}
      camera={{ position: [1.5, 1.2, 3], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
      // FIXED: Removed 'debug' and verified property types for GLProps
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        rendererRef.current = gl;
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const canvasElement = gl.domElement;
        const handleContextLost = (event: Event) => {
          event.preventDefault();
          if (rendererRef.current === gl) setContextKey((prev) => prev + 1);
        };

        canvasElement.addEventListener("webglcontextlost", handleContextLost, false);
        (gl as any)._cleanupContextLostListener = () => {
          canvasElement.removeEventListener("webglcontextlost", handleContextLost);
        };
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <Environment preset="city" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#E5E5E5" />
      </mesh>
      <Suspense fallback={<Html center><span className="text-[#D4A97A] text-[13px] tracking-widest">LOADING...</span></Html>}>
        <Model url={modelUrl} textureUrl={textureUrl} dimensions={dimensions} />
      </Suspense>
      <OrbitControls makeDefault target={[0, 0.4, 0]} enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}

/* =========================================================
    MAIN VIEWPORT
========================================================= */

export default function Furniture3DViewer({
  modelUrl,
  selectedVariantTextureUrl,
  dimensions,
}: {
  modelUrl: string;
  selectedVariantTextureUrl?: string | null;
  dimensions?: Dimensions;
}) {
  const [arOpen, setArOpen] = useState(false);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  const containerCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) setContainerElement(node);
  }, []);

  if (!modelUrl.trim()) {
    return (
      <div className="flex items-center justify-center w-full min-h-[240px] rounded-2xl bg-[#0F0A06] border border-white/10 text-white/30 text-[13px]">
        No model available
      </div>
    );
  }

  return (
    <>
      <ARModal open={arOpen} onClose={() => setArOpen(false)} modelUrl={modelUrl} />

      <div
        ref={containerCallbackRef}
        className="relative w-full overflow-hidden rounded-2xl min-h-[240px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[420px] bg-[#0F0A06] border border-white/10"
      >
        <button
          onClick={() => setArOpen(true)}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#D4A97A] hover:bg-[#C4976A] px-3 py-1.5 rounded-xl font-semibold text-[#1C1209] text-xs transition-all"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>View in AR</span>
        </button>

        <div className="absolute inset-0">
          <SafeCanvas
            modelUrl={modelUrl}
            textureUrl={selectedVariantTextureUrl}
            dimensions={dimensions}
            eventSource={containerElement}
          />
        </div>
      </div>
    </>
  );
}