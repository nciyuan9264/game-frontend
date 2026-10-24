import type { Card } from '../../model/types';

export function computeInsertIndex(cards: Card[], newCard: Card) {
  const ordered = cards
    .filter(card => card.id !== newCard.id && (card.index ?? -1) >= 0)
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0));
  const index = ordered.findIndex(card => {
    if ((card.num ?? Number.POSITIVE_INFINITY) !== (newCard.num ?? Number.NEGATIVE_INFINITY)) {
      return (card.num ?? Number.POSITIVE_INFINITY) > (newCard.num ?? Number.NEGATIVE_INFINITY);
    }
    return newCard.color === 1 && card.color === 0;
  });
  return index === -1 ? ordered.length : index;
}

export function insertPendingCard(cards: Card[], cardID: string, index: number): Card[] {
  const pending = cards.find(card => card.id === cardID && (card.index ?? -1) < 0);
  const arranged = cards
    .filter(card => (card.index ?? -1) >= 0)
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0));
  if (!pending || index < 0 || index > arranged.length) return cards;

  const ordered = [...arranged];
  ordered.splice(index, 0, pending);
  const indexes = new Map(ordered.map((card, position) => [card.id, position]));
  return cards.map(card => indexes.has(card.id)
    ? { ...card, index: indexes.get(card.id) }
    : card);
}
