import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AcquireInteraction } from '../../hooks/useAcquireInteraction';
import type { AcquireSession } from '../../hooks/useAcquireSession';
import type { GameSnapshot } from '../../model/session';
import { companyKeys } from '../../model/types';
import { Play } from '.';
import styles from './index.module.less';

const fitMock = vi.hoisted(() => ({
  fitLevel: 0,
  enabled: false,
}));

vi.mock('./useMobilePlayFit', () => ({
  useMobilePlayFit: (enabled: boolean) => {
    fitMock.enabled = enabled;
    return { containerRef: { current: null }, fitLevel: enabled ? fitMock.fitLevel : 0 };
  },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
beforeEach(() => {
  fitMock.fitLevel = 0;
  fitMock.enabled = false;
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

function snapshot(status: 'setTile' | 'end'): GameSnapshot {
  return {
    type: 'ROOM_SYNC', roomID: 'room', phaseVersion: status === 'end' ? 2 : 1, turnNumber: 1,
    playerId: 'me', ownerID: 'me', visibility: 'public',
    playerData: { money: 6000, tiles: ['1A'], stocks: Object.fromEntries(companyKeys.map(company => [company, 0])) },
    roomData: {
      gameStatus: status, currentPlayer: 'me', currentStep: '', playerOrder: ['me'],
      players: { me: { playerID: 'me', name: 'Player', online: true, ai: false, ready: true } },
      companyInfo: Object.fromEntries(companyKeys.map(company => [company, {
        name: company, tiles: company === 'Tower' ? 41 : 0, stockPrice: 200, stockTotal: 25, valuation: '',
      }])),
      tiles: { '1A': { id: '1A', belong: '' } },
    },
    tempData: { last_tile_key: '', merge_main_company_temp: '', merge_selection_temp: { mainCompany: [], otherCompany: [] }, mergeSettleData: {} },
    result: status === 'end' ? { me: { money: 6000, stocks: 0, total: 6000 } } : undefined,
  } as unknown as GameSnapshot;
}

describe('Acquire play end transition', () => {
  it('shows the countdown only to the timed player, including merger settlement', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T10:00:00Z'));
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const active = snapshot('setTile');
    active.roomData.turnDeadline = '2026-10-25T10:00:30Z';
    active.roomData.playerOrder = ['me', 'guest'];
    active.roomData.players.guest = {
      playerID: 'guest', name: 'Guest', online: true, ai: false, ready: true,
    };
    const session = { pending: undefined, activity: [], submit: vi.fn() } as unknown as AcquireSession;
    const interaction = {
      data: active, draft: { key: 'room:1', buy: {}, merge: {} },
      enabled: true, eligiblePanel: undefined, panel: undefined,
      selectTile: vi.fn(), place: vi.fn(),
    } as unknown as AcquireInteraction;

    const { rerender } = render(<Play data={active} session={session} interaction={interaction} onLeave={vi.fn()} />);
    expect(screen.getAllByRole('timer', {
      name: '本阶段剩余 30 秒',
    })).toHaveLength(2);

    active.roomData.currentPlayer = 'guest';
    rerender(<Play data={active} session={session} interaction={interaction} onLeave={vi.fn()} />);
    expect(screen.queryByRole('timer')).toBeNull();

    active.roomData.gameStatus = 'mergingSettle';
    active.roomData.currentPlayer = 'me';
    active.tempData.merge_settle_current_player = 'guest';
    rerender(<Play data={active} session={session} interaction={interaction} onLeave={vi.fn()} />);
    expect(screen.queryByRole('timer')).toBeNull();

    active.tempData.merge_settle_current_player = 'me';
    rerender(<Play data={active} session={session} interaction={interaction} onLeave={vi.fn()} />);
    expect(screen.getAllByRole('timer', {
      name: '本阶段剩余 30 秒',
    })).toHaveLength(2);
  });

  it('opens the results page automatically when the server snapshot enters end', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const active = snapshot('setTile');
    const ended = snapshot('end');
    const session = { pending: undefined, activity: [], submit: vi.fn() } as unknown as AcquireSession;
    const interaction = (data: GameSnapshot) => ({
      data, draft: { key: `room:${data.phaseVersion}`, buy: {}, merge: {} },
      enabled: true, eligiblePanel: undefined, panel: undefined,
      selectTile: vi.fn(), place: vi.fn(),
    }) as unknown as AcquireInteraction;

    const { rerender } = render(<Play data={active} session={session} interaction={interaction(active)} onLeave={vi.fn()} />);
    expect(screen.getByRole('group', { name: '12 列 9 行，共 108 块地' })).toBeTruthy();

    rerender(<Play data={ended} session={session} interaction={interaction(ended)} onLeave={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '一城落定，好局未完。' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: '12 列 9 行，共 108 块地' })).toBeNull();
  });

  it('keeps a visible mobile results action after returning to the final board', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const ended = snapshot('end');
    const session = { pending: undefined, activity: [], submit: vi.fn() } as unknown as AcquireSession;
    const interaction = {
      data: ended, draft: { key: 'room:2', buy: {}, merge: {} },
      enabled: true, eligiblePanel: undefined, panel: undefined,
      selectTile: vi.fn(), place: vi.fn(),
    } as unknown as AcquireInteraction;

    const { container } = render(<Play data={ended} session={session} interaction={interaction} onLeave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '查看终局棋盘' }));

    const resultsButton = screen.getByRole('button', { name: '查看本局结算' });
    const topbar = container.querySelector('[data-game-mobile-topbar]');
    expect(topbar).toBeTruthy();
    expect(within(topbar as HTMLElement).queryByRole('button', { name: '股价速查' })).toBeNull();
    expect(within(topbar as HTMLElement).queryByRole('button', { name: '查看本局结算' })).toBeNull();
    fireEvent.click(resultsButton);
    expect(screen.getByRole('heading', { name: '一城落定，好局未完。' })).toBeTruthy();
  });

  it('moves the end vote controls into the mobile topbar without duplicate phase actions', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const active = snapshot('setTile');
    active.roomData.endGame = {
      eligible: true, condition: 'company_size', company: 'Tower', tileCount: 41, votes: { me: false },
    };
    const session = { pending: undefined, activity: [], submit: vi.fn() } as unknown as AcquireSession;
    const interaction = {
      data: active, draft: { key: 'room:1', buy: {}, merge: {} },
      enabled: true, eligiblePanel: undefined, panel: undefined,
      selectTile: vi.fn(), place: vi.fn(),
    } as unknown as AcquireInteraction;

    const { container } = render(<Play data={active} session={session} interaction={interaction} onLeave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '关闭面板' }));

    const topbar = container.querySelector('[data-game-mobile-topbar]');
    expect(topbar).toBeTruthy();
    expect(screen.getAllByRole('group', { name: '终局确认' })).toHaveLength(1);
    expect(within(topbar as HTMLElement).getByRole('switch', { name: '允许结束游戏' })).toBeTruthy();
    expect(within(topbar as HTMLElement).getByRole('button', { name: '查看终局规则' })).toBeTruthy();
    expect(within(topbar as HTMLElement).queryByRole('button', { name: '股价速查' })).toBeNull();
  });

  it('opens the end prompt once and submits the authoritative switch value', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const active = snapshot('setTile');
    active.roomData.endGame = {
      eligible: true, condition: 'company_size', company: 'Tower', tileCount: 41, votes: { me: false },
    };
    const submit = vi.fn(() => true);
    const session = { pending: undefined, activity: [], submit } as unknown as AcquireSession;
    const interaction = {
      data: active, draft: { key: 'room:1', buy: {}, merge: {} },
      enabled: true, eligiblePanel: undefined, panel: undefined,
      selectTile: vi.fn(), place: vi.fn(),
    } as unknown as AcquireInteraction;

    render(<Play data={active} session={session} interaction={interaction} onLeave={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '这座城，准备好落定了吗？' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '关闭面板' }));
    expect(screen.queryByRole('heading', { name: '这座城，准备好落定了吗？' })).toBeNull();

    fireEvent.click(screen.getByRole('switch', { name: '允许结束游戏' }));
    expect(submit).toHaveBeenCalledWith('game_end_vote', { allow: true });
    fireEvent.click(screen.getByRole('button', { name: '查看终局规则' }));
    expect(screen.getByRole('heading', { name: '这座城，准备好落定了吗？' })).toBeTruthy();
  });

  it('waits for the required business panel before auto-opening the end prompt', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const active = snapshot('setTile');
    active.roomData.endGame = {
      eligible: true, condition: 'all_companies_safe', company: '', tileCount: 0, votes: { me: false },
    };
    const session = { pending: undefined, activity: [], submit: vi.fn() } as unknown as AcquireSession;
    const makeInteraction = (panel?: 'buy') => ({
      data: active, draft: { key: 'room:1', buy: {}, merge: {}, panel },
      enabled: true, eligiblePanel: panel, panel,
      selectTile: vi.fn(), place: vi.fn(), close: vi.fn(), submitBuy: vi.fn(), changeBuy: vi.fn(),
    }) as unknown as AcquireInteraction;

    const { rerender } = render(<Play data={active} session={session}
      interaction={makeInteraction('buy')} onLeave={vi.fn()} />);
    expect(screen.queryByRole('heading', { name: '这座城，准备好落定了吗？' })).toBeNull();

    rerender(<Play data={active} session={session} interaction={makeInteraction()} onLeave={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '这座城，准备好落定了吗？' })).toBeTruthy();
  });

  it('applies short-screen fit classes only in mobile mode', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    fitMock.fitLevel = 2;
    const active = snapshot('setTile');
    const session = { pending: undefined, activity: [], submit: vi.fn() } as unknown as AcquireSession;
    const interaction = {
      data: active, draft: { key: 'room:1', buy: {}, merge: {} },
      enabled: true, eligiblePanel: undefined, panel: undefined,
      selectTile: vi.fn(), place: vi.fn(),
    } as unknown as AcquireInteraction;

    const { container } = render(<Play data={active} session={session} interaction={interaction} onLeave={vi.fn()} />);
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).toContain(styles.playFitRoot);
    expect(root.className).toContain(styles.fitHideBoardHeading);
    expect(root.className).toContain(styles.fitCompactMarket);
    expect(root.className).not.toContain(styles.fitCompactPhase);
    expect(fitMock.enabled).toBe(true);
  });

  it('does not apply mobile fit classes on desktop', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    fitMock.fitLevel = 3;
    const active = snapshot('setTile');
    const session = { pending: undefined, activity: [], submit: vi.fn() } as unknown as AcquireSession;
    const interaction = {
      data: active, draft: { key: 'room:1', buy: {}, merge: {} },
      enabled: true, eligiblePanel: undefined, panel: undefined,
      selectTile: vi.fn(), place: vi.fn(),
    } as unknown as AcquireInteraction;

    const { container } = render(<Play data={active} session={session} interaction={interaction} onLeave={vi.fn()} />);
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).toContain(styles.playFitRoot);
    expect(root.className).not.toContain(styles.fitHideBoardHeading);
    expect(root.className).not.toContain(styles.fitCompactMarket);
    expect(root.className).not.toContain(styles.fitCompactPhase);
    expect(fitMock.enabled).toBe(false);
  });
});
