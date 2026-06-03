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
  FurnitureFormPayload,
  FurnitureItemAdmin,
} from "@/types/furniture";

import type { useFurnitureForm } from "@/hooks/useFurnitureForm";

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
};

/* ========================================================= */

type BasicInfoKeys =
  | "name"
  | "description"
  | "categoryId"
  | "basePrice"
  | "widthCm"
  | "depthCm"
  | "heightCm";

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

/**
 * Loads a GLB File into an offscreen Three.js scene and returns the
 * root THREE.Group. Wraps GLTFLoader's callback API in a Promise.
 */
async function loadGlbFile(file: File): Promise<THREE.Group> {
  const arrayBuffer = await file.arrayBuffer();
  const loader = new GLTFLoader();

  return new Promise<THREE.Group>((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      "",
      (gltf) => {
        const scene = gltf.scene as THREE.Group;
        // Ensure all world matrices are up to date before we hand off
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

/* ========================================================= */

export function useFurnitureModalController({
  form,
  item,
  isOpen,
  onClose,
  onSave,
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
    // New from Step 5
    setModelFile,
    isAnalyzing,
    setIsAnalyzing,
    setCleanedModelFile,
    setValidationReport,
  } = form;

  /* =========================================================
     STABLE REFERENCES
  ========================================================= */

  const modelBlobRef = useRef<string | null>(null);
  const cleanupRef = useRef<Set<string>>(new Set());

  // Tracks the in-flight pipeline so we can abort on unmount / file change
  const pipelineAbortRef = useRef<boolean>(false);

  /* ========================================================= */
  const [submitting, setSubmitting] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  /* ========================================================= */
  const getKey = useCallback(
    (x: { id?: string; clientId: string }) => x.id ?? x.clientId,
    []
  );

  /* ========================================================= */
  const setBasicInfoField = useCallback(
    <K extends BasicInfoKeys>(key: K, value: any) => {
      setField(key, value);
    },
    [setField]
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
     MODEL PREVIEW (SAFE + NO EARLY REVOCATION)
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
     CLEANUP ONLY ON UNMOUNT / CLOSE
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
      cleanupBlobs();
    };
  }, [cleanupBlobs]);

  /* =========================================================
     GLB PIPELINE
  ========================================================= */

  /**
   * Full model normalization pipeline:
   *  1. Set isAnalyzing = true
   *  2. Load GLB via GLTFLoader (offscreen)
   *  3. Sanitize (strip lights/cameras, prune, scale, align)
   *  4. Validate → ValidationReport
   *  5. Export cleaned GLB → File
   *  6. Push cleaned File + report into form state
   *  7. Set isAnalyzing = false
   *
   * Dimensions are read from form state at call time (snapshot),
   * so they always reflect what the user typed before uploading.
   */
  const runModelPipeline = useCallback(
    async (file: File) => {
      // Snapshot dimensions at the moment the file is staged
      const { widthCm, depthCm, heightCm } = state;

      if (widthCm == null || depthCm == null || heightCm == null) {
        err("Pipeline aborted: dimensions not set");
        return;
      }

      // Reset abort flag for this run
      pipelineAbortRef.current = false;

      setIsAnalyzing(true);
      log("Pipeline START", file.name);

      try {
        // ── Step 1: Load ────────────────────────────────────
        log("Pipeline: loading GLB…");
        const scene = await loadGlbFile(file);

        if (pipelineAbortRef.current) {
          log("Pipeline: aborted after load");
          return;
        }

        // ── Step 2: Sanitize ────────────────────────────────
        log("Pipeline: sanitizing…");
        const { scene: cleanedScene, autoFixLog } = sanitizeModel(scene, {
          widthCm,
          depthCm,
          heightCm,
        });

        if (pipelineAbortRef.current) {
          log("Pipeline: aborted after sanitize");
          return;
        }

        // ── Step 3: Validate ────────────────────────────────
        log("Pipeline: validating…");
        const report = validateModel(cleanedScene, {
          widthCm,
          depthCm,
          heightCm,
          autoFixLog,
        });

        if (pipelineAbortRef.current) {
          log("Pipeline: aborted after validate");
          return;
        }

        // ── Step 4: Export ──────────────────────────────────
        log("Pipeline: exporting…");
        const { file: cleanedFile, sizeBytes } = await exportCleanedModel(
          cleanedScene,
          file.name
        );

        if (pipelineAbortRef.current) {
          log("Pipeline: aborted after export");
          return;
        }

        // ── Step 5: Push into form ──────────────────────────
        setCleanedModelFile(cleanedFile);
        setValidationReport({
          ...report,
          cleanedSizeBytes: sizeBytes,
        });

        log("Pipeline DONE", {
          cleanedFile: cleanedFile.name,
          sizeBytes,
          fixCount: autoFixLog.length,
        });
      } catch (e) {
        err("Pipeline FAILED", e);

        // Surface the error in the report so AssetsSection can show it
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
    // Capture state snapshot at call time — no stale closure risk for dims
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.widthCm, state.depthCm, state.heightCm, setIsAnalyzing, setCleanedModelFile, setValidationReport]
  );

  /* =========================================================
     MODEL FILE SETTER (triggers pipeline for GLB)
  ========================================================= */

  /**
   * Use this instead of setField("modelFile") everywhere.
   * - Stages the raw file in form state
   * - Aborts any in-flight pipeline
   * - Kicks off runModelPipeline if the file is a GLB
   */
  const handleModelFile = useCallback(
    (file: File | undefined) => {
      // Abort any in-flight pipeline from a previous file
      pipelineAbortRef.current = true;

      setModelFile(file);

      if (file && isGlbFile(file)) {
        // Small tick so the file is committed to form state first
        setTimeout(() => runModelPipeline(file), 0);
      }
    },
    [setModelFile, runModelPipeline]
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
    // Abort any in-flight pipeline
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

    setBasicInfoField,
    // Expose handleModelFile instead of the old setModelFile
    setModelFile: handleModelFile,

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