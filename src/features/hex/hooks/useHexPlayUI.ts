import { useCallback, useEffect, useState } from 'react';
import type { GameSnapshot } from '../model/session';
import type { Cell } from '../model/types';

export type HexPanel =
  | 'activity'
  | 'rules'
  | 'menu'
  | 'resign'
  | 'swap'
  | 'zoom';

export function useHexPlayUI(data: GameSnapshot) {
  const [panel, setPanel] = useState<HexPanel>();
  const [selected, setSelected] = useState<Cell>();
  const [hovered, setHovered] = useState<Cell>();
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showResults, setShowResults] = useState(
    data.roomData.gameStatus === 'end',
  );
  const snapshotKey =
    `${data.matchID}:${data.seq}:${data.roomData.currentPlayer}`;

  const clearSelection = useCallback(() => {
    setSelected(undefined);
    setHovered(undefined);
  }, []);

  useEffect(() => {
    clearSelection();
  }, [clearSelection, snapshotKey]);

  useEffect(() => {
    if (data.roomData.gameStatus === 'end') setShowResults(true);
  }, [data.roomData.gameStatus]);

  return {
    panel,
    setPanel,
    selected,
    setSelected,
    hovered,
    setHovered,
    clearSelection,
    showCoordinates,
    setShowCoordinates,
    showResults,
    setShowResults,
  };
}
