"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ── TYPES ── */

export type RequestStepState = {
  description: string;
  imageFiles:  File[];
};

export type RequestData = {
  description: string;
  imageFiles:  File[];
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
  return (
    state.description.trim().length === 0 ||
    state.description.trim().length >= 5
  );
}

/* ── IMAGE PICKER ── */

type ImagePickerProps = {
  files:    File[];
  onChange: (files: File[]) => void;
};

function ImagePicker({ files, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const MAX = 5;
  const canAdd = files.length < MAX;

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const merged = [...files, ...picked].slice(0, MAX);
    onChange(merged);
    e.target.value = "";
  }

  function handleRemove(idx: number) {
    onChange(files.filter((_, i) => i !== idx));
  }

  function openLightbox(file: File) {
    setLightbox(URL.createObjectURL(file));
  }

  function closeLightbox() {
    if (lightbox) URL.revokeObjectURL(lightbox);
    setLightbox(null);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className={labelCls}>
          Reference Images{" "}
          <span className="text-white/15 normal-case tracking-normal font-medium">
            (optional · max {MAX})
          </span>
        </label>
        {files.length > 0 && (
          <span className="text-[10px] text-white/20">{files.length}/{MAX}</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {/* Thumbnail grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {files.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-[#2A1F14] group cursor-pointer"
                onClick={() => openLightbox(file)}
              >
                <img
                  src={url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                  <span className="text-white/0 group-hover:text-white/80 text-xs transition-all">⤢</span>
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                  className="
                    absolute top-1 right-1
                    flex h-5 w-5 items-center justify-center
                    rounded-full bg-black/80 border border-white/10
                    text-white/60 text-[9px]
                    opacity-0 group-hover:opacity-100
                    hover:text-white transition-all
                  "
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Add more slot */}
          {canAdd && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="
                aspect-square rounded-xl border border-dashed border-[#2A1F14] bg-[#160F08]
                flex flex-col items-center justify-center gap-1
                text-white/20
                hover:border-[#D4A97A]/30 hover:text-white/40
                transition-all
              "
            >
              <span className="text-lg">+</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="
            w-full rounded-2xl border border-dashed border-[#2A1F14] bg-[#160F08]
            py-6 flex flex-col items-center gap-2
            text-white/20
            hover:border-[#D4A97A]/30 hover:bg-[#D4A97A]/[0.02] hover:text-white/40
            transition-all
          "
        >
          <span className="text-2xl">✦</span>
          <span className="text-[11px] font-black uppercase tracking-[0.12em]">
            Tap to upload images
          </span>
          <span className="text-[10px] text-white/15">
            JPG, PNG, WEBP — up to {MAX} images
          </span>
        </button>
      )}

      {/* Lightbox */}
      {lightbox && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={closeLightbox}
        >
          <img
            src={lightbox}
            alt="Preview"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={closeLightbox}
            className="
              absolute top-4 right-4
              flex h-9 w-9 items-center justify-center
              rounded-full bg-black/70 border border-white/10
              text-white/60 text-sm
              hover:text-white transition-all
            "
          >
            ✕
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   REQUEST STEP — inline panel, no portal, no backdrop
══════════════════════════════════════════════════════════════ */

type RequestStepProps = {
  state:    RequestStepState;
  onChange: (next: RequestStepState) => void;
};

export function RequestStep({ state, onChange }: RequestStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/25">
        Customize Your Order
      </p>

      {/* Description */}
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
          onChange={(e) => onChange({ ...state, description: e.target.value })}
        />
        {state.description.trim().length > 0 && state.description.trim().length < 5 && (
          <p className="text-[10px] text-[#7A5C3A] px-1">Minimum 5 characters</p>
        )}
      </div>

      {/* Image picker */}
      <ImagePicker
        files={state.imageFiles}
        onChange={(imageFiles) => onChange({ ...state, imageFiles })}
      />

      {/* Hint */}
      <div className="rounded-2xl border border-[#2A1F14] bg-[#160F08] px-4 py-3">
        <p className="text-[11px] text-[#7A5C3A] leading-relaxed">
          ✦ &nbsp;Be specific — size, material, color, finish, or attach reference photos to help us build exactly what you want.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STANDALONE MODAL
══════════════════════════════════════════════════════════════ */

type SelectedItem = {
  furniture_id: string;
  variant_id:   string | null;
  quantity:     number;
  label:        string;
  unit_price:   number;
};

type RequestModalProps = {
  open:          boolean;
  onClose:       () => void;
  items?:        SelectedItem[];
  onSave:        (data: RequestData) => void;
  initialValue?: RequestData | null;
};

/* Inner component — remounts on each open via key, so useState lazy init always runs fresh */
function RequestModalInner({
  onClose,
  items = [],
  onSave,
  initialValue,
}: Omit<RequestModalProps, "open">) {
  // items defaults handled at call site in outer wrapper
  const [state, setState] = useState<RequestStepState>({
    description: initialValue?.description ?? "",
    imageFiles:  initialValue?.imageFiles  ?? [],
  });

  function handleSave() {
    if (!isRequestStepValid(state)) return;
    onSave({
      description: state.description.trim(),
      imageFiles:  state.imageFiles,
    });
    onClose();
  }

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
          <RequestStep state={state} onChange={setState} />

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

/* Outer shell — only renders inner when open; fresh key resets state each time */
export default function RequestModal({
  open,
  onClose,
  items = [],
  onSave,
  initialValue = null,
}: RequestModalProps) {
  if (!open) return null;
  return (
    <RequestModalInner
      key="modal"
      onClose={onClose}
      items={items}
      onSave={onSave}
      initialValue={initialValue}
    />
  );
}