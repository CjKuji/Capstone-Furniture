"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboardData } from "@/services/dashboardService";
import { useUser } from "@/hooks/useUser";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { 
  FileText, 
  Hammer, 
  Layers, 
  Truck, 
  Package, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Calendar, 
  Filter,
  X,
  ArrowUpRight,
  ClipboardList
} from "lucide-react";

interface UserWithProfile {
  email?: string;
  profile?: {
    email?: string;
  };
}

/* =========================================================
   PAGE COMPONENT
========================================================= */
export default function AdminDashboard() {
  const { user } = useUser();
  const router = useRouter();

  const typedUser = user as UserWithProfile | null;
  const email = typedUser?.email ?? typedUser?.profile?.email ?? null;

  // --- Core Dashboard State via React Query (Live Updates) ---
  const { data, isLoading } = useAdminDashboard();

  // Provide a safe default when data is not yet available
  const safeData: AdminDashboardData = data ?? {
    pendingQuotes: 0,
    unreadMessages: 0,
    paidAwaitingProduction: 0,
    pendingStoreOrdersCount: 0,
    pendingCustomRequestsCount: 0,
    totalFurnitureCatalogCount: 0,
    currentUsersCount: 0,
    activeOrdersCount: 0,
    activeInquiriesCount: 0,
    completedOrdersCount: 0,
    completedInquiriesCount: 0,
    activeProduction: 0,
    partiallyPaidQueue: { readyForPickupCount: 0, readyForDeliveryCount: 0 },
    fullyPaidQueue: { readyForPickupCount: 0, readyForDeliveryCount: 0 },
    recentActivity: [],
  };
  
  // --- Chronological Filter States ---
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");

  // --- Dynamic Option Mappings Derived From Activity Logs ---
  const { availableYears, availableMonths } = useMemo(() => {
    const yearsSet = new Set<string>();
    const monthsMap = new Map<number, string>();

    safeData.recentActivity.forEach((log) => {
      if (!log.createdAt) return;
      const date = new Date(log.createdAt);
      if (isNaN(date.getTime())) return;

      yearsSet.add(date.getFullYear().toString());
      monthsMap.set(date.getMonth(), date.toLocaleString("default", { month: "long" }));
    });

    const sortedYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
    const sortedMonths = Array.from(monthsMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, monthName]) => monthName);

    return {
      availableYears: sortedYears,
      availableMonths: sortedMonths
    };
  }, [safeData.recentActivity]);

  // --- Reactive Sorting & Filter Evaluation (Ensures Newest Stays on Top) ---
  const filteredActivity = useMemo(() => {
    return safeData.recentActivity
      .filter((log) => {
        if (!log.createdAt) return true;
        const date = new Date(log.createdAt);
        if (isNaN(date.getTime())) return true;

        const logYear = date.getFullYear().toString();
        const logMonth = date.toLocaleString("default", { month: "long" });

        const matchesYear = selectedYear === "ALL" || logYear === selectedYear;
        const matchesMonth = selectedMonth === "ALL" || logMonth === selectedMonth;

        return matchesYear && matchesMonth;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [safeData.recentActivity, selectedMonth, selectedYear]);

  const isFiltering = selectedMonth !== "ALL" || selectedYear !== "ALL";

  const clearFilters = () => {
    setSelectedMonth("ALL");
    setSelectedYear("ALL");
  };

  return (
    <main className="min-h-screen bg-[#0F0A06] text-white p-3 sm:p-4 lg:p-8 space-y-6 sm:space-y-8 lg:space-y-10 antialiased font-sans print:bg-white print:text-black">
      
      {/* =========================================================
          SECTION 0: HEADER
          ========================================================= */}
      <div className="flex flex-col gap-4 border-b border-white/[0.1] print:border-black/20 pb-4 sm:pb-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-1 bg-[#D4A97A] rounded-full shadow-[0_0_8px_rgba(212,169,122,0.3)] print:bg-amber-700 print:shadow-none" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white print:text-black">
              Store Management Hub
            </h1>
          </div>
          <p className="text-xs md:text-sm text-white/50 print:text-black/60 font-medium">
            {email ? `Logged in as: ${email}` : "System status monitor active"}
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs shadow-2xl print:shadow-none md:self-auto print:border-black/10">
          <span className="relative flex h-2 w-2 print:hidden">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-white/60 print:text-black/70 font-medium tracking-wide">
            Database Status: <span className="text-emerald-400 print:text-emerald-700 font-semibold uppercase tracking-wider ml-0.5">Synced</span>
          </span>
        </div>
      </div>

      {/* =========================================================
          SECTION 1: ACTION ITEMS & METRICS
          ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardList size={14} className="text-[#D4A97A] print:text-amber-700" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/50 print:text-black/50">Action Items & Operations</h2>
          </div>
        </div>
        
        {isLoading && !data ? (
          <div className="grid grid-cols-1 gap-3 print:hidden sm:grid-cols-2 xl:grid-cols-5 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5 sm:gap-4">
            
            {/* ACTIVE ORDERS & INQUIRIES CARD (replaces New Requests) */}
            <DashboardCard
              label="Active Orders & Inquiries"
              tone={(safeData.activeOrdersCount + safeData.activeInquiriesCount) > 0 ? "warning" : "default"}
              icon={AlertCircle}
            >
              <div className="grid grid-cols-2 w-full h-full items-end">
                <div className="relative group/metric pr-2">
                  <p className="text-3xl font-extrabold tracking-tight text-white print:text-black transition-colors group-hover/metric:text-[#D4A97A]">
                    {safeData.activeOrdersCount}
                  </p>
                  <span className="text-[10px] text-white/40 print:text-black/50 font-medium mt-1 block whitespace-normal break-words">Orders</span>
                </div>
                <div className="relative border-l border-white/[0.1] print:border-black/20 pl-4 group/metric h-full flex flex-col justify-end">
                  <p className="text-3xl font-extrabold tracking-tight text-white print:text-black transition-colors group-hover/metric:text-[#D4A97A]">
                    {safeData.activeInquiriesCount}
                  </p>
                  <span className="text-[10px] text-white/40 print:text-black/50 font-medium mt-1 block whitespace-normal break-words">Inquiries</span>
                </div>
              </div>
            </DashboardCard>

            {/* STAGED FOR PRODUCTION CARD */}
            <DashboardCard 
              label="Staged for Production" 
              tone={safeData.paidAwaitingProduction > 0 ? "warning" : "default"}
              icon={Hammer}
            >
              <div className="grid grid-cols-2 w-full h-full items-end">
                <div className="relative group/metric pr-2">
                  <p className="text-3xl font-extrabold tracking-tight text-white print:text-black transition-colors group-hover/metric:text-[#D4A97A]">
                    {safeData.pendingStoreOrdersCount}
                  </p>
                  <span className="text-[10px] text-white/40 print:text-black/50 font-medium mt-1 block whitespace-normal break-words">Orders (Partial/Full Paid)</span>
                </div>
                <div className="relative border-l border-white/[0.1] print:border-black/20 pl-4 group/metric h-full flex flex-col justify-end">
                  <p className="text-3xl font-extrabold tracking-tight text-white print:text-black transition-colors group-hover/metric:text-[#D4A97A]">
                    {safeData.pendingCustomRequestsCount}
                  </p>
                  <span className="text-[10px] text-white/40 print:text-black/50 font-medium mt-1 block whitespace-normal break-words">Inquiries (Deposit Paid)</span>
                </div>
              </div>
            </DashboardCard>

            {/* ACTIVE PRODUCTION CARD */}
            <DashboardCard 
              label="Active Production" 
              tone={safeData.activeProduction > 0 ? "warning" : "default"}
              icon={Activity}
            >
              <p className="text-3xl font-extrabold tracking-tight text-white print:text-black">{safeData.activeProduction}</p>
              <p className="text-[10px] text-white/40 print:text-black/50 font-medium mt-1 whitespace-normal break-words">Items currently being built</p>
            </DashboardCard>

            <DashboardCard 
              label="Total Products" 
              tone="default"
              icon={Layers}
            >
              <p className="text-3xl font-extrabold tracking-tight text-white print:text-black">{safeData.totalFurnitureCatalogCount}</p>
              <p className="text-[10px] text-white/40 print:text-black/50 font-medium mt-1 whitespace-normal break-words">Active catalog listings</p>
            </DashboardCard>

            <DashboardCard 
              label="Registered Customers" 
              tone="default"
              icon={Users}
            >
              <p className="text-3xl font-extrabold tracking-tight text-white print:text-black">{safeData.currentUsersCount}</p>
              <p className="text-[10px] text-white/40 print:text-black/50 font-medium mt-1 whitespace-normal break-words">Total user accounts</p>
            </DashboardCard>
          </div>
        )}
      </div>

      {/* =========================================================
          SECTION 2: LOGISTICS WORKFLOW PILLOWS
          ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Truck size={14} className="text-white/50 print:text-black/50" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/50 print:text-black/50">Fulfillment Stages & Logistics</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          
          {/* PARTIAL PAYMENTS WORK QUEUE */}
          <div className="bg-white/[0.01] border border-white/[0.1] print:border-black/20 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition duration-300 relative group shadow-xl print:shadow-none">
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[#D4A97A]/20 to-transparent print:hidden" />
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)] shrink-0 print:shadow-none" />
                <h3 className="text-xs font-bold text-white/90 print:text-black/80 uppercase tracking-widest">Partial Payments (Balances Remaining)</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div className="bg-white/[0.01] border border-white/[0.06] print:border-black/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.02] transition duration-200">
                  <p className="text-xs text-white/50 print:text-black/60 flex items-center gap-2 font-semibold tracking-wide">
                    <Truck size={14} className="text-yellow-500 shrink-0" /> <span>Shipments Awaiting Payment</span>
                  </p>
                  <p className="text-3xl font-black mt-3 text-white print:text-black">{isLoading ? "..." : safeData.partiallyPaidQueue.readyForDeliveryCount}</p>
                  <span className="text-[10px] text-white/40 print:text-black/50 block mt-2 font-medium">Full payment required to leave warehouse</span>
                </div>
                
                <div className="bg-white/[0.01] border border-white/[0.06] print:border-black/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.02] transition duration-200">
                  <p className="text-xs text-white/50 print:text-black/60 flex items-center gap-2 font-semibold tracking-wide">
                    <Package size={14} className="text-purple-400 print:text-purple-700 shrink-0" /> <span>Pickups Awaiting Payment</span>
                  </p>
                  <p className="text-3xl font-black mt-3 text-white print:text-black">{isLoading ? "..." : safeData.partiallyPaidQueue.readyForPickupCount}</p>
                  <span className="text-[10px] text-white/40 print:text-black/50 block mt-2 font-medium">Collect final settlement at checkout counter</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-white/40 print:text-black/50 mt-5 border-t border-white/[0.06] print:border-black/10 pt-4 italic font-medium leading-relaxed">
              * Production finalized. Stalled in storage awaiting settlement of remaining accounts before dispatch approval.
            </p>
          </div>

          {/* FULLY PAID DISPATCH PIPELINE */}
          <div className="bg-white/[0.01] border border-white/[0.1] print:border-black/20 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition duration-300 relative group shadow-xl print:shadow-none">
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent print:hidden" />
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)] shrink-0 print:shadow-none" />
                <h3 className="text-xs font-bold text-white/90 print:text-black/80 uppercase tracking-widest">Fully Paid Items (Ready to Dispatch)</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div className="bg-white/[0.01] border border-white/[0.06] print:border-black/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.02] transition duration-200">
                  <p className="text-xs text-white/50 print:text-black/60 flex items-center gap-2 font-semibold tracking-wide">
                    <Truck size={14} className="text-emerald-400 print:text-emerald-700 shrink-0" /> <span>Delivery & Transit Pipeline</span>
                  </p>
                  <p className="text-3xl font-black mt-3 text-white print:text-black">{isLoading ? "..." : safeData.fullyPaidQueue.readyForDeliveryCount}</p>
                  <span className="text-[10px] text-white/40 print:text-black/50 block mt-2 font-medium">Cleared for delivery transit or actively en route</span>
                </div>
                
                <div className="bg-white/[0.01] border border-white/[0.06] print:border-black/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.02] transition duration-200">
                  <p className="text-xs text-white/50 print:text-black/60 flex items-center gap-2 font-semibold tracking-wide">
                    <Package size={14} className="text-blue-400 print:text-blue-700 shrink-0" /> <span>Cleared For Pickup</span>
                  </p>
                  <p className="text-3xl font-black mt-3 text-white print:text-black">{isLoading ? "..." : safeData.fullyPaidQueue.readyForPickupCount}</p>
                  <span className="text-[10px] text-white/40 print:text-black/50 block mt-2 font-medium">Ready for immediate client release</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-white/40 print:text-black/50 mt-5 border-t border-white/[0.06] print:border-black/10 pt-4 italic font-medium leading-relaxed">
              * Fully paid items. Records automatically archive from this view once their status transitions to completed.
            </p>
          </div>

        </div>
      </div>

      {/* =========================================================
          SECTION 3: REAL-TIME ACTIVITY & NAVIGATION LINKS
          ========================================================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6 items-start">
        
        {/* RECENT ACTIVITY STREAM (NEWEST AT THE VERY TOP) */}
        <div className="lg:col-span-2 bg-white/[0.01] border border-white/[0.1] print:border-black/20 rounded-2xl p-6 space-y-5 shadow-2xl print:shadow-none">
          
          <div className="flex flex-col gap-4 border-b border-white/[0.06] print:border-black/10 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2.5 min-w-0">
                <Activity size={16} className="text-emerald-400 print:text-emerald-700 shrink-0" />
                <h2 className="text-xs font-bold text-white/90 print:text-black/80 uppercase tracking-widest">
                  Recent Store Activity
                </h2>
              </div>
              
              {isFiltering && (
                <button 
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-1 text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg transition-all shadow-inner font-medium print:hidden"
                >
                  <X size={12} /> Reset Filters
                </button>
              )}
            </div>

            {/* DATE CONTROLS */}
            <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.01] p-3 print:hidden print:border-black/10 sm:p-3.5">
              {/* Year Selector row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1 shrink-0 w-16">
                  <Calendar size={12} className="text-white/20" /> Year
                </span>
                <button
                  onClick={() => setSelectedYear("ALL")}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all duration-150 font-medium ${
                    selectedYear === "ALL" 
                      ? "bg-white/10 text-white border border-white/[0.08]" 
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  All
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all duration-150 font-medium ${
                      selectedYear === year 
                        ? "bg-[#D4A97A]/10 border border-[#D4A97A]/30 text-[#D4A97A]" 
                        : "text-white/50 hover:text-white/70"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>

              {/* Month Selector row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-white/[0.04] pt-2.5 scrollbar-none">
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1 shrink-0 w-16">
                  <Filter size={11} className="text-white/20" /> Month
                </span>
                <button
                  onClick={() => setSelectedMonth("ALL")}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all duration-150 font-medium ${
                    selectedMonth === "ALL" 
                      ? "bg-white/10 text-white border border-white/[0.08]" 
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  All
                </button>
                {availableMonths.map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all duration-150 font-medium ${
                      selectedMonth === month 
                        ? "bg-[#D4A97A]/10 border border-[#D4A97A]/30 text-[#D4A97A]" 
                        : "text-white/50 hover:text-white/70"
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMIC ACTIVITY CONTAINER */}
          <div className="space-y-2 max-h-[400px] print:max-h-none overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/[0.06] scrollbar-track-transparent">
            {isLoading && safeData.recentActivity.length === 0 ? (
              <p className="text-xs text-white/40 animate-pulse py-4 font-medium italic">Updating activity items...</p>
            ) : filteredActivity.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/[0.08] print:border-black/20 rounded-xl bg-white/[0.005]">
                <Filter size={24} className="text-white/20 mx-auto mb-3" />
                <p className="text-xs text-white/50 print:text-black/50 font-medium">No activity records found matching these filters.</p>
              </div>
            ) : (
              filteredActivity.map((log) => (
                <div 
                  key={log.id} 
                  className="group flex flex-col gap-3 break-inside-avoid rounded-xl border border-white/[0.06] bg-white/[0.01] p-3.5 transition duration-200 hover:border-white/[0.12] hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between print:border-black/10"
                >
                  <div className="space-y-1.5 min-w-0 flex-1 sm:pr-4">
                    <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        log.type === "catalog_order" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 print:text-blue-800 print:border-blue-300" :
                        log.type === "custom_inquiry" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 print:text-purple-800 print:border-purple-300" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:text-emerald-800 print:border-emerald-300"
                      }`}>
                        {log.type === "catalog_order" ? "Store Order" : log.type === "custom_inquiry" ? "Custom Request" : "Payment"}
                      </span>
                      <span className="font-semibold text-white/90 print:text-black text-xs sm:text-sm tracking-tight break-words whitespace-normal">{log.title}</span>
                    </div>
                    <p className="text-xs text-white/50 print:text-black/60 break-words whitespace-normal font-normal leading-relaxed">{log.description}</p>
                  </div>

                  <div className="flex w-full shrink-0 flex-col items-start gap-1 border-t border-white/[0.04] pt-2 text-left sm:w-auto sm:items-end sm:border-t-0 sm:pt-0 sm:text-right sm:justify-center print:border-black/10">
                    {log.amount !== undefined && log.amount > 0 ? (
                      <p className="font-bold text-[#D4A97A] print:text-amber-800 text-xs sm:text-sm font-mono">₱{log.amount.toLocaleString()}</p>
                    ) : (
                      <p className="text-[10px] text-white/30 print:text-black/40 italic font-medium">No Balance</p>
                    )}
                    <p className="text-[10px] text-white/40 print:text-black/50 font-medium tracking-tight">
                      {new Date(log.createdAt).toLocaleDateString([], { month: "short", day: "2-digit" })} &bull; {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CUMULATIVE TOTALS & GATEWAYS */}
        <div className="space-y-5">
          
          {/* ARCHIVED VOLUME AGGREGATES */}
          <div className="bg-white/[0.01] border border-white/[0.08] print:border-black/20 rounded-2xl p-5 space-y-4 shadow-xl print:shadow-none">
            <h3 className="text-xs font-bold text-white/50 print:text-black/50 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500/80" /> Lifetime Completed Items
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.01] border border-white/[0.06] print:border-black/10 rounded-xl p-3.5 text-left group hover:bg-white/[0.02] transition">
                <span className="text-[10px] text-white/40 print:text-black/50 block tracking-wider uppercase font-bold">Store Orders</span>
                <p className="text-2xl font-extrabold tracking-tight text-white print:text-black mt-1 group-hover:text-emerald-400 transition-colors">{safeData.completedOrdersCount}</p>
              </div>
              <div className="bg-white/[0.01] border border-white/[0.06] print:border-black/10 rounded-xl p-3.5 text-left group hover:bg-white/[0.02] transition">
                <span className="text-[10px] text-white/40 print:text-black/50 block tracking-wider uppercase font-bold">Custom Orders</span>
                <p className="text-2xl font-extrabold tracking-tight text-white print:text-black mt-1 group-hover:text-emerald-400 transition-colors">{safeData.completedInquiriesCount}</p>
              </div>
            </div>
          </div>

          {/* QUICK CHANNELS PANEL */}
          <div className="bg-white/[0.01] border border-white/[0.1] print:border-black/20 rounded-2xl p-5 space-y-4 shadow-2xl print:shadow-none print:break-inside-avoid">
            <h2 className="text-xs font-bold text-white/50 print:text-black/50 uppercase tracking-widest">
              Management Gateways
            </h2>
            
            <div className="space-y-2">
              <ShortcutButton 
                label="Product Catalog" 
                icon={Layers} 
                onClick={() => router.push("/admin/furniture")} 
              />

              <ShortcutButton 
                label="Custom Requests" 
                icon={FileText} 
                onClick={() => router.push("/admin/inquiry")}
                badge={safeData.activeInquiriesCount > 0 ? { text: `${safeData.activeInquiriesCount} Active`, variant: "warning" } : undefined}
              />

              <ShortcutButton 
                label="Store Checkout Orders" 
                icon={Package} 
                onClick={() => router.push("/admin/orders")}
                badge={safeData.activeOrdersCount > 0 ? { text: `${safeData.activeOrdersCount} Active`, variant: "info" } : undefined}
              />

              <ShortcutButton 
                label="Financial Reports" 
                icon={TrendingUp} 
                onClick={() => router.push("/admin/reports")} 
              />
            </div>

            <div className="border-t border-white/[0.04] print:border-black/10 pt-4 text-[10px] font-medium tracking-wider uppercase text-white/20 print:text-black/30 text-center">
              Secure Administrative Access
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

/* =========================================================
   SUB-COMPONENT: DASHBOARD CARD
========================================================= */
function DashboardCard({
  label,
  tone = "default",
  icon: IconComponent,
  children
}: {
  label: string;
  tone?: "default" | "warning";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  const containerStyles = tone === "warning"
    ? "border-[#D4A97A]/30 print:border-amber-600/40 text-[#D4A97A] print:text-amber-900 bg-gradient-to-b from-[#D4A97A]/[0.02] to-transparent hover:border-[#D4A97A]/50 shadow-[0_4px_20px_rgba(212,169,122,0.02)] print:shadow-none"
    : "border-white/[0.1] print:border-black/10 text-white print:text-black bg-gradient-to-b from-white/[0.02] to-transparent hover:border-white/20 shadow-lg print:shadow-none";

  const iconColors = tone === "warning" ? "text-[#D4A97A]/60 print:text-amber-700" : "text-white/30 print:text-black/40";

  return (
    <div className={`border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group break-inside-avoid ${containerStyles}`}>
      <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] print:border-black/10 pb-2.5 w-full">
        <p className="text-xs text-white/50 print:text-black/50 uppercase tracking-widest font-bold whitespace-normal break-words">{label}</p>
        <IconComponent size={14} className={`shrink-0 mt-0.5 transition-transform group-hover:scale-110 duration-200 ${iconColors}`} />
      </div>
      <div className="flex flex-col justify-end pt-4 min-h-[4rem] w-full">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   SUB-COMPONENT: SHORTCUT LINK BUTTON
========================================================= */
function ShortcutButton({
  label,
  icon: Icon,
  onClick,
  badge
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  badge?: { text: string; variant: "warning" | "info" };
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full px-4 py-3 rounded-xl bg-white/[0.01] border border-white/[0.06] print:border-black/10 hover:border-white/[0.15] hover:bg-white/[0.03] text-white/80 print:text-black/80 hover:text-white transition-all duration-200 flex items-center justify-between group gap-3 shadow-sm print:shadow-none"
    >
      <div className="flex items-center space-x-3 min-w-0">
        <Icon size={14} className="text-white/40 print:text-black/40 group-hover:text-[#D4A97A] print:group-hover:text-amber-800 transition-colors shrink-0" />
        <span className="font-semibold text-xs tracking-wide truncate">{label}</span>
      </div>
      <div className="flex items-center space-x-2 shrink-0">
        {badge && (
          <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${
            badge.variant === "warning" 
              ? "bg-[#D4A97A]/10 border-[#D4A97A]/30 text-[#D4A97A] print:bg-amber-100 print:border-amber-300 print:text-amber-800" 
              : "bg-blue-500/10 border-blue-500/30 text-blue-400 print:bg-blue-100 print:border-blue-300 print:text-blue-800"
          }`}>
            {badge.text}
          </span>
        )}
        <ArrowUpRight size={13} className="text-white/20 print:text-black/20 group-hover:text-white print:group-hover:text-black transition-all duration-200 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </button>
  );
}