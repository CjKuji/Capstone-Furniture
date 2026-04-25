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
  savedConfigs: number;
}

/* =========================================================
   SIMPLE MEMORY CACHE
   Prevents flicker when switching tabs
========================================================= */

let dashboardCache: Stats | null = null;
let dashboardCacheTime = 0;

const CACHE_TTL = 1000 * 60 * 2; // 2 minutes

/* =========================================================
   PAGE
========================================================= */

export default function AdminDashboard() {
  /* =========================================================
     AUTH (CENTRALIZED)
     Layout handles auth + sidebar already
  ========================================================= */

  const { user } = useUser();

  /* =========================================================
     STATE
  ========================================================= */

  const [stats, setStats] = useState<Stats>(
    dashboardCache ?? {
      totalFurniture: 0,
      publishedFurniture: 0,
      totalUsers: 0,
      savedConfigs: 0,
    }
  );

  const [loading, setLoading] = useState(!dashboardCache);

  /* =========================================================
     LOAD DASHBOARD
     Cached → instant render
     Fresh fetch → silent refresh
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      const now = Date.now();

      const hasFreshCache =
        dashboardCache &&
        now - dashboardCacheTime < CACHE_TTL;

      /* -----------------------------------------
         Fresh cache hit → no loading flicker
      ----------------------------------------- */

      if (hasFreshCache) {
        setStats(dashboardCache!);
        setLoading(false);
        return;
      }

      /* -----------------------------------------
         First load only
      ----------------------------------------- */

      if (!dashboardCache) {
        setLoading(true);
      }

      try {
        const dashboardStats = await getAdminStats();

        if (!mounted) return;

        setStats(dashboardStats);

        /* -----------------------------------------
           Update cache
        ----------------------------------------- */

        dashboardCache = dashboardStats;
        dashboardCacheTime = Date.now();
      } catch (error) {
        console.error(
          "Failed to load dashboard stats:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="flex-1 p-10 space-y-8">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Admin Overview
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            {user?.email
              ? `Signed in as ${user.email}`
              : "System control center"}
          </p>
        </div>

        <div className="text-xs text-neutral-500">
          Live system status:{" "}
          <span className="text-emerald-600">
            Operational
          </span>
        </div>
      </div>

      {/* =====================================================
          KPI SECTION
          No blocking loader if cache exists
      ====================================================== */}

      {loading && !dashboardCache ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-neutral-200 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Furniture Items"
            value={stats.totalFurniture}
          />

          <KpiCard
            label="Published"
            value={stats.publishedFurniture}
            tone="success"
          />

          <KpiCard
            label="Users"
            value={stats.totalUsers}
          />

          <KpiCard
            label="Saved Configs"
            value={stats.savedConfigs}
            tone="muted"
          />
        </div>
      )}

      {/* =====================================================
          PANELS
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ================= SYSTEM ACTIVITY ================= */}

        <div className="lg:col-span-2 border rounded-xl bg-white p-5">
          <h2 className="text-sm font-semibold">
            System Activity
          </h2>

          <div className="mt-4 text-sm text-neutral-500">
            Activity feed placeholder
            (orders, edits, uploads, etc.)
          </div>
        </div>

        {/* ================= QUICK ACTIONS ================= */}

        <div className="border rounded-xl bg-white p-5">
          <h2 className="text-sm font-semibold">
            Quick Actions
          </h2>

          <div className="mt-4 space-y-2 text-sm">
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 transition">
              + Add Furniture
            </button>

            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 transition">
              View Orders
            </button>

            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 transition">
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
    default: "text-neutral-900",
    success: "text-emerald-600",
    muted: "text-neutral-500",
  };

  return (
    <div className="rounded-xl border bg-white p-5 hover:shadow-sm transition">
      <p className="text-xs text-neutral-500">
        {label}
      </p>

      <p
        className={`text-2xl font-semibold mt-2 ${toneStyles[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}