import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AcquireInteraction } from '../../hooks/useAcquireInteraction';
import type { GameSnapshot } from '../../model/session';
import { companyKeys } from '../../model/types';
import { Deadline, EndVoteControl, PhaseAction, PhaseBanner } from './parts';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Play phase actions', () => {
  it('shows and updates the phase countdown', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-14T14:00:00Z'));
    render(<Deadline deadline="2026-10-14T14:00:30Z" />);

    expect(screen.getByRole('timer', { name: '本阶段剩余 30 秒' }).textContent).toContain('30s');
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('timer', { name: '本阶段剩余 29 秒' }).textContent).toContain('29s');
  });

  it('renders the compact desktop command in the phase banner', () => {
    const data = {
      type: 'ROOM_SYNC', roomID: 'room', phaseVersion: 1, turnNumber: 1, playerId: 'me',
      playerData: { money: 6000, tiles: ['1A'], stocks: {} },
      roomData: {
        gameStatus: 'setTile', currentPlayer: 'me', playerOrder: ['me', 'guest'],
        players: {
          me: { playerID: 'me', name: 'Player', online: true, ai: false, ready: true },
          guest: { playerID: 'guest', name: 'Guest', online: true, ai: false, ready: true },
        },
        tiles: { '1A': { id: '1A', belong: '' } },
        companyInfo: Object.fromEntries(companyKeys.map(company => [company, {
          name: company, tiles: 0, stockPrice: 200, stockTotal: 25,
        }])),
      },
      tempData: { mergeSettleData: {}, merge_selection_temp: { mainCompany: [], otherCompany: [] } },
    } as unknown as GameSnapshot;
    const place = vi.fn();
    const interaction = {
      draft: { tile: '1A' },
      eligiblePanel: undefined,
      enabled: true,
      place,
    } as unknown as AcquireInteraction;

    render(<PhaseBanner data={data} interaction={interaction}
      action={<PhaseAction data={data} interaction={interaction} pending={false} buttonOnly />} />);

    expect(screen.queryByText('再次点选可取消，确认后才会落地。')).toBeNull();
    expect(screen.getByLabelText('当前行动玩家：Player').children).toHaveLength(1);
    expect(screen.queryByLabelText('对局玩家')).toBeNull();
    const mobileStatus = screen.getByRole('status');
    expect(within(mobileStatus).getByText('你的回合')).toBeTruthy();
    expect(within(mobileStatus).getByText('选择落地')).toBeTruthy();
    expect(mobileStatus.textContent).toContain('第 01 回合 · 点棋盘选地');
    expect(mobileStatus.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: '确认落地 1A' }));
    expect(place).toHaveBeenCalledTimes(1);
  });

  it('renders an accessible authoritative end vote switch and help action', () => {
    const data = {
      type: 'ROOM_SYNC', roomID: 'room', phaseVersion: 2, turnNumber: 8, playerId: 'me',
      roomData: {
        gameStatus: 'setTile',
        endGame: {
          eligible: true, condition: 'company_size', company: 'Tower', tileCount: 41, votes: { me: false },
        },
      },
    } as unknown as GameSnapshot;
    const onToggle = vi.fn();
    const onHelp = vi.fn();
    const { rerender } = render(<EndVoteControl data={data} enabled pending={false}
      onToggle={onToggle} onHelp={onHelp} />);

    const toggle = screen.getByRole('switch', { name: '允许结束游戏' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: '查看终局规则' }));
    expect(onHelp).toHaveBeenCalledTimes(1);

    data.roomData.endGame!.votes.me = true;
    rerender(<EndVoteControl data={data} enabled={false} pending onToggle={onToggle} onHelp={onHelp} />);
    expect(screen.getByRole('switch', { name: '允许结束游戏' }).getAttribute('aria-checked')).toBe('true');
    expect((screen.getByRole('switch', { name: '允许结束游戏' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('marks compact end controls for the shared mobile topbar sizing contract', () => {
    const data = {
      playerId: 'me',
      roomData: {
        gameStatus: 'setTile',
        endGame: {
          eligible: true, condition: 'company_size', company: 'Tower', tileCount: 41, votes: { me: false },
        },
      },
    } as unknown as GameSnapshot;

    render(<EndVoteControl data={data} enabled pending={false}
      onToggle={vi.fn()} onHelp={vi.fn()} variant="mobileTopbar" />);

    expect(screen.getByRole('switch', { name: '允许结束游戏' })
      .hasAttribute('data-game-mobile-topbar-control')).toBe(true);
    expect(screen.getByRole('button', { name: '查看终局规则' })
      .hasAttribute('data-game-mobile-topbar-control')).toBe(true);
  });
});
