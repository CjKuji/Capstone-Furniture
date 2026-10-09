import { supabase } from "@/lib/supabase";

export type MonthlyDemand = {
  month: string;
  units: number;
  isCurrentMonth: boolean;
};

export type ProductVariantTrend = {
  key: string;
  designName: string;
  variantName: string;
  recentUnits: number;
  previousUnits: number;
  change: number;
};

export type DemandAnalytics = {
  monthlyDemand: MonthlyDemand[];
  nextMonthForecast: number | null;
  forecastMonthsUsed: number;
  variantTrends: ProductVariantTrend[];
};

type PaidPaymentRow = {
  order_id: string | null;
  paid_at: string | null;
};

type OrderAnalyticsRow = {
  id: string;
  order_status: string | null;
  payment_status: string | null;
};

type OrderItemAnalyticsRow = {
  order_id: string;
  quantity: number | null;
  furniture_snapshot: unknown;
  variant_snapshot: unknown;
};

async function fetchRecentPaidOrderPayments(startDate: Date, endDate: Date): Promise<PaidPaymentRow[]> {
  const pageSize = 1000;
  const payments: PaidPaymentRow[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("payments")
      .select("order_id, paid_at")
      .eq("status", "paid")
      .not("order_id", "is", null)
      .gte("paid_at", startDate.toISOString())
      .lte("paid_at", endDate.toISOString())
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Could not load paid payments for analytics: ${error.message}`);
    }

    const page = (data ?? []) as PaidPaymentRow[];
    payments.push(...page);

    if (page.length < pageSize) break;
  }

  return payments;
}

async function fetchPaidPaymentsForOrders(orderIds: string[]): Promise<PaidPaymentRow[]> {
  const orderBatchSize = 100;
  const pageSize = 1000;
  const payments: PaidPaymentRow[] = [];

  for (let offset = 0; offset < orderIds.length; offset += orderBatchSize) {
    const orderIdBatch = orderIds.slice(offset, offset + orderBatchSize);

    for (let paymentOffset = 0; ; paymentOffset += pageSize) {
      const { data, error } = await supabase
        .from("payments")
        .select("order_id, paid_at")
        .eq("status", "paid")
        .in("order_id", orderIdBatch)
        .range(paymentOffset, paymentOffset + pageSize - 1);

      if (error) {
        throw new Error(`Could not load payment history for analytics: ${error.message}`);
      }

      const page = (data ?? []) as PaidPaymentRow[];
      payments.push(...page);

      if (page.length < pageSize) break;
    }
  }

  return payments;
}

async function fetchOrderItems(orderIds: string[]): Promise<OrderItemAnalyticsRow[]> {
  const orderBatchSize = 100;
  const pageSize = 1000;
  const items: OrderItemAnalyticsRow[] = [];

  for (let offset = 0; offset < orderIds.length; offset += orderBatchSize) {
    const orderIdBatch = orderIds.slice(offset, offset + orderBatchSize);

    for (let itemOffset = 0; ; itemOffset += pageSize) {
      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, quantity, furniture_snapshot, variant_snapshot")
        .in("order_id", orderIdBatch)
        .range(itemOffset, itemOffset + pageSize - 1);

      if (error) {
        throw new Error(`Could not load order items for analytics: ${error.message}`);
      }

      const page = (data ?? []) as OrderItemAnalyticsRow[];
      items.push(...page);

      if (page.length < pageSize) break;
    }
  }

  return items;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function shiftMonth(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

function normalizeStatus(status: string | null): string {
  return (status ?? "").trim().toLowerCase();
}

export async function getDemandAnalytics(): Promise<DemandAnalytics> {
  const now = new Date();
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const firstIncludedMonth = shiftMonth(currentMonth, -12);

  const recentPayments = await fetchRecentPaidOrderPayments(firstIncludedMonth, now);
  const candidateOrderIds = Array.from(
    new Set(recentPayments.flatMap((payment) => payment.order_id ? [payment.order_id] : [])),
  );
  const payments = candidateOrderIds.length > 0
    ? await fetchPaidPaymentsForOrders(candidateOrderIds)
    : [];
  const firstPaidAtByOrder = new Map<string, Date>();
  const ordersWithUnknownPaidDate = new Set<string>();

  for (const payment of payments) {
    if (!payment.order_id) continue;
    if (!payment.paid_at) {
      ordersWithUnknownPaidDate.add(payment.order_id);
      continue;
    }

    const paidAt = new Date(payment.paid_at);
    if (Number.isNaN(paidAt.getTime())) {
      ordersWithUnknownPaidDate.add(payment.order_id);
      continue;
    }

    const firstPaidAt = firstPaidAtByOrder.get(payment.order_id);
    if (!firstPaidAt || paidAt < firstPaidAt) {
      firstPaidAtByOrder.set(payment.order_id, paidAt);
    }
  }

  const qualifyingOrderIds = Array.from(firstPaidAtByOrder.entries())
    .filter(([orderId, paidAt]) =>
      !ordersWithUnknownPaidDate.has(orderId) &&
      paidAt >= firstIncludedMonth &&
      paidAt <= now,
    )
    .map(([orderId]) => orderId);

  if (qualifyingOrderIds.length === 0) {
    return {
      monthlyDemand: Array.from({ length: 6 }, (_, index) => {
        const month = shiftMonth(currentMonth, index - 5);
        return {
          month: monthLabel(month),
          units: 0,
          isCurrentMonth: monthKey(month) === monthKey(currentMonth),
        };
      }),
      nextMonthForecast: null,
      forecastMonthsUsed: 0,
      variantTrends: [],
    };
  }

  const orders: OrderAnalyticsRow[] = [];
  const orderPageSize = 100;
  for (let offset = 0; offset < qualifyingOrderIds.length; offset += orderPageSize) {
    const orderIdBatch = qualifyingOrderIds.slice(offset, offset + orderPageSize);
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_status, payment_status")
      .in("id", orderIdBatch);

    if (error) {
      throw new Error(`Could not load orders for analytics: ${error.message}`);
    }

    orders.push(...((data ?? []) as OrderAnalyticsRow[]));
  }

  const canceledStatuses = new Set(["cancelled", "canceled"]);
  const activeOrderIds = orders
    .filter((order) =>
      !canceledStatuses.has(normalizeStatus(order.order_status)) &&
      normalizeStatus(order.payment_status) !== "refunded",
    )
    .map((order) => order.id);
  const orderItems = await fetchOrderItems(activeOrderIds);

  const monthUnits = new Map<string, number>();
  const variantDemand = new Map<string, {
    designName: string;
    variantName: string;
    monthlyUnits: Map<string, number>;
  }>();

  for (const item of orderItems) {
    const paidAt = firstPaidAtByOrder.get(item.order_id);
    if (!paidAt) continue;

    const quantity = Number(item.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    const key = monthKey(paidAt);
    monthUnits.set(key, (monthUnits.get(key) ?? 0) + quantity);

    const furniture = asRecord(item.furniture_snapshot);
    const variant = asRecord(item.variant_snapshot);
    const designName = nonEmptyString(furniture?.name) ?? "Unspecified design";
    const variantName = nonEmptyString(variant?.name) ?? "No variant selected";
    const furnitureId = nonEmptyString(furniture?.id) ?? designName;
    const variantId = nonEmptyString(variant?.id) ?? variantName;
    const demandKey = `${furnitureId}:${variantId}`;
    const existing = variantDemand.get(demandKey);

    if (existing) {
      existing.monthlyUnits.set(
        key,
        (existing.monthlyUnits.get(key) ?? 0) + quantity,
      );
    } else {
      variantDemand.set(demandKey, {
        designName,
        variantName,
        monthlyUnits: new Map([[key, quantity]]),
      });
    }
  }

  const monthlyDemand = Array.from({ length: 6 }, (_, index) => {
    const month = shiftMonth(currentMonth, index - 5);
    return {
      month: monthLabel(month),
      units: monthUnits.get(monthKey(month)) ?? 0,
      isCurrentMonth: monthKey(month) === monthKey(currentMonth),
    };
  });

  const forecastMonths = [
    shiftMonth(currentMonth, -3),
    shiftMonth(currentMonth, -2),
    shiftMonth(currentMonth, -1),
  ];
  const forecastValues = forecastMonths.map((month) => monthUnits.get(monthKey(month)) ?? 0);
  const forecastMonthsUsed = forecastValues.filter((units) => units > 0).length;
  const nextMonthForecast =
    forecastMonthsUsed >= 2
      ? Math.round(forecastValues.reduce((sum, units) => sum + units, 0) / forecastValues.length)
      : null;

  const recentMonths = forecastMonths;
  const previousMonths = [
    shiftMonth(currentMonth, -6),
    shiftMonth(currentMonth, -5),
    shiftMonth(currentMonth, -4),
  ];
  const variantTrends = Array.from(variantDemand.entries())
    .map(([key, demand]) => {
      const recentUnits = recentMonths.reduce(
        (sum, month) => sum + (demand.monthlyUnits.get(monthKey(month)) ?? 0),
        0,
      );
      const previousUnits = previousMonths.reduce(
        (sum, month) => sum + (demand.monthlyUnits.get(monthKey(month)) ?? 0),
        0,
      );
      return {
        key,
        designName: demand.designName,
        variantName: demand.variantName,
        recentUnits,
        previousUnits,
        change: recentUnits - previousUnits,
      };
    })
    .filter((demand) => demand.recentUnits > 0 || demand.previousUnits > 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change) || b.recentUnits - a.recentUnits)
    .slice(0, 8);

  return {
    monthlyDemand,
    nextMonthForecast,
    forecastMonthsUsed,
    variantTrends,
  };
}
