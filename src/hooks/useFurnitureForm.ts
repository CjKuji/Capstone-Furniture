"use client";

import {
  useCallback,
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

import type { ValidationReport } from "@/types/modelValidation";

/* ========================================================= */

type Params = {
  mode: "create" | "edit";
  item?: FurnitureItemAdmin | null;
};

/* ========================================================= */

export type FormState = {
  name: string;
  description: string;
  categoryId: string;
  basePrice: number | null;

  modelFile?: File;

  images: ImageUI[];
  variants: VariantUI[];

  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;

  // ── GLB pipeline state (must live on state so controller can read them) ──
  isAnalyzing: boolean;
  cleanedModelFile: File | null;
  validationReport: ValidationReport | null;
};

/* ========================================================= */

type FormErrors = {
  name?: string;
  categoryId?: string;
  images?: string;
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
      name:        item.name        ?? "",
      description: item.description ?? "",
      categoryId:  item.category_id ?? "",
      basePrice:   item.base_price  ?? null,
      modelFile:   undefined,

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

      // Pipeline state always starts clean
      isAnalyzing:      false,
      cleanedModelFile: null,
      validationReport: null,
    };
  }

  return {
    name:        "",
    description: "",
    categoryId:  "",
    basePrice:   null,
    modelFile:   undefined,
    images:      [],
    variants:    [],
    widthCm:     null,
    depthCm:     null,
    heightCm:    null,

    isAnalyzing:      false,
    cleanedModelFile: null,
    validationReport: null,
  };
}

/* ========================================================= */

export function useFurnitureForm({ mode, item }: Params) {
  const [form, setForm] = useState<FormState>(() => buildInitial(mode, item));
  const [errors, setErrors] = useState<FormErrors>({});

  /* =========================================================
     RESET
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
     PIPELINE SETTERS
     These write directly into form state so the controller
     can read them via state.isAnalyzing / state.validationReport
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
     MODEL FILE — clears pipeline state when removed
  ========================================================= */

  const setModelFile = useCallback((file: File | undefined) => {
    setForm((prev) => ({
      ...prev,
      modelFile: file,
      // Clearing the file resets all downstream pipeline state
      ...(!file && {
        isAnalyzing:      false,
        cleanedModelFile: null,
        validationReport: null,
      }),
    }));
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

    setErrors((prev) => ({ ...prev, images: undefined }));
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
  ========================================================= */

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Furniture name is required";
    }

    if (!form.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    const activeImages = form.images.filter((i) => !i.isDeleted);
    if (activeImages.length === 0) {
      newErrors.images = "At least one image is required";
    }

    if (
      form.widthCm  == null ||
      form.depthCm  == null ||
      form.heightCm == null
    ) {
      newErrors.dimensions = "Dimensions are required";
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
      form.widthCm  == null ||
      form.depthCm  == null ||
      form.heightCm == null ||
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

      // Prefer cleaned GLB from pipeline; fall back to raw upload
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
    // The entire form state — controller reads isAnalyzing,
    // validationReport, widthCm etc. directly from here
    state: form,
    errors,

    setField,
    setModelFile,

    // Pipeline setters (called by controller, stored in form state)
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