import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export async function generateThumbnail(modelUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });

    renderer.setSize(512, 512);

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Center model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.sub(center);

        // Fit camera to object
       const maxDim = Math.max(size.x, size.y, size.z);
const fov = camera.fov * (Math.PI / 180);

const cameraZ = Math.abs(maxDim / Math.sin(fov / 2));

camera.position.set(0, maxDim * 0.6, cameraZ);
camera.lookAt(0, 0, 0);

        // Render once
        renderer.render(scene, camera);

        // Capture canvas
        renderer.domElement.toBlob(
          (blob) => {
            if (!blob) {
              reject("Failed to generate thumbnail");
              return;
            }

            resolve(blob);
          },
          "image/png",
          1
        );
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}