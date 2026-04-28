"use client";

type Props = {
  snapshot?: {
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

export default function OrderBasicInfoSection({ snapshot }: Props) {
  if (!snapshot) {
    return (
      <div className="border rounded-xl p-4 text-sm text-gray-400">
        No furniture snapshot available
      </div>
    );
  }

  const w = snapshot.width_cm;
  const d = snapshot.depth_cm;
  const h = snapshot.height_cm;

  const hasDimensions = w || d || h;

  return (
    <div className="border rounded-xl p-4 space-y-3">

      <div>
        <h3 className="font-semibold">Furniture Snapshot</h3>
        <p className="text-xs text-gray-500">
          Locked at order time
        </p>
      </div>

      <div className="space-y-2 text-sm">

        <Row label="Name" value={snapshot.name} />
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
          <span className={snapshot.model_url ? "text-green-600" : "text-gray-400"}>
            {snapshot.model_url ? "Available" : "None"}
          </span>
        </div>

      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}