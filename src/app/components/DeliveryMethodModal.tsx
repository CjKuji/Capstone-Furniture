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
  onSave?: (data: DeliveryData) => void;
  initialValue?: DeliveryData | null;
};

/**
 * =========================================================
 * COMPONENT
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

  const [method, setMethod] = useState<DeliveryMethod>("pickup");

  const [form, setForm] = useState({
    phone_number: "",
    delivery_address: "",
  });

  const isDelivery = method === "delivery";

  /**
   * =========================================================
   * HYDRATION
   * =========================================================
   */
  useEffect(() => {
    if (!open) return;

    if (initialValue) {
      setMethod(initialValue.delivery_method);

      setForm({
        phone_number: initialValue.phone_number ?? "",
        delivery_address: initialValue.delivery_address ?? "",
      });
    } else {
      setMethod("pickup");
      setForm({
        phone_number: "",
        delivery_address: "",
      });
    }
  }, [open, initialValue]);

  /**
   * =========================================================
   * PAYLOAD
   * =========================================================
   */
  const payload: DeliveryData = useMemo(() => {
    return {
      delivery_method: method,
      phone_number: form.phone_number.trim() || null,
      delivery_address: isDelivery
        ? form.delivery_address.trim() || null
        : null,
      pickup_location: isDelivery ? null : STORE_PICKUP,
    };
  }, [method, form.phone_number, form.delivery_address, isDelivery]);

  /**
   * =========================================================
   * SAVE
   * =========================================================
   */
  function handleSave() {
    if (!items?.length) return;

    const phoneValid = form.phone_number.trim().length >= 10;
    const addressValid =
      !isDelivery || form.delivery_address.trim().length >= 10;

    if (!phoneValid || !addressValid) return;
    if (typeof onSave !== "function") return;

    onSave(payload);
    onClose();
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-black p-6 space-y-6">

        {/* HEADER */}
        <div>
          <h2 className="text-2xl font-bold text-black">
            Delivery Method
          </h2>
          <p className="text-sm text-black font-medium mt-1">
            Choose how your order will be delivered
          </p>
        </div>

        {/* TOGGLE */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMethod("pickup")}
            className={`py-3 rounded-xl border font-semibold transition ${
              method === "pickup"
                ? "bg-black text-white border-black"
                : "bg-white text-black border-black hover:bg-black hover:text-white"
            }`}
          >
            Pickup
          </button>

          <button
            onClick={() => setMethod("delivery")}
            className={`py-3 rounded-xl border font-semibold transition ${
              method === "delivery"
                ? "bg-black text-white border-black"
                : "bg-white text-black border-black hover:bg-black hover:text-white"
            }`}
          >
            Delivery
          </button>
        </div>

        {/* PHONE */}
        <div>
          <label className="text-sm font-bold text-black">
            Phone Number
          </label>

          <input
            className="w-full mt-2 px-4 py-3 border border-black rounded-xl text-sm text-black placeholder-black/60"
            placeholder="09xx xxx xxxx"
            value={form.phone_number}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                phone_number: e.target.value,
              }))
            }
          />
        </div>

        {/* ADDRESS */}
        {isDelivery && (
          <div>
            <label className="text-sm font-bold text-black">
              Delivery Address
            </label>

            <textarea
              className="w-full mt-2 px-4 py-3 border border-black rounded-xl text-sm text-black min-h-[110px]"
              placeholder="House No, Street, Barangay, City, Province"
              value={form.delivery_address}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  delivery_address: e.target.value,
                }))
              }
            />
          </div>
        )}

        {/* PICKUP */}
        {!isDelivery && (
          <div className="rounded-xl border border-black p-4">
            <div className="font-bold text-black">
              Pickup Location
            </div>
            <div className="text-black font-medium mt-1">
              {STORE_PICKUP}
            </div>
          </div>
        )}

        {/* ITEMS */}
        <div className="rounded-xl border border-black p-4 space-y-2">
          <div className="font-bold text-black">
            Order Items
          </div>

          {items.map((i, idx) => (
            <div
              key={idx}
              className="flex justify-between text-sm text-black font-medium"
            >
              <span className="truncate pr-3">{i.label}</span>
              <span>x{i.quantity}</span>
            </div>
          ))}
        </div>

        {/* TIP */}
        <div className="text-sm font-medium text-black border border-black p-3 rounded-xl">
          💡 This is only a draft — you can still edit everything before placing order.
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-black font-semibold text-black hover:bg-black hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-black text-white font-semibold hover:opacity-90"
          >
            Save
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}