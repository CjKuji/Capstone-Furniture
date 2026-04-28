"use client";

import type { ImageUI } from "@/types/furniture-ui";

type AssetsState = {
  images: ImageUI[];
};

type Props = {
  state: AssetsState;
};

export default function AssetsSection({ state }: Props) {
  const hasImages = state.images?.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

      {/* HEADER */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Media
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Product images
        </p>
      </div>

      {/* IMAGES */}
      <div>
        <label className="text-xs font-medium text-gray-600">
          Images
        </label>

        {!hasImages ? (
          <div className="mt-3 text-sm text-gray-400">
            No images available
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mt-3">

            {state.images
              .filter((i) => !i.isDeleted)
              .map((img) => {
                const key = img.id ?? img.clientId;

                return (
                  <div
                    key={key}
                    className="rounded-xl border overflow-hidden bg-white"
                  >
                    <img
                      src={img.url}
                      className="h-28 w-full object-cover"
                      alt=""
                    />

                    {img.isPrimary && (
                      <div className="text-[10px] bg-black text-white px-2 py-1">
                        Thumbnail
                      </div>
                    )}
                  </div>
                );
              })}

          </div>
        )}
      </div>

    </div>
  );
}