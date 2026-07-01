import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalyticsData } from "@/services/analyticsService";
import { getCompletedOrderCount, getCompletedInquiryCount } from "./reportExport";

/* =========================================================
   HELPERS
   ========================================================= */

/** Format a non‑negative integer as PHP currency (no ± signs, safe fallback) */
function formatPHPInt(n: number): string {
    const safe = Math.max(0, Math.round(n ?? 0));
    return "₱" + safe.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatPercent(value: number): string {
    const safe = Math.max(0, Math.min(100, Math.round(value ?? 0)));
    return `${safe}%`;
}

/* =========================================================
   PDF GENERATION
   ========================================================= */

export function triggerReportPDFPrint(data: AnalyticsData) {
    const doc = new jsPDF({ format: "a4", unit: "mm" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // ── Color palette ──
    const C = {
        headerBg:       [45, 55, 72] as [number, number, number],
        headerText:     [255, 255, 255] as [number, number, number],
        bodyText:       [50, 50, 50] as [number, number, number],
        accentGold:     [180, 120, 60] as [number, number, number],
        mutedText:      [100, 100, 100] as [number, number, number],
        lightBg:        [248, 248, 248] as [number, number, number],
        border:         [210, 210, 210] as [number, number, number],
        ordersHeader:   [70, 90, 110] as [number, number, number],
        inquiriesHeader:[135, 95, 75] as [number, number, number],
        productsHeader: [85, 65, 45] as [number, number, number],
        revenueHeader:  [55, 55, 75] as [number, number, number],
        auditHeader:    [175, 35, 35] as [number, number, number],
        auditRow:       [255, 238, 238] as [number, number, number],
    };

    // ── Track pages for header/footer ──
    const pagesWithHeaderFooter = new Set<number>();

    const addPageHeaderAndFooter = (pageNum: number, totalPages: number) => {
        const h = doc.internal.pageSize.getHeight();

        // Top accent line
        doc.setFillColor(C.headerBg[0], C.headerBg[1], C.headerBg[2]);
        doc.rect(margin, 4, contentWidth, 0.5, "F");

        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.setFont("helvetica", "normal");
        doc.text("Furniture Enterprise — Admin Operations Report", margin, 10);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, 10, { align: "right" });

        // Footer
        doc.setFontSize(6.5);
        doc.setTextColor(170, 170, 170);
        doc.setFont("helvetica", "normal");
        doc.text(
            `Generated ${new Date().toLocaleString("en-PH")} — Confidential`,
            margin,
            h - 4,
        );
    };

    const didDrawPage = (tableData: { pageNumber: number }) => {
        const pn = tableData.pageNumber;
        if (!pagesWithHeaderFooter.has(pn)) {
            addPageHeaderAndFooter(pn, 0);
            pagesWithHeaderFooter.add(pn);
        }
    };

    // ── Reusable helpers ──

    function sectionTitle(text: string, y: number): number {
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text(text, margin, y);
        return y + 7;
    }

    function subLabel(text: string, y: number): number {
        doc.setFontSize(8);
        doc.setTextColor(C.mutedText[0], C.mutedText[1], C.mutedText[2]);
        doc.setFont("helvetica", "italic");
        doc.text(text, margin, y);
        return y + 5;
    }

    function renderTable(
        headers: string[],
        rows: (string | number)[][],
        startY: number,
        headColor: [number, number, number],
        colWidths?: number[],
    ): number {
        const colStyles: Record<string, { cellWidth: number; halign?: "right" | "left" }> = {};
        if (colWidths) {
            colWidths.forEach((w, i) => {
                colStyles[String(i)] = {
                    cellWidth: w,
                    halign: i === colWidths.length - 1 ? "right" : "left",
                };
            });
        } else {
            colStyles["0"] = { cellWidth: contentWidth * 0.65 };
            colStyles["1"] = { cellWidth: contentWidth * 0.35, halign: "right" };
        }

        autoTable(doc, {
            startY,
            head: [headers],
            body: rows,
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
            didDrawPage,
            headStyles: {
                fillColor: headColor,
                textColor: 255,
                fontStyle: "bold",
                fontSize: 8,
                cellPadding: 2.5,
            },
            bodyStyles: {
                fontSize: 8,
                textColor: C.bodyText,
                cellPadding: 2,
            },
            alternateRowStyles: {
                fillColor: C.lightBg,
            },
            columnStyles: colStyles,
            styles: {
                lineColor: [230, 230, 230],
                lineWidth: 0.15,
            },
            tableLineColor: [220, 220, 220],
            tableLineWidth: 0.2,
        });
        return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    }

    function checkPageBreak(nextY: number, needed: number = 50): number {
        if (nextY + needed > pageHeight - 16) {
            doc.addPage();
            return 16;
        }
        return nextY;
    }

    /* =========================================================
       BUILD CONTENT
       ========================================================= */
    let y = 20;

    // ── TITLE SECTION ──
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Admin Operations Report", margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(C.mutedText[0], C.mutedText[1], C.mutedText[2]);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated ${new Date().toLocaleString("en-PH")}`, margin, y);
    y += 3;

    // Separator line
    doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ── REVENUE HEADER ──
    doc.setFontSize(26);
    doc.setTextColor(C.accentGold[0], C.accentGold[1], C.accentGold[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Revenue  ${formatPHPInt(data.totalRevenue)}`, margin, y);
    y += 14;

    // ── EXECUTIVE SUMMARY ──
    const completedOrders = getCompletedOrderCount(data.ordersByStatus);
    const completedInquiries = getCompletedInquiryCount(data.inquiriesByStatus);
    const processingOrders = data.totalOrders - completedOrders;
    const processingInquiries = data.totalInquiries - completedInquiries;
    const inquiryConversionPercent = data.totalInquiries > 0
        ? (data.paidInquiries / data.totalInquiries) * 100
        : 0;

    y = sectionTitle("Executive Summary", y);

    const summaryHeaders = ["Metric", "Value"];
    const summaryRows: (string | number)[][] = [
        ["Total Revenue", formatPHPInt(data.totalRevenue)],
        ["Total Orders", data.totalOrders],
        ["  • Completed", completedOrders],
        ["  • Processing", processingOrders],
        ["Total Inquiries", data.totalInquiries],
        ["  • Completed", completedInquiries],
        ["  • Processing", processingInquiries],
        ["Inquiry Conversion Rate", formatPercent(inquiryConversionPercent)],
    ];

    y = renderTable(summaryHeaders, summaryRows, y, C.headerBg);
    y += 10;

    // ── ORDERS REPORT ──
    y = checkPageBreak(y, 80);
    y = sectionTitle("Orders Report", y);

    const orderRows: (string | number)[][] = [
        ["Total Orders", data.totalOrders],
        ["Completed Orders", completedOrders],
        ["Paid Orders", data.paidOrders],
        ["Fully Paid Orders", data.fullyPaidOrders],
        ["Partially Paid Orders", data.partiallyPaidOrders],
        ["Outstanding Value", formatPHPInt(data.ordersOutstandingValue)],
    ];

    y = renderTable(summaryHeaders, orderRows, y, C.ordersHeader);
    y += 10;

    // ── BEST SELLING PRODUCTS ──
    y = checkPageBreak(y, data.topProducts.length > 0 ? 60 : 20);
    y = sectionTitle("Best Selling Products", y);

    if (data.topProducts.length > 0) {
        const prodHeaders = ["#", "Product Name", "Units Sold", "Revenue"];
        const prodRows = data.topProducts.map((p, i) => [
            String(i + 1),
            p.name,
            p.orders,
            formatPHPInt(Math.round(p.revenue)),
        ]);
        const prodWidths = [
            contentWidth * 0.07,
            contentWidth * 0.48,
            contentWidth * 0.18,
            contentWidth * 0.27,
        ];
        y = renderTable(prodHeaders, prodRows, y, C.productsHeader, prodWidths);
    } else {
        doc.setFontSize(9);
        doc.setTextColor(C.mutedText[0], C.mutedText[1], C.mutedText[2]);
        doc.setFont("helvetica", "italic");
        doc.text("No product sales data available yet.", margin, y);
    }
    y += 10;

    // ── INQUIRIES REPORT ──
    y = checkPageBreak(y, 80);
    y = sectionTitle("Inquiries Report", y);

    const inquiryRows: (string | number)[][] = [
        ["Total Inquiries", data.totalInquiries],
        ["Completed Inquiries", completedInquiries],
        ["Paid Accepted Inquiries", data.paidInquiries],
        ["Fully Paid Inquiries", data.fullyPaidInquiries],
        ["Partially Paid Inquiries", data.partiallyPaidInquiries],
        ["Inquiry Quoted Value", formatPHPInt(Math.round(data.inquiryTotalValue))],
        ["Paid Value", formatPHPInt(Math.round(data.inquiryPaidValue))],
        ["Outstanding Value", formatPHPInt(data.inquiriesOutstandingValue)],
    ];

    y = renderTable(summaryHeaders, inquiryRows, y, C.inquiriesHeader);
    y += 10;

    // ── REVENUE OVERVIEW (Bar Chart + Table) ──
    if (data.revenueByMonth.length > 0) {
        y = checkPageBreak(y, 95);
        y = sectionTitle("Revenue Overview", y);
        y = subLabel("Monthly paid business trend from orders and inquiries", y);

        // ── Draw Bar Chart ──
        const chartLeft = margin + 5;
        const chartAreaHeight = 52;
        const chartBottom = y + chartAreaHeight;
        const chartTop = y;
        const chartHeight = chartAreaHeight - 12;
        const chartWidth = contentWidth - 10;

        const values = data.revenueByMonth.map((item) => Math.round(item.revenue));
        const maxVal = Math.max(...values, 1);
        const barCount = values.length;
        const barGap = Math.max(3, Math.min(8, (chartWidth - 20) / (barCount * 3)));
        const barWidth = Math.max(5, Math.min(24, (chartWidth - barGap * (barCount + 1)) / barCount));

        // Y-axis labels
        doc.setFontSize(6);
        doc.setTextColor(140, 140, 140);
        doc.setFont("helvetica", "normal");
        doc.text(formatPHPInt(maxVal), chartLeft - 2, chartTop + 4, { align: "right" });
        doc.text("0", chartLeft - 2, chartBottom - 2, { align: "right" });

        const barColor: [number, number, number] = [180, 120, 60];

        values.forEach((val, i) => {
            const barH = maxVal > 0 ? (val / maxVal) * chartHeight : 0;
            const x = chartLeft + barGap + i * (barWidth + barGap);
            const yBar = chartBottom - 2 - barH;

            // Bar rectangle
            doc.setFillColor(barColor[0], barColor[1], barColor[2]);
            doc.rect(x, yBar, barWidth, barH, "F");

            // Value label above bar (only if bar is tall enough)
            if (barH > 8) {
                doc.setFontSize(6);
                doc.setTextColor(80, 80, 80);
                doc.setFont("helvetica", "bold");
                doc.text(formatPHPInt(val), x + barWidth / 2, yBar - 2, { align: "center" });
            }

            // Month label below bar
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "normal");
            doc.text(data.revenueByMonth[i].month, x + barWidth / 2, chartBottom + 3, { align: "center" });
        });

        // Axis line
        doc.setDrawColor(180, 180, 180);
        doc.line(chartLeft, chartBottom - 2, chartLeft + chartWidth, chartBottom - 2);

        y = chartBottom + 12;

        // ── Revenue Table ──
        const revHeaders = ["Month", "Revenue"];
        const revRows = data.revenueByMonth.map((item) => [
            item.month,
            formatPHPInt(Math.round(item.revenue)),
        ]);

        const totalRev = data.revenueByMonth.reduce((sum, item) => sum + Math.round(item.revenue), 0);
        revRows.push(["TOTAL", formatPHPInt(totalRev)]);

        y = renderTable(revHeaders, revRows, y, C.revenueHeader);
        y += 10;
    }

    // ── AUDIT ALERTS ──
    if (data.mismatches.length > 0) {
        y = checkPageBreak(y, 60);
        y = sectionTitle(`Financial Audit Alerts (${data.mismatches.length} discrepancies)`, y);

        const auditHeaders = ["Origin", "Reference", "Issue", "Expected", "Paid"];
        const auditRows = data.mismatches.slice(0, 10).map((m) => [
            m.type.charAt(0).toUpperCase() + m.type.slice(1),
            m.reference,
            m.issue.length > 50 ? m.issue.substring(0, 50) + "..." : m.issue,
            formatPHPInt(m.expectedAmount),
            formatPHPInt(m.paidAmount),
        ]);

        const auditWidths = [
            contentWidth * 0.12,
            contentWidth * 0.15,
            contentWidth * 0.38,
            contentWidth * 0.17,
            contentWidth * 0.18,
        ];

        autoTable(doc, {
            startY: y,
            head: [auditHeaders],
            body: auditRows,
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
            didDrawPage,
            headStyles: {
                fillColor: C.auditHeader,
                textColor: 255,
                fontStyle: "bold",
                fontSize: 7,
                cellPadding: 2.5,
            },
            bodyStyles: {
                fontSize: 7,
                textColor: C.bodyText,
                cellPadding: 2,
            },
            alternateRowStyles: {
                fillColor: C.auditRow,
            },
            columnStyles: {
                "0": { cellWidth: auditWidths[0] },
                "1": { cellWidth: auditWidths[1] },
                "2": { cellWidth: auditWidths[2] },
                "3": { cellWidth: auditWidths[3], halign: "right" },
                "4": { cellWidth: auditWidths[4], halign: "right" },
            },
            styles: {
                lineColor: [230, 230, 230],
                lineWidth: 0.15,
            },
            tableLineColor: [220, 220, 220],
            tableLineWidth: 0.2,
        });
    }

    // ── Finalize: update total pages and redraw headers/footers ──
    const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();

    pagesWithHeaderFooter.clear();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addPageHeaderAndFooter(i, totalPages);
    }

    doc.save(`Admin_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}