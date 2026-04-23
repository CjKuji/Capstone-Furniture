"use client";

import React, {
  Suspense,
  useMemo,
  useRef,
  useEffect,
} from "react";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  Environment,
} from "@react-three/drei";

/* =========================================================
   MODEL (STABLE MATERIAL + TEXTURE ENGINE)
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

  /* Clone model safely per instance */
  const clonedScene = useMemo(() => {
    return scene.clone(true);
  }, [scene]);

  /* Texture loader (stable lifecycle) */
  const texture = useMemo(() => {
    if (!textureUrl) return null;

    const loader = new THREE.TextureLoader();
    const tex = loader.load(textureUrl);

    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.flipY = false;
    tex.anisotropy = 8;

    return tex;
  }, [textureUrl]);

  /* Apply texture safely (NO material array overwrite) */
  useEffect(() => {
    if (!texture) return;

    const materialsToDispose: THREE.Material[] = [];

    clonedScene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;

      const mesh = obj;

      const originalMaterial = mesh.material;

      if (Array.isArray(originalMaterial)) {
        mesh.material = originalMaterial.map((mat) => {
          const cloned = (mat as THREE.MeshStandardMaterial).clone();

          if (cloned instanceof THREE.MeshStandardMaterial) {
            cloned.map = texture;
            cloned.roughness = 0.9;
            cloned.metalness = 0.05;
            cloned.envMapIntensity = 0.6;
            cloned.needsUpdate = true;
          }

          materialsToDispose.push(cloned);
          return cloned;
        });
      } else {
        const cloned = (originalMaterial as THREE.MeshStandardMaterial).clone();

        if (cloned instanceof THREE.MeshStandardMaterial) {
          cloned.map = texture;
          cloned.roughness = 0.9;
          cloned.metalness = 0.05;
          cloned.envMapIntensity = 0.6;
          cloned.needsUpdate = true;
        }

        mesh.material = cloned;
        materialsToDispose.push(cloned);
      }
    });

    return () => {
      texture.dispose();
      materialsToDispose.forEach((m) => m.dispose());
    };
  }, [clonedScene, texture]);

  /* Center model properly */
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
   VIEWER
========================================================= */

export default function Furniture3DViewer({
  modelUrl,
  selectedVariantTextureUrl,
}: {
  modelUrl: string;
  selectedVariantTextureUrl?: string | null;
}) {
  const isValidModel = useMemo(() => {
    return (
      typeof modelUrl === "string" &&
      modelUrl.length > 0 &&
      !modelUrl.endsWith(".html")
    );
  }, [modelUrl]);

  return (
    <div className="relative w-full h-[600px] bg-neutral-100 rounded-xl overflow-hidden">

      {isValidModel ? (
        <Canvas
          shadows
          camera={{ position: [3, 2, 4], fov: 50 }}
          gl={{ antialias: true, toneMappingExposure: 0.9 }}
        >
          {/* LIGHTING */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={1} castShadow />

          {/* ENVIRONMENT */}
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
      ) : (
        <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
          No model available
        </div>
      )}

      {/* OVERLAY */}
      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-2 rounded-lg backdrop-blur">
        Select a variant to preview materials in real time
      </div>
    </div>
  );
}