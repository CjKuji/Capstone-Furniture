import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalyticsData } from "@/services/analyticsService";
import { getCompletedOrderCount, getCompletedInquiryCount } from "./reportExport";

/* =========================================================
   HELPERS
   ========================================================= */

function formatPHPInt(n: number) {
    return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatPercent(value: number) {
    return `${Math.round(value)}%`;
}

/* =========================================================
   PDF GENERATION
   ========================================================= */

export function triggerReportPDFPrint(data: AnalyticsData) {
    const doc = new jsPDF({ format: "a4", unit: "mm" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // ── Helper: header + footer on each page ──
    const addPageHeaderAndFooter = (pageNum: number, totalPages: number) => {
        const height = doc.internal.pageSize.getHeight();

        // Header
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.setFont("helvetica", "normal");
        doc.text("Furniture Enterprise — Admin Operations Report", margin, 6);
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, 6, { align: "right" });
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, 8, pageWidth - margin, 8);

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text(
            `Generated ${new Date().toLocaleString("en-PH")} — Confidential`,
            margin,
            height - 6
        );
    };

    // Track pages that have had header/footer added
    const pagesWithHeaderFooter = new Set<number>();
    const didDrawPage = (data: { pageNumber: number }) => {
        const pageNum = data.pageNumber;
        if (!pagesWithHeaderFooter.has(pageNum)) {
            addPageHeaderAndFooter(pageNum, 0); // Will update totalPages later
            pagesWithHeaderFooter.add(pageNum);
        }
    };

    let y = 16;

    // ── TITLE SECTION ──
    doc.setFontSize(18);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Admin Operations Report", margin, y);
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated ${new Date().toLocaleString("en-PH")}`, margin, y);
    y += 10;

    // ── REVENUE HEADER ──
    doc.setFontSize(24);
    doc.setTextColor(180, 120, 60);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Revenue: ${formatPHPInt(data.totalRevenue)}`, margin, y);
    y += 12;

    // ── EXECUTIVE SUMMARY ──
    const completedOrders = getCompletedOrderCount(data.ordersByStatus);
    const completedInquiries = getCompletedInquiryCount(data.inquiriesByStatus);
    const processingOrders = data.totalOrders - completedOrders;
    const processingInquiries = data.totalInquiries - completedInquiries;
    const backlogShare = data.totalOrders > 0 ? (data.pendingOrders / data.totalOrders) * 100 : 0;
    const inquiryConversionPercent = data.totalInquiries > 0 ? (data.paidInquiries / data.totalInquiries) * 100 : 0;

    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", margin, y);
    y += 5;

    const summaryHeaders = [["Metric", "Value"]];
    const summaryRows = [
        ["Total Revenue", formatPHPInt(data.totalRevenue)],
        ["Total Orders", String(data.totalOrders)],
        ["  Completed", String(completedOrders)],
        ["  Processing", String(processingOrders)],
        ["Total Inquiries", String(data.totalInquiries)],
        ["  Completed", String(completedInquiries)],
        ["  Processing", String(processingInquiries)],
        ["Inquiry Conversion Rate", formatPercent(inquiryConversionPercent)],
    ];

    autoTable(doc, {
        startY: y,
        head: summaryHeaders,
        body: summaryRows,
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        didDrawPage: didDrawPage,
        headStyles: {
            fillColor: [50, 50, 50],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50],
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        columnStyles: {
            0: { cellWidth: contentWidth * 0.65 },
            1: { cellWidth: contentWidth * 0.35, halign: "right" },
        },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // ── ORDERS REPORT ──
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Orders Report", margin, y);
    y += 6;

    const orderSummary = [
        ["Metric", "Value"],
        ["Total Orders", String(data.totalOrders)],
        ["Completed Orders", String(completedOrders)],
        ["Paid Orders", String(data.paidOrders)],
        ["Fully Paid Orders", String(data.fullyPaidOrders)],
        ["Partially Paid Orders", String(data.partiallyPaidOrders)],
        ["Outstanding Value", formatPHPInt(data.ordersOutstandingValue)],
    ];

    autoTable(doc, {
        startY: y,
        head: [orderSummary[0]],
        body: orderSummary.slice(1),
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        didDrawPage: didDrawPage,
        headStyles: {
            fillColor: [80, 100, 120],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50],
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        columnStyles: {
            0: { cellWidth: contentWidth * 0.65 },
            1: { cellWidth: contentWidth * 0.35, halign: "right" },
        },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    // Best Selling Products
    if (data.topProducts.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "bold");
        doc.text("Best Selling Products", margin, y);
        y += 5;

        const prodHeaders = [["#", "Product Name", "Units Sold", "Revenue"]];
        const prodRows = data.topProducts.map((p, i) => [
            String(i + 1),
            p.name,
            String(p.orders),
            formatPHPInt(Math.round(p.revenue)),
        ]);

        autoTable(doc, {
            startY: y,
            head: prodHeaders,
            body: prodRows,
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
            didDrawPage: didDrawPage,
            headStyles: {
                fillColor: [90, 70, 50],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 8,
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [50, 50, 50],
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.08, halign: "center" },
                1: { cellWidth: contentWidth * 0.50 },
                2: { cellWidth: contentWidth * 0.17, halign: "right" },
                3: { cellWidth: contentWidth * 0.25, halign: "right" },
            },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    } else {
        y += 5;
    }

    // ── INQUIRIES REPORT ──
    if (y > 220) {
        doc.addPage();
        y = 16;
    }

    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Inquiries Report", margin, y);
    y += 6;

    const inquirySummaryRows = [
        ["Total Inquiries", String(data.totalInquiries)],
        ["Completed Inquiries", String(completedInquiries)],
        ["Paid Accepted Inquiries", String(data.paidInquiries)],
        ["Fully Paid Inquiries", String(data.fullyPaidInquiries)],
        ["Partially Paid Inquiries", String(data.partiallyPaidInquiries)],
        ["Inquiry Quoted Value", formatPHPInt(Math.round(data.inquiryTotalValue))],
        ["Paid Value", formatPHPInt(Math.round(data.inquiryPaidValue))],
        ["Outstanding Value", formatPHPInt(data.inquiriesOutstandingValue)],
    ];

    autoTable(doc, {
        startY: y,
        head: [["Metric", "Value"]],
        body: inquirySummaryRows,
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        didDrawPage: didDrawPage,
        headStyles: {
            fillColor: [140, 100, 80],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50],
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        columnStyles: {
            0: { cellWidth: contentWidth * 0.65 },
            1: { cellWidth: contentWidth * 0.35, halign: "right" },
        },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // ── REVENUE OVERVIEW (Bar Chart + Table) ──
    if (data.revenueByMonth.length > 0) {
        if (y > 200) {
            doc.addPage();
            y = 16;
        }

        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text("Revenue Overview", margin, y);
        y += 5;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text("Monthly paid business trend from orders and inquiries", margin, y);
        y += 8;

        // ── Draw Bar Chart ──
        const chartLeft = margin + 5;
        const chartBottom = y + 50;
        const chartTop = y;
        const chartHeight = chartBottom - chartTop - 10;
        const chartWidth = contentWidth - 10;

        const values = data.revenueByMonth.map((item) => Math.round(item.revenue));
        const maxVal = Math.max(...values, 1);
        const barCount = values.length;
        const barGap = 6;
        const barWidth = Math.min(22, (chartWidth - barGap * (barCount + 1)) / barCount);

        // Y-axis label
        doc.setFontSize(6);
        doc.setTextColor(140, 140, 140);
        doc.setFont("helvetica", "normal");
        doc.text(formatPHPInt(maxVal), chartLeft - 2, chartTop + 2, { align: "right" });
        doc.text("₱0", chartLeft - 2, chartBottom - 8, { align: "right" });

        // Draw bars
        const barColor = [180, 120, 60] as const;

        values.forEach((val, i) => {
            const barH = maxVal > 0 ? (val / maxVal) * chartHeight : 0;
            const x = chartLeft + barGap + i * (barWidth + barGap);
            const yBar = chartBottom - 8 - barH;

            // Bar rectangle
            doc.setFillColor(barColor[0], barColor[1], barColor[2]);
            doc.rect(x, yBar, barWidth, barH, "F");

            // Value label above bar
            doc.setFontSize(6);
            doc.setTextColor(80, 80, 80);
            doc.setFont("helvetica", "bold");
            doc.text(formatPHPInt(val), x + barWidth / 2, yBar - 2, { align: "center" });

            // Month label below bar
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "normal");
            doc.text(data.revenueByMonth[i].month, x + barWidth / 2, chartBottom + 3, { align: "center" });
        });

        // Axis line
        doc.setDrawColor(180, 180, 180);
        doc.line(chartLeft, chartBottom - 8, chartLeft + chartWidth, chartBottom - 8);

        y = chartBottom + 12;

        // ── Revenue Table ──
        const revHeaders = [["Month", "Revenue"]];
        const revRows = data.revenueByMonth.map((item) => [
            item.month,
            formatPHPInt(Math.round(item.revenue)),
        ]);

        const totalRev = data.revenueByMonth.reduce((sum, item) => sum + Math.round(item.revenue), 0);
        revRows.push(["TOTAL", formatPHPInt(totalRev)]);

        autoTable(doc, {
            startY: y,
            head: revHeaders,
            body: revRows,
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
            didDrawPage: didDrawPage,
            headStyles: {
                fillColor: [60, 60, 80],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 8,
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [50, 50, 50],
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.65 },
                1: { cellWidth: contentWidth * 0.35, halign: "right" },
            },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    // ── AUDIT ALERTS ──
    if (data.mismatches.length > 0) {
        if (y > 220) {
            doc.addPage();
            y = 16;
        }

        doc.setFontSize(11);
        doc.setTextColor(180, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text(`Financial Audit Alerts (${data.mismatches.length} discrepancies)`, margin, y);
        y += 5;

        const auditHeaders = [["Origin", "Reference", "Issue", "Expected", "Paid"]];
        const auditRows = data.mismatches.slice(0, 10).map((m) => [
            m.type.charAt(0).toUpperCase() + m.type.slice(1),
            m.reference,
            m.issue.length > 50 ? m.issue.substring(0, 50) + "..." : m.issue,
            formatPHPInt(m.expectedAmount),
            formatPHPInt(m.paidAmount),
        ]);

        autoTable(doc, {
            startY: y,
            head: auditHeaders,
            body: auditRows,
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
            didDrawPage: didDrawPage,
            headStyles: {
                fillColor: [180, 40, 40],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 7,
            },
            bodyStyles: {
                fontSize: 7,
                textColor: [50, 50, 50],
            },
            alternateRowStyles: {
                fillColor: [255, 240, 240],
            },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.12 },
                1: { cellWidth: contentWidth * 0.15 },
                2: { cellWidth: contentWidth * 0.38 },
                3: { cellWidth: contentWidth * 0.17, halign: "right" },
                4: { cellWidth: contentWidth * 0.18, halign: "right" },
            },
        });
    }

    // ── Finalize: update total pages and redraw headers/footers with correct total ──
    const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    
    // Clear existing headers/footers and redraw with correct total pages
    pagesWithHeaderFooter.clear();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addPageHeaderAndFooter(i, totalPages);
    }

    doc.save(`Admin_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}