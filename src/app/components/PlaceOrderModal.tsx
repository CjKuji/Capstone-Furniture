"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import DeliveryMethodModal from "@/app/components/DeliveryMethodModal";
import RequestModal from "@/app/components/RequestModal";
import { useOrderCreate } from "@/hooks/useCreateorder";

/**
 * TYPES
 */

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

/**
 * FACTORY
 */
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
      label: furniture.name,
      unit_price: furniture.base_price,
    },
  ];
}

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

  /**
   * STATE
   */
  const [list, setList] = useState<SelectedItem[]>(() =>
    buildItems(furniture)
  );

  const [orderDraft, setOrderDraft] = useState<OrderDraft>({
    delivery: null,
    request: null,
  });

  const [showDelivery, setShowDelivery] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  if (!open) return null;

  /**
   * RESET
   */
  function resetAll() {
    setList(buildItems(furniture));
    setOrderDraft({
      delivery: null,
      request: null,
    });
  }

  /**
   * UPDATE QTY
   */
  function updateQty(index: number, delta: number) {
    setList((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    );
  }

  const activeItems = list.filter((i) => i.quantity > 0);

  /**
   * DEBUG (safe for dev only)
   */
  function debug() {
    console.log("ORDER STATE:", {
      orderDraft,
      activeItems,
    });
  }

  /**
   * PLACE ORDER
   */
  async function handlePlaceOrder() {
    debug();

    if (!orderDraft.delivery || activeItems.length === 0) {
      console.log("BLOCKED: missing delivery or items");
      return;
    }

    /**
     * =========================================================
     * CLEAN PAYLOAD (MATCHES SERVICE 1:1)
     * =========================================================
     */
    const payload = {
      delivery_method: orderDraft.delivery.delivery_method,
      phone_number: orderDraft.delivery.phone_number,
      delivery_address: orderDraft.delivery.delivery_address,
      pickup_location: orderDraft.delivery.pickup_location,

      items: activeItems.map((item) => ({
        furniture_id: item.furniture_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      })),

      /**
       * ORDER-LEVEL REQUEST (ONLY ONE SOURCE OF TRUTH)
       */
      request: orderDraft.request?.description
        ? {
            description: orderDraft.request.description,
          }
        : null,
    };

    try {
      console.log("SENDING ORDER:", payload);

      await createOrder(payload);

      console.log("ORDER SUCCESS");

      resetAll();
      onClose();
    } catch (err) {
      console.error("ORDER FAILED:", err);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-6 shadow-xl">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Place Order</h2>
          <button
            onClick={() => {
              resetAll();
              onClose();
            }}
          >
            ✕
          </button>
        </div>

        {/* ITEMS */}
        <div className="space-y-3 max-h-[300px] overflow-auto">
          {list.map((item, idx) => (
            <div
              key={`${item.furniture_id}-${item.variant_id ?? "base"}`}
              className="flex justify-between border p-3 rounded-lg"
            >
              <div>
                <div className="text-sm">{item.label}</div>
                <div className="text-xs opacity-70">
                  ₱{item.unit_price.toLocaleString()}
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <button onClick={() => updateQty(idx, -1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(idx, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="space-y-2">

          <button
            onClick={() => setShowDelivery(true)}
            className="w-full border p-2 rounded"
          >
            Select Delivery Method
          </button>

          <button
            onClick={() => setShowRequest(true)}
            className="w-full border p-2 rounded"
          >
            Request Details
          </button>

          <button
            onClick={handlePlaceOrder}
            disabled={!orderDraft.delivery || isPending}
            className="w-full bg-black text-white p-2 rounded"
          >
            {isPending ? "Placing..." : "Place Order"}
          </button>

          <button
            onClick={() => {
              resetAll();
              onClose();
            }}
            className="w-full border p-2 rounded"
          >
            Close
          </button>

        </div>
      </div>

      {/* DELIVERY MODAL */}
      <DeliveryMethodModal
        open={showDelivery}
        onClose={() => setShowDelivery(false)}
        items={activeItems}
        onSave={(d) =>
          setOrderDraft((p) => ({ ...p, delivery: d }))
        }
      />

      {/* REQUEST MODAL */}
      <RequestModal
        open={showRequest}
        onClose={() => setShowRequest(false)}
        items={activeItems}
        onSave={(d) =>
          setOrderDraft((p) => ({
            ...p,
            request: d,
          }))
        }
      />
    </div>,
    document.body
  );
}