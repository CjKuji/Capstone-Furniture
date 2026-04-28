"use client";

import React, { Suspense, useMemo, useRef, useEffect } from "react";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  Environment,
} from "@react-three/drei";

/* =========================================================
   MODEL (STABLE VERSION)
========================================================= */

function Model({
  url,
  textureUrl,
}: {
  url: string;
  textureUrl?: string | null;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  /**
   * IMPORTANT:
   * clone ONLY once per model load
   */
  const clonedScene = useMemo(() => {
    return scene.clone(true);
  }, [scene]);

  /**
   * Store original materials once
   */
  const originalMaterials = useRef(new Map());

  useEffect(() => {
    clonedScene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;

        if (!originalMaterials.current.has(mesh)) {
          originalMaterials.current.set(mesh, mesh.material);
        }
      }
    });
  }, [clonedScene]);

  /**
   * Texture loading (safe + memoized)
   */
  const texture = useMemo(() => {
    if (!textureUrl) return null;

    const loader = new THREE.TextureLoader();
    const tex = loader.load(textureUrl);

    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.flipY = false;
    tex.anisotropy = 8;

    return tex;
  }, [textureUrl]);

  /**
   * MATERIAL APPLICATION (safe update only)
   */
  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;

      const mesh = obj as THREE.Mesh;
      const original = originalMaterials.current.get(mesh);

      if (!original) return;

      // restore if no texture
      if (!texture) {
        mesh.material = original as any;
        return;
      }

      const apply = (mat: THREE.Material) => {
        const cloned = (mat as THREE.MeshStandardMaterial).clone();

        if (cloned instanceof THREE.MeshStandardMaterial) {
          cloned.map = texture;
          cloned.roughness = 0.9;
          cloned.metalness = 0.05;
          cloned.envMapIntensity = 0.6;
          cloned.needsUpdate = true;
        }

        return cloned;
      };

      mesh.material = Array.isArray(original)
        ? original.map(apply)
        : apply(original);
    });
  }, [texture, clonedScene]);

  /**
   * CENTER MODEL ONCE
   */
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

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(offset.x, offset.y, offset.z);
  }, [offset]);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

/* =========================================================
   VIEWER (FINAL SAFE VERSION)
========================================================= */

export default function Furniture3DViewer({
  modelUrl,
  selectedVariantTextureUrl,
}: {
  modelUrl: string;
  selectedVariantTextureUrl?: string | null;
}) {
  /**
   * STRICT validation (prevents invalid blob / html URLs)
   */
  const isValidModel = useMemo(() => {
    if (!modelUrl) return false;
    if (typeof modelUrl !== "string") return false;
    if (modelUrl.trim().length === 0) return false;
    if (modelUrl.endsWith(".html")) return false;
    if (modelUrl.startsWith("blob:") && modelUrl.includes("undefined")) return false;

    return true;
  }, [modelUrl]);

  /**
   * DO NOT render Canvas if invalid
   */
  if (!isValidModel) {
    return (
      <div className="flex items-center justify-center h-[600px] text-neutral-500 text-sm">
        No model available
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] bg-neutral-100 rounded-xl overflow-hidden">

      <Canvas
        shadows
        dpr={[1, 1.5]} // prevents GPU overload (important for Context Lost)
        camera={{ position: [3, 2, 4], fov: 50 }}
        gl={{
          antialias: true,
          preserveDrawingBuffer: false, // IMPORTANT: reduces memory leaks
        }}
      >
        {/* LIGHTING */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />

        {/* ENV */}
        <Environment preset="city" />

        {/* FLOOR */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#d6d6d6" roughness={1} />
        </mesh>

        {/* WALL */}
        <mesh position={[0, 3, -6]} receiveShadow>
          <planeGeometry args={[20, 10]} />
          <meshStandardMaterial color="#eaeaea" />
        </mesh>

        {/* MODEL */}
        <Suspense
          fallback={
            <Html center>
              <div className="text-sm text-black">
                Loading model...
              </div>
            </Html>
          }
        >
          <Model
            url={modelUrl}
            textureUrl={selectedVariantTextureUrl}
          />
        </Suspense>

        {/* CONTROLS */}
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={1}
          maxDistance={10}
        />
      </Canvas>

      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-2 rounded-lg backdrop-blur">
        Variant preview active
      </div>
    </div>
  );
}