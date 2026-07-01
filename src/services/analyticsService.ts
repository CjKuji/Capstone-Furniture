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
    paidOrders: number;
    paidInquiries: number;
    fullyPaidOrders: number;
    partiallyPaidOrders: number;
    fullyPaidInquiries: number;
    partiallyPaidInquiries: number;
    ordersOutstandingValue: number;
    inquiriesOutstandingValue: number;
    inquiryTotalValue: number;
    inquiryPaidValue: number;
    inquiryConversionRate: number;
    /** Revenue broken out by channel — useful for comparing order vs inquiry financial contribution */
    orderRevenue: number;
    inquiryRevenue: number;
    revenueByMonth: RevenuePoint[];
    ordersByStatus: StatusCount[];
    inquiriesByStatus: StatusCount[];
    topProducts: TopProduct[];
    recentOrders: RecentOrder[];
    recentInquiries: RecentInquiry[];
    mismatches: DataMismatch[];
    /** Deduplicated list of years present in revenueByMonth, for the year selector */
    availableYears: string[];
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
    charge_status: string | null;
    final_total_price: number | null; 
    created_at: string | null;
    phone_number: string | null;
}

interface ChargeRow {
    id: string;
    order_id: string | null;
    amount: number | null;
    is_additive: boolean;
}

interface PaymentRow {
    amount: number | null;
    status: string | null;
    order_id: string | null;
    inquiry_id: string | null;
    created_at: string | null;
}

interface ConversationRow {
    id: string;
    inquiry_id: string | null;
    last_message: string | null;
    updated_at: string | null;
}

interface OrderItemRow {
    order_id: string;
    unit_price: number | null;
    quantity: number | null;
    total_price: number | null;
    furniture_snapshot: Record<string, unknown> | null;
}

async function safeSelect<T>(
    table: string,
    columns: string,
    options?: { orderBy?: { column: string; ascending: boolean }; limit?: number }
): Promise<T[]> {
    try {
        const fromTable = supabase.from(table as keyof typeof supabase.from);
        let query = fromTable.select(columns);

        if (options?.orderBy) {
            query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
        }

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) {
            console.warn(`[analytics] ${table} query failed`, error.message);
            return [];
        }

        return (data as T[]) ?? [];
    } catch (error) {
        console.warn(`[analytics] ${table} query crashed`, error);
        return [];
    }
}

/**
 * Normalizes date timestamps into consistent chronological graph points
 */
