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
    const typeName = light.type; // e.g. "DirectionalLight"
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
  /**
   * A node is considered "empty" if it has no children AND no geometry
   * (i.e. it is not a Mesh/Line/Points itself). We do a bottom-up pass
   * so parent nodes that become empty after child removal are also pruned.
   */
  let prunedCount = 0;

  function pruneEmpty(node: THREE.Object3D): boolean {
    // Recurse children first (bottom-up)
    const childrenToRemove: THREE.Object3D[] = [];
    node.children.forEach((child) => {
      if (pruneEmpty(child)) childrenToRemove.push(child);
    });
    childrenToRemove.forEach((child) => node.remove(child));

    // Determine if this node itself is empty
    const hasMesh =
      node instanceof THREE.Mesh ||
      node instanceof THREE.Line ||
      node instanceof THREE.Points ||
      node instanceof THREE.SkinnedMesh;
    const hasChildren = node.children.length > 0;

    if (!hasMesh && !hasChildren && node !== scene) {
      autoFixLog.push(`Pruned empty node ("${node.name || node.uuid.slice(0, 8)}")`);
      prunedCount++;
      return true; // signal parent to remove this node
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
  box.getSize(modelSize); // x=width, y=height, z=depth  (Three.js axes)

  autoFixLog.push(
    `Bounding box computed — ` +
      `W: ${modelSize.x.toFixed(4)} m, ` +
      `H: ${modelSize.y.toFixed(4)} m, ` +
      `D: ${modelSize.z.toFixed(4)} m`
  );

  // ─── 5. Scale Normalize ─────────────────────────────────────────────────────
  /**
   * Three.js GLB units are metres. Target dimensions are in centimetres.
   * We find the largest axis of the model, compare it to the corresponding
   * real-world dimension, and apply a uniform scale so the model fits exactly.
   */
  const { widthCm, depthCm, heightCm } = dimensions;

  // Map Three.js axes → provided dimensions (also in metres)
  const targetWidth  = widthCm  / 100;
  const targetDepth  = depthCm  / 100;
  const targetHeight = heightCm / 100;

  // Pick the axis pair (model size vs target size) that produces the
  // largest required scale — i.e. normalise by the dominant axis.
  const candidates = [
    { axis: "X (width)",  modelDim: modelSize.x, targetDim: targetWidth  },
    { axis: "Y (height)", modelDim: modelSize.y, targetDim: targetHeight },
    { axis: "Z (depth)",  modelDim: modelSize.z, targetDim: targetDepth  },
  ];

  // Guard against degenerate (zero-size) models
  const validCandidates = candidates.filter((c) => c.modelDim > 0.00001);

  if (validCandidates.length === 0) {
    autoFixLog.push("WARNING: Model has zero or near-zero bounding box — scale skipped");
  } else {
    // Find the axis whose ratio between model size and target size is largest
    // (i.e. the axis that "overflows" the most — we scale to fit that one).
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
  /**
   * Translate the scene so the bounding-box centre lies at X=0, Z=0.
   * Y is intentionally left alone here — floor-alignment handles it next.
   */
  const center = new THREE.Vector3();
  box.getCenter(center);

  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.updateMatrixWorld(true);

  autoFixLog.push(
    `Pivot centered on XZ — offset applied: X ${(-center.x).toFixed(4)} m, Z ${(-center.z).toFixed(4)} m`
  );

  // ─── 8. Floor Align Y ───────────────────────────────────────────────────────
  /**
   * Shift the scene vertically so its lowest point (box.min.y) sits at Y=0.
   * We recompute the box after the XZ shift to get the correct Y min.
   */
  box.setFromObject(scene);
  const yFloorOffset = -box.min.y;
  scene.position.y += yFloorOffset;
  scene.updateMatrixWorld(true);

  autoFixLog.push(
    `Floor aligned — Y offset applied: ${yFloorOffset.toFixed(4)} m (min Y now at 0)`
  );

  return { scene, autoFixLog };
}