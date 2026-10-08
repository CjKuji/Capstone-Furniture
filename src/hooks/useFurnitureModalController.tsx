"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createFilePreview,
  revokeFilePreview,
} from "@/utils/furnitureUtils";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import * as THREE from "three";

import { measureCleanSize, sanitizeModel } from "@/services/handlers/modelSanitizer";
import { validateModel } from "@/services/handlers/modelValidator";
import { exportCleanedModel } from "@/services/handlers/modelExporter";
import {
  type ValidationReport,
} from "@/types/modelValidation";

import type {
  FurnitureCategory,
  FurnitureFormPayload,
  FurnitureItemAdmin,
} from "@/types/furniture";

import type { useFurnitureForm } from "@/hooks/useFurnitureForm";
import type { FormState } from "@/hooks/useFurnitureForm";

/* ========================================================= */

type FormHook = ReturnType<typeof useFurnitureForm>;

type Params = {
  form: FormHook;
  item: FurnitureItemAdmin | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string | null,
    data: FurnitureFormPayload
  ) => Promise<void> | void;
  /** Full categories list used to resolve category IDs to validator ranges. */
  categories: FurnitureCategory[];
};

/* ========================================================= */

const DEBUG = true;
const log = (...args: unknown[]) => DEBUG && console.log("🟦 MODAL:", ...args);
const err = (...args: unknown[]) => console.error("🟥 MODAL:", ...args);

/* ========================================================= */

function isGlbFile(file: File): boolean {
  if (file.name.toLowerCase().endsWith(".gltf")) return false;
  return file.name.toLowerCase().endsWith(".glb") || file.type === "model/gltf-binary";
}

type DimensionAxis = "widthCm" | "depthCm" | "heightCm";
type DimensionTargets = Record<DimensionAxis, number | null>;

/* ========================================================= */

