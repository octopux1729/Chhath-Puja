import React from 'react';
import { RotateCw, Trash2, Compass, Waves, Tent, Flower2, Trees, Flame } from 'lucide-react';
import { CATEGORY_TABS, getItemsByCategory } from '../data/catalog';
import { BuildingCategory, BuildingItemId } from '../types/game';

interface BuilderDockProps {
  activeCategory: BuildingCategory;
  selectedItem: BuildingItemId;
  rotation: number;
  onSelectCategory: (cat: BuildingCategory) => void;
  onSelectItem: (item: BuildingItemId) => void;
  onRotate: () => void;
  onResetCamera: () => void;
}

const CATEGORY_ICONS = {
  waves: Waves,
  tent: Tent,
  flower: Flower2,
  trees: Trees,
  flame: Flame,
};

export const BuilderDock: React.FC<BuilderDockProps> = ({
  activeCategory,
  selectedItem,
  rotation,
  onSelectCategory,
  onSelectItem,
  onRotate,
  onResetCamera,
}) => {
  const categoryItems = getItemsByCategory(activeCategory);
  const isBulldoze = selectedItem === 'bulldoze';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-3">
      <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-amber-400/30 bg-stone-950/88 p-1.5 shadow-2xl backdrop-blur-xl sm:p-2">
        <div className="mb-1.5 flex items-center gap-1">
          <div className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto">
            {CATEGORY_TABS.map((tab) => {
              const active = activeCategory === tab.id && !isBulldoze;
              const Icon = CATEGORY_ICONS[tab.icon];
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectCategory(tab.id)}
                  title={tab.label}
                  aria-label={tab.label}
                  className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition active:scale-95 ${
                    active
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 shadow-md'
                      : 'bg-stone-900/90 text-amber-100/80 hover:bg-stone-800 hover:text-amber-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1 border-l border-amber-500/20 pl-1.5">
            <button
              onClick={onRotate}
              title="Rotate 90 degrees"
              aria-label="Rotate item"
              className="flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-xl border border-amber-400/30 bg-stone-900 px-2 text-amber-200 transition hover:border-amber-400 active:scale-95"
            >
              <RotateCw className="h-4 w-4 text-amber-400" />
              <span className="hidden tabular-nums text-[10px] font-bold sm:inline">
                {rotation * 90}°
              </span>
            </button>

            <button
              onClick={() =>
                onSelectItem(isBulldoze ? getItemsByCategory(activeCategory)[0].id : 'bulldoze')
              }
              title="Clear tile"
              aria-label="Clear tile"
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition active:scale-95 ${
                isBulldoze
                  ? 'border-rose-400 bg-rose-600 text-white shadow'
                  : 'border-amber-400/25 bg-stone-900 text-rose-300 hover:border-rose-400/60'
              }`}
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              onClick={onResetCamera}
              title="Reset camera"
              aria-label="Reset camera view"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-amber-400/25 bg-stone-900 text-amber-200 transition hover:border-amber-400 active:scale-95"
            >
              <Compass className="h-4 w-4 text-amber-400" />
            </button>
          </div>
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          {categoryItems.map((item) => {
            const selected = selectedItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                title={item.name}
                aria-label={item.name}
                className={`flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-xl border text-2xl transition active:scale-95 sm:h-16 sm:w-16 ${
                  selected
                    ? 'border-amber-300 bg-gradient-to-br from-amber-500/30 to-stone-900 shadow-lg ring-1 ring-amber-300/60'
                    : 'border-amber-500/15 bg-stone-900/75 hover:border-amber-400/45 hover:bg-stone-800/80'
                }`}
                style={{
                  backgroundColor: selected ? undefined : `${item.accentColor}18`,
                }}
              >
                {item.iconEmoji}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
