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
  // 1. Actionable Metric Cards
  pendingQuotes: number;
  unreadMessages: number;
  paidAwaitingProduction: number;
  totalFurnitureCatalogCount: number;

  // 2. Completed KPI Hub Metrics
  completedOrdersCount: number;
  completedInquiriesCount: number;

  // 3. Live Operational Statuses
  activeProduction: number;
  
  // Split logistics metrics to accurately supply data to your two distinct columns
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

// Explicit structures to handle query overrides without resorting to 'any'
interface SimpleOrderRow {
  id: string;
  order_reference_code: string | null;
  final_total_price: number | null;
  order_status: string | null;
  created_at: string | null;
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
}

// Typing signature to permit dynamic column queries that confuse CLI auto-generation
interface DbQueryOverride {
  from(table: string): {
    select(fields?: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): any;
  };
}

const typedClient = supabase as unknown as DbQueryOverride;

/* =========================================================
   DASHBOARD STATS SERVICE
   ========================================================= */

export async function getAdminDashboardStats(): Promise<AdminDashboardData> {
  const [
    pendingQuotesRes,
    unreadMessagesRes,
    paidOrdersNotStartedRes,
    paidInquiriesNotStartedRes,
    totalFurnitureRes,
    activeOrdersRes,
    activeInquiriesRes,

    // Logistics Split Queries: Balances Due (Partially Paid)
    partiallyPaidPickupOrdersRes,
    partiallyPaidPickupInquiriesRes,
    partiallyPaidDeliveryOrdersRes,
    partiallyPaidDeliveryInquiriesRes,

    // Logistics Split Queries: Cleared Items (Fully Paid)
    fullyPaidPickupOrdersRes,
    fullyPaidPickupInquiriesRes,
    fullyPaidDeliveryOrdersRes,
    fullyPaidDeliveryInquiriesRes,

    // Completed Aggregates
    completedOrdersRes,
    completedInquiriesRes,

    // Chronological Feed
    recentOrdersRes,
    recentInquiriesRes,
    recentPaymentsRes,
  ] = await Promise.all([
    // 1. Pending Quotes
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .in("status", ["requested", "under_review"])
      .eq("charge_status", "none")
      .is("final_total_price", null),

    // 2. Communications: Active unread message alerts
    supabase
      .from("conversations")
      .select("admin_unread_count"),

    // 3. Queue: Paid/Partially Paid but not in production yet (Catalog Orders)
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("charge_status", ["partially_paid", "fully_paid"])
      .in("order_status", ["requested", "accepted"]),

    // 4. Queue: Paid/Partially Paid but not in production yet (Custom Inquiries)
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .in("charge_status", ["partially_paid", "fully_paid"])
      .in("status", ["requested", "under_review"]),

    // 5. Inventory headcount tracker
    supabase
      .from("furniture")
      .select("*", { count: "exact", head: true }),

    // 6. Production lines: Catalog items
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "in_production"),

    // 7. Production lines: Custom bespoke items
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_production"),

    // 8. Logistics: Partially Paid - Ready for Pickup
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "ready_for_pickup")
      .eq("charge_status", "partially_paid"),
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "ready_for_pickup")
      .eq("charge_status", "partially_paid"),

    // 9. Logistics: Partially Paid - Ready for Delivery
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "ready_for_shipment")
      .eq("charge_status", "partially_paid"),
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "ready_for_shipment")
      .eq("charge_status", "partially_paid"),

    // 10. Logistics: Fully Paid - Ready for Pickup
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "ready_for_pickup")
      .eq("charge_status", "fully_paid"),
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "ready_for_pickup")
      .eq("charge_status", "fully_paid"),

    // 11. Logistics: Fully Paid - Ready for Delivery
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "ready_for_shipment")
      .eq("charge_status", "fully_paid"),
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "ready_for_shipment")
      .eq("charge_status", "fully_paid"),

    // 12. Completed Volume Aggregations
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "completed"),
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),

    // 13. Chronological Feeds
    typedClient
      .from("orders")
      .select("id, order_reference_code, final_total_price, order_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),

    typedClient
      .from("inquiries")
      .select("id, status, final_total_price, created_at, inquiry_items ( title )")
      .order("created_at", { ascending: false })
      .limit(5),

    typedClient
      .from("payments")
      .select("id, amount, status, created_at, external_reference, provider, order_id, inquiry_id")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // --- Process Operational Badges ---
  const pendingQuotes = pendingQuotesRes.count ?? 0;
  const totalFurnitureCatalogCount = totalFurnitureRes.count ?? 0;
  const completedOrdersCount = completedOrdersRes.count ?? 0;
  const completedInquiriesCount = completedInquiriesRes.count ?? 0;

  const unreadMessages = (unreadMessagesRes.data ?? []).reduce(
    (acc, curr) => acc + (curr.admin_unread_count ?? 0),
    0
  );

  const paidAwaitingProduction =
    (paidOrdersNotStartedRes.count ?? 0) + (paidInquiriesNotStartedRes.count ?? 0);

  const activeProduction = (activeOrdersRes.count ?? 0) + (activeInquiriesRes.count ?? 0);

  // --- Parse Dispatch Logistics Structures ---
  const partiallyPaidPickupCount = (partiallyPaidPickupOrdersRes.count ?? 0) + (partiallyPaidPickupInquiriesRes.count ?? 0);
  const partiallyPaidDeliveryCount = (partiallyPaidDeliveryOrdersRes.count ?? 0) + (partiallyPaidDeliveryInquiriesRes.count ?? 0);

  const fullyPaidPickupCount = (fullyPaidPickupOrdersRes.count ?? 0) + (fullyPaidPickupInquiriesRes.count ?? 0);
  const fullyPaidDeliveryCount = (fullyPaidDeliveryOrdersRes.count ?? 0) + (fullyPaidDeliveryInquiriesRes.count ?? 0);

  // --- Stitch & Normalize Activity Feed ---
  const timelineLogs: DashboardActivityLog[] = [];

  if (recentOrdersRes.data) {
    const orderRows = recentOrdersRes.data as unknown as SimpleOrderRow[];
    orderRows.forEach((o) => {
      timelineLogs.push({
        id: o.id,
        type: "catalog_order",
        title: "Catalog Checkout Created",
        description: `Ref: ${o.order_reference_code || "Standard Order"}`,
        amount: o.final_total_price ? Number(o.final_total_price) : 0,
        status: o.order_status ?? "requested",
        createdAt: o.created_at ?? new Date().toISOString(),
      });
    });
  }

  if (recentInquiriesRes.data) {
    const typedInquiryRows = recentInquiriesRes.data as unknown as RawInquiryQueryRow[];
    
    typedInquiryRows.forEach((i) => {
      let primaryItem = "Bespoke Request Frame";
      if (i.inquiry_items) {
        if (Array.isArray(i.inquiry_items) && i.inquiry_items.length > 0) {
          primaryItem = i.inquiry_items[0].title ?? "Bespoke Request Frame";
        } else if (!Array.isArray(i.inquiry_items) && (i.inquiry_items as InquiryItemJoin).title) {
          primaryItem = (i.inquiry_items as InquiryItemJoin).title ?? "Bespoke Request Frame";
        }
      }

      timelineLogs.push({
        id: i.id,
        type: "custom_inquiry",
        title: "Bespoke Request Logged",
        description: primaryItem,
        amount: i.final_total_price ? Number(i.final_total_price) : undefined,
        status: i.status ?? "requested",
        createdAt: i.created_at ?? new Date().toISOString(),
      });
    });
  }

  if (recentPaymentsRes.data) {
    const paymentRows = recentPaymentsRes.data as unknown as SimplePaymentRow[];
    paymentRows.forEach((p) => {
      const parentSource = p.order_id ? "Order Checkout" : "Custom Inquiry";
      timelineLogs.push({
        id: p.id,
        type: "payment",
        title: `Payment ${String(p.status ?? "PAID").toUpperCase()}`,
        description: `${parentSource} via ${String(p.provider ?? "PAYMONGO").toUpperCase()} (Ref: ${p.external_reference || "N/A"})`,
        amount: p.amount ? Number(p.amount) : 0,
        status: p.status ?? "paid",
        createdAt: p.created_at ?? new Date().toISOString(),
      });
    });
  }

  const recentActivity = timelineLogs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    pendingQuotes,
    unreadMessages,
    paidAwaitingProduction,
    totalFurnitureCatalogCount,
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