"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  FurnitureFormPayload,
  FurnitureItemAdmin,
} from "@/types/furniture";

import type {
  ImageUI,
  VariantUI,
} from "@/types/furniture-ui";

import type { ValidationReport, FurnitureSizePreset } from "@/types/modelValidation";

/* ========================================================= */

type Params = {
  mode: "create" | "edit";
  item?: FurnitureItemAdmin | null;
  /**
   * Pass the modal's isOpen flag here so the form can re-initialise
   * every time the modal opens — the hook itself is never unmounted,
   * so the useState lazy initialiser only fires once without this.
   */
  isOpen?: boolean;
};

/* ========================================================= */

export type FormState = {
  name: string;
  description: string;
  categoryId: string;
  /** Resolved category slug/name used for preset generation, e.g. "dining_table" */
  categorySlug: string;
  basePrice: number | null;

  modelFile?: File;

  images: ImageUI[];
  variants: VariantUI[];

  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;

  /**
   * Tracks which preset chip the admin last clicked ("Small" | "Medium" | "Large"),
   * or null if the admin has manually typed their own dimensions.
   * Used purely for UI highlight state — does not affect the pipeline.
   */
  activePreset: FurnitureSizePreset["label"] | null;

  // ── GLB pipeline state ──────────────────────────────────────────────────
  isAnalyzing: boolean;
  cleanedModelFile: File | null;
  validationReport: ValidationReport | null;
};

/* ========================================================= */

export type FormErrors = {
  name?: string;
  categoryId?: string;
  /**
   * Shown when no product images have been provided.
   * The 3D model is optional — at least one image is required.
   */
  assets?: string;
  basePrice?: string;
  dimensions?: string;
  general?: string;
};

/* ========================================================= */

function buildInitial(
  mode: "create" | "edit",
  item?: FurnitureItemAdmin | null
): FormState {
  if (mode === "edit" && item) {
    return {
      name:         item.name        ?? "",
      description:  item.description ?? "",
      categoryId:   item.category_id ?? "",
      categorySlug: "",
      basePrice:    item.base_price  ?? null,
      modelFile:    undefined,

      images: (item.images ?? []).map((img) => ({
        id:        img.id,
        clientId:  crypto.randomUUID(),
        url:       img.image_url,
        isPrimary: !!img.is_primary,
        isDeleted: false,
      })),

      variants: (item.variants ?? []).map((v) => ({
        id:              v.id,
        clientId:        crypto.randomUUID(),
        name:            v.name            ?? "",
        priceAdjustment: v.price_adjustment ?? null,
        isDefault:       !!v.is_default,
        isActive:        !!v.is_active,
        previewUrl:      v.preview_image_url ?? undefined,
        materialFile:    undefined,
        isDeleted:       false,
      })),

      widthCm:  item.width_cm  ?? null,
      depthCm:  item.depth_cm  ?? null,
      heightCm: item.height_cm ?? null,

      activePreset:     null,
      isAnalyzing:      false,
      cleanedModelFile: null,
      validationReport: null,
    };
  }

  return {
    name:         "",
    description:  "",
    categoryId:   "",
    categorySlug: "",
    basePrice:    null,
    modelFile:    undefined,
    images:       [],
    variants:     [],
    widthCm:      null,
    depthCm:      null,
    heightCm:     null,

    activePreset:     null,
    isAnalyzing:      false,
    cleanedModelFile: null,
    validationReport: null,
  };
}

/* ========================================================= */

