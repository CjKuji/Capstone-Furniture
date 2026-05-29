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
import { Scan, AlertTriangle, Loader2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

type Dimensions = {
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
};

type ModelProps = {
  url: string;
  textureUrl?: string | null;
  dimensions?: Dimensions;
  onReady?: (info: { scaledHeightM: number; rawScale: number }) => void;
};

function ViewerFallback({ message = "Loading 3D Model" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center px-4 space-y-3">
      <Loader2 className="w-5 h-5 animate-spin text-[#D4A97A]" />
      <span className="text-white/40 text-[11px] font-medium tracking-[0.15em] uppercase">
        {message}
      </span>
    </div>
  );
}

function Model({ url, textureUrl, dimensions, onReady }: ModelProps) {
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

  const { scale, offset, scaledHeightM } = useMemo(() => {
    const rawScale = dimensions ? computeRealScale(clonedScene, dimensions) : 1;
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return {
      scale: rawScale,
      // Offset is in world space so must be pre-multiplied by scale
      offset: {
        x: -center.x * rawScale,
        y: -box.min.y * rawScale,
        z: -center.z * rawScale,
      },
      scaledHeightM: size.y * rawScale,
    };
  }, [clonedScene, dimensions]);

  useEffect(() => {
    if (onReady) onReady({ scaledHeightM, rawScale: scale });
  }, [scaledHeightM, scale, onReady]);

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
    loader.load(
      textureUrl,
      (texture) => {
        if (disposed) { texture.dispose(); return; }
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
      },
      undefined,
      () => resetOriginalTextures()
    );

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
    // scale={1} here — scaling is baked into the offset already via world-space multiply
    <group position={[offset.x, offset.y, offset.z]} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

type SafeCanvasProps = {
  modelUrl: string;
  textureUrl?: string | null;
  dimensions?: Dimensions;
  controlsRef: React.MutableRefObject<any>;
  onModelReady?: (info: { scaledHeightM: number; rawScale: number }) => void;
};

function SafeCanvas({ modelUrl, textureUrl, dimensions, controlsRef, onModelReady }: SafeCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const [contextKey, setContextKey] = useState(0);
  const [orbitTarget, setOrbitTarget] = useState<[number, number, number]>([0, 0.4, 0]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

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

  const handleModelReady = useCallback((info: { scaledHeightM: number; rawScale: number }) => {
    const mid = info.scaledHeightM / 2;
    setOrbitTarget([0, mid, 0]);
    if (controlsRef.current) {
      const dist = info.scaledHeightM * 2.5;
      controlsRef.current.object.position.set(dist * 0.5, info.scaledHeightM * 0.8, dist);
      controlsRef.current.target.set(0, mid, 0);
      controlsRef.current.update();
    }
    if (onModelReady) onModelReady(info);
  }, [controlsRef, onModelReady]);

  if (!modelUrl.trim()) return <ViewerFallback message="No Model File" />;
  if (!mounted) return <ViewerFallback message="Preparing Viewport" />;

  return (
    <div style={{ width: "100%", height: "100%", touchAction: "none" }}>
      <Canvas
        key={`isolated-context-${contextKey}`}
        camera={{ position: [1.5, 1.2, 3], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
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
          canvasElement.style.touchAction = "none";
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#E5E5E5" transparent opacity={0.1} />
        </mesh>
        <Suspense fallback={<Html center><ViewerFallback /></Html>}>
          <Model
            url={modelUrl}
            textureUrl={textureUrl}
            dimensions={dimensions}
            onReady={handleModelReady}
          />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={orbitTarget}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          rotateSpeed={0.6}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_ROTATE,
          }}
        />
      </Canvas>
    </div>
  );
}

function ViewerControls({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  const rotate = useCallback((direction: "left" | "right") => {
    const controls = controlsRef.current;
    if (!controls) return;
    const delta = direction === "left" ? -0.3 : 0.3;
    controls.setAzimuthalAngle(controls.getAzimuthalAngle() + delta);
    controls.update();
  }, [controlsRef]);

  const zoom = useCallback((direction: "in" | "out") => {
    const controls = controlsRef.current;
    if (!controls) return;
    const factor = direction === "in" ? 0.8 : 1.25;
    const camera = controls.object as THREE.PerspectiveCamera;
    const targetPos = controls.target as THREE.Vector3;
    const currentPos = camera.position.clone();
    const toCamera = currentPos.sub(targetPos);
    toCamera.multiplyScalar(factor);
    camera.position.copy(targetPos).add(toCamera);
    controls.update();
  }, [controlsRef]);

  const btnBase =
    "flex items-center justify-center w-9 h-9 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 text-white/50 hover:text-white hover:border-white/30 hover:bg-black/70 transition-all active:scale-90 select-none";

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
      <button className={btnBase} onPointerDown={(e) => { e.preventDefault(); rotate("left"); }} aria-label="Rotate left"><RotateCcw size={15} /></button>
      <button className={btnBase} onPointerDown={(e) => { e.preventDefault(); zoom("out"); }} aria-label="Zoom out"><ZoomOut size={15} /></button>
      <button className={btnBase} onPointerDown={(e) => { e.preventDefault(); zoom("in"); }} aria-label="Zoom in"><ZoomIn size={15} /></button>
      <button className={btnBase} onPointerDown={(e) => { e.preventDefault(); rotate("right"); }} aria-label="Rotate right"><RotateCw size={15} /></button>
    </div>
  );
}

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
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [arScale, setArScale] = useState<string>("1 1 1");
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkAR = async () => {
      try {
        const supported = !!(
          navigator.xr &&
          (await (navigator.xr as any).isSessionSupported?.("immersive-ar"))
        );
        setArSupported(supported);
      } catch {
        setArSupported(false);
      }
    };
    checkAR();
  }, []);

  const handleModelReady = useCallback(({ rawScale }: { scaledHeightM: number; rawScale: number }) => {
    setArScale(`${rawScale} ${rawScale} ${rawScale}`);
  }, []);

  if (!modelUrl.trim()) {
    return (
      <div className="flex items-center justify-center w-full min-h-[240px] rounded-2xl bg-black/5 border border-black/10 text-black/40 text-[13px] font-medium">
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
        arScale={arScale}
        isSupported={arSupported ?? undefined}
      />

      <div className="relative w-full overflow-hidden rounded-2xl min-h-[240px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[420px] bg-[#0F0A06] border border-white/10">
        <button
          onClick={() => arSupported !== false && setArOpen(true)}
          disabled={arSupported === false}
          className={`absolute top-3 right-3 z-10 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all shadow-xl
            ${arSupported === false
              ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
              : "bg-[#D4A97A] hover:bg-[#C4976A] text-[#1C1209] border border-[#D4A97A]"
            }`}
        >
          {arSupported === false ? <AlertTriangle size={14} /> : <Scan size={14} />}
          <span>{arSupported === false ? "AR Unsupported" : "View in Space"}</span>
        </button>

        <div className="absolute inset-0">
          <SafeCanvas
            modelUrl={modelUrl}
            textureUrl={selectedVariantTextureUrl}
            dimensions={dimensions}
            controlsRef={controlsRef}
            onModelReady={handleModelReady}
          />
        </div>

        <ViewerControls controlsRef={controlsRef} />
      </div>
    </>
  );
}