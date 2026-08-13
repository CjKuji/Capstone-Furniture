import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalyticsData } from "@/services/analyticsService";
import { getCompletedOrderCount, getCompletedInquiryCount } from "./reportExport";

/* =========================================================
   HELPERS
   ========================================================= */

/** Format currency as plain single-line PHP value without sign stacking. */
function formatPHPInt(n: number): string {
    const safe = Math.max(0, Math.round(n ?? 0));
    return "₱" + safe.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatPercent(value: number): string {
    const safe = Math.max(0, Math.min(100, Math.round(value ?? 0)));
    return `${safe}%`;
}

function truncateText(text: string, maxLength = 26): string {
    const safe = String(text ?? "");
    return safe.length > maxLength ? `${safe.slice(0, maxLength - 1).trimEnd()}…` : safe;
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
        headerBg:       [30, 40, 55] as [number, number, number],
        headerText:     [255, 255, 255] as [number, number, number],
        bodyText:       [40, 40, 40] as [number, number, number],
        accentGold:     [212, 169, 122] as [number, number, number],
        mutedText:      [110, 110, 110] as [number, number, number],
        lightBg:        [250, 250, 250] as [number, number, number],
        border:         [220, 220, 220] as [number, number, number],
        ordersHeader:   [55, 85, 130] as [number, number, number],
        inquiriesHeader:[150, 100, 70] as [number, number, number],
        productsHeader: [100, 75, 45] as [number, number, number],
        revenueHeader:  [70, 70, 90] as [number, number, number],
        auditHeader:    [190, 50, 50] as [number, number, number],
        auditRow:       [255, 245, 245] as [number, number, number],
        kpiBox:         [245, 240, 235] as [number, number, number],
        kpiBorder:      [212, 169, 122] as [number, number, number],
        success:        [76, 175, 80] as [number, number, number],
    };

    // ── Track pages for header/footer ──
    const pagesWithHeaderFooter = new Set<number>();

    const addPageHeaderAndFooter = (pageNum: number, totalPages: number) => {
        const h = doc.internal.pageSize.getHeight();

        // Top accent line
        doc.setFillColor(C.accentGold[0], C.accentGold[1], C.accentGold[2]);
        doc.rect(margin, 3.5, contentWidth, 0.8, "F");

        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "bold");
        doc.text("Furniture Enterprise — Admin Operations Report", margin, 9.5);
        
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, 9.5, { align: "right" });

        // Footer separator line
        doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, h - 7, pageWidth - margin, h - 7);

        // Footer text
        doc.setFontSize(6);
        doc.setTextColor(160, 160, 160);
        doc.setFont("helvetica", "normal");
        doc.text(
            `Generated ${new Date().toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })} — Confidential`,
            margin,
            h - 3.5,
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
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text(text, margin, y);
        
        // Underline for section titles
        doc.setDrawColor(C.accentGold[0], C.accentGold[1], C.accentGold[2]);
        doc.setLineWidth(0.7);
        doc.line(margin, y + 1.5, margin + 50, y + 1.5);
        
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
            theme: "grid",
            headStyles: {
                fillColor: headColor,
                textColor: 255,
                fontStyle: "bold",
                fontSize: 7,
                cellPadding: 2,
            },
            bodyStyles: {
                fontSize: 7,
                textColor: C.bodyText,
                cellPadding: 1.5,
                overflow: "linebreak",
                valign: "middle",
            },
            alternateRowStyles: {
                fillColor: C.lightBg,
            },
            columnStyles: {
                ...colStyles,
                "0": { ...colStyles["0"], overflow: "linebreak" },
                "1": { ...colStyles["1"], overflow: "linebreak" },
                "2": { ...colStyles["2"], overflow: "linebreak" },
                "3": { ...colStyles["3"], overflow: "linebreak" },
                "4": { ...colStyles["4"], overflow: "linebreak" },
            },
            styles: {
                lineColor: [230, 230, 230],
                lineWidth: 0.15,
                overflow: "linebreak",
                cellPadding: 2,
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
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Admin Operations Report", margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setTextColor(C.mutedText[0], C.mutedText[1], C.mutedText[2]);
    doc.setFont("helvetica", "normal");
    const generatedDate = new Date().toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    doc.text(`Generated: ${generatedDate}`, margin, y);
    y += 4;

    doc.setDrawColor(C.accentGold[0], C.accentGold[1], C.accentGold[2]);
    doc.setLineWidth(1.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const completedOrders = getCompletedOrderCount(data.ordersByStatus);
    const completedInquiries = getCompletedInquiryCount(data.inquiriesByStatus);
    const processingOrders = data.totalOrders - completedOrders;
    const processingInquiries = data.totalInquiries - completedInquiries;
    const inquiryConversionPercent = data.totalInquiries > 0
        ? (data.paidInquiries / data.totalInquiries) * 100
        : 0;

    doc.setFontSize(28);
    doc.setTextColor(C.accentGold[0], C.accentGold[1], C.accentGold[2]);
    doc.setFont("helvetica", "bold");
    doc.text(formatPHPInt(data.totalRevenue), margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setTextColor(C.mutedText[0], C.mutedText[1], C.mutedText[2]);
    doc.setFont("helvetica", "normal");
    doc.text("Total Revenue", margin, y);
    y += 12;

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
    y += 12;

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
    y += 12;

    // ── BEST SELLING PRODUCTS ──
    y = checkPageBreak(y, data.topProducts.length > 0 ? 60 : 20);
    y = sectionTitle("Best Selling Products", y);

    if (data.topProducts.length > 0) {
        const prodHeaders = ["#", "Product Name", "Units Sold", "Revenue"];
        const prodRows = data.topProducts.map((p, i) => [
            String(i + 1),
            truncateText(p.name, 24),
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
        y += 8;
    }
    y += 12;

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
    y += 12;

    // ── REVENUE OVERVIEW (Bar Chart + Table) ──
    if (data.revenueByMonth.length > 0) {
        y = checkPageBreak(y, 95);
        y = sectionTitle("Revenue Overview", y);
        y = subLabel("Monthly paid business trend from orders and inquiries", y);

        // ── Draw Bar Chart ──
        const chartLeft = margin + 5;
        const chartAreaHeight = 58;  // Extra height for month labels
        const chartBottom = y + chartAreaHeight;
        const chartTop = y;
        const chartHeight = chartAreaHeight - 18;  // More space for labels below
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
        const maxLabel = maxVal >= 1000000 ? `₱${(maxVal / 1000000).toFixed(1)}M` : formatPHPInt(maxVal);
        doc.text(maxLabel, chartLeft - 3, chartTop + 4, { align: "right" });
        
        const midVal = maxVal / 2;
        const midLabel = midVal >= 1000000 ? `₱${(midVal / 1000000).toFixed(1)}M` : formatPHPInt(Math.round(midVal));
        doc.text(midLabel, chartLeft - 3, chartTop + chartHeight / 2 + 2, { align: "right" });
        
        doc.text("₱0", chartLeft - 3, chartBottom - 2, { align: "right" });

        const barColor: [number, number, number] = C.accentGold;
        
        // Determine label skip interval: show every Nth month to avoid crowding
        let labelSkip = 1;
        if (barCount > 18) labelSkip = 3;  // Show every 3rd month
        else if (barCount > 12) labelSkip = 2; // Show every 2nd month

        values.forEach((val, i) => {
            const barH = maxVal > 0 ? (val / maxVal) * chartHeight : 0;
            const x = chartLeft + barGap + i * (barWidth + barGap);
            const yBar = chartBottom - 2 - barH;

            // Bar rectangle with gradient effect (using darker shade on edges)
            doc.setFillColor(barColor[0], barColor[1], barColor[2]);
            doc.rect(x, yBar, barWidth, barH, "F");

            // Value label above bar (only if bar is tall enough)
            if (barH > 12) {
                doc.setFontSize(5);
                doc.setTextColor(80, 80, 80);
                doc.setFont("helvetica", "bold");
                const valueStr = formatPHPInt(val);
                const displayVal = valueStr.length > 10 ? valueStr.substring(0, 8) + "k" : valueStr;
                doc.text(displayVal, x + barWidth / 2, yBar - 2.5, { align: "center" });
            }

            // Month label below bar (only show every Nth label)
            if (i % labelSkip === 0) {
                doc.setFontSize(5);
                doc.setTextColor(100, 100, 100);
                doc.setFont("helvetica", "normal");
                doc.text(data.revenueByMonth[i].month, x + barWidth / 2, chartBottom + 3.5, { align: "center" });
            }
        });

        // Y-axis line
        doc.setDrawColor(140, 140, 140);
        doc.setLineWidth(0.4);
        doc.line(chartLeft - 1, chartTop, chartLeft - 1, chartBottom - 2);

        // X-axis line
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.5);
        doc.line(chartLeft, chartBottom - 2, chartLeft + chartWidth, chartBottom - 2);

        y = chartBottom + 16;  // More space for month labels

        // ── Revenue Table ──
        const revHeaders = ["Month", "Revenue"];
        const revRows = data.revenueByMonth.map((item) => [
            truncateText(item.month, 8),
            formatPHPInt(Math.round(item.revenue)),
        ]);

        const totalRev = data.revenueByMonth.reduce((sum, item) => sum + Math.round(item.revenue), 0);
        revRows.push(["TOTAL", formatPHPInt(totalRev)]);

        y = renderTable(revHeaders, revRows, y, C.revenueHeader);
        y += 12;
    }

    // ── AUDIT ALERTS ──
    if (data.mismatches.length > 0) {
        y = checkPageBreak(y, 60);
        y = sectionTitle(`Financial Audit Alerts (${data.mismatches.length} discrepancies)`, y);

        const auditHeaders = ["Origin", "Reference", "Issue", "Expected", "Paid"];
        const auditRows = data.mismatches.slice(0, 10).map((m) => [
            m.type.charAt(0).toUpperCase() + m.type.slice(1),
            truncateText(m.reference, 12),
            truncateText(m.issue, 26),
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
                fontSize: 6,
                cellPadding: 2,
            },
            bodyStyles: {
                fontSize: 6,
                textColor: C.bodyText,
                cellPadding: 1.5,
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