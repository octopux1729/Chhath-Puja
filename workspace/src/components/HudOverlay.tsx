import React, { useState } from 'react';
import {
  Camera,
  Pause,
  Sun,
  Moon,
  Sunrise,
  Volume2,
  VolumeX,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
import { LightingPreset } from '../types/game';

interface HudOverlayProps {
  lightingPreset: LightingPreset;
  muted: boolean;
  onCycleLighting: () => void;
  onToggleMute: () => void;
  onOpenPhoto: () => void;
  onPause: () => void;
  onHowTo: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  lightingPreset,
  muted,
  onCycleLighting,
  onToggleMute,
  onOpenPhoto,
  onPause,
  onHowTo,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const lightingLabel =
    lightingPreset === 'sunset' ? 'Sandhya' : lightingPreset === 'twilight' ? 'Night' : 'Dawn';

  const LightingIcon = lightingPreset === 'twilight' ? Moon : lightingPreset === 'dawn' ? Sunrise : Sun;

  const actions = [
    {
      key: 'export',
      label: 'Export',
      icon: Camera,
      onClick: onOpenPhoto,
    },
    {
      key: 'sound',
      label: muted ? 'Sound Off' : 'Sound On',
      icon: muted ? VolumeX : Volume2,
      onClick: onToggleMute,
    },
    {
      key: 'time',
      label: lightingLabel,
      icon: LightingIcon,
      onClick: onCycleLighting,
    },
    {
      key: 'guide',
      label: 'How to Play',
      icon: BookOpen,
      onClick: onHowTo,
    },
    {
      key: 'pause',
      label: 'Pause',
      icon: Pause,
      onClick: onPause,
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <div className="absolute top-[max(0.6rem,env(safe-area-inset-top))] right-[max(0.6rem,env(safe-area-inset-right))] flex flex-col items-end gap-2">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close studio menu' : 'Open studio menu'}
          aria-expanded={menuOpen}
          className="pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-amber-400/35 bg-stone-950/85 text-amber-100 shadow-xl backdrop-blur-md transition hover:border-amber-300 active:scale-95"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {menuOpen && (
          <div className="pointer-events-auto w-44 overflow-hidden rounded-2xl border border-amber-400/35 bg-stone-950/92 p-1.5 shadow-2xl backdrop-blur-xl">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  onClick={() => {
                    action.onClick();
                    if (action.key !== 'sound' && action.key !== 'time') {
                      setMenuOpen(false);
                    }
                  }}
                  className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 text-left text-sm font-bold text-amber-100 transition hover:bg-amber-400/15 active:scale-[0.98]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
