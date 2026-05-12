import type { Order } from "@/types/order";

export function getOrderSubtotal(order: Order) {
  const items = order.order_items ?? [];

  return items.reduce((sum, i) => sum + Number(i.total_price ?? 0), 0);
}

export function getChargesTotal(charges: any[] = []) {
  return charges.reduce((total, c) => {
    const amount = Number(c.amount ?? 0);
    return c.is_additive ? total + amount : total - amount;
  }, 0);
}

export function getBaseTotal(order: Order, itemTotal: number) {
  return Number(order.quote_total_price ?? 0) > 0
    ? Number(order.quote_total_price)
    : itemTotal;
}

export function getFinalTotal(params: {
  subtotal: number;
  chargesTotal: number;
  chargeStatus?: string;
  manualFinal?: number | null;
}) {
  const { subtotal, chargesTotal, chargeStatus, manualFinal } = params;

  const isAccepted = chargeStatus === "accepted";

  if (isAccepted && manualFinal != null) {
    return Number(manualFinal);
  }

  return subtotal + chargesTotal;
}