// types/aframe.d.ts
import React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "a-scene": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        embedded?: boolean;
        arjs?: string;
        "vr-mode-ui"?: string;
        style?: React.CSSProperties;
      };
      "a-marker": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        preset?: string;
        url?: string;
      };
      "a-entity": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        "gltf-model"?: string;
        scale?: string;
        rotation?: string;
        position?: string;
        camera?: boolean;
      };
    }
  }
}