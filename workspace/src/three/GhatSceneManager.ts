import * as THREE from 'three';
import { BUILDING_ITEMS } from '../data/catalog';
import {
  BuildingItemId,
  GRID_SIZE,
  GridCellData,
  LightingPreset,
} from '../types/game';
import { buildItemMesh } from './meshFactory';

interface SpringAnim {
  obj: THREE.Object3D;
  elapsed: number;
  duration: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
  maxLife: number;
  gravity: number;
}

interface WaterRing {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

export interface TileTapCallbackPayload {
  gx: number;
  gz: number;
  screenX: number;
  screenY: number;
}

export class GhatSceneManager {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Camera spherical coordinates
  private camTarget = new THREE.Vector3(0, 0.2, 0);
  private targetCamTarget = new THREE.Vector3(0, 0.2, 0);
  private theta = Math.PI * 0.22; // horizontal azimuth
  private targetTheta = Math.PI * 0.22;
  private phi = 0.88; // polar angle from vertical
  private targetPhi = 0.88;
  private radius = 14.5;
  private targetRadius = 14.5;
  private minRadius = 7.0;
  private maxRadius = 28.0;
  private hasInitializedFraming = false;
  private autoOrbit = true;
  private ambientFireflies: THREE.Points | null = null;

  // Screen shake
  private shakeIntensity = 0;

  // Lighting & Sky
  private hemiLight!: THREE.HemisphereLight;
  private sunLight!: THREE.DirectionalLight;
  private warmPointLight!: THREE.PointLight;
  private sunOrbGroup!: THREE.Group;
  private sunCoreMat!: THREE.MeshBasicMaterial;
  private sunHaloMat!: THREE.MeshBasicMaterial;
  private sunGlowMat!: THREE.MeshBasicMaterial;
  private cloudGroup!: THREE.Group;
  private cloudMats: THREE.MeshStandardMaterial[] = [];
  private lightingPreset: LightingPreset = 'sunset';
  private ritualProgress = 0.52;

  // Grid & Diorama Groups
  private rootGroup = new THREE.Group();
  private tilesGroup = new THREE.Group();
  private structuresGroup = new THREE.Group();
  private fxGroup = new THREE.Group();

  // Tile meshes for raycasting
  private raycastPlane: THREE.Mesh;
  private tileLandMeshes: THREE.Mesh[][] = [];
  private tileWaterMeshes: THREE.Mesh[][] = [];
  private waterSharedMat: THREE.MeshStandardMaterial;

  // Tracked placed 3D objects per cell
  private baseMeshes: (THREE.Group | null)[][] = [];
  private propMeshes: (THREE.Group | null)[][] = [];

  // Hover cursor & Ghost preview
  private hoverRing: THREE.Mesh;
  private ghostGroup: THREE.Group | null = null;
  private ghostItemId: BuildingItemId = 'pond_platform';
  private ghostRotation = 0;
  private hoveredCell: { gx: number; gz: number } | null = null;
  private interactionEnabled = false;

  // Animations & Particles
  private springs: SpringAnim[] = [];
  private particles: Particle[] = [];
  private waterRings: WaterRing[] = [];
  private flameObjects: THREE.Object3D[] = [];
  private floatingObjects: THREE.Object3D[] = [];

  // Pointer / Touch tracking
  private raycaster = new THREE.Raycaster();
  private pointerDownPos = { x: 0, y: 0 };
  private lastDragPos = { x: 0, y: 0 };
  private isPointerDown = false;
  private hasDragged = false;
  private dragButton = 0;
  private activePointers = new Map<number, { x: number; y: number }>();
  private lastPinchDist = 0;

  // Callbacks
  private onTileTap?: (payload: TileTapCallbackPayload) => void;
  private onRightRotate?: () => void;

