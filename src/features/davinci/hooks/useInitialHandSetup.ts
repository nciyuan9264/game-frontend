import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { insertPendingCard } from '../components/GameCanvas/layout';
import type { Card, GameStatus } from '../model/types';

function cloneCards(cards: Card[]) {
  return cards.map(card => ({ ...card }));
}

export function useInitialHandSetup({
  matchID,
  status,
  cards,
  ready,
}: {
  matchID: string;
  status: GameStatus;
  cards: Card[];
  ready: boolean;
}) {
  const setupKey = status === 'initialize' ? `${matchID}:initialize` : '';
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const [local, setLocal] = useState(() => ({
    key: setupKey,
    cards: cloneCards(cards),
  }));

  useEffect(() => {
    if (!setupKey) return;
    setLocal(current => current.key === setupKey
      ? current
      : { key: setupKey, cards: cloneCards(cardsRef.current) });
  }, [setupKey]);

  const draft = setupKey && local.key === setupKey ? local.cards : cards;
  const pendingJokers = useMemo(
    () => draft.filter(card => card.num === -1 && (card.index ?? -1) < 0),
    [draft],
  );
  const activeJoker = pendingJokers[0];

  const placeJoker = useCallback((index: number, cardID?: string) => {
    if (!setupKey || ready || !cardID) return;
    setLocal(current => {
      const source = current.key === setupKey ? current.cards : cloneCards(cardsRef.current);
      const pending = source.find(card => card.num === -1 && (card.index ?? -1) < 0);
      if (!pending || pending.id !== cardID) return current;
      return {
        key: setupKey,
        cards: insertPendingCard(source, cardID, index),
      };
    });
  }, [ready, setupKey]);

  const jokerPlacements = useMemo(() => draft
    .filter(card => card.num === -1 && (card.index ?? -1) >= 0)
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
    .map(card => ({ id: card.id, index: card.index ?? 0 })), [draft]);

  return {
    cards: draft,
    activeJoker,
    pendingJokers,
    jokerPlacements,
    canConfirm: status === 'initialize' && !ready && pendingJokers.length === 0,
    placeJoker,
  };
}
