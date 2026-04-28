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

  const [activeVariantId, setActiveVariantId] =
    useState<string | null>(null);

  const [openOrderModal, setOpenOrderModal] =
    useState(false);

  const {
    data: furniture,
    isLoading,
    isError,
  } = useFurniturePublicById(id);

  /*
  =========================================================
  HOOKS FIRST (SAFE)
  =========================================================
  */

  const selectedVariant = useMemo(() => {
    if (!furniture) return null;

    return (
      furniture.variants?.find(
        (variant) => variant.id === activeVariantId
      ) ?? null
    );
  }, [activeVariantId, furniture]);

  /*
  =========================================================
  EARLY RETURNS
  =========================================================
  */

  if (isLoading) {
    return (
      <div className="text-center py-20 font-semibold">
        Loading...
      </div>
    );
  }

  if (isError || !furniture) {
    return (
      <div className="text-center py-20 text-red-600 font-semibold">
        Furniture not found
      </div>
    );
  }

  /*
  =========================================================
  SAFE DERIVED VALUES
  =========================================================
  */

  const modelUrl = furniture.model_url ?? null;

  const variantTexture =
    activeVariantId === null
      ? null
      : selectedVariant?.texture_url ?? null;

  const categoryName =
    furniture.category?.name ?? "Uncategorized";

  const basicInfoState = {
    name: furniture.name,
    description: furniture.description ?? "",
    categoryId: furniture.category?.id ?? null,
    basePrice: furniture.base_price,
    widthCm: furniture.dimensions?.width_cm,
    depthCm: furniture.dimensions?.depth_cm,
    heightCm: furniture.dimensions?.height_cm,
  };

  const images = (furniture.images ?? []).map((img) => ({
    id: img.id,
    url: img.image_url,
    isPrimary: img.is_primary,
    clientId: img.id,
  }));

  const variants = (furniture.variants ?? []).map((variant) => ({
    id: variant.id,
    clientId: variant.id,
    name: variant.name,
    texture_url: variant.texture_url,
    previewUrl: variant.preview_image_url ?? "",
    priceAdjustment: variant.price_adjustment,
    isActive: variant.is_active,
    isDeleted: false,
    isDefault: variant.is_default ?? false,
  }));

  /*
  =========================================================
  UI
  =========================================================
  */

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-[#8C593F] hover:underline mb-4"
      >
        ← Back
      </button>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT SIDE */}
        <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-center min-h-[500px]">
          {modelUrl ? (
            <Furniture3DViewer
              modelUrl={modelUrl}
              selectedVariantTextureUrl={
                variantTexture
              }
            />
          ) : (
            <div className="text-gray-400">
              No 3D model available
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-2">
          <BasicInfoSection
            state={basicInfoState}
            categories={[
              {
                id: furniture.category?.id ?? "",
                name: categoryName,
              } as any,
            ]}
          />

          <AssetsSection
            state={{
              images,
            }}
          />

          <VariantsSection
            variants={variants}
            activeVariantId={activeVariantId}
            setActiveVariantId={
              setActiveVariantId
            }
          />

          <button
            onClick={() =>
              setOpenOrderModal(true)
            }
            className="w-full bg-[#8C593F] text-white py-3 rounded-xl font-semibold"
          >
            Place Order
          </button>
        </div>
      </div>

      {/* ORDER MODAL */}
      <PlaceOrderModal
        open={openOrderModal}
        onClose={() =>
          setOpenOrderModal(false)
        }
        furnitureId={furniture.id}
        variantId={selectedVariant?.id ?? null}
        furnitureName={furniture.name}
        basePrice={furniture.base_price ?? 0}
        selectedVariantName={
          selectedVariant?.name ?? null
        }
        variantPriceAdjustment={
          selectedVariant?.price_adjustment ?? 0
        }
      />
    </div>
  );
}