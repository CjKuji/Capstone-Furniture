"use client";

import {
  acceptOrder,
  createQuote,
  acceptQuote,
  submitPayment,
  verifyPayment,
  startProduction,
  markReady,
  markShipped,
  markPickedUp,
  markDelivered,
} from "@/services/orders/orderFlowService";

export function useOrderActions() {
  return {
    acceptOrder,
    createQuote,
    acceptQuote,
    submitPayment,
    verifyPayment,
    startProduction,
    markReady,
    markShipped,
    markPickedUp,
    markDelivered,
  };
}