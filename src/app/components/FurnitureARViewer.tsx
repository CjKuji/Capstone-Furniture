"use client";

import React, { useEffect, useState } from "react";

interface FurnitureARViewerProps {
  modelUrl: string;
  selectedSize?: number; // scale multiplier
}

export default function FurnitureARViewer({
  modelUrl,
  selectedSize = 1,
}: FurnitureARViewerProps) {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const scale = `${selectedSize} ${selectedSize} ${selectedSize}`;

  useEffect(() => {
    const loadScripts = async () => {
      const loadScript = (id: string, src: string) =>
        new Promise<void>((resolve, reject) => {
          if (document.getElementById(id)) return resolve();
          const script = document.createElement("script");
          script.src = src;
          script.id = id;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(`Failed to load ${src}`);
          document.body.appendChild(script);
        });

      try {
        // Latest A-Frame
        await loadScript("aframe", "https://cdn.jsdelivr.net/npm/aframe@1.4.2/dist/aframe.min.js");

        // Latest AR.js
        await loadScript(
          "arjs",
          "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js/aframe/build/aframe-ar.js"
        );

        setScriptsLoaded(true);
      } catch (err) {
        console.error(err);
      }
    };

    loadScripts();
  }, []);

  if (!scriptsLoaded) {
    return (
      <div className="ar-scene-container flex items-center justify-center text-white font-semibold">
        Loading AR...
      </div>
    );
  }

  return (
    <div className="ar-scene-container w-full h-full">
      <a-scene
        embedded
        vr-mode-ui="enabled: false"
        arjs="trackingMethod: best; sourceType: webcam;"
        style={{ width: "100%", height: "100%" }}
      >
        <a-marker preset="hiro">
          <a-entity
            gltf-model={modelUrl}
            scale={scale}
            position="0 0 0"
            rotation="0 0 0"
          ></a-entity>
        </a-marker>

        <a-entity camera></a-entity>
      </a-scene>
    </div>
  );
}