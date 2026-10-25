import data from '../data/fugitive-base-deck.json';
import type { Card } from './types';

export const DECK = data.cards.map(value => ({
  number: value.n,
  sprint: value.sprint ?? 0,
})) satisfies Card[];

export const DECK_SOURCE = data.source;
export const DECK_SOURCE_PAGE = data.sourcePage;

export const card = (number: number): Card => {
  const value = DECK.find(entry => entry.number === number);
  if (!value) throw new Error(`Unknown Fugitive card: ${number}`);
  return value;
};

export function deckCsv() {
  return '\uFEFFnumber,sprint,group,source\n'
    + data.cards.map(value =>
      `${value.n},${value.sprint ?? ''},${value.group},${DECK_SOURCE}`)
      .join('\n');
}
