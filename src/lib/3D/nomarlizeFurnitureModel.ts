import * as THREE from "three";

type Dimensions = {
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
};

function detectUnitScale(size: THREE.Vector3): number {
  const max = Math.max(size.x, size.y, size.z);
  if (max > 300) return 0.001; // mm → m
  if (max > 3)   return 0.01;  // cm → m
  return 1;                     // already m
}

export function computeRealScale(
  scene: THREE.Object3D,
  dimensions: Dimensions
): number {
  if (!scene) return 1;

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);

  const currentHeight = size.y;
  if (!currentHeight || currentHeight <= 0) return 1;

  const unitScale = detectUnitScale(size);
  const currentHeightMeters = currentHeight * unitScale;

  const heightCm = dimensions?.height_cm;
  const targetHeightM = (heightCm != null && heightCm > 0)
    ? heightCm / 100
    : currentHeightMeters;

  const finalScale = (targetHeightM / currentHeightMeters) * unitScale;
  return Math.max(0.001, Math.min(finalScale, 100));
}

/**
 * Returns the correction scale string for model-viewer's scale attribute.
 * model-viewer treats 1 GLTF unit = 1 meter, so if the model is in cm
 * we need to multiply by 0.01, etc.
 * Returns a "x y z" string e.g. "0.01 0.01 0.01"
 */
export function computeARScale(
  scene: THREE.Object3D,
  dimensions: Dimensions
): string {
  if (!scene) return "1 1 1";

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);

  const currentHeight = size.y;
  if (!currentHeight || currentHeight <= 0) return "1 1 1";

  const unitScale = detectUnitScale(size);
  const currentHeightMeters = currentHeight * unitScale;

  const heightCm = dimensions?.height_cm;
  const targetHeightM = (heightCm != null && heightCm > 0)
    ? heightCm / 100
    : currentHeightMeters;

  const s = (targetHeightM / currentHeightMeters) * unitScale;
  const clamped = Math.max(0.001, Math.min(s, 100));
  return `${clamped} ${clamped} ${clamped}`;
}