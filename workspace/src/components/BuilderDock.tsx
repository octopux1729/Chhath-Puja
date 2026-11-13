import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCw,
  Trash2,
  Waves,
  Tent,
  Flower2,
  Trees,
  Flame,
  ChevronDown,
  Check,
} from 'lucide-react';
import { CATEGORY_TABS, getItemsByCategory } from '../data/catalog';
import { BuildingCategory, BuildingItemId } from '../types/game';

interface BuilderDockProps {
  activeCategory: BuildingCategory;
  selectedItem: BuildingItemId;
  rotation: number;
  onSelectCategory: (cat: BuildingCategory) => void;
  onSelectItem: (item: BuildingItemId) => void;
  onRotate: () => void;
}

const CATEGORY_ICONS = {
  waves: Waves,
  tent: Tent,
  flower: Flower2,
  trees: Trees,
  flame: Flame,
};

/** Compact chip labels for the desktop tab strip (full names live in the dropdown). */
const SHORT_LABELS: Record<BuildingCategory, string> = {
  water_ghat: 'Pond',
  pandal: 'Pandals',
  flowers: 'Flowers',
  trees: 'Trees',
  ritual: 'Arghya',
};

export const BuilderDock: React.FC<BuilderDockProps> = ({
  activeCategory,
  selectedItem,
  rotation,
  onSelectCategory,
  onSelectItem,
  onRotate,
}) => {
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const categoryItems = getItemsByCategory(activeCategory);
  const isBulldoze = selectedItem === 'bulldoze';
  const activeTab = CATEGORY_TABS.find((tab) => tab.id === activeCategory) ?? CATEGORY_TABS[0];
  const ActiveIcon = CATEGORY_ICONS[activeTab.icon];

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCategoryMenuOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [categoryMenuOpen]);

  const handlePickCategory = (cat: BuildingCategory) => {
    onSelectCategory(cat);
    setCategoryMenuOpen(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-3">
      <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-amber-400/30 bg-stone-950/88 p-1.5 shadow-2xl backdrop-blur-xl sm:max-w-2xl sm:p-2">
        <div className="relative mb-1.5 flex items-center gap-1.5">
          {/* ---- Mobile only: category dropdown ---- */}
          <div className="relative flex-1 sm:hidden" ref={menuRef}>
            <button
              type="button"
              onClick={() => setCategoryMenuOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={categoryMenuOpen}
              aria-label={`Category: ${activeTab.label}. Tap to change.`}
              className="relative z-20 flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-amber-400/35 bg-stone-900 px-2.5 text-left text-amber-100 transition active:scale-[0.99]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-400/15">
                <ActiveIcon className="h-4 w-4 text-amber-300" />
              </span>
              <span className="flex-1 truncate text-[13px] font-extrabold tracking-wide">
                {activeTab.label}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-amber-300 transition-transform duration-200 ${
                  categoryMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {categoryMenuOpen && (
              <div
                role="listbox"
                aria-label="Building category"
                className="absolute bottom-[calc(100%+0.4rem)] left-0 z-30 w-full overflow-hidden rounded-xl border border-amber-400/35 bg-stone-950/97 p-1 shadow-2xl backdrop-blur-xl"
              >
                  {CATEGORY_TABS.map((tab) => {
                    const Icon = CATEGORY_ICONS[tab.icon];
                    const active = tab.id === activeCategory && !isBulldoze;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => handlePickCategory(tab.id)}
                        className={`flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-left transition active:scale-[0.99] ${
                          active
                            ? 'bg-gradient-to-r from-amber-400/90 to-orange-500/90 text-stone-950'
                            : 'text-amber-100 hover:bg-amber-400/12'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            active ? 'text-stone-950' : 'text-amber-400'
                          }`}
                        />
                        <span className="flex-1 text-[13px] font-extrabold">{tab.label}</span>
                        {active && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ---- Desktop / tablet: category tab strip ---- */}
          <div className="no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto sm:flex">
            {CATEGORY_TABS.map((tab) => {
              const active = activeCategory === tab.id && !isBulldoze;
              const Icon = CATEGORY_ICONS[tab.icon];
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectCategory(tab.id)}
                  title={tab.label}
                  aria-label={tab.label}
                  aria-pressed={active}
                  className={`flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2 transition active:scale-95 ${
                    active
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 shadow-md'
                      : 'bg-stone-900/90 text-amber-100/80 hover:bg-stone-800 hover:text-amber-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] font-extrabold tracking-wide">
                    {SHORT_LABELS[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:border-l sm:border-amber-500/20 sm:pl-1.5">
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
              aria-pressed={isBulldoze}
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition active:scale-95 ${
                isBulldoze
                  ? 'border-rose-400 bg-rose-600 text-white shadow'
                  : 'border-amber-400/25 bg-stone-900 text-rose-300 hover:border-rose-400/60'
              }`}
            >
              <Trash2 className="h-4 w-4" />
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
                aria-pressed={selected}
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
