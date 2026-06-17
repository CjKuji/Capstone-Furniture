import { supabase } from "@/lib/supabase";

export type RevenuePoint = { month: string; revenue: number };
export type OrderStatusCount = { status: string; count: number };
export type TopProduct = { name: string; orders: number; revenue: number };
export type RecentOrder = {
    id: string;
    reference: string;
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
    revenueByMonth: RevenuePoint[];
    ordersByStatus: OrderStatusCount[];
    topProducts: TopProduct[];
    recentOrders: RecentOrder[];
};

function monthLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export async function getAnalytics(): Promise<AnalyticsData> {
    const [ordersRes, paymentsRes, orderItemsRes] = await Promise.all([
        supabase
            .from("orders")
            .select("id, order_reference_code, order_status, payment_status, final_total_price, quote_total_price, created_at")
            .order("created_at", { ascending: false })
            .limit(500),
        supabase
            .from("payments")
            .select("amount, status, created_at")
            .eq("status", "paid"),
        supabase
            .from("order_items")
            .select("unit_price, quantity, furniture_snapshot")
            .limit(1000),
    ]);

    const orders = ordersRes.data ?? [];
    const payments = paymentsRes.data ?? [];
    const orderItems = orderItemsRes.data ?? [];

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
        (sum, o) => sum + Number(o.final_total_price ?? o.quote_total_price ?? 0),
        0
    );
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const pendingOrders = orders.filter(
        (o) =>
            o.order_status === "requested" ||
            o.order_status === "accepted" ||
            o.order_status === "awaiting_payment"
    ).length;

    const monthMap: Record<string, number> = {};
    orders.forEach((o) => {
        if (!o.created_at) return;
        const label = monthLabel(o.created_at);
        monthMap[label] =
            (monthMap[label] ?? 0) +
            Number(o.final_total_price ?? o.quote_total_price ?? 0);
    });
    const revenueByMonth: RevenuePoint[] = Object.entries(monthMap)
        .slice(-6)
        .map(([month, revenue]) => ({ month, revenue }));

    const statusMap: Record<string, number> = {};
    orders.forEach((o) => {
        const s = o.order_status ?? "unknown";
        statusMap[s] = (statusMap[s] ?? 0) + 1;
    });
    const ordersByStatus: OrderStatusCount[] = Object.entries(statusMap).map(
        ([status, count]) => ({ status, count })
    );

    const productMap: Record<string, { orders: number; revenue: number }> = {};
    orderItems.forEach((item) => {
        const name =
            (item.furniture_snapshot as { name?: string } | null)?.name ?? "Unknown";
        const revenue = Number(item.unit_price ?? 0) * Number(item.quantity ?? 1);
        if (!productMap[name]) productMap[name] = { orders: 0, revenue: 0 };
        productMap[name].orders += 1;
        productMap[name].revenue += revenue;
    });
    const topProducts: TopProduct[] = Object.entries(productMap)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([name, v]) => ({ name, ...v }));

    const recentOrders: RecentOrder[] = orders.slice(0, 8).map((o) => ({
        id: o.id,
        reference: o.order_reference_code ?? o.id.slice(0, 8).toUpperCase(),
        status: o.order_status ?? "unknown",
        payment_status: o.payment_status ?? "unpaid",
        total: Number(o.final_total_price ?? o.quote_total_price ?? 0),
        created_at: o.created_at,
    }));

    return {
        totalRevenue,
        totalOrders,
        totalPaid,
        pendingOrders,
        revenueByMonth,
        ordersByStatus,
        topProducts,
        recentOrders,
    };
}
