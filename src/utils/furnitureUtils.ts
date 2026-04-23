"use client";

/* =========================================================
   FILE PREVIEW
========================================================= */

export function createFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeFilePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/* =========================================================
   UI IMAGE MODEL (SINGLE SOURCE OF TRUTH)
========================================================= */

export type ImageItem = {
  id?: string;
  file?: File;
  url: string;
  isPrimary: boolean;
  isDeleted?: boolean;
};

/* =========================================================
   IMAGE HELPERS
========================================================= */

export function ensurePrimaryImage<T extends { isPrimary: boolean }>(
  items: T[]
): T[] {
  if (!items.length) return items;

  const hasPrimary = items.some((i) => i.isPrimary);

  if (hasPrimary) return items;

  return items.map((item, i) => ({
    ...item,
    isPrimary: i === 0,
  }));
}

/* =========================================================
   DB → UI MAPPER (SAFE + CONSISTENT)
========================================================= */

import type { FurnitureItemAdmin } from "@/types/furniture";

export function mapFurnitureImages(
  item: FurnitureItemAdmin | null
): ImageItem[] {
  if (!item?.furniture_images?.length) return [];

  return item.furniture_images.map((img, i) => ({
    id: img.id,
    file: undefined,
    url: img.image_url,
    isPrimary: img.is_primary ?? i === 0,
  }));
}