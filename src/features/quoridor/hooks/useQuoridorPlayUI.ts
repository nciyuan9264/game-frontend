import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameSnapshot } from '../model/session';
import {
  rotateOrientation,
  wallReasonCopy,
} from '../model/board';
import { wallOptionAt } from '../model/selectors';
import type {
  ActionMode,
  Cell,
  Orientation,
  PendingAction,
  WallSpec,
} from '../model/types';

export type QuoridorPanel =
  | 'activity'
  | 'rules'
  | 'menu'
  | 'resign'
  | 'zoom'
  | 'wall-picker';

function clamp(value: number) {
  return Math.max(0, Math.min(7, value));
}

export function useQuoridorPlayUI(data: GameSnapshot) {
  const [panel, setPanel] = useState<QuoridorPanel>();
  const [mode, setModeState] = useState<ActionMode>('move');
  const [orientation, setOrientation] = useState<Orientation>('h');
  const [selected, setSelected] = useState<PendingAction>();
  const [hovered, setHovered] = useState<PendingAction>();
  const [showPath, setShowPath] = useState(false);
  const [showResults, setShowResults] = useState(
    data.roomData.gameStatus === 'end',
  );
  const snapshotKey = `${data.matchID}:${data.seq}:${data.roomData.currentPlayer}`;
  const preview = selected ?? hovered;
  const selectedWallOption = useMemo(
    () => selected?.kind === 'wall'
      ? wallOptionAt(data.roomData.wallOptions, selected.wall)
      : undefined,
    [data.roomData.wallOptions, selected],
  );
  const selectedWallError = selected?.kind === 'wall'
    && !selectedWallOption?.legal
    ? wallReasonCopy(selectedWallOption?.reasonCode)
    : '';

  const clearSelection = useCallback(() => {
    setSelected(undefined);
    setHovered(undefined);
  }, []);

  const setMode = useCallback((value: ActionMode) => {
    setModeState(value);
    clearSelection();
  }, [clearSelection]);

  const rotate = useCallback(() => {
    setOrientation(value => {
      const next = rotateOrientation(value);
      setSelected(current => current?.kind === 'wall'
        ? { kind: 'wall', wall: { ...current.wall, orientation: next } }
        : current);
      setHovered(undefined);
      return next;
    });
  }, []);

  const nudgeWall = useCallback((row: number, column: number) => {
    setSelected(current => {
      const wall: WallSpec = current?.kind === 'wall'
        ? current.wall
        : { row: 3, column: 3, orientation };
      return {
        kind: 'wall',
        wall: {
          ...wall,
          row: clamp(wall.row + row),
          column: clamp(wall.column + column),
        },
      };
    });
    setHovered(undefined);
  }, [orientation]);

  const selectMove = useCallback((to: Cell) => {
    setSelected({ kind: 'move', to });
    setHovered(undefined);
  }, []);

  const selectWall = useCallback((wall: WallSpec) => {
    setOrientation(wall.orientation);
    setSelected({ kind: 'wall', wall });
    setHovered(undefined);
  }, []);

  useEffect(() => {
    clearSelection();
  }, [clearSelection, snapshotKey]);

  useEffect(() => {
    if (data.roomData.gameStatus === 'end') setShowResults(true);
  }, [data.roomData.gameStatus]);

  useEffect(() => {
    const currentSide = data.roomData.currentSide || 'south';
    if (
      mode === 'wall'
      && data.roomData.wallStock[currentSide] <= 0
    ) {
      setMode('move');
    }
  }, [data.roomData.currentSide, data.roomData.wallStock, mode, setMode]);

  return {
    panel,
    setPanel,
    mode,
    setMode,
    orientation,
    setOrientation,
    selected,
    setSelected,
    hovered,
    setHovered,
    preview,
    selectedWallOption,
    selectedWallError,
    selectMove,
    selectWall,
    rotate,
    nudgeWall,
    clearSelection,
    showPath,
    setShowPath,
    showResults,
    setShowResults,
  };
}
