export const rowLetters = ['A', 'B', 'C', 'D'] as const;

export function bullheads(card: number) {
  if (card === 55) return 7;
  if (card % 11 === 0) return 5;
  if (card % 10 === 0) return 3;
  if (card % 5 === 0) return 2;
  return 1;
}

export const rowPenalty = (cards: number[]) =>
  cards.reduce((total, card) => total + bullheads(card), 0);

export function targetRow(rows: number[][], card: number) {
  let best = -1;
  let tail = -1;
  rows.forEach((row, index) => {
    const current = row[row.length - 1];
    if (current < card && current > tail) {
      best = index;
      tail = current;
    }
  });
  return best;
}
