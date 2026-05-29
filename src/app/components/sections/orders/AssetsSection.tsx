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
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
            Order Assets
          </p>
          <p className="text-[10px] text-white/20 uppercase tracking-wider mt-0.5">
            Visual snapshots per item
          </p>
        </div>
      </div>

      {/* EMPTY STATE */}
      {safeItems.length === 0 && (
        <p className="text-sm text-white/25 italic">No images available.</p>
      )}

      {/* SNAPSHOT LIST */}
      <div className="space-y-5">
        {safeItems.map((item, i) => {
          const images = (item.furniture_snapshot?.images ?? []).filter(
            (img) => !!img?.url
          );

          if (!images.length) return null;

          return (
            <div key={item.id} className="space-y-2.5">
              {/* ITEM COMPONENT SUB-LABEL */}
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                  Item {i + 1}
                </span>
                <span className="text-xs font-medium text-white/50 max-w-[70%] truncate">
                  {item.furniture_snapshot?.name ?? "Unnamed"}
                </span>
              </div>

              {/* IMAGE GRID */}
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: img.isPrimary
                        ? "1.5px solid rgba(212,169,122,0.4)"
                        : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* PRIMARY BADGE */}
                    {img.isPrimary && (
                      <div
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold"
                        style={{
                          background: "rgba(212,169,122,0.2)",
                          border: "1px solid rgba(212,169,122,0.35)",
                          color: "#D4A97A",
                        }}
                      >
                        Main
                      </div>
                    )}

                    {/* HOVER OVERLAY */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: "rgba(212,169,122,0.06)" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}