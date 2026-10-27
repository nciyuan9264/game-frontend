import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { sameCell } from '../model/cards';
import { legalMovesFor } from '../model/selectors';
import type { GameSnapshot } from '../model/session';
import type {
  CardID,
  Cell,
} from '../model/types';

export type OnitamaPanel =
  | 'activity'
  | 'rules'
  | 'menu'
  | 'resign'
  | 'zoom';

export interface CardDetail {
  id: CardID;
  flipped: boolean;
}

export function useOnitamaPlayUI(data: GameSnapshot) {
  const [panel, setPanel] = useState<OnitamaPanel>();
  const [selectedCard, setSelectedCardState] = useState<CardID>();
  const [selectedPiece, setSelectedPieceState] = useState<string>();
  const [pendingTarget, setPendingTargetState] = useState<Cell>();
  const [cardDetail, setCardDetail] = useState<CardDetail>();
  const [showResults, setShowResults] = useState(
    data.roomData.gameStatus === 'end',
  );
  const selectionKey =
    `${data.matchID}:${data.seq}:${data.roomData.currentPlayer}`;

  const legalMoves = useMemo(
    () => legalMovesFor(data, selectedCard, selectedPiece),
    [data, selectedCard, selectedPiece],
  );
  const pendingMove = useMemo(
    () => legalMoves.find(move => sameCell(move.to, pendingTarget)),
    [legalMoves, pendingTarget],
  );

  const clearSelection = useCallback(() => {
    setSelectedCardState(undefined);
    setSelectedPieceState(undefined);
    setPendingTargetState(undefined);
  }, []);

  const selectCard = useCallback((value: CardID) => {
    setSelectedCardState(current => current === value ? undefined : value);
    setPendingTargetState(undefined);
  }, []);

  const selectPiece = useCallback((value: string) => {
    setSelectedPieceState(current => current === value ? undefined : value);
    setPendingTargetState(undefined);
  }, []);

  const selectTarget = useCallback((value: Cell) => {
    setPendingTargetState(current => sameCell(current, value) ? undefined : value);
  }, []);

  const inspectCard = useCallback((id: CardID, flipped = false) => {
    setCardDetail({ id, flipped });
  }, []);

  useEffect(() => {
    clearSelection();
  }, [clearSelection, selectionKey]);

  useEffect(() => {
    if (data.roomData.gameStatus === 'end') setShowResults(true);
  }, [data.roomData.gameStatus]);

  return {
    panel,
    setPanel,
    selectedCard,
    selectedPiece,
    pendingTarget,
    pendingMove,
    legalMoves,
    selectCard,
    selectPiece,
    selectTarget,
    clearSelection,
    cardDetail,
    setCardDetail,
    inspectCard,
    showResults,
    setShowResults,
  };
}
