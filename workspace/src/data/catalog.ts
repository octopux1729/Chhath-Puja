import {
  BuildingCategory,
  BuildingItemDef,
  BuildingItemId,
  GRID_SIZE,
  GridCellData,
} from '../types/game';

export interface CategoryTab {
  id: BuildingCategory;
  label: string;
  icon: 'waves' | 'tent' | 'flower' | 'trees' | 'flame';
}

export const CATEGORY_TABS: CategoryTab[] = [
  { id: 'water_ghat', label: 'Pond & Platforms', icon: 'waves' },
  { id: 'pandal', label: 'Pandal & Gates', icon: 'tent' },
  { id: 'flowers', label: 'Flowers & Diyas', icon: 'flower' },
  { id: 'trees', label: 'Sacred Trees', icon: 'trees' },
  { id: 'ritual', label: 'Arghya & Altars', icon: 'flame' },
];

export const BUILDING_ITEMS: Record<BuildingItemId, BuildingItemDef> = {
  pond_tile: {
    id: 'pond_tile',
    name: 'Sacred Pond',
    hindiName: 'छठ पोखर',
    category: 'water_ghat',
    layer: 'terrain_water',
    shortDesc: 'Carves shimmering sacred water for Arghya.',
    accentColor: '#0ea5e9',
    iconEmoji: '🌊',
  },
  pond_platform: {
    id: 'pond_platform',
    name: 'Platform on Pond',
    hindiName: 'जल मंच',
    category: 'water_ghat',
    layer: 'base_platform',
    shortDesc: 'Elevated teak & brass deck built over pond water.',
    accentColor: '#f59e0b',
    iconEmoji: '🌉',
    requiresWater: true,
    autoCarvesWater: true,
  },
  ghat_steps: {
    id: 'ghat_steps',
    name: 'Sandstone Ghat Steps',
    hindiName: 'सीढ़ी घाट',
    category: 'water_ghat',
    layer: 'base_platform',
    shortDesc: 'Chunar sandstone stepped terrace along the water.',
    accentColor: '#ea580c',
    iconEmoji: '🪜',
    canSitOnLand: true,
  },
  grand_pandal: {
    id: 'grand_pandal',
    name: 'Saffron Chhath Pandal',
    hindiName: 'भव्य पंडाल',
    category: 'pandal',
    layer: 'prop',
    shortDesc: 'Festive crimson & saffron canopy with warm string lights.',
    accentColor: '#ef4444',
    iconEmoji: '🎪',
    canSitOnLand: true,
    canSitOnPlatform: true,
  },
  bamboo_gate: {
    id: 'bamboo_gate',
    name: 'Swagat Pandal Gate',
    hindiName: 'स्वागत द्वार',
    category: 'pandal',
    layer: 'prop',
    shortDesc: 'Ceremonial bamboo & marigold arch with Sun crest.',
    accentColor: '#f97316',
    iconEmoji: '⛩️',
    canSitOnLand: true,
    canSitOnPlatform: true,
  },
  marigold_arch: {
    id: 'marigold_arch',
    name: 'Marigold Garland Toran',
    hindiName: 'गेंदा तोरण',
    category: 'flowers',
    layer: 'prop',
    shortDesc: 'Vibrant orange & yellow marigold strings on poles.',
    accentColor: '#fbbf24',
    iconEmoji: '🌼',
    canSitOnLand: true,
    canSitOnPlatform: true,
  },
  flower_rangoli: {
    id: 'flower_rangoli',
    name: 'Pushpa Rangoli Mat',
    hindiName: 'पुष्प रंगोली',
    category: 'flowers',
    layer: 'prop',
    shortDesc: 'Intricate petal mandala with a centerpiece brass diya.',
    accentColor: '#ec4899',
    iconEmoji: '🌸',
    canSitOnLand: true,
    canSitOnPlatform: true,
  },
  floating_lotus_diya: {
    id: 'floating_lotus_diya',
    name: 'Floating Lotus & Diyas',
    hindiName: 'दीप दान',
    category: 'flowers',
    layer: 'prop',
    shortDesc: 'Glowing earthen lamps and pink lotuses drifting on the pond.',
    accentColor: '#fb923c',
    iconEmoji: '🪷',
    requiresWater: true,
    autoCarvesWater: true,
  },
  banana_tree: {
    id: 'banana_tree',
    name: 'Sacred Banana Tree',
    hindiName: 'केला वृक्ष',
    category: 'trees',
    layer: 'prop',
    shortDesc: 'Auspicious banana plant with fruit cluster and marigold base.',
    accentColor: '#22c55e',
    iconEmoji: '🌴',
    canSitOnLand: true,
    canSitOnPlatform: true,
  },
  sugarcane: {
    id: 'sugarcane',
    name: 'Sugarcane Mandap',
    hindiName: 'ईख मंडप',
    category: 'trees',
    layer: 'prop',
    shortDesc: 'Five green sugarcanes tied into a sacred arch over lamps.',
    accentColor: '#84cc16',
    iconEmoji: '🎋',
    canSitOnLand: true,
    canSitOnPlatform: true,
  },
  mango_tree: {
    id: 'mango_tree',
    name: 'Festive Mango Tree',
    hindiName: 'आम्र वृक्ष',
    category: 'trees',
    layer: 'prop',
    shortDesc: 'Lush canopy tree draped with ceremonial leaf festoons.',
    accentColor: '#16a34a',
    iconEmoji: '🌳',
    canSitOnLand: true,
  },
  arghya_daura: {
    id: 'arghya_daura',
    name: 'Soop & Daura Offerings',
    hindiName: 'सूप व दउरा',
    category: 'ritual',
    layer: 'prop',
    shortDesc: 'Bamboo trays filled with Thekua, coconut, fruits and diya.',
    accentColor: '#eab308',
    iconEmoji: '🧺',
    canSitOnLand: true,
    canSitOnPlatform: true,
  },
  shirsoopta: {
    id: 'shirsoopta',
    name: 'Shirsoopta Clay Vedi',
    hindiName: 'सिरसोप्ता वेदी',
    category: 'ritual',
    layer: 'prop',
    shortDesc: 'Sacred terraced mud Chhath altar with Aipan art and flame.',
    accentColor: '#d97706',
    iconEmoji: '🔥',
    canSitOnLand: true,
    canSitOnPlatform: true,
  },
  deep_stambh: {
    id: 'deep_stambh',
    name: 'Brass Deep Stambh',
    hindiName: 'दीप स्तम्भ',
    category: 'ritual',
    layer: 'prop',
    shortDesc: 'Tall multi-tiered brass lamp tower blazing with golden fire.',
    accentColor: '#facc15',
    iconEmoji: '🪔',
    canSitOnLand: true,
    canSitOnPlatform: true,
  },
  kosi: {
    id: 'kosi',
    name: 'Kosi Elephant Clay Pot',
    hindiName: 'कोसी हाथी घड़ा',
    category: 'ritual',
    layer: 'prop',
    shortDesc: 'Hand-painted terracotta elephant pot filled with sacred water.',
    accentColor: '#c2410c',
    iconEmoji: '🐘',
    canSitOnLand: true,
    canSitOnPlatform: true,
  },
  bulldoze: {
    id: 'bulldoze',
    name: 'Clear Tile',
    hindiName: 'हटाएं',
    category: 'tool',
    layer: 'remove',
    shortDesc: 'Removes the top decoration, platform, or refills pond to land.',
    accentColor: '#f43f5e',
    iconEmoji: '🧹',
  },
};

