/* =========================================================
   MODEL VALIDATOR SERVICE
========================================================= */

import * as THREE from "three";

import {
  type ValidationFinding,
  type ValidationReport,
  type ModelDimensions,
  type ValidationFindingCode,
  type ValidationSeverity,
  deriveARReadiness,
  deriveARSafetyStatus,
  getDimensionRecommendation,
} from "@/types/modelValidation";

/* =========================================================
   CONSTANTS
========================================================= */

const FLOOR_WARN_THRESHOLD_CM = 2;
const FLOOR_SINK_THRESHOLD_CM = -1;
const FLOOR_INFO_THRESHOLD_CM = 0.5;
const PIVOT_WARN_THRESHOLD_CM = 5;
const PIVOT_INFO_THRESHOLD_CM = 1;
const SCALE_ERROR_RATIO       = 1.5;
const SCALE_WARN_RATIO        = 1.1;
const M_TO_CM                 = 100;
const FURNITURE_MIN_LONGEST_SIDE_CM = 20;
const FURNITURE_MAX_LONGEST_SIDE_CM = 500;

/* =========================================================
   VALIDATOR OPTIONS
========================================================= */

export interface ValidateModelOptions extends ModelDimensions {
  /**
   * The autoFixLog produced by sanitizeModel.
   * Passed in so the ValidationReport carries the full fix history.
   */
  autoFixLog: string[];
  /**
   * When true the validator treats scale-mismatch findings as already
   * auto-fixed because sanitizeModel will correct the scale.
   */
  scaleWasNormalized?: boolean;
  /**
   * Furniture category used to:
   *   1. Look up dimension recommendations (DimensionRecommendation).
   *   2. Evaluate category dimension recommendations.
   *
   * Accepts underscore_case ("dining_table") or space-separated
   * ("dining table") — both are normalised internally.
   *
   * When omitted, dimension recommendations are skipped but all geometry
   * checks still run normally.
   */
  category?: string;
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
    let visible = true;
    for (let ancestor: THREE.Object3D | null = node; ancestor; ancestor = ancestor.parent) {
      if (!ancestor.visible) {
        visible = false;
        break;
      }
    }
    if (node instanceof THREE.Mesh && visible && node.geometry) {
      node.updateWorldMatrix(true, false);
      box.union(new THREE.Box3().setFromObject(node, true));
    }
  });
  return box;
}

