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

/**
 * Sanitizes a loaded THREE.Group scene for AR use.
 *
 * Applies fixes in order:
 *  1. Strip lights
 *  2. Strip cameras
 *  3. Prune empty nodes
 *  4. Compute bounding box
 *  5. Scale normalize (largest axis → provided real-world dimensions)
 *  6. Recompute bounding box after scale
 *  7. Center pivot on XZ
 *  8. Floor-align Y
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
      node instanceof THREE.SkinnedMesh;
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

  // ─── 4. Compute Bounding Box ────────────────────────────────────────────────
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const modelSize = new THREE.Vector3();
  box.getSize(modelSize);

  autoFixLog.push(
    `Bounding box computed — ` +
      `W: ${modelSize.x.toFixed(4)} m, ` +
      `H: ${modelSize.y.toFixed(4)} m, ` +
      `D: ${modelSize.z.toFixed(4)} m`
  );

  // ─── 5. Scale Normalize ─────────────────────────────────────────────────────
  const { widthCm, depthCm, heightCm } = dimensions;

  const targetWidth  = widthCm  / 100;
  const targetDepth  = depthCm  / 100;
  const targetHeight = heightCm / 100;

  const candidates = [
    { axis: "X (width)",  modelDim: modelSize.x, targetDim: targetWidth  },
    { axis: "Y (height)", modelDim: modelSize.y, targetDim: targetHeight },
    { axis: "Z (depth)",  modelDim: modelSize.z, targetDim: targetDepth  },
  ];

  const validCandidates = candidates.filter((c) => c.modelDim > 0.00001);

  if (validCandidates.length === 0) {
    autoFixLog.push("WARNING: Model has zero or near-zero bounding box — scale skipped");
  } else {
    const dominant = validCandidates.reduce((prev, curr) =>
      curr.modelDim / curr.targetDim > prev.modelDim / prev.targetDim ? curr : prev
    );

    const scaleFactor = dominant.targetDim / dominant.modelDim;

    scene.scale.multiplyScalar(scaleFactor);
    scene.updateMatrixWorld(true);

    autoFixLog.push(
      `Scale normalized — dominant axis: ${dominant.axis}, ` +
        `scale factor: ${scaleFactor.toFixed(6)} ` +
        `(model ${(dominant.modelDim * 100).toFixed(2)} cm → target ${(dominant.targetDim * 100).toFixed(2)} cm)`
    );
  }

  // ─── 6. Recompute Bounding Box After Scale ──────────────────────────────────
  scene.updateMatrixWorld(true);
  box.setFromObject(scene);
  box.getSize(modelSize);

  autoFixLog.push(
    `Bounding box after scale — ` +
      `W: ${(modelSize.x * 100).toFixed(2)} cm, ` +
      `H: ${(modelSize.y * 100).toFixed(2)} cm, ` +
      `D: ${(modelSize.z * 100).toFixed(2)} cm`
  );

  // ─── 7. Center Pivot on XZ ──────────────────────────────────────────────────
  const center = new THREE.Vector3();
  box.getCenter(center);

  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.updateMatrixWorld(true);

  autoFixLog.push(
    `Pivot centered on XZ — offset applied: X ${(-center.x).toFixed(4)} m, Z ${(-center.z).toFixed(4)} m`
  );

  // ─── 8. Floor Align Y ───────────────────────────────────────────────────────
  box.setFromObject(scene);
  const yFloorOffset = -box.min.y;
  scene.position.y += yFloorOffset;
  scene.updateMatrixWorld(true);

  autoFixLog.push(
    `Floor aligned — Y offset applied: ${yFloorOffset.toFixed(4)} m (min Y now at 0)`
  );

  return { scene, autoFixLog };
}