import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BuildingItemId } from '../types/game';

const MAT = {
  sandstoneDark: new THREE.MeshStandardMaterial({ color: 0x9a4a22, roughness: 0.88 }),
  sandstoneMid: new THREE.MeshStandardMaterial({ color: 0xc56b32, roughness: 0.78 }),
  sandstoneLight: new THREE.MeshStandardMaterial({ color: 0xe08a48, roughness: 0.7 }),
  sandstonePale: new THREE.MeshStandardMaterial({ color: 0xedb07a, roughness: 0.66 }),
  teakWood: new THREE.MeshStandardMaterial({ color: 0x6b3e26, roughness: 0.82 }),
  teakDark: new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.86 }),
  teakLight: new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 0.74 }),
  bambooGold: new THREE.MeshStandardMaterial({ color: 0xd4a359, roughness: 0.62 }),
  bambooGreen: new THREE.MeshStandardMaterial({ color: 0x6aa31a, roughness: 0.52 }),
  caneStripe: new THREE.MeshStandardMaterial({ color: 0x8fbf3a, roughness: 0.48 }),
  leafEmerald: new THREE.MeshStandardMaterial({ color: 0x1a9a45, roughness: 0.58, side: THREE.DoubleSide }),
  leafLush: new THREE.MeshStandardMaterial({ color: 0x2bbf5a, roughness: 0.52, side: THREE.DoubleSide }),
  leafDark: new THREE.MeshStandardMaterial({ color: 0x147a38, roughness: 0.64, side: THREE.DoubleSide }),
  marigoldOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.48 }),
  marigoldYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.44 }),
  roseMagenta: new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 }),
  lotusPink: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.42 }),
  lotusDeep: new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.46 }),
  whitePaste: new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.58 }),
  crimsonCloth: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.52 }),
  saffronCloth: new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 }),
  goldBrass: new THREE.MeshStandardMaterial({
    color: 0xe8b84a,
    metalness: 0.72,
    roughness: 0.26,
  }),
  goldBright: new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    metalness: 0.78,
    roughness: 0.2,
  }),
  terracotta: new THREE.MeshStandardMaterial({ color: 0xb4532a, roughness: 0.8 }),
  terracottaDark: new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.84 }),
  terracottaLight: new THREE.MeshStandardMaterial({ color: 0xcd6a3a, roughness: 0.74 }),
  clayVedi: new THREE.MeshStandardMaterial({ color: 0xc26d3d, roughness: 0.86 }),
  caneGreen: new THREE.MeshStandardMaterial({ color: 0x7cb02c, roughness: 0.46 }),
  caneGreenDeep: new THREE.MeshStandardMaterial({ color: 0x5f9120, roughness: 0.5 }),
  canePale: new THREE.MeshStandardMaterial({ color: 0xbcd97a, roughness: 0.42 }),
  caneNode: new THREE.MeshStandardMaterial({ color: 0xdbeaa4, roughness: 0.38 }),
  paintCream: new THREE.MeshStandardMaterial({ color: 0xf5e6c8, roughness: 0.5 }),
  paintRed: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.52 }),
  eyeDark: new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4 }),
  coconutBrown: new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.86 }),
  thekuaBrown: new THREE.MeshStandardMaterial({ color: 0x8c4a27, roughness: 0.7 }),
  waterFill: new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.12,
    metalness: 0.28,
    transparent: true,
    opacity: 0.72,
  }),
  vermilion: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55 }),
  flame: new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    emissive: new THREE.Color(0xff9e00),
    emissiveIntensity: 2.4,
    roughness: 0.18,
  }),
  fairyBulb: new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: new THREE.Color(0xfbbf24),
    emissiveIntensity: 2.0,
    roughness: 0.18,
  }),
};

const GEO = {
  sphereMed: new THREE.SphereGeometry(1, 12, 10),
  sphereLow: new THREE.SphereGeometry(1, 10, 8),
  coneFlame: new THREE.ConeGeometry(0.034, 0.1, 8),
  diyaBowl: new THREE.CylinderGeometry(0.072, 0.04, 0.042, 12),
  box: new THREE.BoxGeometry(1, 1, 1),
};

function addShadow(mesh: THREE.Mesh, receive = true): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = receive;
  return mesh;
}

/**
 * Bakes every static mesh of an item into one mesh per material. Animated
 * pieces (diya flames & fairy bulbs) are intentionally left untouched.
 * This keeps a fully decorated 12x12 ghat at a friendly draw-call budget.
 */
