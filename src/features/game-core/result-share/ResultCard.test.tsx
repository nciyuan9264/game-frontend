import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ResultCardModel } from './model';
import { ResultCard, RESULT_CARD_URL } from './ResultCard';

afterEach(cleanup);

function model(playerCount = 2): ResultCardModel {
  const players = Array.from({ length: playerCount }, (_, index) => ({
    displayName: index === 0 ? '一位昵称非常非常长的冠军玩家' : `玩家 ${index + 1}`,
    seatIndex: index,
    isAI: index === playerCount - 1,
    finalScore: 15 - index,
    finalStocks: 0,
    finalRank: index + 1,
    isWinner: index === 0,
    isSelf: index === 0,
  }));
  return {
    gameType: 'splendor',
    startedAt: '2026-11-02T10:00:00Z',
    endedAt: '2026-11-02T10:20:00Z',
    durationSeconds: 1200,
    players,
    self: players[0],
    outcome: 'win',
    winnerCount: 1,
  };
}

describe('ResultCard', () => {
  it('renders branded result content and a homepage QR code', () => {
    const { container } = render(<ResultCard model={model()} />);

    expect(screen.getByText('GAMEBUS')).toBeTruthy();
    expect(screen.getByText('board.gamebus.online')).toBeTruthy();
    expect(screen.getByText('赢下这一局')).toBeTruthy();
    const qr = container.querySelector('.ant-qrcode');
    expect(qr?.querySelector('svg')).toBeTruthy();
    expect(container.querySelector('[data-qr-value]')?.getAttribute('data-qr-value'))
      .toBe(RESULT_CARD_URL);
    expect(container.querySelector('img')).toBeNull();
  });

  it('switches ten-player standings to compact density', () => {
    const { container } = render(<ResultCard model={model(10)} />);
    expect(screen.getByText('10 位玩家')).toBeTruthy();
    expect(container.querySelector('[data-result-card]')?.className)
      .toMatch(/compact/);
  });
});