  // Loop
  private rafId = 0;
  private clock = new THREE.Clock();
  private currentGridRef: GridCellData[][] | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onTileTap: (payload: TileTapCallbackPayload) => void;
      onRightRotate: () => void;
    }
  ) {
    this.canvas = canvas;
    this.onTileTap = callbacks.onTileTap;
    this.onRightRotate = callbacks.onRightRotate;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true, // Required for clean Ghat image export!
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xc45a2a);
    this.scene.fog = new THREE.FogExp2(0xc45a2a, 0.012);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.5, 120);

    this.waterSharedMat = new THREE.MeshStandardMaterial({
      color: 0x0e8aaa,
      emissive: new THREE.Color(0x0c4a6e),
      emissiveIntensity: 0.42,
      roughness: 0.08,
      metalness: 0.42,
      transparent: true,
      opacity: 0.86,
    });

    // Invisible raycast plane for rock-solid grid coordinate picking
    const planeGeo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    planeGeo.rotateX(-Math.PI / 2);
    this.raycastPlane = new THREE.Mesh(
      planeGeo,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.scene.add(this.raycastPlane);

    // Golden tile selection ring
    const ringGeo = new THREE.RingGeometry(0.38, 0.48, 4);
    ringGeo.rotateX(-Math.PI / 2);
    ringGeo.rotateY(Math.PI / 4);
    this.hoverRing = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      })
    );
    this.hoverRing.visible = false;
    this.scene.add(this.hoverRing);

    this.setupLightingAndSun();
    this.setupDioramaBase();

    this.rootGroup.add(this.tilesGroup);
    this.rootGroup.add(this.structuresGroup);
    this.rootGroup.add(this.fxGroup);
    this.scene.add(this.rootGroup);

    for (let x = 0; x < GRID_SIZE; x++) {
      this.baseMeshes[x] = new Array(GRID_SIZE).fill(null);
      this.propMeshes[x] = new Array(GRID_SIZE).fill(null);
    }

    this.handleResize();
    this.bindEvents();
    this.rebuildGhostMesh();
    this.animate();
  }

  private setupLightingAndSun(): void {
    this.hemiLight = new THREE.HemisphereLight(0xffe4c4, 0x5c2d16, 1.15);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffc078, 2.35);
    this.sunLight.position.set(-12, 11, -14);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 42;
    const d = 9.5;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    this.warmPointLight = new THREE.PointLight(0xff8c00, 0.9, 20, 1.35);
    this.warmPointLight.position.set(0, 2.2, 0.5);
    this.scene.add(this.warmPointLight);

    this.sunOrbGroup = new THREE.Group();
    this.sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff7d6 });
    const sunCore = new THREE.Mesh(new THREE.SphereGeometry(2.15, 28, 24), this.sunCoreMat);
    this.sunOrbGroup.add(sunCore);

    this.sunHaloMat = new THREE.MeshBasicMaterial({
      color: 0xff7a33,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    const sunHalo = new THREE.Mesh(new THREE.SphereGeometry(3.6, 28, 24), this.sunHaloMat);
    this.sunOrbGroup.add(sunHalo);

    this.sunGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffc14d,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(5.4, 24, 20), this.sunGlowMat);
    this.sunOrbGroup.add(sunGlow);

    this.sunOrbGroup.position.set(-14, 5.5, -24);
    this.scene.add(this.sunOrbGroup);

    this.cloudGroup = new THREE.Group();
    const cloudSpecs = [
      { x: -10, y: 8.2, z: -18, sx: 3.4, sy: 1.1, sz: 1.8 },
      { x: -4.5, y: 9.4, z: -20, sx: 2.6, sy: 0.9, sz: 1.5 },
      { x: 6, y: 8.8, z: -19, sx: 3.8, sy: 1.2, sz: 2.0 },
      { x: 11, y: 7.6, z: -16, sx: 2.4, sy: 0.8, sz: 1.4 },
      { x: 2, y: 10.2, z: -22, sx: 2.2, sy: 0.7, sz: 1.2 },
      { x: -14, y: 7.1, z: -15, sx: 2.8, sy: 0.85, sz: 1.6 },
    ];
    for (const spec of cloudSpecs) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffe4c8,
        roughness: 0.92,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      });
      this.cloudMats.push(mat);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat);
      puff.scale.set(spec.sx, spec.sy, spec.sz);
      puff.position.set(spec.x, spec.y, spec.z);
      this.cloudGroup.add(puff);

      const puff2 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 7), mat);
      puff2.scale.set(spec.sx * 0.55, spec.sy * 0.8, spec.sz * 0.7);
      puff2.position.set(spec.x + spec.sx * 0.35, spec.y + 0.15, spec.z + 0.2);
      this.cloudGroup.add(puff2);
    }
    this.scene.add(this.cloudGroup);

    const moteCount = 56;
    const positions = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = 0.4 + Math.random() * 4.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.12,
      transparent: true,
      opacity: 0.55,
    });
    this.ambientFireflies = new THREE.Points(moteGeo, moteMat);
    this.scene.add(this.ambientFireflies);
  }

  private setupDioramaBase(): void {
    // Rich architectural plinth under the 12x12 sacred Ghat
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_SIZE + 0.7, 0.9, GRID_SIZE + 0.7),
      new THREE.MeshStandardMaterial({ color: 0x5c2d16, roughness: 0.85 })
    );
    plinth.position.y = -0.58;
    plinth.receiveShadow = true;
    this.rootGroup.add(plinth);

    const goldRim = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_SIZE + 0.82, 0.08, GRID_SIZE + 0.82),
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.4,
        roughness: 0.45,
      })
    );
    goldRim.position.y = -0.14;
    this.rootGroup.add(goldRim);

    const river = new THREE.Mesh(
      new THREE.CircleGeometry(28, 36),
      new THREE.MeshStandardMaterial({
        color: 0x0e7490,
        roughness: 0.18,
        metalness: 0.32,
        transparent: true,
        opacity: 0.55,
      })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.y = -0.72;
    this.scene.add(river);

    const farBank = new THREE.Mesh(
      new THREE.CylinderGeometry(32, 34, 0.6, 28, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x6b4423,
        roughness: 0.95,
        side: THREE.DoubleSide,
      })
    );
    farBank.position.y = -0.9;
    this.scene.add(farBank);

    // Pond basin floor beneath all tiles
    const basinFloor = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_SIZE, 0.08, GRID_SIZE),
      new THREE.MeshStandardMaterial({ color: 0x083344, roughness: 0.9 })
    );
    basinFloor.position.y = -0.16;
    this.tilesGroup.add(basinFloor);

    // Individual land & water tiles for 12x12 grid
    const landGeo = new THREE.BoxGeometry(0.99, 0.18, 0.99);
    const landMatEven = new THREE.MeshStandardMaterial({ color: 0x8a6a3b, roughness: 0.9 });
    const landMatOdd = new THREE.MeshStandardMaterial({ color: 0x7a5c32, roughness: 0.88 });
    const waterGeo = new THREE.BoxGeometry(1.0, 0.12, 1.0);

    for (let x = 0; x < GRID_SIZE; x++) {
      this.tileLandMeshes[x] = [];
      this.tileWaterMeshes[x] = [];
      for (let z = 0; z < GRID_SIZE; z++) {
        const wx = this.gridToWorld(x);
        const wz = this.gridToWorld(z);

        const landMesh = new THREE.Mesh(
          landGeo,
          (x + z) % 2 === 0 ? landMatEven : landMatOdd
        );
        landMesh.position.set(wx, -0.09, wz);
        landMesh.receiveShadow = true;
        this.tilesGroup.add(landMesh);
        this.tileLandMeshes[x][z] = landMesh;

        const waterMesh = new THREE.Mesh(waterGeo, this.waterSharedMat);
        waterMesh.position.set(wx, -0.1, wz);
        waterMesh.receiveShadow = true;
        waterMesh.visible = false;
        this.tilesGroup.add(waterMesh);
        this.tileWaterMeshes[x][z] = waterMesh;
      }
    }
  }

  public gridToWorld(coord: number): number {
    return coord - (GRID_SIZE - 1) / 2;
  }

  public worldToGrid(val: number): number {
    return Math.round(val + (GRID_SIZE - 1) / 2);
  }

  /**
   * Synchronizes the entire 3D Ghat scene with the GridCellData state
   */
  public syncGrid(
    grid: GridCellData[][],
    animateCell?: { gx: number; gz: number; burstType?: 'water' | 'festive' | 'remove' }
  ): void {
    this.currentGridRef = grid;
    this.flameObjects = [];
    this.floatingObjects = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const cell = grid[x][z];
        const wx = this.gridToWorld(x);
        const wz = this.gridToWorld(z);
        const isAnimatedTarget =
          animateCell && animateCell.gx === x && animateCell.gz === z;

        // 1. Update Land vs Pond Terrain
        const isPond = cell.terrain === 'pond';
        this.tileLandMeshes[x][z].visible = !isPond;
        this.tileWaterMeshes[x][z].visible = isPond;

        // 2. Sync Base Layer (Ghat Steps or Platform on Pond)
        const existingBase = this.baseMeshes[x][z];
        const desiredBaseId = cell.base?.itemId || null;
        const desiredBaseRot = cell.base?.rotation || 0;

        if (!desiredBaseId && existingBase) {
          this.structuresGroup.remove(existingBase);
          this.baseMeshes[x][z] = null;
        } else if (
          desiredBaseId &&
          (!existingBase || existingBase.userData.instanceId !== cell.base?.id)
        ) {
          if (existingBase) {
            this.structuresGroup.remove(existingBase);
          }
          const mesh = buildItemMesh(desiredBaseId);
          mesh.userData.instanceId = cell.base?.id;
          const baseY = desiredBaseId === 'pond_platform' ? 0 : 0;
          mesh.position.set(wx, baseY, wz);
          mesh.rotation.y = (desiredBaseRot * Math.PI) / 2;
          this.structuresGroup.add(mesh);
          this.baseMeshes[x][z] = mesh;

          if (isAnimatedTarget) {
            this.addSpring(mesh);
          }
        } else if (existingBase && cell.base) {
          existingBase.rotation.y = (desiredBaseRot * Math.PI) / 2;
        }

        // 3. Sync Top Prop Layer (Trees, Flowers, Pandals, Offerings, Floating Diyas)
        const existingProp = this.propMeshes[x][z];
        const desiredPropId = cell.prop?.itemId || null;
        const desiredPropRot = cell.prop?.rotation || 0;

        // Compute elevation: sits neatly on top of Ghat Steps or Pond Platform!
        const surfaceY = this.getCellTopElevation(cell);

        if (!desiredPropId && existingProp) {
          this.structuresGroup.remove(existingProp);
          this.propMeshes[x][z] = null;
        } else if (
          desiredPropId &&
          (!existingProp || existingProp.userData.instanceId !== cell.prop?.id)
        ) {
          if (existingProp) {
            this.structuresGroup.remove(existingProp);
          }
          const mesh = buildItemMesh(desiredPropId);
          mesh.userData.instanceId = cell.prop?.id;
          mesh.userData.baseY = surfaceY;
          mesh.position.set(wx, surfaceY, wz);
          mesh.rotation.y = (desiredPropRot * Math.PI) / 2;
          this.structuresGroup.add(mesh);
          this.propMeshes[x][z] = mesh;

          if (isAnimatedTarget) {
            this.addSpring(mesh);
          }
        } else if (existingProp && cell.prop) {
          existingProp.userData.baseY = surfaceY;
          existingProp.position.y = surfaceY;
          existingProp.rotation.y = (desiredPropRot * Math.PI) / 2;
        }

        // Collect animated sub-objects (flames & floating diyas)
        const bMesh = this.baseMeshes[x][z];
        const pMesh = this.propMeshes[x][z];
        if (bMesh) this.collectAnimatedNodes(bMesh);
        if (pMesh) this.collectAnimatedNodes(pMesh);
      }
    }

    // 5. Trigger Particle Burst & Camera Micro-Shake if requested!
    if (animateCell) {
      const wx = this.gridToWorld(animateCell.gx);
      const wz = this.gridToWorld(animateCell.gz);
      const cell = grid[animateCell.gx][animateCell.gz];
      const wy = Math.max(0, this.getCellTopElevation(cell));

      if (animateCell.burstType === 'water') {
        this.spawnParticleBurst(wx, 0.05, wz, 'water');
        this.spawnWaterRing(wx, wz);
        this.triggerShake(0.065);
      } else if (animateCell.burstType === 'festive') {
        this.spawnParticleBurst(wx, wy + 0.25, wz, 'festive');
        if (cell.terrain === 'pond') this.spawnWaterRing(wx, wz);
        this.triggerShake(0.085);
      } else if (animateCell.burstType === 'remove') {
        this.spawnParticleBurst(wx, wy + 0.15, wz, 'remove');
        this.triggerShake(0.045);
      }
    }

    this.updateGhostPosition();
  }

  private getCellTopElevation(cell: GridCellData): number {
    if (cell.base?.itemId === 'pond_platform') return 0.255;
    if (cell.base?.itemId === 'ghat_steps') return 0.26;
    if (cell.terrain === 'pond') return -0.04;
    return 0;
  }

  private collectAnimatedNodes(root: THREE.Object3D): void {
    if (root.userData.floatBob) {
      this.floatingObjects.push(root);
    }
    root.traverse((child) => {
      if (child.userData.isFlame || child.userData.isFairyLight) {
        this.flameObjects.push(child);
      }
    });
  }

  private addSpring(obj: THREE.Object3D): void {
    obj.scale.setScalar(0.15);
    this.springs = this.springs.filter((s) => s.obj !== obj);
    this.springs.push({ obj, elapsed: 0, duration: 0.38 });
  }

  public triggerShake(intensity = 0.08): void {
    this.shakeIntensity = Math.min(0.22, Math.max(this.shakeIntensity, intensity));
  }

  private spawnWaterRing(wx: number, wz: number): void {
    const ringGeo = new THREE.RingGeometry(0.15, 0.22, 18);
    ringGeo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(ringGeo, mat);
    mesh.position.set(wx, -0.02, wz);
    this.fxGroup.add(mesh);
    this.waterRings.push({ mesh, life: 0, maxLife: 0.75 });
  }

  private spawnParticleBurst(
    wx: number,
    wy: number,
    wz: number,
    kind: 'water' | 'festive' | 'remove'
  ): void {
    const palette =
      kind === 'water'
        ? [0x38bdf8, 0x7dd3fc, 0xfacc15, 0xe0f2fe]
        : kind === 'festive'
        ? [0xf97316, 0xfacc15, 0xec4899, 0xfef08a, 0x22c55e]
        : [0xd6d3d1, 0xfdba74];

    const count = kind === 'remove' ? 10 : 20;
    const geo = new THREE.BoxGeometry(0.065, 0.065, 0.065);

    for (let i = 0; i < count; i++) {
      const col = palette[i % palette.length];
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        wx + (Math.random() - 0.5) * 0.45,
        wy + Math.random() * 0.15,
        wz + (Math.random() - 0.5) * 0.45
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.1 + Math.random() * 2.2;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        2.2 + Math.random() * 2.6,
        Math.sin(angle) * speed
      );
      const rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      this.fxGroup.add(mesh);
      this.particles.push({
        mesh,
        vel,
        rotVel,
        life: 0,
        maxLife: 0.55 + Math.random() * 0.35,
        gravity: kind === 'festive' ? 5.2 : 7.8,
      });
    }
  }

  /**
   * Celebratory Marigold & Diya Spark Shower across the entire Ghat!
   */
  public triggerGrandPetalShower(): void {
    for (let i = 0; i < 5; i++) {
      const rx = (Math.random() - 0.5) * 7;
      const rz = (Math.random() - 0.5) * 7;
      this.spawnParticleBurst(rx, 1.4, rz, 'festive');
    }
    this.triggerShake(0.11);
  }

  public setSelectedTool(itemId: BuildingItemId, rotation: number): void {
    const changedItem = this.ghostItemId !== itemId;
    this.ghostItemId = itemId;
    this.ghostRotation = rotation;
    if (changedItem) {
      this.rebuildGhostMesh();
    } else if (this.ghostGroup) {
      this.ghostGroup.rotation.y = (rotation * Math.PI) / 2;
    }
    this.updateGhostPosition();
  }

  public setInteractionEnabled(enabled: boolean, autoOrbit = false): void {
    this.interactionEnabled = enabled;
    this.autoOrbit = autoOrbit;
    if (!enabled) {
      this.hoverRing.visible = false;
      if (this.ghostGroup) this.ghostGroup.visible = false;
    } else {
      this.updateGhostPosition();
    }
  }

  public setLightingState(preset: LightingPreset, progress01: number): void {
    this.lightingPreset = preset;
    this.ritualProgress = THREE.MathUtils.clamp(progress01, 0, 1);
  }

  private updateAtmosphere(timeSec: number): void {
    let t = this.ritualProgress;
    if (this.lightingPreset === 'sunset') t = 0.52;
    else if (this.lightingPreset === 'twilight') t = 0.94;
    else if (this.lightingPreset === 'dawn') t = 0.18;

    const skyDawn = new THREE.Color(0xf4a261);
    const skySunset = new THREE.Color(0xc2410c);
    const skyDusk = new THREE.Color(0x7c1d12);
    const skyTwilight = new THREE.Color(0x1e1436);

    const currentSky = new THREE.Color();
    if (t < 0.4) {
      currentSky.lerpColors(skyDawn, skySunset, t / 0.4);
    } else if (t < 0.72) {
      currentSky.lerpColors(skySunset, skyDusk, (t - 0.4) / 0.32);
    } else {
      currentSky.lerpColors(skyDusk, skyTwilight, (t - 0.72) / 0.28);
    }

    this.scene.background = currentSky;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(currentSky);
      this.scene.fog.density = THREE.MathUtils.lerp(0.01, 0.018, t);
    }

    const sunY = THREE.MathUtils.lerp(10.2, 1.15, t);
    this.sunOrbGroup.position.set(-13, sunY, -24);
    const pulse = 1 + Math.sin(timeSec * 1.6) * 0.025;
    this.sunOrbGroup.scale.setScalar(pulse);
    this.sunCoreMat.color.setHex(t > 0.75 ? 0xffd7a1 : 0xfff7d6);
    this.sunHaloMat.opacity = THREE.MathUtils.lerp(0.28, 0.48, t);
    this.sunGlowMat.opacity = THREE.MathUtils.lerp(0.12, 0.22, t);

    this.sunLight.position.set(-11, Math.max(3.2, sunY + 3.5), -14);
    this.sunLight.intensity = THREE.MathUtils.lerp(2.55, 0.72, t);

    if (this.cloudGroup) {
      this.cloudGroup.position.x = Math.sin(timeSec * 0.018) * 1.6;
      this.cloudGroup.position.y = Math.sin(timeSec * 0.04) * 0.18;
      const cloudTint = new THREE.Color().lerpColors(
        new THREE.Color(0xfff1e0),
        new THREE.Color(0x8b6b9a),
        t
      );
      for (const mat of this.cloudMats) {
        mat.color.copy(cloudTint);
        mat.opacity = THREE.MathUtils.lerp(0.82, 0.42, t);
      }
    }
    this.sunLight.color.lerpColors(
      new THREE.Color(0xffe0b2),
      new THREE.Color(0xff5722),
      Math.min(1, t * 1.25)
    );

    this.hemiLight.intensity = THREE.MathUtils.lerp(1.22, 0.48, t);
    this.warmPointLight.intensity = THREE.MathUtils.lerp(0.4, 2.6, t);
    this.waterSharedMat.emissiveIntensity = THREE.MathUtils.lerp(0.28, 0.62, t);
    this.waterSharedMat.opacity = 0.82 + Math.sin(timeSec * 0.7) * 0.04;
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(1.18, 0.92, t);
  }

  private rebuildGhostMesh(): void {
    if (this.ghostGroup) {
      this.scene.remove(this.ghostGroup);
      this.ghostGroup = null;
    }

    if (this.ghostItemId === 'bulldoze' || this.ghostItemId === 'pond_tile') {
      // Pond & Bulldoze use crisp colored hover ring indicator
      return;
    }

    const mesh = buildItemMesh(this.ghostItemId);
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const ghostMat = new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0.52,
        });
        child.material = ghostMat;
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    mesh.rotation.y = (this.ghostRotation * Math.PI) / 2;
    mesh.visible = false;
    this.scene.add(mesh);
    this.ghostGroup = mesh;
  }

  private updateGhostPosition(): void {
    if (!this.interactionEnabled || !this.hoveredCell || !this.currentGridRef) {
      this.hoverRing.visible = false;
      if (this.ghostGroup) this.ghostGroup.visible = false;
      return;
    }

    const { gx, gz } = this.hoveredCell;
    const cell = this.currentGridRef[gx]?.[gz];
    if (!cell) return;

    const wx = this.gridToWorld(gx);
    const wz = this.gridToWorld(gz);
    const def = BUILDING_ITEMS[this.ghostItemId];
    const topY =
      def.layer === 'base_platform' ? 0 : Math.max(0, this.getCellTopElevation(cell));

    this.hoverRing.visible = true;
    this.hoverRing.position.set(wx, topY + 0.03, wz);

    const ringMat = this.hoverRing.material as THREE.MeshBasicMaterial;
    if (this.ghostItemId === 'bulldoze') {
      ringMat.color.setHex(0xf43f5e);
    } else if (this.ghostItemId === 'pond_tile') {
      ringMat.color.setHex(0x38bdf8);
    } else {
      ringMat.color.setHex(0xfacc15);
    }

    if (this.ghostGroup) {
      this.ghostGroup.visible = true;
      this.ghostGroup.position.set(wx, topY, wz);
      this.ghostGroup.rotation.y = (this.ghostRotation * Math.PI) / 2;
    }
  }

  /**
   * Projects a grid cell to 2D viewport pixel coordinates for floating score popups
   */
  public projectCellToScreen(gx: number, gz: number): { x: number; y: number } {
    const v = new THREE.Vector3(
      this.gridToWorld(gx),
      0.7,
      this.gridToWorld(gz)
    );
    v.project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((v.x + 1) / 2) * rect.width,
      y: ((-v.y + 1) / 2) * rect.height,
    };
  }

  public getHoveredOrCenterCell(): { gx: number; gz: number } {
    if (this.hoveredCell) return this.hoveredCell;
    return {
      gx: THREE.MathUtils.clamp(this.worldToGrid(this.camTarget.x), 0, GRID_SIZE - 1),
      gz: THREE.MathUtils.clamp(this.worldToGrid(this.camTarget.z), 0, GRID_SIZE - 1),
    };
  }

  public moveHoveredCellBy(dx: number, dz: number): void {
    const cur = this.getHoveredOrCenterCell();
    const nx = THREE.MathUtils.clamp(cur.gx + dx, 0, GRID_SIZE - 1);
    const nz = THREE.MathUtils.clamp(cur.gz + dz, 0, GRID_SIZE - 1);
    this.hoveredCell = { gx: nx, gz: nz };
    this.updateGhostPosition();
  }

  private getIdealDefaultRadius(aspect: number): number {
    if (aspect < 0.65) return 22.5; // Tall mobile portrait
    if (aspect < 1.0) return 18.5; // Tablet / square portrait
    return 14.5; // Desktop / landscape
  }

  public adjustCamera(dTheta: number, dZoom: number): void {
    this.targetTheta += dTheta;
    this.targetRadius = THREE.MathUtils.clamp(
      this.targetRadius + dZoom,
      this.minRadius,
      this.maxRadius
    );
  }

  public resetCameraView(): void {
    this.targetCamTarget.set(0, 0.2, 0);
    this.targetTheta = Math.PI * 0.22;
    this.targetPhi = 0.88;
    this.targetRadius = this.getIdealDefaultRadius(this.camera.aspect || 1);
  }

  /**
   * High-Resolution Ghat Snapshot Exporter!
   * Supports both Framed Festive Postcard & Clean Full-Bleed 3D Photo
   */
  public captureGhatImage(options: {
    framed: boolean;
    ghatName: string;
  }): string {
    const prevRing = this.hoverRing.visible;
    const prevGhost = this.ghostGroup ? this.ghostGroup.visible : false;

    this.hoverRing.visible = false;
    if (this.ghostGroup) this.ghostGroup.visible = false;

    // Render clean HUD-free WebGL frame
    this.renderer.render(this.scene, this.camera);

    const srcW = this.canvas.width;
    const srcH = this.canvas.height;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = srcW;
    outCanvas.height = srcH;
    const ctx = outCanvas.getContext('2d')!;

    ctx.drawImage(this.canvas, 0, 0, srcW, srcH);

    if (options.framed) {
      const pad = Math.round(Math.min(srcW, srcH) * 0.028);

      // Subtle bottom gradient vignette for crisp gold calligraphy legibility
      const grad = ctx.createLinearGradient(0, srcH * 0.72, 0, srcH);
      grad.addColorStop(0, 'rgba(20, 8, 6, 0)');
      grad.addColorStop(1, 'rgba(20, 8, 6, 0.86)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, srcH * 0.72, srcW, srcH * 0.28);

      // Ornate Golden Double Border
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = Math.max(3, Math.round(pad * 0.16));
      ctx.strokeRect(pad, pad, srcW - pad * 2, srcH - pad * 2);

      ctx.strokeStyle = 'rgba(251, 146, 60, 0.65)';
      ctx.lineWidth = Math.max(1.5, Math.round(pad * 0.07));
      ctx.strokeRect(pad * 1.45, pad * 1.45, srcW - pad * 2.9, srcH - pad * 2.9);

      // Festive Header Pill
      const titleSize = Math.max(18, Math.round(Math.min(srcW, srcH) * 0.036));
      const subSize = Math.max(12, Math.round(titleSize * 0.56));

      ctx.fillStyle = '#fde68a';
      ctx.font = `700 ${titleSize}px "Yatra One", Georgia, serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        options.ghatName.trim() || 'Pavitra Surya Chhath Ghat',
        pad * 2.2,
        srcH - pad * 2.7
      );

      ctx.fillStyle = '#fdba74';
      ctx.font = `600 ${subSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(
        'Jai Chhathi Maiya  ·  Chhath Ghat Studio',
        pad * 2.2,
        srcH - pad * 1.75
      );
    }

    // Restore hover guides
    this.hoverRing.visible = prevRing;
    if (this.ghostGroup) this.ghostGroup.visible = prevGhost;

    return outCanvas.toDataURL('image/png');
  }

  private raycastCellFromClient(clientX: number, clientY: number): { gx: number; gz: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const hits = this.raycaster.intersectObject(this.raycastPlane, false);
    if (hits.length === 0) return null;

    const pt = hits[0].point;
    const gx = this.worldToGrid(pt.x);
    const gz = this.worldToGrid(pt.z);
    if (gx < 0 || gx >= GRID_SIZE || gz < 0 || gz >= GRID_SIZE) return null;
    return { gx, gz };
  }

  private bindEvents(): void {
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.handleResize);
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private onPointerDown = (e: PointerEvent) => {
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.activePointers.size === 1) {
      this.isPointerDown = true;
      this.hasDragged = false;
      this.dragButton = e.button;
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
      this.lastDragPos = { x: e.clientX, y: e.clientY };

      if (this.interactionEnabled) {
        const hit = this.raycastCellFromClient(e.clientX, e.clientY);
        if (hit) {
          this.hoveredCell = hit;
          this.updateGhostPosition();
        }
      }
    } else if (this.activePointers.size >= 2) {
      // Multi-touch pinch/pan: cancel tap-to-place so pinching NEVER misplaces an item!
      this.hasDragged = true;
      const pts = Array.from(this.activePointers.values());
      this.lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      this.lastDragPos = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (this.activePointers.size >= 2) {
      const pts = Array.from(this.activePointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;

      if (this.lastPinchDist > 0) {
        const deltaPinch = this.lastPinchDist - dist;
        this.targetRadius = THREE.MathUtils.clamp(
          this.targetRadius + deltaPinch * 0.038,
          this.minRadius,
          this.maxRadius
        );
      }

      // Two-finger pan target across Ghat
      const panDx = midX - this.lastDragPos.x;
      const panDy = midY - this.lastDragPos.y;
      const forward = new THREE.Vector3(
        -Math.sin(this.theta),
        0,
        -Math.cos(this.theta)
      );
      const right = new THREE.Vector3(Math.cos(this.theta), 0, -Math.sin(this.theta));
      this.targetCamTarget.addScaledVector(right, -panDx * 0.015);
      this.targetCamTarget.addScaledVector(forward, panDy * 0.015);
      this.targetCamTarget.x = THREE.MathUtils.clamp(this.targetCamTarget.x, -4.5, 4.5);
      this.targetCamTarget.z = THREE.MathUtils.clamp(this.targetCamTarget.z, -4.5, 4.5);

      this.lastPinchDist = dist;
      this.lastDragPos = { x: midX, y: midY };
      return;
    }

    if (this.isPointerDown) {
      const totalMove = Math.hypot(
        e.clientX - this.pointerDownPos.x,
        e.clientY - this.pointerDownPos.y
      );
      if (totalMove > 7) {
        this.hasDragged = true;
      }

      if (this.hasDragged) {
        const dx = e.clientX - this.lastDragPos.x;
        const dy = e.clientY - this.lastDragPos.y;
        this.targetTheta -= dx * 0.0075;
        this.targetPhi = THREE.MathUtils.clamp(
          this.targetPhi - dy * 0.006,
          0.42,
          1.26
        );
        this.lastDragPos = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    // Hover update on desktop pointer move
    if (this.interactionEnabled && e.pointerType === 'mouse') {
      const hit = this.raycastCellFromClient(e.clientX, e.clientY);
      this.hoveredCell = hit;
      this.updateGhostPosition();
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const wasSingleTap =
      this.isPointerDown && !this.hasDragged && this.activePointers.size <= 1;

    this.activePointers.delete(e.pointerId);
    if (this.activePointers.size === 0) {
      this.isPointerDown = false;
      this.lastPinchDist = 0;
    }

    if (!wasSingleTap || !this.interactionEnabled) return;

    if (this.dragButton === 2) {
      // Right-click quick tap rotates item!
      this.onRightRotate?.();
      return;
    }

    if (this.dragButton === 0) {
      const hit = this.raycastCellFromClient(e.clientX, e.clientY);
      if (hit) {
        this.hoveredCell = hit;
        this.updateGhostPosition();
        const screen = this.projectCellToScreen(hit.gx, hit.gz);
        this.onTileTap?.({
          gx: hit.gx,
          gz: hit.gz,
          screenX: screen.x,
          screenY: screen.y,
        });
      }
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.targetRadius = THREE.MathUtils.clamp(
      this.targetRadius + e.deltaY * 0.011,
      this.minRadius,
      this.maxRadius
    );
  };

  public handleResize = (): void => {
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    const aspect = w / Math.max(1, h);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);

    this.maxRadius = aspect < 0.7 ? 31.0 : 26.0;
    if (!this.hasInitializedFraming) {
      const ideal = this.getIdealDefaultRadius(aspect);
      this.radius = ideal;
      this.targetRadius = ideal;
      this.hasInitializedFraming = true;
    }
  };

  private animate = (): void => {
    this.rafId = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    if (this.ambientFireflies) {
      this.ambientFireflies.rotation.y = elapsed * 0.045;
      this.ambientFireflies.position.y = Math.sin(elapsed * 0.8) * 0.18;
    }

    if (this.autoOrbit && !this.isPointerDown) {
      this.targetTheta += dt * 0.16;
    }

    // Smooth damped camera interpolation
    const damp = 1 - Math.exp(-10 * dt);
    this.theta += (this.targetTheta - this.theta) * damp;
    this.phi += (this.targetPhi - this.phi) * damp;
    this.radius += (this.targetRadius - this.radius) * damp;
    this.camTarget.lerp(this.targetCamTarget, damp);

    // Camera shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0.001) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity *= Math.exp(-14 * dt);
    } else {
      this.shakeIntensity = 0;
    }

    const sinPhi = Math.sin(this.phi);
    const camX = this.camTarget.x + this.radius * sinPhi * Math.sin(this.theta) + shakeX;
    const camY = this.camTarget.y + this.radius * Math.cos(this.phi) + shakeY;
    const camZ = this.camTarget.z + this.radius * sinPhi * Math.cos(this.theta);

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.camTarget);

    // Update sky & dynamic Chhath sunset lighting
    this.updateAtmosphere(elapsed);

    // Update overshoot spring bounce animations
    for (let i = this.springs.length - 1; i >= 0; i--) {
      const s = this.springs[i];
      s.elapsed += dt;
      const p = Math.min(1, s.elapsed / s.duration);
      // Elastic ease-out bounce
      const scale =
        p === 1
          ? 1
          : 1 - Math.pow(2, -9 * p) * Math.cos(p * Math.PI * 2.2);
      s.obj.scale.setScalar(Math.max(0.05, scale));
      if (p >= 1) {
        s.obj.scale.setScalar(1);
        this.springs.splice(i, 1);
      }
    }

    // Animate flickering Diya flames
    for (let i = 0; i < this.flameObjects.length; i++) {
      const f = this.flameObjects[i];
      if (f.userData.isFlame) {
        const ph = (f.userData.phase as number) || 0;
        const flick = 0.88 + Math.sin(elapsed * 13 + ph) * 0.16;
        f.scale.set(1, flick, 1);
      }
    }

    // Animate gently bobbing Floating Lotus & Diyas on pond water
    for (let i = 0; i < this.floatingObjects.length; i++) {
      const fl = this.floatingObjects[i];
      const ph = (fl.userData.phase as number) || 0;
      const baseY = (fl.userData.baseY as number) ?? -0.04;
      fl.position.y = baseY + Math.sin(elapsed * 2.4 + ph) * 0.022;
    }

    // Pulse hover ring gently
    if (this.hoverRing.visible) {
      const pulseScale = 1 + Math.sin(elapsed * 5.5) * 0.05;
      this.hoverRing.scale.setScalar(pulseScale);
    }

    // Update 3D particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life += dt;
      if (pt.life >= pt.maxLife) {
        this.fxGroup.remove(pt.mesh);
        (pt.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      pt.vel.y -= pt.gravity * dt;
      pt.mesh.position.addScaledVector(pt.vel, dt);
      pt.mesh.rotation.x += pt.rotVel.x * dt;
      pt.mesh.rotation.y += pt.rotVel.y * dt;
      const mat = pt.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - pt.life / pt.maxLife;
    }

    // Update expanding golden water ripples
    for (let i = this.waterRings.length - 1; i >= 0; i--) {
      const wr = this.waterRings[i];
      wr.life += dt;
      if (wr.life >= wr.maxLife) {
        this.fxGroup.remove(wr.mesh);
        wr.mesh.geometry.dispose();
        (wr.mesh.material as THREE.Material).dispose();
        this.waterRings.splice(i, 1);
        continue;
      }
      const prog = wr.life / wr.maxLife;
      wr.mesh.scale.setScalar(1 + prog * 2.6);
      (wr.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - prog) * 0.8;
    }

    this.renderer.render(this.scene, this.camera);
  };

  public destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
