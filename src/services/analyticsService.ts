import { supabase } from "@/lib/supabase";

export type RevenuePoint = { month: string; revenue: number };
export type StatusCount = { status: string; count: number };
export type TopProduct = { name: string; orders: number; revenue: number };

export type DataMismatch = {
    id: string;
    type: "order" | "inquiry";
    reference: string;
    issue: string;
    expectedAmount: number;
    paidAmount: number;
};

export type RecentOrder = {
    id: string;
    reference: string;
    status: string;
    payment_status: string;
    charge_status: string;
    total: number;
    created_at: string | null;
};

export type RecentInquiry = {
    id: string;
    reference: string;
    customer_name: string;
    last_message: string;
    status: string;
    payment_status: string;
    total: number;
    created_at: string | null;
};

export type AnalyticsData = {
    totalRevenue: number;
    totalOrders: number;
    totalPaid: number;
    pendingOrders: number;
    totalInquiries: number; 
    revenueByMonth: RevenuePoint[];
    ordersByStatus: StatusCount[];
    inquiriesByStatus: StatusCount[]; 
    topProducts: TopProduct[];
    recentOrders: RecentOrder[];
    recentInquiries: RecentInquiry[]; 
    mismatches: DataMismatch[];
};

interface OrderRow {
    id: string;
    order_reference_code: string | null;
    order_status: string | null;
    payment_status: string | null;
    charge_status: string | null;
    quote_total_price: number | null; 
    final_total_price: number | null;
    created_at: string | null;
    customer_name: string | null;
}

interface InquiryRow {
    id: string;
    status: string | null;
    payment_status: string | null; 
    final_total_price: number | null; 
    created_at: string | null;
    phone_number: string | null;
}

interface ChargeRow {
    id: string;
    order_id: string | null;
    inquiry_id: string | null;
    amount: number | null;
    is_additive: boolean;
}

interface OrderItemRow {
    order_id: string;
    unit_price: number | null;
    quantity: number | null;
    total_price: number | null;
    furniture_snapshot: any;
}

/**
 * Normalizes date timestamps into consistent chronological graph points
 */
