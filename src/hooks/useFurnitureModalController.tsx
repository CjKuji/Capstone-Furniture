"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createFilePreview,
  revokeFilePreview,
} from "@/utils/furnitureUtils";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

import { sanitizeModel } from "@/services/handlers/modelSanitizer";
import { validateModel } from "@/services/handlers/modelValidator";
import { exportCleanedModel } from "@/services/handlers/modelExporter";

import type {
  FurnitureCategory,
  FurnitureFormPayload,
  FurnitureItemAdmin,
} from "@/types/furniture";

import type { FurnitureSizePreset } from "@/types/modelValidation";

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
  /**
   * Full categories list — needed to resolve categoryId → category slug
   * so validateModel receives a meaningful `category` string for preset
   * generation rather than a raw UUID.
   */
  categories: FurnitureCategory[];
};

/* ========================================================= */

const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log("🟦 MODAL:", ...args);
const err = (...args: any[]) => console.error("🟥 MODAL:", ...args);

/* ========================================================= */

function isGlbFile(file: File): boolean {
  if (file.name.toLowerCase().endsWith(".glb")) return true;
  if (file.type === "model/gltf-binary") return true;
  return false;
}

/* ========================================================= */

async function loadGlbFile(file: File): Promise<THREE.Group> {
  const arrayBuffer = await file.arrayBuffer();
  const loader = new GLTFLoader();

  return new Promise<THREE.Group>((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      "",
      (gltf) => {
        const scene = gltf.scene as THREE.Group;
        scene.updateMatrixWorld(true);
        resolve(scene);
      },
      (error) => {
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
 * expected by FURNITURE_STANDARDS and CATEGORY_RANGES.
 */
function resolveCategorySlug(
  categoryId: string,
  categories: FurnitureCategory[] | undefined | null
): string {
  if (!categoryId) return "";
  if (!Array.isArray(categories) || categories.length === 0) return "";
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return "";
  const raw: string =
    (cat as any).slug ??
    (cat as any).name ??
    "";
  return raw.toLowerCase().trim().replace(/\s+/g, "_");
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
    setDimensionField,
    applyDetectedDimensions,
    applyPreset,
    isAnalyzing,
    setIsAnalyzing,
    setCleanedModelFile,
    setValidationReport,
  } = form;

  /* =========================================================
     STABLE REFERENCES
  ========================================================= */

  const modelBlobRef     = useRef<string | null>(null);
  const cleanupRef       = useRef<Set<string>>(new Set());
  const pipelineAbortRef = useRef<boolean>(false);

  /* ========================================================= */
  const [submitting, setSubmitting]           = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  /* ========================================================= */
  const getKey = useCallback(
    (x: { id?: string; clientId: string }) => x.id ?? x.clientId,
    []
  );

  /* =========================================================
     BASIC INFO
     Typed as (key: keyof FormState, value: any) so it is assignable
     to BasicInfoSection's prop without a generic mismatch.
     The categoryId side-effect is guarded with a runtime string check.
  ========================================================= */

  const setBasicInfoField = useCallback(
    (key: keyof FormState, value: any) => {
      setField(key, value);

      if (key === "categoryId") {
        const slug = resolveCategorySlug(value as string, categories);
        setField("categorySlug", slug);
      }
    },
    [setField, categories]
  );

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
    if (!state.modelFile) {
      setModelPreviewUrl(item?.model_url ?? null);
      return;
    }

    const url = createFilePreview(state.modelFile);
    modelBlobRef.current = url;
    cleanupRef.current.add(url);
    setModelPreviewUrl(url);
  }, [state.modelFile, item]);

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
    return () => { cleanupBlobs(); };
  }, [cleanupBlobs]);

  /* =========================================================
     GLB PIPELINE
  ========================================================= */

  const runModelPipeline = useCallback(
    async (file: File) => {
      const categorySlug = state.categorySlug;

      pipelineAbortRef.current = false;
      setIsAnalyzing(true);
      log("Pipeline START", file.name, { categorySlug });

      try {
        log("Pipeline: loading GLB…");
        const scene = await loadGlbFile(file);
        if (pipelineAbortRef.current) return;

        log("Pipeline: computing natural bbox…");
        const rawBox  = new THREE.Box3().setFromObject(scene);
        const rawSize = new THREE.Vector3();
        rawBox.getSize(rawSize);
        const M_TO_CM = 100;
        const naturalDims = {
          widthCm:  Math.round(rawSize.x * M_TO_CM * 10) / 10,
          depthCm:  Math.round(rawSize.z * M_TO_CM * 10) / 10,
          heightCm: Math.round(rawSize.y * M_TO_CM * 10) / 10,
        };
        log("Pipeline: natural dims", naturalDims);
        if (pipelineAbortRef.current) return;

        log("Pipeline: sanitizing…");
        const { scene: cleanedScene, autoFixLog } = sanitizeModel(scene, naturalDims);
        if (pipelineAbortRef.current) return;

        log("Pipeline: validating…");
        const report = validateModel(cleanedScene, {
          ...naturalDims,
          autoFixLog,
          scaleWasNormalized: true,
          category: categorySlug || undefined,
        });
        if (pipelineAbortRef.current) return;

        log("Pipeline: exporting…");
        const { file: cleanedFile, sizeBytes } = await exportCleanedModel(
          cleanedScene,
          file.name
        );
        if (pipelineAbortRef.current) return;

        applyDetectedDimensions(
          report.detectedDimensions.widthCm,
          report.detectedDimensions.depthCm,
          report.detectedDimensions.heightCm,
        );

        setCleanedModelFile(cleanedFile);
        setValidationReport({
          ...report,
          cleanedSizeBytes: sizeBytes,
        });

        log("Pipeline DONE", {
          detectedDimensions: report.detectedDimensions,
          presets:            report.presetSuggestions?.map((p) => p.label),
          arSafetyStatus:     report.arSafetyStatus,
          sizeBytes,
        });
      } catch (e) {
        err("Pipeline FAILED", e);
        setValidationReport({
          autoFixLog: [],
          error:
            e instanceof Error
              ? e.message
              : "Unknown error during model processing",
        } as any);
      } finally {
        if (!pipelineAbortRef.current) {
          setIsAnalyzing(false);
        }
      }
    },
    [
      state.categorySlug,
      setIsAnalyzing,
      applyDetectedDimensions,
      setCleanedModelFile,
      setValidationReport,
    ]
  );

  /* =========================================================
     MODEL FILE SETTER
  ========================================================= */

  const handleModelFile = useCallback(
    (file: File | undefined) => {
      pipelineAbortRef.current = true;
      setModelFile(file);

      if (file && isGlbFile(file)) {
        setTimeout(() => runModelPipeline(file), 0);
      }
    },
    [setModelFile, runModelPipeline]
  );

  /* =========================================================
     PRESET CHIP HANDLER
  ========================================================= */

  const handlePresetSelect = useCallback(
    (preset: FurnitureSizePreset) => {
      applyPreset(preset);
      log("Preset applied", preset.label, preset.dimensions);
    },
    [applyPreset]
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
  }, [isOpen, validate, buildPayload, onSave, item, resetForm, onClose]);

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = useCallback(() => {
    pipelineAbortRef.current = true;
    cleanupBlobs();
    resetForm();
    setActiveVariantId(null);
    onClose();
  }, [resetForm, onClose, cleanupBlobs]);

  /* =========================================================
     VARIANT FILE
  ========================================================= */

  const handleVariantFile = useCallback(
    (key: string, file: File | null) => {
      if (!file) return;

      const url = createFilePreview(file);
      cleanupRef.current.add(url);

      updateVariant(key, "materialFile", file as any);
      updateVariant(key, "previewUrl", url as any);
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

    presetSuggestions: state.validationReport?.presetSuggestions ?? null,
    activePreset:      state.activePreset,

    setBasicInfoField,
    setModelFile: handleModelFile,
    setDimensionField,
    handlePresetSelect,

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