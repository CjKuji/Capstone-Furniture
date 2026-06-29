import { supabase } from "@/lib/supabase";

/* =========================================================
   TYPES & INTERFACES
   ========================================================= */

export interface DashboardActivityLog {
  id: string;
  type: "catalog_order" | "custom_inquiry" | "payment";
  title: string;
  description: string;
  amount?: number;
  status: string;
  createdAt: string;
}

export interface AdminDashboardData {
  // 1. Actionable Metric Cards & Shared Hub Counts
  pendingQuotes: number;
  unreadMessages: number;
  paidAwaitingProduction: number;
  pendingStoreOrdersCount: number;     
  pendingCustomRequestsCount: number;  
  totalFurnitureCatalogCount: number;
  currentUsersCount: number;           

  // 2. Completed KPI Hub Metrics
  completedOrdersCount: number;
  completedInquiriesCount: number;

  // 3. Live Operational Statuses
  activeProduction: number;
  
  // Split logistics metrics accurately supplying data to your two distinct columns
  partiallyPaidQueue: {
    readyForPickupCount: number;
    readyForDeliveryCount: number;
  };
  fullyPaidQueue: {
    readyForPickupCount: number;
    readyForDeliveryCount: number;
  };

  // 4. Real-Time Activity Feed
  recentActivity: DashboardActivityLog[];
}

interface InquiryItemJoin {
  title: string | null;
}

interface RawInquiryQueryRow {
  id: string;
  status: string;
  final_total_price: number | null;
  created_at: string | null;
  inquiry_items: InquiryItemJoin[] | InquiryItemJoin | null;
}

interface SimpleOrderRow {
  id: string;
  order_reference_code: string | null;
  final_total_price: number | null;
  order_status: string | null;
  created_at: string | null;
}

interface PaymentOrderRelation {
  order_reference_code: string | null;
}

interface SimplePaymentRow {
  id: string;
  amount: number;
  status: string | null;
  created_at: string | null;
  external_reference: string | null;
  provider: string | null;
  order_id: string | null;
  inquiry_id: string | null;
  orders: PaymentOrderRelation | null; 
}

interface DashboardOrderRow {
  id: string;
  order_status: string | null;
  payment_status: string | null;
}

interface DashboardInquiryRow {
  id: string;
  status: string | null;
  charge_status: string | null;
}

interface DbQuerySelectResult {
  count: number | null;
  data: unknown[] | null;
  error?: unknown;
}

