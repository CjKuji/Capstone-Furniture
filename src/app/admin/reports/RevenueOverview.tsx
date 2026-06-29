
interface RevenueOverviewProps {
    revenueByMonth: Array<{ month: string; revenue: number }>;
    totalRevenue: number;
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    formatPHP: (n: number) => string;
    BarChart: ({ data }: { data: Array<{ label: string; value: number } | { month: string; revenue: number }> }) => React.ReactNode;
    EmptyState: ({ title, description, hint }: { title: string; description: string; hint?: string }) => React.ReactNode;
    backlogShare: number;
}

export function RevenueOverview({ 
    revenueByMonth, 
    totalRevenue, 
    selectedMonth, 
    setSelectedMonth, 
    formatPHP, 
    BarChart, 
    EmptyState,
    backlogShare 
}: RevenueOverviewProps) {
    const selectedMonthLabel = selectedMonth || revenueByMonth[revenueByMonth.length - 1]?.month || "No month";
    const selectedMonthRevenue = revenueByMonth.find((item) => item.month === selectedMonth)?.revenue ?? revenueByMonth[revenueByMonth.length - 1]?.revenue ?? 0;

    return (
        <div className="bg-[#12100d]/80 border border-white/10 rounded-3xl p-6 print:border-gray-300 print:bg-white">
            <div className="border-b border-white/10 pb-3 mb-4 print:border-gray-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-[0.24em] uppercase print:text-black">Revenue overview</h2>
                        <p className="text-sm text-white/60 mt-1.5 print:text-gray-600 leading-relaxed">Monthly paid business trend from orders and inquiries. Use this to see whether revenue is growing.</p>
                    </div>
                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/50 print:text-gray-600">
                        <span>Month</span>
                        <select
                            value={selectedMonth}
                            onChange={(event) => setSelectedMonth(event.target.value)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none print:border-gray-300 print:bg-white print:text-black"
                        >
                            {revenueByMonth.map((item) => (
                                <option key={item.month} value={item.month} className="text-black">
                                    {item.month}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>
            {revenueByMonth.length === 0 || totalRevenue === 0 ? (
                <EmptyState
                    title="No revenue yet"
                    description="Revenue will appear here once paid orders or inquiries are recorded. This section shows the monthly trend for real paid business activity."
                    hint="This view updates from payment records"
                />
            ) : (
                <>
                    <BarChart data={revenueByMonth} />
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
                            <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Backlog share</p>
                            <p className="mt-2 text-xl font-bold text-white print:text-black">{Math.round(backlogShare)}%</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
