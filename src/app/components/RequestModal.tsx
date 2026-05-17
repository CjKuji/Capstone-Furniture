"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/* ── TYPES ── */

export type RequestStepState = {
  description: string;
};

export type RequestData = {
  description: string;
};

/* ── SHARED FIELD STYLES ── */

const inputCls = `
  w-full rounded-2xl border border-[#2A1F14] bg-[#160F08]
  px-4 py-3 text-[13px] text-white/80
  placeholder:text-white/20
  focus:outline-none focus:border-[#D4A97A]/40
  transition-colors
`;

const labelCls = "text-[10px] font-black uppercase tracking-[0.14em] text-white/30";

/* ── HELPER ── */

export function isRequestStepValid(state: RequestStepState): boolean {
  return state.description.trim().length >= 5;
}

/* ══════════════════════════════════════════════════════════════
   REQUEST STEP — inline panel, no portal, no backdrop
   Used inside PlaceOrderModal wizard
══════════════════════════════════════════════════════════════ */

type RequestStepProps = {
  state: RequestStepState;
  onChange: (next: RequestStepState) => void;
  items?: Array<{ label: string; quantity: number }>;
};

export function RequestStep({ state, onChange, items = [] }: RequestStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
        Customize Your Order
      </p>

      {/* Textarea */}
      <div className="space-y-1.5">
        <label className={labelCls}>
          Request Details{" "}
          <span className="text-white/15 normal-case tracking-normal font-medium">
            (optional)
          </span>
        </label>
        <textarea
          className={`${inputCls} min-h-[100px] resize-none`}
          placeholder="Resize, finish, color, special instructions…"
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
        {state.description.trim().length > 0 && state.description.trim().length < 5 && (
          <p className="text-[10px] text-[#7A5C3A] px-1">Minimum 5 characters</p>
        )}
      </div>

      {/* Hint */}
      <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] px-4 py-3">
        <p className="text-[11px] text-[#7A5C3A] leading-relaxed">
          ✦ &nbsp;Be specific — size, material, color, finish help us build exactly what you want.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STANDALONE MODAL — wraps RequestStep in its own portal shell
   Used independently when needed outside the wizard
══════════════════════════════════════════════════════════════ */

type SelectedItem = {
  furniture_id: string;
  variant_id: string | null;
  quantity: number;
  label: string;
  unit_price: number;
};

type RequestModalProps = {
  open: boolean;
  onClose: () => void;
  items?: SelectedItem[];
  onSave: (data: RequestData) => void;
  initialValue?: RequestData | null;
};

export default function RequestModal({
  open,
  onClose,
  items = [],
  onSave,
  initialValue = null,
}: RequestModalProps) {
  const [state, setState] = useState<RequestStepState>({ description: "" });

  useEffect(() => {
    if (!open) return;
    setState({ description: initialValue?.description ?? "" });
  }, [open, initialValue]);

  function handleSave() {
    if (!isRequestStepValid(state)) return;
    onSave({ description: state.description.trim() });
    onClose();
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="
        relative w-full max-w-lg
        rounded-3xl bg-[#0B0704]
        border border-[#2A1F14]
        shadow-[0_32px_80px_rgba(0,0,0,0.8)]
        overflow-hidden
      ">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#2A1F14] px-5 py-4 bg-[#0E0B06]/60">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/25">
              Optional
            </p>
            <h2 className="text-sm font-semibold text-white/85">Custom Request</h2>
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

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A1F14]">
          <RequestStep state={state} onChange={setState} items={items} />

          {/* Items preview */}
          {items.length > 0 && (
            <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] divide-y divide-[#2A1F14] overflow-hidden">
              <div className="px-4 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
                  Items in This Order
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
              disabled={!isRequestStepValid(state)}
              className="
                flex-[2] rounded-2xl py-3
                text-[11px] font-black uppercase tracking-[0.14em]
                bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E8C98A]
                text-[#0E0A06]
                shadow-[0_2px_8px_rgba(212,169,122,0.25)]
                hover:brightness-105 hover:shadow-[0_4px_16px_rgba(212,169,122,0.35)]
                disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none
                transition-all
              "
            >
              Save Request ✦
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}