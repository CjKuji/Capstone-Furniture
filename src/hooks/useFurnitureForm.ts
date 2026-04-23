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
  basePrice: number;

  modelFile?: File;

  images: ImageUI[];
  variants: VariantUI[];

  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
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
      basePrice: item.base_price ?? 0,

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
        name: v.name,
        priceAdjustment: v.price_adjustment ?? 0,
        isDefault: !!v.is_default,
        isActive: !!v.is_active,
        previewUrl: v.preview_image_url ?? undefined,
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
    basePrice: 0,
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

  /* =========================================================
     RESET (✅ NEW SAFE ADDITION)
  ========================================================= */

  const resetForm = useCallback(() => {
    setForm(buildInitial("create", null));
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getKey = (obj: { id?: string; clientId: string }) =>
    obj.id ?? obj.clientId;

  /* =========================================================
     GENERIC FIELD
  ========================================================= */

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /* =========================================================
     IMAGE ACTIONS
  ========================================================= */

  const addImages = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImgs: ImageUI[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isPrimary: false,
      isDeleted: false,
      clientId: crypto.randomUUID(),
    }));

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...newImgs],
    }));
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
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          clientId: crypto.randomUUID(),
          name: "",
          priceAdjustment: 0,
          isDefault: prev.variants.length === 0,
          isActive: true,
          isDeleted: false,
        },
      ],
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

  const setDefaultVariant = useCallback((key: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => ({
        ...v,
        isDefault: getKey(v) === key,
      })),
    }));
  }, []);

  /* =========================================================
     SAFETY NORMALIZATION
  ========================================================= */

  const ensurePrimary = useCallback((images: ImageUI[]) => {
    const active = images.filter((i) => !i.isDeleted);
    if (!active.length) return images;

    if (!active.some((i) => i.isPrimary)) {
      const firstKey = getKey(active[0]);

      return images.map((img) => ({
        ...img,
        isPrimary: getKey(img) === firstKey,
      }));
    }

    return images;
  }, []);

  const ensureDefault = useCallback((variants: VariantUI[]) => {
    const active = variants.filter((v) => !v.isDeleted);
    if (!active.length) return variants;

    if (!active.some((v) => v.isDefault)) {
      const firstKey = getKey(active[0]);

      return variants.map((v) => ({
        ...v,
        isDefault: getKey(v) === firstKey,
      }));
    }

    return variants;
  }, []);

  /* =========================================================
     PAYLOAD
  ========================================================= */

  const buildPayload = useCallback((): FurnitureFormPayload => {
    const safeImages = ensurePrimary(form.images);
    const safeVariants = ensureDefault(form.variants);

    return {
      name: form.name,
      description: form.description || undefined,
      categoryId: form.categoryId || undefined,
      basePrice: form.basePrice,
      modelFile: form.modelFile,

      images: safeImages.map((i) => ({
        id: i.id,
        image_url: i.url,
        isPrimary: i.isPrimary,
        file: i.file,
        isDeleted: i.isDeleted,
      })),

      variants: safeVariants.map((v) => ({
        id: v.id,
        name: v.name,
        priceAdjustment: v.priceAdjustment,
        isDefault: v.isDefault,
        isActive: v.isActive,
        materialFile: v.materialFile,
        isDeleted: v.isDeleted,
      })),

      dimensions: {
        widthCm: form.widthCm ?? undefined,
        depthCm: form.depthCm ?? undefined,
        heightCm: form.heightCm ?? undefined,
      },
    };
  }, [form, ensurePrimary, ensureDefault]);

  /* ========================================================= */

  return {
    state: form,

    setField,

    addImages,
    removeImage,
    setPrimaryImage,

    addVariant,
    updateVariant,
    removeVariant,
    setDefaultVariant,

    buildPayload,

    resetForm, // ✅ IMPORTANT
  };
}