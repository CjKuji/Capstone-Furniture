"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Cpu, Maximize2 } from "lucide-react";

import { useFurniturePublicById } from "@/hooks/useFurnitureById";

import Navbar from "@/app/components/Navbar";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";
import BasicInfoSection from "@/app/components/sections/user/BasicInfoSection";
import AssetsSection from "@/app/components/sections/user/AssetsSection";
import VariantsSection from "@/app/components/sections/user/VariantSection";
import PlaceOrderModal from "@/app/components/PlaceOrderModal";
import Reveal from "@/app/components/Reveal";
import PageTransition from "@/app/components/PageTransition";

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
      <div className="bg-[#0F0A06] min-h-screen">
        <Navbar />
        <div className="flex h-[calc(100vh-64px)]">
          {/* left skeleton */}
          <div className="hidden lg:flex flex-1 justify-center items-center border-white/5 border-r">
            <div className="bg-white/5 rounded-full w-64 h-64 animate-pulse" />
          </div>
          {/* right skeleton */}
          <div className="flex-1 space-y-5 p-8 lg:max-w-md xl:max-w-lg">
            <div className="bg-white/5 rounded-full w-24 h-3 animate-pulse" />
            <div className="bg-white/5 rounded-full w-2/3 h-7 animate-pulse" />
            <div className="bg-white/5 rounded-full w-1/3 h-4 animate-pulse" />
            <div className="bg-white/5 rounded-xl h-20 animate-pulse" />
            <div className="gap-3 grid grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl h-24 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !safeFurniture) {
    return (
      <div className="flex flex-col bg-[#0F0A06] min-h-screen">
        <Navbar />
        <div className="flex flex-col flex-1 justify-center items-center gap-4">
          <p className="text-white/60 text-sm">This item could not be found.</p>
          <button
            onClick={() => router.push("/catalog")}
            className="flex items-center gap-2 px-5 py-2 border border-white/10 hover:border-[#D4A97A]/40 rounded-full text-white text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to catalog
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  const primaryImage = safeFurniture.images?.find((i) => i.is_primary)?.image_url
    ?? safeFurniture.images?.[0]?.image_url
    ?? null;

  return (
    <PageTransition>
    <div className="flex flex-col bg-[#0F0A06] min-h-screen text-white">
      <Navbar />

      {/* breadcrumb */}
      <div className="border-white/5 border-b">
        <div className="flex items-center gap-2 mx-auto px-4 sm:px-6 py-3 max-w-7xl text-white/30 text-xs">
          <button onClick={() => router.push("/catalog")} className="hover:text-[#D4A97A] transition">
            Catalog
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="max-w-xs text-white/50 truncate">{safeFurniture.name}</span>
        </div>
      </div>

      {/* MAIN SPLIT */}
      <div className="flex lg:flex-row flex-col gap-6 mx-auto px-4 sm:px-6 py-6 w-full max-w-7xl">

        {/* LEFT — viewer + gallery */}
        <div className="flex flex-col flex-1 gap-4">

          {/* 3D / image viewer card */}
          <div className="relative bg-[#0A0705] border border-white/5 rounded-2xl overflow-hidden" style={{ height: '520px' }}>
            {/* category pill */}
            {safeFurniture.category?.name && (
              <div className="top-4 left-4 z-10 absolute">
                <span className="bg-black/60 backdrop-blur-sm px-3 py-1 border border-white/10 rounded-full font-medium text-[11px] text-white/50 capitalize">
                  {safeFurniture.category.name}
                </span>
              </div>
            )}

            {modelUrl ? (
              <div className="absolute inset-0">
                <Furniture3DViewer
                  modelUrl={modelUrl}
                  selectedVariantTextureUrl={textureUrl}
                  dimensions={dimensions}
                />
              </div>
            ) : primaryImage ? (
              <div className="absolute inset-0 flex justify-center items-center p-8">
                <img
                  src={primaryImage}
                  alt={safeFurniture.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col justify-center items-center gap-3 text-white/20">
                <Cpu className="w-12 h-12" />
                <p className="text-sm">No preview available</p>
              </div>
            )}

            {/* 3D badge */}
            {modelUrl && (
              <div className="right-4 bottom-4 absolute flex items-center gap-1.5 bg-[#D4A97A]/10 px-3 py-1.5 border border-[#D4A97A]/20 rounded-full text-[#D4A97A] text-[11px]">
                <Maximize2 className="w-3 h-3" /> 3D Interactive
              </div>
            )}
          </div>

          {/* 3D controls hint */}
          {modelUrl && (
            <div className="flex justify-center items-center gap-6 bg-white/[0.03] px-5 py-3 border border-white/5 rounded-2xl text-white/30 text-xs">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                </svg>
                Drag to rotate
              </span>
              <span className="bg-white/10 w-px h-3" />
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
                Scroll to zoom
              </span>
              <span className="bg-white/10 w-px h-3" />
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Right-click to pan
              </span>
            </div>
          )}

          {/* gallery below viewer */}
          {images.length > 0 && (
            <div className="bg-white/[0.03] p-5 border border-white/5 rounded-2xl">
              <AssetsSection state={{ images }} />
            </div>
          )}
        </div>

        {/* RIGHT — info panel */}
        <div className="flex flex-col gap-4 lg:w-[390px] xl:w-[440px] shrink-0">

          {/* name + price */}
          <Reveal delay={0.05}>
          <div className="space-y-1">
            <h1 className="font-bold text-white text-2xl leading-tight">{safeFurniture.name}</h1>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="font-semibold text-[#D4A97A] text-2xl">
                ₱{Number(safeFurniture.base_price ?? 0).toLocaleString()}
              </span>
              <span className="text-white/30 text-xs">starting price</span>
            </div>
          </div>
          </Reveal>

          {/* about */}
          <Reveal delay={0.12}>
          <div className="bg-white/[0.03] p-5 border border-white/5 rounded-2xl">
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
          </Reveal>

          {/* variants */}
          {variants.length > 0 && (
            <Reveal delay={0.2}>
            <div className="bg-white/[0.03] p-5 border border-white/5 rounded-2xl">
              <VariantsSection
                variants={variants}
                activeVariantId={previewVariantId}
                onApplyVariant={setPreviewVariantId}
              />
            </div>
            </Reveal>
          )}

          {/* CTA */}
          <Reveal delay={0.28}>
          <button
            onClick={() => setOpenOrderModal(true)}
            className="bg-[#D4A97A] hover:bg-[#C4976A] shadow-lg mt-auto py-4 rounded-full w-full font-bold text-[#1C1209] text-sm active:scale-[0.99] transition-all"
          >
            Customize & Order
          </button>
          </Reveal>
        </div>
      </div>

      {/* MODAL */}
      <PlaceOrderModal
        open={openOrderModal}
        onClose={() => setOpenOrderModal(false)}
        furniture={safeFurniture}
      />
    </div>
    </PageTransition>
  );
}