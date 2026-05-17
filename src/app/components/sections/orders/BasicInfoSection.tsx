"use client";

/* ========================================================= */

type OrderItemSnapshot = {
  id?: string;
  furniture_snapshot?: {
    id?: string;
    name?: string;
    description?: string | null;
    category?: string | null;
    model_url?: string | null;
    base_price?: number | null;
    width_cm?: number | null;
    depth_cm?: number | null;
    height_cm?: number | null;
  } | null;
};

type Props = {
  items?: OrderItemSnapshot[];
};

/* ========================================================= */

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value?: string | null;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-6">
      <span className="text-xs text-white/35 shrink-0">{label}</span>
      <span
        className="text-xs font-medium text-right"
        style={{ color: accent ? "#D4A97A" : "rgba(255,255,255,0.75)" }}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

/* ========================================================= */

export default function OrderBasicInfoSection({ items = [] }: Props) {
  if (!items.length) {
    return (
      <div
        className="rounded-2xl p-5 text-sm"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        No furniture snapshots available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const s = item.furniture_snapshot;

        if (!s) {
          return (
            <div
              key={item.id ?? index}
              className="rounded-2xl p-5 text-sm"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              Missing snapshot for item {index + 1}
            </div>
          );
        }

        const hasDimensions = s.width_cm || s.depth_cm || s.height_cm;

        return (
          <div
            key={item.id ?? index}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >

            {/* CARD HEADER */}
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {s.name ?? "Unnamed Item"}
                </h3>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(212,169,122,0.45)" }}>
                  Snapshot locked at order time
                </p>
              </div>
            </div>

            {/* ROWS */}
            <div className="px-5 py-4 space-y-3">
              <Row label="Category" value={s.category} />
              {s.description && (
                <Row label="Description" value={s.description} />
              )}
              <Row
                label="Base Price"
                value={`₱${Number(s.base_price ?? 0).toLocaleString()}`}
                accent
              />
              <Row
                label="Dimensions"
                value={
                  hasDimensions
                    ? `${s.width_cm ?? "—"} × ${s.depth_cm ?? "—"} × ${s.height_cm ?? "—"} cm`
                    : null
                }
              />
              <Row
                label="3D Model"
                value={s.model_url ? "Available" : "None"}
              />
            </div>

          </div>
        );
      })}
    </div>
  );
}