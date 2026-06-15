"use client";

import { supabase } from "@/lib/supabase";
import type { FurnitureImagePayload } from "@/types/furniture";
import { upload, buildPaths, removeFiles } from "@/services/storageService";

/* =========================================================
   DEBUGGER
========================================================= */

const DEBUG_IMAGES = true;

function debug(...args: unknown[]) {
  if (!DEBUG_IMAGES) return;
  console.log("[FurnitureImages]", ...args);
}

/* =========================================================
   VALIDATION
   -------------------------------------------------------
   Images are optional at the service layer — the form hook
   enforces "at least one image" before buildPayload() is
   called.  We only guard against multiple primary flags here
   so the DB constraint is never violated.
========================================================= */

export function validateImages(images: FurnitureImagePayload[]) {
  const active = images.filter((i) => !i.isDeleted);

  debug("validateImages → active:", active.length, active);

  // Zero images is valid — the 3D model alone is sufficient.
  if (active.length === 0) return;

  const primaryCount = active.filter((i) => i.isPrimary).length;

  debug("primaryCount:", primaryCount);

  // If images exist, exactly one must be primary.
  if (primaryCount === 0) {
    throw new Error("At least one primary image is required.");
  }

  if (primaryCount > 1) {
    throw new Error("Only one primary image is allowed.");
  }
}

/* =========================================================
   KEY
========================================================= */

const getKey = (img: FurnitureImagePayload) =>
  img.id ?? img.image_url ?? "new";

/* =========================================================
   NORMALIZATION
========================================================= */

function normalizeImages(images: FurnitureImagePayload[]) {
  const active = images.filter((i) => !i.isDeleted);

  if (active.length === 0) return images;

  const existingPrimary = active.find((i) => i.id && i.isPrimary);

  const fallback =
    existingPrimary ??
    active.find((i) => i.isPrimary) ??
    active[0];

  debug("normalize → existingPrimary:", existingPrimary?.id);
  debug("normalize → fallback:", fallback ? getKey(fallback) : null);

  return images.map((img) => {
    if (img.isDeleted) return img;

    if (existingPrimary) {
      return {
        ...img,
        isPrimary: img.id === existingPrimary.id,
      };
    }

    return {
      ...img,
      isPrimary: getKey(img) === getKey(fallback),
    };
  });
}

/* =========================================================
   UPLOAD
========================================================= */

async function uploadImageFile(furnitureId: string, file: File) {
  const path = buildPaths.image(furnitureId, file);

  debug("uploading:", path);

  return upload(file, path);
}

/* =========================================================
   PRIMARY RESET
========================================================= */

async function resetPrimary(furnitureId: string) {
  debug("resetPrimary → furnitureId:", furnitureId);

  const { error } = await supabase
    .from("furniture_images")
    .update({ is_primary: false })
    .eq("furniture_id", furnitureId);

  if (error) {
    debug("resetPrimary ERROR:", error);
    throw error;
  }
}

/* =========================================================
   CREATE
========================================================= */

export async function createImages(
  furnitureId: string,
  images: FurnitureImagePayload[],
  hasExistingPrimary: boolean
) {
  const targets = images.filter((i) => i.file && !i.isDeleted);

  debug("createImages → targets:", targets.length);

  if (!targets.length) return;

  const rows = await Promise.all(
    targets.map(async (img, index) => {
      const url = await uploadImageFile(furnitureId, img.file!);

      return {
        furniture_id: furnitureId,
        image_url: url,
        sort_order: index,
        is_primary: hasExistingPrimary ? false : !!img.isPrimary,
      };
    })
  );

  debug("insert rows:", rows);

  const { error } = await supabase
    .from("furniture_images")
    .insert(rows);

  if (error) {
    console.error("❌ IMAGE INSERT ERROR:", error);
    throw error;
  }
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateImages(
  furnitureId: string,
  images: FurnitureImagePayload[]
) {
  debug("updateImages START");

  const toDelete = images.filter((i) => i.id && i.isDeleted);
  const toKeepRaw = images.filter((i) => !i.isDeleted);

  const fullNormalized = normalizeImages(toKeepRaw);

  // Only validate if there are images — validation is a no-op for
  // empty arrays (model-only furniture is permitted).
  validateImages(fullNormalized);

  /* ---------------- DELETE ---------------- */

  const deleteIds = toDelete.map((i) => i.id!).filter(Boolean);

  if (deleteIds.length) {
    debug("deleting:", deleteIds);

    const { data, error } = await supabase
      .from("furniture_images")
      .select("image_url")
      .in("id", deleteIds);

    if (error) throw error;

    if (data?.length) {
      await removeFiles(data.map((i) => i.image_url));
    }

    const { error: delError } = await supabase
      .from("furniture_images")
      .delete()
      .in("id", deleteIds);

    if (delError) throw delError;
  }

  /* ---------------- RESET PRIMARY ---------------- */

  await resetPrimary(furnitureId);

  /* ---------------- UPDATE EXISTING ---------------- */

  const existing = fullNormalized.filter((i) => i.id);

  await Promise.all(
    existing.map((img, index) =>
      supabase
        .from("furniture_images")
        .update({
          sort_order: index,
        })
        .eq("id", img.id!)
    )
  );

  /* ---------------- INSERT NEW ---------------- */

  const newImages = fullNormalized.filter(
    (i) => i.file && !i.id && !i.isDeleted
  );

  if (newImages.length) {
    debug("inserting new images:", newImages.length);

    await createImages(furnitureId, newImages, true);
  }

  /* ---------------- FINAL PRIMARY ---------------- */

  const finalPrimary =
    fullNormalized.find((i) => i.isPrimary && i.id)?.id ||
    existing[0]?.id ||
    null;

  debug("finalPrimary:", finalPrimary);

  if (finalPrimary) {
    const { error } = await supabase
      .from("furniture_images")
      .update({ is_primary: true })
      .eq("id", finalPrimary);

    if (error) throw error;
  }

  debug("updateImages END");
}