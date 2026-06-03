"use client";

import { supabase } from "@/lib/supabase";

import type {
  FurnitureItemAdmin,
  FurnitureFormPayload,
  FurnitureCategory,
  FurnitureImage,
  FurnitureVariant,
} from "@/types/furniture";

import type { Database } from "@/types/supabase";

import type { ARReadiness } from "@/types/modelValidation";

import { upload, buildPaths, removeFiles } from "@/services/storageService";

import {
  createImages,
  updateImages,
  validateImages,
} from "@/services/handlers/imageHandlers";

import {
  createVariants,
  updateVariants,
  validateVariants,
} from "@/services/handlers/variantHandlers";

/* =========================================================
   DEBUG
========================================================= */

const DEBUG = true;

const log = (step: string, data?: any) => {
  if (!DEBUG) return;
  console.log(`🟦 [FURNITURE:${step}]`, data ?? "");
};

const err = (step: string, error: any, extra?: any) => {
  console.error(`🟥 [FURNITURE:${step}]`, error, extra ?? "");
};

/* =========================================================
   EXTENDED PAYLOAD (Step 10)
   Adds cleanedModelFile and arReadiness on top of the base
   FurnitureFormPayload without touching furniture.ts types.
========================================================= */

export type FurnitureServicePayload = FurnitureFormPayload & {
  /** Sanitized GLB from modelExporter — preferred over modelFile when present */
  cleanedModelFile?: File | null;
  /** AR readiness result from modelValidator — written to model_ar_status */
  arReadiness?: ARReadiness | null;
};

/* =========================================================
   SUPABASE TYPE AUGMENTATION
   -------------------------------------------------------
   Supabase codegen does not yet include `model_ar_status`
   (requires re-running `supabase gen types` after migration).
   We intersect the three generated variants locally so the
   rest of this file compiles without touching supabase.ts.
========================================================= */

type FurnitureRow =
  Database["public"]["Tables"]["furniture"]["Row"] & {
    model_ar_status: ARReadiness | null;
  };

type FurnitureInsert =
  Database["public"]["Tables"]["furniture"]["Insert"] & {
    model_ar_status?: ARReadiness | null;
  };

type FurnitureUpdate =
  Database["public"]["Tables"]["furniture"]["Update"] & {
    model_ar_status?: ARReadiness | null;
  };

/* =========================================================
   QUERY RESULT TYPE (RAW DB JOIN RESULT)
   -------------------------------------------------------
   Uses the augmented FurnitureRow so model_ar_status is
   present, satisfying FurnitureDB's required field.
========================================================= */

type FurnitureQueryResult = FurnitureRow & {
  furniture_categories: FurnitureCategory | null;
  furniture_images: FurnitureImage[] | null;
  furniture_variants: FurnitureVariant[] | null;
};

/* =========================================================
   NORMALIZER (DB → UI MODEL)
   -------------------------------------------------------
   The Supabase-generated Row type marks several columns as
   `T | null` that FurnitureDB declares as `T` (non-nullable).
   These columns have DB-level defaults or NOT NULL constraints,
   so null can only appear if codegen hasn't caught up yet.
   We coerce them here with safe fallbacks so the return type
   satisfies FurnitureItemAdmin without disabling type checks
   elsewhere.
========================================================= */

function normalize(data: FurnitureQueryResult): FurnitureItemAdmin {
  return {
    // ── spread all raw columns first ──────────────────────
    ...data,

    // ── coerce columns where Supabase Row says `T | null`
    //    but FurnitureDB says `T` ───────────────────────────
    base_price:     data.base_price     ?? 0,
    publish_status: data.publish_status ?? "draft",
    created_at:     data.created_at     ?? new Date().toISOString(),
    updated_at:     data.updated_at     ?? new Date().toISOString(),

    // ── join relations ────────────────────────────────────
    category: data.furniture_categories ?? null,
    images:   data.furniture_images     ?? [],
    variants: data.furniture_variants   ?? [],
  };
}

/* =========================================================
   GET ALL
========================================================= */

