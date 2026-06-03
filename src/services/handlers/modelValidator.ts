/* =========================================================
   MODEL VALIDATOR SERVICE

   Accepts a pre-loaded, sanitized THREE.Group (from the
   controller pipeline) and returns a ValidationReport.

   This is a READ-ONLY analysis pass — nothing is mutated.
   The sanitizer (modelSanitizer.ts) handles all mutations.

   Usage (in pipeline):
     const report = validateModel(cleanedScene, {
       widthCm, depthCm, heightCm, autoFixLog
     });
========================================================= */

import * as THREE from "three";

import {
  type ValidationFinding,
  type ValidationReport,
  type ModelDimensions,
  type ValidationFindingCode,
  type ValidationSeverity,
  deriveARReadiness,
} from "@/types/modelValidation";

/* =========================================================
   CONSTANTS
========================================================= */

const FLOOR_WARN_THRESHOLD_CM  = 2;
const FLOOR_SINK_THRESHOLD_CM  = -1;
const FLOOR_INFO_THRESHOLD_CM  = 0.5;
const PIVOT_WARN_THRESHOLD_CM  = 5;
const PIVOT_INFO_THRESHOLD_CM  = 1;
const SCALE_ERROR_RATIO        = 1.5;
const SCALE_WARN_RATIO         = 1.1;
const M_TO_CM                  = 100;

/* =========================================================
   VALIDATOR OPTIONS
========================================================= */

export interface ValidateModelOptions extends ModelDimensions {
  /** Log of mutations already applied by the sanitizer */
  autoFixLog: string[];
}

/* =========================================================
   INTERNAL HELPERS
========================================================= */

function finding(
  code: ValidationFindingCode,
  severity: ValidationSeverity,
  message: string,
  autoFixed = false
): ValidationFinding {
  return { code, severity, message, autoFixed };
}

function computeTightBBox(scene: THREE.Group): THREE.Box3 {
  const box = new THREE.Box3();

  scene.traverse((node) => {
    if (node instanceof THREE.Mesh && node.visible && node.geometry) {
      node.updateWorldMatrix(true, false);
      box.union(new THREE.Box3().setFromObject(node));
    }
  });

  return box;
}

function computeLooseBBox(scene: THREE.Group): THREE.Box3 {
  const box = new THREE.Box3();

  scene.traverse((node) => {
    if (node instanceof THREE.Mesh && node.geometry) {
      node.updateWorldMatrix(true, false);
      box.union(new THREE.Box3().setFromObject(node));
    }
  });

  return box;
}

function boxToDimensions(box: THREE.Box3): ModelDimensions {
  const size = new THREE.Vector3();
  box.getSize(size);
  return {
    widthCm:  Math.round(size.x * M_TO_CM * 10) / 10,
    depthCm:  Math.round(size.z * M_TO_CM * 10) / 10,
    heightCm: Math.round(size.y * M_TO_CM * 10) / 10,
  };
}

function maxDimensionRatio(
  detected: ModelDimensions,
  original: ModelDimensions
): number {
  const axes: Array<keyof ModelDimensions> = ["widthCm", "depthCm", "heightCm"];
  let max = 0;

  for (const axis of axes) {
    const d = detected[axis];
    const o = original[axis];
    if (o > 0 && d > 0) {
      max = Math.max(max, Math.max(d / o, o / d));
    }
  }

  return max;
}

interface SceneGraphReport {
  lightCount: number;
  cameraCount: number;
  emptyNodeCount: number;
  hiddenMeshCount: number;
  visibleMeshCount: number;
  hasZUpOrientation: boolean;
}

