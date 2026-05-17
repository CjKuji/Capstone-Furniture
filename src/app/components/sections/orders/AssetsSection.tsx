"use client";

/* ========================================================= */

type OrderItemSnapshot = {
  id: string;
  furniture_snapshot?: {
    name?: string;
    images?: { url: string; isPrimary?: boolean }[];
  } | null;
};

type Props = {
  items?: OrderItemSnapshot[] | null;
};

/* ========================================================= */

export default function OrderAssetsSection({ items }: Props) {
  const safe = Array.isArray(items) ? items : [];

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
        <div>
          <h3 className="text-sm font-semibold text-white">Order Assets</h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(212,169,122,0.5)" }}>
            Visual snapshots per item
          </p>
        </div>
      </div>

      {/* EMPTY */}
      {safe.length === 0 && (
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
          No images available
        </p>
      )}

      {/* ITEMS */}
      {safe.map((item, i) => {
        const images = (item.furniture_snapshot?.images ?? []).filter(
          (img) => !!img?.url
        );

        if (!images.length) return null;

        return (
          <div key={item.id} className="space-y-3">

            {/* ITEM LABEL */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50 uppercase tracking-widest">
                Item {i + 1}
              </span>
              <span className="text-xs text-white/30">
                {item.furniture_snapshot?.name ?? "Unnamed"}
              </span>
            </div>

            {/* IMAGE GRID */}
            <div className="grid grid-cols-2 gap-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative rounded-xl overflow-hidden aspect-video"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: img.isPrimary
                      ? "1.5px solid rgba(212,169,122,0.4)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />

                  {/* PRIMARY BADGE — parent is relative, this is correct */}
                  {img.isPrimary && (
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold"
                      style={{
                        background: "rgba(212,169,122,0.2)",
                        border: "1px solid rgba(212,169,122,0.35)",
                        color: "#D4A97A",
                      }}
                    >
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        );
      })}

    </div>
  );
}