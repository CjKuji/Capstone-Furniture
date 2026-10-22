"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Cpu, Maximize2, ShoppingCart, X } from "lucide-react";
import ImageLightbox from "@/app/components/ImageLightbox";

import { useFurniturePublicById } from "@/hooks/useFurnitureById";
import { useAIChatContext } from "@/app/context/AIChatContext";
import { useUser } from "@/hooks/useUser"; // ✅ Added to track authentication state

import Furniture3DViewer from "@/app/components/Furniture3DViewer";
import AuthRequiredModal from "@/app/components/AuthRequiredModal";
import BasicInfoSection from "@/app/components/sections/user/BasicInfoSection";
import AssetsSection from "@/app/components/sections/user/AssetsSection";
import VariantsSection from "@/app/components/sections/user/VariantSection";
import PlaceOrderModal from "@/app/components/PlaceOrderModal";
import Reveal from "@/app/components/Reveal";
import PageTransition from "@/app/components/PageTransition";

export default function FurnitureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { authUser } = useUser(); // ✅ Check if user session exists

  const id = params?.id as string;

  const { data: furniture, isLoading, isError } = useFurniturePublicById(id);
  const { setFurnitureContext } = useAIChatContext();

  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // ✅ Floating window control state
  const [previewVariantId, setPreviewVariantId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  const lightboxImages = useMemo(() => {
    return images.map((img) => ({ url: img.url, id: img.id }));
  }, [images]);

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

  const handleOrderClick = () => {
    // ── GUEST REDIRECT TRAP ──
    if (!authUser) {
      setShowAuthModal(true);
      return;
    }
    setOpenOrderModal(true);
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg)] h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          <div className="hidden lg:flex flex-1 justify-center items-center border-[var(--border)] border-r">
            <div className="bg-[var(--surface-alt)] rounded-full w-64 h-64 animate-pulse" />
          </div>
          <div className="lg:hidden w-full h-[34dvh] min-h-[220px] bg-[var(--surface-alt)] animate-pulse" />
          <div className="flex-1 min-h-0 space-y-5 p-4 sm:p-6 lg:max-w-md xl:max-w-lg overflow-y-auto">
            <div className="bg-[var(--surface-alt)] rounded-full w-24 h-3 animate-pulse" />
            <div className="bg-[var(--surface-alt)] rounded-full w-2/3 h-7 animate-pulse" />
            <div className="bg-[var(--surface-alt)] rounded-full w-1/3 h-4 animate-pulse" />
            <div className="bg-[var(--surface-alt)] rounded-xl h-20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !safeFurniture) {
    return (
      <div className="flex flex-col bg-[var(--bg)] h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] text-[var(--text)] overflow-hidden">
        <div className="flex flex-col flex-1 justify-center items-center gap-4 px-4 text-center">
          <p className="text-[var(--text-muted)] text-sm">This item could not be found.</p>
          <button
            onClick={() => router.push("/catalog")}
            className="flex items-center gap-2 min-h-11 px-5 py-2 border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)] rounded-xl text-[var(--primary)] text-sm transition"
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
      <div className="flex flex-col bg-[var(--bg)] h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden text-[var(--text)]">

        <div className="border-[var(--border)] border-b flex-shrink-0">
          <div className="flex items-center gap-2 mx-auto px-4 sm:px-6 py-2 max-w-7xl text-[var(--text-muted)] text-[10px] sm:text-xs">
            <button
              onClick={() => router.push("/catalog")}
              className="hover:text-[var(--primary)] transition"
            >
              Catalog
            </button>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="max-w-[180px] sm:max-w-xs text-[var(--text)] truncate">
              {safeFurniture.name}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-5 mx-auto px-3 sm:px-6 py-3 sm:py-4 w-full max-w-7xl flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col flex-1 min-h-[220px] h-[34dvh] max-h-[360px] shrink-0 lg:h-full lg:max-h-none lg:min-h-0">
            <div className="group relative flex-1 w-full bg-[var(--surface-alt)] border border-[var(--border)] rounded-2xl overflow-hidden min-h-0">
              {safeFurniture.category?.name && (
                <div className="top-4 left-4 z-10 absolute">
                  <span className="bg-[var(--surface)]/90 backdrop-blur-sm px-3 py-1 border border-[var(--border)] rounded-full font-medium text-[11px] text-[var(--text-muted)] capitalize">
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
                <div
                  className="absolute inset-0 flex justify-center items-center p-6 sm:p-8 cursor-zoom-in"
                  onClick={() => {
                    const primaryIndex = images.findIndex((img) => img.url === primaryImage);
                    setLightboxIndex(primaryIndex >= 0 ? primaryIndex : 0);
                    setLightboxOpen(true);
                  }}
                >
                  <img
                    src={primaryImage}
                    alt={safeFurniture.name}
                    className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-4 right-4 bg-[var(--surface)]/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text)] text-[11px] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3 h-3" />
                    Click to expand
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col justify-center items-center gap-3 text-[var(--text-muted)]">
                  <Cpu className="w-10 h-10 opacity-50" />
                  <p className="text-xs">No preview available</p>
                </div>
              )}

              {modelUrl && (
                <div className="right-4 bottom-4 absolute flex items-center gap-1.5 bg-[var(--surface)]/90 px-3 py-1.5 border border-[var(--border)] rounded-full text-[var(--primary)] text-[11px]">
                  <Maximize2 className="w-3 h-3" /> 3D Interactive
                </div>
              )}
            </div>
          </div>

          <div className="customer-furniture-info-scroll flex flex-col gap-3 sm:gap-4 w-full flex-1 min-h-0 lg:flex-none lg:w-[380px] xl:w-[440px] lg:h-full overflow-y-auto overscroll-contain pr-1">
            <Reveal delay={0.05} className="shrink-0">
              <div className="space-y-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                  Made to order
                </p>
                <h1 className="font-bold text-[var(--text)] text-2xl sm:text-3xl leading-tight">
                  {safeFurniture.name}
                </h1>
                <div className="flex items-baseline gap-2 pt-0.5">
                  <span className="font-semibold text-[var(--primary)] text-xl sm:text-2xl">
                    ₱{Number(safeFurniture.base_price ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[var(--text-muted)] text-xs">starting price</span>
                </div>
              </div>
            </Reveal>

            {images.length > 0 && (
              <div className="shrink-0 bg-[var(--surface)] p-4 border border-[var(--border)] rounded-2xl">
                <AssetsSection 
                  state={{ images }} 
                  onImageClick={(imgs, idx) => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                />
              </div>
            )}

            <Reveal delay={0.12} className="shrink-0">
              <div className="bg-[var(--surface)] p-4 border border-[var(--border)] rounded-2xl">
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
                  categories={
                    safeFurniture.category?.id
                      ? [
                          {
                            id: safeFurniture.category.id,
                            name: safeFurniture.category.name ?? "Uncategorized",
                          },
                        ]
                      : []
                  }
                />
              </div>
            </Reveal>

            {variants.length > 0 && (
              <Reveal delay={0.2} className="shrink-0">
                <div className="bg-[var(--surface)] p-4 border border-[var(--border)] rounded-2xl">
                  <VariantsSection
                    variants={variants}
                    activeVariantId={previewVariantId}
                    onApplyVariant={setPreviewVariantId}
                  />
                </div>
              </Reveal>
            )}

            <Reveal delay={0.28} className="shrink-0">
              <div className="pt-1 pb-2">
                <button
                  onClick={handleOrderClick}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-md py-3.5 rounded-xl w-full font-semibold text-[var(--primary-foreground)] text-sm active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                >
                  Customize &amp; Order
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

        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          title={safeFurniture.name}
        />

        <AuthRequiredModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    </PageTransition>
  );
}