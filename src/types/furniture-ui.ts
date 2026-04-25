import type { PublishStatus } from "./enums";

/* =========================================================
   DATABASE TYPES
========================================================= */

export type FurnitureDB = {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  category_id: string | null;
  model_url: string | null;

  base_price: number;
  publish_status: PublishStatus;

  created_by: string | null;

  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;

  created_at: string;
  updated_at: string;
};

/* =========================================================
   CATEGORY
========================================================= */

export type FurnitureCategory = {
  id: string;
  name: string;
};

/* =========================================================
   IMAGE (DB)
========================================================= */

export type FurnitureImage = {
  id: string;
  furniture_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
};

/* =========================================================
   VARIANT (DB)
========================================================= */

export type FurnitureVariant = {
  id: string;
  furniture_id: string;

  name: string;

  texture_url: string;
  preview_image_url: string | null;

  price_adjustment: number;

  is_active: boolean;
  is_default: boolean;

  sort_order: number;

  created_at: string;
};

/* =========================================================
   ADMIN VIEW MODEL
========================================================= */

export type FurnitureItemAdmin = FurnitureDB & {
  furniture_categories?: FurnitureCategory | null;
  furniture_images?: FurnitureImage[];
  furniture_variants?: FurnitureVariant[];
};

/* =========================================================
   IMAGE PAYLOAD (FORM LAYER)
   → normalized for UI + API merge engine
========================================================= */

export type FurnitureImagePayload = {
  id?: string;

  file?: File;

  image_url?: string;

  isPrimary?: boolean;
  isDeleted?: boolean;
};

/* =========================================================
   VARIANT PAYLOAD (FORM LAYER)
   → matches UI + controller expectations
========================================================= */

export type FurnitureVariantPayload = {
  id?: string;

  name: string;

  materialFile?: File;

  priceAdjustment?: number | null;

  isActive?: boolean;
  isDefault?: boolean;

  sortOrder?: number;

  isDeleted?: boolean;
};

/* =========================================================
   VARIANT INSERT (DB WRITE FORMAT)
========================================================= */

export type FurnitureVariantInsert = {
  furniture_id: string;
  name: string;
  texture_url: string | null;
  preview_image_url: string | null;
  price_adjustment: number;
  is_active: boolean;
  sort_order: number;
};

/* =========================================================
   FORM PAYLOAD (API CONTRACT)
   ✔ STRICT + CONSISTENT
========================================================= */

export type FurnitureFormPayload = {
  name: string;
  description?: string;

  categoryId?: string;

  basePrice: number;

  modelFile?: File | null;

  images: FurnitureImagePayload[];

  variants: FurnitureVariantPayload[];

  dimensions: {
    widthCm: number;
    depthCm: number;
    heightCm: number;
  };
};

/* =========================================================
   UI TYPES (FRONTEND ONLY STATE)
========================================================= */

export type ImageUI = {
  id?: string;
  clientId: string;

  file?: File;
  url: string;

  isPrimary: boolean;
  isDeleted?: boolean;
};

/* ========================================================= */

export type VariantUI = {
  id?: string;
  clientId: string;

  name: string;

  priceAdjustment: number | null;

  isDefault: boolean;
  isActive: boolean;

  materialFile?: File;
  previewUrl?: string;

  isDeleted?: boolean;

  sortOrder?: number;
};

/* =========================================================
   LIST ITEM (UI TABLE)
========================================================= */

export type FurnitureListItem = {
  id: string;
  name: string;
  slug: string;

  base_price: number;
  publish_status: PublishStatus;

  category_id: string | null;

  thumbnail_url?: string | null;

  created_at: string;
};