"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createFilePreview,
  revokeFilePreview,
} from "@/utils/furnitureUtils";

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
  } = form;

  /* =========================================================
     STABLE REFERENCES (FIX RACE CONDITIONS)
  ========================================================= */

  const modelBlobRef = useRef<string | null>(null);
  const cleanupRef = useRef<Set<string>>(new Set());

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

  const setModelFile = useCallback(
    (file?: File) => {
      setField("modelFile", file);
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

    const variant = state.variants.find(
      (v) => getKey(v) === activeVariantId
    );

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

    // ❌ DO NOT revoke here anymore (THIS WAS THE BUG)
  }, [state.modelFile, item]);

  /* =========================================================
     CLEANUP ONLY ON UNMOUNT / CLOSE
  ========================================================= */

  const cleanupBlobs = useCallback(() => {
    cleanupRef.current.forEach((url) => {
      if (url?.startsWith("blob:")) {
        revokeFilePreview(url);
      }
    });

    cleanupRef.current.clear();
    modelBlobRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupBlobs();
    };
  }, [cleanupBlobs]);

  /* ========================================================= */
  const handleClose = useCallback(() => {
    cleanupBlobs();

    resetForm();
    setActiveVariantId(null);

    onClose();
  }, [resetForm, onClose, cleanupBlobs]);

  /* =========================================================
     🔥 FIXED SUBMIT (NO SILENT FAILURES)
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
  }, [
    isOpen,
    validate,
    buildPayload,
    onSave,
    item,
    resetForm,
    onClose,
  ]);

  /* ========================================================= */
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

    modelPreviewUrl,
    activeVariantTexture,
    activeVariantId,

    setBasicInfoField,
    setModelFile,

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