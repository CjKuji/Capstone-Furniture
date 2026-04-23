"use client";

import { supabase } from "@/lib/supabase";
import type { FurnitureImagePayload } from "@/types/furniture";
import { upload, buildPaths, removeFiles } from "@/services/storageService";

/* =========================================================
   VALIDATION (DB STATE ONLY)
========================================================= */

export function validateImages(images: FurnitureImagePayload[]) {
  const active = images.filter(i => !i.isDeleted);

  if (active.length === 0) {
    throw new Error("At least one image is required.");
  }

  const primaryCount = active.filter(i => i.isPrimary).length;

  if (primaryCount === 0) {
    throw new Error("At least one primary image is required.");
  }

  if (primaryCount > 1) {
    throw new Error("Only one primary image is allowed.");
  }
}

/* =========================================================
   STABLE KEY (IMPORTANT FIX)
========================================================= */

const getKey = (img: FurnitureImagePayload) =>
  img.id ?? img.image_url ?? "new";

/* =========================================================
   NORMALIZATION (SAFE + DETERMINISTIC)
========================================================= */

function normalizeImages(images: FurnitureImagePayload[]) {
  const active = images.filter(i => !i.isDeleted);

  if (active.length === 0) return images;

  const primary =
    active.find(i => i.isPrimary) ?? active[0];

  const primaryKey = getKey(primary);

  return images.map(img => {
    if (img.isDeleted) return img;

    return {
      ...img,
      isPrimary: getKey(img) === primaryKey,
    };
  });
}

/* =========================================================
   UPLOAD
========================================================= */

async function uploadImageFile(furnitureId: string, file: File) {
  const path = buildPaths.image(furnitureId, file);
  return upload(file, path);
}

/* =========================================================
   CREATE
========================================================= */

export async function createImages(
  furnitureId: string,
  images: FurnitureImagePayload[]
) {
  const normalized = normalizeImages(images);
  validateImages(normalized);

  const targets = normalized.filter(i => i.file && !i.isDeleted);

  const rows = await Promise.all(
    targets.map(async (img, index) => {
      const url = await uploadImageFile(furnitureId, img.file!);

      return {
        furniture_id: furnitureId,
        image_url: url,
        sort_order: index,
        is_primary: !!img.isPrimary,
      };
    })
  );

  if (!rows.length) return;

  const { error } = await supabase
    .from("furniture_images")
    .insert(rows);

  if (error) throw error;
}

/* =========================================================
   UPDATE (FIXED + SAFE ORDERING)
========================================================= */

export async function updateImages(
  furnitureId: string,
  images: FurnitureImagePayload[]
) {
  /* -------------------------
     SPLIT STATE
  ------------------------- */

  const toDelete = images.filter(i => i.id && i.isDeleted);
  const toKeepRaw = images.filter(i => !i.isDeleted);

  /* -------------------------
     NORMALIZE FIRST (IMPORTANT FIX)
  ------------------------- */

  const normalizedKeep = normalizeImages(toKeepRaw);

  /* -------------------------
     VALIDATE FINAL STATE
  ------------------------- */

  validateImages(normalizedKeep);

  /* -------------------------
     DELETE (DB + STORAGE)
  ------------------------- */

  const deleteIds = toDelete.map(i => i.id!).filter(Boolean);

  if (deleteIds.length) {
    const { data, error } = await supabase
      .from("furniture_images")
      .select("id, image_url")
      .in("id", deleteIds);

    if (error) throw error;

    if (data?.length) {
      await removeFiles(data.map(i => i.image_url));
    }

    const { error: delError } = await supabase
      .from("furniture_images")
      .delete()
      .in("id", deleteIds);

    if (delError) throw delError;
  }

  /* -------------------------
     UPDATE EXISTING ROWS
  ------------------------- */

  const existing = normalizedKeep.filter(i => i.id);

  await Promise.all(
    existing.map((img, index) =>
      supabase
        .from("furniture_images")
        .update({
          is_primary: !!img.isPrimary,
          sort_order: index,
        })
        .eq("id", img.id!)
    )
  );

  /* -------------------------
     INSERT NEW ROWS
  ------------------------- */

  const newImages = normalizedKeep.filter(i => !i.id && i.file);

  if (newImages.length) {
    await createImages(furnitureId, newImages);
  }
}