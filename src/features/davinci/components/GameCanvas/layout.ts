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
