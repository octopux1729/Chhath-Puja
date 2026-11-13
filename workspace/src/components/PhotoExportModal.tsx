import React, { useEffect, useState } from 'react';
import {
  Camera,
  Download,
  RefreshCw,
  Share2,
  Sun,
  Moon,
  Sunrise,
  X,
  Check,
} from 'lucide-react';
import { LightingPreset } from '../types/game';

interface PhotoExportModalProps {
  defaultGhatName: string;
  lightingPreset: LightingPreset;
  onChangeLighting: (preset: LightingPreset) => void;
  onCaptureDataUrl: (options: { framed: boolean; ghatName: string }) => string;
  onClose: () => void;
}

export const PhotoExportModal: React.FC<PhotoExportModalProps> = ({
  defaultGhatName,
  lightingPreset,
  onChangeLighting,
  onCaptureDataUrl,
  onClose,
}) => {
  const [ghatName, setGhatName] = useState(defaultGhatName);
  const [framed, setFramed] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [downloaded, setDownloaded] = useState(false);
  const [minimizedForFraming, setMinimizedForFraming] = useState(false);

  const refreshSnapshot = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const url = onCaptureDataUrl({ framed, ghatName });
        setPreviewUrl(url);
      });
    });
  };

  useEffect(() => {
    if (!minimizedForFraming) {
      refreshSnapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framed, lightingPreset, minimizedForFraming]);

  const handleDownload = () => {
    const freshUrl = onCaptureDataUrl({ framed, ghatName });
    setPreviewUrl(freshUrl);
    const safeSlug =
      (ghatName || 'chhath-ghat')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'chhath-ghat';
    const link = document.createElement('a');
    link.href = freshUrl;
    link.download = `${safeSlug}-3d.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2600);
  };

  const handleMobileShare = async () => {
    try {
      const freshUrl = onCaptureDataUrl({ framed, ghatName });
      const res = await fetch(freshUrl);
      const blob = await res.blob();
      const file = new File([blob], 'chhath-ghat-3d.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: ghatName || 'My 3D Chhath Ghat',
          text: 'A Chhath ghat designed in 3D.',
          files: [file],
        });
        return;
      }
    } catch {
      // Fallback to standard download if share sheet cancelled/unavailable
    }
    handleDownload();
  };

  if (minimizedForFraming) {
    return (
      <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-4">
        <div className="mx-auto rounded-full border border-amber-400/50 bg-stone-950/85 px-4 py-1.5 text-xs font-bold text-amber-200 shadow-xl backdrop-blur-md">
          Drag to orbit and pinch to frame the ghat
        </div>
        <div className="pointer-events-auto mx-auto flex items-center gap-2 pb-2">
          <button
            onClick={() => setMinimizedForFraming(false)}
            className="flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-black text-stone-950 shadow-2xl transition hover:brightness-110 active:scale-95"
          >
            <Camera className="h-5 w-5" />
            Snap Photo
          </button>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-2xl border border-amber-400/30 bg-stone-950/90 px-4 py-3 text-sm font-bold text-amber-200"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-amber-400/40 bg-stone-950 text-amber-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-500/20 bg-gradient-to-r from-amber-950/80 via-stone-950 to-orange-950/70 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-lg text-amber-300 sm:text-xl">Export Ghat</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-amber-400/25 bg-stone-900 text-amber-200 hover:border-amber-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="relative overflow-hidden rounded-2xl border border-amber-400/35 bg-stone-900 shadow-inner">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="3D Chhath Ghat export preview"
                className="max-h-[42vh] w-full object-contain"
              />
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-amber-300/70">
                Rendering snapshot...
              </div>
            )}

            <button
              onClick={() => setMinimizedForFraming(true)}
              className="absolute right-3 bottom-3 flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-300/50 bg-stone-950/85 px-3 py-1.5 text-xs font-bold text-amber-200 shadow-lg backdrop-blur-md transition hover:bg-stone-900 active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
              Adjust Angle
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-amber-300/90" htmlFor="ghat-title">
                Ghat Title
              </label>
              <div className="flex gap-1.5">
                <input
                  id="ghat-title"
                  type="text"
                  maxLength={34}
                  value={ghatName}
                  onChange={(e) => setGhatName(e.target.value)}
                  onBlur={refreshSnapshot}
                  placeholder="Pavitra Surya Chhath Ghat"
                  className="w-full rounded-xl border border-amber-400/30 bg-stone-900 px-3 py-2 text-sm font-semibold text-amber-50 focus:border-amber-400 focus:outline-none"
                />
                <button
                  onClick={refreshSnapshot}
                  title="Update title"
                  className="cursor-pointer rounded-xl border border-amber-400/30 bg-stone-800 px-3 text-xs font-bold text-amber-300 hover:bg-stone-700"
                >
                  Apply
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-bold text-amber-300/90">Sky Time</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'sunset', label: 'Sandhya', Icon: Sun },
                    { id: 'twilight', label: 'Night', Icon: Moon },
                    { id: 'dawn', label: 'Dawn', Icon: Sunrise },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => onChangeLighting(id)}
                    className={`flex h-11 cursor-pointer items-center justify-center gap-1 rounded-xl border py-2 text-xs font-bold transition ${
                      lightingPreset === id
                        ? 'border-amber-300 bg-amber-500/25 text-amber-200'
                        : 'border-amber-500/20 bg-stone-900 text-amber-100/70 hover:bg-stone-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 text-amber-400" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-stone-900/70 px-3.5 py-2.5">
            <div>
              <div className="text-xs font-bold text-amber-200">Golden postcard frame</div>
              <div className="text-[11px] text-amber-200/65">Adds a festive border and ghat title</div>
            </div>
            <button
              onClick={() => setFramed((f) => !f)}
              className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
                framed
                  ? 'bg-amber-400 text-stone-950'
                  : 'border border-amber-400/30 bg-stone-800 text-amber-200'
              }`}
            >
              {framed ? 'Framed' : 'Clean'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/20 bg-stone-900/90 px-4 py-3 sm:px-6">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-amber-400/25 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-stone-800 sm:text-sm"
          >
            Continue
          </button>

          <div className="flex items-center gap-2">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleMobileShare}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-400/40 bg-stone-800 px-3.5 py-2.5 text-xs font-bold text-amber-200 hover:bg-stone-700 sm:text-sm"
              >
                <Share2 className="h-4 w-4 text-amber-400" />
                Share
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 px-5 py-2.5 text-xs font-black text-stone-950 shadow-xl transition hover:brightness-110 active:scale-95 sm:text-sm"
            >
              {downloaded ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved PNG
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PNG
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
