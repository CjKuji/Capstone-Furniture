"use client";

import { useAdminOrders, useAdminOrderActions } from "@/hooks/useAdminOrders";
import type { OrderStatus } from "@/types/enums";

/**
 * =========================================================
 * STATUS BADGE
 * =========================================================
 */
const statusBadge = (status: OrderStatus) => {
  switch (status) {
    case "pending_review":
      return "bg-yellow-100 text-yellow-800";

    case "in_review":
      return "bg-blue-100 text-blue-800";

    case "quoted":
      return "bg-indigo-100 text-indigo-800";

    case "accepted":
      return "bg-green-100 text-green-800";

    case "processing":
      return "bg-blue-200 text-blue-900";

    case "ready":
      return "bg-emerald-100 text-emerald-800";

    case "completed":
      return "bg-gray-100 text-gray-800";

    case "cancelled":
      return "bg-red-100 text-red-800";

    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * =========================================================
 * PAGE
 * =========================================================
 */
export default function AdminOrdersPage() {
  const { data: orders = [], isLoading, isError } = useAdminOrders();
  const { invalidateOrders } = useAdminOrderActions();

  /**
   * =========================================================
   * UPDATE STATUS
   * =========================================================
   */
  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus
  ) => {
    const { supabase } = await import("@/lib/supabase");

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      console.error("Failed to update order:", error);
      return;
    }

    invalidateOrders();
  };

  /**
   * =========================================================
   * STATES
   * =========================================================
   */
  if (isLoading) {
    return (
      <div className="text-center mt-20">
        Loading orders...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center mt-20 text-red-500">
        Failed to load orders
      </div>
    );
  }

  /**
   * =========================================================
   * RENDER
   * =========================================================
   */
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">All Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center mt-10">
          No orders found
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const item = order.order_items?.[0];
            const furniture = item?.furniture_snapshot;

            const isPickup =
              order.delivery_method === "pickup";

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow overflow-hidden flex flex-col"
              >
                {/* IMAGE */}
                <img
                  src={
                    furniture?.images?.[0]?.url ??
                    "/placeholder.png"
                  }
                  className="w-full h-64 object-cover"
                  alt={furniture?.name ?? "Furniture"}
                />

                {/* CONTENT */}
                <div className="p-5 flex-1">
                  <h2 className="text-lg font-semibold">
                    {furniture?.name ?? "Unknown Furniture"}
                  </h2>

                  <p className="text-sm text-gray-600">
                    Quantity: {item?.quantity ?? 0}
                  </p>

                  <p className="text-sm text-gray-600">
                    Total: ₱{order.quote_total_price ?? 0}
                  </p>

                  <div className="mt-3 text-sm space-y-1">
                    <div>
                      Method: {order.delivery_method ?? "-"}
                    </div>

                    {/* DELIVERY VS PICKUP LOGIC */}
                    {!isPickup ? (
                      <>
                        <div>
                          Address:{" "}
                          {order.delivery_address ?? "-"}
                        </div>

                        {/* hide phone ONLY for pickup */}
                        <div>
                          Phone: {order.phone_number ?? "-"}
                        </div>
                      </>
                    ) : (
                      <div>
                        Pickup Location:{" "}
                        {order.pickup_location ??
                          "Store / Warehouse"}
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="p-4 flex justify-between items-center">
                  <span
                    className={`px-2 py-1 text-xs rounded ${statusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>

                  <div className="flex gap-2">
                    {order.status === "pending_review" && (
                      <>
                        <button
                          onClick={() =>
                            void updateOrderStatus(
                              order.id,
                              "processing"
                            )
                          }
                          className="bg-green-600 text-white px-2 py-1 text-xs rounded"
                        >
                          Accept
                        </button>

                        <button
                          onClick={() =>
                            void updateOrderStatus(
                              order.id,
                              "cancelled"
                            )
                          }
                          className="bg-red-600 text-white px-2 py-1 text-xs rounded"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {order.status === "processing" && (
                      <button
                        onClick={() =>
                          void updateOrderStatus(
                            order.id,
                            "ready"
                          )
                        }
                        className="bg-blue-600 text-white px-2 py-1 text-xs rounded"
                      >
                        Finish
                      </button>
                    )}

                    {order.status === "ready" && (
                      <button
                        onClick={() =>
                          void updateOrderStatus(
                            order.id,
                            "completed"
                          )
                        }
                        className="bg-gray-600 text-white px-2 py-1 text-xs rounded"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}