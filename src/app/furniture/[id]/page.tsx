"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useFurniturePublicById } from "@/hooks/useFurnitureById";

import Furniture3DViewer from "@/app/components/Furniture3DViewer";
import BasicInfoSection from "@/app/components/sections/user/BasicInfoSection";
import AssetsSection from "@/app/components/sections/user/AssetsSection";
import VariantsSection from "@/app/components/sections/user/VariantSection";
import PlaceOrderModal from "@/app/components/PlaceOrderModal";

export default function FurnitureDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = params?.id as string;

  const { data: furniture, isLoading, isError } =
    useFurniturePublicById(id);

  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [previewVariantId, setPreviewVariantId] = useState<string | null>(null);

  /* =========================================================
     GUARD (CRITICAL)
  ========================================================= */

  const safeFurniture = furniture ?? null;

  /* =========================================================
     DERIVED VARIANT (SAFE)
  ========================================================= */

  const previewVariant = useMemo(() => {
    if (!safeFurniture || !previewVariantId) return null;

    return safeFurniture.variants.find(
      (v) => v.id === previewVariantId
    ) ?? null;
  }, [safeFurniture, previewVariantId]);

  const modelUrl = safeFurniture?.model_url ?? null;
  const textureUrl = previewVariant?.texture_url ?? null;

  /* =========================================================
     DIMENSIONS (SAFE MEMO)
  ========================================================= */

  const dimensions = useMemo(() => {
    if (!safeFurniture?.dimensions) {
      return {
        width_cm: null,
        depth_cm: null,
        height_cm: null,
      };
    }

    return {
      width_cm: safeFurniture.dimensions.width_cm ?? null,
      depth_cm: safeFurniture.dimensions.depth_cm ?? null,
      height_cm: safeFurniture.dimensions.height_cm ?? null,
    };
  }, [safeFurniture]);

  /* =========================================================
     IMAGES (SAFE)
  ========================================================= */

  const images = useMemo(() => {
    if (!safeFurniture?.images) return [];

    return safeFurniture.images.map((img) => ({
      id: img.id,
      clientId: img.id,
      url: img.image_url,
      isPrimary: img.is_primary,
    }));
  }, [safeFurniture]);

  /* =========================================================
     VARIANTS (SAFE)
  ========================================================= */

  const variants = useMemo(() => {
    if (!safeFurniture?.variants) return [];

    return safeFurniture.variants.map((v) => ({
      id: v.id,
      clientId: v.id,
      name: v.name,
      texture_url: v.texture_url,
      previewUrl: v.preview_image_url ?? "",
      priceAdjustment: Number(v.price_adjustment ?? 0),
      isActive: v.is_active,
      isDeleted: false,
      isDefault: Boolean(v.is_default),
    }));
  }, [safeFurniture]);

  /* =========================================================
     LOADING STATES
  ========================================================= */

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F1] text-[#3A2B22]">
        Loading furniture...
      </div>
    );
  }

  if (isError || !safeFurniture) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-semibold">
        Furniture not found
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#FAF6F1] text-[#3A2B22] flex flex-col">

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#FAF6F1]/80 backdrop-blur border-b border-[#E8D7C8] px-6 py-3">
        <button
          onClick={() => router.back()}
          className="text-sm text-[#7A4E2D] hover:underline"
        >
          ← Back to catalog
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT */}
        <div className="relative min-h-[calc(100vh-56px)] bg-white flex items-center justify-center border-r border-[#E8D7C8]">

          {modelUrl ? (
            <div className="w-full h-full">
              <Furniture3DViewer
                modelUrl={modelUrl}
                selectedVariantTextureUrl={textureUrl}
                dimensions={dimensions}
              />
            </div>
          ) : (
            <div className="text-[#7A6A5A]">
              No 3D model available
            </div>
          )}

        </div>

        {/* RIGHT */}
        <div className="relative h-[calc(100vh-56px)] flex flex-col border-l border-[#E8D7C8]">

          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">

            <div className="rounded-2xl bg-white border border-[#E8D7C8] p-5">
              <BasicInfoSection
                state={{
                  name: safeFurniture.name,
                  description: safeFurniture.description ?? "",
                  categoryId: safeFurniture.category?.id ?? null,
                  basePrice: safeFurniture.base_price,
                  widthCm: safeFurniture.dimensions?.width_cm,
                  depthCm: safeFurniture.dimensions?.depth_cm,
                  heightCm: safeFurniture.dimensions?.height_cm,
                }}
                categories={[
                  {
                    id: safeFurniture.category?.id ?? "",
                    name: safeFurniture.category?.name ?? "Uncategorized",
                  } as any,
                ]}
              />
            </div>

            <div className="rounded-2xl bg-white border border-[#E8D7C8] p-5">
              <AssetsSection state={{ images }} />
            </div>

            <div className="rounded-2xl bg-white border border-[#E8D7C8] p-5">
              <VariantsSection
                variants={variants}
                activeVariantId={previewVariantId}
                onApplyVariant={setPreviewVariantId}
              />
            </div>

            <div className="h-24" />
          </div>

          {/* CTA */}
          <div className="sticky bottom-0 border-t border-[#E8D7C8] bg-[#FAF6F1]/95 backdrop-blur p-4">
            <button
              onClick={() => setOpenOrderModal(true)}
              className="w-full rounded-2xl bg-[#7A4E2D] py-4 font-semibold text-white shadow-md hover:bg-[#663D22] transition"
            >
              Add to Order
            </button>
          </div>

        </div>
      </div>

      {/* MODAL */}
      <PlaceOrderModal
        open={openOrderModal}
        onClose={() => setOpenOrderModal(false)}
        furniture={safeFurniture}
      />
    </div>
  );
}