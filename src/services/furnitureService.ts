"use client";

import { supabase } from "@/lib/supabase";

import type {
  FurnitureItemAdmin,
  FurnitureFormPayload,
  FurnitureCategory,
  FurnitureDB,
  FurnitureImage,
  FurnitureVariant,
} from "@/types/furniture";

import type { Database } from "@/types/supabase";

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
   QUERY RESULT TYPE (RAW DB JOIN RESULT)
========================================================= */

type FurnitureQueryResult = FurnitureDB & {
  furniture_categories: FurnitureCategory | null;
  furniture_images: FurnitureImage[] | null;
  furniture_variants: FurnitureVariant[] | null;
};

/* =========================================================
   NORMALIZER (DB → UI MODEL)
========================================================= */

function normalize(data: FurnitureQueryResult): FurnitureItemAdmin {
  return {
    ...data,
    category: data.furniture_categories ?? null,
    images: data.furniture_images ?? [],
    variants: data.furniture_variants ?? [],
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

  return (data ?? []).map((d) =>
    normalize(d as FurnitureQueryResult)
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

  return normalize(data as FurnitureQueryResult);
}

/* =========================================================
   CREATE
========================================================= */

export async function createFurniture(
  payload: FurnitureFormPayload,
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

    /* =========================================================
       SAFE INSERT (FULLY TYPED)
    ========================================================= */

    type FurnitureInsert =
      Database["public"]["Tables"]["furniture"]["Insert"];

    const insertPayload: FurnitureInsert = {
      name,
      slug,
      description: payload.description ?? null,
      category_id: payload.categoryId ?? null,
      base_price: payload.basePrice ?? 0,
      created_by: userId,

      width_cm: dims?.widthCm ?? null,
      depth_cm: dims?.depthCm ?? null,
      height_cm: dims?.heightCm ?? null,

      model_url: null,
    };

    const { data, error } = await supabase
      .from("furniture")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      err("INSERT_FAILED", error, payload);
      throw error;
    }

    if (!data?.id) throw new Error("Insert succeeded but no ID returned");

    const id = data.id;

    log("INSERT_SUCCESS", id);

    /* =========================================================
       MODEL UPLOAD
    ========================================================= */

    if (payload.modelFile instanceof File) {
      const url = await upload(
        payload.modelFile,
        buildPaths.model(id, payload.modelFile)
      );

      const { error: updateError } = await supabase
        .from("furniture")
        .update({ model_url: url })
        .eq("id", id);

      if (updateError) {
        err("MODEL_UPDATE", updateError);
        throw updateError;
      }
    }

    /* =========================================================
       CHILD TABLES
    ========================================================= */

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
  payload: FurnitureFormPayload
) {
  log("UPDATE_START", { id });

  const dims = payload.dimensions;

  const { error } = await supabase
    .from("furniture")
    .update({
      name: payload.name,
      description: payload.description ?? null,
      base_price: payload.basePrice ?? 0,

      width_cm: dims?.widthCm ?? null,
      depth_cm: dims?.depthCm ?? null,
      height_cm: dims?.heightCm ?? null,

      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    err("UPDATE", error);
    throw error;
  }

  if (payload.modelFile instanceof File) {
    const url = await upload(
      payload.modelFile,
      buildPaths.model(id, payload.modelFile)
    );

    await supabase
      .from("furniture")
      .update({ model_url: url })
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
    ...(item.images ?? []).map((i) => i.image_url),
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