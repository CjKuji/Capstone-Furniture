declare module "three/examples/jsm/loaders/GLTFLoader" {
  import { Loader, Object3D, AnimationClip } from "three";

  export interface GLTF {
    scene: Object3D;
    animations: AnimationClip[]; // more accurate than any[]
    parser: unknown; // unknown instead of any
  }

  export class GLTFLoader extends Loader {
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: ErrorEvent | unknown) => void
    ): void;
  }
}

// JSX type declarations for @google/model-viewer custom element
declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string;
      alt?: string;
      ar?: boolean | "";
      "ar-modes"?: string;
      "ar-scale"?: string;
      "ar-placement"?: string;
      "camera-controls"?: boolean | "";
      "auto-rotate"?: boolean | "";
      "environment-image"?: string;
      exposure?: string;
      poster?: string;
      loading?: string;
      reveal?: string;
    };
  }
}