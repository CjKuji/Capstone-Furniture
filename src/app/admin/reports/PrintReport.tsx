import type { AnalyticsData } from "@/services/analyticsService";

interface PrintReportProps {
    data: AnalyticsData;
    completedOrders: number;
    completedInquiries: number;
    formatPHP: (n: number) => string;
}

export function PrintReport({ data, completedOrders, completedInquiries, formatPHP }: PrintReportProps) {
    return (
        <div className="hidden print-only-report w-full bg-white text-black">
            <div className="border-b border-gray-300 pb-4 mb-5 print-report-section">
                <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-gray-500">Furniture Enterprise Report</p>
                <h2 className="text-2xl font-bold text-black">Admin Operations Report</h2>
                <p className="text-sm text-gray-600">Generated {new Date().toLocaleString("en-PH")}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 print-report-summary print-report-section">
                <div className="rounded-lg border border-gray-300 p-3 print-report-card">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Total revenue</p>
                    <p className="mt-2 text-xl font-bold text-black">{formatPHP(data.totalRevenue)}</p>
                </div>
                <div className="rounded-lg border border-gray-300 p-3 print-report-card">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Completed orders</p>
                    <p className="mt-2 text-xl font-bold text-black">{completedOrders}</p>
                </div>
                <div className="rounded-lg border border-gray-300 p-3 print-report-card">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Completed inquiries</p>
                    <p className="mt-2 text-xl font-bold text-black">{completedInquiries}</p>
                </div>
                <div className="rounded-lg border border-gray-300 p-3 print-report-card">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Pending backlog</p>
                    <p className="mt-2 text-xl font-bold text-black">{data.pendingOrders}</p>
                </div>
            </div>

            <div className="space-y-3">
                <section className="rounded-lg border border-gray-300 p-3 print-report-section print-report-card">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-700">Revenue overview</h3>
                    <table className="mt-2 w-full text-sm print-report-table">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-600">
                                <th className="pb-2">Month</th>
                                <th className="pb-2 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.revenueByMonth.map((item) => (
                                <tr key={item.month} className="border-b border-gray-100">
                                    <td className="py-2">{item.month}</td>
                                    <td className="py-2 text-right font-medium">{formatPHP(Math.round(item.revenue))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="rounded-lg border border-gray-300 p-3 print-report-section print-report-card">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-700">Paid activity</h3>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Paid revenue</p>
                            <p className="mt-1 font-semibold text-black">{formatPHP(data.totalRevenue)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Paid orders</p>
                            <p className="mt-1 font-semibold text-black">{data.paidOrders}</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border border-gray-300 p-3 print-report-section print-report-card">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-700">Top products</h3>
                    <table className="mt-2 w-full text-sm print-report-table">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-600">
                                <th className="pb-2">Product</th>
                                <th className="pb-2 text-right">Units</th>
                                <th className="pb-2 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topProducts.map((item) => (
                                <tr key={item.name} className="border-b border-gray-100">
                                    <td className="py-2">{item.name}</td>
                                    <td className="py-2 text-right">{item.orders}</td>
                                    <td className="py-2 text-right font-medium">{formatPHP(Math.round(item.revenue))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="rounded-lg border border-gray-300 p-3 print-report-section print-report-card">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-700">Recent activity</h3>
                    <table className="mt-2 w-full text-sm print-report-table">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-600">
                                <th className="pb-2">Type</th>
                                <th className="pb-2">Reference</th>
                                <th className="pb-2 text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentOrders.slice(0, 3).map((item) => (
                                <tr key={item.id} className="border-b border-gray-100">
                                    <td className="py-2">Order</td>
                                    <td className="py-2">{item.reference}</td>
                                    <td className="py-2 text-right font-medium">{formatPHP(Math.round(item.total))}</td>
                                </tr>
                            ))}
                            {data.recentInquiries.slice(0, 3).map((item) => (
                                <tr key={item.id} className="border-b border-gray-100">
                                    <td className="py-2">Inquiry</td>
                                    <td className="py-2">{item.reference}</td>
                                    <td className="py-2 text-right font-medium">{formatPHP(Math.round(item.total))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {data.mismatches.length > 0 && (
                    <section className="rounded-lg border border-red-300 bg-red-50 p-3 print-report-section">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-red-700">Audit alerts</h3>
                        <ul className="mt-2 space-y-2 text-sm text-red-800">
                            {data.mismatches.slice(0, 5).map((item) => (
                                <li key={item.id} className="border-b border-red-200 pb-2 last:border-b-0 last:pb-0">
                                    <span className="font-semibold">{item.reference}</span>: {item.issue}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </div>
    );
}
