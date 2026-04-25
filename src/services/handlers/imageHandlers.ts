"use client";

import { supabase } from "@/lib/supabase";
import type { FurnitureImagePayload } from "@/types/furniture";
import { upload, buildPaths, removeFiles } from "@/services/storageService";

/* =========================================================
   VALIDATION
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
   KEY
========================================================= */

const getKey = (img: FurnitureImagePayload) =>
  img.id ?? img.image_url ?? "new";

/* =========================================================
   NORMALIZATION (NO DB SIDE EFFECTS)
========================================================= */

function normalizeImages(images: FurnitureImagePayload[]) {
  const active = images.filter(i => !i.isDeleted);

  if (active.length === 0) return images;

  const existingPrimary = active.find(i => i.id && i.isPrimary);

  const fallback =
    existingPrimary ??
    active.find(i => i.isPrimary) ??
    active[0];

  return images.map(img => {
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
  return upload(file, path);
}

/* =========================================================
   PRIMARY RESET (SAFE)
========================================================= */

async function resetPrimary(furnitureId: string) {
  const { error } = await supabase
    .from("furniture_images")
    .update({ is_primary: false })
    .eq("furniture_id", furnitureId);

  if (error) throw error;
}

/* =========================================================
   CREATE (NO BUSINESS LOGIC INSIDE)
========================================================= */

export async function createImages(
  furnitureId: string,
  images: FurnitureImagePayload[],
  hasExistingPrimary: boolean
) {
  const targets = images.filter(i => i.file && !i.isDeleted);

  if (!targets.length) return;

  const rows = await Promise.all(
    targets.map(async (img, index) => {
      const url = await uploadImageFile(furnitureId, img.file!);

      return {
        furniture_id: furnitureId,
        image_url: url,
        sort_order: index,

        // 🔥 CRITICAL FIX
        is_primary: hasExistingPrimary ? false : !!img.isPrimary,
      };
    })
  );

  const { error } = await supabase
    .from("furniture_images")
    .insert(rows);

  if (error) {
    console.error("❌ IMAGE INSERT ERROR:", error);
    throw error;
  }
}

/* =========================================================
   UPDATE (ATOMIC PRIMARY RESOLUTION)
========================================================= */

export async function updateImages(
  furnitureId: string,
  images: FurnitureImagePayload[]
) {
  const toDelete = images.filter(i => i.id && i.isDeleted);
  const toKeepRaw = images.filter(i => !i.isDeleted);

  const fullNormalized = normalizeImages(toKeepRaw);

  validateImages(fullNormalized);

  /* ---------------- DELETE ---------------- */

  const deleteIds = toDelete.map(i => i.id!).filter(Boolean);

  if (deleteIds.length) {
    const { data, error } = await supabase
      .from("furniture_images")
      .select("image_url")
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

  /* =========================================================
     🔥 STEP 1: REMOVE PRIMARY FROM ALL (TEMP STATE SAFE)
  ========================================================= */

  await resetPrimary(furnitureId);

  /* =========================================================
     🔥 STEP 2: UPDATE EVERYTHING EXCEPT PRIMARY FLAG
  ========================================================= */

  const existing = fullNormalized.filter(i => i.id);

  await Promise.all(
    existing.map((img, index) =>
      supabase
        .from("furniture_images")
        .update({
          sort_order: index,
          // ❌ DO NOT set is_primary here
        })
        .eq("id", img.id!)
    )
  );

  /* =========================================================
     🔥 STEP 3: INSERT NEW (ALWAYS NON-PRIMARY)
  ========================================================= */

  const newImages = fullNormalized.filter(
    i => i.file && !i.id && !i.isDeleted
  );

  if (newImages.length) {
    await createImages(
      furnitureId,
      newImages,
      true // 🔥 existing primary always exists at this point
    );
  }

  /* =========================================================
     🔥 STEP 4: SET FINAL PRIMARY ONCE (SOURCE OF TRUTH)
  ========================================================= */

  const finalPrimary =
    fullNormalized.find(i => i.isPrimary && i.id)?.id ||
    existing[0]?.id ||
    null;

  if (finalPrimary) {
    const { error } = await supabase
      .from("furniture_images")
      .update({ is_primary: true })
      .eq("id", finalPrimary);

    if (error) throw error;
  }
}