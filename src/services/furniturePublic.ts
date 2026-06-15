import { supabase } from "@/lib/supabase";

import type {
  FurniturePublicListItem,
  FurniturePublicDetail,
  FurnitureCategoryPublic,
  FurnitureImagePublic,
  FurnitureVariantPublic,
} from "@/types/furniture-public";

/* =========================================================
   LIST: ALL FURNITURE (PUBLIC)
   - lightweight but enriched (counts included)
========================================================= */

export async function getFurniturePublic(): Promise<FurniturePublicListItem[]> {
  const { data, error } = await supabase
    .from("furniture")
    .select(`
      id,
      name,
      slug,
      description,
      base_price,
      width_cm,
      depth_cm,
      height_cm,
      model_url,
      created_at,

      furniture_categories (
        id,
        name
      ),

      furniture_images (
        id,
        image_url,
        is_primary,
        sort_order
      ),

      furniture_variants (
        id,
        is_active
      )
    `)
    .is("deleted_at", null)
    .eq("publish_status", "published") // Ensures only public facing catalog items show
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item: any): FurniturePublicListItem => {
    const images = item.furniture_images ?? [];

    // Find primary image or fallback to the lowest sort order asset
    const primary =
      images.find((i: any) => i.is_primary)?.image_url ||
      [...images].sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.image_url ||
      null;

    // Direct object alignment instead of array mapping bugs
    const categoryData = item.furniture_categories;
    const category: FurnitureCategoryPublic | null = categoryData
      ? { id: categoryData.id, name: categoryData.name }
      : null;

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      base_price: Number(item.base_price),

      width_cm: item.width_cm ? Number(item.width_cm) : null,
      depth_cm: item.depth_cm ? Number(item.depth_cm) : null,
      height_cm: item.height_cm ? Number(item.height_cm) : null,

      created_at: item.created_at,

      category,

      thumbnail_url: primary,

      imageCount: images.length,

      variantCount:
        item.furniture_variants?.filter((v: any) => v.is_active).length ?? 0,

      hasModel: !!item.model_url,
    };
  });
}

/* =========================================================
   DETAIL: FURNITURE BY ID (PUBLIC)
   - full UI data
========================================================= */

export async function getFurniturePublicById(
  id: string
): Promise<FurniturePublicDetail> {
  const { data, error } = await supabase
    .from("furniture")
    .select(`
      id,
      name,
      slug,
      description,
      base_price,
      width_cm,
      depth_cm,
      height_cm,
      model_url,

      furniture_categories (
        id,
        name
      ),

      furniture_images (
        id,
        image_url,
        is_primary,
        sort_order
      ),

      furniture_variants (
        id,
        name,
        texture_url,
        preview_image_url,
        price_adjustment,
        is_default,
        is_active,
        sort_order
      )
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Furniture not found");

  return transformFurniturePublic(data);
}

/* =========================================================
   TRANSFORMER (DETAIL SHAPE)
========================================================= */

function transformFurniturePublic(item: any): FurniturePublicDetail {
  const categoryData = item.furniture_categories;
  const category: FurnitureCategoryPublic | null = categoryData
    ? { id: categoryData.id, name: categoryData.name }
    : null;

  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    base_price: Number(item.base_price),

    model_url: item.model_url,

    dimensions: {
      width_cm: item.width_cm ? Number(item.width_cm) : null,
      depth_cm: item.depth_cm ? Number(item.depth_cm) : null,
      height_cm: item.height_cm ? Number(item.height_cm) : null,
    },

    category,

    images: (item.furniture_images ?? [])
      .map((img: any): FurnitureImagePublic => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: !!img.is_primary,
        sort_order: img.sort_order ?? 0,
      }))
      .sort((a: FurnitureImagePublic, b: FurnitureImagePublic) => a.sort_order - b.sort_order),

    variants: (item.furniture_variants ?? [])
      .filter((v: any) => v.is_active)
      .map((v: any): FurnitureVariantPublic => ({
        id: v.id,
        name: v.name,
        texture_url: v.texture_url,
        preview_image_url: v.preview_image_url,
        price_adjustment: Number(v.price_adjustment ?? 0),
        is_default: !!v.is_default,
        is_active: !!v.is_active,
        sort_order: v.sort_order ?? 0,
      }))
      .sort((a: FurnitureVariantPublic, b: FurnitureVariantPublic) => a.sort_order - b.sort_order),
  };
}