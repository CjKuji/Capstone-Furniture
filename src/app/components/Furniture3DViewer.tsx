"use client";

import React, { useMemo, Suspense } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  Environment,
} from "@react-three/drei";

import { computeRealScale } from "@/lib/3D/nomarlizeFurnitureModel";

/* =========================================================
   TYPES
========================================================= */

type Dimensions = {
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
};

/* =========================================================
   MODEL
========================================================= */

function Model({
  url,
  dimensions,
}: {
  url: string;
  dimensions?: Dimensions;
}) {
  const { scene } = useGLTF(url);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const scale = useMemo(() => {
    if (!dimensions) return 1;
    return computeRealScale(clonedScene, dimensions);
  }, [clonedScene, dimensions]);

  const offset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return {
      x: -center.x,
      y: -box.min.y,
      z: -center.z,
    };
  }, [clonedScene]);

  return (
    <group position={[offset.x, offset.y, offset.z]} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

/* =========================================================
   SCALE CUBE (1 meter reference)
========================================================= */

function RealWorldCube() {
  return (
    <group position={[-2, 0.5, 0]}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ff3b3b"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>

      <Html position={[0, 1.2, 0]} center>
        <div className="rounded bg-black/70 px-2 py-1 text-xs text-white">
          100cm × 100cm × 100cm (1m³)
        </div>
      </Html>
    </group>
  );
}

/* =========================================================
   MAIN VIEWER
========================================================= */

export default function Furniture3DViewer({
  modelUrl,
  dimensions,
}: {
  modelUrl: string;
  dimensions?: Dimensions;
}) {
  const isValid = !!modelUrl;

  if (!isValid) {
    return (
      <div className="h-[600px] flex items-center justify-center text-gray-400">
        No model available
      </div>
    );
  }

  /* =========================================================
     🔥 FIXED AR FUNCTION (REAL WORKING APPROACH)
  ========================================================= */

  const enterAR = () => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent;

    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    /* =====================================================
       🍎 iOS (Quick Look - NEEDS .USDZ)
    ===================================================== */
    if (isIOS) {
      const a = document.createElement("a");
      a.href = modelUrl; // MUST be .usdz for real AR
      a.rel = "ar";
      a.click();
      return;
    }

    /* =====================================================
       🤖 ANDROID (Scene Viewer FIX)
    ===================================================== */
    if (isAndroid) {
      const intent = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
        modelUrl
      )}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;

      window.location.href = intent;
      return;
    }

    /* =====================================================
       FALLBACK
    ===================================================== */
    window.open(modelUrl, "_blank");
  };

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl bg-neutral-100">

      {/* AR BUTTON */}
      <button
        onClick={enterAR}
        className="absolute right-3 top-3 z-10 rounded bg-black px-3 py-2 text-xs text-white"
      >
        Enter AR
      </button>

      {/* 3D VIEW */}
      <Canvas camera={{ position: [3, 2, 4], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1} />

        <Environment preset="city" />

        {/* FLOOR */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#ddd" />
        </mesh>

        {/* SCALE CUBE */}
        <RealWorldCube />

        {/* MODEL */}
        <Suspense
          fallback={
            <Html center>
              <div>Loading...</div>
            </Html>
          }
        >
          <Model url={modelUrl} dimensions={dimensions} />
        </Suspense>

        <OrbitControls />
      </Canvas>

      {/* INFO */}
      <div className="absolute bottom-3 left-3 rounded bg-black/60 px-3 py-2 text-xs text-white">
        1m reference cube = real-world scale
      </div>
    </div>
  );
}