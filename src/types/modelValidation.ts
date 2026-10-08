/* =========================================================
   MODEL VALIDATION TYPES
========================================================= */

export type ValidationSeverity = "error" | "warning" | "info";

export type ARReadiness = "ready" | "needs_review" | "not_ready";

/** High-level AR safety badge shown in the admin UI */
export type ARSafetyStatus = "SAFE_FOR_AR" | "NOT_OPTIMAL_FOR_AR";

export type ValidationFindingCode =
  | "SCALE_MISMATCH_LARGE"
  | "WRONG_AXIS_ORIENTATION"
  | "NO_VISIBLE_GEOMETRY"
  | "FLOATING_ABOVE_FLOOR"
  | "SINKING_INTO_FLOOR"
  | "PIVOT_OFFSET_XZ"
  | "SCALE_MISMATCH_MINOR"
  | "LIGHTS_PRESENT"
  | "CAMERAS_PRESENT"
  | "EMPTY_NODES_PRESENT"
  | "HIDDEN_MESHES_PRESENT"
  | "BOUNDING_BOX_INFLATED"
  | "MINOR_FLOOR_OFFSET"
  | "MINOR_PIVOT_OFFSET"
  | "SCALE_WITHIN_TOLERANCE"
  | "MODEL_SIZE_UNUSUAL";

export interface ValidationFinding {
  code: ValidationFindingCode;
  severity: ValidationSeverity;
  message: string;
  autoFixed: boolean;
}

export interface ModelDimensions {
  widthCm: number;
  depthCm: number;
  heightCm: number;
}

/** Suggested real-world size ranges for a given furniture category */
export interface DimensionRecommendation {
  category: string;
  minWidthCm: number;
  maxWidthCm: number;
  minDepthCm: number;
  maxDepthCm: number;
  minHeightCm: number;
  maxHeightCm: number;
  /** Whether the entered dimensions fall within the recommended range */
  withinRange: boolean;
  /** Human-readable note, e.g. "Width is 40 cm above typical maximum" */
  notes: string[];
}

/* =========================================================
   VALIDATION REPORT
========================================================= */

export interface ValidationReport {
  findings: ValidationFinding[];
  arReadiness: ARReadiness;
  /** High-level badge text derived from arReadiness */
  arSafetyStatus: ARSafetyStatus;
  originalDimensions: ModelDimensions;
  detectedDimensions: ModelDimensions;
  fixedDimensions: ModelDimensions;
  autoFixLog: string[];
  wasReExported: boolean;
  /** Size in bytes of the cleaned/exported GLB — set by the pipeline after export */
  cleanedSizeBytes?: number;
  /** Optional dimension recommendations based on product category */
  dimensionRecommendation?: DimensionRecommendation;
}

/* =========================================================
   PURE HELPERS
========================================================= */

export function deriveARReadiness(findings: ValidationFinding[]): ARReadiness {
  const unfixed = findings.filter((f) => !f.autoFixed);
  if (unfixed.some((f) => f.severity === "error")) return "not_ready";
  if (unfixed.some((f) => f.severity === "warning")) return "needs_review";
  return "ready";
}

/** Maps ARReadiness → the two-value badge text used by the admin UI. */
export function deriveARSafetyStatus(readiness: ARReadiness): ARSafetyStatus {
  return readiness === "not_ready" ? "NOT_OPTIMAL_FOR_AR" : "SAFE_FOR_AR";
}

/* =========================================================
   DIMENSION RECOMMENDATION LOOKUP
   Add or adjust ranges here as needed.
========================================================= */

interface CategoryRange {
  minWidthCm: number;
  maxWidthCm: number;
  minDepthCm: number;
  maxDepthCm: number;
  minHeightCm: number;
  maxHeightCm: number;
}

