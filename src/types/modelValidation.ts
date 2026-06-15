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
  | "SCALE_WITHIN_TOLERANCE";

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
   GLOBAL FURNITURE STANDARDS CONFIGURATION
   Defines the target widths used to generate Small / Medium / Large
   presets, plus the absolute minimum heights that keep a piece
   human-usable in AR (the "safety height floor").
========================================================= */

export interface FurnitureSizePreset {
  label: "Small" | "Medium" | "Large";
  dimensions: ModelDimensions;
}

export interface FurnitureStandardConfig {
  /** Canonical furniture category key, e.g. "dining_table" */
  category: string;
  /**
   * Target widths (cm) used to generate the three preset suggestions.
   * Depth and height are derived from the model's natural aspect ratios,
   * then clamped to safetyMinHeightCm.
   */
  targetWidths: {
    small: number;
    medium: number;
    large: number;
  };
  /**
   * Absolute minimum height (cm) that the preset generator will ever
   * output for this category — the "safety height floor".
   * Prevents items from shrinking below human-usability limits.
   */
  safetyMinHeightCm: number;
  /**
   * Absolute minimum depth (cm) so depth never collapses unrealistically.
   */
  safetyMinDepthCm: number;
}

/**
 * Global furniture standards table.
 * Add or adjust entries here; the preset generator reads directly from this.
 */
export const FURNITURE_STANDARDS: Record<string, FurnitureStandardConfig> = {
  sofa: {
    category: "sofa",
    targetWidths: { small: 150, medium: 200, large: 280 },
    safetyMinHeightCm: 65,
    safetyMinDepthCm: 75,
  },
  chair: {
    category: "chair",
    targetWidths: { small: 45, medium: 55, large: 65 },
    safetyMinHeightCm: 75,
    safetyMinDepthCm: 40,
  },
  dining_chair: {
    category: "dining_chair",
    targetWidths: { small: 42, medium: 52, large: 62 },
    safetyMinHeightCm: 75,
    safetyMinDepthCm: 40,
  },
  dining_table: {
    category: "dining_table",
    targetWidths: { small: 90, medium: 150, large: 240 },
    safetyMinHeightCm: 70,
    safetyMinDepthCm: 70,
  },
  desk: {
    category: "desk",
    targetWidths: { small: 100, medium: 140, large: 180 },
    safetyMinHeightCm: 68,
    safetyMinDepthCm: 50,
  },
  bed: {
    category: "bed",
    targetWidths: { small: 90, medium: 140, large: 180 },
    safetyMinHeightCm: 35,
    safetyMinDepthCm: 185,
  },
  wardrobe: {
    category: "wardrobe",
    targetWidths: { small: 80, medium: 140, large: 220 },
    safetyMinHeightCm: 170,
    safetyMinDepthCm: 50,
  },
  bookshelf: {
    category: "bookshelf",
    targetWidths: { small: 60, medium: 90, large: 120 },
    safetyMinHeightCm: 100,
    safetyMinDepthCm: 25,
  },
  coffee_table: {
    category: "coffee_table",
    targetWidths: { small: 60, medium: 90, large: 130 },
    safetyMinHeightCm: 30,
    safetyMinDepthCm: 40,
  },
  side_table: {
    category: "side_table",
    targetWidths: { small: 30, medium: 45, large: 60 },
    safetyMinHeightCm: 45,
    safetyMinDepthCm: 30,
  },
  dresser: {
    category: "dresser",
    targetWidths: { small: 80, medium: 110, large: 150 },
    safetyMinHeightCm: 70,
    safetyMinDepthCm: 40,
  },
};

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
  /**
   * Small / Medium / Large preset suggestions generated from the model's
   * natural aspect ratios scaled to the global standard target widths.
   * Undefined when no FurnitureStandardConfig exists for the category.
   */
  presetSuggestions?: FurnitureSizePreset[];
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

/**
 * Generates Small / Medium / Large preset dimensions for a given category
 * by preserving the model's natural depth-to-width and height-to-width
 * aspect ratios, then clamping each axis to its safety minimum.
 *
 * Uniform scaling is intentional — this mirrors how modelSanitizer.ts
 * uses multiplyScalar; we never stretch axes independently.
 */
export function generatePresetSuggestions(
  category: string,
  detectedDimensions: ModelDimensions
): FurnitureSizePreset[] | undefined {
  const key = category.toLowerCase().trim();
  const config = FURNITURE_STANDARDS[key];
  if (!config) return undefined;

  const { widthCm, depthCm, heightCm } = detectedDimensions;
  if (widthCm <= 0) return undefined;

  // Natural aspect ratios relative to width (uniform-scale safe)
  const depthRatio  = depthCm  / widthCm;
  const heightRatio = heightCm / widthCm;

  const labels = ["small", "medium", "large"] as const;
  const uiLabels: FurnitureSizePreset["label"][] = ["Small", "Medium", "Large"];

  return labels.map((sizeKey, i) => {
    const targetWidth = config.targetWidths[sizeKey];
    const scaleFactor = targetWidth / widthCm;

    return {
      label: uiLabels[i],
      dimensions: {
        widthCm:  Math.round(targetWidth * 10) / 10,
        // Safety height floor via Math.max — items never shrink past usability
        heightCm: Math.round(
          Math.max(heightCm * scaleFactor, config.safetyMinHeightCm) * 10
        ) / 10,
        depthCm:  Math.round(
          Math.max(depthCm  * scaleFactor, config.safetyMinDepthCm)  * 10
        ) / 10,
      },
    } satisfies FurnitureSizePreset;
  });
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