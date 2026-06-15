"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { useOrderCreate } from "@/hooks/useCreateorder";
import {
  DeliveryStep,
  buildDeliveryData,
  isDeliveryStepValid,
  STORE_PICKUP,
} from "@/app/components/DeliveryMethodModal";
import type { DeliveryStepState } from "@/app/components/DeliveryMethodModal";
import { RequestStep } from "@/app/components/RequestModal";
import type { RequestStepState } from "@/app/components/RequestModal";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */

type FurnitureVariant = {
  id: string;
  name: string;
  price_adjustment: number;
};

type Furniture = {
  id: string;
  name: string;
  base_price: number;
  variants: FurnitureVariant[];
};

/** One row in the flat order list (per furniture × per variant/base) */
type SelectedItem = {
  furniture_id: string;
  variant_id: string | null;
  quantity: number;
  label: string;
  unit_price: number;
};

/** Per-furniture group used in the UI */
type FurnitureGroup = {
  furniture: Furniture;
  /** Indices into the flat `list` array that belong to this furniture */
  indices: number[];
};

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */

type Step = "items" | "delivery" | "review" | "success";
const WIZARD_STEPS: Exclude<Step, "success">[] = ["items", "delivery", "review"];
const STEP_LABELS: Record<string, string> = {
  items:    "Items",
  delivery: "Delivery",
  review:   "Review",
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */

/**
 * Normalise a furniture value coming from either the detail page (single
 * object whose shape matches the DB response) or the cart page (array of
 * CartFurnitureItem objects stored in localStorage).
 *
 * Coerces price_adjustment and base_price to numbers because JSON.parse from
 * localStorage may preserve them as strings if they were ever serialised that way.
 */
function normaliseFurnitures(furniture: Furniture | Furniture[]): Furniture[] {
  const arr = Array.isArray(furniture) ? furniture : [furniture];
  return arr.map((f) => ({
    ...f,
    base_price: Number(f.base_price ?? 0),
    variants: (f.variants ?? []).map((v) => ({
      ...v,
      price_adjustment: Number(v.price_adjustment ?? 0),
    })),
  }));
}

/**
 * Build the flat list and the per-furniture groups in one pass.
 * Each furniture contributes:
 *   • one row per variant  (variant rows come first)
 *   • one "Base" row       (no variant, always last)
 */
function buildState(furniture: Furniture | Furniture[]): {
  list: SelectedItem[];
  groups: FurnitureGroup[];
} {
  const furnitures = normaliseFurnitures(furniture);
  const list: SelectedItem[] = [];
  const groups: FurnitureGroup[] = [];

  for (const f of furnitures) {
    const start = list.length;

    for (const v of f.variants) {
      list.push({
        furniture_id: f.id,
        variant_id:   v.id,
        quantity:     0,
        label:        v.name,
        unit_price:   f.base_price + v.price_adjustment,
      });
    }

    list.push({
      furniture_id: f.id,
      variant_id:   null,
      quantity:     0,
      label:        "Base (no finish)",
      unit_price:   f.base_price,
    });

    const end = list.length;
    groups.push({
      furniture: f,
      indices:   Array.from({ length: end - start }, (_, i) => start + i),
    });
  }

  return { list, groups };
}

/**
 * Stable cache key that reflects both furniture IDs and their variant IDs.
 * This ensures useMemo rebuilds groups whenever the selected set changes,
 * even if the furniture IDs themselves are the same but variants differ.
 */
function furnitureCacheKey(furniture: Furniture | Furniture[]): string {
  const arr = Array.isArray(furniture) ? furniture : [furniture];
  return arr
    .map((f) => `${f.id}:[${(f.variants ?? []).map((v) => v.id).join(",")}]`)
    .join("|");
}

function getDisplayName(furniture: Furniture | Furniture[]): string {
  if (Array.isArray(furniture)) {
    return furniture.length === 1 ? furniture[0].name : `${furniture.length} designs`;
  }
  return furniture.name;
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════ */

/** Quantity stepper row */
function ItemRow({
  item,
  onDelta,
}: {
  item: SelectedItem;
  onDelta: (d: number) => void;
}) {
  return (
    <div
      className={`
        flex items-center justify-between rounded-xl border px-3.5 py-3 transition-all
        ${item.quantity > 0
          ? "border-[#D4A97A]/30 bg-[#D4A97A]/[0.04]"
          : "border-[#2A1F14] bg-[#160F08]"}
      `}
    >
      <div className="min-w-0 flex-1 pr-3">
        <p className="text-[13px] font-medium text-white/80 truncate">{item.label}</p>
        <p className="text-[11px] text-[#D4A97A]/70 mt-0.5">
          ₱{item.unit_price.toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onDelta(-1)}
          disabled={item.quantity === 0}
          className="
            h-8 w-8 rounded-xl border border-[#2A1F14] bg-white/[0.03]
            text-white/50 text-sm
            hover:border-[#D4A97A]/30 hover:bg-white/[0.06] hover:text-white/80
            disabled:opacity-25 disabled:cursor-not-allowed
            transition-all
          "
        >−</button>
        <span className="min-w-[22px] text-center text-[13px] font-semibold text-white/80">
          {item.quantity}
        </span>
        <button
          onClick={() => onDelta(1)}
          className="
            h-8 w-8 rounded-xl border border-[#2A1F14] bg-white/[0.03]
            text-white/50 text-sm
            hover:border-[#D4A97A]/30 hover:bg-white/[0.06] hover:text-white/80
            transition-all
          "
        >+</button>
      </div>
    </div>
  );
}

/** One furniture accordion block used in the Items step */
function FurnitureBlock({
  group,
  list,
  onDelta,
}: {
  group: FurnitureGroup;
  list: SelectedItem[];
  onDelta: (globalIdx: number, d: number) => void;
}) {
  const f = group.furniture;
  const rows = group.indices.map((gi) => ({ item: list[gi], gi }));
  const groupQty = rows.reduce((s, r) => s + r.item.quantity, 0);
  const groupSubtotal = rows.reduce((s, r) => s + r.item.quantity * r.item.unit_price, 0);
  const hasVariants = f.variants.length > 0;

  return (
    <div className="rounded-2xl border border-[#2A1F14] overflow-hidden">
      {/* furniture header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#160F08] border-b border-[#2A1F14]">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#D4A97A]/60">
            {f.variants.length > 0
              ? `${f.variants.length} finish${f.variants.length !== 1 ? "es" : ""} + base`
              : "Base only"}
          </p>
          <p className="text-[14px] font-semibold text-white/85 truncate mt-0.5">{f.name}</p>
        </div>
        {groupQty > 0 && (
          <div className="shrink-0 ml-3 text-right">
            <p className="text-[11px] font-black text-[#D4A97A]">₱{groupSubtotal.toLocaleString()}</p>
            <p className="text-[9px] text-white/25 uppercase tracking-wide">{groupQty} pcs</p>
          </div>
        )}
      </div>

      {/* rows */}
      <div className="p-3 space-y-2 bg-[#0E0B06]">
        {hasVariants && (
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/20 px-0.5 pb-0.5">
            Finishes
          </p>
        )}
        {rows.slice(0, rows.length - 1).map(({ item, gi }) => (
          <ItemRow key={gi} item={item} onDelta={(d) => onDelta(gi, d)} />
        ))}

        {hasVariants && (
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/20 px-0.5 pb-0.5 pt-1">
            Base
          </p>
        )}
        {(() => {
          const last = rows[rows.length - 1];
          return <ItemRow key={last.gi} item={last.item} onDelta={(d) => onDelta(last.gi, d)} />;
        })()}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */

type Props = {
  open: boolean;
  onClose: () => void;
  furniture: Furniture | Furniture[];
  onSuccess?: () => void;
};

export default function PlaceOrderModal({ open, onClose, furniture, onSuccess }: Props) {
  const { createOrder, isPending } = useOrderCreate();

  /*
   * Cache key includes both furniture IDs and variant IDs so that groups
   * rebuild correctly whenever the selected furniture set changes — even if
   * the same furniture IDs are re-selected with different variant data
   * (e.g. after a localStorage round-trip).
   */
  const cacheKey = furnitureCacheKey(furniture);

  const { list: initialList, groups } = useMemo(
    () => buildState(furniture),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey]
  );

  const [step, setStep]                   = useState<Step>("items");
  const [list, setList]                   = useState<SelectedItem[]>(initialList);
  const [deliveryState, setDeliveryState] = useState<DeliveryStepState>({ method: "pickup", phone: "", address: "" });
  const [requestState, setRequestState]   = useState<RequestStepState>({ description: "", imageFiles: [] });

  /*
   * Re-initialise whenever the modal opens OR whenever the furniture prop
   * changes (cacheKey change) while the modal is already open.
   * This covers the cart-page case where the user changes their selection
   * and re-opens — quantities must reset to 0 for the new set.
   */
  useEffect(() => {
    if (open) {
      const { list: freshList } = buildState(furniture);
      setList(freshList);
      setStep("items");
      setDeliveryState({ method: "pickup", phone: "", address: "" });
      setRequestState({ description: "", imageFiles: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cacheKey]);

  /* ── DERIVED ── */
  const activeItems   = useMemo(() => list.filter((i) => i.quantity > 0), [list]);
  const subtotal      = useMemo(() => activeItems.reduce((s, i) => s + i.quantity * i.unit_price, 0), [activeItems]);
  const deliveryValid = isDeliveryStepValid(deliveryState);
  const canConfirm    = activeItems.length > 0 && deliveryValid;
  const isSuccess     = step === "success";
  const stepIndex     = WIZARD_STEPS.indexOf(step as Exclude<Step, "success">);
  const displayName   = getDisplayName(furniture);

  /* ── ACTIONS ── */
  function reset() {
    const { list: freshList } = buildState(furniture);
    setStep("items");
    setList(freshList);
    setDeliveryState({ method: "pickup", phone: "", address: "" });
    setRequestState({ description: "", imageFiles: [] });
  }

  function handleClose() { reset(); onClose(); }

  function updateQty(globalIdx: number, delta: number) {
    setList((prev) =>
      prev.map((item, i) =>
        i === globalIdx ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      )
    );
  }

  function goNext() {
    if (step === "items"    && activeItems.length > 0) setStep("delivery");
    else if (step === "delivery" && deliveryValid)     setStep("review");
  }

  function goPrev() {
    if (step === "delivery") setStep("items");
    else if (step === "review")  setStep("delivery");
  }

  async function handleConfirm() {
    if (!canConfirm) return;
    const delivery = buildDeliveryData(deliveryState);
    await createOrder({
      delivery_method:  delivery.delivery_method,
      phone_number:     delivery.phone_number,
      delivery_address: delivery.delivery_address,
      pickup_location:  delivery.pickup_location,
      items: activeItems.map((i) => ({
        furniture_id: i.furniture_id,
        variant_id:   i.variant_id,
        quantity:     i.quantity,
      })),
      request: (requestState.description.trim() || requestState.imageFiles.length > 0)
        ? { description: requestState.description.trim(), imageFiles: requestState.imageFiles }
        : null,
    });
    setStep("success");
    onSuccess?.();
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">

      <div className="
        relative flex flex-col
        w-full sm:max-w-lg
        max-h-[96dvh] sm:max-h-[90vh]
        rounded-t-3xl sm:rounded-3xl
        overflow-hidden
        bg-[#0B0704]
        border-t border-x sm:border border-[#2A1F14]
        shadow-[0_-16px_80px_rgba(0,0,0,0.9)] sm:shadow-[0_32px_80px_rgba(0,0,0,0.8)]
      ">

        {/* drag pill */}
        {!isSuccess && (
          <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
            <div className="h-1 w-10 rounded-full bg-white/15" />
          </div>
        )}

        {/* header */}
        {!isSuccess && (
          <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#2A1F14] px-4 sm:px-5 py-3.5 bg-[#0E0B06]/60">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
                Place Order
              </p>
              <h2 className="text-sm font-semibold text-white/85 truncate">{displayName}</h2>
            </div>
            <button
              onClick={handleClose}
              className="
                shrink-0 flex h-8 w-8 items-center justify-center
                rounded-full border border-[#2A1F14] bg-white/[0.03]
                text-white/35 text-xs
                hover:bg-white/[0.07] hover:text-white/60 hover:border-[#D4A97A]/20
                transition-all
              "
            >✕</button>
          </div>
        )}

        {/* step indicator */}
        {!isSuccess && (
          <div className="shrink-0 flex border-b border-[#2A1F14]">
            {WIZARD_STEPS.map((s, i) => (
              <div
                key={s}
                className={`
                  flex flex-1 items-center justify-center gap-1.5 py-2.5
                  text-[9px] font-black uppercase tracking-[0.12em]
                  border-r border-[#2A1F14] last:border-r-0 transition-colors
                  ${i === stepIndex
                    ? "text-[#D4A97A] bg-[#D4A97A]/[0.06]"
                    : i < stepIndex
                      ? "text-[#7A5C3A]"
                      : "text-white/20"}
                `}
              >
                <span className={`
                  flex h-4 w-4 items-center justify-center rounded-full text-[8px] shrink-0
                  ${i === stepIndex
                    ? "bg-[#D4A97A] text-[#0B0704]"
                    : i < stepIndex
                      ? "bg-[#7A5C3A]/30 text-[#7A5C3A]"
                      : "bg-white/[0.06] text-white/25"}
                `}>
                  {i < stepIndex ? "✓" : i + 1}
                </span>
                <span>{STEP_LABELS[s]}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-[#2A1F14] scrollbar-track-transparent">

          {/* ── SUCCESS ── */}
          {isSuccess && (
            <div className="flex flex-col items-center justify-center gap-5 px-6 sm:px-8 py-12 sm:py-16 text-center">
              <div className="relative">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border border-[#D4A97A]/30 bg-[#D4A97A]/[0.08]">
                  <span className="text-2xl sm:text-3xl text-[#D4A97A]">✦</span>
                </div>
                <div className="absolute inset-0 rounded-full border border-[#D4A97A]/10 scale-125" />
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#D4A97A]/60">
                  Order Placed
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-white/90">
                  We've received your order!
                </h2>
                <p className="text-[12px] sm:text-[13px] text-white/40 leading-relaxed max-w-xs mx-auto">
                  Your order for{" "}
                  <span className="text-white/65">{displayName}</span>{" "}
                  has been submitted. Our team will review and confirm details shortly.
                </p>
              </div>

              <div className="w-full rounded-2xl border border-[#2A1F14] bg-[#160F08] divide-y divide-[#2A1F14] overflow-hidden">
                {[
                  { label: "Items",  value: `${activeItems.length} line${activeItems.length !== 1 ? "s" : ""}` },
                  { label: "Method", value: deliveryState.method === "pickup" ? "Store Pickup" : "Delivery", gold: true },
                  { label: "Total",  value: `₱${subtotal.toLocaleString()}`, gold: true, large: true },
                ].map(({ label, value, gold, large }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25">{label}</span>
                    <span className={`${large ? "font-bold text-[14px]" : "font-semibold text-[12px]"} ${gold ? "text-[#D4A97A]" : "text-white/50"}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] px-4 py-3 w-full">
                <p className="text-[11px] text-[#7A5C3A] leading-relaxed">
                  ✦ &nbsp;Check the Orders tab to track your order status.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="
                  w-full rounded-2xl py-3.5
                  text-[11px] font-black uppercase tracking-[0.14em]
                  bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E8C98A]
                  text-[#0E0A06]
                  shadow-[0_2px_8px_rgba(212,169,122,0.25)]
                  hover:brightness-105 hover:shadow-[0_4px_16px_rgba(212,169,122,0.35)]
                  transition-all
                "
              >
                Done
              </button>
            </div>
          )}

          {/* ── STEP 1: ITEMS ── */}
          {step === "items" && (
            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25 pb-0.5">
                Select finishes &amp; quantities
              </p>

              {groups.map((group) => (
                <FurnitureBlock
                  key={group.furniture.id}
                  group={group}
                  list={list}
                  onDelta={updateQty}
                />
              ))}

              {activeItems.length > 0 && (
                <div className="flex items-center justify-between rounded-2xl border border-[#D4A97A]/20 bg-[#D4A97A]/[0.04] px-4 py-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
                    Order Subtotal
                  </span>
                  <span className="text-[13px] font-bold text-[#D4A97A]">
                    ₱{subtotal.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: DELIVERY ── */}
          {step === "delivery" && (
            <>
              <DeliveryStep state={deliveryState} onChange={setDeliveryState} />
              <div className="px-4 sm:px-5 pb-5">
                <RequestStep state={requestState} onChange={setRequestState} />
              </div>
            </>
          )}

          {/* ── STEP 3: REVIEW ── */}
          {step === "review" && (
            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25 pb-0.5">
                Order Summary
              </p>

              {groups.map((group) => {
                const groupActive = group.indices
                  .map((gi) => list[gi])
                  .filter((i) => i.quantity > 0);
                if (groupActive.length === 0) return null;
                const groupTotal = groupActive.reduce((s, i) => s + i.quantity * i.unit_price, 0);

                return (
                  <div
                    key={group.furniture.id}
                    className="rounded-2xl border border-[#2A1F14] bg-[#160F08] divide-y divide-[#2A1F14] overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#1A1108]">
                      <p className="text-[12px] font-semibold text-white/70 truncate">
                        {group.furniture.name}
                      </p>
                      <p className="text-[11px] font-bold text-[#D4A97A] shrink-0 ml-3">
                        ₱{groupTotal.toLocaleString()}
                      </p>
                    </div>

                    {groupActive.map((item, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] text-white/70 truncate">{item.label}</p>
                          <p className="text-[11px] text-white/30 mt-0.5">
                            ₱{item.unit_price.toLocaleString()} × {item.quantity}
                          </p>
                        </div>
                        <span className="text-[12px] font-semibold text-[#D4A97A] shrink-0">
                          ₱{(item.unit_price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}

              <div className="flex items-center justify-between rounded-2xl border border-[#D4A97A]/20 bg-[#D4A97A]/[0.04] px-4 py-3">
                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/40">
                  Grand Total
                </span>
                <span className="text-[14px] font-bold text-[#D4A97A]">
                  ₱{subtotal.toLocaleString()}
                </span>
              </div>

              <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] divide-y divide-[#2A1F14] overflow-hidden">
                <div className="px-4 py-2.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25">Delivery</p>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {([
                    { label: "Method",   value: deliveryState.method === "pickup" ? "Store Pickup" : "Delivery", gold: true },
                    { label: "Phone",    value: deliveryState.phone,   gold: false },
                    ...(deliveryState.method === "delivery" && deliveryState.address
                      ? [{ label: "Address",  value: deliveryState.address,  gold: false }]
                      : []),
                    ...(deliveryState.method === "pickup"
                      ? [{ label: "Location", value: STORE_PICKUP, gold: false }]
                      : []),
                  ] as { label: string; value: string; gold: boolean }[]).map(({ label, value, gold }) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-[10px] text-white/30 uppercase tracking-wide shrink-0">{label}</span>
                      <span className={`text-[11px] text-right ${gold ? "font-semibold text-[#D4A97A] uppercase tracking-wide" : "text-white/60"}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {(requestState.description.trim() || requestState.imageFiles.length > 0) && (
                <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] divide-y divide-[#2A1F14] overflow-hidden">
                  <div className="px-4 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25">Custom Request</p>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {requestState.description.trim() && (
                      <p className="text-[12px] text-white/60 leading-relaxed">
                        {requestState.description}
                      </p>
                    )}
                    {requestState.imageFiles.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-white/25 uppercase tracking-wide">
                          Reference images ({requestState.imageFiles.length})
                        </p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {requestState.imageFiles.map((file, i) => {
                            const url = URL.createObjectURL(file);
                            return (
                              <div key={i} className="aspect-square rounded-xl overflow-hidden border border-[#2A1F14]">
                                <img
                                  src={url}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                  onLoad={() => URL.revokeObjectURL(url)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        {!isSuccess && (
          <div className="shrink-0 border-t border-[#2A1F14] bg-[#0E0B06]/60 px-4 sm:px-5 py-3.5">
            <div className="flex gap-2.5 pb-[env(safe-area-inset-bottom)]">
              <button
                onClick={step === "items" ? handleClose : goPrev}
                className="
                  flex-1 min-h-[44px] rounded-2xl border border-[#2A1F14] bg-white/[0.02]
                  text-[10px] font-black uppercase tracking-[0.14em] text-white/30
                  hover:bg-white/[0.05] hover:text-white/50
                  transition-all
                "
              >
                {step === "items" ? "Cancel" : "← Back"}
              </button>

              {step !== "review" ? (
                <button
                  onClick={goNext}
                  disabled={
                    (step === "items"    && activeItems.length === 0) ||
                    (step === "delivery" && !deliveryValid)
                  }
                  className="
                    flex-[2] min-h-[44px] rounded-2xl
                    text-[10px] font-black uppercase tracking-[0.14em]
                    bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E8C98A]
                    text-[#0E0A06]
                    shadow-[0_2px_8px_rgba(212,169,122,0.25)]
                    hover:brightness-105 hover:shadow-[0_4px_16px_rgba(212,169,122,0.35)]
                    disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100
                    transition-all
                  "
                >
                  {step === "items" ? "Set Delivery →" : "Review Order →"}
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={!canConfirm || isPending}
                  className="
                    flex-[2] min-h-[44px] rounded-2xl
                    text-[10px] font-black uppercase tracking-[0.14em]
                    bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E8C98A]
                    text-[#0E0A06]
                    shadow-[0_2px_8px_rgba(212,169,122,0.25)]
                    hover:brightness-105 hover:shadow-[0_4px_16px_rgba(212,169,122,0.35)]
                    disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100
                    transition-all
                  "
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0E0A06]/30 border-t-[#0E0A06] animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    "Confirm Order ✦"
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}