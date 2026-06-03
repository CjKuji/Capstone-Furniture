/* =========================================================
   MODEL VALIDATION TYPES
========================================================= */

export type ValidationSeverity = "error" | "warning" | "info";

export type ARReadiness = "ready" | "needs_review" | "not_ready";

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

export interface ValidationReport {
  findings: ValidationFinding[];
  arReadiness: ARReadiness;
  originalDimensions: ModelDimensions;
  detectedDimensions: ModelDimensions;
  fixedDimensions: ModelDimensions;
  autoFixLog: string[];
  wasReExported: boolean;
  /** Size in bytes of the cleaned/exported GLB — set by the pipeline after export */
  cleanedSizeBytes?: number;
}

export function deriveARReadiness(findings: ValidationFinding[]): ARReadiness {
  const unfixed = findings.filter((f) => !f.autoFixed);
  if (unfixed.some((f) => f.severity === "error")) return "not_ready";
  if (unfixed.some((f) => f.severity === "warning")) return "needs_review";
  return "ready";
}