async function loadGlbFile(file: File): Promise<THREE.Group> {
  const arrayBuffer = await file.arrayBuffer();
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  loader.setDRACOLoader(dracoLoader);
  loader.setMeshoptDecoder(MeshoptDecoder);

  return new Promise<THREE.Group>((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      "",
      (gltf) => {
        const scene = gltf.scene as THREE.Group;
        scene.updateMatrixWorld(true);
        dracoLoader.dispose();
        resolve(scene);
      },
      (error) => {
        dracoLoader.dispose();
        reject(
          new Error(
            `GLTFLoader failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        );
      }
    );
  });
}

/**
 * Resolves a FurnitureCategory's name/slug into the underscore_case key
 * expected by the validator's category dimension ranges.
 */
function resolveCategorySlug(
  categoryId: string,
  categories: FurnitureCategory[] | undefined | null
): string {
  if (!categoryId) return "";
  if (!Array.isArray(categories) || categories.length === 0) return "";
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return "";
  return cat.name.toLowerCase().trim().replace(/\s+/g, "_");
}

/* ========================================================= */

export function useFurnitureModalController({
  form,
  item,
  isOpen,
  onClose,
  onSave,
  categories,
}: Params) {
  const {
    state,
    validate,
    buildPayload,
    resetForm,
    addImages,
    removeImage,
    setPrimaryImage,
    addVariant,
    updateVariant,
    removeVariant,
    setField,
    setModelFile,
    setDimensionField: updateDimensionField,
    applyDetectedDimensions,
    isAnalyzing,
    setIsAnalyzing,
    setCleanedModelFile,
    setValidationReport,
    setGeneralError,
  } = form;

  /* =========================================================
     STABLE REFERENCES
  ========================================================= */

  const modelBlobRef = useRef<string | null>(null);
  const cleanupRef = useRef<Set<string>>(new Set());
  const originalFileRef = useRef<File | null>(null);
  const runIdRef = useRef(0);
  const lastProcessedDimsRef = useRef<{
    widthCm: number;
    depthCm: number;
    heightCm: number;
  } | null>(null);
  const cleanSizeRawRef = useRef<THREE.Vector3 | null>(null);
  const dimensionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dimensionValuesRef = useRef<DimensionTargets>({
    widthCm: state.widthCm,
    depthCm: state.depthCm,
    heightCm: state.heightCm,
  });
  const itemId = item?.id;
  const itemWidthCm = item?.width_cm;
  const itemDepthCm = item?.depth_cm;
  const itemHeightCm = item?.height_cm;

  /* ========================================================= */
  const [submitting, setSubmitting]           = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  /* ========================================================= */
  const getKey = useCallback(
    (x: { id?: string; clientId: string }) => x.id ?? x.clientId,
    []
  );

  const clearDimensionTimer = useCallback(() => {
    if (dimensionTimerRef.current !== null) {
      clearTimeout(dimensionTimerRef.current);
      dimensionTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    runIdRef.current += 1;
    originalFileRef.current = null;
    cleanSizeRawRef.current = null;
    lastProcessedDimsRef.current = itemId
      ? {
          widthCm: Number(itemWidthCm) || 0,
          depthCm: Number(itemDepthCm) || 0,
          heightCm: Number(itemHeightCm) || 0,
        }
      : null;
    dimensionValuesRef.current = {
      widthCm: itemWidthCm ?? null,
      depthCm: itemDepthCm ?? null,
      heightCm: itemHeightCm ?? null,
    };
    clearDimensionTimer();
  }, [isOpen, itemId, itemWidthCm, itemDepthCm, itemHeightCm, clearDimensionTimer]);

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const images = useMemo(
    () => state.images.filter((i) => !i.isDeleted),
    [state.images]
  );

  const variants = useMemo(
    () => state.variants.filter((v) => !v.isDeleted),
    [state.variants]
  );

  const activeVariantTexture = useMemo(() => {
    if (!activeVariantId) return null;
    const variant = state.variants.find((v) => getKey(v) === activeVariantId);
    return variant?.previewUrl ?? null;
  }, [activeVariantId, state.variants, getKey]);

  /* =========================================================
     AR SAFETY STATUS
  ========================================================= */

  const arSafetyStatus = useMemo(() => {
    return state.validationReport?.arSafetyStatus ?? null;
  }, [state.validationReport]);

  /* =========================================================
     MODEL PREVIEW
  ========================================================= */

  const [modelPreviewUrl, setModelPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const previewFile = state.cleanedModelFile ?? state.modelFile;
    const previousUrl = modelBlobRef.current;
    if (previousUrl) {
      revokeFilePreview(previousUrl);
      cleanupRef.current.delete(previousUrl);
      modelBlobRef.current = null;
    }

    if (previewFile) {
      const url = createFilePreview(previewFile);
      modelBlobRef.current = url;
      cleanupRef.current.add(url);
      setModelPreviewUrl(url);
      return;
    }
    setModelPreviewUrl(item?.model_url ?? null);
  }, [state.cleanedModelFile, state.modelFile, item?.model_url]);

  /* =========================================================
     CLEANUP
  ========================================================= */

  const cleanupBlobs = useCallback(() => {
    cleanupRef.current.forEach((url) => {
      if (url?.startsWith("blob:")) revokeFilePreview(url);
    });
    cleanupRef.current.clear();
    modelBlobRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearDimensionTimer();
      cleanupBlobs();
    };
  }, [cleanupBlobs, clearDimensionTimer]);

  /* =========================================================
     GLB PIPELINE
  ========================================================= */

  const runModelPipeline = useCallback(
    async (
      strategy:
        | { type: "initial" }
        | { type: "dimension"; dimensions: DimensionTargets }
    ) => {
      const myRun = ++runIdRef.current;
      const categorySlug = state.categorySlug;
      setIsAnalyzing(true);
      setCleanedModelFile(null);
      setValidationReport(null);
      setGeneralError(undefined);

      try {
        let file = originalFileRef.current;
        if (!file && item?.model_url) {
          const response = await fetch(item.model_url);
          if (myRun !== runIdRef.current) return;
          if (!response.ok) {
            throw new Error(`Could not download the stored model (${response.status}).`);
          }
          const blob = await response.blob();
          if (myRun !== runIdRef.current) return;
          file = new File([blob], `stored-model-${item.id}.glb`, {
            type: "model/gltf-binary",
          });
        }
        if (!file) {
          throw new Error("No source GLB is available to process.");
        }

        log("Pipeline START", file.name, { categorySlug, strategy: strategy.type });
        const scene = await loadGlbFile(file);
        if (myRun !== runIdRef.current) return;

        const size = measureCleanSize(scene);
        cleanSizeRawRef.current = size.clone();
        if (![size.x, size.y, size.z].every((value) => Number.isFinite(value) && value > 0)) {
          throw new Error("The model has an empty or flat bounding box and cannot be sized.");
        }

        let targetDimsCm: { widthCm: number; depthCm: number; heightCm: number };
        if (strategy.type === "dimension") {
          targetDimsCm = {
            widthCm: strategy.dimensions.widthCm ?? size.x * 100,
            depthCm: strategy.dimensions.depthCm ?? size.z * 100,
            heightCm: strategy.dimensions.heightCm ?? size.y * 100,
          };
        } else {
          targetDimsCm = {
            widthCm: size.x * 100,
            depthCm: size.z * 100,
            heightCm: size.y * 100,
          };
        }
        if (!Object.values(targetDimsCm).every((value) => Number.isFinite(value) && value > 0)) {
          throw new Error("The model's measured dimensions are not valid positive values.");
        }

        const original = scene.clone(true);
        const report: ValidationReport = validateModel(original, {
          ...targetDimsCm,
          autoFixLog: [],
          scaleWasNormalized: true,
          category: categorySlug || undefined,
        });
        const { scene: cleanedScene, autoFixLog } = sanitizeModel(scene, targetDimsCm);
        report.autoFixLog = autoFixLog;

        const { file: cleanedFile, sizeBytes } = await exportCleanedModel(cleanedScene, file.name);
        if (myRun !== runIdRef.current) return;

        const exportedScene = await loadGlbFile(cleanedFile);
        if (myRun !== runIdRef.current) return;
        const finalSize = measureCleanSize(exportedScene);
        const measuredDimensions = {
          widthCm: finalSize.x * 100,
          depthCm: finalSize.z * 100,
          heightCm: finalSize.y * 100,
        };
        const finalDimensions = {
          widthCm: Math.round(measuredDimensions.widthCm),
          depthCm: Math.round(measuredDimensions.depthCm),
          heightCm: Math.round(measuredDimensions.heightCm),
        };

        report.detectedDimensions = finalDimensions;
        report.fixedDimensions = finalDimensions;
        report.cleanedSizeBytes = sizeBytes;
        if (strategy.type === "initial") {
          applyDetectedDimensions(
            finalDimensions.widthCm,
            finalDimensions.depthCm,
            finalDimensions.heightCm
          );
          dimensionValuesRef.current = {
            widthCm: finalDimensions.widthCm,
            depthCm: finalDimensions.depthCm,
            heightCm: finalDimensions.heightCm,
          };
        }
        lastProcessedDimsRef.current = measuredDimensions;
        setCleanedModelFile(cleanedFile);
        setValidationReport(report);

        console.log("Final cleaned model size (cm)", finalDimensions);
        log("Pipeline DONE", { finalDimensions, sizeBytes });
      } catch (e) {
        if (myRun !== runIdRef.current) return;
        const message = e instanceof Error ? e.message : "Unknown error during model processing.";
        err("Pipeline FAILED", e);
        setCleanedModelFile(null);
        setGeneralError(
          strategy.type !== "initial" && !originalFileRef.current && item?.model_url
            ? `The stored model was not resized: ${message}`
            : `3D model processing failed: ${message}`
        );
      } finally {
        if (myRun === runIdRef.current) setIsAnalyzing(false);
      }
    },
    [
      state.categorySlug,
      item,
      setIsAnalyzing,
      setCleanedModelFile,
      setValidationReport,
      setGeneralError,
      applyDetectedDimensions,
    ]
  );

  /* =========================================================
     MODEL FILE SETTER
  ========================================================= */

  const handleModelFile = useCallback(
    (file: File | undefined) => {
      runIdRef.current += 1;
      clearDimensionTimer();
      if (file && !isGlbFile(file)) {
        originalFileRef.current = null;
        cleanSizeRawRef.current = null;
        lastProcessedDimsRef.current = null;
        setModelFile(undefined);
        setIsAnalyzing(false);
        setGeneralError("Only .glb files are supported. A .gltf upload can lose external buffers or textures.");
        return;
      }
      originalFileRef.current = file ?? null;
      cleanSizeRawRef.current = null;
      lastProcessedDimsRef.current = null;
      setModelFile(file);

      if (file) void runModelPipeline({ type: "initial" });
    },
    [setModelFile, runModelPipeline, clearDimensionTimer, setGeneralError, setIsAnalyzing]
  );

  const setDimensionField = useCallback(
    (axis: DimensionAxis, value: number | null) => {
      updateDimensionField(axis, value);
      clearDimensionTimer();
      runIdRef.current += 1;
      setGeneralError(undefined);
      if (value == null || !Number.isFinite(value) || value <= 0) {
        dimensionValuesRef.current = { ...dimensionValuesRef.current, [axis]: value };
        setIsAnalyzing(false);
        return;
      }
      dimensionValuesRef.current = { ...dimensionValuesRef.current, [axis]: value };
      if (!originalFileRef.current && !(item?.model_url && item?.id)) {
        setIsAnalyzing(false);
        return;
      }

      const lastValue = lastProcessedDimsRef.current?.[axis];
      if (lastValue != null && Math.abs(value - lastValue) <= 0.1) {
        updateDimensionField(axis, Math.round(lastValue * 10) / 10);
        setIsAnalyzing(false);
        return;
      }
      setIsAnalyzing(true);
      dimensionTimerRef.current = setTimeout(() => {
        dimensionTimerRef.current = null;
        void runModelPipeline({
          type: "dimension",
          dimensions: { ...dimensionValuesRef.current },
        });
      }, 600);
    },
    [updateDimensionField, clearDimensionTimer, setGeneralError, setIsAnalyzing, item, runModelPipeline]
  );

  const setBasicInfoField = useCallback(
    (key: keyof FormState, value: FormState[keyof FormState]) => {
      if (key === "widthCm" || key === "depthCm" || key === "heightCm") {
        setDimensionField(key, typeof value === "number" ? value : null);
        return;
      }

      if (key === "categoryId") {
        const categoryId = typeof value === "string" ? value : "";
        setField("categoryId", categoryId);
        const slug = resolveCategorySlug(categoryId, categories);
        setField("categorySlug", slug);
        return;
      }
      if (key === "name" || key === "description") {
        if (typeof value === "string") setField(key, value);
        return;
      }
      if (key === "basePrice") {
        if (typeof value === "number" || value === null) setField("basePrice", value);
      }
    },
    [setField, setDimensionField, categories]
  );

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = useCallback(async () => {
    if (!isOpen) {
      log("BLOCKED: modal closed");
      return false;
    }

    setSubmitting(true);

    try {
      log("STEP 1 validate");
      const ok = validate();
      if (!ok) {
        err("validation failed");
        return false;
      }

      log("STEP 2 buildPayload");
      const payload = buildPayload();
      if (!payload) {
        err("payload missing");
        return false;
      }
      if (state.cleanedModelFile && lastProcessedDimsRef.current) {
        payload.dimensions = { ...lastProcessedDimsRef.current };
      }

      log("STEP 3 onSave START", item?.id);
      await onSave(item?.id ?? null, payload);
      log("STEP 4 onSave SUCCESS");

      resetForm();
      setActiveVariantId(null);
      onClose();

      return true;
    } catch (e) {
      err("submit crashed", e);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [isOpen, validate, buildPayload, onSave, item, resetForm, onClose, state.cleanedModelFile]);

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = useCallback(() => {
    runIdRef.current += 1;
    clearDimensionTimer();
    cleanupBlobs();
    resetForm();
    setActiveVariantId(null);
    onClose();
  }, [resetForm, onClose, cleanupBlobs, clearDimensionTimer]);

  /* =========================================================
     VARIANT FILE
  ========================================================= */

  const handleVariantFile = useCallback(
    (key: string, file: File | null) => {
      if (!file) return;

      const url = createFilePreview(file);
      cleanupRef.current.add(url);

      updateVariant(key, "materialFile", file);
      updateVariant(key, "previewUrl", url);
    },
    [updateVariant]
  );

  /* ========================================================= */

  return {
    state,

    images,
    variants,

    submitting,
    isAnalyzing,

    modelPreviewUrl,
    activeVariantTexture,
    activeVariantId,

    arSafetyStatus,

    detectedDimensions:
      state.validationReport?.fixedDimensions ??
      state.validationReport?.detectedDimensions ??
      null,
    dimensionSource: state.dimensionSource,

    setBasicInfoField,
    setModelFile: handleModelFile,
    setDimensionField,

    setActiveVariantId,

    addImages,
    removeImage,
    setPrimaryImage,

    addVariant,
    updateVariant,
    removeVariant,

    handleClose,
    handleSubmit,
    handleVariantFile,

    getKey,
    validate,
    buildPayload,
    setField,
  };
}