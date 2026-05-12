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
  textureUrl,
  dimensions,
}: {
  url: string;
  textureUrl?: string | null;
  dimensions?: Dimensions;
}) {
  const { scene } = useGLTF(url);

  const groupRef = useRef<THREE.Group>(null);

  /* =========================================================
     CLONE SCENE ONCE
  ========================================================= */

  const clonedScene = useMemo(() => {
    return scene.clone(true);
  }, [scene]);

  /* =========================================================
     STORE ORIGINAL MATERIALS
  ========================================================= */

  const originalMaterials = useRef(
    new Map<
      THREE.Mesh,
      THREE.Material | THREE.Material[]
    >()
  );

  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;

      const mesh = obj as THREE.Mesh;

      if (
        !originalMaterials.current.has(mesh)
      ) {
        originalMaterials.current.set(
          mesh,
          mesh.material
        );
      }
    });
  }, [clonedScene]);

  /* =========================================================
     TEXTURE LOADING
  ========================================================= */

  const texture = useMemo(() => {
    if (!textureUrl) return null;

    const loader = new THREE.TextureLoader();

    const tex = loader.load(textureUrl);

    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;

    tex.flipY = false;

    tex.anisotropy = 8;

    return tex;
  }, [textureUrl]);

  /* =========================================================
     APPLY MATERIALS
  ========================================================= */

  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) {
        return;
      }

      const mesh = obj as THREE.Mesh;

      const original =
        originalMaterials.current.get(mesh);

      if (!original) return;

      /* =====================================================
         RESTORE ORIGINAL MATERIAL
      ===================================================== */

      if (!texture) {
        mesh.material = original;
        return;
      }

      /* =====================================================
         APPLY TEXTURE SAFELY
      ===================================================== */

      const apply = (
        mat: THREE.Material
      ) => {
        const cloned =
          (
            mat as THREE.MeshStandardMaterial
          ).clone();

        if (
          cloned instanceof
          THREE.MeshStandardMaterial
        ) {
          cloned.map = texture;

          cloned.roughness = 0.9;

          cloned.metalness = 0.05;

          cloned.envMapIntensity = 0.6;

          cloned.needsUpdate = true;
        }

        return cloned;
      };

      mesh.material = Array.isArray(
        original
      )
        ? original.map(apply)
        : apply(original);
    });
  }, [texture, clonedScene]);

  /* =========================================================
     REAL-WORLD SCALE
     IMPORTANT:
     Converts model into real-world size
  ========================================================= */

  const scale = useMemo(() => {
    if (!dimensions) return 1;

    return computeRealScale(
      clonedScene,
      dimensions
    );
  }, [clonedScene, dimensions]);

  /* =========================================================
     CENTER MODEL
  ========================================================= */

  const offset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(
      clonedScene
    );

    const center =
      new THREE.Vector3();

    box.getCenter(center);

    return {
      x: -center.x,
      y: -box.min.y,
      z: -center.z,
    };
  }, [clonedScene]);

  /* =========================================================
     APPLY TRANSFORMS
  ========================================================= */

  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.position.set(
      offset.x,
      offset.y,
      offset.z
    );

    groupRef.current.scale.setScalar(
      scale
    );
  }, [offset, scale]);

  /* =========================================================
     DEBUG FINAL REAL SIZE
     TEMPORARY FOR TESTING
  ========================================================= */

  useEffect(() => {
    if (!groupRef.current) return;

    const finalBox =
      new THREE.Box3().setFromObject(
        groupRef.current
      );

    const finalSize =
      new THREE.Vector3();

    finalBox.getSize(finalSize);

    console.log(
      "FINAL MODEL SIZE (meters)"
    );

    console.log({
      width: finalSize.x,
      height: finalSize.y,
      depth: finalSize.z,
    });

    console.log(
      "EXPECTED DB SIZE (meters)"
    );

    console.log({
      width:
        (dimensions?.width_cm ?? 0) /
        100,

      height:
        (dimensions?.height_cm ?? 0) /
        100,

      depth:
        (dimensions?.depth_cm ?? 0) /
        100,
    });
  }, [dimensions, scale]);

  /* =========================================================
     RENDER
  ========================================================= */

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
  dimensions,
}: {
  modelUrl: string;

  selectedVariantTextureUrl?:
    | string
    | null;

  dimensions?: Dimensions;
}) {
  /* =========================================================
     MODEL VALIDATION
  ========================================================= */

  const isValidModel = useMemo(() => {
    if (!modelUrl) return false;

    if (
      typeof modelUrl !== "string"
    ) {
      return false;
    }

    if (
      modelUrl.trim().length === 0
    ) {
      return false;
    }

    if (
      modelUrl.endsWith(".html")
    ) {
      return false;
    }

    if (
      modelUrl.startsWith("blob:") &&
      modelUrl.includes("undefined")
    ) {
      return false;
    }

    return true;
  }, [modelUrl]);

  /* =========================================================
     INVALID MODEL
  ========================================================= */

  if (!isValidModel) {
    return (
      <div className="flex h-[600px] items-center justify-center text-sm text-neutral-500">
        No model available
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl bg-neutral-100">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: [3, 2, 4],
          fov: 50,
        }}
        gl={{
          antialias: true,

          preserveDrawingBuffer: false,
        }}
      >
        {/* ===================================================
            LIGHTING
        =================================================== */}

        <ambientLight intensity={0.4} />

        <directionalLight
          position={[5, 8, 5]}
          intensity={1}
          castShadow
        />

        {/* ===================================================
            ENVIRONMENT
        =================================================== */}

        <Environment preset="city" />

        {/* ===================================================
            FLOOR
        =================================================== */}

        <mesh
          rotation={[
            -Math.PI / 2,
            0,
            0,
          ]}
          receiveShadow
        >
          <planeGeometry
            args={[20, 20]}
          />

          <meshStandardMaterial
            color="#d6d6d6"
            roughness={1}
          />
        </mesh>

        {/* ===================================================
            WALL
        =================================================== */}

        <mesh
          position={[0, 3, -6]}
          receiveShadow
        >
          <planeGeometry
            args={[20, 10]}
          />

          <meshStandardMaterial color="#eaeaea" />
        </mesh>

        {/* ===================================================
            1 METER DEBUG CUBE
            TEMPORARY SCALE TEST
        =================================================== */}

        <mesh position={[-2, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />

          <meshStandardMaterial
            color="red"
            wireframe
          />
        </mesh>

        {/* ===================================================
            MODEL
        =================================================== */}

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
            textureUrl={
              selectedVariantTextureUrl
            }
            dimensions={dimensions}
          />
        </Suspense>

        {/* ===================================================
            CONTROLS
        =================================================== */}

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={1}
          maxDistance={10}
        />
      </Canvas>

      {/* =====================================================
          UI BADGE
      ===================================================== */}

      <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-2 text-xs text-white backdrop-blur">
        Variant preview active
      </div>
    </div>
  );
}