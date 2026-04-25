"use client";

import { useCallback, useState } from "react";

import type {
  FurnitureFormPayload,
  FurnitureItemAdmin,
} from "@/types/furniture";

import type { ImageUI, VariantUI } from "@/types/furniture-ui";

/* ========================================================= */

type Params = {
  mode: "create" | "edit";
  item?: FurnitureItemAdmin | null;
};

/* ========================================================= */

type FormState = {
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
      name: item.name ?? "",
      description: item.description ?? "",
      categoryId: item.category_id ?? "",
      basePrice: item.base_price ?? null,

      modelFile: undefined,

      images: (item.furniture_images ?? []).map((img) => ({
        id: img.id,
        clientId: crypto.randomUUID(),
        url: img.image_url,
        isPrimary: !!img.is_primary,
        isDeleted: false,
      })),

      variants: (item.furniture_variants ?? []).map((v) => ({
        id: v.id,
        clientId: crypto.randomUUID(),
        name: v.name ?? "",
        priceAdjustment: v.price_adjustment ?? null,

        isDefault: false,
        isActive: !!v.is_active,
        previewUrl: v.preview_image_url ?? undefined,
        materialFile: undefined,
        isDeleted: false,
      })),

      widthCm: item.width_cm ?? null,
      depthCm: item.depth_cm ?? null,
      heightCm: item.height_cm ?? null,
    };
  }

  return {
    name: "",
    description: "",
    categoryId: "",
    basePrice: null,

    modelFile: undefined,

    images: [],
    variants: [],

    widthCm: null,
    depthCm: null,
    heightCm: null,
  };
}

/* ========================================================= */

export function useFurnitureForm({ mode, item }: Params) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitial(mode, item)
  );

  const [errors, setErrors] = useState<FormErrors>({});

  /* =========================================================
     RESET
  ========================================================= */

  const resetForm = useCallback(() => {
    setForm(buildInitial(mode, item));
    setErrors({});
  }, [mode, item]);

  /* =========================================================
     KEY
  ========================================================= */

  const getKey = (obj: { id?: string; clientId: string }) =>
    obj.id ?? obj.clientId;

  /* =========================================================
     FIELD UPDATE
  ========================================================= */

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));

      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  /* =========================================================
     IMAGE ACTIONS
  ========================================================= */

  const addImages = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: ImageUI[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isPrimary: false,
      isDeleted: false,
      clientId: crypto.randomUUID(),
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
     VARIANTS
  ========================================================= */

  const addVariant = useCallback(() => {
    const newVariant: VariantUI = {
      clientId: crypto.randomUUID(),
      name: "",
      priceAdjustment: null,

      isDefault: false,
      isActive: true,
      materialFile: undefined,
      previewUrl: undefined,
      isDeleted: false,
    };

    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  }, []);

  const updateVariant = useCallback(
    <K extends keyof VariantUI>(
      key: string,
      field: K,
      value: VariantUI[K]
    ) => {
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
      form.widthCm == null ||
      form.depthCm == null ||
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
     PAYLOAD (FIXED TYPES)
  ========================================================= */

 const buildPayload = useCallback((): FurnitureFormPayload | null => {
  if (!validate()) return null;

  const safeImages = ensurePrimary(form.images);

  if (
    form.widthCm == null ||
    form.depthCm == null ||
    form.heightCm == null ||
    form.basePrice == null
  ) {
    return null;
  }

  return {
    name: form.name.trim(),
    description: form.description || undefined,
    categoryId: form.categoryId || undefined,

    // ✅ FIX: guaranteed number (no null)
    basePrice: form.basePrice,

    modelFile: form.modelFile ?? undefined,

    images: safeImages.map((img) => ({
      id: img.id,
      image_url: img.url,
      isPrimary: img.isPrimary,
      file: img.file,
      isDeleted: img.isDeleted,
    })),

    variants: form.variants.map((v) => ({
      id: v.id,
      name: v.name,
      priceAdjustment: v.priceAdjustment ?? undefined,
      isDefault: false,
      isActive: v.isActive,
      materialFile: v.materialFile,
      isDeleted: v.isDeleted,
    })),

    dimensions: {
      widthCm: form.widthCm,
      depthCm: form.depthCm,
      heightCm: form.heightCm,
    },
  };
}, [form, ensurePrimary, validate]);

  /* ========================================================= */

  return {
    state: form,
    errors,

    setField,

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