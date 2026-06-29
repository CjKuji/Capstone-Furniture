interface PaidActivityProps {
    totalRevenue: number;
    paidOrders: number;
    formatPHP: (n: number) => string;
    EmptyState: ({ title, description, hint }: { title: string; description: string; hint?: string }) => React.ReactNode;
}

export function PaidActivity({ totalRevenue, paidOrders, formatPHP, EmptyState }: PaidActivityProps) {
    return (
        <div className="bg-[#12100d]/80 border border-white/10 rounded-3xl p-6 print:border-gray-300 print:bg-white">
            <div className="border-b border-white/10 pb-3 mb-4 print:border-gray-200">
                <h2 className="text-sm font-bold text-white tracking-[0.24em] uppercase print:text-black">Paid activity</h2>
                <p className="text-sm text-white/60 mt-1.5 print:text-gray-600 leading-relaxed">A short view of confirmed paid business activity from orders and inquiries.</p>
            </div>
            {totalRevenue === 0 && paidOrders === 0 ? (
                <EmptyState
                    title="No paid activity yet"
                    description="Once paid business is recorded, this section will show the revenue and confirmed activity from orders and inquiries."
                    hint="This section is based on payment records"
                />
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Paid revenue</p>
                        <p className="mt-2 text-xl font-bold text-white print:text-black">{formatPHP(totalRevenue)}</p>
                    </div>
                    <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Paid orders</p>
                        <p className="mt-2 text-xl font-bold text-white print:text-black">{paidOrders}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
