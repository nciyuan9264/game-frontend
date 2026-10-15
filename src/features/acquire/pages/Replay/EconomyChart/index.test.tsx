import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { GamePlayer, Snapshot } from '@/types/history';
import EconomyChart from '.';

const players: GamePlayer[] = [{
  id: 1,
  gameID: 1,
  userID: 7,
  playerID: 'me',
  seatIndex: 0,
  isAI: false,
  finalStocks: 0,
  isWinner: true,
  createdAt: '',
}];

function economySnapshot(seq: number, total: number): Snapshot {
  return {
    seq,
    totalEvents: 10,
    currentEvent: seq >= 0
      ? { seq, playerID: 'me', cmdType: 'game_place_tile', payload: {} }
      : undefined,
    roomData: {
      companyInfo: {},
      currentPlayer: 'me',
      gameStatus: 'setTile',
      tiles: {},
      players: { me: { playerID: 'me', online: true, ai: false } },
    },
    playersData: { me: { money: total, stocks: {}, tiles: [] } },
    result: { me: { money: total, stocks: 0, total } },
  };
}

afterEach(cleanup);

it('keeps existing x coordinates stable while progressive points are appended', () => {
  const initial = [
    economySnapshot(-1, 6000),
    economySnapshot(0, 6200),
  ];
  const view = render(<EconomyChart snapshots={initial} players={players}
    totalTurns={10} loadedCount={2} totalSnapshots={11} />);
  const firstPoints = view.container.querySelector('polyline')?.getAttribute('points')
    ?.split(' ').slice(0, 2).map(point => point.split(',')[0]);

  view.rerender(<EconomyChart snapshots={[
    ...initial,
    economySnapshot(1, 6400),
    economySnapshot(2, 6600),
  ]} players={players} totalTurns={10} loadedCount={4} totalSnapshots={11} />);
  const nextPoints = view.container.querySelector('polyline')?.getAttribute('points')
    ?.split(' ').slice(0, 2).map(point => point.split(',')[0]);

  expect(nextPoints).toEqual(firstPoints);
  expect(screen.getByText('36%')).toBeTruthy();
});

it('keeps partial data visible when loading is paused', () => {
  render(<EconomyChart snapshots={[economySnapshot(-1, 6000)]} players={players}
    totalTurns={10} loadedCount={1} totalSnapshots={11} paused />);
  expect(screen.getByText('加载已暂停')).toBeTruthy();
  expect(document.querySelector('polyline')).toBeTruthy();
});
