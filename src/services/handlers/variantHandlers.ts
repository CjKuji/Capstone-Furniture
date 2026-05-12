"use client";

import { supabase } from "@/lib/supabase";
import type {
  FurnitureVariantPayload,
  FurnitureVariantInsert,
} from "@/types/furniture";
import { upload, buildPaths, removeFiles } from "@/services/storageService";

/* =========================================================
   DEBUG
========================================================= */

const DEBUG = true;

function log(step: string, data?: unknown) {
  if (DEBUG) console.log(`[VARIANT:${step}]`, data);
}

/* =========================================================
   CLEAN VALUE HELPERS
========================================================= */

function cleanString(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

/* =========================================================
   VALIDATION
========================================================= */

export function validateVariants(variants: FurnitureVariantPayload[]) {
  const active = variants.filter((v) => !v.isDeleted);

  log("VALIDATE", {
    total: variants.length,
    active: active.length,
  });

  if (!variants.length) return;
  if (!active.length) return;
}

/* =========================================================
   NORMALIZE
========================================================= */

function normalizeVariants(variants: FurnitureVariantPayload[]) {
  return variants;
}

/* =========================================================
   UPLOAD
========================================================= */

async function uploadVariantFile(furnitureId: string, file: File) {
  const path = buildPaths.variant(furnitureId, file);

  return upload(file, path);
}

/* =========================================================
   CREATE VARIANTS
========================================================= */

export async function createVariants(
  furnitureId: string,
  variants: FurnitureVariantPayload[]
) {
  const targets = variants.filter((v) => !v.isDeleted);

  if (!targets.length) return;

  const rows: FurnitureVariantInsert[] = [];

  for (let i = 0; i < targets.length; i++) {
    const v = targets[i];

    let textureUrl: string | undefined;

    if (v.materialFile) {
      textureUrl = await uploadVariantFile(furnitureId, v.materialFile);
    }

    rows.push({
      furniture_id: furnitureId,
      name: v.name,

      texture_url: cleanString(textureUrl) as any,
      preview_image_url: cleanString(textureUrl) as any,

      price_adjustment: v.priceAdjustment ?? 0,
      is_active: v.isActive ?? true,
      sort_order: i,
    });
  }

  const { error } = await supabase
    .from("furniture_variants")
    .insert(rows as any);

  if (error) {
    console.error("❌ INSERT ERROR:", error);
    throw error;
  }

  log("CREATE_SUCCESS", { furnitureId });
}

/* =========================================================
   UPDATE VARIANTS
========================================================= */

export async function updateVariants(
  furnitureId: string,
  variants: FurnitureVariantPayload[]
) {
  const toDelete = variants.filter((v) => v.id && v.isDeleted);
  const toKeep = variants.filter((v) => v.id && !v.isDeleted);
  const toInsert = variants.filter((v) => !v.id && !v.isDeleted);

  const fullNormalized = normalizeVariants([...toKeep, ...toInsert]);

  validateVariants(fullNormalized);

  /* ---------------- DELETE ---------------- */

  const deleteIds = toDelete.map((v) => v.id!);

  if (deleteIds.length) {
    const { data, error } = await supabase
      .from("furniture_variants")
      .select("texture_url")
      .in("id", deleteIds);

    if (error) throw error;

    await removeFiles(
      (data ?? [])
        .map((d) => d.texture_url)
        .filter(Boolean)
    );

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

      updateData.texture_url = textureUrl as any;
      updateData.preview_image_url = textureUrl as any;
    }

    const { error } = await supabase
      .from("furniture_variants")
      .update(updateData as any)
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
    await createVariants(furnitureId, normalizedInsert);
  }

  log("DONE", { furnitureId });
}