function monthLabel(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Unknown";
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export async function getAnalytics(): Promise<AnalyticsData> {
    const [ordersRes, inquiriesRes, paymentsRes, orderItemsRes, conversationsRes, chargesRes] = await Promise.all([
        supabase
            .from("orders")
            .select("id, order_reference_code, order_status, payment_status, charge_status, quote_total_price, final_total_price, created_at, customer_name")
            .order("created_at", { ascending: false }),
        supabase
            .from("inquiries")
            .select("id, status, payment_status, final_total_price, created_at, phone_number")
            .order("created_at", { ascending: false }),
        supabase
            .from("payments")
            .select("amount, status, order_id, inquiry_id, created_at"),
        supabase
            .from("order_items")
            .select("order_id, unit_price, quantity, total_price, furniture_snapshot")
            .limit(1000),
        supabase
            .from("conversations")
            .select("id, inquiry_id, last_message, updated_at")
            .limit(100),
        supabase
            .from("order_charges")
            .select("id, order_id, inquiry_id, amount, is_additive")
            .limit(1000)
    ]);

    const orders = (ordersRes.data as unknown as OrderRow[]) ?? [];
    const inquiries = (inquiriesRes.data as unknown as InquiryRow[]) ?? [];
    const payments = paymentsRes.data ?? [];
    const orderItems = (orderItemsRes.data as unknown as OrderItemRow[]) ?? [];
    const conversations = conversationsRes.data ?? [];
    const allCharges = (chargesRes.data as unknown as ChargeRow[]) ?? [];

    // =========================================================
    // 1. FINANCIAL CALCULATION LAYER (Orders + Inquiries Combined)
    // =========================================================
    const paidPayments = payments.filter(p => p.status === "paid");
    const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const totalPaid = totalRevenue;

    const totalOrders = orders.length;
    const totalInquiries = inquiries.length;

    // Strict alignment with active internal operational matrices
    const pendingOrders = orders.filter(
        (o) =>
            o.order_status === "requested" ||
            o.order_status === "accepted" ||
            o.order_status === "in_production"
    ).length;

    // Compute dynamic lookup maps to match against underlying financial ledger
    const paidByOrder: Record<string, number> = {};
    const paidByInquiry: Record<string, number> = {};
    const chargesByOrder: Record<string, number> = {};

    paidPayments.forEach(p => {
        if (p.order_id) paidByOrder[p.order_id] = (paidByOrder[p.order_id] ?? 0) + Number(p.amount);
        if (p.inquiry_id) paidByInquiry[p.inquiry_id] = (paidByInquiry[p.inquiry_id] ?? 0) + Number(p.amount);
    });

    allCharges.forEach(c => {
        if (c.order_id) {
            const amt = Number(c.amount ?? 0);
            chargesByOrder[c.order_id] = (chargesByOrder[c.order_id] ?? 0) + (c.is_additive ? amt : -amt);
        }
    });

    // =========================================================
    // 2. RECONCILIATION AUDIT LAYER
    // =========================================================
    const mismatches: DataMismatch[] = [];

    // Audit Store Checkout Orders 
    orders.forEach(o => {
        const actualPaid = paidByOrder[o.id] ?? 0;
        const items = orderItems.filter(item => item.order_id === o.id);
        const subtotal = items.reduce((sum, i) => sum + Number(i?.total_price ?? 0), 0);
        const baseTotal = Number(o.quote_total_price ?? 0) || subtotal;
        const orderChargesTotal = chargesByOrder[o.id] ?? 0;
        
        const expectedPrice = o.charge_status === "accepted"
            ? Number(o.final_total_price ?? baseTotal)
            : baseTotal + orderChargesTotal;

        if (actualPaid > 0 && (o.payment_status === "unpaid" || o.payment_status === "rejected")) {
            mismatches.push({
                id: o.id,
                type: "order",
                reference: o.order_reference_code ?? o.id.slice(0, 8).toUpperCase(),
                issue: `Paid ₱${actualPaid.toLocaleString()} but order state records as "${o.payment_status}"`,
                expectedAmount: expectedPrice,
                paidAmount: actualPaid
            });
        }
    });

    // Audit Custom Requests & Configurator Inquiries
    inquiries.forEach(i => {
        const actualPaid = paidByInquiry[i.id] ?? 0;
        const expectedPrice = Number(i.final_total_price ?? 0);
        const remaining = Math.max(expectedPrice - actualPaid, 0);

        let dynamicPaymentStatus = "unpaid";
        if (actualPaid > 0) {
            dynamicPaymentStatus = remaining <= 0 ? "fully_paid" : "partially_paid";
        }

        if (actualPaid > 0 && i.payment_status === "unpaid" && dynamicPaymentStatus !== "unpaid") {
            mismatches.push({
                id: i.id,
                type: "inquiry",
                reference: `#INQ-${i.id.slice(0, 8).toUpperCase()}`,
                issue: `Customer paid ₱${actualPaid.toLocaleString()} (${dynamicPaymentStatus.replace(/_/g, " ")}), but database states "unpaid"`,
                expectedAmount: expectedPrice,
                paidAmount: actualPaid
            });
        }
    });

    // =========================================================
    // 3. GRAPHING AND MAP REDUCTIONS
    // =========================================================
    const monthMap: Record<string, number> = {};
    paidPayments.forEach((p) => {
        if (!p.created_at) return;
        const label = monthLabel(p.created_at);
        if (label === "Unknown") return;
        monthMap[label] = (monthMap[label] ?? 0) + Number(p.amount ?? 0);
    });
    
    const revenueByMonth: RevenuePoint[] = Object.entries(monthMap)
        .slice(-6)
        .map(([month, revenue]) => ({ month, revenue }));

    // Catalog Orders Volume Aggregates
    const orderStatusMap: Record<string, number> = {};
    orders.forEach((o) => {
        const s = o.order_status ?? "requested";
        orderStatusMap[s] = (orderStatusMap[s] ?? 0) + 1;
    });
    const ordersByStatus: StatusCount[] = Object.entries(orderStatusMap).map(
        ([status, count]) => ({ status, count })
    );

    // Custom Inquiries Volume Aggregates
    const inquiryStatusMap: Record<string, number> = {};
    inquiries.forEach((i) => {
        const s = i.status ?? "requested"; 
        inquiryStatusMap[s] = (inquiryStatusMap[s] ?? 0) + 1;
    });
    const inquiriesByStatus: StatusCount[] = Object.entries(inquiryStatusMap).map(
        ([status, count]) => ({ status, count })
    );

    // Top Selling Products Map
    const productMap: Record<string, { orders: number; revenue: number }> = {};
    orderItems.forEach((item) => {
        const name = (item.furniture_snapshot as { name?: string } | null)?.name ?? "Unknown Design Piece";
        const revenue = Number(item.unit_price ?? 0) * Number(item.quantity ?? 1);
        if (!productMap[name]) productMap[name] = { orders: 0, revenue: 0 };
        productMap[name].orders += 1;
        productMap[name].revenue += revenue;
    });
    
    const topProducts: TopProduct[] = Object.entries(productMap)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([name, v]) => ({ name, ...v }));

    // =========================================================
    // 4. PIPELINE FLATTENING FEEDS (Real-time Views)
    // =========================================================

    // Recent Store Orders Pipeline Feed
    const recentOrders: RecentOrder[] = orders.slice(0, 8).map((o) => {
        const items = orderItems.filter(item => item.order_id === o.id);
        const subtotal = items.reduce((sum, i) => sum + Number(i?.total_price ?? 0), 0);
        const baseTotal = Number(o.quote_total_price ?? 0) || subtotal;
        const orderChargesTotal = chargesByOrder[o.id] ?? 0;
        
        const finalTotal = o.charge_status === "accepted"
            ? Number(o.final_total_price ?? baseTotal)
            : baseTotal + orderChargesTotal;

        return {
            id: o.id,
            reference: o.order_reference_code ?? o.id.slice(0, 8).toUpperCase(),
            status: o.order_status ?? "requested",
            payment_status: o.payment_status ?? "unpaid",
            charge_status: o.charge_status ?? "pending",
            total: finalTotal,
            created_at: o.created_at,
        };
    });

    // Recent Custom Inquiries Pipeline Feed
    const recentInquiries: RecentInquiry[] = inquiries.slice(0, 8).map((i) => {
        const targetChat = conversations.find(c => c.inquiry_id === i.id);
        const actualPaid = paidByInquiry[i.id] ?? 0;
        const expectedPrice = Number(i.final_total_price ?? 0);
        const remaining = Math.max(expectedPrice - actualPaid, 0);

        let computedPaymentStatus = i.payment_status ?? "unpaid";
        if (actualPaid > 0) {
            computedPaymentStatus = remaining <= 0 ? "fully_paid" : "partially_paid";
        }

        return {
            id: i.id,
            reference: `#INQ-${i.id.slice(0, 8).toUpperCase()}`,
            customer_name: i.phone_number ?? "Anonymous Configurator",
            last_message: targetChat?.last_message ?? "No discussion initiated yet.",
            status: i.status ?? "requested",
            payment_status: computedPaymentStatus,
            total: expectedPrice,
            created_at: i.created_at
        };
    });

    return {
        totalRevenue,
        totalOrders,
        totalPaid,
        pendingOrders,
        totalInquiries,
        revenueByMonth,
        ordersByStatus,
        inquiriesByStatus,
        topProducts,
        recentOrders,
        recentInquiries,
        mismatches
    };
}