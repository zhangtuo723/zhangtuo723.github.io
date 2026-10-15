import * as THREE from "./assets/vendor/three.module.min.js";
import { RoundedBoxGeometry } from "./assets/vendor/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "./assets/vendor/utils/BufferGeometryUtils.js";

/** Original equipment; every screen is a labelled simulation, with no external data. */
export function createFactoryEquipment() {
  const root = new THREE.Group();
  root.name = "Factory equipment";
  root.userData.dynamic = true;
  const pickables = [],
    geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  const floor = 0.355,
    staging = new THREE.Group();
  const material = (color, options = {}) => {
    const result = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.54,
      ...options,
    });
    materials.add(result);
    return result;
  };
  const m = {
    shell: material("#b7c8d8", { metalness: 0.48 }),
    ink: material("#15243d", { metalness: 0.3 }),
    metal: material("#536579", { metalness: 0.82, roughness: 0.3 }),
    orange: material("#ffad52", { metalness: 0.2 }),
    teal: material("#2d6c8a", { metalness: 0.4 }),
    paper: material("#dfe9f1"),
    led: material("#50dfff", { emissive: "#2b9fff", emissiveIntensity: 1.25 }),
  };
  const texture = (w, h, paint) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    paint(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 2;
    textures.add(tex);
    return { canvas, ctx, tex };
  };
  const basic = (tex) => {
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    materials.add(mat);
    return mat;
  };
  const add = (parent, geo, mat, pos, id, rot = [0, 0, 0]) => {
    geometries.add(geo);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.fromArray(pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.project = id;
    parent.add(mesh);
    return mesh;
  };
  const box = (parent, size, pos, mat, id, radius = 0, rot) =>
    add(
      parent,
      radius
        ? new RoundedBoxGeometry(
            ...size,
            1,
            Math.min(radius, ...size.map((v) => v / 2.1)),
          )
        : new THREE.BoxGeometry(...size),
      mat,
      pos,
      id,
      rot,
    );
  const cyl = (parent, radius, height, pos, mat, id, rot, sides = 12) =>
    add(
      parent,
      new THREE.CylinderGeometry(radius, radius, height, sides),
      mat,
      pos,
      id,
      rot,
    );
  const plane = (parent, w, h, pos, mat, id, rot) => {
    const mesh = add(parent, new THREE.PlaneGeometry(w, h), mat, pos, id, rot);
    mesh.castShadow = false;
    return mesh;
  };
  const b = (size, pos, mat, id, r, rot) =>
    box(staging, size, pos, mat, id, r, rot);
  const cy = (r, h, pos, mat, id, rot, sides) =>
    cyl(staging, r, h, pos, mat, id, rot, sides);
  const rackTex = texture(512, 1024, (c, w, h) => {
    c.fillStyle = "#14263a";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#9db9ce";
    c.font = "bold 27px monospace";
    c.fillText("STORAGE / DEMO", 30, 51);
    for (let y = 78; y < 240; y += 12)
      for (let x = 24; x < w - 24; x += 12) {
        c.fillStyle = "#0a1627";
        c.fillRect(x, y, 5, 5);
      }
    [145, 365].forEach((x) => {
      c.fillStyle = "#0b1b2c";
      c.beginPath();
      c.arc(x, 163, 65, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#657d92";
      c.lineWidth = 5;
      c.stroke();
      for (let i = 0; i < 7; i++) {
        c.save();
        c.translate(x, 163);
        c.rotate((i * Math.PI * 2) / 7);
        c.fillStyle = "#8ca6bc";
        c.beginPath();
        c.ellipse(0, 28, 12, 30, 0.45, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      c.fillStyle = "#18364b";
      c.beginPath();
      c.arc(x, 163, 15, 0, Math.PI * 2);
      c.fill();
    });
    for (let row = 0; row < 12; row++) {
      const y = 266 + row * 54;
      c.fillStyle = "#526b83";
      c.fillRect(22, y, 468, 45);
      c.fillStyle = "#21384e";
      c.fillRect(30, y + 5, 450, 35);
      c.fillStyle = "#9ab8cf";
      c.fillRect(44, y + 11, 82, 20);
      c.fillStyle = "#1a3046";
      c.font = "bold 12px monospace";
      c.fillText(`SSD ${String(row + 1).padStart(2, "0")}`, 48, y + 25);
      for (let j = 0; j < 12; j++) {
        c.fillStyle = "#0b2136";
        c.fillRect(145 + j * 19, y + 9, 8, 25);
      }
      c.fillStyle = row % 3 ? "#50dfff" : "#ffad52";
      c.fillRect(443, y + 13, 8, 7);
      c.fillStyle = "#2b9fff";
      c.fillRect(458, y + 13, 8, 7);
    }
    c.fillStyle = "#94b8d2";
    c.font = "18px monospace";
    c.fillText("HOT SWAP / SIMULATION", 32, 975);
  });
  const rackMat = basic(rackTex.tex);
  const nodeLabels = texture(1024, 384, (c, w, h) => {
    c.fillStyle = "#10283f";
    c.fillRect(0, 0, w, h);
    for (let n = 0; n < 12; n++) {
      const x = (n % 4) * 256,
        y = Math.floor(n / 4) * 128;
      c.fillStyle = "#50dfff";
      c.fillRect(x + 8, y + 20, 5, 88);
      c.fillStyle = "#d2e9fa";
      c.font = "bold 32px monospace";
      c.fillText(`NODE ${String(n + 1).padStart(2, "0")}`, x + 28, y + 57);
      c.fillStyle = "#87b1ce";
      c.font = "19px monospace";
      c.fillText("SIMULATED ARRAY", x + 28, y + 91);
    }
  });
  nodeLabels.tex.name = "storage-node-number-labels";
  const nodeMat = basic(nodeLabels.tex);
  const labels = texture(1024, 512, (c, w, h) => {
    c.fillStyle = "#18324b";
    c.fillRect(0, 0, w, h);
    ["DATA STORAGE", "DESIGN / CODE", "ASSEMBLY LINE", "TOOLS / PARTS"].forEach(
      (text, i) => {
        c.fillStyle = "#d3eafa";
        c.font = "bold 36px monospace";
        c.fillText(text, 26, i * 128 + 55);
        c.fillStyle = "#50dfff";
        c.font = "22px monospace";
        c.fillText(`0${i + 1}   /   DEMONSTRATION`, 28, i * 128 + 98);
      },
    );
  });
  const labelMat = basic(labels.tex);
  const label = (w, h, pos, row, id) => {
    const mesh = plane(staging, w, h, pos, labelMat, id),
      uv = mesh.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, (uv.getY(i) + (3 - row)) / 4);
  };
  const screen = texture(1024, 512, () => {}),
    screenMat = basic(screen.tex);
  screen.tex.name = "factory-simulation-dashboard";
  rackTex.tex.name = "storage-cabinet-caddies-and-fans";
  labels.tex.name = "factory-equipment-labels";
  const paintScreens = (time) => {
    const c = screen.ctx;
    c.fillStyle = "#081b30";
    c.fillRect(0, 0, 1024, 512);
    c.fillStyle = "#d5edff";
    c.font = "bold 29px monospace";
    c.fillText("FACTORY SYSTEMS", 30, 45);
    c.fillStyle = "#ffad52";
    c.font = "19px monospace";
    c.fillText("SIMULATION / DEMO", 745, 43);
    c.fillStyle = "#102b45";
    c.fillRect(24, 72, 635, 276);
    c.fillRect(681, 72, 319, 276);
    c.fillRect(24, 368, 976, 122);
    c.strokeStyle = "#224562";
    c.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      c.beginPath();
      c.moveTo(45, 109 + i * 33);
      c.lineTo(635, 109 + i * 33);
      c.stroke();
    }
    ["#50dfff", "#2b9fff"].forEach((color, j) => {
      c.strokeStyle = color;
      c.lineWidth = 3;
      c.beginPath();
      for (let i = 0; i < 68; i++) {
        const x = 45 + i * 8.6,
          y =
            204 +
            Math.sin(i * 0.23 + time * 0.65 + j) * 41 +
            Math.cos(i * 0.77 + time * 0.4) * 14 +
            j * 23;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    });
    c.fillStyle = "#a1c4df";
    c.font = "17px monospace";
    c.fillText("SYNTHETIC DATA FLOW", 45, 101);
    c.fillText("JOB QUEUE", 703, 101);
    for (let i = 0; i < 5; i++) {
      const y = 128 + i * 39,
        progress = 0.35 + 0.3 * Math.sin(time * 0.26 + i * 0.8);
      c.fillStyle = "#aac8dd";
      c.font = "15px monospace";
      c.fillText(`TASK 0${i + 1}`, 704, y);
      c.fillStyle = "#284965";
      c.fillRect(805, y - 13, 171, 14);
      c.fillStyle = i % 2 ? "#ffad52" : "#50dfff";
      c.fillRect(805, y - 13, 171 * progress, 14);
    }
    c.fillStyle = "#a1c4df";
    c.font = "16px monospace";
    c.fillText("STORAGE CLUSTER / VIRTUAL NODES", 43, 395);
    for (let i = 0; i < 24; i++) {
      c.fillStyle = (i + Math.floor(time * 2)) % 11 ? "#2b9fff" : "#ffad52";
      c.fillRect(45 + i * 39, 414, 28, 45);
      c.fillStyle = "#0e2841";
      c.fillRect(49 + i * 39, 420, 20, 5);
      c.fillRect(49 + i * 39, 432, 20, 5);
    }
    screen.tex.needsUpdate = true;
  };
  paintScreens(0);

  // 12 cabinets, 144 drive caddies, paired fans, louvers, handles and connected cable trays.
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 4; col++) {
      const x = 5.8 + col * 3.4,
        z = -12.3 + row * 3.4,
        id = "analysis";
      b([2, 4.8, 1.7], [x, floor + 2.4, z], m.shell, id, 0.07);
      b([1.88, 4.45, 0.09], [x, floor + 2.37, z + 0.87], m.ink, id);
      plane(staging, 1.71, 4.17, [x, floor + 2.39, z + 0.925], rackMat, id);
      for (const dx of [-0.95, 0.95]) {
        b([0.07, 4.48, 0.11], [x + dx, floor + 2.4, z + 0.94], m.metal, id);
        b([0.13, 0.2, 1.5], [x + dx * 0.76, floor + 0.11, z], m.ink, id);
      }
      b(
        [0.1, 0.66, 0.13],
        [x + 0.79, floor + 2.45, z + 1.01],
        m.metal,
        id,
        0.03,
      );
      b([1.74, 0.08, 0.5], [x, floor + 4.83, z - 0.2], m.ink, id);
      b([0.12, 0.06, 0.24], [x - 0.71, floor + 4.89, z + 0.15], m.orange, id);
      for (let i = 0; i < 7; i++)
        b(
          [0.04, 0.055, 0.86],
          [x - 1.025, floor + 1.3 + i * 0.28, z],
          m.ink,
          id,
        );
      for (let i = 0; i < 6; i++)
        b(
          [1.68, 0.026, 0.15],
          [x, floor + 0.76 + i * 0.54, z + 0.94],
          m.metal,
          id,
        );
      b([2.12, 0.12, 1.78], [x, floor + 0.08, z], m.ink, id);
      b([0.032, 4.3, 0.035], [x - 0.9, floor + 2.4, z + 1.005], m.led, id);
      const nodePlate = plane(
        staging,
        1.65,
        0.38,
        [x, floor + 4.55, z + 0.945],
        nodeMat,
        id,
      );
      const nodeUV = nodePlate.geometry.attributes.uv;
      for (let i = 0; i < nodeUV.count; i++) {
        nodeUV.setXY(
          i,
          (nodeUV.getX(i) + col) / 4,
          (nodeUV.getY(i) + (2 - row)) / 3,
        );
      }
    }
  b([14.4, 3.35, 0.32], [10, 6.6, -15.61], m.ink, "analysis", 0.08);
  plane(staging, 13.86, 2.88, [10, 6.6, -15.43], screenMat, "analysis");
  label(5, 0.63, [10, 8.65, -15.4], 0, "analysis");
  for (const z of [-12.3, -8.9, -5.5])
    b([13.3, 0.12, 0.36], [10.8, 5.7, z], m.metal, "analysis");
  for (let i = 0; i < 5; i++)
    b(
      [0.035, 0.035, 10],
      [5.1 + i * 0.1, 5.82, -8.8],
      i % 2 ? m.teal : m.orange,
      "analysis",
    );

  // Four dual-screen desks, full keyboards, mice, towers, notebooks, cups and swivel chairs.
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 2; col++) {
      const x = -13.8 + col * 6,
        z = 8 + row * 4,
        id = "poetry";
      b([4.8, 0.16, 2.1], [x, 2.3, z], m.shell, id, 0.06);
      for (const dx of [-2.1, 2.1]) {
        for (const dz of [-0.65, 0.65])
          b([0.12, 1.86, 0.12], [x + dx, floor + 0.93, z + dz], m.metal, id);
        b([0.55, 0.055, 1.5], [x + dx, floor + 0.035, z], m.ink, id);
      }
      b([4.2, 0.12, 0.12], [x, 1.65, z - 0.65], m.metal, id);
      for (const dx of [-1.07, 1.07]) {
        b([1.92, 1.12, 0.14], [x + dx, 3.26, z - 0.47], m.ink, id, 0.035);
        plane(staging, 1.77, 0.97, [x + dx, 3.26, z - 0.39], screenMat, id);
        b([0.12, 0.43, 0.11], [x + dx, 2.62, z - 0.55], m.metal, id);
        b([0.73, 0.055, 0.43], [x + dx, 2.42, z - 0.47], m.ink, id, 0.02);
      }
      b([1.32, 0.065, 0.5], [x - 0.25, 2.43, z + 0.36], m.ink, id, 0.02);
      for (let kr = 0; kr < 4; kr++)
        for (let kc = 0; kc < 12; kc++)
          b(
            [0.083, 0.019, 0.073],
            [x - 0.8 + kc * 0.101, 2.472, z + 0.18 + kr * 0.102],
            m.paper,
            id,
          );
      b([0.2, 0.1, 0.3], [x + 0.76, 2.45, z + 0.34], m.ink, id, 0.055);
      b([0.67, 1.15, 0.9], [x + 1.63, 1.05, z - 0.28], m.ink, id, 0.045);
      b([0.49, 0.85, 0.035], [x + 1.63, 1.13, z + 0.19], m.metal, id);
      b([0.07, 0.07, 0.03], [x + 1.8, 1.5, z + 0.215], m.led, id);
      b([0.59, 0.055, 0.8], [x - 1.73, 2.43, z + 0.32], m.teal, id, 0.015);
      b([0.53, 0.015, 0.73], [x - 1.73, 2.465, z + 0.32], m.paper, id);
      b(
        [0.027, 0.027, 0.54],
        [x - 1.41, 2.48, z + 0.25],
        m.orange,
        id,
        0,
        [0, 0.22, 0],
      );
      cy(0.14, 0.31, [x + 1.65, 2.55, z + 0.37], m.shell, id);
      cy(0.115, 0.008, [x + 1.65, 2.71, z + 0.37], m.ink, id);
      b([0.11, 0.14, 0.075], [x + 1.84, 2.57, z + 0.37], m.shell, id, 0.035);
      const cz = z + 1.5;
      b([1.1, 0.15, 0.91], [x, 1.23, cz], m.teal, id, 0.09);
      b(
        [1.07, 0.95, 0.14],
        [x, 1.88, cz + 0.45],
        m.ink,
        id,
        0.09,
        [-0.08, 0, 0],
      );
      b(
        [0.92, 0.76, 0.07],
        [x, 1.9, cz + 0.36],
        m.teal,
        id,
        0.05,
        [-0.08, 0, 0],
      );
      cy(0.1, 0.73, [x, 0.85, cz], m.metal, id);
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        b(
          [0.075, 0.07, 0.7],
          [x + Math.sin(a) * 0.2, floor + 0.16, cz + Math.cos(a) * 0.2],
          m.metal,
          id,
          0,
          [0, a, 0],
        );
        cy(
          0.1,
          0.1,
          [x + Math.sin(a) * 0.39, floor + 0.1, cz + Math.cos(a) * 0.39],
          m.ink,
          id,
          [Math.PI / 2, 0, 0],
          8,
        );
      }
      for (const dx of [-0.59, 0.59]) {
        b([0.055, 0.4, 0.055], [x + dx, 1.49, cz], m.metal, id);
        b([0.13, 0.07, 0.61], [x + dx, 1.71, cz], m.ink, id, 0.025);
      }
    }
  label(3.5, 0.5, [-13.8, 4.4, 7.46], 1, "poetry");
  b([1.75, 1.45, 1.22], [-17.6, floor + 0.725, 8], m.shell, "poetry", 0.07);
  b([1.64, 0.45, 1.08], [-17.6, 2.02, 8], m.ink, "poetry", 0.045);
  b([1.49, 0.12, 0.99], [-17.6, 2.32, 8], m.shell, "poetry", 0.035);
  b([1.04, 0.04, 0.64], [-17.6, 2.398, 8], m.ink, "poetry");
  b([0.98, 0.015, 0.53], [-17.6, 1.8, 8.65], m.paper, "poetry");
  for (let i = 0; i < 3; i++) {
    b([1.54, 0.04, 0.07], [-17.6, 0.7 + i * 0.33, 8.65], m.metal, "poetry");
    b([0.43, 0.05, 0.05], [-17.6, 0.82 + i * 0.33, 8.7], m.ink, "poetry");
  }

  // Roller conveyor with safety rails, bearings, motor, four circulating trays and component payloads.
  const assemblyId = "flappy",
    lineZ = 7;
  b([9.5, 0.3, 1.55], [12.5, 1.35, lineZ], m.ink, assemblyId, 0.06);
  for (const x of [8.3, 11, 14, 16.7])
    for (const dz of [-0.59, 0.59]) {
      b(
        [0.13, 0.85, 0.13],
        [x, floor + 0.425, lineZ + dz],
        m.metal,
        assemblyId,
      );
      b([0.36, 0.055, 0.36], [x, floor + 0.03, lineZ + dz], m.ink, assemblyId);
    }
  for (let i = 0; i < 33; i++)
    cy(
      0.105,
      1.32,
      [8.1 + i * 0.275, 1.55, lineZ],
      m.metal,
      assemblyId,
      [Math.PI / 2, 0, 0],
      10,
    );
  for (const dz of [-0.84, 0.84]) {
    b([9.5, 0.12, 0.11], [12.5, 1.73, lineZ + dz], m.orange, assemblyId);
    for (const x of [8.1, 10.3, 12.5, 14.7, 16.9])
      b([0.07, 0.38, 0.07], [x, 1.56, lineZ + dz], m.metal, assemblyId);
  }
  b([0.7, 0.65, 0.65], [16.6, 1.04, 8.04], m.teal, assemblyId, 0.04);
  cy(0.23, 0.72, [16.6, 1.04, 8.04], m.ink, assemblyId, [0, 0, Math.PI / 2]);
  label(4, 0.58, [12.5, 2.44, 6.98], 2, assemblyId);
  const trayGeo = new RoundedBoxGeometry(1.1, 0.23, 1.02, 1, 0.035),
    payloadGeo = new THREE.BoxGeometry(0.65, 0.43, 0.61);
  geometries.add(trayGeo);
  geometries.add(payloadGeo);
  const trays = new THREE.InstancedMesh(trayGeo, m.shell, 4),
    payloads = new THREE.InstancedMesh(payloadGeo, m.teal, 4);
  trays.name = "conveyor-unit-trays";
  payloads.name = "conveyor-unit-payloads";
  for (const mesh of [trays, payloads]) {
    mesh.userData.project = assemblyId;
    // Only static equipment enters the scene's cached shadow map.
    mesh.castShadow = false;
    root.add(mesh);
    pickables.push(mesh);
  }
  const arms = [];
  function arm(x, z, phase) {
    b([1.55, 0.24, 1.45], [x, floor + 0.12, z], m.ink, assemblyId, 0.05);
    cy(0.48, 0.68, [x, floor + 0.58, z], m.shell, assemblyId);
    const yaw = new THREE.Group();
    yaw.name = `industrial-arm-${arms.length + 1}`;
    yaw.position.set(x, floor + 0.95, z);
    root.add(yaw);
    const shoulder = new THREE.Group();
    shoulder.rotation.z = -0.45;
    yaw.add(shoulder);
    cyl(shoulder, 0.31, 0.7, [0, 0, 0], m.ink, assemblyId, [0, 0, Math.PI / 2]);
    box(shoulder, [0.43, 1.75, 0.48], [0, 0.8, 0], m.orange, assemblyId, 0.09);
    const elbow = new THREE.Group();
    elbow.position.y = 1.62;
    shoulder.add(elbow);
    cyl(elbow, 0.27, 0.65, [0, 0, 0], m.ink, assemblyId, [0, 0, Math.PI / 2]);
    box(elbow, [0.34, 1.38, 0.38], [0, 0.62, 0], m.shell, assemblyId, 0.07);
    box(elbow, [0.49, 0.28, 0.48], [0, 1.34, 0], m.ink, assemblyId, 0.035);
    for (const dx of [-0.24, 0.24])
      box(elbow, [0.09, 0.42, 0.12], [dx, 1.61, 0], m.metal, assemblyId);
    arms.push({ yaw, shoulder, elbow, phase });
  }
  arm(8.5, 9.7, 0);
  arm(15, 9.7, 2.1);

  // Open-frame warehouse shelving, 18 labelled parts bins and a mobile electronics test bench.
  function shelf(x, z) {
    const id = "forgekit";
    for (const dx of [-1.8, 1.8])
      for (const dz of [-0.58, 0.58])
        b([0.085, 3.55, 0.085], [x + dx, floor + 1.775, z + dz], m.metal, id);
    for (const y of [0.18, 1.3, 2.42, 3.5]) {
      b([3.8, 0.1, 1.4], [x, floor + y, z], m.ink, id);
      if (y < 3.5)
        for (let i = 0; i < 3; i++) {
          const bx = x - 1.2 + i * 1.2;
          b(
            [1.05, 0.65, 1.13],
            [bx, floor + y + 0.39, z],
            i % 2 ? m.shell : m.teal,
            id,
            0.045,
          );
          b([0.33, 0.08, 0.025], [bx, floor + y + 0.46, z + 0.58], m.ink, id);
          b([0.48, 0.16, 0.028], [bx, floor + y + 0.22, z + 0.58], m.paper, id);
          b([1.09, 0.055, 1.16], [bx, floor + y + 0.73, z], m.metal, id);
        }
    }
    label(3.45, 0.49, [x, floor + 3.85, z + 0.73], 3, id);
  }
  shelf(-16, -12);
  shelf(-16, -5.8);
  const tx = -18.0,
    tz = -3.9;
  b([2.3, 0.13, 1.3], [tx, 1.75, tz], m.shell, "forgekit", 0.04);
  b([2.3, 0.1, 1.3], [tx, 0.65, tz], m.ink, "forgekit");
  for (const dx of [-1, 1])
    for (const dz of [-0.5, 0.5]) {
      b([0.08, 1.3, 0.08], [tx + dx, 1.05, tz + dz], m.metal, "forgekit");
      cy(
        0.13,
        0.13,
        [tx + dx, floor + 0.13, tz + dz],
        m.ink,
        "forgekit",
        [Math.PI / 2, 0, 0],
        8,
      );
    }
  b([1.1, 0.58, 0.73], [tx - 0.32, 2.08, tz], m.ink, "forgekit", 0.045);
  b([0.65, 0.36, 0.035], [tx - 0.48, 2.08, tz + 0.39], m.led, "forgekit");
  for (let i = 0; i < 3; i++)
    cy(
      0.05,
      0.03,
      [tx + 0.55, 1.96 + i * 0.14, tz + 0.39],
      m.orange,
      "forgekit",
      [Math.PI / 2, 0, 0],
      8,
    );

  // Preserve raycast project IDs while batching all static geometry by material.
  const buckets = new Map();
  staging.updateMatrixWorld(true);
  staging.traverse((node) => {
    if (!node.isMesh) return;
    const key = `${node.material.uuid}:${node.userData.project}`;
    if (!buckets.has(key))
      buckets.set(key, {
        mat: node.material,
        id: node.userData.project,
        list: [],
      });
    const transformed = node.geometry.clone().applyMatrix4(node.matrixWorld);
    if (transformed.index) {
      buckets.get(key).list.push(transformed.toNonIndexed());
      transformed.dispose();
    } else buckets.get(key).list.push(transformed);
  });
  for (const bucket of buckets.values()) {
    const geo = mergeGeometries(bucket.list, false);
    bucket.list.forEach((g) => g.dispose());
    if (!geo) continue;
    geometries.add(geo);
    const mesh = new THREE.Mesh(geo, bucket.mat);
    mesh.castShadow = !bucket.mat.isMeshBasicMaterial;
    mesh.receiveShadow = true;
    mesh.userData.project = bucket.id;
    root.add(mesh);
    pickables.push(mesh);
  }
  // Articulated shoulder / elbow pivots each get a compact material batch.
  for (const a of arms)
    for (const pivot of [a.shoulder, a.elbow]) {
      const groups = new Map();
      for (const node of [...pivot.children]) {
        if (!node.isMesh) continue;
        node.updateMatrix();
        if (!groups.has(node.material)) groups.set(node.material, []);
        const transformed = node.geometry.clone().applyMatrix4(node.matrix);
        if (transformed.index) {
          groups.get(node.material).push(transformed.toNonIndexed());
          transformed.dispose();
        } else groups.get(node.material).push(transformed);
        pivot.remove(node);
      }
      for (const [mat, source] of groups) {
        const geo = mergeGeometries(source, false);
        source.forEach((g) => g.dispose());
        geometries.add(geo);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = false;
        mesh.userData.project = assemblyId;
        pivot.add(mesh);
        pickables.push(mesh);
      }
    }
  const retained = new Set();
  root.traverse((node) => {
    if (node.isMesh) retained.add(node.geometry);
  });
  for (const geo of geometries)
    if (!retained.has(geo)) {
      geo.dispose();
      geometries.delete(geo);
    }
  const transform = new THREE.Object3D();
  let disposed = false,
    lastScreen = -Infinity,
    lastMotionTime = 0;
  function update(time = 0, motion = true) {
    if (disposed) return;
    // Retain the current pose when motion is disabled, instead of snapping props back to their origin.
    if (motion) lastMotionTime = time;
    const t = lastMotionTime;
    if (motion && (time - lastScreen >= 0.33 || time < lastScreen)) {
      paintScreens(time);
      lastScreen = time;
    }
    for (let i = 0; i < 4; i++) {
      const x = 8.35 + ((i * 2.15 + t * 0.44) % 8.3);
      transform.position.set(x, 1.79, lineZ);
      transform.updateMatrix();
      trays.setMatrixAt(i, transform.matrix);
      transform.position.y = 2.12;
      transform.updateMatrix();
      payloads.setMatrixAt(i, transform.matrix);
    }
    trays.instanceMatrix.needsUpdate = true;
    payloads.instanceMatrix.needsUpdate = true;
    // Instanced bounding volumes are kept conservative as payloads travel along the entire belt.
    for (const mesh of [trays, payloads]) mesh.frustumCulled = false;
    for (const a of arms) {
      a.yaw.rotation.y = -0.4 + Math.sin(t * 0.37 + a.phase) * 0.22;
      a.shoulder.rotation.x = -0.65 + Math.sin(t * 0.53 + a.phase) * 0.18;
      a.elbow.rotation.x = -1.15 + Math.cos(t * 0.53 + a.phase) * 0.18;
    }
  }
  update(0, false);
  function dispose() {
    if (disposed) return;
    disposed = true;
    geometries.forEach((g) => g.dispose());
    materials.forEach((mat) => mat.dispose());
    textures.forEach((tex) => tex.dispose());
    trays.dispose();
    payloads.dispose();
    root.clear();
    pickables.length = 0;
  }
  return { root, pickables, update, dispose };
}