function inspectSceneGraph(scene: THREE.Group): SceneGraphReport {
  let lightCount       = 0;
  let cameraCount      = 0;
  let emptyNodeCount   = 0;
  let hiddenMeshCount  = 0;
  let visibleMeshCount = 0;

  const rootEuler = scene.rotation;
  const hasZUpOrientation = Math.abs(rootEuler.x - (-Math.PI / 2)) < 0.01;

  scene.traverse((node) => {
    if (node instanceof THREE.Light)  { lightCount++;  return; }
    if (node instanceof THREE.Camera) { cameraCount++; return; }

    if (node instanceof THREE.Mesh) {
      node.visible ? visibleMeshCount++ : hiddenMeshCount++;
      return;
    }

    if (node !== scene) {
      let hasMeshDescendant = false;
      node.traverse((child) => {
        if (child instanceof THREE.Mesh) hasMeshDescendant = true;
      });
      if (!hasMeshDescendant) emptyNodeCount++;
    }
  });

  return {
    lightCount,
    cameraCount,
    emptyNodeCount,
    hiddenMeshCount,
    visibleMeshCount,
    hasZUpOrientation,
  };
}

/* =========================================================
   MAIN EXPORT
   Accepts a pre-loaded THREE.Group — does NOT load any file.
========================================================= */

