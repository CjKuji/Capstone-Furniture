"use client";

import * as THREE from "three";

type Dimensions = {
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
};

/**
 * Detects the unit system used by the GLB by looking at the bounding box size.
 *
 * Thresholds (using the longest axis):
 *   > 100  → millimetres  (a 1m chair would be ~1000 mm tall)
 *   > 3    → centimetres  (a 1m chair would be ~100 cm tall)
 *   ≤ 3    → metres       (a 1m chair is ~1 m tall)
 *
 * We use 100 as the mm/cm boundary (not 300) because a small object
 * exported in cm can easily have a max dim of 40–80 and would be
 * mis-classified as mm with the old threshold of 300.
 */
function detectUnitScale(size: THREE.Vector3): number {
  const max = Math.max(size.x, size.y, size.z);
  if (max > 100) return 0.001; // mm → m
  if (max > 3)   return 0.01;  // cm → m
  return 1;                     // already m
}

/**
 * Returns the uniform scale factor to apply to the Three.js scene so that
 * the model's height matches `dimensions.height_cm` (or, if not provided,
 * simply converts the native units to metres).
 *
 * The returned scale is in metres-per-native-unit, ready to be passed
 * directly to a Three.js <group scale={s}>.
 */
function clampScaleValue(value: number) {
  return Math.max(0.001, Math.min(value, 100));
}

export function computeRealScale(
  scene: THREE.Object3D,
  dimensions: Dimensions
): number {
  if (!scene) return 1;

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);

  if (size.y <= 0) return 1;

  const unitScale        = detectUnitScale(size);
  const modelHeightM     = size.y * unitScale; // native height in metres

  const heightCm         = dimensions?.height_cm;
  const targetHeightM    = heightCm != null && heightCm > 0
    ? heightCm / 100
    : modelHeightM;

  const finalScale = (targetHeightM / modelHeightM) * unitScale;
  return clampScaleValue(finalScale);
}

export function computeRenderScale(
  scene: THREE.Object3D,
  dimensions: Dimensions
): THREE.Vector3 {
  if (!scene) return new THREE.Vector3(1, 1, 1);

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);

  if (size.y <= 0) return new THREE.Vector3(1, 1, 1);

  const unitScale     = detectUnitScale(size);
  const modelWidthM   = size.x * unitScale;
  const modelDepthM   = size.z * unitScale;
  const modelHeightM  = size.y * unitScale;

  const widthCm  = dimensions?.width_cm;
  const depthCm  = dimensions?.depth_cm;
  const heightCm = dimensions?.height_cm;

  if (
    widthCm != null && widthCm > 0 &&
    depthCm != null && depthCm > 0 &&
    heightCm != null && heightCm > 0
  ) {
    const targetWidthM  = widthCm / 100;
    const targetDepthM  = depthCm / 100;
    const targetHeightM = heightCm / 100;

    return new THREE.Vector3(
      clampScaleValue(targetWidthM  / Math.max(modelWidthM, 0.00001)),
      clampScaleValue(targetHeightM / Math.max(modelHeightM, 0.00001)),
      clampScaleValue(targetDepthM  / Math.max(modelDepthM, 0.00001)),
    );
  }

  const uniformScale = computeRealScale(scene, dimensions);
  return new THREE.Vector3(uniformScale, uniformScale, uniformScale);
}

/**
 * Returns everything the AR layer needs in one call so we never have to
 * re-traverse the scene twice.
 *
 * `scaledHeightM`  – real-world height of the model in metres (for camera setup)
 * `arScale`        – "x y z" string for model-viewer's `scale` attribute
 * `arYOffsetM`     – how far (in metres, post-scale) the mesh origin sits
 *                    above the true bottom face. Pass this to ARModal so it
 *                    can shift the model down and prevent floating in AR.
 *                    Positive value → origin is above the floor → model floats.
 */
export function computeARInfo(
  scene: THREE.Object3D,
  dimensions: Dimensions
): { scaledHeightM: number; arScale: string; arYOffsetM: number } {
  const fallback = { scaledHeightM: 1, arScale: "1 1 1", arYOffsetM: 0 };
  if (!scene) return fallback;

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);

  if (size.y <= 0) return fallback;

  const unitScale     = detectUnitScale(size);
  const modelHeightM  = size.y * unitScale;

  const heightCm      = dimensions?.height_cm;
  const targetHeightM = heightCm != null && heightCm > 0
    ? heightCm / 100
    : modelHeightM;

  const renderScale = computeRenderScale(scene, dimensions);
  const arYOffsetM = box.min.y * renderScale.y;

  return {
    scaledHeightM: targetHeightM,
    arScale: `${renderScale.x} ${renderScale.y} ${renderScale.z}`,
    arYOffsetM,
  };
}