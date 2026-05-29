"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useOrderCreate } from "@/hooks/useCreateorder";
import {
  DeliveryStep,
  buildDeliveryData,
  isDeliveryStepValid,
  STORE_PICKUP,
} from "@/app/components/DeliveryMethodModal";
import type { DeliveryStepState } from "@/app/components/DeliveryMethodModal";
import { RequestStep, isRequestStepValid } from "@/app/components/RequestModal";
import type { RequestStepState } from "@/app/components/RequestModal";

/* ── TYPES ── */

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

type SelectedItem = {
  furniture_id: string;
  variant_id: string | null;
  quantity: number;
  label: string;
  unit_price: number;
};

/* ── CONSTANTS ── */

type Step = "items" | "delivery" | "review" | "success";
const WIZARD_STEPS: Exclude<Step, "success">[] = ["items", "delivery", "review"];
const STEP_LABELS: Record<string, string> = {
  items:    "Items",
  delivery: "Delivery",
  review:   "Review",
};

/* ── HELPERS ── */

function buildItems(furniture: Furniture): SelectedItem[] {
  return [
    ...furniture.variants.map((v) => ({
      furniture_id: furniture.id,
      variant_id:   v.id,
      quantity:     0,
      label:        `${furniture.name} • ${v.name}`,
      unit_price:   furniture.base_price + v.price_adjustment,
    })),
    {
      furniture_id: furniture.id,
      variant_id:   null,
      quantity:     0,
      label:        `${furniture.name} (Base)`,
      unit_price:   furniture.base_price,
    },
  ];
}

/* ── COMPONENT ── */

type Props = {
  open: boolean;
  onClose: () => void;
  furniture: Furniture;
};