export const HOW_TO_PLAY_ITEMS: BuildingItemDef[] = Object.values(BUILDING_ITEMS).filter(
  (item) => item.category !== 'tool'
);

export function getItemsByCategory(cat: BuildingCategory): BuildingItemDef[] {
  return Object.values(BUILDING_ITEMS).filter((item) => item.category === cat);
}

export function createEmptyGrid(): GridCellData[][] {
  const grid: GridCellData[][] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    const row: GridCellData[] = [];
    for (let z = 0; z < GRID_SIZE; z++) {
      row.push({
        x,
        z,
        terrain: 'land',
        base: null,
        prop: null,
      });
    }
    grid.push(row);
  }
  return grid;
}

let uidCounter = 1;
export function makeInstanceId(prefix = 'inst'): string {
  uidCounter += 1;
  return `${prefix}_${Date.now()}_${uidCounter}`;
}

export function createStarterPlayableGrid(): GridCellData[][] {
  const grid = createEmptyGrid();
  const pondCoords = [
    [4, 5], [5, 5], [6, 5], [7, 5],
    [4, 6], [5, 6], [6, 6], [7, 6],
    [5, 7], [6, 7],
  ];
  for (const [x, z] of pondCoords) {
    grid[x][z].terrain = 'pond';
  }

  grid[5][4].base = { id: makeInstanceId('init'), itemId: 'ghat_steps', rotation: 0, placedAt: 0 };
  grid[6][4].base = { id: makeInstanceId('init'), itemId: 'ghat_steps', rotation: 0, placedAt: 0 };
  grid[5][6].prop = { id: makeInstanceId('init'), itemId: 'floating_lotus_diya', rotation: 0, placedAt: 0 };

  return grid;
}

