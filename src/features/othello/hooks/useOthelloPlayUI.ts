import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameSnapshot } from '../model/session';

export type OthelloPanel =
  | 'activity'
  | 'rules'
  | 'menu'
  | 'resign'
  | 'zoom';

export function useOthelloPlayUI(data: GameSnapshot) {
  const [panel, setPanel] = useState<OthelloPanel>();
  const [hoveredIndex, setHoveredIndex] = useState<number>();
  const [showResults, setShowResults] = useState(
    data.roomData.gameStatus === 'end',
  );
  const preview = useMemo(
    () => data.roomData.legalMoves.find(move =>
      move.index === hoveredIndex),
    [data.roomData.legalMoves, hoveredIndex],
  );

  const clearSelection = useCallback(() => {
    setHoveredIndex(undefined);
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
    preview,
    clearSelection,
    showResults,
    setShowResults,
  };
}
