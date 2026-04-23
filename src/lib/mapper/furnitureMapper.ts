import type { FurnitureItemAdmin } from "@/types/furniture";
import type { ImageUI, VariantUI } from "@/types/furniture-ui";

export function mapFurnitureToEditForm(item: FurnitureItemAdmin) {
  return {
    id: item.id,

    name: item.name,
    description: item.description ?? "",
    categoryId: item.category_id ?? "",
    basePrice: item.base_price,

    modelFile: undefined,

    dimensions: {
      widthCm: item.width_cm ?? null,
      depthCm: item.depth_cm ?? null,
      heightCm: item.height_cm ?? null,
    },

    images: (item.furniture_images ?? [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(
        (img): ImageUI => ({
          id: img.id,
          url: img.image_url,
          isPrimary: !!img.is_primary,
        })
      ),

    variants: (item.furniture_variants ?? [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(
        (v): VariantUI => ({
          id: v.id,
          name: v.name,
          priceAdjustment: v.price_adjustment ?? 0,
          isDefault: !!v.is_default,
          isActive: !!v.is_active,
          previewUrl: v.preview_image_url ?? v.texture_url ?? undefined,
        })
      ),
  };
}