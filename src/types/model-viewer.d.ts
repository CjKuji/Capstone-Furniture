// types/model-viewer.d.ts
import React from "react";

declare global {
  interface HTMLModelViewerElement extends HTMLElement {
    enterAR(): Promise<void>;
    activateAR(): Promise<void>;
    canActivateAR?: () => Promise<boolean>; // ALWAYS a function, optional
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLModelViewerElement>,
        HTMLModelViewerElement
      > & {
        src?: string;
        "ios-src"?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
      };
    }
  }
}

export {};