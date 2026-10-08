import * as THREE from "three";

export interface SanitizeResult {
  scene: THREE.Group;
  autoFixLog: string[];
}

export interface SanitizeDimensions {
  widthCm: number;
  depthCm: number;
  heightCm: number;
}

function removeLightsCamerasHiddenAndEmpty(scene: THREE.Object3D): void {
  const removable: THREE.Object3D[] = [];
  scene.traverse((node) => {
    if (node instanceof THREE.Light || node instanceof THREE.Camera || node.visible === false) {
      removable.push(node);
    }
  });
  removable.forEach((node) => node.parent?.remove(node));

  function pruneEmpty(node: THREE.Object3D): void {
    for (const child of [...node.children]) {
      pruneEmpty(child);
      if (child.parent !== node) continue;

      const hasGeometry =
        child instanceof THREE.Mesh ||
        child instanceof THREE.Line ||
        child instanceof THREE.Points ||
        child instanceof THREE.SkinnedMesh ||
        child instanceof THREE.Bone;
      if (!hasGeometry && child.children.length === 0) node.remove(child);
    }
  }

  pruneEmpty(scene);
  scene.updateMatrixWorld(true);
}

/**
 * Measures the precise visible geometry that the sanitizer will retain.
 * The supplied scene is never mutated.
 */
export function measureCleanSize(scene: THREE.Object3D): THREE.Vector3 {
  const clone = scene.clone(true);
  removeLightsCamerasHiddenAndEmpty(clone);

  const box = new THREE.Box3().setFromObject(clone, true);
  return box.getSize(new THREE.Vector3());
}

/**
 * Sanitizes a loaded THREE.Group scene for AR use.
 *
 * Applies fixes in order:
 *  1. Strip lights
 *  2. Strip cameras
 *  3. Prune empty nodes
 *  4. Strip hidden nodes
 *  5. Compute a precise bounding box
 *  6. Scale each axis to the provided real-world dimensions
 *  7. Recompute bounds, center pivot on XZ, and floor-align Y
 *
 * Returns the mutated scene and an autoFixLog describing every change made.
 *
 * IMPORTANT: This function mutates the scene in-place.
 * Always pass a cloned scene: originalScene.clone(true)
 */
