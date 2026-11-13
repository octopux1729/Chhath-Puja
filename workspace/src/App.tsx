import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { BuilderDock } from './components/BuilderDock';
import { HowToPlayModal } from './components/HowToPlayModal';
import { HudOverlay } from './components/HudOverlay';
import { PauseModal } from './components/PauseModal';
import { PhotoExportModal } from './components/PhotoExportModal';
import { StartScreen } from './components/StartScreen';
import {
  BUILDING_ITEMS,
  CATEGORY_TABS,
  createShowcaseGrid,
  createStarterPlayableGrid,
  getItemsByCategory,
  makeInstanceId,
} from './data/catalog';
import { GhatSceneManager, TileTapCallbackPayload } from './three/GhatSceneManager';
import {
  BuildingCategory,
  BuildingItemId,
  GamePhase,
  GridCellData,
  LightingPreset,
} from './types/game';
import { loadMutedPref, saveMutedPref } from './utils/storage';

function cloneGrid(grid: GridCellData[][]): GridCellData[][] {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      base: cell.base ? { ...cell.base } : null,
      prop: cell.prop ? { ...cell.prop } : null,
    }))
  );
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<GhatSceneManager | null>(null);

  const [phase, setPhase] = useState<GamePhase>('start');
  const previousPhaseRef = useRef<GamePhase>('playing');
  const [grid, setGrid] = useState<GridCellData[][]>(() => createShowcaseGrid());

  const [activeCategory, setActiveCategory] = useState<BuildingCategory>('water_ghat');
  const [selectedItem, setSelectedItem] = useState<BuildingItemId>('pond_platform');
  const [rotation, setRotation] = useState<number>(0);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('sunset');
  const [photoDefaultTitle, setPhotoDefaultTitle] = useState('Pavitra Surya Ghat');

  const [muted, setMuted] = useState<boolean>(() => {
    const m = loadMutedPref();
    soundEngine.setMuted(m);
    return m;
  });

  const stateRef = useRef({
    phase,
    grid,
    selectedItem,
    rotation,
  });
  stateRef.current = {
    phase,
    grid,
    selectedItem,
    rotation,
  };

  const handleTileTap = useCallback(({ gx, gz }: TileTapCallbackPayload) => {
    const {
      phase: curPhase,
      grid: curGrid,
      selectedItem: itemId,
      rotation: curRot,
    } = stateRef.current;

    if (curPhase !== 'playing') return;

    const nextGrid = cloneGrid(curGrid);
    const cell = nextGrid[gx][gz];
    const def = BUILDING_ITEMS[itemId];

    if (itemId === 'bulldoze') {
      if (cell.prop) {
        cell.prop = null;
      } else if (cell.base) {
        cell.base = null;
      } else if (cell.terrain === 'pond') {
        cell.terrain = 'land';
      } else {
        return;
      }
      soundEngine.playRemove();
      setGrid(nextGrid);
      sceneRef.current?.syncGrid(nextGrid, { gx, gz, burstType: 'remove' });
      return;
    }

    if (
      (def.layer === 'base_platform' && cell.base?.itemId === itemId) ||
      (def.layer === 'prop' && cell.prop?.itemId === itemId)
    ) {
      const nextRot =
        ((cell.prop?.itemId === itemId ? cell.prop.rotation : cell.base!.rotation) + 1) % 4;
      if (def.layer === 'prop' && cell.prop) {
        cell.prop.rotation = nextRot;
      } else if (def.layer === 'base_platform' && cell.base) {
        cell.base.rotation = nextRot;
      }
      setRotation(nextRot);
      soundEngine.playRotate();
      setGrid(nextGrid);
      sceneRef.current?.syncGrid(nextGrid);
      return;
    }

    let burstType: 'water' | 'festive' = 'festive';

    if (itemId === 'pond_tile') {
      if (cell.terrain === 'pond' && !cell.base) {
        return;
      }
      cell.terrain = 'pond';
      if (cell.base?.itemId === 'ghat_steps') {
        cell.base = null;
      }
      if (cell.prop && cell.prop.itemId !== 'floating_lotus_diya') {
        cell.prop = null;
      }
      burstType = 'water';
    } else if (itemId === 'pond_platform') {
      cell.terrain = 'pond';
      cell.base = {
        id: makeInstanceId('base'),
        itemId: 'pond_platform',
        rotation: curRot,
        placedAt: Date.now(),
      };
      if (cell.prop?.itemId === 'floating_lotus_diya') {
        cell.prop = null;
      }
      burstType = 'water';
    } else if (itemId === 'ghat_steps') {
      cell.terrain = 'land';
      cell.base = {
        id: makeInstanceId('base'),
        itemId: 'ghat_steps',
        rotation: curRot,
        placedAt: Date.now(),
      };
      if (cell.prop?.itemId === 'floating_lotus_diya') {
        cell.prop = null;
      }
    } else if (itemId === 'floating_lotus_diya') {
      cell.terrain = 'pond';
      cell.base = null;
      cell.prop = {
        id: makeInstanceId('prop'),
        itemId: 'floating_lotus_diya',
        rotation: curRot,
        placedAt: Date.now(),
      };
      burstType = 'water';
    } else if (itemId === 'mango_tree') {
      cell.terrain = 'land';
      cell.base = null;
      cell.prop = {
        id: makeInstanceId('prop'),
        itemId: 'mango_tree',
        rotation: curRot,
        placedAt: Date.now(),
      };
    } else {
      if (cell.terrain === 'pond' && !cell.base) {
        cell.base = {
          id: makeInstanceId('auto_plat'),
          itemId: 'pond_platform',
          rotation: 0,
          placedAt: Date.now(),
        };
      }
      cell.prop = {
        id: makeInstanceId('prop'),
        itemId,
        rotation: curRot,
        placedAt: Date.now(),
      };
    }

    setGrid(nextGrid);
    sceneRef.current?.syncGrid(nextGrid, { gx, gz, burstType });
    soundEngine.playPlace(0, burstType === 'water');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((r) => {
      const next = (r + 1) % 4;
      soundEngine.playRotate();
      return next;
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const manager = new GhatSceneManager(canvasRef.current, {
      onTileTap: handleTileTap,
      onRightRotate: handleRotate,
    });
    sceneRef.current = manager;
    manager.syncGrid(grid);
    manager.setInteractionEnabled(false, true);
    manager.setLightingState('sunset', 0.52);

    return () => {
      manager.destroy();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.setSelectedTool(selectedItem, rotation);
  }, [selectedItem, rotation]);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (phase === 'playing') {
      sceneRef.current.setInteractionEnabled(true, false);
    } else if (phase === 'start') {
      sceneRef.current.setInteractionEnabled(false, true);
    } else if (phase === 'photo') {
      sceneRef.current.setInteractionEnabled(false, false);
    } else {
      sceneRef.current.setInteractionEnabled(false, false);
    }
  }, [phase]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const progress =
      lightingPreset === 'sunset' ? 0.52 : lightingPreset === 'twilight' ? 0.94 : 0.18;
    sceneRef.current.setLightingState(lightingPreset, progress);
  }, [lightingPreset, phase]);

  const startNewStudio = useCallback(() => {
    const starter = createStarterPlayableGrid();
    setGrid(starter);
    setLightingPreset('sunset');
    setActiveCategory('water_ghat');
    setSelectedItem('pond_platform');
    setRotation(0);
    sceneRef.current?.resetCameraView();
    sceneRef.current?.syncGrid(starter);
    sceneRef.current?.triggerGrandPetalShower();
    soundEngine.playPlace(2, true);
    setPhase('playing');
  }, []);

  const quitToTitle = useCallback(() => {
    const showcase = createShowcaseGrid();
    setGrid(showcase);
    sceneRef.current?.resetCameraView();
    sceneRef.current?.syncGrid(showcase);
    setPhase('start');
  }, []);

  const handleOpenPhoto = useCallback(() => {
    previousPhaseRef.current = phase === 'photo' ? 'playing' : phase;
    setPhase('photo');
  }, [phase]);

  const handleOpenHowTo = useCallback(() => {
    previousPhaseRef.current = phase === 'howto' ? 'playing' : phase;
    setPhase('howto');
  }, [phase]);

  const handleCycleLighting = useCallback(() => {
    const order: LightingPreset[] = ['sunset', 'twilight', 'dawn'];
    setLightingPreset((cur) => order[(order.indexOf(cur) + 1) % order.length]);
    soundEngine.playRotate();
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      soundEngine.setMuted(next);
      saveMutedPref(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (phase === 'playing') {
          setPhase('paused');
        } else if (phase === 'paused') {
          setPhase('playing');
        } else if (phase === 'photo' || phase === 'howto') {
          setPhase(previousPhaseRef.current);
        }
        return;
      }

      if (phase !== 'playing') return;

      const key = e.key.toLowerCase();
      if (key === 'r') {
        e.preventDefault();
        handleRotate();
      } else if (key === 'x' || e.key === 'Delete' || e.key === 'Backspace') {
        setSelectedItem((cur) =>
          cur === 'bulldoze' ? getItemsByCategory(activeCategory)[0].id : 'bulldoze'
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const idx = CATEGORY_TABS.findIndex((t) => t.id === activeCategory);
        const nextCat = CATEGORY_TABS[(idx + 1) % CATEGORY_TABS.length].id;
        setActiveCategory(nextCat);
        setSelectedItem(getItemsByCategory(nextCat)[0].id);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const items = getItemsByCategory(activeCategory);
        if (items[idx]) {
          setSelectedItem(items[idx].id);
          soundEngine.playRotate();
        }
      } else if (key === 'q') {
        sceneRef.current?.adjustCamera(-0.26, 0);
      } else if (key === 'e') {
        sceneRef.current?.adjustCamera(0.26, 0);
      } else if (e.key === 'ArrowUp' || key === 'w') {
        sceneRef.current?.moveHoveredCellBy(0, -1);
      } else if (e.key === 'ArrowDown' || key === 's') {
        sceneRef.current?.moveHoveredCellBy(0, 1);
      } else if (e.key === 'ArrowLeft' || key === 'a') {
        sceneRef.current?.moveHoveredCellBy(-1, 0);
      } else if (e.key === 'ArrowRight' || key === 'd') {
        sceneRef.current?.moveHoveredCellBy(1, 0);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (sceneRef.current) {
          const cell = sceneRef.current.getHoveredOrCenterCell();
          const proj = sceneRef.current.projectCellToScreen(cell.gx, cell.gz);
          handleTileTap({
            gx: cell.gx,
            gz: cell.gz,
            screenX: proj.x,
            screenY: proj.y,
          });
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, activeCategory, handleRotate, handleTileTap]);

  const handleSelectCategory = (cat: BuildingCategory) => {
    setActiveCategory(cat);
    const catItems = getItemsByCategory(cat);
    if (catItems.length > 0) {
      setSelectedItem(catItems[0].id);
    }
    soundEngine.playRotate();
  };

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#1a0d0b] select-none">
      <canvas ref={canvasRef} className="block h-full w-full cursor-pointer touch-none" />

      {phase === 'start' && (
        <StartScreen onStart={startNewStudio} onHowTo={handleOpenHowTo} />
      )}

      {phase === 'playing' && (
        <>
          <HudOverlay
            lightingPreset={lightingPreset}
            muted={muted}
            onCycleLighting={handleCycleLighting}
            onToggleMute={handleToggleMute}
            onOpenPhoto={handleOpenPhoto}
            onPause={() => setPhase('paused')}
            onHowTo={handleOpenHowTo}
          />
          <BuilderDock
            activeCategory={activeCategory}
            selectedItem={selectedItem}
            rotation={rotation}
            onSelectCategory={handleSelectCategory}
            onSelectItem={(id) => {
              setSelectedItem(id);
              soundEngine.playRotate();
            }}
            onRotate={handleRotate}
            onResetCamera={() => sceneRef.current?.resetCameraView()}
          />
        </>
      )}

      {phase === 'paused' && (
        <PauseModal
          muted={muted}
          onResume={() => setPhase('playing')}
          onRestart={startNewStudio}
          onOpenPhoto={handleOpenPhoto}
          onToggleMute={handleToggleMute}
          onHowTo={handleOpenHowTo}
          onQuitToTitle={quitToTitle}
        />
      )}

      {phase === 'photo' && (
        <PhotoExportModal
          defaultGhatName={photoDefaultTitle}
          lightingPreset={lightingPreset}
          onChangeLighting={(preset) => {
            setLightingPreset(preset);
            soundEngine.playRotate();
          }}
          onCaptureDataUrl={(opts) => {
            soundEngine.playShutter();
            setPhotoDefaultTitle(opts.ghatName);
            return sceneRef.current?.captureGhatImage(opts) || '';
          }}
          onClose={() => setPhase(previousPhaseRef.current === 'start' ? 'playing' : previousPhaseRef.current)}
        />
      )}

      {phase === 'howto' && (
        <HowToPlayModal
          onClose={() =>
            setPhase(previousPhaseRef.current === 'howto' ? 'playing' : previousPhaseRef.current)
          }
        />
      )}
    </main>
  );
}

export default App;
