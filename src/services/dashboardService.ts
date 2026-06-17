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

    // Logistics Split Queries: Partial Payments (Balances Remaining)
    partiallyPaidPickupOrdersRes,
    partiallyPaidPickupInquiriesRes,
    partiallyPaidDeliveryOrdersRes,
    partiallyPaidDeliveryInquiriesRes,

    // Logistics Split Queries: Fully Paid Items (Ready to Dispatch / Out En Route)
    fullyPaidPickupOrdersRes,
    fullyPaidPickupInquiriesRes,
    fullyPaidDeliveryOrdersRes,
    fullyPaidDeliveryInquiriesRes,

    // Completed Volume Aggregations
    completedOrdersRes,
    completedInquiriesRes,

    // System Profiles Count
    currentUsersRes,

    // Chronological Feed Components
    recentOrdersRes,
    recentInquiriesRes,
    recentPaymentsRes,
  ] = await Promise.all([
    
    // 1. Pending Quotes: Initial custom project submittals with no pricing metrics applied yet
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .in("status", ["requested", "under_review"])
      .eq("charge_status", "none")
      .is("final_total_price", null),

    // 2. Communications: Active unread text interactions
    supabase
      .from("conversations")
      .select("admin_unread_count"),

    // 3. Staged for Production (Catalog Orders): Customer checked out / cleared payments but work has not begun
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("charge_status", ["partially_paid", "fully_paid"])
      .in("order_status", ["requested", "accepted"]),

    // 4. Staged for Production (Custom Inquiries): Quote approved/accepted and partial/full down payment cleared
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .in("charge_status", ["partially_paid", "fully_paid"])
      .in("status", ["requested", "under_review", "accepted"]),

    // 5. System Inventory Headcount
    supabase
      .from("furniture")
      .select("*", { count: "exact", head: true }),

    // 6. Active Workshop Production: Catalog Items
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "in_production"),

    // 7. Active Workshop Production: Custom Inquiries
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_production"),

    // 8. Partial Payments: Ready for Pickup (Must settle remaining balances before dispatch release)
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

    // 9. Partial Payments: Ready for Shipment (Must settle remaining balances before dispatch release)
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

    // 10. Fully Paid Side: Ready for Pickup (Cleared for instant customer release)
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

    // 11. Fully Paid Side: Delivery Pipeline (Tracks items through setup and shipping transit until completed)
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("order_status", ["ready_for_shipment", "in_transit"])
      .eq("charge_status", "fully_paid"),
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .in("status", ["ready_for_shipment", "in_transit"])
      .eq("charge_status", "fully_paid"),

    // 12. Completed Volume Aggregations (Items are wiped clean from active dashboard columns once finalized)
    typedClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "completed"),
    typedClient
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),

    // 13. System Registered User Accounts
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),

    // 14. Activity Tracking Feed Data
    typedClient
      .from("orders")
      .select("id, order_reference_code, final_total_price, order_status, created_at")
      .order("created_at", { ascending: false })
      .limit(15),

    typedClient
      .from("inquiries")
      .select("id, status, final_total_price, created_at, inquiry_items ( title )")
      .order("created_at", { ascending: false })
      .limit(15),

    typedClient
      .from("payments")
      .select("id, amount, status, created_at, external_reference, provider, order_id, inquiry_id, orders(order_reference_code)")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  // --- Process Operational Badges ---
  const pendingQuotes = pendingQuotesRes.count ?? 0;
  const totalFurnitureCatalogCount = totalFurnitureRes.count ?? 0;
  const completedOrdersCount = completedOrdersRes.count ?? 0;
  const completedInquiriesCount = completedInquiriesRes.count ?? 0;
  const currentUsersCount = currentUsersRes.count ?? 0;

  const unreadMessages = (unreadMessagesRes.data ?? []).reduce(
    (acc, curr) => acc + (curr.admin_unread_count ?? 0),
    0
  );

  const pendingStoreOrdersCount = paidOrdersNotStartedRes.count ?? 0;
  const pendingCustomRequestsCount = paidInquiriesNotStartedRes.count ?? 0;
  const paidAwaitingProduction = pendingStoreOrdersCount + pendingCustomRequestsCount;

  const activeProduction = (activeOrdersRes.count ?? 0) + (activeInquiriesRes.count ?? 0);

  // --- Parse Pipeline Data Columns Safely ---
  const partiallyPaidPickupCount = (partiallyPaidPickupOrdersRes.count ?? 0) + (partiallyPaidPickupInquiriesRes.count ?? 0);
  const partiallyPaidDeliveryCount = (partiallyPaidDeliveryOrdersRes.count ?? 0) + (partiallyPaidDeliveryInquiriesRes.count ?? 0);

  const fullyPaidPickupCount = (fullyPaidPickupOrdersRes.count ?? 0) + (fullyPaidPickupInquiriesRes.count ?? 0);
  const fullyPaidDeliveryCount = (fullyPaidDeliveryOrdersRes.count ?? 0) + (fullyPaidDeliveryInquiriesRes.count ?? 0);

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
        amount: i.final_total_price ? Number(i.final_total_price) : undefined,
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