export function validateModel(
  scene: THREE.Group,
  options: ValidateModelOptions
): ValidationReport {
  const { widthCm, depthCm, heightCm, autoFixLog } = options;
  const dimensions: ModelDimensions = { widthCm, depthCm, heightCm };

  /* ── Bounding boxes ── */
  const tightBox = computeTightBBox(scene);
  const looseBox = computeLooseBBox(scene);

  const detectedDimensions = boxToDimensions(tightBox);

  /* ── Scene graph ── */
  const graph = inspectSceneGraph(scene);

  /* ── Derived values ── */
  const tightCenter = new THREE.Vector3();
  tightBox.getCenter(tightCenter);

  const minY_cm           = tightBox.min.y * M_TO_CM;
  const pivotOffsetXZ_cm  = Math.sqrt(
    tightCenter.x ** 2 + tightCenter.z ** 2
  ) * M_TO_CM;

  const tightSize = new THREE.Vector3();
  const looseSize = new THREE.Vector3();
  tightBox.getSize(tightSize);
  looseBox.getSize(looseSize);

  const bboxInflationRatio = Math.max(
    looseSize.x / Math.max(tightSize.x, 0.001),
    looseSize.y / Math.max(tightSize.y, 0.001),
    looseSize.z / Math.max(tightSize.z, 0.001)
  );

  const scaleMismatchRatio = maxDimensionRatio(detectedDimensions, dimensions);

  /* ── Build findings ── */
  const findings: ValidationFinding[] = [];

  // No visible geometry — hard error, skip spatial checks
  if (graph.visibleMeshCount === 0) {
    findings.push(
      finding(
        "NO_VISIBLE_GEOMETRY",
        "error",
        "No visible meshes found in the model. The file may be empty or all geometry is hidden."
      )
    );
    return {
      findings,
      arReadiness: "not_ready",
      originalDimensions: dimensions,
      detectedDimensions,
      fixedDimensions: detectedDimensions,
      autoFixLog,
      wasReExported: false,
    };
  }

  // Z-up orientation
  if (graph.hasZUpOrientation) {
    findings.push(
      finding(
        "WRONG_AXIS_ORIENTATION",
        "error",
        "Model appears to use Z-up orientation. GLTF requires Y-up. This will cause the model to appear on its side in AR."
      )
    );
  }

  // Scale mismatch
  if (scaleMismatchRatio >= SCALE_ERROR_RATIO) {
    findings.push(
      finding(
        "SCALE_MISMATCH_LARGE",
        "error",
        `Model dimensions (W:${detectedDimensions.widthCm}cm D:${detectedDimensions.depthCm}cm H:${detectedDimensions.heightCm}cm) differ from entered dimensions (W:${dimensions.widthCm}cm D:${dimensions.depthCm}cm H:${dimensions.heightCm}cm) by ${((scaleMismatchRatio - 1) * 100).toFixed(0)}%. Likely a unit system mismatch. Will be auto-fixed.`
      )
    );
  } else if (scaleMismatchRatio >= SCALE_WARN_RATIO) {
    findings.push(
      finding(
        "SCALE_MISMATCH_MINOR",
        "warning",
        `Model dimensions are ${((scaleMismatchRatio - 1) * 100).toFixed(0)}% off from entered dimensions. Will be auto-fixed.`
      )
    );
  } else {
    findings.push(
      finding(
        "SCALE_WITHIN_TOLERANCE",
        "info",
        `Model scale matches entered dimensions within tolerance (${((scaleMismatchRatio - 1) * 100).toFixed(1)}% off).`,
        true
      )
    );
  }

  // Floor alignment
  if (minY_cm > FLOOR_WARN_THRESHOLD_CM) {
    findings.push(
      finding(
        "FLOATING_ABOVE_FLOOR",
        "warning",
        `Model is floating ${minY_cm.toFixed(1)}cm above the floor. Will be auto-fixed.`
      )
    );
  } else if (minY_cm < FLOOR_SINK_THRESHOLD_CM) {
    findings.push(
      finding(
        "SINKING_INTO_FLOOR",
        "warning",
        `Model is sinking ${Math.abs(minY_cm).toFixed(1)}cm below the floor. Will be auto-fixed.`
      )
    );
  } else if (Math.abs(minY_cm) > FLOOR_INFO_THRESHOLD_CM) {
    findings.push(
      finding(
        "MINOR_FLOOR_OFFSET",
        "info",
        `Minor floor offset of ${minY_cm.toFixed(1)}cm detected. Will be auto-fixed.`
      )
    );
  }

  // Pivot / XZ center
  if (pivotOffsetXZ_cm > PIVOT_WARN_THRESHOLD_CM) {
    findings.push(
      finding(
        "PIVOT_OFFSET_XZ",
        "warning",
        `Model pivot is ${pivotOffsetXZ_cm.toFixed(1)}cm off-center on XZ plane. AR placement will be incorrect. Will be auto-fixed.`
      )
    );
  } else if (pivotOffsetXZ_cm > PIVOT_INFO_THRESHOLD_CM) {
    findings.push(
      finding(
        "MINOR_PIVOT_OFFSET",
        "info",
        `Minor pivot offset of ${pivotOffsetXZ_cm.toFixed(1)}cm. Will be auto-fixed.`
      )
    );
  }

  // Lights
  if (graph.lightCount > 0) {
    findings.push(
      finding(
        "LIGHTS_PRESENT",
        "warning",
        `${graph.lightCount} light${graph.lightCount > 1 ? "s" : ""} found. Lights fight with AR environment lighting. Will be auto-removed.`
      )
    );
  }

  // Cameras
  if (graph.cameraCount > 0) {
    findings.push(
      finding(
        "CAMERAS_PRESENT",
        "warning",
        `${graph.cameraCount} camera${graph.cameraCount > 1 ? "s" : ""} found. Cameras are not needed for AR. Will be auto-removed.`
      )
    );
  }

  // Empty nodes
  if (graph.emptyNodeCount > 0) {
    findings.push(
      finding(
        "EMPTY_NODES_PRESENT",
        "warning",
        `${graph.emptyNodeCount} empty node${graph.emptyNodeCount > 1 ? "s" : ""} found. These add scene graph noise. Will be auto-removed.`
      )
    );
  }

  // Hidden meshes
  if (graph.hiddenMeshCount > 0) {
    findings.push(
      finding(
        "HIDDEN_MESHES_PRESENT",
        "warning",
        `${graph.hiddenMeshCount} hidden mesh${graph.hiddenMeshCount > 1 ? "es" : ""} found. Review manually — they will not be auto-changed.`
      )
    );
  }

  // Inflated bounding box
  if (bboxInflationRatio > 1.2) {
    findings.push(
      finding(
        "BOUNDING_BOX_INFLATED",
        "warning",
        `Bounding box is ${((bboxInflationRatio - 1) * 100).toFixed(0)}% larger than visible geometry. Hidden geometry may cause incorrect AR placement.`
      )
    );
  }

  const arReadiness = deriveARReadiness(findings);

  return {
    findings,
    arReadiness,
    originalDimensions: dimensions,
    detectedDimensions,
    fixedDimensions: detectedDimensions, // sanitizer populates this
    autoFixLog,                           // passed in from sanitizer
    wasReExported: false,                 // exporter sets this
  };
}