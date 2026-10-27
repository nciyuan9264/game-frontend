import { useEffect, useMemo, useState } from 'react';
import type { LoveLetterCard } from '@/api/generated/game-platform';
import type { LoveLetterSession } from './useLoveLetterSession';
import { phaseKey, type GameSnapshot } from '../model/session';

export type LoveLetterPanel =
  | 'action'
  | 'clues'
  | 'log'
  | 'reference'
  | 'player'
  | 'private'
  | 'chancellor'
  | undefined;

export function useLoveLetterPlayUI(
  session: LoveLetterSession,
  data: GameSnapshot,
) {
  const [selectedCardID, setSelectedCardID] = useState('');
  const [targetPlayerID, setTargetPlayerID] = useState('');
  const [guessRank, setGuessRank] = useState<number>();
  const [panel, setPanel] = useState<LoveLetterPanel>();
  const [playerID, setPlayerID] = useState('');
  const [keepCardID, setKeepCardID] = useState('');
  const [reverseBottom, setReverseBottom] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [seenEffectID, setSeenEffectID] = useState('');

  const hand = data.privateData.hand ?? [];
  const selectedCard = hand.find(card => card.cardID === selectedCardID);
  const legalTargets = selectedCardID
    ? data.privateData.legalTargets[selectedCardID] ?? []
    : [];
  const requiresTarget = !!selectedCard
    && [1, 2, 3, 5, 7].includes(selectedCard.rank)
    && legalTargets.length > 0;
  const canSubmit = !!selectedCard
    && data.privateData.legalCardIDs.includes(selectedCard.cardID)
    && (!requiresTarget || legalTargets.includes(targetPlayerID))
    && (selectedCard.rank !== 1 || !legalTargets.length || guessRank != null);
  const bottomCards = useMemo(() => {
    const cards = hand.filter(card => card.cardID !== keepCardID);
    return reverseBottom ? [...cards].reverse() : cards;
  }, [hand, keepCardID, reverseBottom]);

  useEffect(() => {
    setSelectedCardID('');
    setTargetPlayerID('');
    setGuessRank(undefined);
    setPanel(undefined);
    setKeepCardID('');
    setReverseBottom(false);
  }, [phaseKey(data)]);

  useEffect(() => {
    const effectID = data.privateData.effect?.effectID;
    if (!effectID || effectID === seenEffectID) return;
    setSeenEffectID(effectID);
    setPanel('private');
  }, [data.privateData.effect?.effectID, seenEffectID]);

  useEffect(() => {
    if (data.roomData.gameStatus === 'chancellor'
      && data.roomData.currentPlayer === data.playerId) {
      setPanel('chancellor');
    }
  }, [data.playerId, data.roomData.currentPlayer, data.roomData.gameStatus]);

  const chooseCard = (card: LoveLetterCard, openPanel: boolean) => {
    if (!data.privateData.legalCardIDs.includes(card.cardID)) return;
    setSelectedCardID(card.cardID);
    setTargetPlayerID('');
    setGuessRank(undefined);
    if (openPanel) setPanel('action');
  };
  const clearSelection = () => {
    setSelectedCardID('');
    setTargetPlayerID('');
    setGuessRank(undefined);
    setPanel(undefined);
  };
  const submitCard = () => {
    if (!selectedCard || !canSubmit) return false;
    const submitted = session.submit('game_play_card', {
      cardID: selectedCard.cardID,
      targetPlayerID: targetPlayerID || undefined,
      guessRank,
    });
    if (submitted) clearSelection();
    return submitted;
  };
  const settleChancellor = () => {
    if (!keepCardID) return false;
    const submitted = session.submit('game_settle_chancellor', {
      keepCardID,
      bottomCardIDs: bottomCards.map(card => card.cardID),
    });
    if (submitted) setPanel(undefined);
    return submitted;
  };

  return {
    panel,
    setPanel,
    playerID,
    openPlayer: (nextPlayerID: string) => {
      setPlayerID(nextPlayerID);
      setPanel('player');
    },
    selectedCard,
    selectedCardID,
    targetPlayerID,
    setTargetPlayerID: (value: string) => {
      setTargetPlayerID(value);
      setGuessRank(undefined);
    },
    guessRank,
    setGuessRank,
    legalTargets,
    requiresTarget,
    canSubmit,
    chooseCard,
    clearSelection,
    submitCard,
    keepCardID,
    setKeepCardID: (value: string) => {
      setKeepCardID(value);
      setReverseBottom(false);
    },
    bottomCards,
    reverseBottom,
    setReverseBottom,
    settleChancellor,
    reviewing,
    setReviewing,
  };
}
