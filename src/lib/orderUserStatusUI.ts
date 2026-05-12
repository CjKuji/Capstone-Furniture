import type { Order } from "@/types/order";

/**
 * =========================================================
 * ORDER STATUS UI (WITH CHARGE ACTION CONTROL)
 * =========================================================
 */
export function getOrderStatusUI(status: Order["order_status"]) {
  switch (status) {
    case "requested":
      return {
        label: "Requested",
        color: "bg-yellow-100 text-yellow-800",
        chargeActionLabel: "View Pending Charges",
        chargeFilter: "pending" as const,
        showChargesAction: false,
      };

    case "accepted":
      return {
        label: "Accepted",
        color: "bg-blue-100 text-blue-800",
        chargeActionLabel: "View Accepted Charges",
        chargeFilter: "accepted" as const,
        showChargesAction: true,
      };

    case "awaiting_payment":
      return {
        label: "Awaiting Payment",
        color: "bg-indigo-100 text-indigo-800",
        chargeActionLabel: "View Accepted Charges",
        chargeFilter: "accepted" as const,
        showChargesAction: true,
      };

    case "payment_verification":
      return {
        label: "Verifying Payment",
        color: "bg-purple-100 text-purple-800",
        chargeActionLabel: "View Accepted Charges",
        chargeFilter: "accepted" as const,
        showChargesAction: true,
      };

    case "in_production":
      return {
        label: "In Production",
        color: "bg-orange-100 text-orange-800",
        chargeActionLabel: "View Accepted Charges",
        chargeFilter: "accepted" as const,
        showChargesAction: true,
      };

    /**
     * =========================================================
     * DELIVERY FLOW
     * =========================================================
     */

    case "ready_for_pickup":
      return {
        label: "Ready for Pickup",
        color: "bg-teal-100 text-teal-800",
        chargeActionLabel: "View Accepted Charges",
        chargeFilter: "accepted" as const,
        showChargesAction: true,
      };

    case "ready_for_shipment":
      return {
        label: "Ready for Shipment",
        color: "bg-sky-100 text-sky-800",
        chargeActionLabel: "View Accepted Charges",
        chargeFilter: "accepted" as const,
        showChargesAction: true,
      };

    case "shipped":
      return {
        label: "Shipped",
        color: "bg-blue-300 text-blue-900",
        chargeActionLabel: "View Accepted Charges",
        chargeFilter: "accepted" as const,
        showChargesAction: true,
      };

    case "in_transit":
      return {
        label: "On the Way",
        color: "bg-blue-200 text-blue-900",
        chargeActionLabel: "View Accepted Charges",
        chargeFilter: "accepted" as const,
        showChargesAction: true,
      };

    case "completed":
      return {
        label: "Completed",
        color: "bg-green-100 text-green-800",
        chargeActionLabel: "View Accepted Charges",
        chargeFilter: "accepted" as const,
        showChargesAction: true,
      };

    case "cancelled":
      return {
        label: "Cancelled",
        color: "bg-red-100 text-red-800",
        chargeActionLabel: "View Rejected Charges",
        chargeFilter: "rejected" as const,
        showChargesAction: false,
      };

    default:
      return {
        label: "Pending",
        color: "bg-gray-100 text-gray-700",
        chargeActionLabel: "View Pending Charges",
        chargeFilter: "pending" as const,
        showChargesAction: false,
      };
  }
}

/**
 * =========================================================
 * PAYMENT UI
 * =========================================================
 */
export const paymentUI = (paymentStatus: Order["payment_status"]) => {
  switch (paymentStatus) {
    case "unpaid":
      return { label: "Unpaid", color: "bg-yellow-100 text-yellow-800" };

    case "partially_paid":
      return { label: "Partially Paid", color: "bg-indigo-100 text-indigo-800" };

    case "fully_paid":
      return { label: "Fully Paid", color: "bg-green-100 text-green-800" };

    case "pending_verification":
      return { label: "Verifying", color: "bg-blue-100 text-blue-800" };

    case "rejected":
      return { label: "Rejected", color: "bg-red-100 text-red-800" };

    case "refunded":
      return { label: "Refunded", color: "bg-gray-100 text-gray-800" };

    default:
      return { label: "Unknown", color: "bg-gray-100 text-gray-700" };
  }
};

/**
 * =========================================================
 * CHARGE UI
 * =========================================================
 */
export const chargeStatusUI = (status?: string | null) => {
  switch (status) {
    case "pending":
      return {
        label: "Pending Charges",
        color: "bg-yellow-100 text-yellow-800",
        message: "Wait for admin final price.",
      };

    case "accepted":
      return {
        label: "Accepted Charges",
        color: "bg-green-100 text-green-800",
        message: "Final price confirmed.",
      };

    case "rejected":
      return {
        label: "Rejected Charges",
        color: "bg-red-100 text-red-800",
        message: "Extra charges removed.",
      };

    default:
      return {
        label: "No Charges",
        color: "bg-gray-100 text-gray-700",
        message: "Waiting for admin final price.",
      };
  }
};