export function sanitizeModel(
  scene: THREE.Group,
  dimensions: SanitizeDimensions
): SanitizeResult {
  const autoFixLog: string[] = [];

  // ─── 1. Strip Lights ────────────────────────────────────────────────────────
  const lights: THREE.Object3D[] = [];
  scene.traverse((node) => {
    if (node instanceof THREE.Light) lights.push(node);
  });
  lights.forEach((light) => {
    const typeName = light.type;
    light.parent?.remove(light);
    autoFixLog.push(`Removed ${typeName} ("${light.name || light.uuid.slice(0, 8)}")`);
  });
  if (lights.length === 0) {
    autoFixLog.push("No lights found — nothing stripped");
  }

  // ─── 2. Strip Cameras ───────────────────────────────────────────────────────
  const cameras: THREE.Object3D[] = [];
  scene.traverse((node) => {
    if (node instanceof THREE.Camera) cameras.push(node);
  });
  cameras.forEach((cam) => {
    const typeName = cam.type;
    cam.parent?.remove(cam);
    autoFixLog.push(`Removed ${typeName} ("${cam.name || cam.uuid.slice(0, 8)}")`);
  });
  if (cameras.length === 0) {
    autoFixLog.push("No cameras found — nothing stripped");
  }

  // ─── 3. Prune Empty Nodes ───────────────────────────────────────────────────
  let prunedCount = 0;

  function pruneEmpty(node: THREE.Object3D): boolean {
    const childrenToRemove: THREE.Object3D[] = [];
    node.children.forEach((child) => {
      if (pruneEmpty(child)) childrenToRemove.push(child);
    });
    childrenToRemove.forEach((child) => node.remove(child));

    const hasMesh =
      node instanceof THREE.Mesh ||
      node instanceof THREE.Line ||
      node instanceof THREE.Points ||
      node instanceof THREE.SkinnedMesh ||
      node instanceof THREE.Bone;
    const hasChildren = node.children.length > 0;

    if (!hasMesh && !hasChildren && node !== scene) {
      autoFixLog.push(`Pruned empty node ("${node.name || node.uuid.slice(0, 8)}")`);
      prunedCount++;
      return true;
    }
    return false;
  }

  pruneEmpty(scene);
  if (prunedCount === 0) {
    autoFixLog.push("No empty nodes found — nothing pruned");
  }

  // ─── 4. Strip Hidden Nodes ──────────────────────────────────────────────────
  const hiddenNodes: THREE.Object3D[] = [];
  scene.traverse((node) => {
    if (node.visible === false) hiddenNodes.push(node);
  });
  hiddenNodes.forEach((node) => {
    node.parent?.remove(node);
    autoFixLog.push(`Removed hidden ${node.type} ("${node.name || node.uuid.slice(0, 8)}")`);
  });

  // ─── 5. Compute Bounding Box ────────────────────────────────────────────────
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene, true);
  const modelSize = new THREE.Vector3();
  box.getSize(modelSize);

  autoFixLog.push(
    `Bounding box computed — ` +
      `W: ${modelSize.x.toFixed(4)} m, ` +
      `H: ${modelSize.y.toFixed(4)} m, ` +
      `D: ${modelSize.z.toFixed(4)} m`
  );

  // ─── 6. Scale Normalize ─────────────────────────────────────────────────────
  const { widthCm, depthCm, heightCm } = dimensions;

  const targetWidth  = widthCm  / 100;
  const targetDepth  = depthCm  / 100;
  const targetHeight = heightCm / 100;

  const candidates = [
    { axis: "X (width)",  modelDim: modelSize.x, targetDim: targetWidth  },
    { axis: "Y (height)", modelDim: modelSize.y, targetDim: targetHeight },
    { axis: "Z (depth)",  modelDim: modelSize.z, targetDim: targetDepth  },
  ];

  const validCandidates = candidates.filter(
    (c) => c.modelDim > 0.00001 && c.targetDim > 0
  );

  if (validCandidates.length === 0) {
    autoFixLog.push("WARNING: Model has zero or near-zero bounding box — scale skipped");
  } else {
    const scaleFactors = new THREE.Vector3(
      modelSize.x > 0.00001 && targetWidth > 0 ? targetWidth / modelSize.x : 1,
      modelSize.y > 0.00001 && targetHeight > 0 ? targetHeight / modelSize.y : 1,
      modelSize.z > 0.00001 && targetDepth > 0 ? targetDepth / modelSize.z : 1
    );

    scene.scale.multiply(scaleFactors);
    scene.updateMatrixWorld(true);

    autoFixLog.push(
      `Scale normalized independently — X: ${scaleFactors.x.toFixed(6)}, ` +
        `Y: ${scaleFactors.y.toFixed(6)}, Z: ${scaleFactors.z.toFixed(6)}`
    );
  }

  // ─── 7. Recompute Bounding Box After Scale ──────────────────────────────────
  scene.updateMatrixWorld(true);
  box.setFromObject(scene, true);
  box.getSize(modelSize);

  autoFixLog.push(
    `Bounding box after scale — ` +
      `W: ${(modelSize.x * 100).toFixed(2)} cm, ` +
      `H: ${(modelSize.y * 100).toFixed(2)} cm, ` +
      `D: ${(modelSize.z * 100).toFixed(2)} cm`
  );

  // ─── 8. Center Pivot on XZ ──────────────────────────────────────────────────
  const center = new THREE.Vector3();
  box.getCenter(center);

  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.updateMatrixWorld(true);

  autoFixLog.push(
    `Pivot centered on XZ — offset applied: X ${(-center.x).toFixed(4)} m, Z ${(-center.z).toFixed(4)} m`
  );

  // ─── 9. Floor Align Y ───────────────────────────────────────────────────────
  box.setFromObject(scene, true);
  const yFloorOffset = -box.min.y;
  scene.position.y += yFloorOffset;
  scene.updateMatrixWorld(true);

  autoFixLog.push(
    `Floor aligned — Y offset applied: ${yFloorOffset.toFixed(4)} m (min Y now at 0)`
  );

  return { scene, autoFixLog };
}