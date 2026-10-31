import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DevelopmentCard } from '../../model/types';
import { DevelopmentCardView } from '.';
import styles from './index.module.less';

const card: DevelopmentCard = {
  id: 1,
  level: 1,
  bonus: 'Blue',
  points: 0,
  cost: { Red: 1 },
  state: 1,
};

describe('DevelopmentCardView', () => {
  it('only renders card points when the card grants prestige', () => {
    const { container, rerender } = render(<DevelopmentCardView card={card} />);

    expect(container.querySelector(`.${styles.cardPoints}`)).toBeNull();

    rerender(<DevelopmentCardView card={{ ...card, points: 1 }} />);
    expect(container.querySelector(`.${styles.cardPoints}`)?.textContent).toBe('1');
  });
});
