import type { PublishStatus } from "./enums";

/* =========================================================
   CATEGORY (PUBLIC)
========================================================= */

export type FurnitureCategoryPublic = {
  id: string;
  name: string;
};

/* =========================================================
   IMAGE (DETAIL ONLY)
========================================================= */

export type FurnitureImagePublic = {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
};

/* =========================================================
   VARIANT (DETAIL ONLY)
========================================================= */

export type FurnitureVariantPublic = {
  id: string;
  name: string;

  texture_url: string;
  preview_image_url: string | null;

  price_adjustment: number;

  is_default: boolean;
  is_active: boolean;

  sort_order: number;
};

/* =========================================================
   LIST ITEM (MATCHES YOUR SERVICE OUTPUT)
========================================================= */

export type FurniturePublicListItem = {
  id: string;
  name: string;
  slug: string;

  description: string | null;

  base_price: number;

  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;

  created_at: string;

  /* =====================================================
     🔥 DERIVED FIELDS FROM SERVICE
  ====================================================== */

  category: FurnitureCategoryPublic | null;

  imageCount: number;
  variantCount: number;
  hasModel: boolean;
};

/* =========================================================
   DETAIL VIEW MODEL (FULL PAGE)
========================================================= */

export type FurniturePublicDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  base_price: number;

  model_url: string | null;

  dimensions: {
    width_cm: number | null;
    depth_cm: number | null;
    height_cm: number | null;
  };

  category: FurnitureCategoryPublic | null;

  images: FurnitureImagePublic[];

  variants: FurnitureVariantPublic[];
};

/* =========================================================
   OPTIONAL CARD MODEL (future optimization layer)
========================================================= */

export type FurniturePublicCard = {
  id: string;
  name: string;
  slug: string;

  base_price: number;

  thumbnail_url: string | null;

  category: FurnitureCategoryPublic | null;
};

/* =========================================================
   FILTERS (UI + API READY)
========================================================= */

export type FurniturePublicFilters = {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};