const CATEGORY_RANGES: Record<string, CategoryRange> = {
  sofa: {
    minWidthCm: 150, maxWidthCm: 300,
    minDepthCm: 80,  maxDepthCm: 110,
    minHeightCm: 70, maxHeightCm: 100,
  },
  chair: {
    minWidthCm: 40,  maxWidthCm: 65,
    minDepthCm: 40,  maxDepthCm: 60,
    minHeightCm: 75, maxHeightCm: 105,
  },
  dining_chair: {
    minWidthCm: 40,  maxWidthCm: 65,
    minDepthCm: 40,  maxDepthCm: 60,
    minHeightCm: 75, maxHeightCm: 100,
  },
  dining_table: {
    minWidthCm: 80,  maxWidthCm: 300,
    minDepthCm: 70,  maxDepthCm: 120,
    minHeightCm: 72, maxHeightCm: 80,
  },
  desk: {
    minWidthCm: 100, maxWidthCm: 200,
    minDepthCm: 50,  maxDepthCm: 80,
    minHeightCm: 70, maxHeightCm: 80,
  },
  bed: {
    minWidthCm: 90,  maxWidthCm: 200,
    minDepthCm: 190, maxDepthCm: 220,
    minHeightCm: 40, maxHeightCm: 70,
  },
  wardrobe: {
    minWidthCm: 80,  maxWidthCm: 250,
    minDepthCm: 50,  maxDepthCm: 65,
    minHeightCm: 180, maxHeightCm: 240,
  },
  bookshelf: {
    minWidthCm: 60,  maxWidthCm: 120,
    minDepthCm: 25,  maxDepthCm: 40,
    minHeightCm: 120, maxHeightCm: 220,
  },
  coffee_table: {
    minWidthCm: 60,  maxWidthCm: 140,
    minDepthCm: 40,  maxDepthCm: 80,
    minHeightCm: 35, maxHeightCm: 50,
  },
  side_table: {
    minWidthCm: 30,  maxWidthCm: 60,
    minDepthCm: 30,  maxDepthCm: 60,
    minHeightCm: 45, maxHeightCm: 75,
  },
  dresser: {
    minWidthCm: 80,  maxWidthCm: 160,
    minDepthCm: 40,  maxDepthCm: 55,
    minHeightCm: 75, maxHeightCm: 130,
  },
  // Legacy hyphenated keys kept for backwards compat
  "dining chair":  { minWidthCm: 40,  maxWidthCm: 65,  minDepthCm: 40, maxDepthCm: 60,  minHeightCm: 75, maxHeightCm: 100 },
  "dining table":  { minWidthCm: 80,  maxWidthCm: 300, minDepthCm: 70, maxDepthCm: 120, minHeightCm: 72, maxHeightCm: 80  },
  "coffee table":  { minWidthCm: 60,  maxWidthCm: 140, minDepthCm: 40, maxDepthCm: 80,  minHeightCm: 35, maxHeightCm: 50  },
  "side table":    { minWidthCm: 30,  maxWidthCm: 60,  minDepthCm: 30, maxDepthCm: 60,  minHeightCm: 45, maxHeightCm: 75  },
};

/**
 * Returns a DimensionRecommendation for a known category,
 * or undefined if the category is not in the lookup table.
 */
export function getDimensionRecommendation(
  category: string,
  dims: ModelDimensions
): DimensionRecommendation | undefined {
  const key = category.toLowerCase().trim();
  const range = CATEGORY_RANGES[key];
  if (!range) return undefined;

  const notes: string[] = [];

  const check = (
    label: string,
    value: number,
    min: number,
    max: number
  ) => {
    if (value < min) {
      notes.push(
        `${label} (${value} cm) is ${(min - value).toFixed(0)} cm below the typical minimum of ${min} cm.`
      );
    } else if (value > max) {
      notes.push(
        `${label} (${value} cm) is ${(value - max).toFixed(0)} cm above the typical maximum of ${max} cm.`
      );
    }
  };

  check("Width",  dims.widthCm,  range.minWidthCm,  range.maxWidthCm);
  check("Depth",  dims.depthCm,  range.minDepthCm,  range.maxDepthCm);
  check("Height", dims.heightCm, range.minHeightCm, range.maxHeightCm);

  return {
    category,
    ...range,
    withinRange: notes.length === 0,
    notes,
  };
}