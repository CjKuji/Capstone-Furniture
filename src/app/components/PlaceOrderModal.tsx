"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import DeliveryMethodModal from "@/app/components/DeliveryMethodModal";
import RequestModal from "@/app/components/RequestModal";
import { useOrderCreate } from "@/hooks/useCreateorder";

/* ================= TYPES ================= */

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

type DeliveryData = {
  delivery_method: "pickup" | "delivery";
  phone_number: string | null;
  delivery_address: string | null;
  pickup_location: string | null;
};

type RequestData = {
  description: string;
};

type OrderDraft = {
  delivery: DeliveryData | null;
  request: RequestData | null;
};

/* ================= FACTORY ================= */

function buildItems(furniture: Furniture): SelectedItem[] {
  return [
    ...furniture.variants.map((v) => ({
      furniture_id: furniture.id,
      variant_id: v.id,
      quantity: 0,
      label: `${furniture.name} • ${v.name}`,
      unit_price: furniture.base_price + v.price_adjustment,
    })),
    {
      furniture_id: furniture.id,
      variant_id: null,
      quantity: 0,
      label: `${furniture.name} (Base)`,
      unit_price: furniture.base_price,
    },
  ];
}

/* ================= COMPONENT ================= */

export default function PlaceOrderModal({
  open,
  onClose,
  furniture,
}: {
  open: boolean;
  onClose: () => void;
  furniture: Furniture;
}) {
  const { createOrder, isPending } = useOrderCreate();

  const [list, setList] = useState<SelectedItem[]>(() =>
    buildItems(furniture)
  );

  const [orderDraft, setOrderDraft] = useState<OrderDraft>({
    delivery: null,
    request: null,
  });

  const [showDelivery, setShowDelivery] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  /* ================= RESET ================= */

  function reset() {
    setList(buildItems(furniture));
    setOrderDraft({ delivery: null, request: null });
  }

  if (!open) return null;

  /* ================= DERIVED ================= */

  const activeItems = list.filter((i) => i.quantity > 0);

  const subtotal = useMemo(
    () =>
      activeItems.reduce(
        (sum, i) => sum + i.quantity * i.unit_price,
        0
      ),
    [activeItems]
  );

  const canPlaceOrder = activeItems.length > 0 && !!orderDraft.delivery;

  /* ================= ACTIONS ================= */

  function updateQty(index: number, delta: number) {
    setList((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    );
  }

  async function handlePlaceOrder() {
    if (!canPlaceOrder || !orderDraft.delivery) return;

    const payload = {
      delivery_method: orderDraft.delivery.delivery_method,
      phone_number: orderDraft.delivery.phone_number,
      delivery_address: orderDraft.delivery.delivery_address,
      pickup_location: orderDraft.delivery.pickup_location,

      items: activeItems.map((i) => ({
        furniture_id: i.furniture_id,
        variant_id: i.variant_id,
        quantity: i.quantity,
      })),

      request: orderDraft.request?.description
        ? { description: orderDraft.request.description }
        : null,
    };

    await createOrder(payload);

    reset();
    onClose();
  }

  /* ================= UI ================= */

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">

        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between border-b px-6 py-4">

          <div>
            <h2 className="text-xl font-semibold text-black">
              Place Order
            </h2>
            <p className="text-sm text-black">
              {furniture.name}
            </p>
          </div>

          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-xl text-black"
          >
            ✕
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="max-h-[60vh] space-y-4 overflow-auto p-6">

          {/* ITEMS */}
          <div className="space-y-3">

            {list.map((item, idx) => (
              <div
                key={`${item.furniture_id}-${item.variant_id ?? "base"}`}
                className="flex items-center justify-between rounded-xl border border-black/10 p-4"
              >

                <div>
                  <div className="font-medium text-black">
                    {item.label}
                  </div>
                  <div className="text-sm text-black">
                    ₱{item.unit_price.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">

                  <button
                    onClick={() => updateQty(idx, -1)}
                    className="h-8 w-8 rounded-lg border border-black/20 text-black hover:bg-black hover:text-white"
                  >
                    −
                  </button>

                  <span className="min-w-[28px] text-center text-black font-medium">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => updateQty(idx, 1)}
                    className="h-8 w-8 rounded-lg border border-black/20 text-black hover:bg-black hover:text-white"
                  >
                    +
                  </button>

                </div>

              </div>
            ))}

          </div>

          {/* SUMMARY */}
          <div className="flex items-center justify-between border-t pt-4 text-black font-semibold">
            <span>Total</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>

        </div>

        {/* ================= ACTIONS ================= */}
        <div className="space-y-3 border-t bg-white p-6">

          <button
            onClick={() => setShowDelivery(true)}
            className="w-full rounded-xl border border-black/20 py-3 font-medium text-black hover:bg-black hover:text-white"
          >
            Delivery Method
          </button>

          <button
            onClick={() => setShowRequest(true)}
            className="w-full rounded-xl border border-black/20 py-3 font-medium text-black hover:bg-black hover:text-white"
          >
            Add Request Details
          </button>

          <button
            onClick={handlePlaceOrder}
            disabled={!canPlaceOrder || isPending}
            className="w-full rounded-xl bg-black py-3 font-semibold text-white disabled:opacity-40"
          >
            {isPending ? "Processing..." : "Confirm Order"}
          </button>

          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="w-full text-sm font-medium text-black underline"
          >
            Cancel
          </button>

        </div>

      </div>

      {/* ================= MODALS ================= */}
      <DeliveryMethodModal
        open={showDelivery}
        onClose={() => setShowDelivery(false)}
        items={activeItems}
        onSave={(d) =>
          setOrderDraft((p) => ({ ...p, delivery: d }))
        }
      />

      <RequestModal
        open={showRequest}
        onClose={() => setShowRequest(false)}
        items={activeItems}
        onSave={(d) =>
          setOrderDraft((p) => ({ ...p, request: d }))
        }
      />

    </div>,
    document.body
  );
}