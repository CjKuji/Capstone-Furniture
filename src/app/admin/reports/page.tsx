"use client";

import { 
    TrendingUp, 
    ShoppingBag, 
    Clock, 
    Package, 
    Download, 
    Printer, 
    MessageSquare, 
    AlertTriangle,
    type LucideIcon 
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/services/analyticsService";
import type { AnalyticsData } from "@/services/analyticsService";
import {
    exportAnalyticsCSV,
    getCompletedInquiryCount,
    getCompletedOrderCount,
    triggerReportPDFPrint,
} from "@/utils/reportExport";

/* =========================================================
   HELPERS
   ========================================================= */

function formatPHP(n: number) {
    return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatPercent(value: number) {
    return `${Math.round(value)}%`;
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
        <div className={`rounded-2xl border p-4 sm:p-6 flex flex-col gap-4 transition-all break-inside-avoid print:border-gray-300 print:shadow-none ${
            accent 
                ? "bg-[#D4A97A]/12 border-[#D4A97A]/30 print:bg-gray-50 print:border-gray-400" 
                : "bg-[#12100d]/80 border-white/10 print:bg-white"
        }`}>
            <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/55 print:text-gray-500 uppercase tracking-[0.28em] font-semibold">{label}</p>
                <div className={`p-2 rounded-xl ${accent ? "bg-[#D4A97A]/15 text-[#D4A97A]" : "bg-white/5 text-white/55"} print:bg-gray-100 print:text-gray-700`}>
                    <Icon size={16} />
                </div>
            </div>
            <div>
                <p className={`text-2xl font-bold tracking-tight ${accent ? "text-[#D4A97A] print:text-black" : "text-white print:text-black"}`}>{value}</p>
                {sub && <p className="text-sm text-white/55 print:text-gray-500 mt-1.5 font-medium leading-relaxed">{sub}</p>}
            </div>
        </div>
    );
}

function getBarHeightClass(value: number, max: number) {
    const ratio = max === 0 ? 0 : Math.max(0, Math.min(1, value / max));
    if (ratio >= 0.95) return "h-44";
    if (ratio >= 0.75) return "h-36";
    if (ratio >= 0.50) return "h-28";
    if (ratio >= 0.25) return "h-20";
    return "h-10";
}

function EmptyState({
    title,
    description,
    hint,
}: {
    title: string;
    description: string;
    hint?: string;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#0f0d0b] p-4 sm:p-5 print:border-gray-300 print:bg-gray-50">
            <p className="text-sm font-semibold text-white/90 print:text-black">{title}</p>
            <p className="mt-1 text-sm text-white/60 print:text-gray-600 leading-relaxed">{description}</p>
            {hint && <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/35 print:text-gray-500">{hint}</p>}
        </div>
    );
}

function BarChart({ data }: { data: Array<{ label: string; value: number } | { month: string; revenue: number }> }) {
    const normalized = data.map((d) => ({
        label: "label" in d ? d.label : d.month,
        value: "value" in d ? d.value : d.revenue,
    }));
    const max = Math.max(...normalized.map((d) => d.value), 1);
    return (
        <div className="flex items-end gap-4 h-44 w-full pt-6 px-2 print:h-52">
            {normalized.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-2 flex-1 min-w-0 group">
                    <div className="text-[10px] text-white/0 group-hover:text-white/80 font-mono font-medium transition-all duration-200 transform -translate-y-1 print:text-black/70 print:block">
                        {d.value > 0 ? formatPHP(d.value) : ""}
                    </div>
                    <div
                        className={`${getBarHeightClass(d.value, max)} w-full rounded-t-sm bg-[#D4A97A]/80 hover:bg-[#D4A97A] transition-all duration-300 relative print:bg-gray-400 print:border print:border-gray-500`}
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
        refetchInterval: 300000,
        refetchOnWindowFocus: false,
    });
    const [selectedMonth, setSelectedMonth] = useState("");

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[#0F0A06] p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
                <div className="h-14 w-full sm:w-1/3 rounded-xl bg-white/5 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 h-64 rounded-xl bg-white/5 animate-pulse" />
                    <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
                </div>
            </main>
        );
    }

    if (error || !data) {
        return (
            <main className="min-h-screen bg-[#0F0A06] p-8 flex items-center justify-center">
                <div className="text-center p-8 border border-white/5 rounded-2xl max-w-md bg-white/1">
                    <AlertTriangle className="text-red-400 mx-auto mb-3" size={28} />
                    <p className="text-white font-medium text-sm">
                        {error?.message ?? "Enterprise operational intelligence sync connection offline"}
                    </p>
                </div>
            </main>
        );
    }

    const completedOrders = getCompletedOrderCount(data.ordersByStatus);
    const completedInquiries = getCompletedInquiryCount(data.inquiriesByStatus);
    const processingOrders = data.totalOrders - completedOrders;
    const processingInquiries = data.totalInquiries - completedInquiries;
    const backlogShare = data.totalOrders > 0 ? (data.pendingOrders / data.totalOrders) * 100 : 0;
    const inquiryConversionPercent = data.totalInquiries > 0 ? (data.paidInquiries / data.totalInquiries) * 100 : 0;
    const selectedMonthLabel = selectedMonth || data.revenueByMonth[data.revenueByMonth.length - 1]?.month || "No month";
    const selectedMonthRevenue = data.revenueByMonth.find((item) => item.month === selectedMonth)?.revenue ?? data.revenueByMonth[data.revenueByMonth.length - 1]?.revenue ?? 0;

    return (
        <main className="min-h-screen bg-[#0d0a08] text-white p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans antialiased print:bg-white print:text-black print:p-0 print:space-y-6 print:w-full print:max-w-none print:m-0 print:overflow-visible print-shell screen-only">
            
            {/* INLINE CSS OVERRIDES FOR GLOBAL LAYOUT STRIPPING & CHATBOT EXTRACTION */}
            <style jsx global>{`
                @media print {
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

                    @page {
                        size: A4 portrait;
                        margin: 12mm;
                    }

                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

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
                    .print-card { break-inside: avoid !important; page-break-inside: avoid !important; }
                    .print-section { break-inside: avoid !important; page-break-inside: avoid !important; }
                    .print-table thead { display: table-header-group !important; }
                    .print-table tr { break-inside: avoid !important; page-break-inside: avoid !important; }
                    .print-table th, .print-table td { page-break-inside: avoid !important; }
                    .print-header { display: none; }
                    .print-hidden { display: none !important; }
                    .print-only { display: none; }
                    .print-shell { width: 100% !important; max-width: 100% !important; }
                    .print-compact { font-size: 11px !important; line-height: 1.4 !important; }
                    .print-report-card { background: #ffffff !important; border: 1px solid #d1d5db !important; border-radius: 8px !important; box-shadow: none !important; }
                    .print-report-table th, .print-report-table td { padding: 6px 0 !important; }
                    .print-report-table tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                    .print-report-section { break-inside: avoid !important; page-break-inside: avoid !important; margin-bottom: 12px !important; }
                    .print-report-summary { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px !important; }
                }

                @media print {
                    .print-only { display: block !important; }
                    .print\\:rounded-none { border-radius: 0 !important; }
                    .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
                    .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .screen-only { display: none !important; }
                    .print-only-report { display: block !important; }
                }
            `}</style>

            {/* CORPORATE REPORT HEADER */}
            <div className="rounded-[28px] border border-white/10 bg-[#12100d]/80 px-5 py-5 sm:px-6 sm:py-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4 print:border-gray-300 print:pb-8 print:bg-white print:rounded-none print:px-0 print-section">
                <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#D4A97A] px-2.5 py-1 bg-[#D4A97A]/10 rounded-full print:border print:border-gray-400 print:text-black">Reports</span>
                        <span className="text-[10px] text-white/40 font-medium print:text-gray-500">Internal use only</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white print:text-black">Admin Reports</h1>
                    <p className="text-sm text-white/60 mt-1.5 print:text-gray-600 leading-relaxed">
                        A straightforward view of paid business performance, backlog health, and inquiry conversion.
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold text-[#D4A97A] mt-3 print:text-black">
                        {formatPHP(data.totalRevenue)}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mt-1 print:text-gray-500">Total Revenue</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 print:hidden shrink-0">
                    <button
                        onClick={() => triggerReportPDFPrint(data)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                        <Printer size={13} />
                        Export PDF
                    </button>
                    <button
                        onClick={() => exportAnalyticsCSV(data)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4A97A]/10 hover:bg-[#D4A97A]/20 border border-[#D4A97A]/30 text-[#D4A97A] text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                        <Download size={13} />
                        Export CSV
                    </button>
                </div>
            </div>

            {data.mismatches.length > 0 && (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 print:border-gray-300 print:bg-gray-50 print:text-gray-700">
                    Some metrics are being calculated from available records while one or more analytics tables are temporarily unavailable.
                </div>
            )}

            {/* EXECUTIVE SUMMARY */}
            <div>
                <h2 className="text-sm font-bold text-white/70 tracking-[0.24em] uppercase mb-4 print:text-gray-700">Executive Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:grid-cols-4 print-section">
                    <KpiCard
                        label="Total Revenue"
                        value={formatPHP(data.totalRevenue)}
                        sub="Paid business from orders and inquiries"
                        icon={TrendingUp}
                        accent
                    />
                    <KpiCard
                        label="Total Orders"
                        value={String(data.totalOrders)}
                        sub={`${completedOrders} completed · ${processingOrders} processing`}
                        icon={ShoppingBag}
                    />
                    <KpiCard
                        label="Total Inquiries"
                        value={String(data.totalInquiries)}
                        sub={`${completedInquiries} completed · ${processingInquiries} processing`}
                        icon={MessageSquare}
                    />
                    <KpiCard
                        label="Inquiry Conversion"
                        value={formatPercent(inquiryConversionPercent)}
                        sub={`${data.paidInquiries} of ${data.totalInquiries} inquiries paid`}
                        icon={TrendingUp}
                    />
                </div>
            </div>

            {/* ORDERS SECTION */}
            <div>
                <h2 className="text-sm font-bold text-white/70 tracking-[0.24em] uppercase mb-4 print:text-gray-700">Orders Report</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:grid-cols-4 print-section">
                    <KpiCard
                        label="Completed"
                        value={String(completedOrders)}
                        sub={`${Math.round((data.totalOrders > 0 ? completedOrders / data.totalOrders : 0) * 100)}% of total orders`}
                        icon={ShoppingBag}
                    />
                    <KpiCard
                        label="Processing"
                        value={String(processingOrders)}
                        sub={`${Math.round(backlogShare)}% of orders still in progress`}
                        icon={Clock}
                    />
                    <KpiCard
                        label="Fully Paid"
                        value={String(data.fullyPaidOrders)}
                        sub="Orders with no remaining balance"
                        icon={Package}
                    />
                    <KpiCard
                        label="Partially Paid"
                        value={String(data.partiallyPaidOrders)}
                        sub="Orders with outstanding balance"
                        icon={Clock}
                    />
                </div>

                {/* Best Selling Products */}
                <div className="mt-4 bg-[#12100d]/80 border border-white/10 rounded-3xl p-6 print:border-gray-300 print:bg-white">
                    <div className="border-b border-white/10 pb-3 mb-4 flex items-center gap-2 print:border-gray-200">
                        <Package size={15} className="text-[#D4A97A] print:text-gray-700" />
                        <h2 className="text-sm font-bold text-white tracking-[0.24em] uppercase print:text-black">Best Sellers</h2>
                    </div>
                    <p className="text-sm text-white/60 mb-4 print:text-gray-600 leading-relaxed">Top products from completed orders that were paid.</p>
                    {data.topProducts.length === 0 ? (
                        <EmptyState
                            title="No best sellers yet"
                            description="Products will appear here once paid completed orders are recorded."
                            hint="This section is based on completed paid sales"
                        />
                    ) : (
                        <div className="space-y-3.5">
                            {data.topProducts.map((p, i) => (
                                <div key={p.name} className="flex items-center gap-3 text-xs">
                                    <span className="font-mono font-bold text-white/20 w-4 text-right text-xs print:text-gray-400">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold truncate tracking-wide print:text-gray-900">{p.name}</p>
                                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider print:text-gray-500">{p.orders} sold</p>
                                    </div>
                                    <span className="font-mono font-bold text-[#D4A97A] print:text-black shrink-0 text-right">
                                        {formatPHP(p.revenue)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* INQUIRIES SECTION */}
            <div>
                <h2 className="text-sm font-bold text-white/70 tracking-[0.24em] uppercase mb-4 print:text-gray-700">Inquiries Report</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:grid-cols-4 print-section">
                    <KpiCard
                        label="Completed"
                        value={String(completedInquiries)}
                        sub={`${Math.round((data.totalInquiries > 0 ? completedInquiries / data.totalInquiries : 0) * 100)}% of total inquiries`}
                        icon={MessageSquare}
                    />
                    <KpiCard
                        label="Paid Inquiries"
                        value={String(data.paidInquiries)}
                        sub={`Count of inquiries with payments (not revenue)`}
                        icon={TrendingUp}
                    />
                    <KpiCard
                        label="Quoted Value"
                        value={formatPHP(Math.round(data.inquiryTotalValue))}
                        sub="Total price of inquiries with accepted charges"
                        icon={TrendingUp}
                        accent
                    />
                    <KpiCard
                        label="Paid Value"
                        value={formatPHP(Math.round(data.inquiryPaidValue))}
                        sub="Payments received against quoted inquiries"
                        icon={TrendingUp}
                    />
                </div>
            </div>

            {/* REVENUE OVERVIEW + PAID ACTIVITY */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6 print:grid-cols-1 print-section">
                <div className="bg-[#12100d]/80 border border-white/10 rounded-3xl p-6 print:border-gray-300 print:bg-white">
                    <div className="border-b border-white/10 pb-3 mb-4 print:border-gray-200">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-white tracking-[0.24em] uppercase print:text-black">Revenue Overview</h2>
                                <p className="text-sm text-white/60 mt-1.5 print:text-gray-600 leading-relaxed">Monthly paid business trend from orders and inquiries. Use this to see whether revenue is growing.</p>
                            </div>
                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/50 print:text-gray-600">
                                <span>Month</span>
                                <select
                                    value={selectedMonth}
                                    onChange={(event) => setSelectedMonth(event.target.value)}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none print:border-gray-300 print:bg-white print:text-black"
                                >
                                    {data.revenueByMonth.map((item) => (
                                        <option key={item.month} value={item.month} className="text-black">
                                            {item.month}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                    {data.revenueByMonth.length === 0 || data.totalRevenue === 0 ? (
                        <EmptyState
                            title="No revenue yet"
                            description="Revenue will appear here once paid orders or inquiries are recorded."
                            hint="This view updates from payment records"
                        />
                    ) : (
                        <>
                            <BarChart data={data.revenueByMonth} />
                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Selected month</p>
                                    <p className="mt-2 text-xl font-bold text-white print:text-black">{selectedMonthLabel}</p>
                                </div>
                                <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Month revenue</p>
                                    <p className="mt-2 text-xl font-bold text-white print:text-black">{formatPHP(Math.round(selectedMonthRevenue))}</p>
                                </div>
                                <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Total Revenue</p>
                                    <p className="mt-2 text-xl font-bold text-[#D4A97A] print:text-black">{formatPHP(data.totalRevenue)}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="bg-[#12100d]/80 border border-white/10 rounded-3xl p-6 print:border-gray-300 print:bg-white">
                    <div className="border-b border-white/10 pb-3 mb-4 print:border-gray-200">
                        <h2 className="text-sm font-bold text-white tracking-[0.24em] uppercase print:text-black">Paid Activity</h2>
                        <p className="text-sm text-white/60 mt-1.5 print:text-gray-600 leading-relaxed">A short view of confirmed paid business activity from orders and inquiries.</p>
                    </div>
                    {data.totalRevenue === 0 && data.paidOrders === 0 ? (
                        <EmptyState
                            title="No paid activity yet"
                            description="Once paid business is recorded, this section will show the revenue and confirmed activity."
                            hint="This section is based on payment records"
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Paid revenue</p>
                                <p className="mt-2 text-xl font-bold text-white print:text-black">{formatPHP(data.totalRevenue)}</p>
                            </div>
                            <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Paid orders</p>
                                <p className="mt-2 text-xl font-bold text-white print:text-black">{data.paidOrders}</p>
                            </div>
                            <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Paid inquiries</p>
                                <p className="mt-2 text-xl font-bold text-white print:text-black">{data.paidInquiries}</p>
                            </div>
                            <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Inquiry conversion</p>
                                <p className="mt-2 text-xl font-bold text-white print:text-black">{formatPercent(inquiryConversionPercent)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AUDIT SECTION */}
            {data.mismatches.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 break-inside-avoid print:border-red-400 print:bg-transparent print-section">
                    <h2 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-4 tracking-wider uppercase print:text-red-800">
                        <AlertTriangle size={16} />
                        Financial Audit Alerts: Reconciliation Discrepancies ({data.mismatches.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs print-table">
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
                                    <tr key={m.id} className="hover:bg-white/1">
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

        </main>
    );
}