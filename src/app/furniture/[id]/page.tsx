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

  const {
    data: furniture,
    isLoading,
    isError,
  } = useFurniturePublicById(id);

  /* =========================================================
     MODAL STATE
  ========================================================= */

  const [openOrderModal, setOpenOrderModal] =
    useState(false);

  /* =========================================================
     3D PREVIEW STATE
  ========================================================= */

  const [previewVariantId, setPreviewVariantId] =
    useState<string | null>(null);

  /* =========================================================
     ACTIVE VARIANT
  ========================================================= */

  const previewVariant = useMemo(() => {
    if (!furniture || !previewVariantId) {
      return null;
    }

    return furniture.variants.find(
      (v) => v.id === previewVariantId
    );
  }, [furniture, previewVariantId]);

  /* =========================================================
     MODEL + TEXTURE
  ========================================================= */

  const modelUrl =
    furniture?.model_url ?? null;

  const textureUrl =
    previewVariant?.texture_url ?? null;

  /* =========================================================
     DIMENSIONS
     IMPORTANT:
     Passed into 3D viewer for real-world scaling
  ========================================================= */

  const dimensions = useMemo(() => {
    return {
      width_cm:
        furniture?.dimensions?.width_cm ?? null,

      depth_cm:
        furniture?.dimensions?.depth_cm ?? null,

      height_cm:
        furniture?.dimensions?.height_cm ?? null,
    };
  }, [furniture]);

  /* =========================================================
     BASIC INFO
  ========================================================= */

  const basicInfoState = furniture
    ? {
        name: furniture.name,

        description:
          furniture.description ?? "",

        categoryId:
          furniture.category?.id ?? null,

        basePrice: furniture.base_price,

        widthCm:
          furniture.dimensions?.width_cm,

        depthCm:
          furniture.dimensions?.depth_cm,

        heightCm:
          furniture.dimensions?.height_cm,
      }
    : null;

  /* =========================================================
     IMAGES
  ========================================================= */

  const images = (
    furniture?.images ?? []
  ).map((img) => ({
    id: img.id,

    clientId: img.id,

    url: img.image_url,

    isPrimary: img.is_primary,
  }));

  /* =========================================================
     VARIANTS
  ========================================================= */

  const variants = (
    furniture?.variants ?? []
  ).map((v) => ({
    id: v.id,

    clientId: v.id,

    name: v.name,

    texture_url: v.texture_url,

    previewUrl:
      v.preview_image_url ?? "",

    priceAdjustment: Number(
      v.price_adjustment ?? 0
    ),

    isActive: v.is_active,

    isDeleted: false,

    isDefault: Boolean(v.is_default),
  }));

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading) {
    return (
      <div className="py-20 text-center font-semibold">
        Loading...
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (isError || !furniture) {
    return (
      <div className="py-20 text-center font-semibold text-red-600">
        Furniture not found
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6">
      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-[#8C593F] hover:underline"
      >
        ← Back
      </button>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ===================================================
            LEFT: 3D VIEWER
        =================================================== */}

        <div className="flex min-h-[500px] items-center justify-center rounded-2xl bg-white p-4 shadow">
          {modelUrl ? (
            <div className="w-full">
              {/* =============================================
                  3D VIEWER
              ============================================= */}

              <Furniture3DViewer
                modelUrl={modelUrl}
                selectedVariantTextureUrl={
                  textureUrl
                }
                dimensions={dimensions}
              />

              {/* =============================================
                  DEBUG DIMENSIONS
                  TEMPORARY FOR SCALE TESTING
              ============================================= */}

              <div className="mt-3 space-y-1 text-xs text-neutral-500">
                <div>
                  Width:{" "}
                  {dimensions.width_cm ?? 0} cm
                </div>

                <div>
                  Height:{" "}
                  {dimensions.height_cm ?? 0} cm
                </div>

                <div>
                  Depth:{" "}
                  {dimensions.depth_cm ?? 0} cm
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">
              No 3D model available
            </div>
          )}
        </div>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <div className="max-h-[85vh] space-y-6 overflow-y-auto pr-2">
          {/* ===============================================
              BASIC INFO
          =============================================== */}

          {basicInfoState && (
            <BasicInfoSection
              state={basicInfoState}
              categories={[
                {
                  id:
                    furniture.category?.id ?? "",

                  name:
                    furniture.category?.name ??
                    "Uncategorized",
                } as any,
              ]}
            />
          )}

          {/* ===============================================
              IMAGES
          =============================================== */}

          <AssetsSection
            state={{ images }}
          />

          {/* ===============================================
              VARIANTS
          =============================================== */}

          <VariantsSection
            variants={variants}
            activeVariantId={
              previewVariantId
            }
            onApplyVariant={
              setPreviewVariantId
            }
          />

          {/* ===============================================
              ORDER BUTTON
          =============================================== */}

          <button
            onClick={() =>
              setOpenOrderModal(true)
            }
            className="w-full rounded-xl bg-[#8C593F] py-3 font-semibold text-white"
          >
            Add to Order
          </button>
        </div>
      </div>

      {/* =====================================================
          ORDER MODAL
      ===================================================== */}

      <PlaceOrderModal
        open={openOrderModal}
        onClose={() =>
          setOpenOrderModal(false)
        }
        furniture={furniture}
      />
    </div>
  );
}