"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { DeliveryMethod } from "@/types/enums";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */

type SelectedItem = {
  furniture_id: string;
  variant_id: string | null;
  quantity: number;
  label: string;
  unit_price: number;
};

type DeliveryData = {
  delivery_method: DeliveryMethod;
  phone_number: string | null;
  delivery_address: string | null;
  pickup_location: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: SelectedItem[];

  /**
   * SAFE CALLBACK (parent must always pass this)
   */
  onSave?: (data: DeliveryData) => void;

  /**
   * RESTORE DRAFT WHEN REOPENING
   */
  initialValue?: DeliveryData | null;
};

/**
 * =========================================================
 * DELIVERY MODAL (DRAFT EDITOR)
 * =========================================================
 */

export default function DeliveryMethodModal({
  open,
  onClose,
  items,
  onSave,
  initialValue = null,
}: Props) {
  const STORE_PICKUP =
    "BL Sash Factory, 92 Upper Kalaklan, Olongapo City";

  /**
   * =========================================================
   * LOCAL STATE
   * =========================================================
   */
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pickup");

  const [form, setForm] = useState({
    phone_number: "",
    delivery_address: "",
  });

  const isDelivery = deliveryMethod === "delivery";

  /**
   * =========================================================
   * SAFE REHYDRATION (ONLY ON OPEN)
   * =========================================================
   * - restores draft
   * - avoids overwriting user edits while open
   */
  useEffect(() => {
    if (!open) return;

    if (initialValue) {
      setDeliveryMethod(initialValue.delivery_method);

      setForm({
        phone_number: initialValue.phone_number ?? "",
        delivery_address: initialValue.delivery_address ?? "",
      });
    } else {
      setDeliveryMethod("pickup");
      setForm({
        phone_number: "",
        delivery_address: "",
      });
    }
  }, [open, initialValue]);

  /**
   * =========================================================
   * CLOSE (NO STATE RESET)
   * =========================================================
   */
  function handleClose() {
    onClose();
  }

  /**
   * =========================================================
   * VALIDATION
   * =========================================================
   */
  const canSave = useMemo(() => {
    const phoneValid = form.phone_number.trim().length >= 10;

    if (!items?.length || !phoneValid) return false;

    if (isDelivery) {
      return form.delivery_address.trim().length >= 10;
    }

    return true;
  }, [form, isDelivery, items]);

  /**
   * =========================================================
   * SAVE (DRAFT ONLY → PARENT STATE)
   * =========================================================
   */
  function handleSave() {
    if (!canSave) return;
    if (typeof onSave !== "function") return; // 🔥 FIX: prevents runtime crash

    const payload: DeliveryData = {
      delivery_method: deliveryMethod,
      phone_number: form.phone_number.trim() || null,
      delivery_address: isDelivery
        ? form.delivery_address.trim()
        : null,
      pickup_location: isDelivery ? null : STORE_PICKUP,
    };

    onSave(payload);
    handleClose();
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-black/10 p-5 sm:p-7 space-y-6">

        {/* HEADER */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-black">
            Delivery Method
          </h2>

          <p className="text-sm text-black/70">
            Saved as draft — you can still edit before placing order.
          </p>
        </div>

        {/* TOGGLE */}
        <div className="flex gap-2">
          <button
            onClick={() => setDeliveryMethod("pickup")}
            className={`flex-1 py-2.5 rounded-xl border transition ${
              deliveryMethod === "pickup"
                ? "bg-black text-white border-black"
                : "text-black border-black/20 hover:border-black"
            }`}
          >
            Pickup
          </button>

          <button
            onClick={() => setDeliveryMethod("delivery")}
            className={`flex-1 py-2.5 rounded-xl border transition ${
              deliveryMethod === "delivery"
                ? "bg-black text-white border-black"
                : "text-black border-black/20 hover:border-black"
            }`}
          >
            Delivery
          </button>
        </div>

        {/* PHONE */}
        <div>
          <label className="text-sm font-medium text-black">
            Phone Number
          </label>

          <input
            className="w-full rounded-xl border border-black/20 px-3 py-2 text-sm mt-1"
            placeholder="09xx xxx xxxx"
            value={form.phone_number}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                phone_number: e.target.value,
              }))
            }
          />
        </div>

        {/* ADDRESS */}
        {isDelivery && (
          <div>
            <label className="text-sm font-medium text-black">
              Delivery Address
            </label>

            <textarea
              className="w-full rounded-xl border border-black/20 px-3 py-2 text-sm min-h-[100px] mt-1"
              placeholder="House No, Street, Barangay, City, Province"
              value={form.delivery_address}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  delivery_address: e.target.value,
                }))
              }
            />
          </div>
        )}

        {/* PICKUP */}
        {!isDelivery && (
          <div className="rounded-xl border border-black/10 p-4 text-sm">
            <div className="font-semibold">Pickup Location</div>
            <div className="text-black/70">{STORE_PICKUP}</div>
          </div>
        )}

        {/* ITEMS */}
        <div className="rounded-xl border border-black/10 p-4 space-y-2">
          <div className="text-sm font-semibold">Order Items</div>

          {items.map((i, idx) => (
            <div
              key={idx}
              className="flex justify-between text-sm text-black/70"
            >
              <span className="truncate pr-3">{i.label}</span>
              <span>x{i.quantity}</span>
            </div>
          ))}
        </div>

        {/* TIP */}
        <div className="text-xs text-black/60 border border-black/10 p-3 rounded-xl">
          💡 This is a draft step — nothing is final yet.
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-black/20"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-xl bg-black text-white disabled:opacity-40"
          >
            Save
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}