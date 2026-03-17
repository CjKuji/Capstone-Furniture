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