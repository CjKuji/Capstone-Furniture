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

  /* ── VALIDATION ERRORS ──────────────────────────────────────
     `submitAttempted` drives the error banner. It is set when the
     user clicks Save and validation fails, and is reset when the
     modal closes (handled inside the isOpen useEffect below).
     `showErrors` is fully derived — no setState inside an effect.
  ── */
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

  /* ── ANIMATION + CANVAS STATES ────────────────────────────
     isAnimateIn     – drives CSS scale/translate transition
     canRenderCanvas – gates the heavy WebGL canvas mount

     On OPEN:
       1. Two rAF ticks → isAnimateIn = true
       2. 250 ms later  → canRenderCanvas = true

     On CLOSE:
       All flags and submitAttempted reset immediately so the
       next open always starts from a clean, consistent state.
  ── */
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
          <p className="text-sm font-medium text-white/60">Furniture not found</p>
        </div>
      </div>,
      document.body
    );
  }

  /* ================= MAIN PORTAL ================= */

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-3 backdrop-blur-md overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
      style={{ backgroundColor: "rgba(6, 4, 3, 0.85)", willChange: "opacity" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={`
          relative w-full flex flex-col
          rounded-none sm:rounded-2xl
          h-screen sm:h-[calc(100vh-24px)]
          max-w-full sm:max-w-[98%] xl:max-w-[96%] 2xl:max-w-[1780px]
          shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden
          border-0 sm:border border-white/[0.06] bg-[#0A0705]
          transition-all duration-300 ease-out
          ${isAnimateIn ? "scale-100 translate-y-0" : "scale-[0.99] translate-y-4"}
        `}
        style={{ willChange: "transform, opacity" }}
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/50 to-transparent flex-shrink-0" />

        {/* ── HEADER ── */}
        <div
          className="flex items-center justify-between px-5 sm:px-8 py-4 shrink-0 bg-[#0E0A07]"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4A97A]/70 mb-0.5">
              Product Control Deck
            </p>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {mode === "edit" ? "Edit Furniture" : "Add New Furniture"}
            </h2>
            <p className="text-xs text-white/40 font-medium hidden sm:block mt-0.5">
              {mode === "edit"
                ? "Update product details, asset variants, and spatial specifications"
                : "Fill details, compile asset components, and bind variants"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/[0.06] transition-all duration-200 text-xs"
          >
            ✕
          </button>
        </div>

        {/* ── SPLIT BODY ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden bg-gradient-to-b from-[#0A0705] to-[#070504]">
          <div className="w-full h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/[0.04] overflow-y-auto lg:overflow-hidden">

            {/* ── LEFT: 3D VIEWPORT ── */}
            <div className="w-full lg:w-[46%] h-[50vh] lg:h-full flex flex-col shrink-0 bg-[#050302]">
              <div
                className="px-5 sm:px-6 py-3.5 bg-white/[0.02] flex items-center justify-between shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1 h-4 rounded-full shrink-0 bg-[#D4A97A]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                    Spatial Live Environment
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full shrink-0 border bg-[#D4A97A]/5 text-[#D4A97A] border-[#D4A97A]/20">
                  3D Canvas Node
                </span>
              </div>

              <div className="flex-1 w-full h-full relative overflow-hidden">
                {modelPreviewUrl ? (
                  <div className="absolute inset-0 w-full h-full bg-[#050302]">
                    {canRenderCanvas ? (
                      <Furniture3DViewer
                        modelUrl={modelPreviewUrl}
                        selectedVariantTextureUrl={activeVariantTexture}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#050302]">
                        <div className="text-[10px] text-[#D4A97A] font-bold uppercase tracking-[0.25em] animate-pulse">
                          Constructing Viewport Matrix...
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6 bg-[#050302]">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/[0.04] shadow-inner"
                      style={{ background: "rgba(212,169,122,0.04)" }}
                    >
                      <span className="text-2xl filter drop-shadow-[0_4px_12px_rgba(212,169,122,0.3)]">
                        📦
                      </span>
                    </div>
                    <div className="max-w-xs">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">
                        No Core Engine Assets Loaded
                      </p>
                      <p className="text-[11px] text-white/20 leading-relaxed">
                        Upload standard production ready .glb or .gltf files
                        inside the assets pipeline config panel to populate layout space.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: FORMS ── */}
            <div className="w-full lg:w-[54%] h-auto lg:h-full overflow-y-auto p-4 sm:p-6 space-y-5 focus:outline-none custom-scrollbar">

              <div className="w-full bg-white/[0.01] p-5 rounded-2xl border border-white/[0.03] shadow-inner">
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

              <div className="w-full bg-white/[0.01] p-5 rounded-2xl border border-white/[0.03] shadow-inner">
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

              <div className="w-full bg-white/[0.01] p-5 rounded-2xl border border-white/[0.03] shadow-inner">
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
            ${showErrors
              ? "max-h-40 opacity-100"
              : "max-h-0 opacity-0 pointer-events-none"}
          `}
          style={{ borderTop: showErrors ? "1px solid rgba(239,68,68,0.15)" : undefined }}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="px-6 py-3 bg-red-950/40 flex items-start gap-3">
            <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-[10px] font-bold leading-none select-none">
              !
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400/80 mb-1.5">
                {errorMessages.length === 1
                  ? "Please fix the following before saving"
                  : `${errorMessages.length} issues must be resolved before saving`}
              </p>
              <ul className="space-y-0.5">
                {errorMessages.map((msg, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-red-300/70 leading-relaxed flex items-start gap-1.5"
                  >
                    <span className="mt-1 w-1 h-1 rounded-full bg-red-500/50 shrink-0" />
                    {msg}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setSubmitAttempted(false)}
              className="shrink-0 text-red-500/40 hover:text-red-400 transition-colors text-xs leading-none mt-0.5"
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
            className="px-5 h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-200 border border-white/[0.04] bg-white/[0.01] text-white/40 hover:bg-white/[0.03] hover:text-white/70 active:scale-[0.98]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmitClick}
            disabled={submitting || isAnalyzing}
            className="px-6 h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-200 bg-[#D4A97A] text-[#1C1209] hover:bg-[#E5BA8B] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-[0_4px_20px_rgba(212,169,122,0.15)]"
          >
            {isAnalyzing
              ? "Analyzing Model…"
              : submitting
              ? "Saving System Manifest…"
              : mode === "edit"
              ? "Commit Changes"
              : "Create Product Entry"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}