export function createShowcaseGrid(): GridCellData[][] {
  const grid = createEmptyGrid();

  for (let x = 3; x <= 8; x++) {
    for (let z = 5; z <= 9; z++) {
      if ((x === 3 || x === 8) && z === 9) continue;
      grid[x][z].terrain = 'pond';
    }
  }

  for (let x = 3; x <= 8; x++) {
    grid[x][4].base = { id: makeInstanceId('sc'), itemId: 'ghat_steps', rotation: 0, placedAt: 0 };
  }
  for (let z = 5; z <= 8; z++) {
    grid[2][z].base = { id: makeInstanceId('sc'), itemId: 'ghat_steps', rotation: 1, placedAt: 0 };
    grid[9][z].base = { id: makeInstanceId('sc'), itemId: 'ghat_steps', rotation: 3, placedAt: 0 };
  }

  const pondPlatforms = [
    [5, 6],
    [6, 6],
    [4, 7],
    [7, 7],
  ];
  for (const [px, pz] of pondPlatforms) {
    grid[px][pz].base = { id: makeInstanceId('sc'), itemId: 'pond_platform', rotation: 0, placedAt: 0 };
  }

  grid[5][6].prop = { id: makeInstanceId('sc'), itemId: 'arghya_daura', rotation: 0, placedAt: 0 };
  grid[6][6].prop = { id: makeInstanceId('sc'), itemId: 'kosi', rotation: 0, placedAt: 0 };
  grid[4][7].prop = { id: makeInstanceId('sc'), itemId: 'deep_stambh', rotation: 0, placedAt: 0 };
  grid[7][7].prop = { id: makeInstanceId('sc'), itemId: 'sugarcane', rotation: 0, placedAt: 0 };

  const floatingCoords = [
    [3, 6], [8, 6], [5, 8], [6, 8], [4, 9], [7, 9],
  ];
  for (const [fx, fz] of floatingCoords) {
    grid[fx][fz].prop = { id: makeInstanceId('sc'), itemId: 'floating_lotus_diya', rotation: 0, placedAt: 0 };
  }

  grid[4][2].prop = { id: makeInstanceId('sc'), itemId: 'grand_pandal', rotation: 0, placedAt: 0 };
  grid[7][2].prop = { id: makeInstanceId('sc'), itemId: 'grand_pandal', rotation: 0, placedAt: 0 };
  grid[5][1].prop = { id: makeInstanceId('sc'), itemId: 'bamboo_gate', rotation: 0, placedAt: 0 };
  grid[6][3].prop = { id: makeInstanceId('sc'), itemId: 'flower_rangoli', rotation: 0, placedAt: 0 };
  grid[5][3].prop = { id: makeInstanceId('sc'), itemId: 'kosi', rotation: 0, placedAt: 0 };

  grid[3][4].prop = { id: makeInstanceId('sc'), itemId: 'shirsoopta', rotation: 0, placedAt: 0 };
  grid[8][4].prop = { id: makeInstanceId('sc'), itemId: 'shirsoopta', rotation: 0, placedAt: 0 };
  grid[5][4].prop = { id: makeInstanceId('sc'), itemId: 'marigold_arch', rotation: 0, placedAt: 0 };
  grid[6][4].prop = { id: makeInstanceId('sc'), itemId: 'marigold_arch', rotation: 0, placedAt: 0 };
  grid[2][6].prop = { id: makeInstanceId('sc'), itemId: 'arghya_daura', rotation: 1, placedAt: 0 };
  grid[9][6].prop = { id: makeInstanceId('sc'), itemId: 'kosi', rotation: 3, placedAt: 0 };

  grid[1][2].prop = { id: makeInstanceId('sc'), itemId: 'mango_tree', rotation: 0, placedAt: 0 };
  grid[10][2].prop = { id: makeInstanceId('sc'), itemId: 'mango_tree', rotation: 1, placedAt: 0 };
  grid[1][5].prop = { id: makeInstanceId('sc'), itemId: 'banana_tree', rotation: 0, placedAt: 0 };
  grid[10][5].prop = { id: makeInstanceId('sc'), itemId: 'banana_tree', rotation: 2, placedAt: 0 };
  grid[1][8].prop = { id: makeInstanceId('sc'), itemId: 'sugarcane', rotation: 1, placedAt: 0 };
  grid[10][8].prop = { id: makeInstanceId('sc'), itemId: 'sugarcane', rotation: 3, placedAt: 0 };
  grid[2][10].prop = { id: makeInstanceId('sc'), itemId: 'banana_tree', rotation: 0, placedAt: 0 };
  grid[9][10].prop = { id: makeInstanceId('sc'), itemId: 'banana_tree', rotation: 2, placedAt: 0 };

  return grid;
}
