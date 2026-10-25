import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameSnapshot } from '../model/session';

export type OthelloPanel =
  | 'activity'
  | 'rules'
  | 'settings'
  | 'menu'
  | 'resign'
  | 'zoom';

export function useOthelloPlayUI(data: GameSnapshot) {
  const [panel, setPanel] = useState<OthelloPanel>();
  const [hoveredIndex, setHoveredIndex] = useState<number>();
  const [pendingIndex, setPendingIndex] = useState<number>();
  const [showResults, setShowResults] = useState(
    data.roomData.gameStatus === 'end',
  );
  const preview = useMemo(
    () => data.roomData.legalMoves.find(move =>
      move.index === (pendingIndex ?? hoveredIndex)),
    [data.roomData.legalMoves, hoveredIndex, pendingIndex],
  );

  const clearSelection = useCallback(() => {
    setHoveredIndex(undefined);
    setPendingIndex(undefined);
  }, []);

  useEffect(() => {
    clearSelection();
  }, [clearSelection, data.phaseVersion]);

  useEffect(() => {
    if (data.roomData.gameStatus === 'end') setShowResults(true);
  }, [data.roomData.gameStatus]);

  return {
    panel,
    setPanel,
    hoveredIndex,
    setHoveredIndex,
    pendingIndex,
    setPendingIndex,
    preview,
    clearSelection,
    showResults,
    setShowResults,
  };
}
