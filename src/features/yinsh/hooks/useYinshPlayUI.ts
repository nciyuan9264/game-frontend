import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameSnapshot } from '../model/session';

export type YinshPanel =
  | 'activity'
  | 'rules'
  | 'menu'
  | 'resign'
  | 'points';

export function useYinshPlayUI(data: GameSnapshot) {
  const [panel, setPanel] = useState<YinshPanel>();
  const [selectedRing, setSelectedRing] = useState<string>();
  const [hoveredPoint, setHoveredPoint] = useState<string>();
  const [selectedRowID, setSelectedRowID] = useState<string>();
  const [zoomed, setZoomed] = useState(false);
  const [feedback, setFeedback] = useState<{
    id: number;
    text: string;
    error: boolean;
    errorPoint?: string;
  }>();
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
    () => moves.find(move => move.to === hoveredPoint),
    [hoveredPoint, moves],
  );
  const selectedRow = useMemo(
    () => data.roomData.candidateRows.find(row => row.id === selectedRowID)
      ?? data.roomData.candidateRows[0],
    [data.roomData.candidateRows, selectedRowID],
  );

  const clearSelection = useCallback(() => {
    setSelectedRing(undefined);
    setHoveredPoint(undefined);
    setSelectedRowID(undefined);
    setFeedback(undefined);
  }, []);

  const notify = useCallback((
    text: string,
    error = true,
    errorPoint?: string,
  ) => {
    setFeedback({ id: Date.now(), text, error, errorPoint });
  }, []);

  useEffect(() => {
    clearSelection();
  }, [clearSelection, data.phaseVersion]);

  useEffect(() => {
    if (data.roomData.gameStatus === 'end') setShowResults(true);
  }, [data.roomData.gameStatus]);

  useEffect(() => {
    if (!feedback) return;
    const feedbackTimer = setTimeout(() => setFeedback(undefined), 4800);
    const pointTimer = setTimeout(() => {
      setFeedback(current => current
        ? { ...current, errorPoint: undefined }
        : undefined);
    }, 800);
    return () => {
      clearTimeout(feedbackTimer);
      clearTimeout(pointTimer);
    };
  }, [feedback?.id]);

  return {
    panel,
    setPanel,
    selectedRing,
    setSelectedRing,
    hoveredPoint,
    setHoveredPoint,
    selectedRowID,
    setSelectedRowID,
    moves,
    preview,
    selectedRow,
    clearSelection,
    feedback,
    notify,
    zoomed,
    setZoomed,
    showResults,
    setShowResults,
  };
}
