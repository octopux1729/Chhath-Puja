export const GRID_SIZE = 12;

export type GamePhase = 'start' | 'playing' | 'paused' | 'photo' | 'howto';

export type LightingPreset = 'sunset' | 'twilight' | 'dawn';

export type BuildingCategory =
  | 'water_ghat'
  | 'trees'
  | 'flowers'
  | 'pandal'
  | 'ritual';

export type BuildingItemId =
  | 'pond_tile'
  | 'ghat_steps'
  | 'pond_platform'
  | 'shirsoopta'
  | 'banana_tree'
  | 'sugarcane'
  | 'mango_tree'
  | 'marigold_arch'
  | 'flower_rangoli'
  | 'floating_lotus_diya'
  | 'grand_pandal'
  | 'bamboo_gate'
  | 'arghya_daura'
  | 'deep_stambh'
  | 'kosi'
  | 'bulldoze';

export type PlacementLayer = 'terrain_water' | 'base_platform' | 'prop';

export interface BuildingItemDef {
  id: BuildingItemId;
  name: string;
  hindiName: string;
  category: BuildingCategory | 'tool';
  layer: PlacementLayer | 'remove';
  shortDesc: string;
  accentColor: string;
  iconEmoji: string;
  requiresWater?: boolean;
  autoCarvesWater?: boolean;
  canSitOnPlatform?: boolean;
  canSitOnLand?: boolean;
}

export interface PlacedInstance {
  id: string;
  itemId: BuildingItemId;
  rotation: number;
  placedAt: number;
}

export interface GridCellData {
  x: number;
  z: number;
  terrain: 'land' | 'pond';
  base: PlacedInstance | null;
  prop: PlacedInstance | null;
}
