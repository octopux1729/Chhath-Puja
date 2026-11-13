import React from 'react';
import { X } from 'lucide-react';
import { BUILDING_ITEMS, CATEGORY_TABS, HOW_TO_PLAY_ITEMS } from '../data/catalog';
import { BuildingCategory } from '../types/game';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  const grouped = CATEGORY_TABS.map((tab) => ({
    tab,
    items: HOW_TO_PLAY_ITEMS.filter((item) => item.category === tab.id),
  }));

  const clearTool = BUILDING_ITEMS.bulldoze;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-amber-400/40 bg-stone-950 text-amber-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-500/20 px-4 py-3 sm:px-5">
          <div>
            <div className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
              Studio Guide
            </div>
            <h2 className="font-display text-xl text-amber-200">How to Play</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close how to play"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-amber-400/25 bg-stone-900 text-amber-200 transition hover:border-amber-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <p className="text-sm leading-relaxed text-amber-100/85">
            This is a creative ghat studio. Place water, platforms, trees and offerings. There is no timer and no score.
          </p>

          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-500/20 bg-stone-900/80 p-3">
              <div className="font-extrabold text-amber-300">Place</div>
              <p className="mt-1 text-amber-100/75">Tap a tile. Tap again to rotate the same item.</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-stone-900/80 p-3">
              <div className="font-extrabold text-amber-300">Look around</div>
              <p className="mt-1 text-amber-100/75">Drag to orbit. Pinch or scroll to zoom.</p>
            </div>
          </div>

          {grouped.map(({ tab, items }) => (
            <section key={tab.id as BuildingCategory}>
              <h3 className="mb-2 text-[11px] font-extrabold tracking-wider text-amber-400 uppercase">
                {tab.label}
              </h3>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-amber-500/15 bg-stone-900/75 px-3 py-2"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{
                        backgroundColor: `${item.accentColor}28`,
                        border: `1px solid ${item.accentColor}66`,
                      }}
                    >
                      {item.iconEmoji}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-amber-50">
                        {item.name}
                      </div>
                      <div className="truncate text-[11px] text-amber-200/70">
                        {item.hindiName} · {item.shortDesc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="flex items-center gap-3 rounded-2xl border border-rose-400/25 bg-stone-900/75 px-3 py-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/15 text-xl">
              {clearTool.iconEmoji}
            </div>
            <div>
              <div className="text-sm font-extrabold text-amber-50">{clearTool.name}</div>
              <div className="text-[11px] text-amber-200/70">{clearTool.shortDesc}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
