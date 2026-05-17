"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { DeliveryMethod } from "@/types/enums";

/* ── TYPES ── */

export type SelectedItem = {
  furniture_id: string;
  variant_id: string | null;
  quantity: number;
  label: string;
  unit_price: number;
};

export type DeliveryData = {
  delivery_method: DeliveryMethod;
  phone_number: string | null;
  delivery_address: string | null;
  pickup_location: string | null;
};

export type DeliveryStepState = {
  method: DeliveryMethod;
  phone: string;
  address: string;
};

/* ── CONSTANTS ── */

export const STORE_PICKUP = "BL Sash Factory, 92 Upper Kalaklan, Olongapo City";

/* ── SHARED FIELD STYLES ── */

const inputCls = `
  w-full rounded-2xl border border-[#2A1F14] bg-[#160F08]
  px-4 py-3 text-[13px] text-white/80
  placeholder:text-white/20
  focus:outline-none focus:border-[#D4A97A]/40
  transition-colors
`;

const labelCls = "text-[10px] font-black uppercase tracking-[0.14em] text-white/30";

/* ══════════════════════════════════════════════════════════════
   DELIVERY STEP — inline panel, no portal, no backdrop
   Used inside PlaceOrderModal wizard
══════════════════════════════════════════════════════════════ */

type DeliveryStepProps = {
  state: DeliveryStepState;
  onChange: (next: DeliveryStepState) => void;
};

export function DeliveryStep({ state, onChange }: DeliveryStepProps) {
  const { method, phone, address } = state;
  const isDelivery = method === "delivery";

  function set(patch: Partial<DeliveryStepState>) {
    onChange({ ...state, ...patch });
  }

  return (
    <div className="p-5 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25 pb-1">
        How Should We Deliver?
      </p>

      {/* Method toggle */}
      <div className="grid grid-cols-2 gap-2">
        {(["pickup", "delivery"] as const).map((m) => (
          <button
            key={m}
            onClick={() => set({ method: m })}
            className={`
              py-3 rounded-2xl border text-[12px] font-black uppercase tracking-[0.12em] transition-all
              ${method === m
                ? "border-[#D4A97A]/40 bg-[#D4A97A]/[0.08] text-[#D4A97A]"
                : "border-[#2A1F14] bg-[#160F08] text-white/35 hover:text-white/60"}
            `}
          >
            {m === "pickup" ? "Store Pickup" : "Deliver to Me"}
          </button>
        ))}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <label className={labelCls}>Phone Number</label>
        <input
          className={inputCls}
          placeholder="09xx xxx xxxx"
          value={phone}
          onChange={(e) => set({ phone: e.target.value })}
        />
      </div>

      {/* Address */}
      {isDelivery && (
        <div className="space-y-1.5">
          <label className={labelCls}>Delivery Address</label>
          <textarea
            className={`${inputCls} min-h-[100px] resize-none`}
            placeholder="House No, Street, Barangay, City, Province"
            value={address}
            onChange={(e) => set({ address: e.target.value })}
          />
        </div>
      )}

      {/* Pickup location */}
      {!isDelivery && (
        <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25 mb-1.5">
            Pickup Location
          </p>
          <p className="text-[13px] text-white/55 leading-relaxed">{STORE_PICKUP}</p>
        </div>
      )}

      {/* Draft hint */}
      <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] px-4 py-3">
        <p className="text-[11px] text-[#7A5C3A] leading-relaxed">
          ✦ &nbsp;This is a draft — you can still edit everything before confirming.
        </p>
      </div>
    </div>
  );
}

/* ── HELPER: build DeliveryData from step state ── */
export function buildDeliveryData(state: DeliveryStepState): DeliveryData {
  return {
    delivery_method: state.method,
    phone_number: state.phone.trim() || null,
    delivery_address: state.method === "delivery" ? state.address.trim() || null : null,
    pickup_location: state.method === "pickup" ? STORE_PICKUP : null,
  };
}

/* ── HELPER: validate step ── */
export function isDeliveryStepValid(state: DeliveryStepState): boolean {
  const phoneValid = state.phone.trim().length >= 10;
  const addressValid = state.method !== "delivery" || state.address.trim().length >= 10;
  return phoneValid && addressValid;
}

/* ══════════════════════════════════════════════════════════════
   STANDALONE MODAL — wraps DeliveryStep in its own portal shell
   Used independently when needed outside the wizard
══════════════════════════════════════════════════════════════ */

type DeliveryMethodModalProps = {
  open: boolean;
  onClose: () => void;
  items: SelectedItem[];
  onSave?: (data: DeliveryData) => void;
  initialValue?: DeliveryData | null;
};

export default function DeliveryMethodModal({
  open,
  onClose,
  items,
  onSave,
  initialValue = null,
}: DeliveryMethodModalProps) {
  const [state, setState] = useState<DeliveryStepState>({
    method: "pickup",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (!open) return;
    setState({
      method: initialValue?.delivery_method ?? "pickup",
      phone: initialValue?.phone_number ?? "",
      address: initialValue?.delivery_address ?? "",
    });
  }, [open, initialValue]);

  const payload = useMemo(() => buildDeliveryData(state), [state]);

  function handleSave() {
    if (!items?.length) return;
    if (!isDeliveryStepValid(state)) return;
    if (typeof onSave !== "function") return;
    onSave(payload);
    onClose();
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="
        relative w-full max-w-md
        rounded-3xl bg-[#0B0704]
        border border-[#2A1F14]
        shadow-[0_32px_80px_rgba(0,0,0,0.8)]
        overflow-hidden
      ">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#2A1F14] px-5 py-4 bg-[#0E0B06]/60">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/25">
              Configuration
            </p>
            <h2 className="text-sm font-semibold text-white/85">Delivery Method</h2>
          </div>
          <button
            onClick={onClose}
            className="
              flex h-8 w-8 items-center justify-center
              rounded-full border border-[#2A1F14] bg-white/[0.03]
              text-white/35 text-xs
              hover:bg-white/[0.07] hover:text-white/60 hover:border-[#D4A97A]/20
              transition-all
            "
          >
            ✕
          </button>
        </div>

        {/* Body — reuse the step panel */}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A1F14]">
          <DeliveryStep state={state} onChange={setState} />

          {/* Order items summary */}
          {items.length > 0 && (
            <div className="px-5 pb-5">
              <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] divide-y divide-[#2A1F14] overflow-hidden">
                <div className="px-4 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
                    Order Items
                  </p>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[13px] text-white/60 truncate pr-3">{item.label}</span>
                    <span className="text-[12px] font-semibold text-[#D4A97A]/70 flex-shrink-0">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2A1F14] bg-[#0E0B06]/60 px-5 py-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="
                flex-1 rounded-2xl border border-[#2A1F14] bg-white/[0.02]
                py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white/30
                hover:bg-white/[0.05] hover:text-white/50
                transition-all
              "
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="
                flex-[2] rounded-2xl py-3
                text-[11px] font-black uppercase tracking-[0.14em]
                bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E8C98A]
                text-[#0E0A06]
                shadow-[0_2px_8px_rgba(212,169,122,0.25)]
                hover:brightness-105 hover:shadow-[0_4px_16px_rgba(212,169,122,0.35)]
                transition-all
              "
            >
              Save Method ✦
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}