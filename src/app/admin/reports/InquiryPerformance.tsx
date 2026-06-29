interface InquiryPerformanceProps {
    totalInquiries: number;
    inquiryTotalValue: number;
    inquiryPaidValue: number;
    inquiryConversionPercent: number;
    formatPHP: (n: number) => string;
    formatPercent: (value: number) => string;
    EmptyState: ({ title, description, hint }: { title: string; description: string; hint?: string }) => React.ReactNode;
}

export function InquiryPerformance({ 
    totalInquiries, 
    inquiryTotalValue, 
    inquiryPaidValue, 
    inquiryConversionPercent, 
    formatPHP, 
    formatPercent,
    EmptyState 
}: InquiryPerformanceProps) {
    return (
        <div className="bg-[#12100d]/80 border border-white/10 rounded-3xl p-6 print:border-gray-300 print:bg-white h-full">
            <div className="border-b border-white/10 pb-3 mb-4 print:border-gray-200">
                <h2 className="text-sm font-bold text-white tracking-[0.24em] uppercase print:text-black">Inquiry performance</h2>
            </div>
            <p className="text-sm text-white/60 mb-5 print:text-gray-600 leading-relaxed">A simple view of inquiry value and how much of it turned into paid business.</p>
            {totalInquiries === 0 && inquiryTotalValue === 0 ? (
                <EmptyState
                    title="No inquiry data yet"
                    description="Inquiry value will appear here once requests are created and payments are tied to them."
                    hint="This report focuses on paid conversion"
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Accepted inquiry value</p>
                        <p className="mt-2 text-2xl font-bold text-white print:text-black">{formatPHP(Math.round(inquiryTotalValue))}</p>
                    </div>
                    <div className="rounded-2xl bg-[#0f0d0b] border border-white/10 p-4 print:border-gray-200 print:bg-gray-50">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 print:text-gray-600">Paid accepted inquiry value</p>
                        <p className="mt-2 text-2xl font-bold text-white print:text-black">{formatPHP(Math.round(inquiryPaidValue))}</p>
                    </div>
                    <div className="rounded-2xl border border-[#D4A97A]/20 bg-[#D4A97A]/10 p-4 print:border-gray-300 print:bg-gray-50">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-[#D4A97A] print:text-gray-600">Inquiry conversion</p>
                        <p className="mt-2 text-xl font-bold text-white print:text-black">{totalInquiries > 0 ? formatPercent(inquiryConversionPercent) : "0%"}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
