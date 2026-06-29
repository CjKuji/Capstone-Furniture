import { AlertTriangle } from "lucide-react";
import type { DataMismatch } from "@/services/analyticsService";

interface AuditAlertsProps {
    mismatches: DataMismatch[];
    formatPHP: (n: number) => string;
}

export function AuditAlerts({ mismatches, formatPHP }: AuditAlertsProps) {
    if (mismatches.length === 0) return null;

    return (
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 break-inside-avoid print:border-red-400 print:bg-transparent print-section">
            <h2 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-4 tracking-wider uppercase print:text-red-800">
                <AlertTriangle size={16} />
                Financial Audit Alerts: Reconciliation Discrepancies ({mismatches.length})
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
                        {mismatches.map((m) => (
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
    );
}