function mergeStaticMeshes(root: THREE.Group): void {
  root.updateMatrixWorld(true);
  const inverseRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();

  interface Bucket {
    material: THREE.Material;
    geometries: THREE.BufferGeometry[];
    meshes: THREE.Mesh[];
  }
  const buckets = new Map<THREE.Material, Bucket>();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.userData.isFlame || mesh.userData.isFairyLight) return;
    if (Array.isArray(mesh.material)) return;

    const material = mesh.material as THREE.Material;
    const geometry = mesh.geometry.clone();
    const localMatrix = new THREE.Matrix4().multiplyMatrices(inverseRoot, mesh.matrixWorld);
    geometry.applyMatrix4(localMatrix);

    const bucket = buckets.get(material);
    if (bucket) {
      bucket.geometries.push(geometry);
      bucket.meshes.push(mesh);
    } else {
      buckets.set(material, { material, geometries: [geometry], meshes: [mesh] });
    }
  });

  let totalMeshes = 0;
  for (const bucket of buckets.values()) totalMeshes += bucket.meshes.length;
  if (totalMeshes < 3) return;

  // Bail out if any material group cannot be merged so items never disappear
  const mergedResults: Array<{ bucket: Bucket; geometry: THREE.BufferGeometry }> = [];
  for (const bucket of buckets.values()) {
    if (bucket.geometries.length === 0) continue;
    const first = bucket.geometries[0].attributes;
    const compatible = bucket.geometries.every(
      (g) =>
        g.attributes.position !== undefined &&
        g.attributes.normal !== undefined &&
        Boolean(g.attributes.uv) === Boolean(first.uv) &&
        Boolean(g.index) === Boolean(bucket.geometries[0].index)
    );
    let merged: THREE.BufferGeometry | null = null;
    if (compatible) {
      try {
        merged = mergeGeometries(bucket.geometries, false);
      } catch {
        merged = null;
      }
    }
    if (!merged) {
      for (const bucketToDispose of buckets.values()) {
        for (const geo of bucketToDispose.geometries) geo.dispose();
      }
      return;
    }
    mergedResults.push({ bucket, geometry: merged });
  }

  for (const bucket of buckets.values()) {
    for (const mesh of bucket.meshes) mesh.removeFromParent();
    for (const geometry of bucket.geometries) geometry.dispose();
  }

  for (const { bucket, geometry } of mergedResults) {
    const mesh = new THREE.Mesh(geometry, bucket.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
}

export function createDiyaSubMesh(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const bowl = addShadow(new THREE.Mesh(GEO.diyaBowl, MAT.terracotta), false);
  bowl.position.y = 0.022;
  g.add(bowl);

  const oil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.01, 10),
    MAT.goldBrass
  );
  oil.position.y = 0.042;
  g.add(oil);

  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.028, 6),
    MAT.coconutBrown
  );
  wick.position.y = 0.055;
  g.add(wick);

  const flame = new THREE.Mesh(GEO.coneFlame, MAT.flame);
  flame.position.y = 0.09;
  flame.userData.isFlame = true;
  flame.userData.phase = Math.random() * Math.PI * 2;
  g.add(flame);

  g.scale.setScalar(scale);
  return g;
}

function createLotusBloom(scale = 1, y = 0): THREE.Group {
  const g = new THREE.Group();
  g.position.y = y;
  for (let ring = 0; ring < 2; ring++) {
    const count = ring === 0 ? 8 : 6;
    const rad = ring === 0 ? 0.07 : 0.045;
    for (let p = 0; p < count; p++) {
      const ang = (p / count) * Math.PI * 2 + ring * 0.2;
      const petal = new THREE.Mesh(
        GEO.sphereMed,
        ring === 0 ? MAT.lotusPink : MAT.lotusDeep
      );
      petal.scale.set(0.032 * scale, 0.055 * scale, 0.078 * scale);
      petal.position.set(Math.cos(ang) * rad * scale, 0.03 * scale, Math.sin(ang) * rad * scale);
      petal.rotation.y = -ang;
      petal.rotation.x = 0.42 - ring * 0.18;
      g.add(petal);
    }
  }
  const core = new THREE.Mesh(GEO.sphereLow, MAT.marigoldYellow);
  core.scale.setScalar(0.032 * scale);
  core.position.y = 0.04 * scale;
  g.add(core);
  return g;
}

/**
 * Tapered, slightly flattened leaf blade. Built with its base at the origin
 * and its tip pointing along +Y so it can be angled with a single rotation.
 */
function createLeafBlade(
  length: number,
  width: number,
  material: THREE.Material,
  segments = 4
): THREE.Mesh {
  const geo = new THREE.ConeGeometry(width, length, segments, 1, false);
  geo.scale(1, 1, 0.16);
  geo.translate(0, length / 2, 0);
  const blade = addShadow(new THREE.Mesh(geo, material), false);
  return blade;
}

/**
 * A single green sugarcane stalk: tapered cane, pale growth nodes and a
 * crown of arching leaf blades. Built in local space with its base at y = 0.
 */
function createCaneStalk(height = 1.12, seed = 0): THREE.Group {
  const g = new THREE.Group();
  const baseRad = 0.027;
  const tipRad = 0.0155;

  const stalk = addShadow(
    new THREE.Mesh(
      new THREE.CylinderGeometry(tipRad, baseRad, height, 9),
      seed % 2 === 0 ? MAT.caneGreen : MAT.caneGreenDeep
    )
  );
  stalk.position.y = height / 2;
  g.add(stalk);

  // Pale, slightly swollen nodes climbing the cane
  const nodeCount = 5;
  for (let n = 0; n < nodeCount; n++) {
    const t = 0.18 + (n / (nodeCount - 1)) * 0.68;
    const y = height * t;
    const rad = THREE.MathUtils.lerp(baseRad, tipRad, t) + 0.004;
    const node = new THREE.Mesh(
      new THREE.CylinderGeometry(rad, rad, 0.022, 9),
      MAT.caneNode
    );
    node.position.y = y;
    g.add(node);

    // Tiny leaf scar just above each node
    if (n % 2 === 0) {
      const scar = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 1.5, 0.012, 0.026),
        MAT.canePale
      );
      scar.position.set(rad * 0.85, y + 0.03, 0);
      scar.rotation.z = -0.3;
      g.add(scar);
    }
  }

  // Long, tapered leaf blades that arch out then droop back down
  const bladeCount = 5;
  for (let b = 0; b < bladeCount; b++) {
    const ang = (b / bladeCount) * Math.PI * 2 + seed * 0.7;
    const arm = new THREE.Group();
    arm.position.y = height - 0.02;
    arm.rotation.y = ang;

    const blade = createLeafBlade(
      0.25 + (b % 3) * 0.06,
      0.04,
      b % 3 === 0 ? MAT.leafDark : b % 2 === 0 ? MAT.leafLush : MAT.leafEmerald
    );
    blade.rotation.x = Math.PI / 2 + 0.62 + (b % 3) * 0.16;
    arm.add(blade);

    g.add(arm);
  }

  // Pale cut tip where the cane was harvested
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(tipRad * 0.9, tipRad, 0.022, 9), MAT.canePale);
  tip.position.y = height + 0.004;
  g.add(tip);

  return g;
}

