import * as THREE from "./assets/vendor/three.module.min.js";
import { createAvatar } from "./avatar.js";

/** Original scroll-directed portrait; all résumé content remains ordinary HTML. */
export function createScene(host) {
  const mobileQuery = window.matchMedia(
    "(max-width: 760px), (pointer: coarse)",
  );
  let mobile = mobileQuery.matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !mobile,
      powerPreference: "low-power",
    });
  } catch {
    host.dataset.state = "fallback";
    return { setMotion() {}, setScroll() {}, dispose() {} };
  }
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2),
  );
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.hidden = true;
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  const avatar = createAvatar();
  const actor = new THREE.Group();
  actor.add(avatar.root);
  scene.add(actor);
  scene.add(new THREE.HemisphereLight("#fff5e5", "#9ba9a4", 2.1));
  const key = new THREE.DirectionalLight("#fff7f1", 2.8);
  key.position.set(-3.8, 6, 6);
  key.target.position.set(0, 1.3, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -3;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 16;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.015;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight("#d8e8ee", 1.65);
  fill.position.set(4.5, 2.7, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight("#edf3cf", 2.6);
  rim.position.set(2, 4, -3);
  scene.add(rim);

  // Each stop belongs to a content section; no camera animation asset is needed.
  const desktopStops = [
    { p: 0, pos: [0, 1.62, 7.55], target: [0, 1.14, 0], turn: -0.035 },
    { p: 0.12, pos: [0.4, 1.68, 7.55], target: [0, 1.2, 0], turn: -0.09 },
    { p: 0.22, pos: [1.4, 1.72, 7.5], target: [1.25, 1.05, 0], turn: -0.17 },
    { p: 0.4, pos: [1.1, 1.92, 7.9], target: [1.28, 0.98, 0], turn: 0.08 },
    { p: 0.55, pos: [0.4, 1.7, 8.2], target: [1.3, 1.08, 0], turn: 0.18 },
    { p: 0.62, pos: [0, 1.7, 10.1], target: [2.9, 1, 0], turn: -0.08 },
    { p: 0.87, pos: [-0.8, 1.7, 10.8], target: [3.1, 0.9, 0], turn: -0.22 },
    { p: 1, pos: [0.65, 1.7, 8.7], target: [1.55, 0.95, 0], turn: -0.09 },
  ];
  const mobileStops = [
    { p: 0, pos: [0, 1.75, 10.9], target: [0, 0.98, 0], turn: -0.035 },
    { p: 0.12, pos: [0, 1.75, 11.1], target: [0, 1.1, 0], turn: -0.08 },
    { p: 0.22, pos: [0.4, 1.8, 11.8], target: [0.64, 1.6, 0], turn: -0.13 },
    { p: 0.55, pos: [-0.1, 1.8, 12.7], target: [0.7, 1.7, 0], turn: 0.09 },
    { p: 0.62, pos: [0, 1.9, 15.6], target: [1.75, 1.3, 0], turn: -0.08 },
    { p: 0.87, pos: [-0.6, 1.8, 16.3], target: [1.7, 1.2, 0], turn: -0.18 },
    { p: 1, pos: [0, 1.8, 12.4], target: [0.68, 1.4, 0], turn: -0.08 },
  ];
  let enabled = false,
    disposed = false,
    contextLost = false,
    visible = true;
  let frame = 0,
    previousTime = 0,
    time = 0,
    scroll = 0,
    currentScroll = 0;
  const pointer = { x: 0, y: 0 };
  const target = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const desiredTarget = new THREE.Vector3();
  const stopPosition = new THREE.Vector3();
  const stopTarget = new THREE.Vector3();
  let initialPose = true;

  function pose(progress, snap = false) {
    const stops = mobile ? mobileStops : desktopStops;
    let a = stops[0],
      b = stops[stops.length - 1];
    for (let i = 1; i < stops.length; i++) {
      if (progress <= stops[i].p) {
        a = stops[i - 1];
        b = stops[i];
        break;
      }
    }
    let t = THREE.MathUtils.clamp(
      (progress - a.p) / Math.max(b.p - a.p, 0.001),
      0,
      1,
    );
    t = t * t * (3 - 2 * t);
    desiredPosition.fromArray(a.pos).lerp(stopPosition.fromArray(b.pos), t);
    desiredTarget.fromArray(a.target).lerp(stopTarget.fromArray(b.target), t);
    // Keep the portrait framing consistent on compact desktop windows.
    if (!mobile && camera.aspect < 1.25) desiredPosition.z *= 1.15;
    if (snap || initialPose) {
      camera.position.copy(desiredPosition);
      target.copy(desiredTarget);
      initialPose = false;
    } else {
      camera.position.lerp(desiredPosition, 0.1);
      target.lerp(desiredTarget, 0.1);
    }
    actor.rotation.y = THREE.MathUtils.lerp(a.turn, b.turn, t);
    camera.lookAt(target);
  }
  function render(now) {
    frame = 0;
    if (!enabled || disposed || contextLost || !visible || document.hidden)
      return;
    frame = requestAnimationFrame(render);
    if (now - previousTime < 1000 / 30) return;
    const elapsed = previousTime ? Math.min((now - previousTime) / 1000, 1) : 0;
    const delta = Math.min(elapsed, 0.08);
    previousTime = now;
    time += delta;
    currentScroll = THREE.MathUtils.lerp(
      currentScroll,
      scroll,
      1 - Math.exp(-elapsed * 8),
    );
    pose(currentScroll, true);
    avatar.update({ x: pointer.x, y: pointer.y, time, follow: !mobile });
    try {
      renderer.render(scene, camera);
      if (host.dataset.state !== "live") {
        canvas.hidden = false;
        host.dataset.state = "live";
      }
    } catch {
      enabled = false;
      canvas.hidden = true;
      host.dataset.state = "fallback";
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  function syncAnimation() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (enabled && !disposed && !contextLost && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function onPointer(event) {
    if (mobile || event.pointerType === "touch") return;
    pointer.x = THREE.MathUtils.clamp(
      (event.clientX / window.innerWidth) * 2 - 1,
      -1,
      1,
    );
    pointer.y = THREE.MathUtils.clamp(
      (event.clientY / window.innerHeight) * 2 - 1,
      -1,
      1,
    );
  }
  function resetPointer() {
    pointer.x = 0;
    pointer.y = 0;
  }
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("blur", resetPointer);
  document.documentElement.addEventListener("pointerleave", resetPointer);
  document.addEventListener("visibilitychange", syncAnimation);
  function resize() {
    if (disposed || contextLost) return;
    mobile = mobileQuery.matches;
    const width = Math.max(1, host.clientWidth),
      height = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2),
    );
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    pose(currentScroll, true);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
    syncAnimation();
  });
  visibilityObserver.observe(host);
  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    canvas.hidden = true;
    host.dataset.state = "fallback";
    syncAnimation();
  }
  function onContextRestored() {
    contextLost = false;
    resize();
    syncAnimation();
  }
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  resize();
  function setMotion(value) {
    if (disposed) return;
    enabled = Boolean(value);
    if (!enabled || contextLost) {
      canvas.hidden = true;
      host.dataset.state = contextLost ? "fallback" : "poster";
    }
    syncAnimation();
  }
  function setScroll(progress) {
    if (disposed || !Number.isFinite(progress)) return;
    scroll = THREE.MathUtils.clamp(progress, 0, 1);
    if (!enabled) {
      currentScroll = scroll;
      pose(scroll, true);
    }
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("blur", resetPointer);
    document.documentElement.removeEventListener("pointerleave", resetPointer);
    document.removeEventListener("visibilitychange", syncAnimation);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    avatar.dispose();
    key.shadow.dispose();
    renderer.renderLists.dispose();
    renderer.dispose();
    canvas.remove();
    host.dataset.state = "poster";
  }
  return { setMotion, setScroll, dispose };
}
