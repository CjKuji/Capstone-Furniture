"use client";

import React, { useEffect, useState } from "react";

interface FurnitureARViewerProps {
  modelUrl: string;
  selectedSize?: number;
  onDebug?: (msg: string) => void; // optional callback for debugging
}

export default function FurnitureARViewer({
  modelUrl,
  selectedSize = 1,
  onDebug,
}: FurnitureARViewerProps) {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const scale = `${selectedSize} ${selectedSize} ${selectedSize}`;

  useEffect(() => {
    const loadScripts = async () => {
      const log = (msg: string) => {
        onDebug?.(msg);
        console.log("ARViewer:", msg);
      };

      const loadScript = (id: string, src: string) =>
        new Promise<void>((resolve, reject) => {
          if (document.getElementById(id)) return resolve();
          const script = document.createElement("script");
          script.src = src;
          script.id = id;
          script.async = true;
          script.onload = () => {
            log(`Script loaded: ${src}`);
            resolve();
          };
          script.onerror = () => {
            log(`Failed to load script: ${src}`);
            reject(`Failed to load ${src}`);
          };
          document.body.appendChild(script);
        });

      try {
        log("Loading A-Frame...");
        await loadScript(
          "aframe",
          "https://aframe.io/releases/1.4.2/aframe.min.js"
        );

        log("Loading AR.js...");
        await loadScript(
          "arjs",
          "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js/aframe/build/aframe-ar.js"
        );

        setScriptsLoaded(true);
        log("All scripts loaded!");
      } catch (err) {
        console.error(err);
        log("Script loading error: " + err);
      }
    };

    loadScripts();
  }, [onDebug]);

  if (!scriptsLoaded)
    return (
      <div className="flex items-center justify-center h-full text-white font-semibold">
        Loading AR...
      </div>
    );

  return (
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
  );
}