"use client";

type OrderItem = {
  id: string;

  furniture_snapshot?: {
    name?: string;
    images?: {
      url: string;
      isPrimary?: boolean;
    }[];
  } | null;
};

type Props = {
  items?: OrderItem[] | null;
};

export default function OrderAssetsSection({ items }: Props) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="border rounded-xl p-4 space-y-4">

      {/* HEADER */}
      <div>
        <h3 className="font-semibold text-gray-800">
          Order Snapshot Assets
        </h3>
        <p className="text-xs text-gray-500">
          Images grouped per order item (locked snapshots)
        </p>
      </div>

      {safeItems.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">
          No snapshot images available for this order
        </div>
      ) : (
        <div className="space-y-6">

          {safeItems.map((item, itemIndex) => {
            const images = item.furniture_snapshot?.images ?? [];

            const validImages = images.filter(
              (img) => img?.url && !img.url.includes(".glb")
            );

            if (!validImages.length) return null;

            return (
              <div key={item.id} className="space-y-2">

                {/* ITEM LABEL */}
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold">
                    Item {itemIndex + 1}
                  </p>

                  <p className="text-xs text-gray-500">
                    {item.furniture_snapshot?.name ?? "Unnamed"}
                  </p>
                </div>

                {/* IMAGES GRID */}
                <div className="grid grid-cols-2 gap-3">

                  {validImages.map((img, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="relative border rounded-lg overflow-hidden bg-gray-50"
                    >
                      <img
                        src={img.url}
                        alt={`Item ${itemIndex + 1} image ${index}`}
                        className="w-full h-28 object-cover"
                      />

                      {img.isPrimary && (
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
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
      )}
    </div>
  );
}