export default function PlaceOrderModal({ open, onClose, furniture }: Props) {
  const { createOrder, isPending } = useOrderCreate();

  /* ── STATE ── */
  const [step, setStep]                     = useState<Step>("items");
  const [list, setList]                     = useState<SelectedItem[]>(() => buildItems(furniture));
  const [deliveryState, setDeliveryState]   = useState<DeliveryStepState>({ method: "pickup", phone: "", address: "" });
  const [requestState, setRequestState]     = useState<RequestStepState>({ description: "" });

  /* ── DERIVED ── */
  const activeItems    = useMemo(() => list.filter((i) => i.quantity > 0), [list]);
  const subtotal       = useMemo(() => activeItems.reduce((s, i) => s + i.quantity * i.unit_price, 0), [activeItems]);
  const deliveryValid  = isDeliveryStepValid(deliveryState);
  const canConfirm     = activeItems.length > 0 && deliveryValid;
  const isSuccess      = step === "success";
  const stepIndex      = WIZARD_STEPS.indexOf(step as any);

  /* ── ACTIONS ── */
  function reset() {
    setStep("items");
    setList(buildItems(furniture));
    setDeliveryState({ method: "pickup", phone: "", address: "" });
    setRequestState({ description: "" });
  }

  function handleClose() { reset(); onClose(); }

  function updateQty(index: number, delta: number) {
    setList((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      )
    );
  }

  function goNext() {
    if (step === "items" && activeItems.length > 0)   setStep("delivery");
    else if (step === "delivery" && deliveryValid)     setStep("review");
  }

  function goPrev() {
    if (step === "delivery") setStep("items");
    else if (step === "review") setStep("delivery");
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
      request: requestState.description.trim()
        ? { description: requestState.description.trim() }
        : null,
    });
    setStep("success");
  }

  if (!open) return null;

  return createPortal(
    /* ── OVERLAY ── */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">

      {/* ── SHEET / DIALOG ── */}
      <div className="
        relative flex flex-col
        w-full sm:max-w-lg
        /* mobile: bottom-sheet that fills but never overflows */
        max-h-[96dvh] sm:max-h-[90vh]
        /* rounding: flat top on mobile sheets, fully rounded on sm+ */
        rounded-t-3xl sm:rounded-3xl
        overflow-hidden
        bg-[#0B0704]
        border-t border-x sm:border border-[#2A1F14]
        shadow-[0_-16px_80px_rgba(0,0,0,0.9)] sm:shadow-[0_32px_80px_rgba(0,0,0,0.8)]
      ">

        {/* ── DRAG PILL (mobile only) ── */}
        {!isSuccess && (
          <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
            <div className="h-1 w-10 rounded-full bg-white/15" />
          </div>
        )}

        {/* ── HEADER ── */}
        {!isSuccess && (
          <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#2A1F14] px-4 sm:px-5 py-3.5 bg-[#0E0B06]/60">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
                Place Order
              </p>
              <h2 className="text-sm font-semibold text-white/85 truncate">{furniture.name}</h2>
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

        {/* ── STEP INDICATOR ── */}
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
                {/* label always visible — short labels fit on any width */}
                <span>{STEP_LABELS[s]}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-[#2A1F14] scrollbar-track-transparent">

          {/* SUCCESS */}
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
                  <span className="text-white/65">{furniture.name}</span>{" "}
                  has been submitted. Our team will review and confirm the details shortly.
                </p>
              </div>

              <div className="w-full rounded-2xl border border-[#2A1F14] bg-[#160F08] divide-y divide-[#2A1F14] overflow-hidden">
                {[
                  { label: "Items",  value: `${activeItems.length} variant${activeItems.length !== 1 ? "s" : ""}` },
                  { label: "Method", value: deliveryState.method === "pickup" ? "Store Pickup" : "Delivery", gold: true },
                  { label: "Total",  value: `₱${subtotal.toLocaleString()}`, gold: true, large: true },
                ].map(({ label, value, gold, large }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25">{label}</span>
                    <span className={`font-${large ? "bold" : "semibold"} ${large ? "text-[14px]" : "text-[12px]"} ${gold ? "text-[#D4A97A]" : "text-white/50"}`}>
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

          {/* STEP 1: ITEMS */}
          {step === "items" && (
            <div className="p-4 sm:p-5 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25 pb-1">
                Choose Variants &amp; Quantities
              </p>

              {list.map((item, index) => (
                <div
                  key={`${item.furniture_id}-${item.variant_id ?? "base"}`}
                  className={`
                    flex items-center justify-between rounded-2xl border p-3.5 transition-all
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
                      onClick={() => updateQty(index, -1)}
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
                      onClick={() => updateQty(index, 1)}
                      className="
                        h-8 w-8 rounded-xl border border-[#2A1F14] bg-white/[0.03]
                        text-white/50 text-sm
                        hover:border-[#D4A97A]/30 hover:bg-white/[0.06] hover:text-white/80
                        transition-all
                      "
                    >+</button>
                  </div>
                </div>
              ))}

              {activeItems.length > 0 && (
                <div className="flex items-center justify-between rounded-2xl border border-[#2A1F14] bg-[#160F08] px-4 py-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Subtotal</span>
                  <span className="text-[13px] font-semibold text-[#D4A97A]">₱{subtotal.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DELIVERY */}
          {step === "delivery" && (
            <>
              <DeliveryStep state={deliveryState} onChange={setDeliveryState} />
              <div className="px-4 sm:px-5 pb-5">
                <RequestStep state={requestState} onChange={setRequestState} items={activeItems} />
              </div>
            </>
          )}

          {/* STEP 3: REVIEW */}
          {step === "review" && (
            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25 pb-1">
                Order Summary
              </p>

              {/* ITEMS TABLE */}
              <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] divide-y divide-[#2A1F14] overflow-hidden">
                <div className="px-4 py-2.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25">Items</p>
                </div>
                {activeItems.map((item, i) => (
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
                <div className="flex items-center justify-between px-4 py-3 bg-[#D4A97A]/[0.04]">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/40">Total</span>
                  <span className="text-[14px] font-bold text-[#D4A97A]">₱{subtotal.toLocaleString()}</span>
                </div>
              </div>

              {/* DELIVERY */}
              <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] divide-y divide-[#2A1F14] overflow-hidden">
                <div className="px-4 py-2.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25">Delivery</p>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {[
                    { label: "Method", value: deliveryState.method === "pickup" ? "Store Pickup" : "Delivery", gold: true },
                    { label: "Phone",  value: deliveryState.phone },
                    ...(deliveryState.method === "delivery" && deliveryState.address
                      ? [{ label: "Address",  value: deliveryState.address }]
                      : []),
                    ...(deliveryState.method === "pickup"
                      ? [{ label: "Location", value: STORE_PICKUP }]
                      : []),
                  ].map(({ label, value, gold }: any) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-[10px] text-white/30 uppercase tracking-wide shrink-0">{label}</span>
                      <span className={`text-[11px] text-right ${gold ? "font-semibold text-[#D4A97A] uppercase tracking-wide" : "text-white/60"}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CUSTOM REQUEST */}
              {requestState.description.trim() && (
                <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] divide-y divide-[#2A1F14] overflow-hidden">
                  <div className="px-4 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/25">Custom Request</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[12px] text-white/60 leading-relaxed">{requestState.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        {!isSuccess && (
          <div className="shrink-0 border-t border-[#2A1F14] bg-[#0E0B06]/60 px-4 sm:px-5 py-3.5">
            {/* Safe area padding for mobile home-bar */}
            <div className="flex gap-2.5 pb-[env(safe-area-inset-bottom)]">

              {/* BACK / CANCEL */}
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

              {/* NEXT / CONFIRM */}
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