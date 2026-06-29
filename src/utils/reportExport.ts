import type { AnalyticsData, StatusCount } from "@/services/analyticsService";
import { exportAnalyticsCSV } from "./csvExport";
import { triggerReportPDFPrint } from "./pdfExport";

// Re-export individual export functions for direct use
export { exportAnalyticsCSV } from "./csvExport";
export { triggerReportPDFPrint } from "./pdfExport";

/**
 * Helper function to count completed orders from status data
 */
export function getCompletedOrderCount(ordersByStatus: StatusCount[]): number {
    const completedStatuses = new Set(["delivered", "completed", "closed", "done", "fulfilled", "ready"]);
    return ordersByStatus
        .filter((item) => completedStatuses.has(item.status.toLowerCase()))
        .reduce((sum, item) => sum + item.count, 0);
}

/**
 * Helper function to count completed inquiries from status data
 */
export function getCompletedInquiryCount(inquiriesByStatus: StatusCount[]): number {
    const completedStatuses = new Set(["delivered", "completed", "closed", "done", "fulfilled", "ready"]);
    return inquiriesByStatus
        .filter((item) => completedStatuses.has(item.status.toLowerCase()))
        .reduce((sum, item) => sum + item.count, 0);
}

/**
 * Consolidated export object for report functionality
 * This provides a single import point for all report export utilities
 */
export const reportExport = {
    csv: exportAnalyticsCSV,
    pdf: triggerReportPDFPrint,
    helpers: {
        getCompletedOrderCount,
        getCompletedInquiryCount,
    },
};