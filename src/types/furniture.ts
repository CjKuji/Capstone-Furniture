import type { PublishStatus } from "./enums";
import type { ARReadiness } from "./modelValidation";

/* =========================================================
   DATABASE CORE TABLE (READ ONLY - CAN USE NULL)
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

  model_ar_status: ARReadiness | null;  // Step 10

  created_at: string;
  updated_at: string;
};

/* =========================================================
   CATEGORY TABLE
========================================================= */

export type FurnitureCategory = {
  id: string;
  name: string;
};

/* =========================================================
   IMAGE TABLE
========================================================= */

export type FurnitureImage = {
  id: string;
  furniture_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
};

/* =========================================================
   VARIANT TABLE (READ TYPE - DB SAFE)
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
   UI / ADMIN MODEL
========================================================= */

export type FurnitureItemAdmin = FurnitureDB & {
  category: FurnitureCategory | null;
  images: FurnitureImage[];
  variants: FurnitureVariant[];
};

/* =========================================================
   LIST ITEM
========================================================= */

export type FurnitureListItem = {
  id: string;
  name: string;
  slug: string;

  base_price: number;
  publish_status: PublishStatus;

  category_id: string | null;

  thumbnail_url: string | null;

  created_at: string;
};

/* =========================================================
   IMAGE PAYLOAD (UI STATE)
========================================================= */

export type FurnitureImagePayload = {
  id?: string;
  file?: File;
  image_url?: string;

  isPrimary?: boolean;
  isDeleted?: boolean;
};

/* =========================================================
   VARIANT PAYLOAD (UI STATE)
========================================================= */

export type FurnitureVariantPayload = {
  id?: string;

  name: string;

  materialFile?: File;

  priceAdjustment?: number;

  isActive?: boolean;
  isDefault?: boolean;

  sortOrder?: number;

  isDeleted?: boolean;
};

/* =========================================================
   🔥 VARIANT INSERT TYPE (WRITE SAFE - NO NULL)
========================================================= */

export type FurnitureVariantInsert = {
  furniture_id: string;
  name: string;

  texture_url?: string;         // ✅ FIXED (NO NULL)
  preview_image_url?: string;   // ✅ FIXED (NO NULL)

  price_adjustment: number;
  is_active: boolean;
  sort_order: number;
};

/* =========================================================
   OPTIONAL: UPDATE TYPE (SAFE)
========================================================= */

export type FurnitureVariantUpdate = Partial<{
  name: string;
  texture_url: string;
  preview_image_url: string;
  price_adjustment: number;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
}>;

/* =========================================================
   FORM PAYLOAD
========================================================= */

export type FurnitureFormPayload = {
  name: string;
  description?: string;

  categoryId?: string;

  basePrice: number;

  modelFile?: File | null;

  images: FurnitureImagePayload[];
  variants?: FurnitureVariantPayload[];

  dimensions: {
    widthCm: number;
    depthCm: number;
    heightCm: number;
  };
};