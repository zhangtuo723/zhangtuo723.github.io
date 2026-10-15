import * as THREE from "./assets/vendor/three.module.min.js";
import { RoomEnvironment } from "./assets/vendor/environments/RoomEnvironment.js";
import { createWorkshop } from "./workshop.js";

/** Render only when useful: motion off retains the same explorable scene. */
export function createScene(
  host,
  { onSelect = () => {}, onHover = () => {} } = {},
) {
  const noop = {
    setMotion() {},
    setScroll() {},
    focus() {},
    runDemo() {},
    dispose() {},
    getAnchors() {
      return {};
    },
  };
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    host.dataset.state = "fallback";
    return noop;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  // The architecture is static; cache its shadows instead of redrawing every mesh at 30 fps.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.touchAction = "pan-y";
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  const workshop = createWorkshop();
  scene.add(workshop.root);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, 0.06);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.7;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight("#c9e8ff", "#142039", 2.0));
  const key = new THREE.DirectionalLight("#d8edff", 3.6);
  key.position.set(-22, 38, 25);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -34,
    right: 34,
    top: 34,
    bottom: -31,
    near: 0.1,
    far: 120,
  });
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.00015;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight("#49baff", 1.15);
  fill.position.set(18, 14, -12);
  scene.add(fill);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 320);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const mobileQuery = window.matchMedia("(max-width: 760px)");
  let mobile = mobileQuery.matches;
  let motion = false,
    disposed = false,
    visible = true,
    contextLost = false;
  let frame = 0,
    lastFrame = 0,
    time = 0,
    lastTime = 0,
    selected = "overview";
  let demoStart = null,
    progress = 0,
    hover = null,
    needsRender = true;
  const parallax = new THREE.Vector2();
  const target = new THREE.Vector3();
  const goalTarget = new THREE.Vector3();
  const goalPosition = new THREE.Vector3();
  let cameraReady = false;
  const cameraStops = [
    {
      p: 0,
      target: [0, 3, 0],
      distance: 100,
      side: 0.32,
      azimuth: 38,
      elevation: 40,
    },
    {
      p: 0.15,
      target: [0, 3.6, -0.8],
      distance: 29,
      side: -0.38,
      azimuth: 20,
      elevation: 28,
    },
    {
      p: 0.3,
      target: [-12, 3.8, -9],
      distance: 26,
      side: -0.38,
      azimuth: 30,
      elevation: 32,
    },
    {
      p: 0.48,
      target: [10, 4.2, -8],
      distance: 31,
      side: -0.38,
      azimuth: -32,
      elevation: 38,
    },
    {
      p: 0.66,
      target: [12, 3, 7],
      distance: 25,
      side: -0.38,
      azimuth: -45,
      elevation: 35,
    },
    {
      p: 0.83,
      target: [-12, 2.8, 9],
      distance: 25,
      side: -0.38,
      azimuth: 35,
      elevation: 43,
    },
    {
      p: 1,
      target: [0, 3, 0],
      distance: 100,
      side: -0.26,
      azimuth: 28,
      elevation: 40,
    },
  ];
  let focusOverride = null;
  const lookRight = new THREE.Vector3();
  const baseTarget = new THREE.Vector3();
  function pose(snap = false, elapsed = 1 / 30) {
    const aspect = camera.aspect;
    let a = cameraStops[0],
      b = cameraStops[1];
    for (let i = 1; i < cameraStops.length; i++) {
      a = cameraStops[i - 1];
      b = cameraStops[i];
      if (progress <= b.p) break;
    }
    let blend = THREE.MathUtils.clamp((progress - a.p) / (b.p - a.p), 0, 1);
    blend = blend * blend * (3 - 2 * blend);
    baseTarget.fromArray(a.target).lerp(new THREE.Vector3(...b.target), blend);
    let distance = THREE.MathUtils.lerp(a.distance, b.distance, blend);
    let side = THREE.MathUtils.lerp(a.side, b.side, blend);
    if (focusOverride === "overview") {
      baseTarget.set(0, 3, 0);
      distance = 96;
      side = -0.1;
    }
    if (focusOverride && workshop.stations.has(focusOverride)) {
      baseTarget.copy(workshop.stations.get(focusOverride).target);
      distance = 26;
      side = -0.38;
    }
    const azimuth = THREE.MathUtils.degToRad(
      THREE.MathUtils.lerp(a.azimuth, b.azimuth, blend),
    );
    let elevation = THREE.MathUtils.degToRad(
      THREE.MathUtils.lerp(a.elevation, b.elevation, blend),
    );
    if (mobile) elevation = Math.max(elevation, THREE.MathUtils.degToRad(38));
    const direction = new THREE.Vector3(
      Math.sin(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      Math.cos(azimuth) * Math.cos(elevation),
    );
    if (mobile) {
      // A dedicated elevated portrait view keeps all four stations in the upper scene.
      side = 0;
      distance = Math.max(
        distance * 1.22,
        (progress < 0.08 || progress > 0.94 ? 96 : 25) / Math.max(0.45, aspect),
      );
    } else distance = Math.max(distance, (progress < 0.08 ? 50 : 18) / aspect);
    goalTarget.copy(baseTarget);
    goalPosition.copy(baseTarget).addScaledVector(direction, distance);
    lookRight.set(direction.z, 0, -direction.x).normalize();
    const halfWidth =
      distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect;
    goalTarget.addScaledVector(lookRight, -side * halfWidth);
    goalPosition.addScaledVector(lookRight, -side * halfWidth);
    if (mobile) {
      // Shift the physical scene up, leaving a calm lower area for the HTML chapter card.
      goalTarget.y -= distance * 0.115;
      goalPosition.y -= distance * 0.115;
    }
    if (motion && !mobile) {
      goalPosition.x += parallax.x * 0.24;
      goalPosition.y -= parallax.y * 0.14;
    }
    if (!cameraReady || snap || !motion) {
      camera.position.copy(goalPosition);
      target.copy(goalTarget);
      cameraReady = true;
    } else {
      const follow = 1 - Math.exp(-Math.min(elapsed, 0.2) * 7);
      camera.position.lerp(goalPosition, follow);
      target.lerp(goalTarget, follow);
    }
    camera.lookAt(target);
  }
  function render(now) {
    frame = 0;
    if (disposed || contextLost || !visible || document.hidden) return;
    if (motion && now - lastFrame < 1000 / 30) {
      frame = requestAnimationFrame(render);
      return;
    }
    const elapsed = lastTime ? Math.min(0.5, (now - lastTime) / 1000) : 1 / 30;
    const delta = Math.min(0.08, elapsed);
    lastTime = now;
    lastFrame = now;
    if (motion) time += delta;
    const demo =
      demoStart === null ? null : Math.min(1, (now - demoStart) / 5000);
    pose(!motion, elapsed);
    workshop.update(time, demo, motion);
    try {
      renderer.render(scene, camera);
      canvas.hidden = false;
      host.dataset.state = "live";
      needsRender = false;
    } catch {
      host.dataset.state = "fallback";
      motion = false;
      return;
    }
    if (demo === 1) {
      demoStart = null;
      workshop.update(time, null, motion);
      needsRender = true;
    }
    if (motion || needsRender || demoStart !== null)
      frame = requestAnimationFrame(render);
  }
  function invalidate() {
    needsRender = true;
    if (!frame && !disposed && !contextLost && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  workshop.ready?.then(() => {
    if (!disposed) invalidate();
  });
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    invalidate();
  }
  function resize() {
    if (disposed || contextLost) return;
    mobile = mobileQuery.matches;
    const width = Math.max(1, host.clientWidth),
      height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
    pose(true);
    invalidate();
  }
  function projectAt(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    return (
      raycaster.intersectObjects(workshop.pickables, false)[0]?.object.userData
        .project || null
    );
  }
  function setHover(id) {
    if (hover === id) return;
    hover = id;
    canvas.style.cursor = id ? "pointer" : "default";
    onHover(id);
    workshop.setActive(id || (selected === "overview" ? null : selected));
    invalidate();
  }
  function onPointerMove(event) {
    setHover(projectAt(event));
    if (motion && !mobile && event.pointerType !== "touch") {
      parallax.copy(pointer);
      invalidate();
    }
  }
  function onLeave() {
    setHover(null);
    parallax.set(0, 0);
    invalidate();
  }
  let pointerDown = null;
  function onDown(event) {
    pointerDown = [event.clientX, event.clientY];
  }
  function onClick(event) {
    if (
      pointerDown &&
      Math.hypot(
        event.clientX - pointerDown[0],
        event.clientY - pointerDown[1],
      ) > 8
    )
      return;
    const id = projectAt(event);
    if (id) onSelect(id);
  }
  canvas.addEventListener("pointermove", onPointerMove, { passive: true });
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("pointerdown", onDown, { passive: true });
  canvas.addEventListener("click", onClick);
  function onLost(event) {
    event.preventDefault();
    contextLost = true;
    canvas.hidden = true;
    host.dataset.state = "fallback";
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function onRestored() {
    contextLost = false;
    renderer.shadowMap.needsUpdate = true;
    resize();
    sync();
  }
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  document.addEventListener("visibilitychange", sync);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
    sync();
  });
  observer.observe(host);
  resize();
  function focus(id = "overview") {
    selected = workshop.stations.has(id) ? id : "overview";
    focusOverride = selected;
    workshop.setActive(selected === "overview" ? null : selected);
    invalidate();
  }
  function setMotion(value) {
    motion = Boolean(value);
    if (!motion) {
      demoStart = null;
      parallax.set(0, 0);
      workshop.update(time, null, false);
    }
    sync();
  }
  function setScroll(value) {
    if (!Number.isFinite(value)) return;
    progress = THREE.MathUtils.clamp(value, 0, 1);
    focusOverride = null;
    invalidate();
  }
  function runDemo() {
    // Explicit user action also works with reduced motion as one static completed state.
    if (!motion) {
      workshop.update(time, 0.98, false);
      pose(true);
      renderer.render(scene, camera);
      return;
    }
    focus("overview");
    demoStart = performance.now();
    invalidate();
  }
  function getAnchors() {
    const rect = canvas.getBoundingClientRect();
    const anchors = {};
    for (const [id, station] of workshop.stations) {
      const p = station.target.clone().project(camera);
      anchors[id] = {
        x: ((p.x + 1) / 2) * rect.width,
        y: ((1 - p.y) / 2) * rect.height,
      };
    }
    return anchors;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    observer.disconnect();
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerleave", onLeave);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("click", onClick);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    document.removeEventListener("visibilitychange", sync);
    workshop.dispose();
    environmentTarget.dispose();
    key.shadow.dispose();
    renderer.renderLists.dispose();
    renderer.dispose();
    canvas.remove();
    host.dataset.state = "poster";
  }
  return { setMotion, setScroll, focus, runDemo, dispose, getAnchors };
}
