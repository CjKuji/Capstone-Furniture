"use client";

type VariantSnapshot = {
  id: string;
  name: string;
  preview_image_url?: string | null;
  texture_url?: string | null;
  price_adjustment?: number | null;
};

type Props = {
  variants: VariantSnapshot[];
  activeVariantId: string | null;
  setActiveVariantId: (id: string | null) => void;
};

export default function OrderVariantsSection({
  variants,
  activeVariantId,
  setActiveVariantId,
}: Props) {
  return (
    <div className="border rounded-xl p-4 space-y-4">

      <div>
        <h3 className="font-semibold">Variant Snapshot</h3>
        <p className="text-xs text-gray-500">
          Locked state at order time
        </p>
      </div>

      {variants.length === 0 ? (
        <div className="text-sm text-gray-400">
          No variant snapshot available
        </div>
      ) : (
        <div className="space-y-3">

          {variants.map((v) => {
            const active = activeVariantId === v.id;

            return (
              <div
                key={v.id}
                className={`flex items-center gap-4 p-3 border rounded-xl transition
                  ${active ? "border-black bg-gray-50" : "border-gray-200"}`}
              >

                <div className="w-12 h-12 rounded overflow-hidden border bg-white">
                  {v.preview_image_url ? (
                    <img
                      src={v.preview_image_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-[10px] text-gray-400 flex items-center justify-center h-full">
                      No Img
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium">{v.name}</div>
                  <div className="text-xs text-gray-500">
                    {v.price_adjustment
                      ? `+₱${v.price_adjustment}`
                      : "No price change"}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setActiveVariantId(active ? null : v.id)
                  }
                  className="text-xs px-3 py-1 border rounded"
                >
                  {active ? "Selected" : "Select"}
                </button>

              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}