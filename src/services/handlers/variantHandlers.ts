"use client";

import { supabase } from "@/lib/supabase";
import type { FurnitureVariantPayload } from "@/types/furniture";
import { upload, buildPaths, removeFiles } from "@/services/storageService";

/* =========================================================
   VALIDATION (DB-READY STATE ONLY)
========================================================= */

export function validateVariants(variants: FurnitureVariantPayload[]) {
  const active = variants.filter(v => !v.isDeleted);

  if (active.length === 0) {
    throw new Error("At least one variant is required.");
  }

  const defaultCount = active.filter(v => v.isDefault).length;

  if (defaultCount === 0) {
    throw new Error("At least one default variant is required.");
  }

  if (defaultCount > 1) {
    throw new Error("Only one default variant is allowed.");
  }
}

/* =========================================================
   NORMALIZATION (FIXED + STABLE)
========================================================= */

function normalizeVariants(variants: FurnitureVariantPayload[]) {
  const active = variants.filter(v => !v.isDeleted);

  if (active.length === 0) return variants;

  const defaultItem =
    active.find(v => v.isDefault) ?? active[0];

  const defaultId = defaultItem.id ?? defaultItem.name;

  return variants.map(v => {
    if (v.isDeleted) return v;

    const key = v.id ?? v.name;

    return {
      ...v,
      isDefault: key === defaultId,
    };
  });
}

/* =========================================================
   CREATE
========================================================= */

export async function createVariants(
  furnitureId: string,
  variants: FurnitureVariantPayload[]
) {
  const normalized = normalizeVariants(variants);
  validateVariants(normalized);

  const uploadTargets = normalized.filter(
    v => v.materialFile && !v.isDeleted
  );

  const rows = await Promise.all(
    uploadTargets.map(async (v, i) => {
      const file = v.materialFile!;

      const textureUrl = await upload(
        file,
        buildPaths.variant(furnitureId, file)
      );

      return {
        furniture_id: furnitureId,
        name: v.name,
        texture_url: textureUrl,
        preview_image_url: textureUrl,
        price_adjustment: v.priceAdjustment ?? 0,
        is_default: !!v.isDefault,
        is_active: v.isActive ?? true,
        sort_order: i,
      };
    })
  );

  if (!rows.length) return;

  const { error } = await supabase
    .from("furniture_variants")
    .insert(rows);

  if (error) throw error;
}

/* =========================================================
   UPDATE (FIXED + CONCURRENCY SAFE FLOW)
========================================================= */

export async function updateVariants(
  furnitureId: string,
  variants: FurnitureVariantPayload[]
) {
  /* -------------------------
     STEP 1: SPLIT INPUT
  ------------------------- */

  const toDelete = variants.filter(v => v.id && v.isDeleted);
  const toKeepRaw = variants.filter(v => !v.isDeleted);

  /* -------------------------
     STEP 2: NORMALIZE FIRST (IMPORTANT FIX)
  ------------------------- */

  const normalizedKeep = normalizeVariants(toKeepRaw);

  /* -------------------------
     STEP 3: VALIDATE AFTER NORMALIZATION
  ------------------------- */

  validateVariants(normalizedKeep);

  /* -------------------------
     STEP 4: DELETE FIRST (STORAGE + DB)
  ------------------------- */

  const deleteIds = toDelete.map(v => v.id!);

  if (deleteIds.length > 0) {
    const { data, error } = await supabase
      .from("furniture_variants")
      .select("texture_url")
      .in("id", deleteIds);

    if (error) throw error;

    if (data?.length) {
      await removeFiles(data.map(d => d.texture_url));
    }

    const { error: deleteError } = await supabase
      .from("furniture_variants")
      .delete()
      .in("id", deleteIds);

    if (deleteError) throw deleteError;
  }

  /* -------------------------
     STEP 5: UPDATE EXISTING (PARALLEL SAFE)
  ------------------------- */

  const existing = normalizedKeep.filter(v => v.id);

  await Promise.all(
    existing.map(async (v, i) => {
      const updateData: Record<string, unknown> = {
        name: v.name,
        price_adjustment: v.priceAdjustment ?? 0,
        is_default: !!v.isDefault,
        is_active: v.isActive ?? true,
        sort_order: i,
      };

      /* ---------- REPLACE TEXTURE IF NEEDED ---------- */
      if (v.materialFile) {
        const { data: old, error } = await supabase
          .from("furniture_variants")
          .select("texture_url")
          .eq("id", v.id!)
          .single();

        if (error) throw error;

        if (old?.texture_url) {
          await removeFiles([old.texture_url]);
        }

        const file = v.materialFile;

        const textureUrl = await upload(
          file,
          buildPaths.variant(furnitureId, file)
        );

        updateData.texture_url = textureUrl;
        updateData.preview_image_url = textureUrl;
      }

      const { error } = await supabase
        .from("furniture_variants")
        .update(updateData)
        .eq("id", v.id!);

      if (error) throw error;
    })
  );

  /* -------------------------
     STEP 6: INSERT NEW VARIANTS
  ------------------------- */

  const newVariants = normalizedKeep.filter(
    v => v.materialFile && !v.id
  );

  if (newVariants.length > 0) {
    await createVariants(furnitureId, newVariants);
  }
}