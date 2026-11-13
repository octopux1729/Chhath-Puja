import * as THREE from 'three';
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
      const caneCount = 5;
      for (let i = 0; i < caneCount; i++) {
        const angle = (i / caneCount) * Math.PI * 2;
        const r = 0.26;
        const stalkHolder = new THREE.Group();
        stalkHolder.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
        stalkHolder.lookAt(0, 0.2, 0);

        const stalk = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 1.12, 8), MAT.bambooGreen));
        stalk.position.set(0, 0.52, 0.12);
        stalk.rotation.x = 0.22;
        stalkHolder.add(stalk);

        for (let n = 0; n < 5; n++) {
          const node = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.018, 8), MAT.caneStripe);
          node.position.set(0, 0.22 + n * 0.18, 0.05 + n * 0.03);
          node.rotation.x = 0.22;
          stalkHolder.add(node);
        }

        for (let l = -1; l <= 1; l++) {
          const leaf = addShadow(new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.34, 5), MAT.leafLush), false);
          leaf.position.set(l * 0.035, 1.12, 0.26);
          leaf.rotation.x = 0.7;
          leaf.rotation.z = l * 0.32;
          stalkHolder.add(leaf);
        }

        root.add(stalkHolder);
      }

      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 14), MAT.crimsonCloth);
      tie.rotation.x = Math.PI / 2;
      tie.position.y = 0.9;
      root.add(tie);

      const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.02, 12), MAT.saffronCloth);
      cloth.position.y = 0.01;
      root.add(cloth);

      const centerDiya = createDiyaSubMesh(1.0);
      centerDiya.position.y = 0.02;
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
      const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.022, 14), MAT.saffronCloth);
      cloth.position.y = 0.012;
      root.add(cloth);

      const body = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), MAT.terracotta));
      body.scale.set(1, 0.92, 0.82);
      body.position.set(0, 0.26, 0);
      root.add(body);

      const neck = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.14, 12), MAT.terracottaLight));
      neck.position.set(0, 0.48, 0);
      root.add(neck);

      const rim = addShadow(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 16), MAT.terracottaDark), false);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(0, 0.55, 0);
      root.add(rim);

      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.02, 12), MAT.waterFill);
      water.position.set(0, 0.54, 0);
      root.add(water);

      const head = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), MAT.terracottaLight));
      head.scale.set(1.05, 0.85, 1.15);
      head.position.set(0, 0.34, 0.24);
      root.add(head);

      const trunkCurve = new THREE.Group();
      trunkCurve.position.set(0, 0.3, 0.32);
      const trunk = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.048, 0.22, 10), MAT.terracotta));
      trunk.rotation.x = 0.85;
      trunk.position.set(0, -0.04, 0.08);
      trunkCurve.add(trunk);
      const trunkTip = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.12, 8), MAT.terracottaDark), false);
      trunkTip.rotation.x = 1.35;
      trunkTip.position.set(0, -0.12, 0.16);
      trunkCurve.add(trunkTip);
      root.add(trunkCurve);

      for (const sx of [-1, 1]) {
        const ear = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), MAT.terracottaDark), false);
        ear.scale.set(0.28, 0.85, 0.7);
        ear.position.set(sx * 0.16, 0.36, 0.18);
        root.add(ear);
      }

      for (const sx of [-1, 1]) {
        const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.1, 8), MAT.whitePaste);
        tusk.rotation.x = 1.2;
        tusk.position.set(sx * 0.05, 0.26, 0.34);
        root.add(tusk);
      }

      const band = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 18), MAT.marigoldYellow);
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 0.3, 0);
      root.add(band);

      const sindoor = new THREE.Mesh(GEO.sphereLow, MAT.vermilion);
      sindoor.scale.setScalar(0.028);
      sindoor.position.set(0, 0.42, 0.3);
      root.add(sindoor);

      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const dot = new THREE.Mesh(GEO.sphereLow, i % 2 === 0 ? MAT.whitePaste : MAT.marigoldOrange);
        dot.scale.setScalar(0.018);
        dot.position.set(Math.cos(a) * 0.2, 0.22, Math.sin(a) * 0.16);
        root.add(dot);
      }

      const topDiya = createDiyaSubMesh(0.78);
      topDiya.position.set(0, 0.56, 0);
      root.add(topDiya);

      const mangoLeaf = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.16), MAT.leafEmerald), false);
      mangoLeaf.position.set(0.08, 0.57, 0.02);
      mangoLeaf.rotation.z = 0.4;
      root.add(mangoLeaf);
      break;
    }

    default:
      break;
  }

  return root;
}
