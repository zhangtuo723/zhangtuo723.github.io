import * as THREE from "./assets/vendor/three.module.min.js";

/** An original, entirely procedural clay portrait. No external model or texture. */
export function createAvatar() {
  const root = new THREE.Group();
  const head = new THREE.Group();
  root.add(head);
  const eyes = [];
  const materials = {
    skin: new THREE.MeshStandardMaterial({ color: "#e7ab88", roughness: 0.67 }),
    nose: new THREE.MeshStandardMaterial({ color: "#e4a07d", roughness: 0.66 }),
    innerEar: new THREE.MeshStandardMaterial({
      color: "#cd896d",
      roughness: 0.82,
    }),
    blush: new THREE.MeshStandardMaterial({
      color: "#dd9b7e",
      roughness: 0.85,
    }),
    hair: new THREE.MeshStandardMaterial({ color: "#202b31", roughness: 0.66 }),
    hairLight: new THREE.MeshStandardMaterial({
      color: "#29343b",
      roughness: 0.67,
    }),
    hairDark: new THREE.MeshStandardMaterial({
      color: "#18232a",
      roughness: 0.72,
    }),
    eye: new THREE.MeshStandardMaterial({ color: "#fff9eb", roughness: 0.27 }),
    iris: new THREE.MeshStandardMaterial({ color: "#69513b", roughness: 0.34 }),
    pupil: new THREE.MeshStandardMaterial({
      color: "#152025",
      roughness: 0.25,
    }),
    glint: new THREE.MeshBasicMaterial({ color: "#fffdf2" }),
    glasses: new THREE.MeshStandardMaterial({
      color: "#243037",
      roughness: 0.5,
      metalness: 0.12,
    }),
    lip: new THREE.MeshStandardMaterial({ color: "#975a4b", roughness: 0.83 }),
    lipLight: new THREE.MeshStandardMaterial({
      color: "#c17e64",
      roughness: 0.82,
    }),
    teeth: new THREE.MeshStandardMaterial({
      color: "#fff3dc",
      roughness: 0.68,
    }),
    shirt: new THREE.MeshStandardMaterial({
      color: "#2e393b",
      roughness: 0.91,
    }),
    collar: new THREE.MeshStandardMaterial({
      color: "#212d30",
      roughness: 0.96,
    }),
    stitch: new THREE.MeshStandardMaterial({
      color: "#3f4a49",
      roughness: 0.96,
    }),
    label: new THREE.MeshStandardMaterial({
      color: "#d3f675",
      roughness: 0.76,
    }),
  };
  const sphere = new THREE.SphereGeometry(1, 56, 40);
  const orb = (parent, material, position, scale, rotation) => {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    if (rotation) mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const tube = (parent, points, radius, material, smooth = true) => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const geometry = new THREE.TubeGeometry(
      curve,
      smooth ? 48 : 10,
      radius,
      10,
      false,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // A subtly squared cheek / tapered jaw gives the face a deliberate silhouette.
  const headGeometry = new THREE.SphereGeometry(1, 80, 64);
  const pos = headGeometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    const jaw = 1 - Math.max(0, -y) * 0.22;
    const cheek = 1 + Math.exp(-((y + 0.12) ** 2) / 0.13) * 0.035;
    pos.setXYZ(
      i,
      x * 0.91 * jaw * cheek,
      1.65 + y * 1.24,
      z * (z > 0 ? 0.76 : 0.79) + (z > 0 ? 0.035 * (1 - y * y) : 0),
    );
  }
  headGeometry.computeVertexNormals();
  const colors = [];
  const skinColor = new THREE.Color("#e7ab88"),
    cheekColor = new THREE.Color("#d58c79");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    const warmth =
      z > 0.45
        ? Math.exp(
            -(((Math.abs(x) - 0.55) / 0.2) ** 2 + ((y - 1.36) / 0.15) ** 2),
          ) * 0.3
        : 0;
    const color = skinColor.clone().lerp(cheekColor, warmth);
    colors.push(color.r, color.g, color.b);
  }
  headGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3),
  );
  materials.face = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    vertexColors: true,
    roughness: 0.72,
  });
  const face = new THREE.Mesh(headGeometry, materials.face);
  face.castShadow = true;
  face.receiveShadow = true;
  head.add(face);

  [-1, 1].forEach((side) => {
    orb(
      head,
      materials.skin,
      [side * 0.91, 1.57, 0.005],
      [0.215, 0.33, 0.17],
      [0, 0, side * -0.12],
    );
    orb(
      head,
      materials.innerEar,
      [side * 0.981, 1.59, 0.133],
      [0.1, 0.21, 0.055],
      [0, 0, side * -0.12],
    );
    orb(
      head,
      materials.skin,
      [side * 0.959, 1.48, 0.171],
      [0.09, 0.115, 0.055],
    );
  });

  // Sclera and irises are independent meshes, not a painted-on face.
  [-1, 1].forEach((side) => {
    const x = side * 0.365;
    orb(head, materials.innerEar, [x, 1.814, 0.711], [0.276, 0.299, 0.157]);
    orb(head, materials.eye, [x, 1.804, 0.75], [0.251, 0.274, 0.178]);
    const iris = new THREE.Group();
    iris.position.set(x, 1.804, 0.925);
    orb(iris, materials.iris, [0, 0, 0], [0.121, 0.139, 0.039]);
    orb(iris, materials.pupil, [0, 0, 0.032], [0.067, 0.082, 0.016]);
    orb(iris, materials.glint, [-0.037, 0.044, 0.046], [0.025, 0.028, 0.008]);
    orb(iris, materials.glint, [0.035, -0.031, 0.046], [0.009, 0.011, 0.006]);
    head.add(iris);
    eyes.push({ mesh: iris, x, y: 1.804 });
    tube(
      head,
      [
        [x - 0.241, 1.875, 0.798],
        [x - 0.15, 2.021, 0.805],
        [x + 0.04, 2.068, 0.79],
        [x + 0.222, 1.94, 0.785],
      ],
      0.027,
      materials.skin,
    );
    tube(
      head,
      [
        [x - 0.204, 1.641, 0.791],
        [x, 1.545, 0.81],
        [x + 0.198, 1.65, 0.793],
      ],
      0.018,
      materials.nose,
    );
    const brow = tube(
      head,
      [
        [x - 0.217, 2.166, 0.697],
        [x - 0.095, 2.222, 0.755],
        [x + 0.07, 2.22, 0.757],
        [x + 0.217, 2.155 + side * 0.025, 0.7],
      ],
      0.048,
      materials.hair,
    );
    brow.scale.y = 0.999;
  });

  // Soft bridge, round nose tip, and small nostril impressions.
  orb(head, materials.skin, [0, 1.623, 0.784], [0.13, 0.266, 0.146]);
  orb(head, materials.nose, [0, 1.456, 0.936], [0.192, 0.145, 0.175]);
  [-1, 1].forEach((side) => {
    orb(
      head,
      materials.skin,
      [side * 0.155, 1.412, 0.888],
      [0.087, 0.067, 0.08],
    );
    orb(
      head,
      materials.innerEar,
      [side * 0.103, 1.367, 0.978],
      [0.034, 0.018, 0.012],
    );
  });
  tube(
    head,
    [
      [-0.282, 1.157, 0.715],
      [-0.153, 1.097, 0.792],
      [0, 1.081, 0.821],
      [0.157, 1.117, 0.788],
      [0.277, 1.199, 0.711],
    ],
    0.018,
    materials.lip,
  );
  tube(
    head,
    [
      [-0.156, 1.067, 0.796],
      [0.005, 1.035, 0.807],
      [0.146, 1.087, 0.794],
    ],
    0.014,
    materials.lipLight,
  );
  [-1, 1].forEach((side) =>
    orb(
      head,
      materials.nose,
      [side * 0.295, 1.176 + side * 0.02, 0.714],
      [0.038, 0.039, 0.016],
    ),
  );

  // Continuous cap, then individually sculpted swept locks with tapered tips.
  const hairPositions = [],
    hairIndices = [];
  const rings = 30,
    slices = 80;
  for (let j = 0; j <= rings; j++) {
    for (let i = 0; i <= slices; i++) {
      const phi = (i / slices) * Math.PI * 2;
      const front = Math.sin(phi);
      const maxTheta =
        1.7 - Math.max(0, front) ** 0.45 * 0.98 + Math.max(0, -front) * 0.4;
      const theta = (j / rings) * maxTheta;
      hairPositions.push(
        Math.sin(theta) * Math.cos(phi) * 0.946,
        1.68 + Math.cos(theta) * 1.28,
        Math.sin(theta) * Math.sin(phi) * 0.81,
      );
      if (j < rings && i < slices) {
        const a = j * (slices + 1) + i,
          b = a + slices + 1;
        hairIndices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const capGeometry = new THREE.BufferGeometry();
  capGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(hairPositions, 3),
  );
  capGeometry.setIndex(hairIndices);
  capGeometry.computeVertexNormals();
  const cap = new THREE.Mesh(capGeometry, materials.hairDark);
  cap.castShadow = true;
  head.add(cap);
  function lock(points, radius, depth, material) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const vertices = [],
      indices = [];
    const longitudinal = 32,
      radial = 16;
    for (let j = 0; j <= longitudinal; j++) {
      const t = j / longitudinal;
      const c = curve.getPoint(t),
        tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
      const b = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      const taper = Math.max(0.002, Math.sin(Math.PI * t)) ** 0.64;
      for (let i = 0; i <= radial; i++) {
        const angle = (i / radial) * Math.PI * 2;
        const p = c
          .clone()
          .addScaledVector(normal, Math.cos(angle) * radius * taper)
          .addScaledVector(b, Math.sin(angle) * depth * taper);
        vertices.push(p.x, p.y, p.z);
        if (j < longitudinal && i < radial) {
          const a = j * (radial + 1) + i,
            k = a + radial + 1;
          indices.push(a, a + 1, k, k, a + 1, k + 1);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    head.add(mesh);
  }
  lock(
    [
      [0.71, 2.61, 0.16],
      [0.52, 2.98, 0.4],
      [0.03, 3.107, 0.53],
      [-0.57, 2.88, 0.63],
      [-0.77, 2.43, 0.57],
    ],
    0.218,
    0.23,
    materials.hair,
  );
  lock(
    [
      [0.65, 2.65, 0.37],
      [0.39, 2.96, 0.64],
      [-0.09, 2.96, 0.78],
      [-0.58, 2.67, 0.83],
      [-0.61, 2.276, 0.762],
    ],
    0.202,
    0.2,
    materials.hairLight,
  );
  lock(
    [
      [0.7, 2.58, 0.48],
      [0.46, 2.88, 0.77],
      [0.1, 2.82, 0.92],
      [-0.24, 2.53, 0.94],
      [-0.28, 2.291, 0.837],
    ],
    0.18,
    0.16,
    materials.hair,
  );
  lock(
    [
      [0.76, 2.44, 0.45],
      [0.65, 2.74, 0.76],
      [0.43, 2.73, 0.87],
      [0.21, 2.51, 0.922],
      [0.16, 2.355, 0.849],
    ],
    0.167,
    0.15,
    materials.hairLight,
  );
  lock(
    [
      [0.78, 2.3, 0.27],
      [0.84, 2.58, 0.56],
      [0.72, 2.65, 0.72],
      [0.58, 2.404, 0.839],
    ],
    0.146,
    0.16,
    materials.hair,
  );
  lock(
    [
      [-0.88, 1.75, 0.2],
      [-0.94, 2.03, 0.29],
      [-0.89, 2.43, 0.43],
      [-0.69, 2.7, 0.5],
    ],
    0.107,
    0.14,
    materials.hairDark,
  );
  lock(
    [
      [0.89, 1.77, 0.2],
      [0.94, 2.06, 0.26],
      [0.85, 2.4, 0.43],
    ],
    0.105,
    0.13,
    materials.hairDark,
  );
  lock(
    [
      [0.39, 2.91, -0.15],
      [0.06, 3.13, 0],
      [-0.4, 3.06, 0.15],
      [-0.64, 2.88, 0.23],
    ],
    0.2,
    0.2,
    materials.hair,
  );

  // Thin spectacles stay open so the eyes retain their expression.
  const glasses = new THREE.Group();
  head.add(glasses);
  [-1, 1].forEach((side) => {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.018, 10, 72),
      materials.glasses,
    );
    rim.position.set(side * 0.366, 1.802, 1.005);
    rim.scale.set(0.952, 1, 0.7);
    rim.rotation.y = side * -0.09;
    glasses.add(rim);
    tube(
      glasses,
      [
        [side * 0.649, 1.84, 0.99],
        [side * 0.812, 1.875, 0.725],
        [side * 0.983, 1.77, 0.2],
      ],
      0.018,
      materials.glasses,
    );
    orb(
      glasses,
      materials.glasses,
      [side * 0.653, 1.83, 0.994],
      [0.039, 0.027, 0.017],
    );
  });
  tube(
    glasses,
    [
      [-0.084, 1.84, 1.023],
      [0, 1.882, 1.052],
      [0.084, 1.84, 1.023],
    ],
    0.018,
    materials.glasses,
  );

  orb(root, materials.skin, [0, 0.35, -0.02], [0.34, 0.49, 0.32]);
  const profile = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.31, 0.37, 0.28),
    new THREE.Vector3(0.65, 0.25, 0.34),
    new THREE.Vector3(1.01, 0.06, 0.4),
    new THREE.Vector3(1.24, -0.27, 0.47),
    new THREE.Vector3(1.3, -0.85, 0.5),
    new THREE.Vector3(1.21, -1.7, 0.48),
    new THREE.Vector3(1.16, -2.05, 0.45),
  ]);
  const bodyVertices = [],
    bodyIndices = [];
  for (let j = 0; j <= 48; j++) {
    const p = profile.getPoint(j / 48);
    for (let i = 0; i <= 80; i++) {
      const angle = (i / 80) * Math.PI * 2;
      const seam = Math.sin(angle * 6 + j * 0.07) * 0.005;
      bodyVertices.push(
        Math.cos(angle) * p.x,
        p.y,
        Math.sin(angle) * (p.z + seam) - 0.085,
      );
      if (j < 48 && i < 80) {
        const a = j * 81 + i,
          b = a + 81;
        bodyIndices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const bodyGeometry = new THREE.BufferGeometry();
  bodyGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(bodyVertices, 3),
  );
  bodyGeometry.setIndex(bodyIndices);
  bodyGeometry.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeometry, materials.shirt);
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.315, 0.049, 12, 80),
    materials.collar,
  );
  collar.position.set(0, 0.355, -0.075);
  collar.rotation.x = Math.PI / 2;
  collar.scale.y = 0.9;
  root.add(collar);
  [-1, 1].forEach((side) => {
    tube(
      root,
      [
        [side * 0.65, 0.225, 0.03],
        [side * 0.92, 0.04, 0.19],
        [side * 1.107, -0.25, 0.231],
        [side * 1.15, -0.58, 0.24],
      ],
      0.009,
      materials.stitch,
    );
    tube(
      root,
      [
        [side * 1.1, -0.68, 0.19],
        [side * 0.985, -0.9, 0.27],
        [side * 1.0, -1.15, 0.26],
      ],
      0.013,
      materials.collar,
    );
  });
  const labelShape = new THREE.Shape();
  labelShape.moveTo(-0.095, -0.075);
  labelShape.lineTo(0.095, -0.075);
  labelShape.quadraticCurveTo(0.112, -0.075, 0.112, -0.058);
  labelShape.lineTo(0.112, 0.058);
  labelShape.quadraticCurveTo(0.112, 0.075, 0.095, 0.075);
  labelShape.lineTo(-0.095, 0.075);
  labelShape.quadraticCurveTo(-0.112, 0.075, -0.112, 0.058);
  labelShape.lineTo(-0.112, -0.058);
  labelShape.quadraticCurveTo(-0.112, -0.075, -0.095, -0.075);
  const label = new THREE.Mesh(
    new THREE.ExtrudeGeometry(labelShape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.003,
      bevelSegments: 2,
      steps: 1,
    }),
    materials.label,
  );
  label.position.set(0.61, -0.62, 0.367);
  label.rotation.y = 0.12;
  label.rotation.z = -0.035;
  root.add(label);
  tube(
    root,
    [
      [0.569, -0.584, 0.395],
      [0.652, -0.584, 0.395],
      [0.57, -0.651, 0.395],
      [0.652, -0.651, 0.395],
    ],
    0.009,
    materials.collar,
    false,
  );

  return {
    root,
    update({ x = 0, y = 0, time = 0, follow = true }) {
      const px = follow ? x : 0,
        py = follow ? y : 0;
      head.rotation.y = THREE.MathUtils.lerp(
        head.rotation.y,
        px * 0.085,
        0.065,
      );
      head.rotation.x = THREE.MathUtils.lerp(
        head.rotation.x,
        py * 0.035,
        0.065,
      );
      head.rotation.z = Math.sin(time * 0.43) * 0.009;
      root.position.y = Math.sin(time * 0.8) * 0.012;
      eyes.forEach((eye) => {
        eye.mesh.position.x = THREE.MathUtils.lerp(
          eye.mesh.position.x,
          eye.x + px * 0.059,
          0.12,
        );
        eye.mesh.position.y = THREE.MathUtils.lerp(
          eye.mesh.position.y,
          eye.y - py * 0.045,
          0.12,
        );
      });
    },
    dispose() {
      const geometries = new Set();
      root.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
      });
      geometries.forEach((geometry) => geometry.dispose());
      Object.values(materials).forEach((material) => material.dispose());
    },
  };
}
