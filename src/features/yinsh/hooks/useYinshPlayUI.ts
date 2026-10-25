import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameSnapshot } from '../model/session';

export type YinshPanel =
  | 'activity'
  | 'rules'
  | 'settings'
  | 'menu'
  | 'resign';

export function useYinshPlayUI(data: GameSnapshot) {
  const [panel, setPanel] = useState<YinshPanel>();
  const [selectedRing, setSelectedRing] = useState<string>();
  const [hoveredPoint, setHoveredPoint] = useState<string>();
  const [pendingPoint, setPendingPoint] = useState<string>();
  const [selectedRowID, setSelectedRowID] = useState<string>();
  const [showResults, setShowResults] = useState(
    data.roomData.gameStatus === 'end',
  );

  const moves = useMemo(
    () => selectedRing
      ? data.roomData.legalMoves[selectedRing] ?? []
      : [],
    [data.roomData.legalMoves, selectedRing],
  );
  const preview = useMemo(
    () => moves.find(move => move.to === (pendingPoint ?? hoveredPoint)),
    [hoveredPoint, moves, pendingPoint],
  );
  const selectedRow = useMemo(
    () => data.roomData.candidateRows.find(row => row.id === selectedRowID)
      ?? data.roomData.candidateRows[0],
    [data.roomData.candidateRows, selectedRowID],
  );

  const clearSelection = useCallback(() => {
    setSelectedRing(undefined);
    setHoveredPoint(undefined);
    setPendingPoint(undefined);
    setSelectedRowID(undefined);
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
    selectedRing,
    setSelectedRing,
    hoveredPoint,
    setHoveredPoint,
    pendingPoint,
    setPendingPoint,
    selectedRowID,
    setSelectedRowID,
    moves,
    preview,
    selectedRow,
    clearSelection,
    showResults,
    setShowResults,
  };
}
