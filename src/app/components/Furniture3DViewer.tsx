"use client";

import React, { Suspense, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  Environment,
} from "@react-three/drei";

/* -------------------------- */
/* Props */
/* -------------------------- */
interface Furniture3DViewerProps {
  modelUrl: string;
  selectedColor?: string; // hex string for color overlay
  selectedMaterialTextureUrl?: string; // texture map URL
  selectedSize?: number; // scale multiplier
}

/* -------------------------- */
/* Model Loader */
/* -------------------------- */
function Model({
  modelUrl,
  selectedColor,
  selectedMaterialTextureUrl,
  selectedSize = 1,
}: Furniture3DViewerProps) {
  const { scene } = useGLTF(modelUrl);
  const modelRef = useRef<THREE.Group>(null);

  // clone scene to avoid shared material issues
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  /* ---------- Center model ---------- */
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clonedScene.position.set(-center.x, -center.y, -center.z);
  }, [clonedScene]);

  /* ---------- Apply Materials ---------- */
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const texture = selectedMaterialTextureUrl ? textureLoader.load(selectedMaterialTextureUrl) : null;

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // Apply texture if available
            if (texture) {
              mat.map = texture;
            }

            // Apply color overlay if available
            if (selectedColor) {
              mat.color = new THREE.Color(selectedColor);
            }

            mat.needsUpdate = true;
          }
        });

        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [clonedScene, selectedColor, selectedMaterialTextureUrl]);

  /* ---------- Scale Model ---------- */
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.scale.set(selectedSize, selectedSize, selectedSize);
    }
  }, [selectedSize]);

  return <primitive ref={modelRef} object={clonedScene} />;
}

/* -------------------------- */
/* Main Viewer Component */
/* -------------------------- */
export default function Furniture3DViewer({
  modelUrl,
  selectedColor,
  selectedMaterialTextureUrl,
  selectedSize = 1,
}: Furniture3DViewerProps) {
  return (
    <div className="w-full h-[500px] bg-gray-50 rounded-lg shadow-md">
      <Canvas shadows camera={{ position: [3, 2, 4], fov: 50 }}>
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Environment */}
        <Environment preset="studio" />

        {/* 3D Model */}
        <Suspense
          fallback={
            <Html center>
              <div className="text-black font-semibold">Loading model...</div>
            </Html>
          }
        >
          <Model
            modelUrl={modelUrl}
            selectedColor={selectedColor}
            selectedMaterialTextureUrl={selectedMaterialTextureUrl}
            selectedSize={selectedSize}
          />
        </Suspense>

        {/* Camera Controls */}
        <OrbitControls enablePan enableZoom enableRotate minDistance={1} maxDistance={10} />
      </Canvas>
    </div>
  );
}

/* Preload models for faster viewing */
useGLTF.preload("");