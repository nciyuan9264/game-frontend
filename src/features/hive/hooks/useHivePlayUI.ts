import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  PIECE_KINDS,
  pieceKindFromID,
} from '../model/board';
import type { GameSnapshot } from '../model/session';
import type {
  ActionMode,
  Hex,
  PendingAction,
  PieceKind,
} from '../model/types';

export type HivePanel =
  | 'activity'
  | 'rules'
  | 'menu'
  | 'resign'
  | 'zoom'
  | 'insect'
  | 'stack';

export function useHivePlayUI(data: GameSnapshot) {
  const [panel, setPanel] = useState<HivePanel>();
  const [mode, setModeState] = useState<ActionMode>('place');
  const [kind, setKindState] = useState<PieceKind>('ant');
  const [selectedPieceID, setSelectedPieceID] = useState<string>();
  const [pending, setPending] = useState<PendingAction>();
  const [detailKind, setDetailKind] = useState<PieceKind>('ant');
  const [detailPosition, setDetailPosition] = useState<Hex>();
  const [showMoves, setShowMoves] = useState(true);
  const [coordinates, setCoordinates] = useState(false);
  const [showResults, setShowResults] = useState(
    data.roomData.gameStatus === 'end',
  );
  const snapshotKey = `${data.matchID}:${data.seq}:${data.roomData.currentPlayer}`;

  const clearSelection = useCallback(() => {
    setSelectedPieceID(undefined);
    setPending(undefined);
  }, []);

  const setMode = useCallback((value: ActionMode) => {
    setModeState(value);
    clearSelection();
  }, [clearSelection]);

  const setKind = useCallback((value: PieceKind) => {
    setKindState(value);
    setSelectedPieceID(undefined);
    setPending(undefined);
  }, []);

  const selectPiece = useCallback((pieceID?: string) => {
    setSelectedPieceID(pieceID);
    setPending(undefined);
    const selectedKind = pieceKindFromID(pieceID);
    if (selectedKind) setKindState(selectedKind);
  }, []);

  const openInsect = useCallback((value: PieceKind) => {
    setDetailKind(value);
    setPanel('insect');
  }, []);

  const openStack = useCallback((position: Hex) => {
    setDetailPosition(position);
    setPanel('stack');
  }, []);

  useEffect(() => {
    clearSelection();
  }, [clearSelection, snapshotKey]);

  useEffect(() => {
    if (data.roomData.gameStatus === 'end') setShowResults(true);
  }, [data.roomData.gameStatus]);

  useEffect(() => {
    const self = data.playerData[data.playerId];
    if (!self) return;
    if (!self.queenPlaced && self.turnsTaken >= 3) {
      setModeState('place');
      setKindState('queen');
      clearSelection();
      return;
    }
    if (
      self.reserveByKind[kind] <= 0
      || !PIECE_KINDS.includes(kind)
    ) {
      const next = PIECE_KINDS.find(pieceKind =>
        self.reserveByKind[pieceKind] > 0);
      if (next) setKindState(next);
    }
    if (mode === 'move' && !self.queenPlaced) setModeState('place');
  }, [clearSelection, data.playerData, data.playerId, kind, mode]);

  return {
    panel,
    setPanel,
    mode,
    setMode,
    kind,
    setKind,
    selectedPieceID,
    selectPiece,
    pending,
    setPending,
    clearSelection,
    detailKind,
    detailPosition,
    openInsect,
    openStack,
    showMoves,
    setShowMoves,
    coordinates,
    setCoordinates,
    showResults,
    setShowResults,
  };
}
