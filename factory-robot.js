import * as THREE from "./assets/vendor/three.module.min.js";
import { GLTFLoader } from "./assets/vendor/loaders/GLTFLoader.js";

/** CC0 Quaternius robot. It runs exclusively on the factory's animation clock. */
export function createFactoryRobot() {
  const root = new THREE.Group();
  root.name = "cc0-expressive-robot";
  root.userData.dynamic = true;
  root.userData.status = "loading";
  let disposed = false,
    model = null,
    mixer = null,
    idle = null,
    wave = null;
  let elapsed = 0,
    nextWave = 5,
    waving = false,
    resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  // Geometry, cloned materials and generated bone textures all belong to this instance.
  function releaseModel(object) {
    if (!object) return;
    const geometries = new Set(),
      materials = new Set(),
      textures = new Set(),
      skeletons = new Set();
    object.traverse((node) => {
      if (node.geometry) geometries.add(node.geometry);
      const nodeMaterials = Array.isArray(node.material)
        ? node.material
        : [node.material];
      for (const material of nodeMaterials)
        if (material) {
          materials.add(material);
          for (const value of Object.values(material))
            if (value?.isTexture) textures.add(value);
        }
      if (node.skeleton) skeletons.add(node.skeleton);
    });
    skeletons.forEach((skeleton) => skeleton.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    object.removeFromParent();
  }
  function finishWave(event) {
    if (event.action !== wave || disposed) return;
    waving = false;
    if (idle) {
      idle.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
      wave.crossFadeTo(idle, 0.25, false);
    }
  }

  new GLTFLoader().load(
    new URL("./assets/models/RobotExpressive.glb", import.meta.url).href,
    (gltf) => {
      if (disposed) {
        releaseModel(gltf.scene);
        resolveReady(false);
        return;
      }
      model = gltf.scene;
      try {
        model.name = "cc0-expressive-robot-model";
        const replacements = new Map();
        model.traverse((node) => {
          if (!node.isMesh) return;
          node.castShadow = false;
          node.receiveShadow = true;
          // Deformed arms may extend beyond the neutral-pose bounds.
          node.frustumCulled = false;
          const remap = (source) => {
            if (replacements.has(source)) return replacements.get(source);
            const material = source.clone();
            if (source.name === "Main") {
              material.color.set("#b7c8d8");
              material.metalness = 0.52;
              material.roughness = 0.32;
            } else if (source.name === "Grey") {
              material.color.set("#536579");
              material.metalness = 0.68;
              material.roughness = 0.35;
            }
            // Black facial display retains its original colour and expression geometry.
            replacements.set(source, material);
            return material;
          };
          node.material = Array.isArray(node.material)
            ? node.material.map(remap)
            : remap(node.material);
        });
        replacements.forEach((_, source) => source.dispose());
        model.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model),
          size = bounds.getSize(new THREE.Vector3());
        if (!Number.isFinite(size.y) || size.y < 0.0001)
          throw new Error("Invalid robot bounds");
        const scale = 3.4 / size.y,
          center = bounds.getCenter(new THREE.Vector3());
        model.scale.multiplyScalar(scale);
        model.position.set(
          -center.x * scale,
          -bounds.min.y * scale,
          -center.z * scale,
        );
        model.updateMatrixWorld(true);
        root.add(model);
        mixer = new THREE.AnimationMixer(model);
        const idleClip = THREE.AnimationClip.findByName(
          gltf.animations,
          "Idle",
        );
        const waveClip = THREE.AnimationClip.findByName(
          gltf.animations,
          "Wave",
        );
        if (idleClip)
          idle = mixer
            .clipAction(idleClip)
            .setLoop(THREE.LoopRepeat, Infinity)
            .play();
        if (waveClip) {
          wave = mixer.clipAction(waveClip).setLoop(THREE.LoopOnce, 1);
          wave.clampWhenFinished = true;
        }
        mixer.addEventListener("finished", finishWave);
        mixer.update(0);
        root.userData.status = "ready";
        resolveReady(true);
      } catch {
        if (mixer) {
          mixer.removeEventListener("finished", finishWave);
          mixer.stopAllAction();
          mixer.uncacheRoot(model);
        }
        releaseModel(model);
        model = null;
        mixer = null;
        root.userData.status = "unavailable";
        resolveReady(false);
      }
    },
    undefined,
    () => {
      if (!disposed) root.userData.status = "unavailable";
      resolveReady(false);
    },
  );

  function update(delta, motion = true) {
    if (disposed || !motion || !mixer || !Number.isFinite(delta) || delta <= 0)
      return;
    // A bounded step avoids teleporting limbs after a background tab resumes.
    const step = Math.min(delta, 0.25);
    elapsed += step;
    if (wave && !waving && elapsed >= nextWave) {
      waving = true;
      nextWave = elapsed + 18;
      wave.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
      if (idle) idle.crossFadeTo(wave, 0.22, false);
    }
    mixer.update(step);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    root.userData.status = "disposed";
    resolveReady(false);
    if (mixer) {
      mixer.removeEventListener("finished", finishWave);
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
    }
    releaseModel(model);
    model = null;
    mixer = null;
    idle = null;
    wave = null;
    root.clear();
  }
  return { root, ready, update, dispose };
}
