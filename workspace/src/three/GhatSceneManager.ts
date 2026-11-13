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

/**
 * Soft radial sprite used for sun / moon bloom, stars, shore lamps and the
 * golden glitter path on the river.
 */
let glowTexture: THREE.Texture | null = null;
function getGlowTexture(): THREE.Texture {
  if (glowTexture) return glowTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.22, 'rgba(255,255,255,0.72)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}

function lerpHex(a: number, b: number, f: number): number {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * f);
  const g = Math.round(ag + (bg - ag) * f);
  const bl = Math.round(ab + (bb - ab) * f);
  return (r << 16) | (g << 8) | bl;
}

interface AtmosphereStop {
  t: number;
  skyTop: number;
  skyMid: number;
  skyHorizon: number;
  sunTint: number;
  sunIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  lightTint: number;
  lightIntensity: number;
  fogDensity: number;
  exposure: number;
  stars: number;
  moon: number;
  cloudTint: number;
  cloudOpacity: number;
  distant: number;
  waterTint: number;
  glitter: number;
}

/** Keyframed Chhath palette, from pre-dawn blue hour to a lamp-lit night. */
const ATMOSPHERE_STOPS: AtmosphereStop[] = [
  {
    t: 0.0,
    skyTop: 0x1a2748,
    skyMid: 0x5f5f92,
    skyHorizon: 0xf2a878,
    sunTint: 0xffd2a6,
    sunIntensity: 1.25,
    hemiSky: 0xbdd2f7,
    hemiGround: 0x4a3628,
    hemiIntensity: 0.72,
    lightTint: 0xffd7b0,
    lightIntensity: 1.35,
    fogDensity: 0.014,
    exposure: 1.06,
    stars: 0.42,
    moon: 0.1,
    cloudTint: 0xf7d3c2,
    cloudOpacity: 0.62,
    distant: 0x2c3a46,
    waterTint: 0x14556e,
    glitter: 0.35,
  },
  {
    t: 0.18,
    skyTop: 0x3d74b4,
    skyMid: 0xe9b083,
    skyHorizon: 0xffdcb0,
    sunTint: 0xfff1cf,
    sunIntensity: 2.55,
    hemiSky: 0xffe7cc,
    hemiGround: 0x6b432a,
    hemiIntensity: 1.18,
    lightTint: 0xffe0b8,
    lightIntensity: 2.45,
    fogDensity: 0.011,
    exposure: 1.16,
    stars: 0.05,
    moon: 0.0,
    cloudTint: 0xfff3e4,
    cloudOpacity: 0.85,
    distant: 0x3f5340,
    waterTint: 0x1c8ba3,
    glitter: 0.85,
  },
  {
    t: 0.52,
    skyTop: 0x274a7f,
    skyMid: 0xc9683c,
    skyHorizon: 0xffc06a,
    sunTint: 0xffce7d,
    sunIntensity: 2.1,
    hemiSky: 0xffd8ae,
    hemiGround: 0x5c2d16,
    hemiIntensity: 1.02,
    lightTint: 0xff9e54,
    lightIntensity: 2.05,
    fogDensity: 0.0125,
    exposure: 1.12,
    stars: 0.1,
    moon: 0.12,
    cloudTint: 0xffd3a8,
    cloudOpacity: 0.78,
    distant: 0x4a3a33,
    waterTint: 0x0e7490,
    glitter: 1.0,
  },
  {
    t: 0.72,
    skyTop: 0x1b1e42,
    skyMid: 0x83394f,
    skyHorizon: 0xef8a52,
    sunTint: 0xff9a52,
    sunIntensity: 1.5,
    hemiSky: 0xd2a3a8,
    hemiGround: 0x40222a,
    hemiIntensity: 0.7,
    lightTint: 0xff6f3a,
    lightIntensity: 1.15,
    fogDensity: 0.014,
    exposure: 1.04,
    stars: 0.55,
    moon: 0.55,
    cloudTint: 0xcf8b8b,
    cloudOpacity: 0.6,
    distant: 0x332534,
    waterTint: 0x14405c,
    glitter: 0.7,
  },
  {
    t: 0.94,
    skyTop: 0x05091c,
    skyMid: 0x111a3a,
    skyHorizon: 0x45315a,
    sunTint: 0x6d7bb0,
    sunIntensity: 0.55,
    hemiSky: 0x93a6d6,
    hemiGround: 0x1d1a24,
    hemiIntensity: 0.42,
    lightTint: 0x9fb2e8,
    lightIntensity: 0.55,
    fogDensity: 0.016,
    exposure: 0.98,
    stars: 1.0,
    moon: 1.0,
    cloudTint: 0x4a5478,
    cloudOpacity: 0.5,
    distant: 0x0b1120,
    waterTint: 0x0a2740,
    glitter: 0.22,
  },
];

