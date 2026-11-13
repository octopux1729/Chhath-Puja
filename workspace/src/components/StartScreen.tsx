import React from 'react';
import { Play, BookOpen, Smartphone, Keyboard, Sun } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  onHowTo: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onHowTo }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-between overflow-y-auto p-3 sm:p-6">
      <div className="pointer-events-auto mt-2 flex flex-col items-center text-center sm:mt-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-stone-950/75 px-3.5 py-1 text-[11px] font-extrabold tracking-widest text-amber-300 uppercase shadow-lg backdrop-blur-md">
          <Sun className="h-3.5 w-3.5 text-amber-400" />
          <span>Jai Chhathi Maiya</span>
        </div>
        <h1 className="font-display mt-2 bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-4xl tracking-wide text-transparent drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)] sm:text-6xl">
          CHHATH GHAT
        </h1>
        <p className="mt-1 max-w-md rounded-full bg-stone-950/60 px-4 py-1 text-xs font-semibold text-amber-100/90 backdrop-blur-sm sm:text-sm">
          A quiet 3D studio for ponds, pandals, trees and offerings
        </p>
      </div>

      <div className="pointer-events-auto my-auto w-full max-w-md rounded-3xl border border-amber-400/40 bg-stone-950/82 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="space-y-3">
          <button
            onClick={onStart}
            className="group flex w-full cursor-pointer items-center justify-between rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 p-3.5 text-left text-stone-950 shadow-xl transition hover:brightness-105 active:scale-[0.98] sm:p-4"
          >
            <div>
              <div className="flex items-center gap-1.5 text-base font-black sm:text-lg">
                <Play className="h-5 w-5 fill-stone-950" />
                <span>Start Designing</span>
              </div>
              <div className="mt-0.5 text-xs font-bold text-stone-900/80">
                No timer. No scores. Just your ghat.
              </div>
            </div>
            <span className="rounded-xl bg-stone-950/15 px-2.5 py-1 text-xs font-black uppercase">
              Open
            </span>
          </button>

          <button
            onClick={onHowTo}
            className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-amber-400/35 bg-stone-900/90 p-3 text-left text-amber-100 transition hover:border-amber-300 hover:bg-stone-800/90 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <div className="text-sm font-extrabold text-amber-200">How to Play</div>
                <div className="text-[11px] text-amber-200/70">
                  Item names, placement tips, and controls
                </div>
              </div>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="rounded-xl border border-amber-500/15 bg-stone-900/75 p-2.5">
              <div className="mb-1 flex items-center gap-1 font-extrabold text-amber-300">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile</span>
              </div>
              <p className="leading-snug text-amber-100/75">
                Tap to place. Drag to orbit. Pinch to zoom.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/15 bg-stone-900/75 p-2.5">
              <div className="mb-1 flex items-center gap-1 font-extrabold text-amber-300">
                <Keyboard className="h-3.5 w-3.5" />
                <span>Desktop</span>
              </div>
              <p className="leading-snug text-amber-100/75">
                Click to place. Drag to orbit. R rotate. X clear.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none mb-1 rounded-full bg-stone-950/65 px-3.5 py-1 text-[11px] font-semibold text-amber-200/75 backdrop-blur-sm">
        Live 3D ghat orbiting behind this screen
      </div>
    </div>
  );
};
