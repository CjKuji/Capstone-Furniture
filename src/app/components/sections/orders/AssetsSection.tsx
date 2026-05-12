"use client";

type OrderItem = {
  id: string;
  furniture_snapshot?: {
    name?: string;
    images?: { url: string; isPrimary?: boolean }[];
  } | null;
};

type Props = {
  items?: OrderItem[] | null;
};

export default function OrderAssetsSection({ items }: Props) {
  const safe = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-2xl bg-white border border-[#E8D7C8] p-5 space-y-6">

      {/* HEADER */}
      <div>
        <h3 className="font-semibold text-[#3A2B22]">
          Order Assets
        </h3>
        <p className="text-xs text-[#7A6A5A]">
          Visual snapshots per item
        </p>
      </div>

      {safe.length === 0 ? (
        <div className="text-sm text-gray-400">
          No images available
        </div>
      ) : (
        safe.map((item, i) => {
          const images = item.furniture_snapshot?.images ?? [];
          const valid = images.filter((img) => img?.url);

          if (!valid.length) return null;

          return (
            <div key={item.id} className="space-y-3">

              {/* ITEM HEADER */}
              <div className="flex justify-between text-sm">
                <span className="font-medium text-[#3A2B22]">
                  Item {i + 1}
                </span>
                <span className="text-[#7A6A5A]">
                  {item.furniture_snapshot?.name ?? "Unnamed"}
                </span>
              </div>

              {/* GRID */}
              <div className="grid grid-cols-2 gap-3">
                {valid.map((img, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl overflow-hidden bg-[#FAF6F1] border border-[#E8D7C8]"
                  >
                    <img
                      src={img.url}
                      className="w-full h-28 object-cover"
                    />

                    {img.isPrimary && (
                      <div className="absolute mt-2 ml-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}