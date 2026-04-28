"use client";

type Props = {
  images?: {
    id: string;
    url: string;
    isPrimary?: boolean;
  }[] | null;
};

export default function OrderAssetsSection({ images }: Props) {
  const safeImages = Array.isArray(images) ? images : [];

  return (
    <div className="border rounded-xl p-4 space-y-4">

      <div>
        <h3 className="font-semibold text-gray-800">
          Order Snapshot Assets
        </h3>
        <p className="text-xs text-gray-500">
          Combined locked images from all order items
        </p>
      </div>

      {safeImages.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">
          No snapshot images available for this order
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">

          {safeImages.map((img, index) => {
            if (!img?.url) return null;

            const isGlb = img.url.includes(".glb");
            if (isGlb) return null;

            return (
              <div
                key={img.id}
                className="relative border rounded-lg overflow-hidden bg-gray-50"
              >
                <img
                  src={img.url}
                  alt={`Order asset ${index}`}
                  className="w-full h-28 object-cover"
                />

                {img.isPrimary && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}