export async function getFurniture(): Promise<FurnitureItemAdmin[]> {
  log("GET_ALL_START");

  const { data, error } = await supabase
    .from("furniture")
    .select(`
      *,
      furniture_categories:category_id (id, name),
      furniture_images (*),
      furniture_variants (*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    err("GET_ALL", error);
    throw error;
  }

  // Cast through `unknown` first because the Supabase-generated Row
  // type does not yet include model_ar_status. Our augmented
  // FurnitureQueryResult adds it safely via the intersection above.
  return (data ?? []).map((d) =>
    normalize(d as unknown as FurnitureQueryResult)
  );
}

/* =========================================================
   GET BY ID
========================================================= */

export async function getFurnitureById(id: string) {
  log("GET_BY_ID", id);

  const { data, error } = await supabase
    .from("furniture")
    .select(`
      *,
      furniture_categories:category_id (id, name),
      furniture_images (*),
      furniture_variants (*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    err("GET_BY_ID", error);
    throw error;
  }

  if (!data) throw new Error("Furniture not found");

  return normalize(data as unknown as FurnitureQueryResult);
}

/* =========================================================
   CREATE
========================================================= */

export async function createFurniture(
  payload: FurnitureServicePayload,
  userId: string
) {
  log("CREATE_START", { payload, userId });

  try {
    if (!userId) throw new Error("Missing userId");

    validateImages(payload.images ?? []);
    validateVariants(payload.variants ?? []);

    const dims = payload.dimensions;

    const name = payload.name?.trim();
    if (!name) throw new Error("Name is required");

    const slug =
      name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
      "-" +
      Date.now();

    log("SLUG", slug);

    /* ---------------------------------------------------------
       SAFE INSERT
       Uses the augmented FurnitureInsert type so
       model_ar_status is a known, accepted property.
    --------------------------------------------------------- */

    const insertPayload: FurnitureInsert = {
      name,
      slug,
      description:      payload.description  ?? null,
      category_id:      payload.categoryId   ?? null,
      base_price:       payload.basePrice     ?? 0,
      created_by:       userId,

      width_cm:         dims?.widthCm         ?? null,
      depth_cm:         dims?.depthCm         ?? null,
      height_cm:        dims?.heightCm        ?? null,

      model_url:        null,
      model_ar_status:  payload.arReadiness   ?? null,
    };

    const { data, error } = await supabase
      .from("furniture")
      .insert(insertPayload as Database["public"]["Tables"]["furniture"]["Insert"])
      .select()
      .single();

    if (error) {
      err("INSERT_FAILED", error, payload);
      throw error;
    }

    if (!data?.id) throw new Error("Insert succeeded but no ID returned");

    const id = data.id;

    log("INSERT_SUCCESS", id);

    /* ---------------------------------------------------------
       MODEL UPLOAD
       Prefer cleanedModelFile (sanitized GLB) over raw modelFile.
    --------------------------------------------------------- */

    const modelFile = payload.cleanedModelFile ?? payload.modelFile;

    if (modelFile instanceof File) {
      const url = await upload(
        modelFile,
        buildPaths.model(id, modelFile)
      );

      const { error: updateError } = await supabase
        .from("furniture")
        .update({ model_url: url } as Database["public"]["Tables"]["furniture"]["Update"])
        .eq("id", id);

      if (updateError) {
        err("MODEL_UPDATE", updateError);
        throw updateError;
      }
    }

    /* ---------------------------------------------------------
       CHILD TABLES
    --------------------------------------------------------- */

    await createImages(id, payload.images ?? [], false);
    await createVariants(id, payload.variants ?? []);

    return await getFurnitureById(id);
  } catch (e) {
    err("CREATE_FATAL", e, payload);
    throw e;
  }
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateFurniture(
  id: string,
  payload: FurnitureServicePayload
) {
  log("UPDATE_START", { id });

  const dims = payload.dimensions;

  /* ---------------------------------------------------------
     Build a properly-typed update object.
     Using the augmented FurnitureUpdate type means
     model_ar_status is a known property — no more
     Record<string, unknown> / index-signature conflict.
  --------------------------------------------------------- */

  const updateData: FurnitureUpdate = {
    name:         payload.name,
    description:  payload.description  ?? null,
    base_price:   payload.basePrice     ?? 0,

    width_cm:     dims?.widthCm         ?? null,
    depth_cm:     dims?.depthCm         ?? null,
    height_cm:    dims?.heightCm        ?? null,

    updated_at:   new Date().toISOString(),
  };

  // Only write arReadiness when the caller explicitly supplied it.
  // undefined  → don't touch the column
  // null       → clear it
  if (payload.arReadiness !== undefined) {
    updateData.model_ar_status = payload.arReadiness ?? null;
  }

  const { error } = await supabase
    .from("furniture")
    .update(updateData as Database["public"]["Tables"]["furniture"]["Update"])
    .eq("id", id);

  if (error) {
    err("UPDATE", error);
    throw error;
  }

  // Prefer cleanedModelFile over raw modelFile
  const modelFile = payload.cleanedModelFile ?? payload.modelFile;

  if (modelFile instanceof File) {
    const url = await upload(
      modelFile,
      buildPaths.model(id, modelFile)
    );

    await supabase
      .from("furniture")
      .update({ model_url: url } as Database["public"]["Tables"]["furniture"]["Update"])
      .eq("id", id);
  }

  await updateImages(id, payload.images ?? []);
  await updateVariants(id, payload.variants ?? []);

  return await getFurnitureById(id);
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteFurniture(id: string) {
  log("DELETE_START", id);

  const item = await getFurnitureById(id);

  const urls = [
    item.model_url,
    ...(item.images  ?? []).map((i) => i.image_url),
    ...(item.variants ?? []).map((v) => v.texture_url),
  ].filter(Boolean) as string[];

  if (urls.length) await removeFiles(urls);

  const { error } = await supabase
    .from("furniture")
    .delete()
    .eq("id", id);

  if (error) {
    err("DELETE", error);
    throw error;
  }

  log("DELETE_SUCCESS", id);
}

/* =========================================================
   CATEGORIES
========================================================= */

export async function getCategories(): Promise<FurnitureCategory[]> {
  const { data, error } = await supabase
    .from("furniture_categories")
    .select("id, name")
    .order("name");

  if (error) {
    err("CATEGORIES", error);
    throw error;
  }

  return data ?? [];
} 