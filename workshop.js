import * as THREE from "./assets/vendor/three.module.min.js";
import { createFactoryEquipment } from "./factory-props.js";
import { createFactoryRobot } from "./factory-robot.js";
import { RoundedBoxGeometry } from "./assets/vendor/geometries/RoundedBoxGeometry.js";

/** A small, original studio made from editable geometry, rather than a character asset. */
export function createWorkshop() {
  const root = new THREE.Group();
  const pickables = [];
  const stations = new Map();
  const resources = {
    textures: new Set(),
    materials: new Set(),
    geometries: new Set(),
  };
  const palette = {
    navy: "#23384d",
    ink: "#101d30",
    cream: "#a6bbcf",
    clay: "#ec9a46",
    green: "#388da0",
    lime: "#b8ca89",
    wood: "#697f96",
    paper: "#c6d9eb",
  };
  const material = (color, options = {}) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.48,
      metalness: 0.24,
      ...options,
    });
    resources.materials.add(m);
    return m;
  };
  const mats = {
    cream: material(palette.cream),
    navy: material(palette.navy),
    ink: material(palette.ink),
    orange: material(palette.clay),
    green: material(palette.green),
    leaf: material("#377b84"),
    paper: material(palette.paper),
    metal: material("#92aabe", { metalness: 0.6, roughness: 0.35 }),
    rubber: material("#142232", { roughness: 0.94 }),
    soil: material("#182735"),
    lamp: material("#8becff", { emissive: "#29c8ff", emissiveIntensity: 1.4 }),
    led: material("#63e6ff", { emissive: "#24bdff", emissiveIntensity: 2 }),
    glass: material("#b8dbcf", {
      transparent: true,
      opacity: 0.11,
      roughness: 0.12,
      metalness: 0.1,
      depthWrite: false,
    }),
  };
  const add = (parent, geometry, mat, position = [0, 0, 0], rotation) => {
    resources.geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.fromArray(position);
    if (rotation) mesh.rotation.set(...rotation);
    mesh.castShadow = !mat.transparent;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const box = (parent, dimensions, position, mat, radius = 0.06, rotation) =>
    add(
      parent,
      new RoundedBoxGeometry(
        ...dimensions,
        2,
        Math.min(radius, Math.min(...dimensions) / 2.1),
      ),
      mat,
      position,
      rotation,
    );
  const cylinder = (
    parent,
    top,
    bottom,
    height,
    position,
    mat,
    segments = 20,
    rotation,
  ) =>
    add(
      parent,
      new THREE.CylinderGeometry(top, bottom, height, segments),
      mat,
      position,
      rotation,
    );
  const sphere = (parent, radius, position, mat, scale = [1, 1, 1]) => {
    const mesh = add(
      parent,
      new THREE.SphereGeometry(radius, 12, 8),
      mat,
      position,
    );
    mesh.scale.fromArray(scale);
    return mesh;
  };
  const texture = (width, height, paint) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    paint(ctx, width, height);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    resources.textures.add(tex);
    return tex;
  };
  const screenMaterial = (tex) => {
    const m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    resources.materials.add(m);
    return m;
  };
  const plane = (parent, width, height, position, mat, rotation) => {
    const mesh = add(
      parent,
      new THREE.PlaneGeometry(width, height),
      mat,
      position,
      rotation,
    );
    mesh.castShadow = false;
    return mesh;
  };
  const labelTexture = (title, subtitle, bg = "#14263b", fg = "#8ee9ff") =>
    texture(512, 160, (c, w, h) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, w, h);
      c.fillStyle = fg;
      c.font = "bold 58px monospace";
      c.fillText(title, 28, 74);
      c.font = "24px monospace";
      c.fillText(subtitle, 30, 120);
    });
  const label = (parent, title, subtitle, size, pos, rotation) =>
    plane(
      parent,
      size[0],
      size[1],
      pos,
      screenMaterial(labelTexture(title, subtitle)),
      rotation,
    );
  const screwGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.013, 10);
  resources.geometries.add(screwGeo);
  const screws = [];
  const screw = (x, y, z) => screws.push(new THREE.Vector3(x, y, z));
  const woodTex = texture(1024, 512, (c, w, h) => {
    c.fillStyle = "#6c8298";
    c.fillRect(0, 0, w, h);
    let seed = 72;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 260; i++) {
      const y = rand() * h;
      c.strokeStyle = `rgba(190,219,245,${0.025 + rand() * 0.055})`;
      c.lineWidth = 0.5 + rand() * 2;
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= w; x += 64)
        c.lineTo(x, y + Math.sin(x / 160 + i) * 3);
      c.stroke();
    }
  });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  const wood = material("#d0e3f2", {
    map: woodTex,
    roughness: 0.4,
    metalness: 0.52,
  });
  // A forty-by-thirty-two cutaway AI factory, open to the south and east.
  const wall = material("#26394d", { metalness: 0.36 });
  const floor = material("#1d2e43", { metalness: 0.32, roughness: 0.61 });
  const teal = material("#2e6a7e");
  const trim = material("#425b74", { metalness: 0.58 });
  box(root, [40.8, 0.4, 32.8], [0, 0, 0], mats.ink, 0.18);
  box(root, [40.4, 0.15, 32.4], [0, 0.28, 0], floor, 0.08);
  // Tall industrial walls, high windows, columns and open roof trusses.
  box(root, [40.2, 2.4, 0.3], [0, 1.6, -16], wall, 0.05);
  box(root, [40.2, 1.2, 0.3], [0, 10.2, -16], wall, 0.05);
  box(root, [0.3, 10.4, 32.3], [-20, 5.6, 0], wall, 0.05);
  const windowMat = material("#24465d", {
    emissive: "#20577c",
    emissiveIntensity: 0.4,
    metalness: 0.5,
    roughness: 0.18,
  });
  for (const x of [-13.6, -7, 7, 13.6]) {
    box(root, [5.9, 5.8, 0.08], [x, 6.25, -16.04], windowMat, 0.02);
    for (const dx of [-2.95, 0, 2.95])
      box(root, [0.1, 6, 0.32], [x + dx, 6.25, -15.84], mats.metal, 0.015);
    box(root, [6, 0.1, 0.32], [x, 6.2, -15.84], mats.metal, 0.015);
    box(root, [6.2, 0.12, 0.6], [x, 3.25, -15.7], trim, 0.025);
  }
  for (const x of [-19.7, -3.7, 3.7, 19.7])
    box(root, [0.5, 10.1, 0.6], [x, 5.45, -15.75], mats.navy, 0.035);
  for (const z of [-14, -4, 6, 15]) {
    box(root, [0.6, 10.1, 0.55], [-19.65, 5.45, z], mats.navy, 0.035);
    box(root, [0.12, 3.2, 5.8], [-19.8, 7.5, z - 1], windowMat, 0.02);
    box(root, [0.06, 0.08, 5.8], [-19.69, 7.5, z - 1], mats.lamp, 0.01);
  }
  box(root, [40.3, 0.3, 0.7], [0, 10.8, -15.8], trim, 0.04);
  box(root, [0.7, 0.3, 32.2], [-19.8, 10.8, 0], trim, 0.04);
  for (const z of [-14, 1]) {
    box(root, [39.2, 0.22, 0.2], [0, 10.65, z], mats.navy, 0.03);
    box(root, [31, 0.045, 0.12], [0, 10.49, z], mats.lamp, 0.02);
  }
  box(root, [7.4, 3.2, 0.3], [0, 8, -16], wall, 0.04);
  box(root, [5.2, 6.3, 0.25], [0, 3.55, -15.76], mats.navy, 0.08);
  for (const x of [-1.23, 1.23])
    box(root, [2.34, 5.7, 0.15], [x, 3.48, -15.58], trim, 0.04);
  box(root, [0.06, 5.6, 0.035], [0, 3.5, -15.46], mats.lamp, 0.01);
  label(
    root,
    "AI FACTORY / 723",
    "COMPUTE  >  BUILD  >  SHIP",
    [5.7, 1.6],
    [0, 8.3, -15.65],
  );
  // Wide protected central lanes and smaller production/office lanes.
  const lane = material("#223d55", { metalness: 0.25, roughness: 0.7 });
  box(root, [7.8, 0.015, 30], [0, 0.37, 0], lane, 0.01);
  box(root, [37, 0.016, 6.4], [0, 0.38, 0], lane, 0.01);
  for (const x of [-4, 4])
    box(root, [0.07, 0.02, 30.7], [x, 0.4, 0], mats.lamp, 0.008);
  for (const z of [-3.25, 3.25])
    box(root, [37, 0.02, 0.07], [0, 0.4, z], mats.lamp, 0.008);
  for (let z = -14; z <= 14; z += 2) {
    box(root, [0.07, 0.022, 0.7], [0, 0.41, z], mats.cream, 0.008);
  }
  for (let x = -18; x <= 18; x += 3)
    box(root, [0.018, 0.012, 31.6], [x, 0.365, 0], trim, 0.005);
  for (let z = -15; z <= 15; z += 3)
    box(root, [39.6, 0.012, 0.018], [0, 0.365, z], trim, 0.005);
  const bench = (x, z, width = 7, depth = 3, height = 2.5) => {
    box(root, [width, 0.28, depth], [x, height, z], wood, 0.09);
    box(
      root,
      [width - 0.3, 0.32, 0.13],
      [x, height - 0.3, z + depth / 2 - 0.2],
      mats.navy,
      0.025,
    );
    for (const dx of [-width / 2 + 0.4, width / 2 - 0.4])
      for (const dz of [-depth / 2 + 0.3, depth / 2 - 0.3]) {
        box(
          root,
          [0.17, height - 0.45, 0.17],
          [x + dx, (height + 0.3) / 2, z + dz],
          mats.navy,
          0.025,
        );
        box(root, [0.3, 0.1, 0.3], [x + dx, 0.42, z + dz], mats.rubber, 0.025);
      }
  };
  bench(-12, -9, 7.3, 3.2);
  bench(9, -1.5, 7, 3);
  bench(0, -0.7, 4.4, 2.7);
  bench(-16, 4, 4.6, 2.5, 2);
  // ForgeKit production tools remain identifiable beside the larger industrial equipment.
  box(root, [7.2, 3.2, 0.2], [-12, 4.75, -12.2], mats.navy, 0.05);
  const pegGeo = new THREE.CircleGeometry(0.042, 8);
  resources.geometries.add(pegGeo);
  const pegHoles = new THREE.InstancedMesh(pegGeo, mats.metal, 90);
  const temp = new THREE.Matrix4();
  let hole = 0;
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 15; col++) {
      temp.makeTranslation(-15.2 + col * 0.46, 3.5 + row * 0.45, -12.08);
      pegHoles.setMatrixAt(hole++, temp);
    }
  root.add(pegHoles);
  for (let i = 0; i < 5; i++) {
    box(
      root,
      [0.16, 1.1, 0.12],
      [-14.7 + i * 1.2, 4.6, -11.96],
      i % 2 ? mats.orange : mats.metal,
      0.04,
      [0, 0, (i - 2) * 0.1],
    );
    box(
      root,
      [0.55, 0.2, 0.13],
      [-14.7 + i * 1.2, 5.19, -11.94],
      mats.metal,
      0.04,
    );
  }
  box(root, [1.7, 3.8, 2], [-17, 2.3, -9], mats.navy, 0.07);
  for (let y = 1; y < 4; y += 0.75) {
    box(root, [1.55, 0.6, 0.05], [-17, y, -7.97], trim, 0.02);
    box(root, [0.55, 0.06, 0.09], [-17, y, -7.91], mats.metal, 0.02);
  }
  for (const y of [0.9, 1.9])
    box(root, [1.7, 0.15, 1.4], [-7.2, y, -10.7], mats.orange, 0.04);
  for (const x of [-7.9, -6.5])
    for (const z of [-11.2, -10.2]) {
      box(root, [0.08, 1.65, 0.08], [x, 1.35, z], mats.navy, 0.02);
      cylinder(root, 0.14, 0.14, 0.09, [x, 0.48, z], mats.rubber, 12, [
        0,
        0,
        Math.PI / 2,
      ]);
    }
  for (let i = 0; i < 3; i++)
    box(
      root,
      [0.4, 0.35, 0.55],
      [-7.75 + i * 0.55, 2.12, -10.7],
      [mats.green, mats.cream, mats.navy][i],
      0.03,
    );
  label(
    root,
    "01 / TOOL FABRICATION",
    "MODULAR SYSTEMS",
    [6, 1.45],
    [-12, 8.6, -15.62],
  );
  label(
    root,
    "02 / DATA HALL",
    "STORAGE + COMPUTE",
    [6, 1.45],
    [11, 8.6, -15.62],
  );
  label(
    root,
    "04 / CREATIVE SYSTEMS",
    "OFFICE + MODEL LAB",
    [5.8, 1.4],
    [-19.8, 7.7, 9],
    [0, Math.PI / 2, 0],
  );
  // Charging stations, inset indicators and the central dispatch island.
  box(root, [3.7, 0.16, 1.65], [0, 0.45, -4.5], mats.navy, 0.07);
  for (const x of [-1.1, 1.1])
    box(root, [1.3, 0.025, 1.4], [x, 0.55, -4.5], trim, 0.04);
  label(
    root,
    "DISPATCH",
    "LOCAL SIMULATION / READY",
    [3.3, 0.9],
    [0, 1.77, 0.69],
  );
  const station = (id, position, target) => {
    const group = new THREE.Group();
    group.position.fromArray(position);
    group.userData.project = id;
    root.add(group);
    stations.set(id, {
      group,
      target: new THREE.Vector3(...target),
      light: null,
    });
    return group;
  };
  const register = (group, id) =>
    group.traverse((node) => {
      if (node.isMesh) {
        node.userData.project = id;
        pickables.push(node);
      }
    });
  const status = (group, x, y, z, id) => {
    const led = sphere(group, 0.037, [x, y, z], mats.led);
    stations.get(id).light = led;
  };

  // FORGEKIT: tool drawers, sockets, removable colored modules.
  const forge = station("forgekit", [-12, 2.65, -9], [-12, 3.5, -9]);
  forge.scale.setScalar(1.8);
  box(forge, [1.65, 0.62, 1.13], [0, 0.31, 0], mats.navy, 0.08);
  box(forge, [1.58, 0.1, 1.09], [0, 0.67, 0], mats.cream, 0.04);
  for (let i = 0; i < 2; i++) {
    box(
      forge,
      [1.43, 0.2, 0.045],
      [0, 0.18 + i * 0.26, 0.578],
      material(i ? "#47748a" : "#243e56"),
      0.025,
    );
    box(
      forge,
      [0.48, 0.055, 0.08],
      [0, 0.18 + i * 0.26, 0.625],
      mats.metal,
      0.02,
    );
  }
  const modules = [-0.49, 0, 0.49];
  modules.forEach((x, i) => {
    box(
      forge,
      [0.37, 0.32 + (i % 2) * 0.11, 0.56],
      [x, 0.88 + (i % 2) * 0.055, -0.08],
      [mats.green, mats.orange, mats.navy][i],
      0.045,
    );
    box(
      forge,
      [0.22, 0.04, 0.28],
      [x, 1.055 + (i % 2) * 0.11, -0.08],
      mats.cream,
      0.012,
    );
  });
  label(
    forge,
    "01 / FORGEKIT",
    "TOOLS + MODULES",
    [1.22, 0.36],
    [0, 0.45, 0.608],
  );
  status(forge, 0.63, 0.53, 0.612, "forgekit");
  register(forge, "forgekit");

  // Central dispatch terminal: a real-looking workstation, rather than a floating UI card.
  const terminal = new THREE.Group();
  terminal.position.set(0, 2.65, -0.9);
  terminal.scale.setScalar(1.55);
  root.add(terminal);
  box(terminal, [1.23, 0.1, 0.68], [0, 0.055, 0.04], mats.navy, 0.05);
  box(terminal, [0.16, 0.5, 0.16], [0, 0.34, -0.12], mats.metal, 0.025);
  box(terminal, [2.16, 1.45, 0.18], [0, 1.08, -0.16], mats.navy, 0.09);
  const terminalTex = texture(896, 576, (c, w, h) => {
    c.fillStyle = "#0a1b31";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#5bcde8";
    c.font = "24px monospace";
    c.fillText("AI FACTORY  /  TASK DISPATCH", 38, 54);
    c.fillStyle = "#d2f1ff";
    c.font = "bold 49px monospace";
    c.fillText("Hello, I build.", 38, 135);
    const rows = [
      ["01", "PLAN", "#46dcff"],
      ["02", "TOOLS", "#ffad52"],
      ["03", "RESULT", "#55b7ec"],
    ];
    rows.forEach(([n, text, color], i) => {
      const y = 214 + i * 92;
      c.fillStyle = "#153a55";
      c.fillRect(34, y - 35, 827, 72);
      c.fillStyle = color;
      c.font = "bold 30px monospace";
      c.fillText(n, 57, y + 10);
      c.fillStyle = "#d2f1ff";
      c.fillText(text, 135, y + 10);
      c.fillStyle = color;
      c.fillRect(730, y - 8, 88 - i * 13, 12);
    });
    c.fillStyle = "#65d9f6";
    c.font = "23px monospace";
    c.fillText("LOCAL DEMO  /  READY", 38, 532);
  });
  plane(terminal, 1.96, 1.245, [0, 1.08, -0.06], screenMaterial(terminalTex));
  // Keyboard keycaps are one low-cost instanced mesh.
  box(terminal, [1.56, 0.075, 0.53], [0, 0.05, 0.68], mats.cream, 0.04);
  const keysGeometry = new THREE.BoxGeometry(0.095, 0.028, 0.075);
  resources.geometries.add(keysGeometry);
  const keys = new THREE.InstancedMesh(keysGeometry, mats.navy, 42);
  let ki = 0;
  const matrix = new THREE.Matrix4();
  for (let r = 0; r < 3; r++)
    for (let col = 0; col < 14; col++) {
      matrix.makeTranslation(-0.66 + col * 0.1, 0.102, 0.53 + r * 0.11);
      keys.setMatrixAt(ki++, matrix);
    }
  terminal.add(keys);

  // ANALYSIS: secondary browser and a compact report printer with chart paper.
  const analysis = station("analysis", [9, 2.65, -1.5], [9, 3.9, -1.3]);
  analysis.scale.setScalar(1.8);
  box(analysis, [1.46, 0.08, 0.76], [0, 0.04, -0.15], mats.cream, 0.04);
  box(analysis, [0.1, 0.4, 0.1], [0, 0.25, -0.33], mats.metal, 0.02);
  box(analysis, [1.53, 1.09, 0.15], [0, 0.84, -0.39], mats.cream, 0.065);
  const reportTex = texture(640, 450, (c, w, h) => {
    c.fillStyle = "#102a42";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#173c57";
    c.fillRect(0, 0, w, 45);
    ["#cc7753", "#d2ac6d", "#7a9b78"].forEach((v, i) => {
      c.fillStyle = v;
      c.beginPath();
      c.arc(25 + i * 24, 23, 6, 0, 7);
      c.fill();
    });
    c.fillStyle = "#a5eaff";
    c.font = "bold 34px monospace";
    c.fillText("ANALYSIS / 02", 31, 101);
    c.fillStyle = "#28617a";
    c.fillRect(32, 126, 575, 6);
    [102, 148, 195, 163, 241, 276].forEach((v, i) => {
      c.fillStyle = i === 5 ? "#ffad52" : "#45a9c8";
      c.fillRect(45 + i * 92, 385 - v * 0.7, 57, v * 0.7);
    });
    c.strokeStyle = "#316783";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(30, 387);
    c.lineTo(608, 387);
    c.stroke();
    c.fillStyle = "#75c2df";
    c.font = "20px monospace";
    c.fillText("Sources > Evidence > Report", 34, 429);
  });
  plane(analysis, 1.35, 0.9, [0, 0.84, -0.305], screenMaterial(reportTex));
  box(analysis, [1.45, 0.4, 0.83], [0.02, 0.22, 0.72], mats.navy, 0.08);
  box(analysis, [1.24, 0.07, 0.55], [0.02, 0.45, 0.63], mats.cream, 0.03);
  box(analysis, [0.98, 0.07, 0.035], [0.02, 0.24, 1.15], mats.rubber, 0.01);
  const printed = plane(
    analysis,
    0.86,
    0.74,
    [0.02, 0.49, 0.98],
    screenMaterial(reportTex),
    [-Math.PI / 2, 0, 0],
  );
  status(analysis, 0.57, 0.34, 1.15, "analysis");
  register(analysis, "analysis");
  box(root, [1.8, 1.25, 0.15], [11.35, 3.72, -2.3], mats.navy, 0.06);
  plane(root, 1.61, 1.06, [11.35, 3.72, -2.215], screenMaterial(reportTex));
  box(root, [0.12, 0.55, 0.12], [11.35, 2.99, -2.3], mats.metal, 0.02);
  box(root, [1.1, 0.06, 0.63], [11.35, 2.68, -2.25], mats.navy, 0.03);

  // FLAPPY: an identifiable pocket arcade with a bird and pipes inside its display case.
  const flappy = station("flappy", [10, 0.4, 3], [10, 2.9, 3]);
  flappy.scale.setScalar(2.65);
  box(flappy, [1.28, 0.2, 1.12], [0, 0.1, 0], mats.orange, 0.08);
  box(flappy, [1.22, 1.5, 0.15], [0, 0.95, -0.46], mats.navy, 0.06);
  box(flappy, [1.27, 0.19, 1.09], [0, 1.76, 0], mats.navy, 0.05);
  const gameBg = texture(512, 512, (c, w, h) => {
    c.fillStyle = "#133957";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#4086a0";
    [
      [75, 92, 120],
      [340, 155, 130],
      [260, 335, 95],
    ].forEach(([x, y, len]) => {
      c.beginPath();
      c.roundRect(x, y, len, 26, 14);
      c.fill();
    });
    c.fillStyle = "#1b667d";
    c.fillRect(0, 466, w, 46);
  });
  plane(flappy, 1.05, 1.32, [0, 0.96, -0.37], screenMaterial(gameBg));
  for (const x of [-0.5, 0.5])
    box(flappy, [0.08, 1.42, 0.09], [x, 0.95, 0.43], mats.navy, 0.02);
  box(flappy, [1.04, 1.32, 0.015], [0, 0.96, 0.473], mats.glass, 0.008);
  const bird = new THREE.Group();
  bird.position.set(-0.12, 1.04, 0.07);
  flappy.add(bird);
  sphere(bird, 0.16, [0, 0, 0], material("#e0b455"), [1.16, 1, 0.85]);
  sphere(bird, 0.09, [-0.06, -0.03, 0.115], mats.cream, [1.05, 0.56, 0.35]);
  sphere(bird, 0.044, [0.09, 0.06, 0.13], mats.paper);
  sphere(bird, 0.023, [0.105, 0.062, 0.165], mats.ink);
  box(bird, [0.12, 0.055, 0.12], [0.19, -0.015, 0.06], mats.orange, 0.02);
  for (const [x, y, height] of [
    [0.34, 0.55, 0.38],
    [0.34, 1.5, 0.33],
  ]) {
    cylinder(flappy, 0.105, 0.105, height, [x, y, -0.03], mats.green, 16);
    cylinder(
      flappy,
      0.14,
      0.14,
      0.08,
      [x, y + (y > 1 ? -height / 2 : height / 2), -0.03],
      mats.green,
      16,
    );
  }
  label(flappy, "FLAPPY", "PRESS PLAY", [0.95, 0.27], [0, 1.765, 0.557]);
  cylinder(flappy, 0.075, 0.075, 0.035, [0.34, 0.225, 0.29], mats.lamp, 16);
  status(flappy, -0.39, 0.145, 0.57, "flappy");
  register(flappy, "flappy");

  // POETRY: an open electronic book, with a moonlit landscape and a page of verse.
  const poetry = station("poetry", [-16, 2.15, 4], [-16, 2.5, 4]);
  poetry.rotation.y = -0.13;
  poetry.scale.setScalar(1.85);
  box(poetry, [1.78, 0.12, 0.9], [0, 0.065, 0], mats.green, 0.055);
  const poetryTex = texture(1024, 512, (c, w, h) => {
    c.fillStyle = "#142b43";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#294851";
    c.fillRect(22, 22, 467, h - 44);
    c.fillStyle = "#8de9ff";
    c.beginPath();
    c.arc(364, 128, 53, 0, 7);
    c.fill();
    c.fillStyle = "#2e81a0";
    c.beginPath();
    c.moveTo(22, 407);
    c.lineTo(144, 204);
    c.lineTo(267, 386);
    c.lineTo(385, 262);
    c.lineTo(489, 413);
    c.lineTo(489, 490);
    c.lineTo(22, 490);
    c.fill();
    c.fillStyle = "#225875";
    c.beginPath();
    c.moveTo(22, 443);
    c.lineTo(214, 322);
    c.lineTo(347, 451);
    c.lineTo(489, 375);
    c.lineTo(489, 490);
    c.lineTo(22, 490);
    c.fill();
    c.fillStyle = "#9fe7ff";
    c.font = "bold 35px serif";
    c.fillText("POETRY", 545, 99);
    c.font = "27px monospace";
    c.fillText("QWEN3", 545, 192);
    c.fillText("+ LoRA", 545, 242);
    c.font = "24px serif";
    c.fillText("A study in verse.", 545, 330);
    c.fillStyle = "#ffad52";
    c.fillRect(545, 423, 220, 4);
    c.fillStyle = "#48728b";
    c.fillRect(510, 29, 2, 450);
  });
  plane(poetry, 1.69, 0.82, [0, 0.137, 0], screenMaterial(poetryTex), [
    -Math.PI / 2,
    0,
    0,
  ]);
  box(poetry, [0.055, 0.02, 0.37], [0.65, 0.154, 0.37], mats.orange, 0.008);
  register(poetry, "poetry");

  // External equipment owns dense server arrays, workstations and production machinery.
  const factory = createFactoryEquipment();
  factory.root.userData.dynamic = true;
  root.add(factory.root);
  pickables.push(...factory.pickables);
  // A licensed, rigged robot adds a distinct welcoming presence in the production lab.
  const factoryRobot = createFactoryRobot();
  factoryRobot.root.position.set(6.4, 0.49, 12);
  factoryRobot.root.rotation.y = 0.3;
  root.add(factoryRobot.root);
  cylinder(root, 1.7, 1.8, 0.12, [6.4, 0.415, 12], mats.navy, 40);
  cylinder(root, 1.76, 1.76, 0.035, [6.4, 0.465, 12], mats.lamp, 40);
  let robotTime = 0;
  // Six original wheeled service units: four circulate and two stay in charging bays.
  const robots = [];
  const shadowTex = texture(128, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(27,44,47,.3)");
    g.addColorStop(1, "rgba(27,44,47,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  resources.materials.add(shadowMat);
  plane(root, 2.4, 1.9, [6.4, 0.49, 12], shadowMat, [-Math.PI / 2, 0, 0]);
  const makeRobot = (color, cleaner = false) => {
    const g = new THREE.Group();
    g.name = `service-robot-${robots.length + 1}`;
    g.userData.dynamic = true;
    g.userData.robot = true;
    root.add(g);
    const wheels = [];
    plane(g, 2.2, 1.8, [0, 0.385, 0], shadowMat, [-Math.PI / 2, 0, 0]);
    box(g, [1.15, 0.32, 1.4], [0, 0.7, 0], mats.navy, 0.15);
    box(g, [1, 0.85, 1.1], [0, 1.22, 0], color, 0.18);
    box(g, [0.76, 0.16, 0.035], [0, 1.47, 0.57], mats.ink, 0.04);
    box(g, [0.47, 0.055, 0.025], [0, 1.47, 0.594], mats.lamp, 0.02);
    for (const x of [-0.62, 0.62]) {
      const wheel = cylinder(
        g,
        0.26,
        0.26,
        0.14,
        [x, 0.66, 0],
        mats.rubber,
        16,
        [0, 0, Math.PI / 2],
      );
      wheels.push(wheel);
    }
    box(g, [1.3, 0.09, 1.25], [0, 1.71, 0], mats.navy, 0.08);
    if (cleaner) cylinder(g, 0.43, 0.43, 0.06, [0, 0.49, 0.82], mats.green, 16);
    else {
      box(g, [0.4, 0.33, 0.5], [-0.28, 1.91, 0], mats.orange, 0.05);
      box(g, [0.38, 0.26, 0.45], [0.22, 1.88, 0], mats.green, 0.05);
    }
    g.traverse((node) => {
      if (node.isMesh) node.castShadow = false;
    });
    robots.push({ group: g, wheels, cleaner });
    return g;
  };
  makeRobot(mats.cream);
  makeRobot(mats.green, true);
  makeRobot(mats.navy);
  makeRobot(mats.metal, true);
  makeRobot(mats.cream);
  makeRobot(mats.green, true);
  robots[4].parked = true;
  robots[4].group.position.set(-1.1, 0.16, -4.5);
  robots[4].group.userData.placed = true;
  robots[5].parked = true;
  robots[5].group.position.set(1.1, 0.16, -4.5);
  robots[5].group.userData.placed = true;

  const deliveryPoints = [
    [-3.1, 0, -12.6],
    [3.1, 0, -12.6],
    [3.1, 0, -5.8],
    [3.1, 0, 4.6],
    [3.1, 0, 14],
    [-3.1, 0, 14],
    [-3.1, 0, 4.6],
    [-3.1, 0, -5.8],
  ];
  const robotRoute = new THREE.CatmullRomCurve3(
    deliveryPoints.map((p) => new THREE.Vector3(...p)),
    true,
    "catmullrom",
    0.06,
  );
  const robotRoutes = [robotRoute, robotRoute];
  // Fixed floor channels are also the local-demo route, crossing the room between real work zones.
  const cablePaths = [
    [
      [-12, 0.4, -7.2],
      [-4.4, 0.4, -7.2],
      [-4.4, 0.4, -3.3],
      [0, 0.4, -3.3],
      [0, 2.75, -0.9],
    ],
    [
      [0, 2.75, -0.9],
      [4.2, 0.4, -3.3],
      [9, 0.4, -3.3],
      [9, 3.5, -1.5],
    ],
  ];
  const curves = cablePaths.map(
    (points) =>
      new THREE.CatmullRomCurve3(
        points.map((p) => new THREE.Vector3(...p)),
        false,
        "catmullrom",
        0.1,
      ),
  );
  curves.forEach((curve) =>
    add(root, new THREE.TubeGeometry(curve, 30, 0.035, 6, false), mats.orange),
  );
  const pulse = sphere(root, 0.15, [0, 0, 0], mats.lamp);
  pulse.visible = false;
  pulse.userData.dynamic = true;
  const toolPulse = box(root, [0.3, 0.2, 0.3], [-12, 4.7, -9], mats.lamp, 0.04);
  toolPulse.visible = false;
  toolPulse.userData.dynamic = true;
  const reportPulse = box(
    root,
    [1.5, 0.02, 0.7],
    [9, 3.55, -0.4],
    mats.paper,
    0.01,
  );
  reportPulse.visible = false;
  reportPulse.userData.dynamic = true;
  // Bake stationary furnishings by material. Hundreds of purposeful objects use a few draws.
  root.updateMatrixWorld(true);
  const batches = new Map();
  const toRemove = [];
  root.traverse((node) => {
    if (!node.isMesh || node.isInstancedMesh || node.userData.dynamic) return;
    let ancestor = node.parent;
    while (ancestor && ancestor !== root) {
      if (ancestor.userData.project || ancestor.userData.dynamic) return;
      ancestor = ancestor.parent;
    }
    if (node.userData.project || node.material.transparent) return;
    const key = node.material.uuid + "-" + node.castShadow;
    if (!batches.has(key))
      batches.set(key, {
        material: node.material,
        shadow: node.castShadow,
        geometries: [],
      });
    const geo = node.geometry.index
      ? node.geometry.toNonIndexed()
      : node.geometry.clone();
    geo.applyMatrix4(node.matrixWorld);
    batches.get(key).geometries.push(geo);
    toRemove.push(node);
  });
  for (const batch of batches.values()) {
    const positions = [],
      normals = [],
      uvs = [];
    for (const geo of batch.geometries) {
      positions.push(geo.attributes.position.array);
      normals.push(geo.attributes.normal.array);
      uvs.push(
        geo.attributes.uv?.array ||
          new Float32Array(geo.attributes.position.count * 2),
      );
    }
    const join = (arrays) => {
      const out = new Float32Array(arrays.reduce((n, a) => n + a.length, 0));
      let offset = 0;
      for (const a of arrays) {
        out.set(a, offset);
        offset += a.length;
      }
      return out;
    };
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(join(positions), 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(join(normals), 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(join(uvs), 2));
    const mesh = add(root, geo, batch.material);
    mesh.castShadow = batch.shadow;
    batch.geometries.forEach((g) => g.dispose());
  }
  toRemove.forEach((node) => node.removeFromParent());
  let active = null;
  let terminalPhase = -2;
  function setActive(id) {
    active = id;
    for (const [key, info] of stations)
      if (info.light) info.light.scale.setScalar(key === id ? 1.45 : 1);
  }
  function update(time, demo, motion) {
    factory.update(time, motion, demo);
    const robotDelta = Math.max(0, Math.min(0.1, time - robotTime));
    robotTime = time;
    factoryRobot.update(robotDelta, motion);
    const phase = demo === null ? -1 : Math.floor(demo * 20);
    if (phase !== terminalPhase) {
      terminalPhase = phase;
      const ctx = terminalTex.image.getContext("2d");
      ctx.fillStyle = "#0a1b31";
      ctx.fillRect(0, 486, 896, 90);
      ctx.fillStyle = "#65d9f6";
      ctx.font = "23px monospace";
      const message =
        demo === null
          ? "LOCAL DEMO  /  READY"
          : demo < 0.48
            ? "01  /  ROUTING TOOLS"
            : demo < 0.9
              ? "02  /  BUILDING REPORT"
              : "03  /  COMPLETE";
      ctx.fillText(message, 38, 532);
      if (demo !== null) {
        ctx.fillStyle = "#ffad52";
        ctx.fillRect(38, 550, 810 * demo, 5);
      }
      terminalTex.needsUpdate = true;
    }
    if (motion) {
      bird.position.y = 1.04 + Math.sin(time * 2) * 0.025;
      robots.forEach((robot, i) => {
        if (robot.parked) return;
        const route = robotRoute;
        const raw = (time / 55 + i * 0.25) % 1;
        // Smooth station pauses are embedded in route speed, with a short dwell each quarter.
        const leg = Math.floor(raw * 4);
        const local = raw * 4 - leg;
        const along = (leg + Math.min(1, local / 0.82)) / 4;
        const position = route.getPointAt(along % 1);
        const tangent = route.getTangentAt(along % 1);
        robot.group.position.copy(position);
        robot.group.rotation.y = Math.atan2(tangent.x, tangent.z);
        robot.group.userData.placed = true;
        robot.wheels.forEach(
          (wheel) => (wheel.rotation.x = (along * route.getLength()) / 0.26),
        );
      });
    } else if (!robots[0].group.userData.placed) {
      robots.forEach((robot, i) => {
        if (robot.parked) return;
        robot.group.position.copy(robotRoute.getPointAt(i * 0.25));
        robot.group.userData.placed = true;
      });
    }
    pulse.visible = demo !== null;
    toolPulse.visible = demo !== null && demo < 0.17;
    reportPulse.visible = demo !== null && demo > 0.74;
    if (demo !== null) {
      const phase = demo < 0.48 ? demo / 0.48 : (demo - 0.48) / 0.52;
      pulse.position.copy(
        curves[demo < 0.48 ? 0 : 1].getPoint(
          THREE.MathUtils.clamp(phase, 0, 1),
        ),
      );
      toolPulse.position.y = 4.7 + Math.sin(demo * Math.PI * 6) * 0.04;
      reportPulse.position.z = -0.4 + Math.max(0, (demo - 0.74) / 0.26) * 0.6;
    }
  }
  function dispose() {
    factoryRobot.dispose();
    factory.dispose();
    root.traverse((node) => {
      if (node.isInstancedMesh) node.dispose();
    });
    for (const geometry of resources.geometries) geometry.dispose();
    for (const mat of resources.materials) mat.dispose();
    for (const tex of resources.textures) tex.dispose();
  }
  return {
    ready: factoryRobot.ready,
    root,
    pickables,
    stations,
    update,
    setActive,
    dispose,
    get active() {
      return active;
    },
  };
}
