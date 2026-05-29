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

export default function OrderBasicInfoSection({ items = [] }: Props) {
  if (!items.length) {
    return (
      <p className="text-sm text-white/25 italic">No furniture snapshots available.</p>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item, index) => {
        const s = item.furniture_snapshot;

        if (!s) {
          return (
            <div
              key={item.id ?? index}
              className="px-4 py-3 rounded-xl text-xs text-white/25 italic"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              Missing historical snapshot data for Item {index + 1}
            </div>
          );
        }

        const hasDimensions =
          s.width_cm !== null &&
          s.width_cm !== undefined ||
          s.depth_cm !== null &&
          s.depth_cm !== undefined ||
          s.height_cm !== null &&
          s.height_cm !== undefined;

        return (
          <div key={item.id ?? index} className="space-y-4">
            {/* SUB HEADER */}
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                  {s.name ?? "Unnamed Item"}
                </p>
                <p className="text-[10px] text-white/20 uppercase tracking-wider mt-0.5">
                  Snapshot locked at order time
                </p>
              </div>
            </div>

            {/* DESCRIPTION */}
            {s.description ? (
              <p className="text-sm text-white/60 leading-relaxed">
                {s.description}
              </p>
            ) : (
              <p className="text-sm text-white/25 italic">No description provided.</p>
            )}

            {/* META DATA INFORMATION GRID */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Category</p>
                <p className="text-sm font-medium text-white capitalize">{s.category ?? "Uncategorized"}</p>
              </div>

              <div
                className="px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Base Price</p>
                <p className="text-sm font-semibold" style={{ color: "#D4A97A" }}>
                  {s.base_price != null ? `₱${Number(s.base_price).toLocaleString()}` : "—"}
                </p>
              </div>
            </div>

            {/* STRUCTURAL EXTRA INFO: DIMENSIONS & 3D AVAILABILITY */}
            <div className="grid grid-cols-2 gap-3">
              {hasDimensions && (
                <div
                  className="px-4 py-3 rounded-xl col-span-1"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
                    Dimensions (cm)
                  </p>
                  <div className="flex items-center gap-2.5 text-sm text-white/70">
                    <span>
                      <span className="text-xs text-white/30 mr-1">W</span>
                      {s.width_cm ?? "—"}
                    </span>
                    <span className="text-white/20">×</span>
                    <span>
                      <span className="text-xs text-white/30 mr-1">D</span>
                      {s.depth_cm ?? "—"}
                    </span>
                    <span className="text-white/20">×</span>
                    <span>
                      <span className="text-xs text-white/30 mr-1">H</span>
                      {s.height_cm ?? "—"}
                    </span>
                  </div>
                </div>
              )}

              <div
                className={`px-4 py-3 rounded-xl ${hasDimensions ? "col-span-1" : "col-span-2"}`}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">3D Assets</p>
                <p className="text-sm font-medium text-white">
                  {s.model_url ? "Production Model Ready" : "None Provided"}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}