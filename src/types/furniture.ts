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
   ADMIN VIEW MODEL (JOINED)
========================================================= */

export type FurnitureItemAdmin = FurnitureDB & {
  furniture_categories?: FurnitureCategory | null;
  furniture_images?: FurnitureImage[];
  furniture_variants?: FurnitureVariant[];
};

/* =========================================================
   IMAGE PAYLOAD (MERGE ENGINE)
========================================================= */

export type FurnitureImagePayload = {
  id?: string;                 // existing image id
  file?: File;                 // new upload
  image_url?: string;          // optional existing url reference

  isPrimary?: boolean;
  isDeleted?: boolean;         // soft delete instruction
};

/* =========================================================
   VARIANT PAYLOAD (MERGE ENGINE)
========================================================= */

export type FurnitureVariantPayload = {
  id?: string;                 // existing variant id

  name: string;

  materialFile?: File;         // optional update upload

  priceAdjustment?: number;
  isActive?: boolean;
  isDefault?: boolean;

  sortOrder?: number;

  isDeleted?: boolean;         // selective delete
};

/* =========================================================
   FORM PAYLOAD (API LAYER)
========================================================= */

export type FurnitureFormPayload = {
  name: string;
  description?: string;

  categoryId?: string;

  basePrice: number;

  modelFile?: File | null;

  images: FurnitureImagePayload[];     // MERGE CAPABLE
  variants?: FurnitureVariantPayload[]; // MERGE CAPABLE

  dimensions?: {
    widthCm?: number;
    depthCm?: number;
    heightCm?: number;
  };
};

/* =========================================================
   UI IMAGE TYPE (FRONTEND STATE ONLY)
========================================================= */

export type ImageItem = {
  id?: string;
  file?: File;
  url: string;

  isPrimary: boolean;
  isDeleted?: boolean;
};