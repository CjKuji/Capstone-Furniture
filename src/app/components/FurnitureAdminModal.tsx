"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Furniture3DViewer from "@/app/components/Furniture3DViewer";

import type {
  FurnitureCategory,
  FurnitureFormPayload,
} from "@/types/furniture";

import { useFurnitureForm } from "@/hooks/useFurnitureForm";
import { useFurnitureModalController } from "@/hooks/useFurnitureModalController";

import BasicInfoSection from "@/app/components/sections/admin/BasicInfoSection";
import AssetsSection from "@/app/components/sections/admin/AssetsSection";
import VariantsSection from "@/app/components/sections/admin/VariantsSection";

/* ========================================================= */

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  item: any | null;
  onClose: () => void;
  onSave: (id: string | null, data: FurnitureFormPayload) => Promise<void> | void;
  categories: FurnitureCategory[];
};

/* ========================================================= */

export default function FurnitureModalContainer({
  isOpen,
  mode,
  item,
  onClose,
  onSave,
  categories,
}: Props) {
  /* ── Pass isOpen so the hook re-initialises on every open ── */
  const form = useFurnitureForm({ mode, item, isOpen });

  const controller = useFurnitureModalController({
    form,
    item,
    isOpen,
    onClose,
    onSave,
    categories,
  });

  const {
    state,
    variants,
    submitting,
    isAnalyzing,
    modelPreviewUrl,
    activeVariantTexture,
    activeVariantId,
    setBasicInfoField,
    setActiveVariantId,
    setModelFile,
    addImages,
    removeImage,
    setPrimaryImage,
    addVariant,
    updateVariant,
    removeVariant,
    handleClose,
    handleSubmit,
    handleVariantFile,
    getKey,
  } = controller;

  /* ── DERIVED: dimension gate ── */
  const dimensionsFilled =
    Number(state.widthCm) > 0 &&
    Number(state.depthCm) > 0 &&
    Number(state.heightCm) > 0;

  /* ── VALIDATION ERRORS ── */
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = form.errors;

  const errorMessages = [
    errors.name,
    errors.categoryId,
    errors.assets,
    errors.dimensions,
    errors.basePrice,
    errors.general,
  ].filter(Boolean) as string[];

  const showErrors = submitAttempted && errorMessages.length > 0;

  /* ── SUBMIT WRAPPER ── */
  const onSubmitClick = useCallback(async () => {
    const ok = await handleSubmit();
    if (!ok) setSubmitAttempted(true);
  }, [handleSubmit]);

  /* ── SSR HYDRATION GATE ── */
  const isBrowser = typeof window !== "undefined";

  /* ── ANIMATION + CANVAS STATES ── */
  const [canRenderCanvas, setCanRenderCanvas] = useState(false);
  const [isAnimateIn, setIsAnimateIn]         = useState(false);

  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame1Ref = useRef<number | null>(null);
  const frame2Ref = useRef<number | null>(null);

  const clearPending = useCallback(() => {
    if (timerRef.current  !== null) { clearTimeout(timerRef.current);          timerRef.current  = null; }
    if (frame1Ref.current !== null) { cancelAnimationFrame(frame1Ref.current); frame1Ref.current = null; }
    if (frame2Ref.current !== null) { cancelAnimationFrame(frame2Ref.current); frame2Ref.current = null; }
  }, []);

  useEffect(() => () => { clearPending(); }, [clearPending]);

  // Handle Escape Key Close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    clearPending();

    if (!isOpen) {
      setIsAnimateIn(false);
      setCanRenderCanvas(false);
      setSubmitAttempted(false);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    frame1Ref.current = requestAnimationFrame(() => {
      frame2Ref.current = requestAnimationFrame(() => {
        setIsAnimateIn(true);
        timerRef.current = setTimeout(() => setCanRenderCanvas(true), 250);
      });
    });

    return () => {
      clearPending();
      document.body.style.overflow = originalOverflow;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ── SERVER GUARD ── */
  if (!isBrowser) return null;

  /* ── EDIT MODE WITH NO ITEM ── */
  if (!item && mode === "edit") {
    return createPortal(
      <div
        className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="w-full max-w-md bg-[#0A0705] border border-white/[0.06] rounded-2xl p-8 text-center shadow-2xl">
          <p className="text-sm font-medium text-white/60">Furniture item not found.</p>
        </div>
      </div>,
      document.body
    );
  }

  /* ================= MAIN PORTAL ================= */

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-4 backdrop-blur-md overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
      style={{ backgroundColor: "rgba(6, 4, 3, 0.85)", willChange: "opacity" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={`
          relative w-full flex flex-col
          rounded-none sm:rounded-2xl
          h-screen sm:h-[calc(100vh-32px)]
          max-w-full sm:max-w-[96%] xl:max-w-[94%] 2xl:max-w-[1600px]
          shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden
          border-0 sm:border border-white/[0.06] bg-[#0A0705]
          transition-all duration-300 ease-out
          ${isAnimateIn ? "scale-100 translate-y-0" : "scale-[0.985] translate-y-3"}
        `}
        style={{ willChange: "transform, opacity" }}
      >
        {/* Decorative Top Accent Accent Line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/40 to-transparent flex-shrink-0" />

        {/* ── HEADER ── */}
        <div
          className="flex items-center justify-between px-6 sm:px-8 py-5 shrink-0 bg-[#0E0A07]"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4A97A]/80 mb-0.5">
              Inventory & Catalog Controls
            </p>
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">
              {mode === "edit" ? "Modify Product Details" : "Create New Product Entry"}
            </h2>
            <p className="text-xs text-white/40 font-medium hidden sm:block mt-1">
              {mode === "edit"
                ? "Update core specifications, upload 3D assets, and manage catalog variants."
                : "Fill out the fields below to add a new design to your active store catalog."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/[0.06] transition-all duration-200 text-sm"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* ── SPLIT BODY ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden bg-gradient-to-b from-[#0A0705] to-[#070504]">
          <div className="w-full h-full flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">

            {/* ── LEFT: 3D VIEWPORT (Sticky/Pinned on Desktop) ── */}
            <div className="w-full lg:w-[40%] h-[40vh] lg:h-full flex flex-col shrink-0 bg-[#050302] border-b lg:border-b-0 lg:border-r border-white/[0.04]">
              <div
                className="px-6 py-3.5 bg-white/[0.01] flex items-center justify-between shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-1.5 h-3.5 rounded-full shrink-0 bg-[#D4A97A]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
                    3D Interactive Preview
                  </span>
                </div>
                <span className="text-[9px] font-semibold tracking-wider px-2.5 py-0.5 rounded-md shrink-0 bg-white/5 text-white/60 border border-white/10">
                  WebGL Viewport
                </span>
              </div>

              <div className="flex-1 w-full h-full relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#110d0a] via-[#050302] to-[#020101]">
                {modelPreviewUrl ? (
                  <div className="absolute inset-0 w-full h-full">
                    {canRenderCanvas ? (
                      <Furniture3DViewer
                        modelUrl={modelPreviewUrl}
                        selectedVariantTextureUrl={activeVariantTexture}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-5 h-5 border-2 border-[#D4A97A] border-t-transparent rounded-full animate-spin" />
                          <div className="text-[10px] text-[#D4A97A] font-bold uppercase tracking-[0.2em]">
                            Loading 3D Workspace...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.04] shadow-inner"
                      style={{ background: "rgba(212,169,122,0.03)" }}
                    >
                      <span className="text-xl filter drop-shadow-[0_4px_10px_rgba(212,169,122,0.2)] select-none">
                        📦
                      </span>
                    </div>
                    <div className="max-w-xs">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
                        No 3D Model Attached
                      </p>
                      <p className="text-[11px] text-white/30 leading-relaxed">
                        Upload a standard digital format (.glb) in the assets step to unlock full real-time interactive positioning.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: FORMS (Scrolled Container) ── */}
            <div className="w-full lg:w-[60%] h-auto lg:h-full overflow-y-auto p-5 sm:p-8 space-y-6 focus:outline-none custom-scrollbar">
              
              {/* Step 1: Basic Metadata */}
              <div className="relative w-full bg-[#0E0A07]/40 p-6 rounded-2xl border border-white/[0.04] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.07]">
                <div className="absolute top-4 right-5 text-[20px] font-black text-white/[0.02] pointer-events-none select-none">01</div>
                <BasicInfoSection
                  state={{
                    name:        state.name,
                    description: state.description,
                    categoryId:  state.categoryId,
                    basePrice:   state.basePrice,
                    widthCm:     state.widthCm,
                    depthCm:     state.depthCm,
                    heightCm:    state.heightCm,
                  }}
                  setField={setBasicInfoField}
                  categories={categories}
                />
              </div>

              {/* Step 2: Digital Asset Engine */}
              <div className="relative w-full bg-[#0E0A07]/40 p-6 rounded-2xl border border-white/[0.04] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.07]">
                <div className="absolute top-4 right-5 text-[20px] font-black text-white/[0.02] pointer-events-none select-none">02</div>
                <AssetsSection
                  state={{
                    modelFile: state.modelFile,
                    images:    state.images,
                  }}
                  setModelFile={setModelFile}
                  addImages={addImages}
                  removeImage={removeImage}
                  setPrimaryImage={setPrimaryImage}
                  dimensionsFilled={dimensionsFilled}
                  isAnalyzing={isAnalyzing}
                  validationReport={state.validationReport}
                />
              </div>

              {/* Step 3: Global Variables & Materials */}
              <div className="relative w-full bg-[#0E0A07]/40 p-6 rounded-2xl border border-white/[0.04] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.07]">
                <div className="absolute top-4 right-5 text-[20px] font-black text-white/[0.02] pointer-events-none select-none">03</div>
                <VariantsSection
                  variants={variants}
                  addVariant={addVariant}
                  updateVariant={updateVariant}
                  removeVariant={removeVariant}
                  setActiveVariantId={setActiveVariantId}
                  activeVariantId={activeVariantId}
                  handleVariantFile={handleVariantFile}
                  getKey={getKey}
                />
              </div>

            </div>
          </div>
        </div>

        {/* ── VALIDATION ERROR BANNER ── */}
        <div
          className={`
            shrink-0 overflow-hidden transition-all duration-300 ease-out
            ${showErrors ? "max-h-48 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}
          `}
          style={{ borderTop: showErrors ? "1px solid rgba(239,68,68,0.2)" : undefined }}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="px-6 sm:px-8 py-3.5 bg-red-950/30 backdrop-blur-md flex items-start gap-3.5">
            <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 text-[10px] font-bold select-none">
              !
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">
                {errorMessages.length === 1
                  ? "Please resolve the issue below before submitting:"
                  : `Please resolve the ${errorMessages.length} form actions below before saving:`}
              </p>
              <ul className="space-y-1">
                {errorMessages.map((msg, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-red-200/60 leading-relaxed flex items-start gap-1.5"
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400/40 shrink-0" />
                    {msg}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setSubmitAttempted(false)}
              className="shrink-0 p-1 text-red-400/40 hover:text-red-400 transition-colors text-xs"
              aria-label="Dismiss errors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          className="shrink-0 flex justify-end items-center gap-3 px-6 py-4 bg-[#0E0A07]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="px-5 h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200 border border-white/5 bg-white/[0.01] text-white/40 hover:bg-white/[0.03] hover:text-white/80 active:scale-[0.98]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmitClick}
            disabled={submitting || isAnalyzing}
            className="px-6 h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200 bg-[#D4A97A] text-[#1C1209] hover:bg-[#E5BA8B] active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none shadow-[0_4px_20px_rgba(212,169,122,0.12)]"
          >
            {isAnalyzing
              ? "Running Asset Inspections…"
              : submitting
              ? "Updating Catalog Data…"
              : mode === "edit"
              ? "Save Product Changes"
              : "Publish Product Entry"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}