export function useFurnitureForm({ mode, item, isOpen }: Params) {
  const [form, setForm] = useState<FormState>(() => buildInitial(mode, item));
  const [errors, setErrors] = useState<FormErrors>({});

  /* =========================================================
     RE-INITIALISE ON OPEN
     -------------------------------------------------------
     The modal is always mounted (never torn down between opens)
     so the useState lazy initialiser above only ever runs once.
     Whenever the modal opens we rebuild the form from the
     current `item` so edit mode always shows fresh data and
     create mode always starts blank.

     We key on `isOpen` transitioning to true AND on `item?.id`
     so switching from one item to another while the modal is
     already open also re-populates correctly.
  ========================================================= */
  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitial(mode, item));
    setErrors({});
  // item?.id covers the "different item opened" case without
  // re-running on every render caused by a new object reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item?.id, mode]);

  /* =========================================================
     RESET (manual, e.g. after save)
  ========================================================= */

  const resetForm = useCallback(() => {
    setForm(buildInitial(mode, item));
    setErrors({});
  }, [mode, item]);

  /* =========================================================
     KEY HELPER
  ========================================================= */

  const getKey = (obj: { id?: string; clientId: string }) =>
    obj.id ?? obj.clientId;

  /* =========================================================
     FIELD UPDATE
  ========================================================= */

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  /* =========================================================
     DIMENSION AUTO-POPULATE
  ========================================================= */

  const applyDetectedDimensions = useCallback(
    (widthCm: number, depthCm: number, heightCm: number) => {
      setForm((prev) => ({
        ...prev,
        widthCm,
        depthCm,
        heightCm,
        activePreset: null,
      }));
      setErrors((prev) => ({ ...prev, dimensions: undefined }));
    },
    []
  );

  /* =========================================================
     PRESET CHIP HANDLER
  ========================================================= */

  const applyPreset = useCallback((preset: FurnitureSizePreset) => {
    setForm((prev) => ({
      ...prev,
      widthCm:      preset.dimensions.widthCm,
      depthCm:      preset.dimensions.depthCm,
      heightCm:     preset.dimensions.heightCm,
      activePreset: preset.label,
    }));
    setErrors((prev) => ({ ...prev, dimensions: undefined }));
  }, []);

  /* =========================================================
     MANUAL DIMENSION EDIT
  ========================================================= */

  const setDimensionField = useCallback(
    (key: "widthCm" | "depthCm" | "heightCm", value: number | null) => {
      setForm((prev) => ({ ...prev, [key]: value, activePreset: null }));
      setErrors((prev) => ({ ...prev, dimensions: undefined }));
    },
    []
  );

  /* =========================================================
     PIPELINE SETTERS
  ========================================================= */

  const setIsAnalyzing = useCallback((value: boolean) => {
    setForm((prev) => ({ ...prev, isAnalyzing: value }));
  }, []);

  const setCleanedModelFile = useCallback((file: File | null) => {
    setForm((prev) => ({ ...prev, cleanedModelFile: file }));
  }, []);

  const setValidationReport = useCallback(
    (
      report:
        | ValidationReport
        | null
        | ((prev: ValidationReport | null) => ValidationReport | null)
    ) => {
      if (typeof report === "function") {
        setForm((prev) => ({
          ...prev,
          validationReport: report(prev.validationReport),
        }));
      } else {
        setForm((prev) => ({ ...prev, validationReport: report }));
      }
    },
    []
  );

  /* =========================================================
     MODEL FILE
     The model is optional — clearing it resets pipeline state
     but does NOT affect image validation.
  ========================================================= */

  const setModelFile = useCallback((file: File | undefined) => {
    setForm((prev) => ({
      ...prev,
      modelFile: file,
      ...(!file && {
        isAnalyzing:      false,
        cleanedModelFile: null,
        validationReport: null,
        widthCm:          null,
        depthCm:          null,
        heightCm:         null,
        activePreset:     null,
      }),
    }));
    // Model file changes do NOT clear the assets error — only adding
    // images clears that error, since images are required.
  }, []);

  /* =========================================================
     IMAGE ACTIONS
  ========================================================= */

  const addImages = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: ImageUI[] = Array.from(files).map((file) => ({
      file,
      url:       URL.createObjectURL(file),
      isPrimary: false,
      isDeleted: false,
      clientId:  crypto.randomUUID(),
    }));

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));

    // Clear the assets error once the user adds at least one image
    setErrors((prev) => ({ ...prev, assets: undefined }));
  }, []);

  const removeImage = useCallback((key: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        getKey(img) === key ? { ...img, isDeleted: true } : img
      ),
    }));
  }, []);

  const setPrimaryImage = useCallback((key: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({
        ...img,
        isPrimary: getKey(img) === key,
      })),
    }));
  }, []);

  /* =========================================================
     VARIANT ACTIONS
  ========================================================= */

  const addVariant = useCallback(() => {
    const newVariant: VariantUI = {
      clientId:        crypto.randomUUID(),
      name:            "",
      priceAdjustment: null,
      isDefault:       false,
      isActive:        true,
      materialFile:    undefined,
      previewUrl:      undefined,
      isDeleted:       false,
    };

    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  }, []);

  const updateVariant = useCallback(
    <K extends keyof VariantUI>(key: string, field: K, value: VariantUI[K]) => {
      setForm((prev) => ({
        ...prev,
        variants: prev.variants.map((v) =>
          getKey(v) === key ? { ...v, [field]: value } : v
        ),
      }));
    },
    []
  );

  const removeVariant = useCallback((key: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        getKey(v) === key ? { ...v, isDeleted: true } : v
      ),
    }));
  }, []);

  /* =========================================================
     VALIDATION
     -------------------------------------------------------
     Rules:
       - name is required
       - categoryId is required
       - at least one (non-deleted) image is required
       - 3D model file is OPTIONAL
       - all three dimensions are required
  ========================================================= */

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Furniture name is required";
    }

    if (!form.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    // Images are required; the 3D model is optional.
    const activeImages = form.images.filter((i) => !i.isDeleted);
    if (activeImages.length === 0) {
      newErrors.assets = "At least one product image is required";
    }

    if (
      form.widthCm  == null ||
      form.depthCm  == null ||
      form.heightCm == null
    ) {
      newErrors.dimensions = "All three dimensions (W × D × H) are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  /* =========================================================
     PRIMARY IMAGE SAFETY
  ========================================================= */

  const ensurePrimary = useCallback((images: ImageUI[]) => {
    const active = images.filter((img) => !img.isDeleted);
    if (!active.length) return images;

    const hasPrimary = active.some((img) => img.isPrimary);
    if (hasPrimary) return images;

    const firstKey = getKey(active[0]);
    return images.map((img) => ({
      ...img,
      isPrimary: getKey(img) === firstKey,
    }));
  }, []);

  /* =========================================================
     PAYLOAD
  ========================================================= */

  const buildPayload = useCallback((): FurnitureFormPayload | null => {
    if (!validate()) return null;

    if (
      form.widthCm   == null ||
      form.depthCm   == null ||
      form.heightCm  == null ||
      form.basePrice == null
    ) {
      return null;
    }

    const safeImages = ensurePrimary(form.images);

    return {
      name:        form.name.trim(),
      description: form.description || undefined,
      categoryId:  form.categoryId  || undefined,
      basePrice:   form.basePrice,

      // Model file is optional — may be undefined
      modelFile: form.cleanedModelFile ?? form.modelFile ?? undefined,

      images: safeImages.map((img) => ({
        id:        img.id,
        image_url: img.url,
        isPrimary: img.isPrimary,
        file:      img.file,
        isDeleted: img.isDeleted,
      })),

      variants: form.variants.map((v) => ({
        id:              v.id,
        name:            v.name,
        priceAdjustment: v.priceAdjustment ?? undefined,
        isDefault:       v.isDefault,
        isActive:        v.isActive,
        materialFile:    v.materialFile,
        isDeleted:       v.isDeleted,
      })),

      dimensions: {
        widthCm:  form.widthCm,
        depthCm:  form.depthCm,
        heightCm: form.heightCm,
      },
    };
  }, [form, ensurePrimary, validate]);

  /* ========================================================= */

  return {
    state: form,
    errors,

    setField,
    setModelFile,
    setDimensionField,
    applyDetectedDimensions,
    applyPreset,

    // Pipeline setters
    isAnalyzing:         form.isAnalyzing,
    setIsAnalyzing,
    cleanedModelFile:    form.cleanedModelFile,
    setCleanedModelFile,
    validationReport:    form.validationReport,
    setValidationReport,

    addImages,
    removeImage,
    setPrimaryImage,

    addVariant,
    updateVariant,
    removeVariant,

    validate,
    buildPayload,
    resetForm,
  };
}