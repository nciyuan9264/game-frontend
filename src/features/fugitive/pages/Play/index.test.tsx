import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { FugitiveSession } from '../../hooks/useFugitiveSession';
import type { GameSnapshot } from '../../model/session';
import { Play } from '.';

beforeAll(() => {
  HTMLElement.prototype.scrollTo = vi.fn();
});

const data: GameSnapshot = {
  schemaVersion: 2,
  type: 'ROOM_SYNC',
  roomID: 'fugitive-test',
  matchID: 'fugitive-test-r1',
  seq: 13,
  phaseVersion: 13,
  turnNumber: 13,
  ownerID: 'marshal',
  visibility: 'private',
  playerId: 'marshal',
  playerData: {
    marshal: { role: 'marshal', handCount: 2 },
    fugitive: { role: 'fugitive', handCount: 4 },
  },
  hand: [
    { number: 7, sprint: 1 },
    { number: 17, sprint: 2 },
  ],
  roomData: {
    currentPlayer: 'marshal',
    gameStatus: 'marshalSearch',
    roundNo: 1,
    drawsRemaining: 0,
    highestRevealed: 0,
    hiddenHideoutCount: 2,
    openingHideoutsPlaced: 2,
    route: [
      {
        index: 0,
        revealed: true,
        sprintCount: 0,
        card: { number: 0, sprint: 0 },
        sprints: [],
      },
      { index: 1, revealed: false, sprintCount: 0 },
      { index: 2, revealed: false, sprintCount: 1 },
    ],
    decks: [
      { deckIndex: 0, min: 4, max: 14, remaining: 7 },
      { deckIndex: 1, min: 15, max: 28, remaining: 11 },
      { deckIndex: 2, min: 29, max: 41, remaining: 13 },
    ],
    activityLog: [],
    players: {
      marshal: {
        playerID: 'marshal',
        displayName: '追捕者',
        online: true,
        ready: true,
        ai: false,
        seatIndex: 0,
        gameRole: 'marshal',
      },
      fugitive: {
        playerID: 'fugitive',
        displayName: '逃亡者',
        online: true,
        ready: true,
        ai: true,
        seatIndex: 1,
        gameRole: 'fugitive',
      },
    },
    playerOrder: ['marshal', 'fugitive'],
  },
};

function pendingSession(): FugitiveSession {
  return {
    connection: { status: 'connected' },
    pending: { type: 'game_draw_card' },
    feedback: '',
    submit: vi.fn(),
  } as unknown as FugitiveSession;
}

describe('Fugitive marshal search', () => {
  it('keeps local guess planning available while a command is pending', () => {
    render(<Play
      session={pendingSession()}
      data={data}
      roomName={data.roomID}
      onLeave={vi.fn()}
      onStartNextMatch={vi.fn()}
      startNextMatchPending={false}
    />);

    const dock = screen.getByTestId('fugitive-mobile-dock');
    const openNotebook = within(dock).getByRole('button', {
      name: '打开推理手册',
    });
    expect((openNotebook as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(openNotebook);

    const notebook = screen.getByRole('dialog', {
      name: '你的私密推理手册',
    });
    const number = within(notebook).getByRole('button', {
      name: '搜查号码 5',
    });
    fireEvent.click(number);
    expect(number.getAttribute('aria-pressed')).toBe('true');
    const submit = within(notebook).getByRole('button', {
      name: '搜查所选 1 处',
    });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
  });
});
