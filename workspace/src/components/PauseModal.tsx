import React from 'react';
import { Play, RotateCcw, Camera, Home, Volume2, VolumeX, BookOpen } from 'lucide-react';

interface PauseModalProps {
  muted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenPhoto: () => void;
  onToggleMute: () => void;
  onHowTo: () => void;
  onQuitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  muted,
  onResume,
  onRestart,
  onOpenPhoto,
  onToggleMute,
  onHowTo,
  onQuitToTitle,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-amber-400/40 bg-stone-950/95 p-6 text-center shadow-2xl">
        <div className="text-xs font-extrabold tracking-widest text-amber-400 uppercase">Paused</div>
        <h2 className="font-display mt-1 text-2xl text-amber-200">Ghat Studio</h2>
        <p className="mt-1 text-xs font-semibold text-amber-100/75">
          Your design is waiting. Nothing is timed.
        </p>

        <div className="mt-5 space-y-2.5">
          <button
            onClick={onResume}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-black text-stone-950 shadow-lg transition hover:brightness-110 active:scale-95"
          >
            <Play className="h-4 w-4 fill-stone-950" />
            Resume
          </button>

          <button
            onClick={onOpenPhoto}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-stone-900 py-2.5 text-sm font-bold text-amber-200 transition hover:bg-stone-800 active:scale-95"
          >
            <Camera className="h-4 w-4 text-amber-400" />
            Export Image
          </button>

          <button
            onClick={onHowTo}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-stone-900 py-2.5 text-sm font-bold text-amber-100 transition hover:bg-stone-800 active:scale-95"
          >
            <BookOpen className="h-4 w-4 text-amber-400" />
            How to Play
          </button>

          <button
            onClick={onRestart}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-stone-900 py-2.5 text-sm font-bold text-amber-100 transition hover:bg-stone-800 active:scale-95"
          >
            <RotateCcw className="h-4 w-4 text-amber-400" />
            Fresh Ghat
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onToggleMute}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-500/20 bg-stone-900 py-2 text-xs font-bold text-amber-200 hover:bg-stone-800"
            >
              {muted ? (
                <>
                  <VolumeX className="h-4 w-4 text-rose-400" />
                  Sound Off
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 text-amber-400" />
                  Sound On
                </>
              )}
            </button>

            <button
              onClick={onQuitToTitle}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-500/20 bg-stone-900 py-2 text-xs font-bold text-amber-200 hover:bg-stone-800"
            >
              <Home className="h-4 w-4 text-amber-400" />
              Title
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
