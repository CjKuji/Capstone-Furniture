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
   VALIDATION (NO DEFAULT RULES)
========================================================= */

export function validateVariants(
  variants: FurnitureVariantPayload[]
) {
  const active = variants.filter(v => !v.isDeleted);

  log("VALIDATE_INPUT", active);

  if (active.length === 0) {
    throw new Error("At least one variant is required.");
  }

  // ❌ REMOVED:
  // - no isDefault validation
  // - no single default enforcement
}

/* =========================================================
   NORMALIZATION (NO DEFAULT LOGIC)
========================================================= */

function normalizeVariants(
  variants: FurnitureVariantPayload[]
) {
  // ❌ No default resolution logic anymore
  return variants;
}

/* =========================================================
   UPLOAD
========================================================= */

async function uploadVariantFile(
  furnitureId: string,
  file: File
) {
  const path = buildPaths.variant(furnitureId, file);

  log("UPLOAD_FILE", { furnitureId, file: file.name });

  return upload(file, path);
}

/* =========================================================
   CREATE
========================================================= */

export async function createVariants(
  furnitureId: string,
  variants: FurnitureVariantPayload[]
) {
  log("CREATE_INPUT", variants);

  const targets = variants.filter(v => !v.isDeleted);

  if (!targets.length) {
    log("CREATE_ABORT_EMPTY");
    return;
  }

  const rows: FurnitureVariantInsert[] = [];

  for (let i = 0; i < targets.length; i++) {
    const v = targets[i];

    let textureUrl: string | null = null;

    if (v.materialFile) {
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
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateVariants(
  furnitureId: string,
  variants: FurnitureVariantPayload[]
) {
  log("RAW_INPUT", variants);

  /* ---------------- SPLIT ---------------- */

  const toDelete = variants.filter(v => v.id && v.isDeleted);

  const toKeep = variants.filter(v =>
    v.id && !v.isDeleted
  );

  const toInsert = variants.filter(v =>
    !v.id && !v.isDeleted
  );

  log("SPLIT", { toDelete, toKeep, toInsert });

  /* ---------------- NORMALIZE ---------------- */

  const fullNormalized = normalizeVariants([
    ...toKeep,
    ...toInsert,
  ]);

  validateVariants(fullNormalized);

  /* ---------------- DELETE ---------------- */

  const deleteIds = toDelete.map(v => v.id!);

  if (deleteIds.length) {
    const { data, error } = await supabase
      .from("furniture_variants")
      .select("texture_url")
      .in("id", deleteIds);

    if (error) throw error;

    if (data?.length) {
      await removeFiles(data.map(d => d.texture_url));
    }

    const { error: delError } = await supabase
      .from("furniture_variants")
      .delete()
      .in("id", deleteIds);

    if (delError) throw delError;
  }

  /* ---------------- UPDATE ---------------- */

  const normalizedKeep = fullNormalized.filter(v => v.id);

  for (let i = 0; i < normalizedKeep.length; i++) {
    const v = normalizedKeep[i];

    const updateData: Partial<FurnitureVariantInsert> = {
      name: v.name,
      price_adjustment: v.priceAdjustment ?? 0,
      is_active: v.isActive ?? true,
      sort_order: i,
    };

    if (v.materialFile) {
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
    v => !v.id && !v.isDeleted
  );

  if (normalizedInsert.length) {
    log("INSERT_NEW", normalizedInsert);
    await createVariants(furnitureId, normalizedInsert);
  }

  log("DONE", { furnitureId });
}