export function buildItemMesh(itemId: BuildingItemId): THREE.Group {
  const root = new THREE.Group();

  switch (itemId) {
    case 'ghat_steps': {
      const baseSlab = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.11, 0.98), MAT.sandstoneDark));
      baseSlab.position.set(0, 0.055, 0);
      root.add(baseSlab);

      const midStep = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.09, 0.66), MAT.sandstoneMid));
      midStep.position.set(0, 0.155, -0.16);
      root.add(midStep);

      const topStep = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.07, 0.38), MAT.sandstoneLight));
      topStep.position.set(0, 0.235, -0.3);
      root.add(topStep);

      const nosing = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.02, 0.04), MAT.sandstonePale), false);
      nosing.position.set(0, 0.21, 0.16);
      root.add(nosing);

      for (const side of [-0.445, 0.445]) {
        const trim = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.96), MAT.sandstoneMid));
        trim.position.set(side, 0.15, 0);
        root.add(trim);

        const cap = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.98), MAT.sandstonePale), false);
        cap.position.set(side, 0.31, 0);
        root.add(cap);
      }

      for (const [dx, dz] of [
        [-0.32, 0.28],
        [0.32, 0.28],
      ]) {
        const groove = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 0.04), MAT.sandstoneDark);
        groove.position.set(dx, 0.115, dz);
        root.add(groove);
      }

      const cornerDiya = createDiyaSubMesh(0.72);
      cornerDiya.position.set(0.4, 0.28, 0.34);
      root.add(cornerDiya);
      break;
    }

    case 'pond_platform': {
      const corners = [
        [-0.4, -0.4],
        [0.4, -0.4],
        [-0.4, 0.4],
        [0.4, 0.4],
      ];
      for (const [cx, cz] of corners) {
        const post = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.58, 10), MAT.teakDark));
        post.position.set(cx, 0.02, cz);
        root.add(post);

        const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.04, 10), MAT.goldBrass);
        wrap.position.set(cx, 0.22, cz);
        root.add(wrap);

        const cap = new THREE.Mesh(GEO.sphereLow, MAT.goldBright);
        cap.scale.setScalar(0.05);
        cap.position.set(cx, 0.33, cz);
        root.add(cap);
      }

      const underframe = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.055, 0.94), MAT.teakDark));
      underframe.position.y = 0.185;
      root.add(underframe);

      for (let i = -2; i <= 2; i++) {
        const plank = addShadow(
          new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.028, 0.15), i % 2 === 0 ? MAT.teakWood : MAT.teakLight)
        );
        plank.position.set(0, 0.228, i * 0.175);
        root.add(plank);
      }

      const valance = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.04, 0.98), MAT.saffronCloth);
      valance.position.y = 0.155;
      root.add(valance);

      for (const side of [-1, 1]) {
        const rail = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.018, 0.03), MAT.goldBrass), false);
        rail.position.set(0, 0.34, side * 0.44);
        root.add(rail);
      }
      break;
    }

    case 'banana_tree': {
      const pot = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.12, 10), MAT.terracotta));
      pot.position.y = 0.06;
      root.add(pot);

      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 10), MAT.teakDark);
      soil.position.y = 0.12;
      root.add(soil);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.032, 8, 16), MAT.marigoldOrange);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.05;
      root.add(ring);

      const trunk = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.1, 0.82, 10), MAT.bambooGreen));
      trunk.position.y = 0.5;
      root.add(trunk);

      for (let b = 0; b < 4; b++) {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.072 - b * 0.006, 0.078 - b * 0.006, 0.03, 10), MAT.caneStripe);
        band.position.y = 0.28 + b * 0.16;
        root.add(band);
      }

      const frondCount = 8;
      for (let i = 0; i < frondCount; i++) {
        const angle = (i / frondCount) * Math.PI * 2;
        const frondGroup = new THREE.Group();
        frondGroup.position.set(0, 0.88, 0);
        frondGroup.rotation.y = angle;

        const leaf = addShadow(
          new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.018, 0.62),
            i % 2 === 0 ? MAT.leafLush : MAT.leafEmerald
          ),
          false
        );
        leaf.position.set(0, 0.02, 0.28);
        leaf.rotation.x = -0.42;
        frondGroup.add(leaf);

        const tip = addShadow(
          new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.014, 0.28), MAT.leafDark),
          false
        );
        tip.position.set(0, -0.04, 0.62);
        tip.rotation.x = 0.35;
        frondGroup.add(tip);

        root.add(frondGroup);
      }

      const bunch = new THREE.Group();
      bunch.position.set(0.1, 0.62, 0.1);
      for (let b = 0; b < 4; b++) {
        const cluster = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.042, 0.06, 8), MAT.marigoldYellow);
        cluster.position.y = -b * 0.055;
        bunch.add(cluster);
      }
      const heart = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), MAT.crimsonCloth);
      heart.rotation.x = Math.PI;
      heart.position.y = -0.26;
      bunch.add(heart);
      root.add(bunch);
      break;
    }

    case 'sugarcane': {
      // --- Festive cloth mat that anchors the mandap ---
      const cloth = new THREE.Mesh(new THREE.CircleGeometry(0.45, 26), MAT.saffronCloth);
      cloth.rotation.x = -Math.PI / 2;
      cloth.position.y = 0.006;
      cloth.receiveShadow = true;
      root.add(cloth);

      const clothRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.43, 0.014, 8, 30),
        MAT.goldBrass
      );
      clothRim.rotation.x = Math.PI / 2;
      clothRim.position.y = 0.014;
      root.add(clothRim);

      // --- Five sugarcane stalks leaning inward into a leafy canopy ---
      const caneCount = 5;
      const baseRadius = 0.33;
      const topRadius = 0.16;
      const caneHeight = 1.12;
      const lean = Math.atan2(baseRadius - topRadius, caneHeight);
      const stalkLength = caneHeight / Math.cos(lean);

      for (let i = 0; i < caneCount; i++) {
        const ang = (i / caneCount) * Math.PI * 2 + Math.PI / 2;
        const holder = new THREE.Group();
        holder.position.set(Math.cos(ang) * baseRadius, 0.012, Math.sin(ang) * baseRadius);
        const tiltAxis = new THREE.Vector3(Math.sin(ang), 0, -Math.cos(ang));
        holder.quaternion.setFromAxisAngle(tiltAxis, -lean);
        holder.add(createCaneStalk(stalkLength, i));
        root.add(holder);

        // A marigold bulb blinking at each cane tip
        const bulb = new THREE.Mesh(GEO.sphereLow, MAT.fairyBulb);
        bulb.scale.setScalar(0.016);
        const tipR = topRadius + 0.01;
        bulb.position.set(Math.cos(ang) * tipR, caneHeight + 0.02, Math.sin(ang) * tipR);
        bulb.userData.isFairyLight = true;
        root.add(bulb);
      }

      // --- Crimson cloth tie binding the bundle together ---
      const tie = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.055, 26, 1, true),
        MAT.crimsonCloth
      );
      tie.position.y = 0.62;
      root.add(tie);

      for (const trimY of [0.595, 0.646]) {
        const trim = new THREE.Mesh(
          new THREE.TorusGeometry(0.2515, 0.0055, 7, 30),
          MAT.goldBrass
        );
        trim.rotation.x = Math.PI / 2;
        trim.position.y = trimY;
        root.add(trim);
      }

      // Two little marigold tassels dangling off the knot
      for (const dir of [-1, 1]) {
        const tx = dir * 0.255;
        const tasselGroup = new THREE.Group();
        tasselGroup.position.set(tx, 0.61, 0.08 * dir);
        for (let b = 0; b < 3; b++) {
          const bead = new THREE.Mesh(
            GEO.sphereLow,
            b % 2 === 0 ? MAT.marigoldOrange : MAT.marigoldYellow
          );
          bead.scale.setScalar(0.026 - b * 0.004);
          bead.position.y = -b * 0.048;
          tasselGroup.add(bead);
        }
        const tasselCone = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.085, 6), MAT.crimsonCloth);
        tasselCone.rotation.x = Math.PI;
        tasselCone.position.y = -0.17;
        tasselGroup.add(tasselCone);
        root.add(tasselGroup);
      }

      // --- Canopy ring: gold hoop, marigold blooms and hanging mango leaves ---
      const canopy = new THREE.Mesh(new THREE.TorusGeometry(0.183, 0.011, 8, 26), MAT.goldBrass);
      canopy.rotation.x = Math.PI / 2;
      canopy.position.y = 1.07;
      root.add(canopy);

      const bloomCount = 12;
      for (let b = 0; b < bloomCount; b++) {
        const a = (b / bloomCount) * Math.PI * 2;
        const puff = new THREE.Mesh(
          GEO.sphereLow,
          b % 2 === 0 ? MAT.marigoldOrange : MAT.marigoldYellow
        );
        puff.scale.setScalar(0.027 + (b % 3) * 0.005);
        puff.position.set(Math.cos(a) * 0.188, 1.07 + (b % 2) * 0.022, Math.sin(a) * 0.188);
        root.add(puff);
      }

      for (let l = 0; l < 9; l++) {
        const a = (l / 9) * Math.PI * 2 + 0.25;
        const hanger = new THREE.Group();
        hanger.position.set(Math.cos(a) * 0.181, 1.055, Math.sin(a) * 0.181);
        hanger.rotation.y = -a + Math.PI / 2;

        const leaf = createLeafBlade(
          0.19 + (l % 3) * 0.05,
          0.042,
          l % 2 === 0 ? MAT.leafEmerald : MAT.leafLush
        );
        // Tip points down and slightly outwards
        leaf.rotation.x = Math.PI * 0.92;
        leaf.rotation.z = (l % 3 === 0 ? 1 : -1) * 0.16;
        hanger.add(leaf);
        root.add(hanger);
      }

      // --- Brass kalash, coconut and a lit diya at the heart of the mandap ---
      const kalashBody = addShadow(new THREE.Mesh(GEO.sphereMed, MAT.goldBrass));
      kalashBody.scale.set(0.085, 0.1, 0.085);
      kalashBody.position.y = 0.2;
      root.add(kalashBody);

      const kalashNeck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.056, 0.06, 10),
        MAT.goldBright
      );
      kalashNeck.position.y = 0.29;
      root.add(kalashNeck);

      const kalashRim = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.011, 7, 14), MAT.goldBrass);
      kalashRim.rotation.x = Math.PI / 2;
      kalashRim.position.y = 0.318;
      root.add(kalashRim);

      const coconut = new THREE.Mesh(GEO.sphereMed, MAT.coconutBrown);
      coconut.scale.set(0.055, 0.062, 0.055);
      coconut.position.y = 0.37;
      root.add(coconut);

      for (const dir of [-1, 1]) {
        const kalashLeaf = addShadow(
          new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.12), MAT.leafEmerald),
          false
        );
        kalashLeaf.position.set(dir * 0.075, 0.34, 0.01);
        kalashLeaf.rotation.z = dir * 0.75;
        root.add(kalashLeaf);
      }

      const centerDiya = createDiyaSubMesh(0.95);
      centerDiya.position.set(0, 0.012, 0.245);
      root.add(centerDiya);
      break;
    }

    case 'mango_tree': {
      const trunk = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 0.68, 9), MAT.teakWood));
      trunk.position.y = 0.34;
      root.add(trunk);

      const rootFlare = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.08, 9), MAT.teakDark));
      rootFlare.position.y = 0.04;
      root.add(rootFlare);

      const garland = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.024, 8, 14), MAT.marigoldOrange);
      garland.rotation.x = Math.PI / 2;
      garland.position.y = 0.4;
      root.add(garland);

      const puffs: Array<[number, number, number, number, THREE.Material]> = [
        [0, 0.88, 0, 0.36, MAT.leafDark],
        [-0.22, 0.78, 0.16, 0.26, MAT.leafEmerald],
        [0.24, 0.8, -0.14, 0.27, MAT.leafLush],
        [0.14, 0.74, 0.24, 0.23, MAT.leafEmerald],
        [-0.18, 0.76, -0.2, 0.25, MAT.leafLush],
        [0, 1.1, 0, 0.26, MAT.leafLush],
        [0.18, 0.96, 0.12, 0.2, MAT.leafEmerald],
      ];
      for (const [px, py, pz, rad, mat] of puffs) {
        const s = addShadow(new THREE.Mesh(GEO.sphereMed, mat), false);
        s.scale.setScalar(rad);
        s.position.set(px, py, pz);
        root.add(s);
      }

      for (const [mx, my, mz] of [
        [0.26, 0.62, 0.14],
        [-0.24, 0.6, 0.12],
        [0.06, 0.61, -0.26],
        [0.16, 0.72, 0.2],
      ]) {
        const mango = new THREE.Mesh(GEO.sphereLow, MAT.marigoldYellow);
        mango.scale.set(0.038, 0.052, 0.038);
        mango.position.set(mx, my, mz);
        root.add(mango);
      }
      break;
    }

    case 'marigold_arch': {
      for (const sx of [-0.4, 0.4]) {
        const pole = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.92, 8), MAT.bambooGold));
        pole.position.set(sx, 0.46, 0);
        root.add(pole);

        const basePot = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.11, 10), MAT.terracotta));
        basePot.position.set(sx, 0.055, 0);
        root.add(basePot);
      }

      const bar = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.88, 8), MAT.bambooGold), false);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 0.88;
      root.add(bar);

      const count = 11;
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const x = -0.38 + t * 0.76;
        const sag = Math.sin(t * Math.PI) * 0.18;

        const puff1 = new THREE.Mesh(GEO.sphereLow, i % 2 === 0 ? MAT.marigoldOrange : MAT.marigoldYellow);
        puff1.scale.setScalar(0.05);
        puff1.position.set(x, 0.86 - sag, 0);
        root.add(puff1);

        const puff2 = new THREE.Mesh(GEO.sphereLow, i % 2 === 0 ? MAT.marigoldYellow : MAT.crimsonCloth);
        puff2.scale.setScalar(0.038);
        puff2.position.set(x, 0.72 - sag * 1.18, 0.02);
        root.add(puff2);
      }

      const centerBulb = new THREE.Mesh(GEO.sphereLow, MAT.fairyBulb);
      centerBulb.scale.setScalar(0.046);
      centerBulb.position.set(0, 0.54, 0);
      centerBulb.userData.isFairyLight = true;
      root.add(centerBulb);
      break;
    }

    case 'flower_rangoli': {
      const outerRing = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.43, 0.018, 20), MAT.marigoldOrange));
      outerRing.position.y = 0.01;
      root.add(outerRing);

      const midRing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.024, 16), MAT.marigoldYellow);
      midRing.position.y = 0.016;
      root.add(midRing);

      const innerRing = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 14), MAT.roseMagenta);
      innerRing.position.y = 0.02;
      root.add(innerRing);

      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const petal = new THREE.Mesh(GEO.sphereMed, i % 2 === 0 ? MAT.whitePaste : MAT.lotusPink);
        petal.scale.set(0.06, 0.022, 0.11);
        petal.position.set(Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3);
        petal.rotation.y = -a;
        root.add(petal);
      }

      const centerDiya = createDiyaSubMesh(1.05);
      centerDiya.position.y = 0.03;
      root.add(centerDiya);
      break;
    }

    case 'floating_lotus_diya': {
      root.userData.floatBob = true;
      root.userData.phase = Math.random() * Math.PI * 2;

      const padPositions: Array<[number, number, number]> = [
        [-0.16, 0.012, -0.12],
        [0.18, 0.012, 0.14],
      ];
      for (const [lx, ly, lz] of padPositions) {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.014, 14), MAT.leafEmerald);
        pad.position.set(lx, ly, lz);
        root.add(pad);
        const bloom = createLotusBloom(1, ly);
        bloom.position.x = lx;
        bloom.position.z = lz;
        root.add(bloom);
      }

      const diyaCoords: Array<[number, number]> = [
        [0.2, -0.18],
        [-0.22, 0.2],
        [0.0, 0.02],
      ];
      for (const [dx, dz] of diyaCoords) {
        const d = createDiyaSubMesh(0.92);
        d.position.set(dx, 0.01, dz);
        root.add(d);
      }
      break;
    }

    case 'grand_pandal': {
      const pCoords = [
        [-0.43, -0.43],
        [0.43, -0.43],
        [-0.43, 0.43],
        [0.43, 0.43],
      ];

      for (const [px, pz] of pCoords) {
        const pillar = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.046, 1.02, 10), MAT.teakWood));
        pillar.position.set(px, 0.51, pz);
        root.add(pillar);

        const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.9, 10), MAT.crimsonCloth);
        wrap.position.set(px, 0.5, pz);
        root.add(wrap);

        const goldBand = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.07, 10), MAT.goldBrass);
        goldBand.position.set(px, 0.58, pz);
        root.add(goldBand);
      }

      const carpet = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.018, 0.86), MAT.crimsonCloth));
      carpet.position.y = 0.01;
      root.add(carpet);

      const goldRug = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.012, 0.52), MAT.goldBrass);
      goldRug.position.y = 0.022;
      root.add(goldRug);

      const valanceBox = addShadow(new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.1, 1.08), MAT.crimsonCloth));
      valanceBox.position.y = 1.0;
      root.add(valanceBox);

      const innerValance = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 1.0), MAT.goldBrass);
      innerValance.position.y = 0.94;
      root.add(innerValance);

      const roofCone = addShadow(new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.48, 4), MAT.saffronCloth));
      roofCone.rotation.y = Math.PI / 4;
      roofCone.position.y = 1.28;
      root.add(roofCone);

      const kalash = new THREE.Mesh(GEO.sphereMed, MAT.goldBright);
      kalash.scale.set(0.07, 0.09, 0.07);
      kalash.position.y = 1.56;
      root.add(kalash);

      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.14, 8), MAT.goldBrass);
      spire.position.y = 1.68;
      root.add(spire);

      for (let side = 0; side < 4; side++) {
        const edgeGroup = new THREE.Group();
        edgeGroup.rotation.y = (side * Math.PI) / 2;
        for (let b = -2; b <= 2; b++) {
          const bulb = new THREE.Mesh(GEO.sphereLow, MAT.fairyBulb);
          bulb.scale.setScalar(0.026);
          bulb.position.set(b * 0.19, 0.9, 0.54);
          bulb.userData.isFairyLight = true;
          edgeGroup.add(bulb);
        }
        root.add(edgeGroup);
      }
      break;
    }

    case 'bamboo_gate': {
      for (const sx of [-0.42, 0.42]) {
        const col = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.12, 0.1), MAT.bambooGold));
        col.position.set(sx, 0.56, 0);
        root.add(col);

        for (const by of [0.22, 0.52, 0.84]) {
          const wrap = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.065, 0.13), MAT.marigoldOrange);
          wrap.position.set(sx, by, 0);
          root.add(wrap);
        }
      }

      const header = addShadow(new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.16, 0.13), MAT.crimsonCloth));
      header.position.y = 1.1;
      root.add(header);

      const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.035, 0.15), MAT.goldBrass);
      goldTrim.position.y = 1.2;
      root.add(goldTrim);

      const sunDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.045, 16), MAT.fairyBulb);
      sunDisc.rotation.x = Math.PI / 2;
      sunDisc.position.y = 1.36;
      sunDisc.userData.isFairyLight = true;
      root.add(sunDisc);

      for (let r = 0; r < 10; r++) {
        const ang = (r / 9) * Math.PI;
        const ray = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.1, 5), MAT.goldBrass);
        ray.position.set(Math.cos(ang) * 0.2, 1.36 + Math.sin(ang) * 0.2, 0);
        ray.rotation.z = ang - Math.PI / 2;
        root.add(ray);
      }
      break;
    }

    case 'arghya_daura': {
      const clothMat = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.028, 14), MAT.crimsonCloth);
      clothMat.position.y = 0.014;
      root.add(clothMat);

      const daura = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.19, 0.13, 12), MAT.bambooGold));
      daura.position.set(-0.04, 0.09, -0.04);
      root.add(daura);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.016, 8, 16), MAT.teakWood);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(-0.04, 0.15, -0.04);
      root.add(rim);

      const soop = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.028, 0.3), MAT.bambooGold));
      soop.position.set(0.14, 0.15, 0.14);
      soop.rotation.x = 0.28;
      root.add(soop);

      const coconut = new THREE.Mesh(GEO.sphereMed, MAT.coconutBrown);
      coconut.scale.set(0.08, 0.1, 0.08);
      coconut.position.set(-0.08, 0.2, -0.06);
      root.add(coconut);

      const bananaOffer = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.075), MAT.marigoldYellow);
      bananaOffer.position.set(0.06, 0.18, -0.08);
      root.add(bananaOffer);

      const appleOffer = new THREE.Mesh(GEO.sphereLow, MAT.crimsonCloth);
      appleOffer.scale.setScalar(0.05);
      appleOffer.position.set(-0.14, 0.18, 0.06);
      root.add(appleOffer);

      const thekuaOffer = new THREE.Mesh(GEO.sphereLow, MAT.thekuaBrown);
      thekuaOffer.scale.set(0.068, 0.042, 0.068);
      thekuaOffer.position.set(0.14, 0.19, 0.12);
      root.add(thekuaOffer);

      const soopDiya = createDiyaSubMesh(0.9);
      soopDiya.position.set(0.16, 0.17, 0.22);
      root.add(soopDiya);
      break;
    }

    case 'shirsoopta': {
      const tier1 = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.13, 0.56), MAT.clayVedi));
      tier1.position.y = 0.065;
      root.add(tier1);

      const tier2 = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.4), MAT.clayVedi));
      tier2.position.y = 0.205;
      root.add(tier2);

      const obelisk = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.4, 4), MAT.clayVedi));
      obelisk.rotation.y = Math.PI / 4;
      obelisk.position.y = 0.48;
      root.add(obelisk);

      const whiteBand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.028, 0.42), MAT.whitePaste);
      whiteBand.position.y = 0.28;
      root.add(whiteBand);

      for (let side = 0; side < 4; side++) {
        const dot = new THREE.Mesh(GEO.sphereLow, MAT.saffronCloth);
        dot.scale.setScalar(0.03);
        const a = (side * Math.PI) / 2;
        dot.position.set(Math.cos(a) * 0.13, 0.5, Math.sin(a) * 0.13);
        root.add(dot);
      }

      const topDiya = createDiyaSubMesh(1.1);
      topDiya.position.y = 0.7;
      root.add(topDiya);
      break;
    }

    case 'deep_stambh': {
      const base = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.11, 12), MAT.goldBrass));
      base.position.y = 0.055;
      root.add(base);

      const stem = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.9, 10), MAT.goldBrass));
      stem.position.y = 0.54;
      root.add(stem);

      const knop = new THREE.Mesh(GEO.sphereLow, MAT.goldBright);
      knop.scale.setScalar(0.07);
      knop.position.y = 0.48;
      root.add(knop);

      const tierHeights = [0.32, 0.58, 0.84];
      const tierRadii = [0.21, 0.16, 0.11];
      tierHeights.forEach((ty, idx) => {
        const rad = tierRadii[idx];
        const plate = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.68, 0.032, 12), MAT.goldBrass), false);
        plate.position.y = ty;
        root.add(plate);

        const flamesCount = idx === 2 ? 4 : 5;
        for (let f = 0; f < flamesCount; f++) {
          const ang = (f / flamesCount) * Math.PI * 2 + idx * 0.4;
          const flame = new THREE.Mesh(GEO.coneFlame, MAT.flame);
          flame.scale.setScalar(0.88);
          flame.position.set(Math.cos(ang) * (rad - 0.018), ty + 0.052, Math.sin(ang) * (rad - 0.018));
          flame.userData.isFlame = true;
          flame.userData.phase = ang + idx;
          root.add(flame);
        }
      });

      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 8), MAT.goldBright);
      crown.position.y = 1.04;
      root.add(crown);
      break;
    }

    case 'kosi': {
      // --- Saffron mat ---
      const mat = new THREE.Mesh(new THREE.CircleGeometry(0.42, 26), MAT.saffronCloth);
      mat.rotation.x = -Math.PI / 2;
      mat.position.y = 0.005;
      mat.receiveShadow = true;
      root.add(mat);

      const matTrim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.011, 8, 28), MAT.goldBrass);
      matTrim.rotation.x = Math.PI / 2;
      matTrim.position.y = 0.012;
      root.add(matTrim);

      for (const [fx, fz] of [
        [-0.3, 0.19],
        [-0.22, 0.28],
        [0.3, 0.18],
      ]) {
        const flower = new THREE.Mesh(
          GEO.sphereLow,
          fz > 0.24 ? MAT.marigoldYellow : MAT.marigoldOrange
        );
        flower.scale.setScalar(0.032);
        flower.position.set(fx, 0.022, fz);
        root.add(flower);
      }

      // --- Hand-thrown terracotta Kosi pot ---
      const foot = addShadow(
        new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.145, 0.06, 18), MAT.terracottaDark)
      );
      foot.position.y = 0.042;
      root.add(foot);

      const body = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.215, 24, 20), MAT.terracotta));
      body.scale.set(1, 0.96, 1);
      body.position.y = 0.29;
      root.add(body);

      // Painted cream & marigold bands plus a ring of white dots
      for (const [by, br] of [
        [0.18, 0.183],
        [0.4, 0.184],
      ]) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(br, 0.008, 8, 32), MAT.paintCream);
        band.rotation.x = Math.PI / 2;
        band.position.y = by;
        root.add(band);
      }

      const marigoldBand = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.007, 7, 30),
        MAT.marigoldOrange
      );
      marigoldBand.rotation.x = Math.PI / 2;
      marigoldBand.position.y = 0.21;
      root.add(marigoldBand);

      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const dot = new THREE.Mesh(GEO.sphereLow, i % 2 === 0 ? MAT.paintCream : MAT.marigoldYellow);
        dot.scale.setScalar(0.013);
        dot.position.set(Math.cos(a) * 0.2165, 0.29, Math.sin(a) * 0.2165);
        root.add(dot);
      }

      const neck = addShadow(
        new THREE.Mesh(new THREE.CylinderGeometry(0.093, 0.135, 0.1, 18), MAT.terracottaLight)
      );
      neck.position.y = 0.535;
      root.add(neck);

      const rim = addShadow(
        new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.015, 9, 26), MAT.terracottaDark),
        false
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.588;
      root.add(rim);

      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.016, 18), MAT.waterFill);
      water.position.y = 0.582;
      root.add(water);

      // --- Moulded elephant head crowning the pot's shoulder ---
      const head = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16), MAT.terracottaLight));
      head.scale.set(1.06, 0.94, 0.92);
      head.position.set(0, 0.435, 0.175);
      root.add(head);

      const forehead = addShadow(
        new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), MAT.terracottaLight),
        false
      );
      forehead.scale.set(1, 0.76, 0.95);
      forehead.position.set(0, 0.505, 0.16);
      root.add(forehead);

      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.083, 0.089, 0.024, 18),
        MAT.goldBrass
      );
      crown.position.set(0, 0.545, 0.155);
      crown.rotation.x = -0.14;
      root.add(crown);

      const crownJewel = new THREE.Mesh(GEO.sphereLow, MAT.marigoldYellow);
      crownJewel.scale.setScalar(0.02);
      crownJewel.position.set(0, 0.568, 0.16);
      root.add(crownJewel);

      for (const sx of [-1, 1]) {
        const ear = addShadow(
          new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 12), MAT.terracottaDark),
          false
        );
        ear.scale.set(0.24, 0.95, 0.8);
        ear.position.set(sx * 0.165, 0.43, 0.135);
        ear.rotation.z = -sx * 0.25;
        root.add(ear);

        const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), MAT.roseMagenta);
        innerEar.scale.set(0.14, 0.8, 0.55);
        innerEar.position.set(sx * 0.172, 0.43, 0.19);
        innerEar.rotation.z = -sx * 0.25;
        root.add(innerEar);

        const eye = new THREE.Mesh(GEO.sphereLow, MAT.paintCream);
        eye.scale.set(0.026, 0.024, 0.015);
        eye.position.set(sx * 0.075, 0.465, 0.288);
        root.add(eye);

        const pupil = new THREE.Mesh(GEO.sphereLow, MAT.eyeDark);
        pupil.scale.setScalar(0.013);
        pupil.position.set(sx * 0.077, 0.465, 0.3);
        root.add(pupil);

        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.008, 0.012), MAT.eyeDark);
        brow.position.set(sx * 0.078, 0.489, 0.29);
        brow.rotation.z = sx * 0.09;
        root.add(brow);

        const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.11, 10), MAT.whitePaste);
        tusk.rotation.x = 2.05;
        tusk.rotation.z = sx * 0.15;
        tusk.position.set(sx * 0.07, 0.385, 0.3);
        root.add(tusk);
      }

      // Softly curling trunk built from a smooth Catmull-Rom spine
      const trunkSpine = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.43, 0.29),
        new THREE.Vector3(0.01, 0.385, 0.33),
        new THREE.Vector3(0.035, 0.32, 0.356),
        new THREE.Vector3(0.07, 0.25, 0.371),
        new THREE.Vector3(0.105, 0.185, 0.368),
        new THREE.Vector3(0.128, 0.13, 0.348),
        new THREE.Vector3(0.133, 0.092, 0.32),
        new THREE.Vector3(0.122, 0.072, 0.292),
        new THREE.Vector3(0.104, 0.072, 0.272),
      ]);
      const trunkSamples = 20;
      for (let i = 0; i <= trunkSamples; i++) {
        const tt = i / trunkSamples;
        const pt = trunkSpine.getPoint(tt);
        const rad = THREE.MathUtils.lerp(0.052, 0.017, Math.pow(tt, 0.85));
        const seg = addShadow(
          new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 10), MAT.terracotta),
          tt > 0.45
        );
        seg.scale.set(1, 1.05, 1.05);
        seg.position.copy(pt);
        root.add(seg);
      }

      // Trunk wrinkle rings
      for (const [tx, ty, tz, tr] of [
        [0.037, 0.318, 0.357, 0.045],
        [0.088, 0.232, 0.372, 0.037],
        [0.128, 0.142, 0.352, 0.029],
      ]) {
        const wrinkle = new THREE.Mesh(
          new THREE.TorusGeometry(tr, 0.005, 6, 16),
          MAT.terracottaDark
        );
        wrinkle.rotation.x = Math.PI / 2;
        wrinkle.position.set(tx, ty, tz);
        root.add(wrinkle);
      }

      // Marigold garland around the elephant's neck
      const neckGarland = new THREE.Mesh(
        new THREE.TorusGeometry(0.108, 0.017, 8, 24),
        MAT.marigoldYellow
      );
      neckGarland.rotation.x = Math.PI / 2;
      neckGarland.position.set(0, 0.345, 0.09);
      root.add(neckGarland);

      // Tilak & sandal marks
      const tilak = new THREE.Mesh(GEO.sphereLow, MAT.vermilion);
      tilak.scale.set(0.018, 0.03, 0.012);
      tilak.position.set(0, 0.51, 0.226);
      root.add(tilak);

      for (const sx of [-1, 1]) {
        const sandal = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.042, 0.008), MAT.paintCream);
        sandal.position.set(sx * 0.028, 0.505, 0.227);
        sandal.rotation.z = -sx * 0.12;
        root.add(sandal);
      }

      // Mango leaves fanned around the mouth of the pot
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.5;
        const hanger = new THREE.Group();
        hanger.position.set(Math.cos(a) * 0.085, 0.59, Math.sin(a) * 0.085);
        hanger.rotation.y = -a + Math.PI / 2;
        const leaf = createLeafBlade(0.17, 0.045, i % 2 === 0 ? MAT.leafEmerald : MAT.leafLush);
        leaf.rotation.x = 1.0 + (i % 2) * 0.12;
        hanger.add(leaf);
        root.add(hanger);
      }

      const coconut = new THREE.Mesh(GEO.sphereMed, MAT.coconutBrown);
      coconut.scale.set(0.052, 0.058, 0.052);
      coconut.position.set(0.01, 0.655, -0.012);
      root.add(coconut);

      const rimFlower = new THREE.Mesh(GEO.sphereLow, MAT.marigoldOrange);
      rimFlower.scale.setScalar(0.03);
      rimFlower.position.set(0.075, 0.612, 0.05);
      root.add(rimFlower);

      // Two welcome diyas flanking the pot on the mat
      const leftDiya = createDiyaSubMesh(0.8);
      leftDiya.position.set(-0.25, 0.014, 0.09);
      root.add(leftDiya);

      const rightDiya = createDiyaSubMesh(0.8);
      rightDiya.position.set(0.245, 0.014, -0.13);
      root.add(rightDiya);
      break;
    }

    default:
      break;
  }

  mergeStaticMeshes(root);
  return root;
}
