import { Printer, Download } from "lucide-react";
import type { AnalyticsData } from "@/services/analyticsService";
import { exportAnalyticsCSV, triggerReportPDFPrint } from "@/utils/reportExport";

interface ReportExportButtonsProps {
    data: AnalyticsData;
}

export function ReportExportButtons({ data }: ReportExportButtonsProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 print:hidden shrink-0">
            <button
                onClick={() => triggerReportPDFPrint(data)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider transition-all"
                aria-label="Export report as PDF"
            >
                <Printer size={13} />
                Export PDF
            </button>
            <button
                onClick={() => exportAnalyticsCSV(data)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4A97A]/10 hover:bg-[#D4A97A]/20 border border-[#D4A97A]/30 text-[#D4A97A] text-xs font-semibold uppercase tracking-wider transition-all"
                aria-label="Export report as CSV"
            >
                <Download size={13} />
                Export CSV
            </button>
        </div>
    );
}
