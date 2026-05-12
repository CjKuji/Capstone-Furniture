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
   MAIN VIEWER
========================================================= */

export default function Furniture3DViewer({
  modelUrl,
  dimensions,
}: {
  modelUrl: string;
  dimensions?: Dimensions;
}) {
  if (!modelUrl) {
    return (
      <div className="h-[600px] flex items-center justify-center text-black">
        No model available
      </div>
    );
  }

  /* =========================================================
     AR HANDLER (SIMPLIFIED + SAFE)
  ========================================================= */

  const enterAR = () => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent;

    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    // iOS AR Quick Look (requires .usdz)
    if (isIOS) {
      const link = document.createElement("a");
      link.href = modelUrl;
      link.rel = "ar";
      link.click();
      return;
    }

    // Android Scene Viewer
    if (isAndroid) {
      const intent = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
        modelUrl
      )}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;

      window.location.href = intent;
      return;
    }

    // fallback
    window.open(modelUrl, "_blank");
  };

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl bg-white border">

      {/* AR BUTTON */}
      <button
        onClick={enterAR}
        className="absolute right-4 top-4 z-10 rounded-xl bg-black px-4 py-2 text-xs font-medium text-white"
      >
        Enter AR
      </button>

      {/* 3D CANVAS */}
      <Canvas camera={{ position: [3, 2, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1} />

        <Environment preset="city" />

        {/* FLOOR */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#e5e5e5" />
        </mesh>

        {/* MODEL */}
        <Suspense
          fallback={
            <Html center>
              <div className="text-black">Loading model...</div>
            </Html>
          }
        >
          <Model url={modelUrl} dimensions={dimensions} />
        </Suspense>

        <OrbitControls />
      </Canvas>
    </div>
  );
}