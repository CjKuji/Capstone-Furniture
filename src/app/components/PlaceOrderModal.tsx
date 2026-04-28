"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { useOrderCreate } from "@/hooks/useCreateorder";
import type { DeliveryMethod } from "@/types/enums";

type Props = {
  open: boolean;
  onClose: () => void;

  furnitureId: string;
  variantId: string | null;

  furnitureName: string;

  basePrice?: number | null;
  selectedVariantName?: string | null;
  variantPriceAdjustment?: number | null;
};

export default function PlaceOrderModal({
  open,
  onClose,
  furnitureId,
  variantId,
  furnitureName,
  basePrice = 0,
  selectedVariantName = null,
  variantPriceAdjustment = 0,
}: Props) {
  const { mutateAsync, isPending } = useOrderCreate();

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pickup");

  const [form, setForm] = useState({
    customer_name: "",
    phone_number: "",
    delivery_address: "",
    delivery_notes: "",
  });

  if (!open) return null;

  const isDelivery = deliveryMethod === "delivery";

  /*
  =========================================================
  PRICE (UI ONLY — backend recalculates anyway)
  =========================================================
  */
  const base = Number(basePrice ?? 0);
  const variantAdj = Number(variantPriceAdjustment ?? 0);
  const estimatedTotal = base + variantAdj;

  /*
  =========================================================
  VALIDATION
  =========================================================
  */
  function validate() {
    if (!isDelivery) return true;

    if (
      !form.customer_name.trim() ||
      !form.phone_number.trim() ||
      !form.delivery_address.trim()
    ) {
      alert("Please complete delivery details.");
      return false;
    }

    return true;
  }

  /*
  =========================================================
  SUBMIT ORDER
  (ALIGNED WITH createOrder SERVICE)
  =========================================================
  */
  async function handleSubmit() {
    if (isPending) return;
    if (!validate()) return;

    try {
      await mutateAsync({
        furniture_id: furnitureId,
        variant_id: variantId ?? null,

        delivery_method: deliveryMethod,

        customer_name: isDelivery
          ? form.customer_name.trim()
          : null,

        phone_number: isDelivery
          ? form.phone_number.trim()
          : null,

        delivery_address: isDelivery
          ? form.delivery_address.trim()
          : null,

        delivery_notes: form.delivery_notes.trim() || null,
      });

      onClose();
    } catch (err) {
      console.error("❌ Order creation failed:", err);
      alert("Failed to create order. Please try again.");
    }
  }

  /*
  =========================================================
  UI
  =========================================================
  */
  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div>
          <h2 className="text-xl font-semibold">Place Order</h2>
          <p className="text-sm text-gray-500 mt-1">
            {furnitureName}
          </p>
        </div>

        {/* ORDER SUMMARY */}
        <div className="border rounded-xl p-4 bg-[#FAFAFA] space-y-3">
          <h3 className="font-semibold">Order Summary</h3>

          <div className="flex justify-between text-sm">
            <span>Furniture</span>
            <span>{furnitureName}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Base Price</span>
            <span>₱{base.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Selected Variant</span>
            <span>{selectedVariantName || "Default"}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Variant Adjustment</span>
            <span>₱{variantAdj.toLocaleString()}</span>
          </div>

          <div className="border-t pt-3 flex justify-between font-semibold">
            <span>Estimated Total</span>
            <span>₱{estimatedTotal.toLocaleString()}</span>
          </div>

          <p className="text-xs text-gray-500">
            Final price will be confirmed by admin.
          </p>
        </div>

        {/* DELIVERY METHOD */}
        <div className="space-y-2">
          <p className="font-medium">Delivery Method</p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeliveryMethod("pickup")}
              className={`px-4 py-2 rounded-lg border ${
                deliveryMethod === "pickup"
                  ? "bg-black text-white"
                  : ""
              }`}
            >
              Pickup
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMethod("delivery")}
              className={`px-4 py-2 rounded-lg border ${
                deliveryMethod === "delivery"
                  ? "bg-black text-white"
                  : ""
              }`}
            >
              Delivery
            </button>
          </div>
        </div>

        {/* PICKUP INFO */}
        {!isDelivery && (
          <div className="p-4 bg-gray-100 rounded-lg text-sm">
            <p className="font-medium">Pickup Location</p>
            <p className="text-gray-600 mt-1">
              Visit our workshop to collect your furniture.
            </p>
          </div>
        )}

        {/* DELIVERY FORM */}
        {isDelivery && (
          <div className="space-y-3">
            <input
              placeholder="Full Name"
              className="w-full border p-3 rounded-lg"
              value={form.customer_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  customer_name: e.target.value,
                })
              }
            />

            <input
              placeholder="Phone Number"
              className="w-full border p-3 rounded-lg"
              value={form.phone_number}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone_number: e.target.value,
                })
              }
            />

            <textarea
              placeholder="Delivery Address"
              rows={4}
              className="w-full border p-3 rounded-lg"
              value={form.delivery_address}
              onChange={(e) =>
                setForm({
                  ...form,
                  delivery_address: e.target.value,
                })
              }
            />
          </div>
        )}

        {/* NOTES */}
        <textarea
          placeholder="Notes (optional)"
          rows={3}
          className="w-full border p-3 rounded-lg"
          value={form.delivery_notes}
          onChange={(e) =>
            setForm({
              ...form,
              delivery_notes: e.target.value,
            })
          }
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="px-5 py-2 bg-black text-white rounded-lg disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Confirm Order"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}