interface DbQueryBuilder {
  select(fields?: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): DbQueryBuilder;
  order(column: string, options?: { ascending?: boolean }): DbQueryBuilder;
  limit(count: number): DbQueryBuilder;
  then<TResult1 = DbQuerySelectResult, TResult2 = never>(
    onfulfilled?: ((value: DbQuerySelectResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface DbQueryOverride {
  from(table: string): DbQueryBuilder;
}

const typedClient = supabase as unknown as DbQueryOverride;

function normalizeDashboardValue(value: string | null | undefined) {
  return (value ?? "").toLowerCase().trim();
}

async function fetchDashboardOrders(): Promise<DashboardOrderRow[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_status, payment_status");

    if (error) throw error;
    return (data ?? []) as DashboardOrderRow[];
  } catch (error) {
    console.error("DASHBOARD_ORDERS_FETCH_ERROR", error);
    return [];
  }
}

async function fetchDashboardInquiries(): Promise<DashboardInquiryRow[]> {
  try {
    const { data, error } = await supabase
      .from("inquiries")
      .select("id, status, charge_status");

    if (error) throw error;
    return (data ?? []) as unknown as DashboardInquiryRow[];
  } catch (error) {
    console.error("DASHBOARD_INQUIRIES_FETCH_ERROR", error);
    return [];
  }
}

/* =========================================================
   DASHBOARD STATS SERVICE
   ========================================================= */

export async function getAdminDashboardStats(): Promise<AdminDashboardData> {
  const [dashboardOrders, dashboardInquiries] = await Promise.all([
    fetchDashboardOrders(),
    fetchDashboardInquiries(),
  ]);

  const [
    unreadMessagesRes,
    totalFurnitureRes,
    currentUsersRes,
    recentOrdersRes,
    recentInquiriesRes,
    recentPaymentsRes,
  ] = await Promise.all([
    supabase
      .from("conversations")
      .select("admin_unread_count"),

    supabase
      .from("furniture")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),

    typedClient
      .from("orders")
      .select("id, order_reference_code, final_total_price, order_status, created_at")
      .order("created_at", { ascending: false })
      .limit(15),

    typedClient
      .from("inquiries")
      .select("id, status, created_at, inquiry_items ( title )")
      .order("created_at", { ascending: false })
      .limit(15),

    typedClient
      .from("payments")
      .select("id, amount, status, created_at, external_reference, provider, order_id, inquiry_id, orders(order_reference_code)")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  // --- Process Operational Badges ---
  const pendingQuotes = dashboardInquiries.filter((item) => {
    const status = normalizeDashboardValue(item.status);
    const chargeStatus = normalizeDashboardValue(item.charge_status);

    return (status === "requested" || status === "under_review" || status === "pending") && (chargeStatus === "none" || chargeStatus === "" || chargeStatus === "pending");
  }).length;

  const totalFurnitureCatalogCount = totalFurnitureRes.count ?? 0;
  const completedOrdersCount = dashboardOrders.filter((order) => normalizeDashboardValue(order.order_status) === "completed").length;
  const completedInquiriesCount = dashboardInquiries.filter((item) => {
    const status = normalizeDashboardValue(item.status);
    return status === "completed" || status === "closed" || status === "converted";
  }).length;
  const currentUsersCount = currentUsersRes.count ?? 0;

  const unreadMessages = (unreadMessagesRes.data ?? []).reduce(
    (acc, curr) => acc + (curr.admin_unread_count ?? 0),
    0
  );

  const pendingStoreOrdersCount = dashboardOrders.filter((order) => {
    const paymentStatus = normalizeDashboardValue(order.payment_status);
    const orderStatus = normalizeDashboardValue(order.order_status);
    return (paymentStatus === "partially_paid" || paymentStatus === "fully_paid") && (orderStatus === "requested" || orderStatus === "accepted");
  }).length;

  const pendingCustomRequestsCount = dashboardInquiries.filter((item) => {
    const chargeStatus = normalizeDashboardValue(item.charge_status);
    const status = normalizeDashboardValue(item.status);
    return chargeStatus === "accepted" && (status === "requested" || status === "under_review" || status === "accepted");
  }).length;

  const paidAwaitingProduction = pendingStoreOrdersCount + pendingCustomRequestsCount;

  const activeProduction = dashboardOrders.filter((order) => normalizeDashboardValue(order.order_status) === "in_production").length + dashboardInquiries.filter((item) => normalizeDashboardValue(item.status) === "in_production").length;

  // --- Parse Pipeline Data Columns Safely ---
  const partiallyPaidPickupCount = dashboardOrders.filter((order) => {
    const paymentStatus = normalizeDashboardValue(order.payment_status);
    const orderStatus = normalizeDashboardValue(order.order_status);
    return paymentStatus === "partially_paid" && orderStatus === "ready_for_pickup";
  }).length + dashboardInquiries.filter((item) => {
    const chargeStatus = normalizeDashboardValue(item.charge_status);
    const status = normalizeDashboardValue(item.status);
    return chargeStatus === "accepted" && status === "ready_for_pickup";
  }).length;

  const partiallyPaidDeliveryCount = dashboardOrders.filter((order) => {
    const paymentStatus = normalizeDashboardValue(order.payment_status);
    const orderStatus = normalizeDashboardValue(order.order_status);
    return paymentStatus === "partially_paid" && (orderStatus === "ready_for_shipment" || orderStatus === "in_transit");
  }).length + dashboardInquiries.filter((item) => {
    const chargeStatus = normalizeDashboardValue(item.charge_status);
    const status = normalizeDashboardValue(item.status);
    return chargeStatus === "accepted" && (status === "ready_for_shipment" || status === "in_transit");
  }).length;

  const fullyPaidPickupCount = dashboardOrders.filter((order) => {
    const paymentStatus = normalizeDashboardValue(order.payment_status);
    const orderStatus = normalizeDashboardValue(order.order_status);
    return paymentStatus === "fully_paid" && orderStatus === "ready_for_pickup";
  }).length + dashboardInquiries.filter((item) => {
    const chargeStatus = normalizeDashboardValue(item.charge_status);
    const status = normalizeDashboardValue(item.status);
    return chargeStatus === "accepted" && status === "ready_for_pickup";
  }).length;

  const fullyPaidDeliveryCount = dashboardOrders.filter((order) => {
    const paymentStatus = normalizeDashboardValue(order.payment_status);
    const orderStatus = normalizeDashboardValue(order.order_status);
    return paymentStatus === "fully_paid" && (orderStatus === "ready_for_shipment" || orderStatus === "in_transit");
  }).length + dashboardInquiries.filter((item) => {
    const chargeStatus = normalizeDashboardValue(item.charge_status);
    const status = normalizeDashboardValue(item.status);
    return chargeStatus === "accepted" && (status === "ready_for_shipment" || status === "in_transit");
  }).length;

  // --- Normalizing Chronological Activity Feeds ---
  const timelineLogs: DashboardActivityLog[] = [];

  // 1. Process Store Orders
  if (recentOrdersRes.data) {
    const orderRows = recentOrdersRes.data as unknown as SimpleOrderRow[];
    orderRows.forEach((o) => {
      // Create explicit ISO standard string representation for accurate sorting parser fallback
      const cleanDate = o.created_at ? new Date(o.created_at).toISOString() : new Date().toISOString();
      
      timelineLogs.push({
        id: o.id,
        type: "catalog_order",
        title: "Store Order Created",
        description: `Ref: ${o.order_reference_code || "Order ID: " + o.id.substring(0, 8).toUpperCase()}`,
        amount: o.final_total_price ? Number(o.final_total_price) : 0,
        status: o.order_status ?? "requested",
        createdAt: cleanDate,
      });
    });
  }

  // 2. Process Custom Inquiries
  if (recentInquiriesRes.data) {
    const typedInquiryRows = recentInquiriesRes.data as unknown as RawInquiryQueryRow[];
    typedInquiryRows.forEach((i) => {
      let primaryItem = "Custom Order Item";
      if (i.inquiry_items) {
        if (Array.isArray(i.inquiry_items) && i.inquiry_items.length > 0) {
          primaryItem = i.inquiry_items[0].title ?? "Custom Order Item";
        } else if (!Array.isArray(i.inquiry_items) && (i.inquiry_items as InquiryItemJoin).title) {
          primaryItem = (i.inquiry_items as InquiryItemJoin).title ?? "Custom Order Item";
        }
      }

      const cleanDate = i.created_at ? new Date(i.created_at).toISOString() : new Date().toISOString();

      timelineLogs.push({
        id: i.id,
        type: "custom_inquiry",
        title: "Custom Request Logged",
        description: `Ref: REQ-${i.id.substring(0, 8).toUpperCase()} — (${primaryItem})`,
        amount: undefined,
        status: i.status ?? "requested",
        createdAt: cleanDate,
      });
    });
  }

  // 3. Process Payments Log Sequence
  if (recentPaymentsRes.data) {
    const paymentRows = recentPaymentsRes.data as unknown as SimplePaymentRow[];
    paymentRows.forEach((p) => {
      let referenceString = "N/A";
      if (p.order_id && p.orders?.order_reference_code) {
        referenceString = `Store Order: ${p.orders.order_reference_code}`;
      } else if (p.inquiry_id) {
        referenceString = `Custom Request: REQ-${p.inquiry_id.substring(0, 8).toUpperCase()}`;
      } else if (p.order_id) {
        referenceString = `Order ID: ${p.order_id.substring(0, 8).toUpperCase()}`;
      }

      // Supabase timezone parsing defense string adjustment 
      const cleanDate = p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString();

      timelineLogs.push({
        id: p.id,
        type: "payment",
        title: `Payment ${String(p.status ?? "PAID").toUpperCase()}`,
        description: `Linked to [${referenceString}] via ${String(p.provider ?? "PAYMONGO").toUpperCase()}`,
        amount: p.amount ? Number(p.amount) : 0,
        status: p.status ?? "paid",
        createdAt: cleanDate,
      });
    });
  }

  // Combine, sort descending (newest activity on top), and slice
  const recentActivity = timelineLogs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 25);

  return {
    pendingQuotes,
    unreadMessages,
    paidAwaitingProduction,
    pendingStoreOrdersCount,
    pendingCustomRequestsCount,
    totalFurnitureCatalogCount,
    currentUsersCount,
    completedOrdersCount,
    completedInquiriesCount,
    activeProduction,
    partiallyPaidQueue: {
      readyForPickupCount: partiallyPaidPickupCount,
      readyForDeliveryCount: partiallyPaidDeliveryCount,
    },
    fullyPaidQueue: {
      readyForPickupCount: fullyPaidPickupCount,
      readyForDeliveryCount: fullyPaidDeliveryCount,
    },
    recentActivity,
  };
}