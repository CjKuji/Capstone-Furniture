"use client";

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

export default function OrderBasicInfoSection({ items = [] }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-gray-400">
        No furniture snapshots available
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {items.map((item, index) => {
        const s = item.furniture_snapshot;

        if (!s) {
          return (
            <div
              key={item.id ?? index}
              className="rounded-2xl bg-white p-5 text-sm text-gray-400"
            >
              Missing snapshot for item {index + 1}
            </div>
          );
        }

        const dims =
          s.width_cm || s.depth_cm || s.height_cm;

        return (
          <div
            key={item.id ?? index}
            className="rounded-2xl bg-white border border-[#E8D7C8] overflow-hidden"
          >

            {/* HEADER */}
            <div className="px-5 py-4 border-b border-[#F3E6DA] bg-[#FAF6F1]">
              <h3 className="font-semibold text-[#3A2B22]">
                {s.name ?? "Unnamed Item"}
              </h3>

              <p className="text-xs text-[#7A6A5A] mt-1">
                Snapshot locked at order time
              </p>
            </div>

            {/* CONTENT */}
            <div className="p-5 space-y-3 text-sm">

              <Row label="Category" value={s.category} />
              <Row label="Description" value={s.description} />

              <Row
                label="Base Price"
                value={`₱${Number(s.base_price ?? 0).toLocaleString()}`}
              />

              <Row
                label="Dimensions"
                value={
                  dims
                    ? `${s.width_cm ?? "—"} × ${s.depth_cm ?? "—"} × ${s.height_cm ?? "—"} cm`
                    : "—"
                }
              />

              <Row
                label="3D Model"
                value={s.model_url ? "Available" : "None"}
                valueClass={s.model_url ? "text-green-600" : "text-gray-400"}
              />

            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = "text-[#3A2B22]",
}: {
  label: string;
  value?: any;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-[#7A6A5A]">{label}</span>
      <span className={`font-medium text-right ${valueClass}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}