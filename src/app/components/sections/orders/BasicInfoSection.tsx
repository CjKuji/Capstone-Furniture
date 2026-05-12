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
      <div className="border rounded-xl p-4 text-sm text-gray-400">
        No furniture snapshots available
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {items.map((item, index) => {
        const snapshot = item.furniture_snapshot;

        if (!snapshot) {
          return (
            <div
              key={item.id ?? index}
              className="border rounded-xl p-4 text-sm text-gray-400"
            >
              No snapshot for item {index + 1}
            </div>
          );
        }

        const w = snapshot.width_cm;
        const d = snapshot.depth_cm;
        const h = snapshot.height_cm;

        const hasDimensions = w || d || h;

        return (
          <div
            key={item.id ?? index}
            className="border rounded-xl p-4 space-y-3 bg-white"
          >

            {/* HEADER */}
            <div>
              <h3 className="font-semibold">
                Item {index + 1} — {snapshot.name}
              </h3>

              <p className="text-xs text-gray-500">
                Snapshot locked at order time
              </p>
            </div>

            {/* CONTENT */}
            <div className="space-y-2 text-sm">

              <Row label="Category" value={snapshot.category} />
              <Row label="Description" value={snapshot.description} />

              <Row
                label="Base Price"
                value={`₱${Number(snapshot.base_price ?? 0).toLocaleString()}`}
              />

              <div className="flex justify-between">
                <span className="text-gray-500">Dimensions</span>
                <span>
                  {hasDimensions
                    ? `${w ?? "—"} × ${d ?? "—"} × ${h ?? "—"} cm`
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">3D Model</span>
                <span
                  className={
                    snapshot.model_url ? "text-green-600" : "text-gray-400"
                  }
                >
                  {snapshot.model_url ? "Available" : "None"}
                </span>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}

/*
=========================================================
ROW COMPONENT
=========================================================
*/
function Row({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}