import * as THREE from "three";

type Dimensions = {
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
};

/**
 * Converts GLTF model into real-world scale (meters)
 * AR rule: 1 unit = 1 meter
 *
 * Primary scaling axis: HEIGHT (standard for furniture AR)
 */
export function computeRealScale(
  scene: THREE.Object3D,
  dimensions: Dimensions
) {
  if (!scene) return 1;

  const box = new THREE.Box3().setFromObject(scene);

  const size = new THREE.Vector3();
  box.getSize(size);

  const currentHeight = size.y;

  // safety fallback (prevents NaN / broken models)
  if (!currentHeight || currentHeight <= 0) return 1;

  /**
   * Convert cm → meters
   * This is your real-world target size
   */
  const targetHeightM =
    (dimensions?.height_cm ?? 100) / 100;

  /**
   * Base scale (height alignment)
   */
  const baseScale = targetHeightM / currentHeight;

  return baseScale;
}