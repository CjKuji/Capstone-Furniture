import { Package } from "lucide-react";
import type { TopProduct } from "@/services/analyticsService";

interface BestSellersProps {
    topProducts: TopProduct[];
    formatPHP: (n: number) => string;
    EmptyState: ({ title, description, hint }: { title: string; description: string; hint?: string }) => React.ReactNode;
}

export function BestSellers({ topProducts, formatPHP, EmptyState }: BestSellersProps) {
    return (
        <div className="bg-[#12100d]/80 border border-white/10 rounded-3xl p-6 print:border-gray-300 print:bg-white">
            <div className="border-b border-white/10 pb-3 mb-4 flex items-center gap-2 print:border-gray-200">
                <Package size={15} className="text-[#D4A97A] print:text-gray-700" />
                <h2 className="text-sm font-bold text-white tracking-[0.24em] uppercase print:text-black">Best sellers</h2>
            </div>
            <p className="text-sm text-white/60 mb-4 print:text-gray-600 leading-relaxed">Top products from completed orders that were paid.</p>
            {topProducts.length === 0 ? (
                <EmptyState
                    title="No best sellers yet"
                    description="Products will appear here once paid completed orders are recorded."
                    hint="This section is based on completed paid sales"
                />
            ) : (
                <div className="space-y-3.5">
                    {topProducts.map((p, i) => (
                        <div key={p.name} className="flex items-center gap-3 text-xs">
                            <span className="font-mono font-bold text-white/20 w-4 text-right text-xs print:text-gray-400">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold truncate tracking-wide print:text-gray-900">{p.name}</p>
                                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider print:text-gray-500">{p.orders} sold</p>
                            </div>
                            <span className="font-mono font-bold text-[#D4A97A] print:text-black shrink-0 text-right">
                                {formatPHP(p.revenue)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
