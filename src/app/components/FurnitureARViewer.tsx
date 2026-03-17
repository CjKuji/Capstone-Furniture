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
        await loadScript("aframe", "https://aframe.io/releases/1.4.2/aframe.min.js");
        await loadScript(
          "arjs",
          "https://cdn.rawgit.com/jeromeetienne/AR.js/3.3.2/aframe/build/aframe-ar.js"
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
    <div className="ar-scene-container">
      <a-scene
        className="ar-scene"
        embedded={false}
        arjs="trackingMethod: best; sourceType: webcam;"
        vr-mode-ui="enabled: false"
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