function computeLooseBBox(scene: THREE.Group): THREE.Box3 {
  const box = new THREE.Box3();
  scene.traverse((node) => {
    if (node instanceof THREE.Mesh && node.geometry) {
      node.updateWorldMatrix(true, false);
      box.union(new THREE.Box3().setFromObject(node, true));
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
    if (node instanceof THREE.Light) {
      lightCount++;
      return;
    }

    if (node instanceof THREE.Camera) {
      cameraCount++;
      return;
    }

    if (node instanceof THREE.Mesh) {
      let visible = true;
      for (let ancestor: THREE.Object3D | null = node; ancestor; ancestor = ancestor.parent) {
        if (!ancestor.visible) {
          visible = false;
          break;
        }
      }
      if (visible) {
        visibleMeshCount++;
      } else {
        hiddenMeshCount++;
      }
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

/**
 * Normalises a category string to the underscore_case keys used in
 * category dimension ranges (e.g. "Dining Table" → "dining_table").
 */
function normaliseCategory(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, "_");
}

/* =========================================================
   MAIN EXPORT
========================================================= */

/**
 * Validates the ORIGINAL (pre-sanitize) scene against the target dimensions
 * that the pipeline will scale it to.
 *
 * Changes vs original:
 *  - Accepts an optional `category` to drive dimension recommendations.
 *  - Returns `arSafetyStatus` ("SAFE_FOR_AR" | "NOT_OPTIMAL_FOR_AR")
 *    alongside the existing `arReadiness` field.
 *  - Scale-mismatch findings are marked autoFixed=true when
 *    scaleWasNormalized is true (default).
 *  - Findings describe the original downloaded file, before sanitization.
 *
 */
export function validateModel(
  scene: THREE.Group,
  options: ValidateModelOptions
): ValidationReport {
  const {
    widthCm,
    depthCm,
    heightCm,
    autoFixLog,
    scaleWasNormalized = true,
    category,
  } = options;

  const dimensions: ModelDimensions = { widthCm, depthCm, heightCm };
  const normalisedCategory = category ? normaliseCategory(category) : undefined;

  const tightBox = computeTightBBox(scene);
  const looseBox = computeLooseBBox(scene);
  const detectedDimensions = boxToDimensions(tightBox);
  const graph = inspectSceneGraph(scene);

  const tightCenter = new THREE.Vector3();
  tightBox.getCenter(tightCenter);

  const minY_cm          = tightBox.min.y * M_TO_CM;
  const pivotOffsetXZ_cm = Math.sqrt(tightCenter.x ** 2 + tightCenter.z ** 2) * M_TO_CM;

  const tightSize = new THREE.Vector3();
  const looseSize = new THREE.Vector3();
  tightBox.getSize(tightSize);
  looseBox.getSize(looseSize);

  const bboxInflationRatio = Math.max(
    looseSize.x / Math.max(tightSize.x, 0.001),
    looseSize.y / Math.max(tightSize.y, 0.001),
    looseSize.z / Math.max(tightSize.z, 0.001)
  );

  // Compare against ORIGINAL (pre-sanitize) dimensions so the report
  // accurately reflects what the raw file looked like.
  const scaleMismatchRatio = maxDimensionRatio(detectedDimensions, dimensions);

  const findings: ValidationFinding[] = [];

  // ── No geometry — bail early ───────────────────────────────────────────────
  if (graph.visibleMeshCount === 0) {
    findings.push(
      finding(
        "NO_VISIBLE_GEOMETRY",
        "error",
        "No visible meshes found in the model. The file may be empty or all geometry is hidden."
      )
    );
    const arReadiness = deriveARReadiness(findings);
    return {
      findings,
      arReadiness,
      arSafetyStatus: deriveARSafetyStatus(arReadiness),
      originalDimensions: dimensions,
      detectedDimensions,
      fixedDimensions: detectedDimensions,
      autoFixLog,
      wasReExported: false,
    };
  }

  // ── Z-up orientation — cannot be auto-fixed ────────────────────────────────
  if (graph.hasZUpOrientation) {
    findings.push(
      finding(
        "WRONG_AXIS_ORIENTATION",
        "error",
        "Model appears to use Z-up orientation. GLTF requires Y-up. This will cause the model to appear on its side in AR."
      )
    );
  }

  // ── Scale mismatch ─────────────────────────────────────────────────────────
  if (scaleMismatchRatio >= SCALE_ERROR_RATIO) {
    const likelyUnits = [10, 25.4, 100, 1000].some(
      (ratio) => Math.abs(scaleMismatchRatio - ratio) / ratio <= 0.05
    );
    findings.push(
      finding(
        "SCALE_MISMATCH_LARGE",
        "error",
        `The file's size differed from the target dimensions by ${((scaleMismatchRatio - 1) * 100).toFixed(0)}% and was rescaled.` +
          (likelyUnits ? " The ratio is consistent with a likely unit mismatch." : ""),
        scaleWasNormalized
      )
    );
  } else if (scaleMismatchRatio >= SCALE_WARN_RATIO) {
    findings.push(
      finding(
        "SCALE_MISMATCH_MINOR",
        "warning",
        `Model dimensions were ${((scaleMismatchRatio - 1) * 100).toFixed(0)}% off from entered dimensions. Auto-fixed.`,
        scaleWasNormalized
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

  // ── Floor alignment ────────────────────────────────────────────────────────
  if (minY_cm > FLOOR_WARN_THRESHOLD_CM) {
    findings.push(
      finding(
        "FLOATING_ABOVE_FLOOR",
        "warning",
        `Model was floating ${minY_cm.toFixed(1)}cm above the floor. Auto-fixed.`,
        true
      )
    );
  } else if (minY_cm < FLOOR_SINK_THRESHOLD_CM) {
    findings.push(
      finding(
        "SINKING_INTO_FLOOR",
        "warning",
        `Model was sinking ${Math.abs(minY_cm).toFixed(1)}cm below the floor. Auto-fixed.`,
        true
      )
    );
  } else if (Math.abs(minY_cm) > FLOOR_INFO_THRESHOLD_CM) {
    findings.push(
      finding(
        "MINOR_FLOOR_OFFSET",
        "info",
        `Minor floor offset of ${minY_cm.toFixed(1)}cm detected. Auto-fixed.`,
        true
      )
    );
  }

  // ── Pivot offset ───────────────────────────────────────────────────────────
  if (pivotOffsetXZ_cm > PIVOT_WARN_THRESHOLD_CM) {
    findings.push(
      finding(
        "PIVOT_OFFSET_XZ",
        "warning",
        `Model pivot was ${pivotOffsetXZ_cm.toFixed(1)}cm off-center on XZ plane. AR placement would be incorrect. Auto-fixed.`,
        true
      )
    );
  } else if (pivotOffsetXZ_cm > PIVOT_INFO_THRESHOLD_CM) {
    findings.push(
      finding(
        "MINOR_PIVOT_OFFSET",
        "info",
        `Minor pivot offset of ${pivotOffsetXZ_cm.toFixed(1)}cm. Auto-fixed.`,
        true
      )
    );
  }

  // ── Lights ─────────────────────────────────────────────────────────────────
  if (graph.lightCount > 0) {
    findings.push(
      finding(
        "LIGHTS_PRESENT",
        "warning",
        `${graph.lightCount} light${graph.lightCount > 1 ? "s" : ""} found. Lights fight with AR environment lighting. Auto-removed.`,
        true
      )
    );
  }

  // ── Cameras ────────────────────────────────────────────────────────────────
  if (graph.cameraCount > 0) {
    findings.push(
      finding(
        "CAMERAS_PRESENT",
        "warning",
        `${graph.cameraCount} camera${graph.cameraCount > 1 ? "s" : ""} found. Cameras are not needed for AR. Auto-removed.`,
        true
      )
    );
  }

  // ── Empty nodes ────────────────────────────────────────────────────────────
  if (graph.emptyNodeCount > 0) {
    findings.push(
      finding(
        "EMPTY_NODES_PRESENT",
        "warning",
        `${graph.emptyNodeCount} empty node${graph.emptyNodeCount > 1 ? "s" : ""} found. Auto-removed.`,
        true
      )
    );
  }

  // ── Hidden meshes — NOT auto-fixed, needs manual review ───────────────────
  if (graph.hiddenMeshCount > 0) {
    findings.push(
      finding(
        "HIDDEN_MESHES_PRESENT",
        "warning",
        `${graph.hiddenMeshCount} hidden mesh${graph.hiddenMeshCount > 1 ? "es" : ""} found in the original file and removed. Review the source if they were intentional.`,
        true
      )
    );
  }

  // ── Bounding box inflation — NOT auto-fixed ───────────────────────────────
  if (bboxInflationRatio > 1.2) {
    findings.push(
      finding(
        "BOUNDING_BOX_INFLATED",
        "warning",
        `Bounding box is ${((bboxInflationRatio - 1) * 100).toFixed(0)}% larger than visible geometry. ` +
          `Hidden geometry may cause incorrect AR placement. Review manually.`
      )
    );
  }

  // ── Category-driven enrichment ────────────────────────────────────────────
  // Recommendations use the dimensions that the pipeline intends to produce.
  const dimensionRecommendation = normalisedCategory
    ? getDimensionRecommendation(normalisedCategory, dimensions)
    : undefined;

  const longestSideCm = Math.max(dimensions.widthCm, dimensions.depthCm, dimensions.heightCm);
  const unusualSizeReasons: string[] = [];
  if (longestSideCm < FURNITURE_MIN_LONGEST_SIDE_CM) {
    unusualSizeReasons.push(`the longest side is only ${longestSideCm.toFixed(1)} cm`);
  } else if (longestSideCm > FURNITURE_MAX_LONGEST_SIDE_CM) {
    unusualSizeReasons.push(`the longest side is ${longestSideCm.toFixed(1)} cm`);
  }
  if (dimensionRecommendation && !dimensionRecommendation.withinRange) {
    unusualSizeReasons.push(`the dimensions are outside the typical ${dimensionRecommendation.category} range`);
  }
  if (unusualSizeReasons.length > 0) {
    findings.push(
      finding(
        "MODEL_SIZE_UNUSUAL",
        "warning",
        `GLB coordinates are treated as meters. The measured size looks unusual for furniture because ${unusualSizeReasons.join(" and ")}. Verify the source model's scale and correct the dimensions before saving.`
      )
    );
  }

  // ── Derive readiness & safety status ──────────────────────────────────────
  const arReadiness    = deriveARReadiness(findings);
  const arSafetyStatus = deriveARSafetyStatus(arReadiness);

  return {
    findings,
    arReadiness,
    arSafetyStatus,
    originalDimensions: dimensions,
    detectedDimensions,
    fixedDimensions: detectedDimensions,
    autoFixLog,
    wasReExported: false,
    dimensionRecommendation,
  };
}