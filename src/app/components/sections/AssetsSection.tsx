"use client";

import type { ImageUI } from "@/types/furniture-ui";

/* ========================================================= */

type AssetsState = {
  modelFile?: File;
  images: ImageUI[];
};

/* ========================================================= */

type Props = {
  state: AssetsState;

  setModelFile: (file?: File) => void;

  addImages: (files: FileList | null) => void;
  removeImage: (key: string) => void;
  setPrimaryImage: (key: string) => void;
};

/* ========================================================= */

export default function AssetsSection({
  state,
  setModelFile,
  addImages,
  removeImage,
  setPrimaryImage,
}: Props) {
  const images = state.images;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

      {/* HEADER */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Media Uploads
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Upload model files and product images
        </p>
      </div>

      {/* 3D MODEL */}
      <div className="pb-5 border-b border-gray-100 space-y-2">

        <label className="text-xs font-medium text-gray-600">
          3D Model
        </label>

        <input
          type="file"
          accept=".glb,.gltf,.obj"
          onChange={(e) =>
            setModelFile(e.target.files?.[0] ?? undefined)
          }
          className="w-full text-sm"
        />
      </div>

      {/* IMAGES */}
      <div className="space-y-4">

        <label className="text-xs font-medium text-gray-600">
          Product Images
        </label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => addImages(e.target.files)}
          className="w-full text-sm"
        />

        <div className="grid grid-cols-3 gap-4">

          {images
            .filter((i) => !i.isDeleted)
            .map((img) => {
              const key = img.id ?? img.clientId;

              return (
                <div
  key={key}
  className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white"
>

  {/* IMAGE */}
  <img
    src={img.url}
    className="h-28 w-full object-cover block"
    alt=""
  />

  {/* PRIMARY BADGE */}
  {img.isPrimary && (
    <span className="absolute top-2 left-2 z-20 text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-md">
      Thumbnail
    </span>
  )}

  {/* DELETE BUTTON */}
  <button
    onClick={() => removeImage(key)}
    className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-white border shadow-sm hover:text-red-600 flex items-center justify-center"
  >
    ✕
  </button>

  {/* HOVER OVERLAY */}
  <div
    className="
      absolute inset-0 z-10
      bg-black/40
      opacity-0 group-hover:opacity-100
      transition-opacity duration-200
      flex items-center justify-center
    "
  >
    <button
      onClick={() => setPrimaryImage(key)}
      className="bg-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-100"
    >
      Set Thumbnail
    </button>
  </div>

</div>
              );
            })}

        </div>
      </div>

    </div>
  );
}