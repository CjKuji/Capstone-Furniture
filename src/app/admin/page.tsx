"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminDashboardStats, AdminDashboardData } from "@/services/dashboardService";
import { useUser } from "@/hooks/useUser";
import { 
  FileText, 
  Hammer, 
  Layers, 
  Truck, 
  Package, 
  ChevronRight, 
  TrendingUp, 
  Activity, 
  Coins,
  CheckCircle2
} from "lucide-react";

/* =========================================================
   SIMPLE CACHE BOUNDARIES
========================================================= */
let dashboardCache: AdminDashboardData | null = null;
let dashboardCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 2; // 2 minutes

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

  const [data, setData] = useState<AdminDashboardData>(
    dashboardCache ?? {
      pendingQuotes: 0,
      unreadMessages: 0,
      paidAwaitingProduction: 0,
      totalFurnitureCatalogCount: 0,
      completedOrdersCount: 0,
      completedInquiriesCount: 0,
      activeProduction: 0,
      partiallyPaidQueue: { readyForPickupCount: 0, readyForDeliveryCount: 0 },
      fullyPaidQueue: { readyForPickupCount: 0, readyForDeliveryCount: 0 },
      recentActivity: [],
    }
  );

  const [loading, setLoading] = useState(!dashboardCache);

  /* =========================================================
      DATA FETCHING
  ========================================================= */
  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      const now = Date.now();
      
      // Explicitly check for cache existence here to satisfy TypeScript's type guard
      if (dashboardCache && now - dashboardCacheTime < CACHE_TTL) {
        setData(dashboardCache);
        setLoading(false);
        return;
      }

      if (!dashboardCache) setLoading(true);

      try {
        const stats = await getAdminDashboardStats();
        if (!mounted) return;

        setData(stats);
        dashboardCache = stats;
        dashboardCacheTime = Date.now();
      } catch (err) {
        console.error("DASHBOARD_UI_LOAD_ERROR", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
      UI RENDER
  ========================================================= */
  return (
    <main className="min-h-screen bg-[#0F0A06] text-white p-6 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex items-end justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Operational Command Center
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {email ? `Logged in as ${email}` : "System live monitor"}
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-white/30 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live Store Status: <span className="text-emerald-400 font-medium">Operational</span></span>
        </div>
      </div>

      {/* METRIC BADGES GRID */}
      {loading && !dashboardCache ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <KpiCard 
            label="Pending Custom Quotes" 
            value={data.pendingQuotes} 
            subtext="Inquiries waiting for a price quote"
            tone={data.pendingQuotes > 0 ? "warning" : "default"}
            icon={FileText}
          />

          {/* COMPLETED TRANSACTIONS COMPACT HUB */}
          <div className="border rounded-2xl p-4 bg-white/[0.01] border-white/5 hover:border-white/10 transition flex flex-col justify-between h-32">
            <div className="flex items-start justify-between border-b border-white/5 pb-1.5">
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Completed Transactions</p>
              <CheckCircle2 size={15} className="text-emerald-500/50" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-left pt-2">
              <div className="border-r border-white/5 pr-2">
                <span className="text-[10px] text-white/30 block tracking-tight">Store Orders</span>
                <p className="text-2xl font-bold tracking-tight text-white/90">{data.completedOrdersCount}</p>
              </div>
              <div className="pl-1">
                <span className="text-[10px] text-white/30 block tracking-tight">Custom Requests</span>
                <p className="text-2xl font-bold tracking-tight text-white/90">{data.completedInquiriesCount}</p>
              </div>
            </div>
          </div>

          <KpiCard 
            label="Pending Production" 
            value={data.paidAwaitingProduction} 
            subtext="Paid orders waiting to be built"
            tone={data.paidAwaitingProduction > 0 ? "warning" : "default"}
            icon={Hammer}
          />

          <KpiCard 
            label="Total Furniture Listed" 
            value={data.totalFurnitureCatalogCount} 
            subtext="Active items on your live catalog"
            tone="default"
            icon={Layers}
          />
        </div>
      )}

      {/* WORKSHOP & DISPATCH STATUS BLOCK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* ACTIVE PRODUCTION */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between group hover:border-white/10 transition">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">Active Production Floor</h3>
              <p className="text-3xl font-bold mt-2 text-amber-500">{loading ? "..." : data.activeProduction}</p>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Hammer size={18} className="group-hover:rotate-12 transition duration-200" />
            </div>
          </div>
          <p className="text-xs text-white/30 mt-4">Total pieces currently being built in the workshop right now.</p>
        </div>

        {/* LOGISTICS: PARTIALLY PAID STAGING */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between group hover:border-white/10 transition border-l-amber-500/10">
          <div className="flex items-start justify-between">
            <div className="w-full">
              <div className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">Balances Due (Partially Paid)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <Truck size={12} className="text-amber-400" /> Ready for Transit
                  </p>
                  <p className="text-xl font-semibold mt-0.5 text-white">{loading ? "..." : data.partiallyPaidQueue.readyForDeliveryCount}</p>
                  <span className="text-[10px] text-white/30 block mt-0.5">Collect on delivery</span>
                </div>
                <div>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <Package size={12} className="text-purple-400" /> Ready to Complete
                  </p>
                  <p className="text-xl font-semibold mt-0.5 text-white">{loading ? "..." : data.partiallyPaidQueue.readyForPickupCount}</p>
                  <span className="text-[10px] text-white/30 block mt-0.5">Collect on pickup</span>
                </div>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 text-amber-400/60">
              <Coins size={16} />
            </div>
          </div>
          <p className="text-xs text-white/30 mt-4">Finished items requiring balance collection during handover steps.</p>
        </div>

        {/* LOGISTICS: FULLY PAID STAGING */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between group hover:border-white/10 transition border-l-emerald-500/10">
          <div className="flex items-start justify-between">
            <div className="w-full">
              <div className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">Cleared Items (Fully Paid)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <Truck size={12} className="text-emerald-400" /> Safe to Dispatch
                  </p>
                  <p className="text-xl font-semibold mt-0.5 text-white">{loading ? "..." : data.fullyPaidQueue.readyForDeliveryCount}</p>
                  <span className="text-[10px] text-white/30 block mt-0.5">Fully paid delivery</span>
                </div>
                <div>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <Package size={12} className="text-purple-400" /> Safe to Release
                  </p>
                  <p className="text-xl font-semibold mt-0.5 text-white">{loading ? "..." : data.fullyPaidQueue.readyForPickupCount}</p>
                  <span className="text-[10px] text-white/30 block mt-0.5">Fully paid pickup</span>
                </div>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 text-emerald-400/60">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-xs text-white/30 mt-4">Fully cleared orders. These items can leave your inventory immediately.</p>
        </div>

      </div>

      {/* LOWER PANEL INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* RECENT TIMELINE STREAM LOGS */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
            <Activity size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Real-Time System Activity Feed
            </h2>
          </div>

          <div className="mt-4 space-y-3">
            {loading && data.recentActivity.length === 0 ? (
              <p className="text-xs text-white/30 animate-pulse py-4">Syncing up live store updates...</p>
            ) : data.recentActivity.length === 0 ? (
              <p className="text-xs text-white/30 py-4">No recent activity found today.</p>
            ) : (
              data.recentActivity.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3 text-sm hover:bg-white/[0.04] transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        log.type === "catalog_order" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        log.type === "custom_inquiry" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {log.type === "catalog_order" ? "Store Order" : log.type === "custom_inquiry" ? "Custom Request" : "Payment"}
                      </span>
                      <span className="font-medium text-white/90">{log.title}</span>
                    </div>
                    <p className="text-xs text-white/50">{log.description}</p>
                  </div>

                  <div className="text-right space-y-1">
                    {log.amount !== undefined && log.amount > 0 && (
                      <p className="font-semibold text-white text-xs">₱{log.amount.toLocaleString()}</p>
                    )}
                    <p className="text-[10px] text-white/30 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* OPERATIONAL NAVIGATION CONTROLS */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Quick Shortcuts & Modules
            </h2>
            <p className="text-xs text-white/40 mt-1 mb-4">Direct links to manage different system data</p>
            
            <div className="space-y-2 text-sm">
              <button 
                onClick={() => router.push("/admin/furniture")}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-white/80 transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <Layers size={16} className="text-white/40 group-hover:text-white transition" />
                  <span className="font-medium">Furniture Catalog</span>
                </div>
                <ChevronRight size={14} className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition" />
              </button>

              <button 
                onClick={() => router.push("/admin/inquiry")}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-white/80 transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <FileText size={16} className="text-white/40 group-hover:text-white transition" />
                  <span className="font-medium">Custom Inquiries</span>
                </div>
                <div className="flex items-center space-x-2">
                  {data.pendingQuotes > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      {data.pendingQuotes} Pricing
                    </span>
                  )}
                  <ChevronRight size={14} className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition" />
                </div>
              </button>

              <button 
                onClick={() => router.push("/admin/orders")}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-white/80 transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <Package size={16} className="text-white/40 group-hover:text-white transition" />
                  <span className="font-medium">Catalog Orders</span>
                </div>
                <div className="flex items-center space-x-2">
                  {data.paidAwaitingProduction > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      {data.paidAwaitingProduction} Paid
                    </span>
                  )}
                  <ChevronRight size={14} className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition" />
                </div>
              </button>

              <button 
                onClick={() => router.push("/admin/reports")}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-white/80 transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <TrendingUp size={16} className="text-white/40 group-hover:text-white transition" />
                  <span className="font-medium">Financial Reports</span>
                </div>
                <ChevronRight size={14} className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6 text-[10px] text-white/20 font-mono text-center">
            Secured Admin Workspace Session Active
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   SUB-COMPONENT: FIXED KPI CONTAINER CARD WITH FLEX LAYOUT
========================================================= */
function KpiCard({
  label,
  value,
  subtext,
  tone = "default",
  icon: IconComponent,
}: {
  label: string;
  value: number;
  subtext: string;
  tone?: "default" | "warning" | "danger";
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const toneStyles = {
    default: "text-white border-white/5 hover:border-white/10",
    warning: "text-amber-400 border-amber-500/20 bg-amber-500/[0.01] hover:border-amber-500/30",
    danger: "text-rose-400 border-rose-500/20 bg-rose-500/[0.01] hover:border-rose-500/30",
  };

  const iconColors = {
    default: "text-white/30",
    warning: "text-amber-500/40",
    danger: "text-rose-500/40",
  };

  return (
    <div className={`border rounded-2xl p-4 transition flex flex-col justify-between h-32 bg-white/[0.01] ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-white/40 uppercase tracking-wider font-medium truncate">{label}</p>
        <IconComponent size={15} className={`shrink-0 ${iconColors[tone]}`} />
      </div>
      
      <div className="flex flex-col justify-end mt-auto pt-2">
        <p className="text-3xl font-bold tracking-tight leading-none text-white">{value}</p>
        <p className="text-[10px] text-white/30 tracking-tight mt-1 truncate">{subtext}</p>
      </div>
    </div>
  );
}