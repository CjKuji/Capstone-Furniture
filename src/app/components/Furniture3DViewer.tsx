"use client";

import React, { Suspense, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  Environment,
  ContactShadows,
} from "@react-three/drei";

/* -------------------------- */
/* Props */
/* -------------------------- */

interface Furniture3DViewerProps {
  modelUrl: string;
  selectedColor?: string; // hex string for custom color
  selectedMaterialColor?: string; // hex string for material override
  selectedSize?: number; // scale multiplier
}

/* -------------------------- */
/* Floor */
/* -------------------------- */
function Floor({ size = 6 }: { size?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#e5e5e5" />
    </mesh>
  );
}

/* -------------------------- */
/* Back Wall */
/* -------------------------- */
function Wall({ width = 6, height = 3 }: { width?: number; height?: number }) {
  return (
    <mesh position={[0, height / 2, -width / 2]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color="#d4d4d4" />
    </mesh>
  );
}

/* -------------------------- */
/* Grid Helper */
/* -------------------------- */
function Grid({ size = 6, divisions = 12 }: { size?: number; divisions?: number }) {
  return <gridHelper args={[size, divisions, "#999", "#ccc"]} position={[0, 0.001, 0]} />;
}

/* -------------------------- */
/* Model Loader */
/* -------------------------- */
function Model({
  modelUrl,
  selectedColor,
  selectedMaterialColor,
  selectedSize = 1,
}: Furniture3DViewerProps) {
  const { scene } = useGLTF(modelUrl);

  // clone the scene to prevent shared material issues
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const modelRef = useRef<THREE.Group>(null);

  /* ---------- Center model ---------- */
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clonedScene.position.set(-center.x, -center.y, -center.z);
  }, [clonedScene]);

  /* ---------- Apply Materials ---------- */
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.color = new THREE.Color(selectedColor || selectedMaterialColor || "#ffffff");
          }
        });

        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [clonedScene, selectedColor, selectedMaterialColor]);

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
  selectedMaterialColor,
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
        <Environment preset="apartment" />

        {/* Scene Helpers */}
        <Floor />
        <Wall />
        <Grid />

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
            selectedMaterialColor={selectedMaterialColor}
            selectedSize={selectedSize}
          />
        </Suspense>

        {/* Soft Shadows */}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={5} blur={2} far={5} />

        {/* Camera Controls */}
        <OrbitControls enablePan enableZoom enableRotate minDistance={1} maxDistance={10} />
      </Canvas>
    </div>
  );
}

/* Preload models for faster viewing */
useGLTF.preload("");