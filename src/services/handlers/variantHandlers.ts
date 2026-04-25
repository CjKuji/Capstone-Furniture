"use client";

import { supabase } from "@/lib/supabase";
import type {
  FurnitureVariantPayload,
  FurnitureVariantInsert,
} from "@/types/furniture";
import { upload, buildPaths, removeFiles } from "@/services/storageService";

/* =========================================================
   DEBUG LOGGER
========================================================= */

const DEBUG = true;

function log(step: string, data?: unknown) {
  if (!DEBUG) return;
  console.log(`[VARIANT:${step}]`, data);
}

/* =========================================================
   VALIDATION (VARIANT IS OPTIONAL NOW)
========================================================= */

export function validateVariants(variants: FurnitureVariantPayload[]) {
  const active = variants.filter((v) => !v.isDeleted);

  log("VALIDATE_INPUT", {
    total: variants.length,
    active: active.length,
    activeData: active,
  });

  // 🔥 UPDATED: variants are optional
  // only validate if user actually provided something meaningful
  if (variants.length === 0) {
    log("VALIDATE_SKIP_EMPTY");
    return;
  }

  // if everything is deleted → allow it
  if (active.length === 0) {
    log("VALIDATE_ALL_DELETED_ALLOWED");
    return;
  }
}

/* =========================================================
   NORMALIZATION (NO DEFAULT RULES)
========================================================= */

function normalizeVariants(variants: FurnitureVariantPayload[]) {
  log("NORMALIZE_INPUT", variants);

  // no mutation logic
  return variants;
}

/* =========================================================
   UPLOAD
========================================================= */

async function uploadVariantFile(furnitureId: string, file: File) {
  const path = buildPaths.variant(furnitureId, file);

  log("UPLOAD_FILE", {
    furnitureId,
    fileName: file.name,
    path,
  });

  return upload(file, path);
}

/* =========================================================
   CREATE
========================================================= */

export async function createVariants(
  furnitureId: string,
  variants: FurnitureVariantPayload[]
) {
  log("CREATE_INPUT", {
    furnitureId,
    variantsCount: variants.length,
    variants,
  });

  const targets = variants.filter((v) => !v.isDeleted);

  if (!targets.length) {
    log("CREATE_ABORT_NO_TARGETS");
    return;
  }

  const rows: FurnitureVariantInsert[] = [];

  for (let i = 0; i < targets.length; i++) {
    const v = targets[i];

    let textureUrl: string | null = null;

    if (v.materialFile) {
      log("UPLOAD_START", { index: i, name: v.name });

      textureUrl = await uploadVariantFile(
        furnitureId,
        v.materialFile
      );
    }

    rows.push({
      furniture_id: furnitureId,
      name: v.name,
      texture_url: textureUrl,
      preview_image_url: textureUrl,
      price_adjustment: v.priceAdjustment ?? 0,
      is_active: v.isActive ?? true,
      sort_order: i,
    });
  }

  log("INSERT_ROWS", rows);

  const { error } = await supabase
    .from("furniture_variants")
    .insert(rows);

  if (error) {
    console.error("❌ VARIANT INSERT ERROR:", error);
    throw error;
  }

  log("CREATE_SUCCESS", { furnitureId });
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateVariants(
  furnitureId: string,
  variants: FurnitureVariantPayload[]
) {
  log("RAW_INPUT", { furnitureId, variants });

  /* ---------------- SPLIT ---------------- */

  const toDelete = variants.filter((v) => v.id && v.isDeleted);

  const toKeep = variants.filter((v) => v.id && !v.isDeleted);

  const toInsert = variants.filter((v) => !v.id && !v.isDeleted);

  log("SPLIT", {
    toDelete: toDelete.length,
    toKeep: toKeep.length,
    toInsert: toInsert.length,
  });

  /* ---------------- NORMALIZE ---------------- */

  const fullNormalized = normalizeVariants([
    ...toKeep,
    ...toInsert,
  ]);

  validateVariants(fullNormalized);

  /* ---------------- DELETE ---------------- */

  const deleteIds = toDelete.map((v) => v.id!);

  if (deleteIds.length) {
    log("DELETE_IDS", deleteIds);

    const { data, error } = await supabase
      .from("furniture_variants")
      .select("texture_url")
      .in("id", deleteIds);

    if (error) throw error;

    if (data?.length) {
      await removeFiles(data.map((d) => d.texture_url));
    }

    const { error: delError } = await supabase
      .from("furniture_variants")
      .delete()
      .in("id", deleteIds);

    if (delError) throw delError;
  }

  /* ---------------- UPDATE ---------------- */

  const normalizedKeep = fullNormalized.filter((v) => v.id);

  for (let i = 0; i < normalizedKeep.length; i++) {
    const v = normalizedKeep[i];

    const updateData: Partial<FurnitureVariantInsert> = {
      name: v.name,
      price_adjustment: v.priceAdjustment ?? 0,
      is_active: v.isActive ?? true,
      sort_order: i,
    };

    if (v.materialFile) {
      log("REPLACE_TEXTURE", { id: v.id });

      const { data: old } = await supabase
        .from("furniture_variants")
        .select("texture_url")
        .eq("id", v.id!)
        .single();

      if (old?.texture_url) {
        await removeFiles([old.texture_url]);
      }

      const textureUrl = await uploadVariantFile(
        furnitureId,
        v.materialFile
      );

      updateData.texture_url = textureUrl;
      updateData.preview_image_url = textureUrl;
    }

    log("UPDATE_ITEM", { id: v.id, updateData });

    const { error } = await supabase
      .from("furniture_variants")
      .update(updateData)
      .eq("id", v.id!);

    if (error) {
      console.error("❌ UPDATE ERROR:", error);
      throw error;
    }
  }

  /* ---------------- INSERT NEW ---------------- */

  const normalizedInsert = fullNormalized.filter(
    (v) => !v.id && !v.isDeleted
  );

  if (normalizedInsert.length) {
    log("INSERT_NEW", normalizedInsert);

    await createVariants(furnitureId, normalizedInsert);
  }

  log("DONE", { furnitureId });
}