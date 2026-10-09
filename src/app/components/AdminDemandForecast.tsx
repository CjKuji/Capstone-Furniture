"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw, TrendingUp } from "lucide-react";
import { getDemandAnalytics } from "@/services/demandAnalyticsService";
import type { DemandAnalytics } from "@/services/demandAnalyticsService";

function DemandChart({ analytics }: { analytics: DemandAnalytics }) {
  const max = Math.max(...analytics.monthlyDemand.map((month) => month.units), 1);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#12100d]/75 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white/85">Confirmed demand by month</h3>
          <p className="mt-1 text-[11px] text-white/40">
            Furniture units in orders with a successful payment. Each order is counted once.
          </p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/40">
          First payment date
        </span>
      </div>
      <div className="mt-5 flex h-44 items-end gap-3 sm:gap-5">
        {analytics.monthlyDemand.map((month) => {
          const height = month.units === 0 ? 4 : Math.max((month.units / max) * 100, 8);
          return (
            <div key={month.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[11px] font-semibold text-white/65">{month.units}</span>
              <div className="flex h-28 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-[#D4A97A]/75"
                  style={{ height: `${height}%` }}
                  title={`${month.month}${month.isCurrentMonth ? " (month to date)" : ""}: ${month.units} units`}
                />
              </div>
              <span className={`truncate text-[10px] ${month.isCurrentMonth ? "text-[#D4A97A]" : "text-white/35"}`}>
                {month.month}{month.isCurrentMonth ? "*" : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-white/30">* Current month is partial.</p>
    </section>
  );
}

function DemandShifts({ analytics }: { analytics: DemandAnalytics }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#12100d]/75 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-white/85">Designs gaining or losing demand</h3>
      <p className="mt-1 text-[11px] text-white/40">
        Each design/variant: last 3 complete months compared with the 3 before
      </p>
      {analytics.variantTrends.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/40">
          No confirmed design demand is available for these periods yet.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {analytics.variantTrends.slice(0, 5).map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-2 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white/75">{item.designName}</p>
                <p className="mt-0.5 truncate text-[10px] text-white/40">
                  {item.variantName} <span className="text-white/25">· Previous {item.previousUnits} → Recent {item.recentUnits}</span>
                </p>
              </div>
              <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${
                item.change > 0
                  ? "bg-emerald-400/10 text-emerald-300"
                  : item.change < 0
                    ? "bg-rose-300/10 text-rose-200"
                    : "bg-white/[0.04] text-white/45"
              }`}>
                {item.change > 0 ? "+" : ""}{item.change} units
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 rounded-lg bg-white/[0.025] px-3 py-2 text-[10px] leading-relaxed text-white/40">
        Example: 8 units in the previous period and 13 recently means demand is up by 5 units.
      </p>
    </section>
  );
}

export default function AdminDemandForecast() {
  const { data, error, isLoading, isFetching, refetch } = useQuery<DemandAnalytics, Error>({
    queryKey: ["admin", "demand-analytics"],
    queryFn: getDemandAnalytics,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#19140f] via-[#100c08] to-[#0d0a08] p-4 shadow-2xl shadow-black/20 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4A97A]/10 text-[#D4A97A]">
              <TrendingUp size={15} />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A97A]">
              Predictive Analytics
            </p>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Made-to-order demand</h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/45">
            Uses each order’s first successful payment as the demand date. Part payments count; unpaid, refunded, and canceled orders do not.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2.5 text-[11px] font-semibold text-white/60 transition hover:border-white/20 hover:bg-white/[0.07] disabled:opacity-50"
        >
          <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl border border-white/5 bg-white/[0.03]" />
          <div className="h-64 animate-pulse rounded-xl border border-white/5 bg-white/[0.03]" />
        </div>
      ) : error || !data ? (
        <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-4 text-xs text-red-100/70">
          Could not load demand analytics: {error?.message ?? "No analytics data was returned."}
        </div>
      ) : (
        <>
          <div className="grid gap-4 pt-5 lg:grid-cols-2">
            <DemandChart analytics={data} />
            <DemandShifts analytics={data} />
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#D4A97A]/15 bg-[#D4A97A]/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#D4A97A]/75">Estimated units for next month</p>
              {data.nextMonthForecast === null ? (
                <p className="mt-1 text-sm font-semibold text-white/65">Not enough order history yet</p>
              ) : (
                <p className="mt-1 text-xl font-bold text-[#D4A97A]">
                  {data.nextMonthForecast} <span className="text-xs font-medium text-white/45">units estimated</span>
                </p>
              )}
              <p className="mt-1 text-[10px] leading-relaxed text-white/35">
                {data.nextMonthForecast === null
                  ? "This estimate needs confirmed orders in at least two of the last three complete months."
                  : `It averages units from the last three complete months (${data.forecastMonthsUsed} month(s) had orders). For example, 10, 14, and 12 units average to 12. This is a rough planning estimate, not a guarantee.`}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-white/25">
            Payments missing a recorded payment date are excluded. Material availability and production lead times are not included.
          </p>
        </>
      )}
    </section>
  );
}
