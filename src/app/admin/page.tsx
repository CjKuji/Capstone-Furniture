"use client";

import { useEffect, useState } from "react";
import { getAdminStats } from "@/services/dashboardService";
import { useUser } from "@/hooks/useUser";

/* =========================================================
   TYPES
========================================================= */

interface Stats {
  totalFurniture: number;
  publishedFurniture: number;
  totalUsers: number;
}

/* =========================================================
   SIMPLE CACHE
========================================================= */

let dashboardCache: Stats | null = null;
let dashboardCacheTime = 0;

const CACHE_TTL = 1000 * 60 * 2;

/* =========================================================
   PAGE
========================================================= */

export default function AdminDashboard() {
  const { user } = useUser();

  const email =
    (user as any)?.email ??
    (user as any)?.profile?.email ??
    null;

  const [stats, setStats] = useState<Stats>(
    dashboardCache ?? {
      totalFurniture: 0,
      publishedFurniture: 0,
      totalUsers: 0,
    }
  );

  const [loading, setLoading] = useState(!dashboardCache);

  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const now = Date.now();

      const hasFreshCache =
        dashboardCache &&
        now - dashboardCacheTime < CACHE_TTL;

      if (hasFreshCache) {
        setStats(dashboardCache!);
        setLoading(false);
        return;
      }

      if (!dashboardCache) setLoading(true);

      try {
        const data = await getAdminStats();
        if (!mounted) return;

        // Clean up the structural properties assigned to the state and cache boundaries
        const formattedData: Stats = {
          totalFurniture: data?.totalFurniture ?? 0,
          publishedFurniture: data?.publishedFurniture ?? 0,
          totalUsers: data?.totalUsers ?? 0,
        };

        setStats(formattedData);

        dashboardCache = formattedData;
        dashboardCacheTime = Date.now();
      } catch (err) {
        console.error("DASHBOARD_ERROR", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#0F0A06] text-white p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-end justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Overview
          </h1>

          <p className="text-sm text-white/40 mt-1">
            {email ? `Signed in as ${email}` : "System control center"}
          </p>
        </div>

        <div className="text-xs text-white/30">
          Live system status:{" "}
          <span className="text-emerald-400">Operational</span>
        </div>
      </div>

      {/* KPI GRID (Reconfigured for 3 items instead of 4) */}
      {loading && !dashboardCache ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-white/5 border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <KpiCard label="Furniture Items" value={stats.totalFurniture} />

          <KpiCard
            label="Published"
            value={stats.publishedFurniture}
            tone="success"
          />

          <KpiCard label="Users" value={stats.totalUsers} />

        </div>
      )}

      {/* PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ACTIVITY */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white">
            System Activity
          </h2>

          <div className="mt-4 text-sm text-white/40">
            Activity feed placeholder
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white">
            Quick Actions
          </h2>

          <div className="mt-4 space-y-2 text-sm">

            <button className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition">
              + Add Furniture
            </button>

            <button className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition">
              View Orders
            </button>

            <button className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition">
              Manage Users
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   KPI CARD
========================================================= */

function KpiCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "muted";
}) {
  const toneStyles = {
    default: "text-white",
    success: "text-emerald-400",
    muted: "text-white/50",
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
      <p className="text-xs text-white/40">{label}</p>

      <p className={`text-2xl font-semibold mt-2 ${toneStyles[tone]}`}>
        {value}
      </p>
    </div>
  );
}