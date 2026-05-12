"use client";

import "@google/model-viewer";
import { useEffect } from "react";

export default function ModelViewerElement() {
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  return null;
}