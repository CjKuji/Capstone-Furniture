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

        // default logic completely removed
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

  /* =========================================================
     RESET
  ========================================================= */

  const resetForm = useCallback(() => {
    setForm(buildInitial(mode, item));
  }, [mode, item]);

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
      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
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
  }, []);

  const removeImage = useCallback((key: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        getKey(img) === key
          ? {
              ...img,
              isDeleted: true,
            }
          : img
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
     (NO DEFAULT VARIANT LOGIC)
  ========================================================= */

  const addVariant = useCallback(() => {
    const newVariant: VariantUI = {
      clientId: crypto.randomUUID(),
      name: "",
      priceAdjustment: null,

      // default logic removed
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
        variants: prev.variants.map((variant) =>
          getKey(variant) === key
            ? {
                ...variant,
                [field]: value,
              }
            : variant
        ),
      }));
    },
    []
  );

  const removeVariant = useCallback((key: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        getKey(variant) === key
          ? {
              ...variant,
              isDeleted: true,
            }
          : variant
      ),
    }));
  }, []);

  /* =========================================================
     IMAGE SAFETY ONLY
     (Variant default safety removed)
  ========================================================= */

  const ensurePrimary = useCallback((images: ImageUI[]) => {
    const active = images.filter((img) => !img.isDeleted);

    if (!active.length) return images;

    const alreadyHasPrimary = active.some((img) => img.isPrimary);

    if (alreadyHasPrimary) return images;

    const firstKey = getKey(active[0]);

    return images.map((img) => ({
      ...img,
      isPrimary: getKey(img) === firstKey,
    }));
  }, []);

  /* =========================================================
     BUILD PAYLOAD
  ========================================================= */

  const buildPayload = useCallback((): FurnitureFormPayload => {
    const safeImages = ensurePrimary(form.images);

    return {
      name: form.name,
      description: form.description || undefined,
      categoryId: form.categoryId || undefined,

      basePrice: form.basePrice ?? 0,

      modelFile: form.modelFile,

      images: safeImages.map((img) => ({
        id: img.id,
        image_url: img.url,
        isPrimary: img.isPrimary,
        file: img.file,
        isDeleted: img.isDeleted,
      })),

      variants: form.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        priceAdjustment: variant.priceAdjustment ?? 0,

        // always false now since default system removed
        isDefault: false,

        isActive: variant.isActive,
        materialFile: variant.materialFile,
        isDeleted: variant.isDeleted,
      })),

      dimensions: {
        widthCm: form.widthCm ?? undefined,
        depthCm: form.depthCm ?? undefined,
        heightCm: form.heightCm ?? undefined,
      },
    };
  }, [form, ensurePrimary]);

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

    buildPayload,
    resetForm,
  };
}