function monthLabel(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Unknown";
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getOrderExpectedAmount(order: OrderRow, orderItems: OrderItemRow[], chargesByOrder: Record<string, number>): number {
    const items = orderItems.filter((item) => item.order_id === order.id);
    const subtotal = items.reduce((sum, item) => sum + Number(item?.total_price ?? 0), 0);
    const baseTotal = Number(order.quote_total_price ?? 0) || subtotal;
    const orderChargesTotal = chargesByOrder[order.id] ?? 0;

    return order.charge_status === "accepted"
        ? Number(order.final_total_price ?? baseTotal)
        : baseTotal + orderChargesTotal;
}

export async function getAnalytics(): Promise<AnalyticsData> {
    const [orders, inquiries, payments, orderItems, conversations, allCharges] = await Promise.all([
        safeSelect<OrderRow>(
            "orders",
            "id, order_reference_code, order_status, payment_status, charge_status, quote_total_price, final_total_price, created_at, customer_name",
            { orderBy: { column: "created_at", ascending: false } }
        ),
        safeSelect<InquiryRow>(
            "inquiries",
            "id, status, payment_status, charge_status, final_total_price, created_at, phone_number",
            { orderBy: { column: "created_at", ascending: false } }
        ),
        safeSelect<PaymentRow>("payments", "amount, status, order_id, inquiry_id, created_at"),
        safeSelect<OrderItemRow>("order_items", "order_id, unit_price, quantity, total_price, furniture_snapshot", { limit: 1000 }),
        safeSelect<ConversationRow>("conversations", "id, inquiry_id, last_message, updated_at", { limit: 100 }),
        safeSelect<ChargeRow>("order_charges", "id, order_id, amount, is_additive", { limit: 1000 })
    ]);

    const paymentsData = payments ?? [];
    const conversationsData = conversations ?? [];
    const allChargesData = allCharges ?? [];

    // =========================================================
    // 1. FINANCIAL CALCULATION LAYER (Orders + Inquiries Combined)
    // =========================================================
    const paidBusinessPayments = paymentsData.filter((p: PaymentRow) => p.status === "paid");
    const totalRevenue = paidBusinessPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
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

    paidBusinessPayments.forEach((p: PaymentRow) => {
        if (p.order_id) paidByOrder[p.order_id] = (paidByOrder[p.order_id] ?? 0) + Number(p.amount);
        if (p.inquiry_id) paidByInquiry[p.inquiry_id] = (paidByInquiry[p.inquiry_id] ?? 0) + Number(p.amount);
    });

    allChargesData.forEach((c: ChargeRow) => {
        if (c.order_id) {
            const amt = Number(c.amount ?? 0);
            chargesByOrder[c.order_id] = (chargesByOrder[c.order_id] ?? 0) + (c.is_additive ? amt : -amt);
        }
    });

    // Channel revenue breakout — for comparing which channel contributes more financially
    const orderRevenue = Object.values(paidByOrder).reduce((sum, v) => sum + v, 0);
    const inquiryRevenue = Object.values(paidByInquiry).reduce((sum, v) => sum + v, 0);

    // =========================================================
    // 2. RECONCILIATION AUDIT LAYER
    // =========================================================
    const mismatches: DataMismatch[] = [];

    const orderExpectedAmounts = new Map<string, number>();
    orders.forEach((o) => {
        orderExpectedAmounts.set(o.id, getOrderExpectedAmount(o, orderItems, chargesByOrder));
    });

    // Audit Store Checkout Orders 
    orders.forEach(o => {
        const actualPaid = paidByOrder[o.id] ?? 0;
        const expectedPrice = orderExpectedAmounts.get(o.id) ?? 0;

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
    const acceptedValueInquiries = inquiries.filter((inquiry) => {
        const expected = Number(inquiry.final_total_price ?? 0);
        return expected > 0 || inquiry.charge_status === "accepted";
    });

    const inquiryTotalValue = acceptedValueInquiries.reduce((sum, inquiry) => sum + Number(inquiry.final_total_price ?? 0), 0);
    const paidOrders = orders.filter((order) => (paidByOrder[order.id] ?? 0) > 0).length;
    const paidInquiries = acceptedValueInquiries.filter((inquiry) => (paidByInquiry[inquiry.id] ?? 0) > 0).length;
    const fullyPaidOrders = orders.filter((order) => {
        const expected = orderExpectedAmounts.get(order.id) ?? 0;
        const actual = paidByOrder[order.id] ?? 0;
        return expected > 0 && actual >= expected;
    }).length;
    const partiallyPaidOrders = orders.filter((order) => {
        const expected = orderExpectedAmounts.get(order.id) ?? 0;
        const actual = paidByOrder[order.id] ?? 0;
        return expected > 0 && actual > 0 && actual < expected;
    }).length;
    const ordersOutstandingValue = orders.reduce((sum, order) => {
        const expected = orderExpectedAmounts.get(order.id) ?? 0;
        const actual = paidByOrder[order.id] ?? 0;
        return sum + (expected > 0 && actual > 0 && actual < expected ? Math.max(expected - actual, 0) : 0);
    }, 0);
    const fullyPaidInquiries = acceptedValueInquiries.filter((inquiry) => {
        const expected = Number(inquiry.final_total_price ?? 0);
        const actual = paidByInquiry[inquiry.id] ?? 0;
        return expected > 0 && actual >= expected;
    }).length;
    const partiallyPaidInquiries = acceptedValueInquiries.filter((inquiry) => {
        const expected = Number(inquiry.final_total_price ?? 0);
        const actual = paidByInquiry[inquiry.id] ?? 0;
        return expected > 0 && actual > 0 && actual < expected;
    }).length;
    const inquiriesOutstandingValue = acceptedValueInquiries.reduce((sum, inquiry) => {
        const expected = Number(inquiry.final_total_price ?? 0);
        const actual = paidByInquiry[inquiry.id] ?? 0;
        return sum + (expected > 0 && actual > 0 && actual < expected ? Math.max(expected - actual, 0) : 0);
    }, 0);
    const inquiryPaidValue = acceptedValueInquiries.reduce((sum, inquiry) => {
        const expected = Number(inquiry.final_total_price ?? 0);
        const actual = paidByInquiry[inquiry.id] ?? 0;
        return sum + Math.min(expected, actual);
    }, 0);
    const inquiryConversionRate = acceptedValueInquiries.length > 0 ? (paidInquiries / acceptedValueInquiries.length) * 100 : 0;

    // Revenue by month — return ALL data (no slice), frontend will filter by year
    const monthMap: Record<string, number> = {};
    paidBusinessPayments.forEach((p) => {
        if (!p.created_at) return;
        const label = monthLabel(p.created_at);
        if (label === "Unknown") return;
        monthMap[label] = (monthMap[label] ?? 0) + Number(p.amount ?? 0);
    });
    
    const revenueByMonth: RevenuePoint[] = Object.entries(monthMap)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => {
            // Sort chronologically by parsing month labels
            const dateA = new Date(`01 ${a.month}`);
            const dateB = new Date(`01 ${b.month}`);
            return dateA.getTime() - dateB.getTime();
        });

    // Extract available years from revenue month labels (e.g. "Jan 26" → "2026")
    const yearMap = new Set<string>();
    revenueByMonth.forEach(({ month }) => {
        // Month labels look like "Jan 26" or "Jan 2026" — extract the year part
        const parts = month.trim().split(" ");
        const yearToken = parts[parts.length - 1];
        if (yearToken.length === 2) {
            yearMap.add(`20${yearToken}`);
        } else if (yearToken.length === 4 && !isNaN(Number(yearToken))) {
            yearMap.add(yearToken);
        }
    });
    const availableYears = Array.from(yearMap).sort();

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
    const completedOrderStatuses = new Set(["delivered", "completed", "closed", "done", "fulfilled", "ready"]);
    const eligibleOrderIds = new Set(
        orders
            .filter((order) => {
                const orderStatus = (order.order_status ?? "").toLowerCase();
                return completedOrderStatuses.has(orderStatus) && (paidByOrder[order.id] ?? 0) > 0;
            })
            .map((order) => order.id)
    );

    const productMap: Record<string, { orders: number; revenue: number }> = {};
    orderItems.forEach((item) => {
        if (!eligibleOrderIds.has(item.order_id)) return;

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
        const targetChat = conversationsData.find(c => c.inquiry_id === i.id);
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
        paidOrders,
        paidInquiries,
        fullyPaidOrders,
        partiallyPaidOrders,
        fullyPaidInquiries,
        partiallyPaidInquiries,
        ordersOutstandingValue,
        inquiriesOutstandingValue,
        inquiryTotalValue,
        inquiryPaidValue,
        inquiryConversionRate,
        orderRevenue,
        inquiryRevenue,
        revenueByMonth,
        ordersByStatus,
        inquiriesByStatus,
        topProducts,
        recentOrders,
        recentInquiries,
        mismatches,
        availableYears,
    };
}