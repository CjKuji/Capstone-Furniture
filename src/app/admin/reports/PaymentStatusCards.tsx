interface PaymentStatusCardsProps {
    fullyPaidOrders: number;
    partiallyPaidOrders: number;
    fullyPaidInquiries: number;
    partiallyPaidInquiries: number;
}

export function PaymentStatusCards({ 
    fullyPaidOrders, 
    partiallyPaidOrders, 
    fullyPaidInquiries, 
    partiallyPaidInquiries 
}: PaymentStatusCardsProps) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 print:grid-cols-4 print-section">
            <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 p-4 sm:p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-200">Fully paid orders</p>
                <p className="mt-2 text-2xl font-bold text-white">{fullyPaidOrders}</p>
                <p className="mt-1 text-sm text-emerald-100/80">Orders fully settled and ready to close</p>
            </div>
            <div className="rounded-[22px] border border-amber-400/20 bg-amber-500/10 p-4 sm:p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-amber-200">Partially paid orders</p>
                <p className="mt-2 text-2xl font-bold text-white">{partiallyPaidOrders}</p>
                <p className="mt-1 text-sm text-amber-100/80">Orders waiting on the remaining balance</p>
            </div>
            <div className="rounded-[22px] border border-sky-400/20 bg-sky-500/10 p-4 sm:p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-sky-200">Fully paid inquiries</p>
                <p className="mt-2 text-2xl font-bold text-white">{fullyPaidInquiries}</p>
                <p className="mt-1 text-sm text-sky-100/80">Accepted inquiries fully settled</p>
            </div>
            <div className="rounded-[22px] border border-fuchsia-400/20 bg-fuchsia-500/10 p-4 sm:p-5">
                <p className="text-[10px] uppercase tracking-[0.24em] text-fuchsia-200">Partially paid inquiries</p>
                <p className="mt-2 text-2xl font-bold text-white">{partiallyPaidInquiries}</p>
                <p className="mt-1 text-sm text-fuchsia-100/80">Inquiries still receiving partial settlement</p>
            </div>
        </div>
    );
}
