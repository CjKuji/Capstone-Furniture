"use client";

import { 
    TrendingUp, 
    ShoppingBag, 
    CreditCard, 
    Clock, 
    Package, 
    Download, 
    Printer, 
    MessageSquare, 
    AlertTriangle,
    Armchair,
    Layers,
    type LucideIcon 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/services/analyticsService";
import type { AnalyticsData } from "@/services/analyticsService";

/* =========================================================
   HELPERS
========================================================= */

function formatPHP(n: number) {
    return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* =========================================================
   EXPORT UTILITIES (CSV Export Generator)
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

    row("FURNITURE ENTERPRISE MANAGEMENT - RETAIL & CUSTOM PRODUCTION REPORT");
    row("Generated At", new Date().toLocaleString("en-PH"));
    row();

    row("EXECUTIVE KEY PERFORMANCE INDICATORS");
    row("Metric", "Value");
    row("Gross Sales Revenue", data.totalRevenue);
    row("Liquid Collections Received", data.totalPaid);
    row("Showroom Catalog Orders Closed", data.totalOrders);
    row("Active Workshop Production Backlog", data.pendingOrders);
    row("Custom Bespoke Design Requests", data.totalInquiries);
    row();

    row("HISTORICAL REVENUE REVENUE RUN RATE");
    row("Posting Month", "Gross Settled Value");
    data.revenueByMonth.forEach((r) => row(r.month, r.revenue));
    row();

    row("RETAIL ORDERS BREAKDOWN BY LIFECYCLE STATUS");
    row("Production Status Pillar", "Active Count");
    data.ordersByStatus.forEach((s) => row(s.status, s.count));
    row();

    row("BESPOKE CUSTOM DESIGN CONSULTATIONS");
    row("Pipeline Status Pillar", "Active Count");
    data.inquiriesByStatus.forEach((s) => row(s.status, s.count));
    row();

    row("TOP MOVING PRODUCT COLLECTIONS BY REVENUE SHARE");
    row("Rank", "Item Description", "Units Confirmed", "Total Volumetric Revenue");
    data.topProducts.forEach((p, i) => row(i + 1, p.name, p.orders, p.revenue));
    row();

    row("SHOWROOM SALES PIPELINE LEDGER FEED");
    row("Reference ID", "Fulfillment Status", "Collection Status", "Grand Financial Total");
    data.recentOrders.forEach((o) =>
        row(o.reference, o.status, o.payment_status, o.total)
    );
    row();

    row("BESPOKE DESIGN PIPELINE CONSULTATION LOGS");
    row("Project ID", "Client Descriptor", "Client Requirements Notation", "Design Phase", "Quoted Budget Matrix");
    data.recentInquiries.forEach((i) =>
        row(i.reference, i.customer_name, i.last_message, i.status, i.total)
    );
    row();

    row("AUDIT DISCREPANCY RECONCILIATION LOGS");
    row("Log ID", "Syllable Classification", "Reference Target", "Audit Discrepancy Statement", "Invoiced Expected Amount", "Actual Settlement Collected");
    data.mismatches.forEach((m) =>
        row(m.id, m.type, m.reference, m.issue, m.expectedAmount, m.paidAmount)
    );

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `furniture-enterprise-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function triggerPDFPrint() {
    if (typeof window !== "undefined") {
        window.print();
    }
}

/* =========================================================
   PILL COLOR MAPPING
========================================================= */

function statusColor(status: string) {
    const map: Record<string, string> = {
        requested: "text-amber-600 bg-amber-500/10 border border-amber-500/20 print:text-amber-800 print:bg-amber-50 print:border-amber-300",
        accepted: "text-blue-500 bg-blue-500/10 border border-blue-500/20 print:text-blue-800 print:bg-blue-50 print:border-blue-300",
        confirmed: "text-blue-500 bg-blue-500/10 border border-blue-500/20 print:text-blue-800 print:bg-blue-50 print:border-blue-300",
        in_production: "text-purple-400 bg-purple-500/10 border border-purple-500/20 print:text-purple-800 print:bg-purple-50 print:border-purple-300",
        ready: "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 print:text-cyan-800 print:bg-cyan-50 print:border-cyan-300",
        delivered: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 print:text-emerald-800 print:bg-emerald-50 print:border-emerald-300",
        cancelled: "text-red-400 bg-red-500/10 border border-red-500/20 print:text-red-800 print:bg-red-50 print:border-red-300",
        paid: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 print:text-emerald-800 print:bg-emerald-50 print:border-emerald-300",
        fully_paid: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 print:text-emerald-800 print:bg-emerald-50 print:border-emerald-300",
        partially_paid: "text-orange-400 bg-orange-500/10 border border-orange-500/20 print:text-orange-800 print:bg-orange-50 print:border-orange-300",
        unpaid: "text-red-400 bg-red-500/10 border border-red-500/20 print:text-red-800 print:bg-red-50 print:border-red-300",
        rejected: "text-rose-400 bg-rose-500/10 border border-rose-500/20 print:text-rose-800 print:bg-rose-50 print:border-rose-300",
    };
    return map[status] ?? "text-white/50 bg-white/5 border border-white/10 print:text-gray-700 print:bg-gray-50 print:border-gray-300";
}

/* =========================================================
   SUB-COMPONENTS
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
        <div className={`rounded-xl border p-6 flex flex-col gap-4 transition-all break-inside-avoid print:border-gray-300 print:shadow-none ${
            accent 
                ? "bg-[#D4A97A]/10 border-[#D4A97A]/40 print:bg-gray-50 print:border-gray-400" 
                : "bg-white/[0.02] border-white/10 print:bg-white"
        }`}>
            <div className="flex items-center justify-between">
                <p className="text-xs text-white/40 print:text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
                <div className={`p-2 rounded-lg ${accent ? "bg-[#D4A97A]/10 text-[#D4A97A]" : "bg-white/5 text-white/40"} print:bg-gray-100 print:text-gray-700`}>
                    <Icon size={16} />
                </div>
            </div>
            <div>
                <p className={`text-2xl font-bold tracking-tight ${accent ? "text-[#D4A97A] print:text-black" : "text-white print:text-black"}`}>{value}</p>
                {sub && <p className="text-xs text-white/30 print:text-gray-400 mt-1.5 font-medium leading-relaxed">{sub}</p>}
            </div>
        </div>
    );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div className="flex items-end gap-4 h-44 w-full pt-6 px-2 print:h-52">
            {data.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-2 flex-1 min-w-0 group">
                    <div className="text-[10px] text-white/0 group-hover:text-white/80 font-mono font-medium transition-all duration-200 transform -translate-y-1 print:text-black/70 print:block">
                        {d.value > 0 ? formatPHP(d.value) : ""}
                    </div>
                    <div
                        className="w-full rounded-t-sm bg-[#D4A97A]/80 hover:bg-[#D4A97A] transition-all duration-300 relative print:bg-gray-400 print:border print:border-gray-500"
                        style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
                        title={`${d.label}: ${formatPHP(d.value)}`}
                    />
                    <span className="text-[11px] text-white/40 print:text-black font-semibold tracking-wider uppercase mt-1 truncate w-full text-center">{d.label}</span>
                </div>
            ))}
        </div>
    );
}

/* =========================================================
   MAIN VIEW EXECUTIVE DASHBOARD
========================================================= */

export default function AdminReportsPage() {
    const { data, isLoading, error } = useQuery<AnalyticsData, Error>({
        queryKey: ["adminAnalytics"],
        queryFn: getAnalytics,
        refetchInterval: 15000, 
        refetchOnWindowFocus: true,
    });

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[#0F0A06] p-8 flex flex-col gap-6">
                <div className="h-14 w-1/3 rounded-xl bg-white/5 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-64 rounded-xl bg-white/5 animate-pulse" />
                    <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
                </div>
            </main>
        );
    }

    if (error || !data) {
        return (
            <main className="min-h-screen bg-[#0F0A06] p-8 flex items-center justify-center">
                <div className="text-center p-8 border border-white/5 rounded-2xl max-w-md bg-white/[0.01]">
                    <AlertTriangle className="text-red-400 mx-auto mb-3" size={28} />
                    <p className="text-white font-medium text-sm">
                        {error?.message ?? "Enterprise operational intelligence sync connection offline"}
                    </p>
                </div>
            </main>
        );
    }

    const revenueChartData = data.revenueByMonth.map((r) => ({
        label: r.month,
        value: r.revenue,
    }));

    return (
        <main className="min-h-screen bg-[#0F0A06] text-white p-8 space-y-8 font-sans antialiased print:bg-white print:text-black print:p-0 print:space-y-10 print:w-full print:max-w-none print:m-0 print:overflow-visible">
            
            {/* INLINE CSS OVERRIDES FOR GLOBAL LAYOUT STRIPPING & CHATBOT EXTRACTION */}
            <style jsx global>{`
                @media print {
                    /* 1. Complete annihilation of system architecture sidebar/topbars & chat bots */
                    aside, 
                    nav, 
                    header, 
                    footer,
                    .sidebar, 
                    #sidebar, 
                    .admin-sidebar,
                    .navbar, 
                    .print-hidden,
                    .print\\:hidden,
                    /* Structural target rules for standard embeddable automated customer support platforms */
                    #crisp-chatbox,
                    .crisp-client,
                    #intercom-container,
                    .intercom-app,
                    iframe[id*="chat"],
                    div[class*="chat"],
                    div[id*="chat"],
                    #tw-chatbot,
                    .global-chatbot-wrapper { 
                        display: none !important; 
                        width: 0 !important; 
                        height: 0 !important; 
                        visibility: hidden !important;
                        opacity: 0 !important;
                        overflow: hidden !important;
                    }

                    /* 2. Flatten page container tree to unlock absolute 100% full-width printing layouts */
                    body, 
                    html, 
                    main, 
                    #root, 
                    .__next, 
                    div[class*="layout"], 
                    div[class*="wrapper"],
                    div[class*="container"] { 
                        background: #ffffff !important; 
                        color: #000000 !important; 
                        width: 100% !important; 
                        max-width: 100% !important;
                        margin: 0 !important; 
                        padding: 0 !important; 
                        position: static !important;
                        overflow: visible !important;
                        display: block !important;
                        box-shadow: none !important;
                    }

                    /* 3. Global high-contrast print legibility optimizations */
                    .print\\:text-black { color: #000000 !important; }
                    .print\\:text-gray-900 { color: #111827 !important; }
                    .print\\:text-gray-700 { color: #374151 !important; }
                    .print\\:text-gray-500 { color: #6B7280 !important; }
                    .print\\:bg-white { background-color: #ffffff !important; }
                    .print\\:bg-gray-50 { background-color: #F9FAFB !important; }
                    .print\\:border-gray-200 { border-color: #E5E7EB !important; }
                    .print\\:border-gray-300 { border-color: #D1D5DB !important; }
                    .print\\:border-gray-400 { border-color: #9CA3AF !important; }
                    .break-inside-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
                }
            `}</style>

            {/* CORPORATE REPORT HEADER CONTAINER */}
            <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4 print:border-gray-300 print:pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A97A] px-2 py-0.5 bg-[#D4A97A]/10 rounded print:border print:border-gray-400 print:text-black">Corporate Ledger</span>
                        <span className="text-[10px] text-white/30 font-medium print:text-gray-500">Confidential Internal Use Only</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white print:text-black">Furniture Enterprise Performance Analytics</h1>
                    <p className="text-sm text-white/40 mt-1 print:text-gray-600">
                        Operational report mapping showroom retail order volume, bespoke workshops pipelines, and financial metrics.
                    </p>
                </div>
                
                {/* INTERACTION ACTION ROW CONTAINER */}
                <div className="flex items-center gap-3 print:hidden shrink-0">
                    <button
                        onClick={triggerPDFPrint}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                        <Printer size={13} />
                        Print PDF Ledger
                    </button>
                    <button
                        onClick={() => exportCSV(data)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4A97A]/10 hover:bg-[#D4A97A]/20 border border-[#D4A97A]/30 text-[#D4A97A] text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                        <Download size={13} />
                        Export Consolidated CSV
                    </button>
                </div>
            </div>

            {/* SECTION 1: FINANCIAL & VOLUMETRIC KEY PERFORMANCE INDICATORS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-5">
                <KpiCard
                    label="Gross Sales Revenue"
                    value={formatPHP(data.totalRevenue)}
                    sub="Aggregated showroom catalog contract values"
                    icon={TrendingUp}
                    accent
                />
                <KpiCard
                    label="Liquid Collections"
                    value={formatPHP(data.totalPaid)}
                    sub="Cleared account deposits & capture receipts"
                    icon={CreditCard}
                />
                <KpiCard
                    label="Showroom Orders"
                    value={String(data.totalOrders)}
                    sub="Completed catalog product invoices closed"
                    icon={ShoppingBag}
                />
                <KpiCard
                    label="Custom Design Inquiries"
                    value={String(data.totalInquiries)}
                    sub="Bespoke blueprint configurations initialized"
                    icon={MessageSquare}
                />
                <KpiCard
                    label="Active Workshop Backlog"
                    value={String(data.pendingOrders)}
                    sub="Sourced orders currently in layout or fabrication"
                    icon={Clock}
                />
            </div>

            {/* SECTION 2: AUDIT & CRITICAL RECONCILIATION EXCEPTIONS LAYER */}
            {data.mismatches.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 break-inside-avoid print:border-red-400 print:bg-transparent">
                    <h2 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-4 tracking-wider uppercase print:text-red-800">
                        <AlertTriangle size={16} />
                        Financial Audit Alerts: Reconciliation Discrepancies ({data.mismatches.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-white/10 text-white/40 pb-3 font-semibold tracking-wider uppercase print:text-gray-500 print:border-gray-300">
                                    <th className="pb-3 pl-1">Channel Origin</th>
                                    <th className="pb-3">Reference Marker</th>
                                    <th className="pb-3">Audit Discrepancy Statement</th>
                                    <th className="pb-3 text-right">Invoiced Expected</th>
                                    <th className="pb-3 text-right pr-1">Captured Settlement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-white/80 print:text-black print:divide-gray-200">
                                {data.mismatches.map((m) => (
                                    <tr key={m.id} className="hover:bg-white/[0.01]">
                                        <td className="py-3 pl-1 font-semibold tracking-wide text-white/50 print:text-gray-600 uppercase text-[11px]">{m.type}</td>
                                        <td className="py-3 font-mono font-bold text-red-300 print:text-red-800">{m.reference}</td>
                                        <td className="py-3 text-white/70 print:text-gray-700">{m.issue}</td>
                                        <td className="py-3 text-right font-mono font-medium">{formatPHP(m.expectedAmount)}</td>
                                        <td className="py-3 text-right font-mono font-bold text-red-400 print:text-red-700 pr-1">{formatPHP(m.paidAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SECTION 3: TREND ANALYSIS & DATA VOLUME DISTRIBUTION CORRELATION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 break-inside-avoid">
                
                {/* Historical Income Chart Overviews */}
                <div className="lg:col-span-2 bg-white/[0.01] border border-white/10 rounded-xl p-6 print:border-gray-300 print:bg-white">
                    <div className="border-b border-white/5 pb-3 mb-2 flex items-center justify-between print:border-gray-200">
                        <h2 className="text-sm font-bold text-white tracking-wider uppercase print:text-black">Dynamic Revenue Run Rate Trend</h2>
                        <span className="text-[11px] text-white/30 font-mono print:text-gray-400">Monthly Performance Cycles</span>
                    </div>
                    {revenueChartData.length > 0 ? (
                        <BarChart data={revenueChartData} />
                    ) : (
                        <p className="text-white/30 text-xs py-12 text-center print:text-gray-400">No chronological milestone logs captured</p>
                    )}
                </div>

                {/* Structured Data Matrix Breakdown Grid */}
                <div className="bg-white/[0.01] border border-white/10 rounded-xl p-6 flex flex-col justify-between gap-6 print:border-gray-300 print:bg-white">
                    <div>
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-3 print:border-gray-200">
                            <Layers size={14} className="text-white/40 print:text-gray-500" />
                            <h2 className="text-sm font-bold text-white tracking-wider uppercase print:text-black">Showroom Orders Volume</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {data.ordersByStatus.length === 0 && <p className="text-white/30 text-xs col-span-2">Matrix data vacant</p>}
                            {[...data.ordersByStatus].sort((a, b) => b.count - a.count).map((s) => (
                                <div key={s.status} className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex items-center justify-between print:bg-gray-50 print:border-gray-200">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${statusColor(s.status)}`}>
                                        {s.status.replace(/_/g, " ")}
                                    </span>
                                    <span className="font-bold text-sm text-white print:text-black font-mono pr-1">{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-3 print:border-gray-200">
                            <Armchair size={14} className="text-white/40 print:text-gray-500" />
                            <h2 className="text-sm font-bold text-white tracking-wider uppercase print:text-black">Custom Project Pipelines</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {data.inquiriesByStatus.length === 0 && <p className="text-white/30 text-xs col-span-2">Matrix data vacant</p>}
                            {[...data.inquiriesByStatus].sort((a, b) => b.count - a.count).map((s) => (
                                <div key={s.status} className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex items-center justify-between print:bg-gray-50 print:border-gray-200">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${statusColor(s.status)}`}>
                                        {s.status.replace(/_/g, " ")}
                                    </span>
                                    <span className="font-bold text-sm text-white print:text-black font-mono pr-1">{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 4: REAL-TIME LEDGER STREAMS & PERFORMANCE SHARE MARKET */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 break-inside-avoid">
                
                {/* Catalog Furniture Movement Shares */}
                <div className="bg-white/[0.01] border border-white/10 rounded-xl p-6 print:border-gray-300 print:bg-white">
                    <div className="border-b border-white/5 pb-3 mb-4 flex items-center gap-2 print:border-gray-200">
                        <Package size={15} className="text-[#D4A97A] print:text-gray-700" />
                        <h2 className="text-sm font-bold text-white tracking-wider uppercase print:text-black">Top Moving Product Lineups</h2>
                    </div>
                    {data.topProducts.length === 0 && <p className="text-white/30 text-xs py-4 print:text-gray-400">Zero structural catalog sales logs recorded</p>}
                    <div className="space-y-3.5">
                        {data.topProducts.map((p, i) => (
                            <div key={p.name} className="flex items-center gap-3 text-xs">
                                <span className="font-mono font-bold text-white/20 w-4 text-right text-xs print:text-gray-400">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold truncate tracking-wide print:text-gray-900">{p.name}</p>
                                    <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider print:text-gray-500">{p.orders} Individual Fabrications</p>
                                </div>
                                <span className="font-mono font-bold text-[#D4A97A] print:text-black shrink-0 text-right">
                                    {formatPHP(p.revenue)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Showroom Direct Operational Logs Feed */}
                <div className="lg:col-span-2 bg-white/[0.01] border border-white/10 rounded-xl p-6 flex flex-col gap-6 print:border-gray-300 print:bg-white">
                    <div>
                        <div className="border-b border-white/5 pb-3 mb-3 print:border-gray-200">
                            <h2 className="text-sm font-bold text-white tracking-wider uppercase print:text-black">Showroom Sales Orders Tracker</h2>
                        </div>
                        <div className="space-y-1">
                            {data.recentOrders.length === 0 && <p className="text-white/30 text-xs py-2">Fulfillment transactional feed empty</p>}
                            {data.recentOrders.map((o) => (
                                <div key={o.id} className="flex items-center justify-between text-xs py-2.5 border-b border-white/5 last:border-0 print:border-gray-100">
                                    <div className="space-y-1.5">
                                        <p className="font-mono text-white/70 font-bold tracking-wide print:text-black">{o.reference}</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-widest ${statusColor(o.status)}`}>
                                                Fulfillment: {o.status.replace(/_/g, " ")}
                                            </span>
                                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-widest ${statusColor(o.payment_status)}`}>
                                                Payment: {o.payment_status.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="font-mono font-bold text-sm text-white print:text-black shrink-0">{formatPHP(o.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Design Engineering Consulting Log Streams */}
                    <div className="border-t border-white/5 pt-4 print:border-gray-200">
                        <div className="border-b border-white/5 pb-3 mb-3 print:border-gray-200">
                            <h2 className="text-sm font-bold text-white tracking-wider uppercase print:text-black">Bespoke Design Project Inflow</h2>
                        </div>
                        <div className="space-y-1">
                            {data.recentInquiries.length === 0 && <p className="text-white/30 text-xs py-2">Bespoke project pipeline registry empty</p>}
                            {data.recentInquiries.map((i) => (
                                <div key={i.id} className="flex items-center justify-between text-xs py-2.5 border-b border-white/5 last:border-0 print:border-gray-100">
                                    <div className="space-y-1.5 min-w-0 flex-1 pr-4">
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-[#D4A97A] font-bold tracking-wide print:text-gray-800">{i.reference}</p>
                                            <p className="text-white/40 text-[11px] font-medium truncate print:text-gray-500">Client: {i.customer_name}</p>
                                        </div>
                                        <p className="text-white/50 text-[11px] truncate italic print:text-gray-600">"{i.last_message}"</p>
                                        <div>
                                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-widest ${statusColor(i.status)}`}>
                                                Design Phase: {i.status.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="font-mono font-bold text-sm text-white print:text-black shrink-0 text-right">{formatPHP(i.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}