export class GhatSceneManager {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Camera spherical coordinates
  private camTarget = new THREE.Vector3(0, 0.35, 0);
  private targetCamTarget = new THREE.Vector3(0, 0.35, 0);
  private theta = Math.PI * 0.22; // horizontal azimuth
  private targetTheta = Math.PI * 0.22;
  private phi = 1.24; // polar angle from vertical
  private targetPhi = 1.24;
  private radius = 15.5;
  private targetRadius = 15.5;
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
  private sunSpriteMat!: THREE.SpriteMaterial;
  private sunSprite!: THREE.Sprite;
  private moonOrbGroup!: THREE.Group;
  private moonCoreMat!: THREE.MeshBasicMaterial;
  private moonHaloMat!: THREE.MeshBasicMaterial;
  private moonSpriteMat!: THREE.SpriteMaterial;
  private moonSprite!: THREE.Sprite;
  private skyDome!: THREE.Mesh;
  private skyUniforms!: {
    topColor: { value: THREE.Color };
    midColor: { value: THREE.Color };
    horizonColor: { value: THREE.Color };
    sunColor: { value: THREE.Color };
    sunDirection: { value: THREE.Vector3 };
    sunGlow: { value: number };
    bandGlow: { value: number };
  };
  private starLayers: THREE.Points[] = [];
  private starMats: THREE.PointsMaterial[] = [];
  private cloudGroup!: THREE.Group;
  private cloudMat!: THREE.MeshStandardMaterial;
  private distantMat!: THREE.MeshBasicMaterial;
  private distantShoreMat!: THREE.MeshBasicMaterial;
  private shoreLightMat!: THREE.PointsMaterial;
  private riverMat!: THREE.MeshStandardMaterial;
  private sunGlitterMat!: THREE.MeshBasicMaterial;
  private sunGlitter!: THREE.Mesh;
  private moonGlitterMat!: THREE.MeshBasicMaterial;
  private moonGlitter!: THREE.Mesh;
  private fireflyMat!: THREE.PointsMaterial;
  private ritualProgress = 0.52;
  private targetRitualProgress = 0.52;
  private hasAtmosphereInit = false;

