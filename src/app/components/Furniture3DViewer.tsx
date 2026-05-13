"use client";

import React, { useMemo, useEffect, useRef, Suspense, useState } from "react";
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

/* =========================================================
   MODEL
========================================================= */

function Model({
  url,
  textureUrl,
  dimensions,
}: {
  url: string;
  textureUrl?: string | null;
  dimensions?: Dimensions;
}) {
  const { scene } = useGLTF(url);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Clone each material individually so mutations never bleed into the
    // useGLTF global cache — shared materials are the root cause of the
    // "old texture persists on re-visit" bug.
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => m.clone());
      } else {
        mesh.material = mesh.material.clone();
      }
    });
    return clone;
  }, [scene]);

  const { scale, offset } = useMemo(() => {
    const s = dimensions ? computeRealScale(clonedScene, dimensions) : 1;
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return {
      scale: s,
      offset: {
        x: -center.x * s,
        y: -box.min.y * s,
        z: -center.z * s,
      },
    };
  }, [clonedScene, dimensions]);

  // Capture original maps once per mount (from the freshly-cloned, isolated materials)
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
    if (!textureUrl) {
      // Restore original maps
      clonedScene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat, i) => {
          const key = `${mesh.uuid}_${i}`;
          const orig = originalMaps.current.get(key) ?? null;
          (mat as THREE.MeshStandardMaterial).map = orig;
          (mat as THREE.MeshStandardMaterial).needsUpdate = true;
        });
      });
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, (texture) => {
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
    });
  }, [textureUrl, clonedScene]);

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
  selectedVariantTextureUrl,
  dimensions,
}: {
  modelUrl: string;
  selectedVariantTextureUrl?: string | null;
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
     AR STATE
  ========================================================= */

  const [arOpen, setArOpen] = useState(false);

  return (
    <>
      <ARModal open={arOpen} onClose={() => setArOpen(false)} modelUrl={modelUrl} />

      <div className="relative bg-white border rounded-xl w-full h-[600px] overflow-hidden">

        {/* AR BUTTON */}
        <button
          onClick={() => setArOpen(true)}
          className="top-4 right-4 z-10 absolute flex items-center gap-1.5 bg-[#D4A97A] hover:bg-[#C4976A] px-4 py-2 rounded-xl font-semibold text-[#1C1209] text-xs transition"
        >
          <Scan className="w-3.5 h-3.5" />
          View in AR
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
          <Model url={modelUrl} textureUrl={selectedVariantTextureUrl} dimensions={dimensions} />
        </Suspense>

        <OrbitControls target={[0, 0.4, 0]} enableDamping dampingFactor={0.08} />
      </Canvas>
      </div>
    </>
  );
}