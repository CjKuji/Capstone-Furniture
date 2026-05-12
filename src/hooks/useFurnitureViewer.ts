"use client";

import { useCallback, useState } from "react";
import type { FurnitureVariant } from "@/types/furniture";

/* =========================================================
   TYPES
========================================================= */

type Dimensions = {
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
};

type ViewerState = {
  modelUrl: string;
  variants: FurnitureVariant[];

  activeTexture: string | null;
  activeVariantId: string | null;

  // ✅ NEW: required for AR scaling consistency
  dimensions?: Dimensions;
};

type OpenViewerParams = {
  modelUrl: string;
  variants: FurnitureVariant[];

  // ✅ NEW
  dimensions?: Dimensions;
};

/* =========================================================
   HOOK
========================================================= */

export function useFurnitureViewer() {
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  /* =========================================================
     OPEN VIEWER
  ========================================================= */

  const openViewer = useCallback(
    ({ modelUrl, variants, dimensions }: OpenViewerParams) => {
      if (!modelUrl) return;

      const defaultVariant =
        variants?.find((v) => v.is_default) ??
        variants?.[0] ??
        null;

      setViewer({
        modelUrl,
        variants: variants ?? [],

        activeTexture: defaultVariant?.texture_url ?? null,
        activeVariantId: defaultVariant?.id ?? null,

        // ✅ PASS THROUGH REAL-WORLD DATA
        dimensions,
      });
    },
    []
  );

  /* =========================================================
     CLOSE VIEWER
  ========================================================= */

  const closeViewer = useCallback(() => {
    setViewer(null);
  }, []);

  /* =========================================================
     SET ACTIVE TEXTURE
  ========================================================= */

  const setActiveTexture = useCallback(
    (texture: string | null, variantId?: string) => {
      setViewer((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          activeTexture: texture,
          activeVariantId: variantId ?? prev.activeVariantId,
        };
      });
    },
    []
  );

  /* =========================================================
     SET ACTIVE VARIANT
  ========================================================= */

  const setActiveVariant = useCallback((variantId: string) => {
    setViewer((prev) => {
      if (!prev) return null;

      const variant = prev.variants.find((v) => v.id === variantId);

      return {
        ...prev,
        activeVariantId: variantId,
        activeTexture: variant?.texture_url ?? null,
      };
    });
  }, []);

  /* =========================================================
     GET ACTIVE VARIANT
  ========================================================= */

  const getActiveVariant = useCallback(() => {
    if (!viewer) return null;

    return (
      viewer.variants.find(
        (v) => v.id === viewer.activeVariantId
      ) ?? null
    );
  }, [viewer]);

  /* =========================================================
     GET DIMENSIONS (HELPER FOR MODEL / AR)
  ========================================================= */

  const getDimensions = useCallback(() => {
    return viewer?.dimensions ?? null;
  }, [viewer]);

  /* =========================================================
     RETURN API
  ========================================================= */

  return {
    viewer,

    openViewer,
    closeViewer,

    setActiveTexture,
    setActiveVariant,

    getActiveVariant,

    // ✅ NEW: important for AR + scaling pipeline
    getDimensions,
  };
}