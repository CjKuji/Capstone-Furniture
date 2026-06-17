"use client";

import { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, CreditCard, Clock, Package, Download, type LucideIcon } from "lucide-react";
import { getAnalytics } from "@/services/analyticsService";
import type { AnalyticsData } from "@/services/analyticsService";

/* =========================================================
   HELPERS
========================================================= */

function formatPHP(n: number) {
    return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* =========================================================
   CSV EXPORT
========================================================= */

function exportCSV(data: AnalyticsData) {
        const rows: string[][] = [];

        const escape = (v: string | number) => {
            const s = String(v);
            return s.includes(",") || s.includes('"') || s.includes("\n")
                ? `"${s.replace(/"/g, '""')}"`
                : s;
        };
        const row = (...cells: (string | number)[]) => rows.push(cells.map(escape));

        row("REPORTS & ANALYTICS EXPORT");
        row("Generated", new Date().toLocaleString("en-PH"));
        row();

        row("KPI SUMMARY");
        row("Metric", "Value");
        row("Total Revenue", data.totalRevenue);
        row("Total Collected", data.totalPaid);
        row("Total Orders", data.totalOrders);
        row("Pending Orders", data.pendingOrders);
        row();

        row("REVENUE BY MONTH");
        row("Month", "Revenue");
        data.revenueByMonth.forEach((r) => row(r.month, r.revenue));
        row();

        row("ORDERS BY STATUS");
        row("Status", "Count");
        data.ordersByStatus.forEach((s) => row(s.status, s.count));
        row();

        row("TOP PRODUCTS BY REVENUE");
        row("Rank", "Product", "Orders", "Revenue");
        data.topProducts.forEach((p, i) => row(i + 1, p.name, p.orders, p.revenue));
        row();

        row("RECENT ORDERS");
        row("Reference", "Status", "Payment Status", "Total");
        data.recentOrders.forEach((o) =>
            row(o.reference, o.status, o.payment_status, o.total)
        );

        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
}

/* =========================================================
   STATUS COLOR
========================================================= */

function statusColor(status: string) {
    const map: Record<string, string> = {
        requested: "text-yellow-400 bg-yellow-400/10",
        confirmed: "text-blue-400 bg-blue-400/10",
        in_production: "text-purple-400 bg-purple-400/10",
        ready: "text-cyan-400 bg-cyan-400/10",
        delivered: "text-emerald-400 bg-emerald-400/10",
        cancelled: "text-red-400 bg-red-400/10",
        paid: "text-emerald-400 bg-emerald-400/10",
        partially_paid: "text-yellow-400 bg-yellow-400/10",
        unpaid: "text-red-400 bg-red-400/10",
    };
    return map[status] ?? "text-white/50 bg-white/5";
}

/* =========================================================
   KPI CARD
========================================================= */

function KpiCard({
    label,
    value,
    sub,
    icon: Icon,
    accent = false,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: LucideIcon;
    accent?: boolean;
}) {
    return (
        <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${accent ? "bg-[#D4A97A]/10 border-[#D4A97A]/30" : "bg-white/[0.03] border-white/10"}`}>
            <div className="flex items-center justify-between">
                <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
                <Icon size={16} className={accent ? "text-[#D4A97A]" : "text-white/20"} />
            </div>
            <p className={`text-2xl font-semibold ${accent ? "text-[#D4A97A]" : "text-white"}`}>{value}</p>
            {sub && <p className="text-xs text-white/30">{sub}</p>}
        </div>
    );
}

/* =========================================================
   BAR CHART (pure CSS — no charting library needed)
========================================================= */

function BarChart({ data }: { data: { label: string; value: number }[] }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div className="flex items-end gap-2 h-32 w-full">
            {data.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <div
                        className="w-full rounded-t-md bg-[#D4A97A]/70 hover:bg-[#D4A97A] transition-all"
                        style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
                        title={formatPHP(d.value)}
                    />
                    <span className="text-[9px] text-white/30 truncate w-full text-center">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminReportsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getAnalytics()
            .then(setData)
            .catch((e) => setError(e?.message ?? "Failed to load analytics"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#0F0A06] p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                    ))}
                </div>
            </main>
        );
    }

    if (error || !data) {
        return (
            <main className="min-h-screen bg-[#0F0A06] p-6 flex items-center justify-center">
                <p className="text-red-400 text-sm">{error ?? "No data"}</p>
            </main>
        );
    }

    const revenueChartData = data.revenueByMonth.map((r) => ({
        label: r.month,
        value: r.revenue,
    }));

    return (
        <main className="min-h-screen bg-[#0F0A06] text-white p-6 space-y-6">

            {/* HEADER */}
            <div className="border-b border-white/5 pb-4 flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Reports &amp; Analytics</h1>
                    <p className="text-sm text-white/40 mt-1">Live data from all orders and payments</p>
                </div>
                <button
                    onClick={() => exportCSV(data)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4A97A]/10 hover:bg-[#D4A97A]/20 border border-[#D4A97A]/30 text-[#D4A97A] text-sm font-medium transition"
                >
                    <Download size={14} />
                    Export CSV
                </button>
            </div>

            {/* KPI ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Total Revenue"
                    value={formatPHP(data.totalRevenue)}
                    sub="Quoted order totals"
                    icon={TrendingUp}
                    accent
                />
                <KpiCard
                    label="Total Collected"
                    value={formatPHP(data.totalPaid)}
                    sub="Confirmed payments"
                    icon={CreditCard}
                />
                <KpiCard
                    label="Total Orders"
                    value={String(data.totalOrders)}
                    icon={ShoppingBag}
                />
                <KpiCard
                    label="Pending Orders"
                    value={String(data.pendingOrders)}
                    sub="Requested + confirmed"
                    icon={Clock}
                />
            </div>

            {/* REVENUE CHART + ORDER STATUS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Revenue by month */}
                <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Revenue by Month</h2>
                    {revenueChartData.length > 0
                        ? <BarChart data={revenueChartData} />
                        : <p className="text-white/30 text-sm">No order data yet</p>}
                </div>

                {/* Orders by status */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Orders by Status</h2>
                    <div className="space-y-2">
                        {data.ordersByStatus.length === 0 && (
                            <p className="text-white/30 text-sm">No orders yet</p>
                        )}
                        {data.ordersByStatus
                            .sort((a, b) => b.count - a.count)
                            .map((s) => (
                                <div key={s.status} className="flex items-center justify-between">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor(s.status)}`}>
                                        {s.status.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-sm font-semibold text-white">{s.count}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* TOP PRODUCTS + RECENT ORDERS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Top Products */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Package size={14} className="text-[#D4A97A]" />
                        Top Products by Revenue
                    </h2>
                    {data.topProducts.length === 0 && (
                        <p className="text-white/30 text-sm">No order items yet</p>
                    )}
                    <div className="space-y-3">
                        {data.topProducts.map((p, i) => (
                            <div key={p.name} className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-white/20 w-4 text-right">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{p.name}</p>
                                    <p className="text-[11px] text-white/40">{p.orders} order{p.orders !== 1 ? "s" : ""}</p>
                                </div>
                                <span className="text-sm font-semibold text-[#D4A97A] shrink-0">
                                    {formatPHP(p.revenue)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Recent Orders</h2>
                    {data.recentOrders.length === 0 && (
                        <p className="text-white/30 text-sm">No orders yet</p>
                    )}
                    <div className="space-y-2">
                        {data.recentOrders.map((o) => (
                            <div key={o.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white/60 font-mono">{o.reference}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${statusColor(o.status)}`}>
                                            {o.status.replace(/_/g, " ")}
                                        </span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${statusColor(o.payment_status)}`}>
                                            {o.payment_status.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-white shrink-0">
                                    {formatPHP(o.total)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
