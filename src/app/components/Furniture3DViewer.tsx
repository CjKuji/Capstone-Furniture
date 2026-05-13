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

  const { scale, offset } = useMemo(() => {
    const s = dimensions ? computeRealScale(clonedScene, dimensions) : 1;
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Offset must be in world space (parent space), so multiply by scale:
    // world_pos = local_coord * scale + offset → we want bottom at y=0, center at x=z=0
    return {
      scale: s,
      offset: {
        x: -center.x * s,
        y: -box.min.y * s,
        z: -center.z * s,
      },
    };
  }, [clonedScene, dimensions]);

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
      <div className="flex justify-center items-center h-[600px] text-black">
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
    <div className="relative bg-white border rounded-xl w-full h-[600px] overflow-hidden">

      {/* AR BUTTON */}
      <button
        onClick={enterAR}
        className="top-4 right-4 z-10 absolute bg-black px-4 py-2 rounded-xl font-medium text-white text-xs"
      >
        Enter AR
      </button>

      {/* 3D CANVAS */}
      <Canvas camera={{ position: [1.5, 1.2, 3], fov: 45 }}>
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

        <OrbitControls target={[0, 0.4, 0]} enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}