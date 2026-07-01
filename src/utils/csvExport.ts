import type { AnalyticsData } from "@/services/analyticsService";
import { getCompletedOrderCount, getCompletedInquiryCount } from "./reportExport";

/**
 * Downloads a CSV file from a 2D array of data
 */
function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;", endings: "native" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Escape a CSV value (wrap in quotes if contains commas, quotes, or newlines)
 */
function esc(value: string | number): string {
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Converts a 2D row array to CSV string
 */
function rowsToCSV(rows: string[][]): string {
    return rows.map((row) => row.map(esc).join(",")).join("\n");
}

/* =========================================================
   CSV EXPORT
   ========================================================= */

export function exportAnalyticsCSV(data: AnalyticsData) {
    const completedOrders = getCompletedOrderCount(data.ordersByStatus);
    const completedInquiries = getCompletedInquiryCount(data.inquiriesByStatus);
    const backlogShare = data.totalOrders > 0 ? (data.pendingOrders / data.totalOrders) * 100 : 0;
    const inquiryConversionPercent = data.totalInquiries > 0 ? (data.paidInquiries / data.totalInquiries) * 100 : 0;
    const dateStr = new Date().toISOString().split("T")[0];
    const sections: string[] = [];

    // Report header
    sections.push(`Admin Operations Report,${dateStr}`);
    sections.push(`Total Revenue,₱${data.totalRevenue.toLocaleString("en-PH")}`);
    sections.push("");

    const processingOrders = data.totalOrders - completedOrders;
    const processingInquiries = data.totalInquiries - completedInquiries;

    // ── SECTION 1: Executive Summary ──
    sections.push("EXECUTIVE SUMMARY");
    sections.push(rowsToCSV([
        ["Metric", "Value"],
        ["Total Revenue", `₱${data.totalRevenue.toLocaleString("en-PH")}`],
        ["Orders Revenue", `₱${(data.orderRevenue ?? 0).toLocaleString("en-PH")}`],
        ["  % of Total", `${data.totalRevenue > 0 ? Math.round((data.orderRevenue / data.totalRevenue) * 100) : 0}%`],
        ["Inquiries Revenue", `₱${(data.inquiryRevenue ?? 0).toLocaleString("en-PH")}`],
        ["  % of Total", `${data.totalRevenue > 0 ? Math.round((data.inquiryRevenue / data.totalRevenue) * 100) : 0}%`],
        ["Total Orders", String(data.totalOrders)],
        ["  Completed", String(completedOrders)],
        ["  Processing", String(processingOrders)],
        ["Total Inquiries", String(data.totalInquiries)],
        ["  Completed", String(completedInquiries)],
        ["  Processing", String(processingInquiries)],
        ["Inquiry Conversion Rate", `${Math.round(inquiryConversionPercent)}%`],
    ]));
    sections.push("");

    // ── SECTION 2: Orders Report ──
    sections.push("ORDERS REPORT");
    sections.push(rowsToCSV([
        ["Metric", "Value"],
        ["Total Orders", String(data.totalOrders)],
        ["Completed Orders", String(completedOrders)],
        ["Paid Orders", String(data.paidOrders)],
        ["Fully Paid Orders", String(data.fullyPaidOrders)],
        ["Partially Paid Orders", String(data.partiallyPaidOrders)],
        ["Outstanding Value", `₱${data.ordersOutstandingValue.toLocaleString("en-PH")}`],
    ]));
    sections.push("");

    // Best Selling Products
    if (data.topProducts.length > 0) {
        sections.push("BEST SELLING PRODUCTS");
        sections.push(rowsToCSV([
            ["Rank", "Product Name", "Units Sold", "Revenue"],
            ...data.topProducts.map((p, i) => [
                String(i + 1),
                p.name,
                String(p.orders),
                `₱${Math.round(p.revenue).toLocaleString("en-PH")}`,
            ]),
        ]));
        sections.push("");
    }

    // ── SECTION 3: Inquiries Report ──
    sections.push("INQUIRIES REPORT");
    const inquiryRows: string[][] = [
        ["Metric", "Value"],
        ["Total Inquiries", String(data.totalInquiries)],
        ["Completed Inquiries", String(completedInquiries)],
        ["Paid Accepted Inquiries", String(data.paidInquiries)],
        ["Fully Paid Inquiries", String(data.fullyPaidInquiries)],
        ["Partially Paid Inquiries", String(data.partiallyPaidInquiries)],
        ["Inquiry Quoted Value", `₱${Math.round(data.inquiryTotalValue).toLocaleString("en-PH")}`],
        ["Paid Value", `₱${Math.round(data.inquiryPaidValue).toLocaleString("en-PH")}`],
        ["Outstanding Value", `₱${data.inquiriesOutstandingValue.toLocaleString("en-PH")}`],
    ];
    sections.push(rowsToCSV(inquiryRows));
    sections.push("");

    // ── SECTION 4: Revenue Overview ──
    if (data.revenueByMonth.length > 0) {
        sections.push("REVENUE OVERVIEW");
        const revRows: string[][] = [["Month", "Revenue"]];
        let totalRev = 0;
        data.revenueByMonth.forEach((item) => {
            const rounded = Math.round(item.revenue);
            revRows.push([item.month, `₱${rounded.toLocaleString("en-PH")}`]);
            totalRev += rounded;
        });
        revRows.push(["TOTAL", `₱${totalRev.toLocaleString("en-PH")}`]);
        sections.push(rowsToCSV(revRows));
        sections.push("");
    }

    // ── SECTION 5: Audit Alerts ──
    if (data.mismatches.length > 0) {
        sections.push("FINANCIAL AUDIT ALERTS");
        sections.push(rowsToCSV([
            ["Origin", "Reference", "Issue", "Expected Amount", "Paid Amount"],
            ...data.mismatches.slice(0, 10).map((m) => [
                m.type.charAt(0).toUpperCase() + m.type.slice(1),
                m.reference,
                m.issue,
                `₱${m.expectedAmount.toLocaleString("en-PH")}`,
                `₱${m.paidAmount.toLocaleString("en-PH")}`,
            ]),
        ]));
        sections.push("");
    }

    const csvContent = sections.join("\n");
    downloadCSV(csvContent, `Admin_Report_${dateStr}.csv`);
}