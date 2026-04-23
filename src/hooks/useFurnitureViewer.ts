"use client";

import { useCallback, useState } from "react";
import type { FurnitureVariant } from "@/types/furniture";

/* =========================================================
   TYPES
========================================================= */

type ViewerState = {
  modelUrl: string;
  variants: FurnitureVariant[];
  activeTexture: string | null;
  activeVariantId: string | null;
};

type OpenViewerParams = {
  modelUrl: string;
  variants: FurnitureVariant[];
};

/* =========================================================
   HOOK
========================================================= */

export function useFurnitureViewer() {
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  /* =========================================================
     OPEN VIEWER
  ========================================================= */

  const openViewer = useCallback(({ modelUrl, variants }: OpenViewerParams) => {
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
    });
  }, []);

  /* =========================================================
     CLOSE VIEWER
  ========================================================= */

  const closeViewer = useCallback(() => {
    setViewer(null);
  }, []);

  /* =========================================================
     SET ACTIVE TEXTURE (3D MATERIAL SWITCH)
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
     SET ACTIVE BY VARIANT ID (SAFER UX OPTION)
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
     GET ACTIVE VARIANT (DERIVED SAFE VALUE)
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
     RETURN API
  ========================================================= */

  return {
    viewer,

    openViewer,
    closeViewer,

    setActiveTexture,
    setActiveVariant,

    getActiveVariant,
  };
}