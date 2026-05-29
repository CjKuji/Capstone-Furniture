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
  return Math.max(0.001, Math.min(finalScale, 100));
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

  // This is the scale we hand to model-viewer. model-viewer treats 1 GLB unit
  // = 1 metre, so we must account for the native unit system AND the desired
  // real-world size.
  const s       = (targetHeightM / modelHeightM) * unitScale;
  const clamped = Math.max(0.001, Math.min(s, 100));

  // box.min.y is the Y coordinate of the mesh's bottom face in GLB local space.
  // After model-viewer applies `scale`, the bottom face will land at:
  //   box.min.y * clamped  (metres, in model-viewer's world)
  // If the GLB origin is at the mesh centroid, box.min.y ≈ -size.y/2, which
  // means the model floats by ~targetHeightM/2.  We expose this offset so the
  // caller can compensate.
  const arYOffsetM = box.min.y * clamped; // negative → mesh bottom is below origin (good)
                                           // positive → mesh bottom is above origin (floats)

  return {
    scaledHeightM: targetHeightM,
    arScale: `${clamped} ${clamped} ${clamped}`,
    arYOffsetM,
  };
}