  // Cached scratch objects to keep the render loop allocation-free
  private scratchColorA = new THREE.Color();
  private scratchColorB = new THREE.Color();
  private scratchColorC = new THREE.Color();
  private scratchColorD = new THREE.Color();
  private sunPosition = new THREE.Vector3(-38, 18, -62);
  private moonPosition = new THREE.Vector3(30, -6, -56);

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
    this.scene.background = new THREE.Color(0x274a7f);
    this.scene.fog = new THREE.FogExp2(0x274a7f, 0.0125);

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.5, 320);

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
    this.setupBackdrop();
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
    this.sunLight.position.set(-16, 20, -18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 48;
    const d = 9.5;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    this.warmPointLight = new THREE.PointLight(0xff8c00, 0.9, 24, 1.3);
    this.warmPointLight.position.set(0, 2.4, 0.5);
    this.scene.add(this.warmPointLight);

    // Soft additive bloom shared by the sun, moon, stars and river glitter
    const glow = getGlowTexture();

    // --- Sun disc ---
    this.sunOrbGroup = new THREE.Group();
    this.sunCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff7d6 });
    const sunCore = new THREE.Mesh(new THREE.SphereGeometry(2.7, 30, 24), this.sunCoreMat);
    this.sunOrbGroup.add(sunCore);

    this.sunHaloMat = new THREE.MeshBasicMaterial({
      color: 0xff9a4d,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const sunHalo = new THREE.Mesh(new THREE.SphereGeometry(4.4, 28, 24), this.sunHaloMat);
    this.sunOrbGroup.add(sunHalo);

    this.sunGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffc14d,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(6.6, 24, 20), this.sunGlowMat);
    this.sunOrbGroup.add(sunGlow);

    this.sunSpriteMat = new THREE.SpriteMaterial({
      map: glow,
      color: 0xffcf86,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    this.sunSprite = new THREE.Sprite(this.sunSpriteMat);
    this.sunSprite.scale.set(34, 34, 1);
    this.sunOrbGroup.add(this.sunSprite);

    this.sunOrbGroup.position.copy(this.sunPosition);
    this.scene.add(this.sunOrbGroup);

    // --- Moon with a couple of soft maria ---
    this.moonOrbGroup = new THREE.Group();
    this.moonCoreMat = new THREE.MeshBasicMaterial({ color: 0xf6f8ff });
    const moonCore = new THREE.Mesh(new THREE.SphereGeometry(2.4, 26, 20), this.moonCoreMat);
    this.moonOrbGroup.add(moonCore);

    const mareMat = new THREE.MeshBasicMaterial({
      color: 0xd7ddf2,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const mareSpecs: Array<[number, number, number]> = [
      [0.7, 0.55, 0.62],
      [-0.85, -0.25, 0.44],
      [0.1, -0.95, 0.34],
    ];
    for (const [mx, my, mr] of mareSpecs) {
      const mare = new THREE.Mesh(new THREE.CircleGeometry(mr, 16), mareMat);
      mare.position.set(mx, my, 2.28);
      this.moonOrbGroup.add(mare);
    }

    this.moonHaloMat = new THREE.MeshBasicMaterial({
      color: 0xbcd0ff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    this.moonOrbGroup.add(new THREE.Mesh(new THREE.SphereGeometry(3.7, 24, 20), this.moonHaloMat));

    this.moonSpriteMat = new THREE.SpriteMaterial({
      map: glow,
      color: 0xa9c4ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    this.moonSprite = new THREE.Sprite(this.moonSpriteMat);
    this.moonSprite.scale.set(24, 24, 1);
    this.moonOrbGroup.add(this.moonSprite);

    this.moonOrbGroup.position.copy(this.moonPosition);
    this.scene.add(this.moonOrbGroup);
  }

  /** Gradient sky dome, stars, clouds, river and the far Chhath ghat skyline. */
  private setupBackdrop(): void {
    this.setupSkyDome();
    this.setupStars();
    this.setupCloudBanks();
    this.setupRiver();
    this.setupDistantShore();
    this.setupFireflies();
  }

  private setupSkyDome(): void {
    this.skyUniforms = {
      topColor: { value: new THREE.Color(0x274a7f) },
      midColor: { value: new THREE.Color(0xc9683c) },
      horizonColor: { value: new THREE.Color(0xffc06a) },
      sunColor: { value: new THREE.Color(0xffce7d) },
      sunDirection: { value: this.sunPosition.clone().normalize() },
      sunGlow: { value: 0.85 },
      bandGlow: { value: 0.5 },
    };

    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vWorldDir;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldDir = normalize(worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        uniform vec3 sunColor;
        uniform vec3 sunDirection;
        uniform float sunGlow;
        uniform float bandGlow;
        varying vec3 vWorldDir;

        void main() {
          float h = vWorldDir.y;
          vec3 col = mix(horizonColor, midColor, smoothstep(-0.04, 0.3, h));
          col = mix(col, topColor, smoothstep(0.14, 0.92, h));

          float d = max(dot(normalize(vWorldDir), normalize(sunDirection)), 0.0);
          col += sunColor * (pow(d, 5.0) * 0.3 + pow(d, 70.0) * 0.55) * sunGlow;

          float haze = exp(-max(h, 0.0) * 8.0) * bandGlow;
          col = mix(col, horizonColor, haze * 0.55);

          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });

    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(150, 40, 24), skyMat);
    this.skyDome.renderOrder = -10;
    this.skyDome.frustumCulled = false;
    this.scene.add(this.skyDome);
  }

  private setupStars(): void {
    const glow = getGlowTexture();
    const layerSpecs = [
      { count: 260, size: 2.2, weight: 1.0 },
      { count: 140, size: 3.6, weight: 0.85 },
      { count: 55, size: 6.0, weight: 0.7 },
    ];

    for (const spec of layerSpecs) {
      const positions = new Float32Array(spec.count * 3);
      for (let i = 0; i < spec.count; i++) {
        const y = 0.06 + Math.random() * 0.94;
        const ang = Math.random() * Math.PI * 2;
        const ring = Math.sqrt(Math.max(0, 1 - y * y));
        const radius = 128 + Math.random() * 8;
        positions[i * 3] = Math.cos(ang) * ring * radius;
        positions[i * 3 + 1] = y * radius;
        positions[i * 3 + 2] = Math.sin(ang) * ring * radius;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        map: glow,
        color: 0xeef3ff,
        size: spec.size,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      });
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      points.renderOrder = -5;
      this.scene.add(points);
      this.starLayers.push(points);
      this.starMats.push(mat);
    }
  }

  private setupCloudBanks(): void {
    this.cloudGroup = new THREE.Group();
    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xffd3a8),
      emissiveIntensity: 0.4,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      fog: false,
    });

    const puffGeo = new THREE.SphereGeometry(1, 12, 9);
    const clusterCount = 11;
    for (let i = 0; i < clusterCount; i++) {
      const ang = (i / clusterCount) * Math.PI * 2 + Math.random() * 0.22;
      const rad = 48 + Math.random() * 26;
      const baseY = 8 + Math.random() * 13;

      const cluster = new THREE.Group();
      cluster.position.set(Math.cos(ang) * rad, baseY, Math.sin(ang) * rad);

      const puffCount = 4 + Math.floor(Math.random() * 3);
      for (let p = 0; p < puffCount; p++) {
        const puff = new THREE.Mesh(puffGeo, this.cloudMat);
        const sx = 3.6 + Math.random() * 4.6;
        const sy = 1.1 + Math.random() * 1.7;
        const sz = 2.2 + Math.random() * 2.8;
        puff.scale.set(sx, sy, sz);
        puff.position.set(
          (Math.random() - 0.5) * sx * 1.7,
          (Math.random() - 0.5) * sy * 0.8,
          (Math.random() - 0.5) * sz * 1.2
        );
        cluster.add(puff);
      }
      cluster.rotation.y = Math.random() * Math.PI;
      this.cloudGroup.add(cluster);
    }
    this.scene.add(this.cloudGroup);
  }

  private setupRiver(): void {
    this.riverMat = new THREE.MeshStandardMaterial({
      color: 0x0e7490,
      roughness: 0.2,
      metalness: 0.5,
    });
    const river = new THREE.Mesh(new THREE.CircleGeometry(142, 72), this.riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.y = -0.74;
    this.scene.add(river);

    const glow = getGlowTexture();

    this.sunGlitterMat = new THREE.MeshBasicMaterial({
      map: glow,
      color: 0xffc46a,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const sunPath = new THREE.PlaneGeometry(15, 96);
    sunPath.rotateX(-Math.PI / 2);
    this.sunGlitter = new THREE.Mesh(sunPath, this.sunGlitterMat);
    this.sunGlitter.position.set(-26, -0.72, -46);
    this.sunGlitter.rotation.y = Math.atan2(this.sunPosition.x, this.sunPosition.z);
    this.scene.add(this.sunGlitter);

    this.moonGlitterMat = new THREE.MeshBasicMaterial({
      map: glow,
      color: 0xa9c4ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const moonPath = new THREE.PlaneGeometry(11, 74);
    moonPath.rotateX(-Math.PI / 2);
    this.moonGlitter = new THREE.Mesh(moonPath, this.moonGlitterMat);
    this.moonGlitter.position.set(26, -0.72, -44);
    this.moonGlitter.rotation.y = Math.atan2(this.moonPosition.x, this.moonPosition.z);
    this.scene.add(this.moonGlitter);
  }

  private setupDistantShore(): void {
    this.distantShoreMat = new THREE.MeshBasicMaterial({ color: 0x4a3a33 });
    this.distantMat = new THREE.MeshBasicMaterial({ color: 0x3c4a3c });

    // Far bank that the river meets on the horizon
    const bank = new THREE.Mesh(
      new THREE.CylinderGeometry(38.5, 42, 3.6, 72, 1, true),
      this.distantShoreMat
    );
    bank.position.y = -2.35;
    this.scene.add(bank);

    const stepBand = new THREE.Mesh(
      new THREE.CylinderGeometry(37.6, 38.3, 0.7, 72, 1, true),
      this.distantShoreMat
    );
    stepBand.position.y = -0.62;
    this.scene.add(stepBand);

    // Cheap instanced tree line around the whole horizon
    const treeCount = 84;
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.24, 1, 5);
    const canopyGeo = new THREE.SphereGeometry(1, 7, 6);
    const trunks = new THREE.InstancedMesh(trunkGeo, this.distantMat, treeCount);
    const canopies = new THREE.InstancedMesh(canopyGeo, this.distantMat, treeCount * 2);
    const dummy = new THREE.Object3D();
    let canopyIdx = 0;

    for (let i = 0; i < treeCount; i++) {
      const ang = (i / treeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.14;
      const rad = 40 + Math.random() * 12;
      const baseY = -0.45 + Math.random() * 0.4;
      const height = 2.6 + Math.random() * 4.8;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;

      dummy.position.set(x, baseY + height / 2, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(1 + Math.random() * 0.7, height, 1 + Math.random() * 0.7);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);

      const crown = 1.3 + Math.random() * 1.6;
      dummy.position.set(x, baseY + height + crown * 0.3, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(crown, crown * 0.88, crown);
      dummy.updateMatrix();
      canopies.setMatrixAt(canopyIdx, dummy.matrix);
      canopyIdx += 1;

      const sub = crown * 0.62;
      dummy.position.set(
        x + (Math.random() - 0.5) * crown * 1.3,
        baseY + height + crown * 0.85,
        z + (Math.random() - 0.5) * crown * 1.3
      );
      dummy.scale.set(sub, sub * 0.82, sub);
      dummy.updateMatrix();
      canopies.setMatrixAt(canopyIdx, dummy.matrix);
      canopyIdx += 1;
    }
    trunks.instanceMatrix.needsUpdate = true;
    canopies.instanceMatrix.needsUpdate = true;
    trunks.frustumCulled = false;
    canopies.frustumCulled = false;
    this.scene.add(trunks, canopies);

    // Small temples and gate pavilions dotting the far ghat
    const shrineAngles = [0.4, 0.95, 1.55, 2.25, 2.95, 3.7, 4.45, 5.15, 5.8];
    shrineAngles.forEach((ang, idx) => {
      const rad = 36 + ((idx * 7) % 5);
      const shrine = new THREE.Group();
      shrine.position.set(Math.cos(ang) * rad, -0.55, Math.sin(ang) * rad);
      shrine.rotation.y = -ang;

      const base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.3, 3.2), this.distantMat);
      base.position.y = 0.65;
      shrine.add(base);

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 2.1), this.distantMat);
      body.position.y = 2.5;
      shrine.add(body);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 9), this.distantMat);
      dome.scale.set(1, 1.15, 1);
      dome.position.y = 4.15;
      shrine.add(dome);

      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.7, 8), this.distantMat);
      spire.position.y = 5.6;
      shrine.add(spire);

      for (const sx of [-1, 1]) {
        const pavilion = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 1.6, 0.9),
          this.distantMat
        );
        pavilion.position.set(sx * 2.7, 0.8, 0.4);
        shrine.add(pavilion);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.95, 4), this.distantMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.set(sx * 2.7, 2.05, 0.4);
        shrine.add(roof);
      }

      this.scene.add(shrine);
    });

    // Warm lamps along the distant ghat, only glowing once evening falls
    const lampCount = 96;
    const lampPositions = new Float32Array(lampCount * 3);
    for (let i = 0; i < lampCount; i++) {
      const ang = (i / lampCount) * Math.PI * 2 + Math.random() * 0.04;
      const rad = 36.4 + Math.random() * 1.6;
      lampPositions[i * 3] = Math.cos(ang) * rad;
      lampPositions[i * 3 + 1] = -0.25 + Math.random() * 1.8;
      lampPositions[i * 3 + 2] = Math.sin(ang) * rad;
    }
    const lampGeo = new THREE.BufferGeometry();
    lampGeo.setAttribute('position', new THREE.BufferAttribute(lampPositions, 3));
    this.shoreLightMat = new THREE.PointsMaterial({
      map: getGlowTexture(),
      color: 0xffb765,
      size: 5.5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    const lamps = new THREE.Points(lampGeo, this.shoreLightMat);
    lamps.frustumCulled = false;
    this.scene.add(lamps);
  }

  private setupFireflies(): void {
    const moteCount = 84;
    const positions = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 17;
      positions[i * 3 + 1] = 0.35 + Math.random() * 5.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 17;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.fireflyMat = new THREE.PointsMaterial({
      map: getGlowTexture(),
      color: 0xffe9a3,
      size: 5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    this.ambientFireflies = new THREE.Points(moteGeo, this.fireflyMat);
    this.ambientFireflies.frustumCulled = false;
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

    // A warm stone apron just below the ghat rim, catching the low sun
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(GRID_SIZE + 1.8, 0.36, GRID_SIZE + 1.8),
      new THREE.MeshStandardMaterial({ color: 0x74401f, roughness: 0.9 })
    );
    apron.position.y = -0.5;
    apron.receiveShadow = true;
    this.rootGroup.add(apron);

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
    const presetProgress =
      preset === 'twilight' ? 0.94 : preset === 'dawn' ? 0.18 : 0.52;
    const target = Number.isFinite(progress01) ? progress01 : presetProgress;
    this.targetRitualProgress = THREE.MathUtils.clamp(target, 0, 1);
    if (!this.hasAtmosphereInit) {
      this.ritualProgress = this.targetRitualProgress;
      this.hasAtmosphereInit = true;
    }
  }

  /** Blends the keyframed Chhath palette for the current time of day. */
  private sampleAtmosphere(t: number): AtmosphereStop {
    if (t <= ATMOSPHERE_STOPS[0].t) return { ...ATMOSPHERE_STOPS[0] };
    for (let i = 1; i < ATMOSPHERE_STOPS.length; i++) {
      const b = ATMOSPHERE_STOPS[i];
      if (t <= b.t) {
        const a = ATMOSPHERE_STOPS[i - 1];
        const f = THREE.MathUtils.smoothstep((t - a.t) / (b.t - a.t), 0, 1);
        return {
          t,
          skyTop: lerpHex(a.skyTop, b.skyTop, f),
          skyMid: lerpHex(a.skyMid, b.skyMid, f),
          skyHorizon: lerpHex(a.skyHorizon, b.skyHorizon, f),
          sunTint: lerpHex(a.sunTint, b.sunTint, f),
          sunIntensity: THREE.MathUtils.lerp(a.sunIntensity, b.sunIntensity, f),
          hemiSky: lerpHex(a.hemiSky, b.hemiSky, f),
          hemiGround: lerpHex(a.hemiGround, b.hemiGround, f),
          hemiIntensity: THREE.MathUtils.lerp(a.hemiIntensity, b.hemiIntensity, f),
          lightTint: lerpHex(a.lightTint, b.lightTint, f),
          lightIntensity: THREE.MathUtils.lerp(a.lightIntensity, b.lightIntensity, f),
          fogDensity: THREE.MathUtils.lerp(a.fogDensity, b.fogDensity, f),
          exposure: THREE.MathUtils.lerp(a.exposure, b.exposure, f),
          stars: THREE.MathUtils.lerp(a.stars, b.stars, f),
          moon: THREE.MathUtils.lerp(a.moon, b.moon, f),
          cloudTint: lerpHex(a.cloudTint, b.cloudTint, f),
          cloudOpacity: THREE.MathUtils.lerp(a.cloudOpacity, b.cloudOpacity, f),
          distant: lerpHex(a.distant, b.distant, f),
          waterTint: lerpHex(a.waterTint, b.waterTint, f),
          glitter: THREE.MathUtils.lerp(a.glitter, b.glitter, f),
        };
      }
    }
    return { ...ATMOSPHERE_STOPS[ATMOSPHERE_STOPS.length - 1] };
  }

  private updateAtmosphere(timeSec: number, dt: number): void {
    // Smoothly ease between day / sunset / night so the switch feels alive
    const ease = 1 - Math.exp(-2.4 * dt);
    this.ritualProgress += (this.targetRitualProgress - this.ritualProgress) * ease;
    const t = this.ritualProgress;
    const s = this.sampleAtmosphere(t);

    const topColor = this.scratchColorA.setHex(s.skyTop);
    const midColor = this.scratchColorB.setHex(s.skyMid);
    const horizonColor = this.scratchColorC.setHex(s.skyHorizon);

    this.skyUniforms.topColor.value.copy(topColor);
    this.skyUniforms.midColor.value.copy(midColor);
    this.skyUniforms.horizonColor.value.copy(horizonColor);
    this.skyUniforms.sunColor.value.setHex(s.sunTint);
    this.skyUniforms.bandGlow.value = 0.42 + Math.sin(t * Math.PI) * 0.35;

    // --- Sun arc across the river ---
    const sunAlt = 22 * Math.cos((t - 0.35) * Math.PI * 1.75) - 4;
    this.sunPosition.set(-38, sunAlt, -62);
    this.sunOrbGroup.position.copy(this.sunPosition);
    this.skyUniforms.sunDirection.value.copy(this.sunPosition).normalize();

    const sunUp = THREE.MathUtils.smoothstep(sunAlt, -7, 4);
    this.sunOrbGroup.visible = sunUp > 0.01;
    const pulse = 1 + Math.sin(timeSec * 1.4) * 0.018;
    this.sunOrbGroup.scale.setScalar(pulse);
    this.sunCoreMat.color.setHex(s.sunTint);
    this.sunHaloMat.color.setHex(s.sunTint);
    this.sunHaloMat.opacity = THREE.MathUtils.lerp(0.18, 0.46, sunUp);
    this.sunGlowMat.color.setHex(s.sunTint);
    this.sunGlowMat.opacity = THREE.MathUtils.lerp(0.08, 0.24, sunUp);
    this.sunSpriteMat.color.setHex(s.sunTint);
    this.sunSpriteMat.opacity = 0.9 * sunUp;
    this.skyUniforms.sunGlow.value = 1.25 * sunUp;

    // --- Moon rises as the lamps are lit ---
    const moonRise = THREE.MathUtils.smoothstep(t, 0.5, 0.95);
    const moonAlt = THREE.MathUtils.lerp(-14, 27, moonRise);
    this.moonPosition.set(30, moonAlt, -50);
    this.moonOrbGroup.position.copy(this.moonPosition);
    const moonUp = THREE.MathUtils.smoothstep(moonAlt, -6, 4) * s.moon;
    this.moonOrbGroup.visible = moonUp > 0.02;
    this.moonHaloMat.opacity = 0.2 * moonUp;
    this.moonSpriteMat.opacity = 0.62 * moonUp;
    this.moonGlitterMat.opacity = 0.5 * moonUp;
    this.moonGlitter.visible = moonUp > 0.02;

    // --- Lights ---
    this.hemiLight.color.setHex(s.hemiSky);
    this.hemiLight.groundColor.setHex(s.hemiGround);
    this.hemiLight.intensity = s.hemiIntensity;
    this.sunLight.color.setHex(s.lightTint);
    this.sunLight.intensity = s.lightIntensity * THREE.MathUtils.lerp(0.4, 1, sunUp);
    this.sunLight.position.set(-16, Math.max(7, sunAlt * 0.85 + 9), -18);
    this.warmPointLight.intensity = THREE.MathUtils.lerp(
      0.35,
      2.5,
      THREE.MathUtils.smoothstep(t, 0.3, 0.86)
    );

    // --- Sky, fog, exposure ---
    const horizonGlow = this.scratchColorD.copy(horizonColor).lerp(midColor, 0.3);
    (this.scene.background as THREE.Color).copy(horizonGlow);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(horizonGlow);
      this.scene.fog.density = s.fogDensity;
    }
    this.renderer.toneMappingExposure = s.exposure;

    // --- Stars twinkle in once the sun is gone ---
    for (let i = 0; i < this.starMats.length; i++) {
      const layerWeight = i === 0 ? 1 : i === 1 ? 0.82 : 0.62;
      const twinkle = 0.8 + Math.sin(timeSec * (1.1 + i * 0.6) + i * 2.1) * 0.2;
      this.starMats[i].opacity = Math.min(
        1,
        s.stars * layerWeight * twinkle
      );
    }
    for (const star of this.starLayers) {
      star.rotation.y = timeSec * 0.008;
    }

    // --- Clouds drift and pick up the sky tint ---
    if (this.cloudGroup) {
      this.cloudGroup.position.x = Math.sin(timeSec * 0.02) * 2.4;
      this.cloudGroup.position.y = Math.sin(timeSec * 0.045) * 0.25;
      this.cloudMat.color.setHex(s.cloudTint);
      this.cloudMat.emissive.setHex(s.cloudTint);
      this.cloudMat.opacity = s.cloudOpacity;
      this.cloudMat.emissiveIntensity = THREE.MathUtils.lerp(0.25, 0.7, s.stars);
    }

    // --- Distant ghat silhouettes and their lamps ---
    this.distantMat.color.setHex(s.distant);
    this.distantShoreMat.color.setHex(lerpHex(s.distant, s.skyHorizon, 0.16));
    this.shoreLightMat.opacity = 0.9 * THREE.MathUtils.smoothstep(t, 0.55, 0.9);
    this.shoreLightMat.color.setHex(lerpHex(0xffb765, 0xffd9a0, s.stars));

    // --- Water ---
    this.riverMat.color.setHex(s.waterTint);
    this.waterSharedMat.emissiveIntensity = THREE.MathUtils.lerp(0.26, 0.66, t);
    this.waterSharedMat.opacity = 0.82 + Math.sin(timeSec * 0.7) * 0.04;
    this.waterSharedMat.color.setHex(
      lerpHex(0x0e8aaa, 0x0b3350, THREE.MathUtils.smoothstep(t, 0.45, 0.95))
    );
    this.sunGlitterMat.opacity = 0.72 * s.glitter * sunUp;

    // --- Fireflies & motes ---
    this.fireflyMat.opacity = THREE.MathUtils.lerp(
      0.1,
      0.85,
      THREE.MathUtils.smoothstep(t, 0.25, 0.8)
    );
    this.fireflyMat.color.setHex(lerpHex(0xffe9a3, 0xffd27a, s.stars));
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
    if (aspect < 0.65) return 23.0; // Tall mobile portrait
    if (aspect < 1.0) return 19.0; // Tablet / square portrait
    return 15.5; // Desktop / landscape
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
    this.targetCamTarget.set(0, 0.35, 0);
    this.targetTheta = Math.PI * 0.22;
    this.targetPhi = 1.24;
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
          0.4,
          1.46
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
    this.updateAtmosphere(elapsed, dt);

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
