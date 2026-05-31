"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Cpu, Maximize2 } from "lucide-react";

import { useFurniturePublicById } from "@/hooks/useFurnitureById";
import { useAIChatContext } from "@/app/context/AIChatContext";

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

  const { data: furniture, isLoading, isError } = useFurniturePublicById(id);
  const { setFurnitureContext } = useAIChatContext();

  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [previewVariantId, setPreviewVariantId] = useState<string | null>(null);

  const safeFurniture = furniture ?? null;

  // Set furniture context for the global chatbot when data loads
  useEffect(() => {
    if (!safeFurniture) return;

    setFurnitureContext({
      name: safeFurniture.name,
      category: safeFurniture.category?.name,
      price: Number(safeFurniture.base_price ?? 0),
      width: safeFurniture.dimensions?.width_cm ?? undefined,
      depth: safeFurniture.dimensions?.depth_cm ?? undefined,
      height: safeFurniture.dimensions?.height_cm ?? undefined,
      description: safeFurniture.description ?? undefined,
    });

    // Clear context when leaving the page
    return () => setFurnitureContext(null);
  }, [safeFurniture, setFurnitureContext]);

  const previewVariant = useMemo(() => {
    if (!safeFurniture || !previewVariantId) return null;
    return safeFurniture.variants.find((v) => v.id === previewVariantId) ?? null;
  }, [safeFurniture, previewVariantId]);

  const modelUrl = safeFurniture?.model_url ?? null;
  const textureUrl = previewVariant?.texture_url ?? null;

  const dimensions = useMemo(() => {
    const d = safeFurniture?.dimensions;
    return {
      width_cm:  d?.width_cm  ?? null,
      depth_cm:  d?.depth_cm  ?? null,
      height_cm: d?.height_cm ?? null,
    };
  }, [safeFurniture]);

  const images = useMemo(() => {
    if (!safeFurniture?.images) return [];
    return safeFurniture.images.map((img) => ({
      id: img.id,
      clientId: img.id,
      url: img.image_url,
      isPrimary: img.is_primary,
    }));
  }, [safeFurniture]);

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

  if (isLoading) {
    return (
      <div className="bg-[#0F0A06] min-h-screen">
        <Navbar />
        <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)]">
          <div className="hidden lg:flex flex-1 justify-center items-center border-white/5 border-r">
            <div className="bg-white/5 rounded-full w-64 h-64 animate-pulse" />
          </div>
          <div className="lg:hidden w-full h-56 sm:h-72 bg-white/5 animate-pulse" />
          <div className="flex-1 space-y-5 p-4 sm:p-8 lg:max-w-md xl:max-w-lg overflow-y-auto">
            <div className="bg-white/5 rounded-full w-24 h-3 animate-pulse" />
            <div className="bg-white/5 rounded-full w-2/3 h-7 animate-pulse" />
            <div className="bg-white/5 rounded-full w-1/3 h-4 animate-pulse" />
            <div className="bg-white/5 rounded-xl h-20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !safeFurniture) {
    return (
      <div className="flex flex-col bg-[#0F0A06] min-h-screen">
        <Navbar />
        <div className="flex flex-col flex-1 justify-center items-center gap-4 px-4 text-center">
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

  const primaryImage =
    safeFurniture.images?.find((i) => i.is_primary)?.image_url ??
    safeFurniture.images?.[0]?.image_url ??
    null;

  return (
    <PageTransition>
      <div className="flex flex-col bg-[#0F0A06] h-screen max-h-screen overflow-hidden text-white">
        <Navbar />

        <div className="border-white/5 border-b flex-shrink-0">
          <div className="flex items-center gap-2 mx-auto px-4 sm:px-6 py-2.5 max-w-7xl text-white/30 text-[10px] sm:text-xs">
            <button
              onClick={() => router.push("/catalog")}
              className="hover:text-[#D4A97A] transition"
            >
              Catalog
            </button>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="max-w-[180px] sm:max-w-xs text-white/50 truncate">
              {safeFurniture.name}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 mx-auto px-4 sm:px-6 py-4 w-full max-w-7xl flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          <div className="flex flex-col flex-1 gap-3 min-h-[380px] lg:min-h-0 lg:h-full justify-between">
            <div className="relative flex-1 w-full bg-[#0A0705] border border-white/5 rounded-2xl overflow-hidden min-h-0">
              {safeFurniture.category?.name && (
                <div className="top-4 left-4 z-10 absolute">
                  <span className="bg-black/60 backdrop-blur-sm px-3 py-1 border border-white/10 rounded-full font-medium text-[11px] text-white/50 capitalize">
                    {safeFurniture.category.name}
                  </span>
                </div>
              )}

              {modelUrl ? (
                <div className="absolute inset-0 w-full h-full">
                  <Furniture3DViewer
                    modelUrl={modelUrl}
                    selectedVariantTextureUrl={textureUrl}
                    dimensions={dimensions}
                  />
                </div>
              ) : primaryImage ? (
                <div className="absolute inset-0 flex justify-center items-center p-6 sm:p-8">
                  <img
                    src={primaryImage}
                    alt={safeFurniture.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col justify-center items-center gap-3 text-white/20">
                  <Cpu className="w-10 h-10" />
                  <p className="text-xs">No preview available</p>
                </div>
              )}

              {modelUrl && (
                <div className="right-4 bottom-4 absolute flex items-center gap-1.5 bg-[#D4A97A]/10 px-3 py-1.5 border border-[#D4A97A]/20 rounded-full text-[#D4A97A] text-[11px]">
                  <Maximize2 className="w-3 h-3" /> 3D Interactive
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-[380px] xl:w-[440px] shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar pr-0 lg:pr-1">
            <Reveal delay={0.05}>
              <div className="space-y-1">
                <h1 className="font-bold text-white text-xl sm:text-2xl leading-tight">
                  {safeFurniture.name}
                </h1>
                <div className="flex items-baseline gap-2 pt-0.5">
                  <span className="font-semibold text-[#D4A97A] text-xl sm:text-2xl">
                    ₱{Number(safeFurniture.base_price ?? 0).toLocaleString()}
                  </span>
                  <span className="text-white/30 text-xs">starting price</span>
                </div>
              </div>
            </Reveal>

            {images.length > 0 && (
              <div className="bg-white/[0.02] p-4 border border-white/5 rounded-2xl">
                <AssetsSection state={{ images }} />
              </div>
            )}

            <Reveal delay={0.12}>
              <div className="bg-white/[0.02] p-4 border border-white/5 rounded-2xl">
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

            {variants.length > 0 && (
              <Reveal delay={0.2}>
                <div className="bg-white/[0.02] p-4 border border-white/5 rounded-2xl">
                  <VariantsSection
                    variants={variants}
                    activeVariantId={previewVariantId}
                    onApplyVariant={setPreviewVariantId}
                  />
                </div>
              </Reveal>
            )}

            <Reveal delay={0.28}>
              <div className="pt-2">
                <button
                  onClick={() => setOpenOrderModal(true)}
                  className="bg-[#D4A97A] hover:bg-[#C4976A] shadow-md py-4 rounded-full w-full font-bold text-[#1C1209] text-sm active:scale-[0.99] transition-all"
                >
                  Customize & Order
                </button>
              </div>
            </Reveal>
          </div>
        </div>

        <PlaceOrderModal
          open={openOrderModal}
          onClose={() => setOpenOrderModal(false)}
          furniture={safeFurniture}
        />
      </div>
    </PageTransition>
  );
}