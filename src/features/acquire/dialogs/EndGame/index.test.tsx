import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameSnapshot } from '../../model/session';
import { companyKeys } from '../../model/types';
import { EndGameDialog } from '.';

afterEach(cleanup);
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

function gameFixture(): GameSnapshot {
  return {
    type: 'ROOM_SYNC', roomID: 'room', visibility: 'public', phaseVersion: 3, turnNumber: 8,
    playerId: 'me-1', ownerID: 'me-1',
    playerData: {
      money: 6000, tiles: ['1A'],
      stocks: Object.fromEntries(companyKeys.map(company => [company, 0])),
    },
    roomData: {
      gameStatus: 'setTile', currentPlayer: 'me-1', currentStep: '', playerOrder: ['me-1'],
      players: {},
      companyInfo: Object.fromEntries(companyKeys.map(company => [company, {
        name: company, tiles: company === 'Tower' ? 41 : 0, stockPrice: 200, stockTotal: 25, valuation: '',
      }])),
      tiles: { '1A': { id: '1A', belong: '' } },
    },
    tempData: {
      last_tile_key: '', merge_main_company_temp: '',
      merge_selection_temp: { mainCompany: [], otherCompany: [] }, mergeSettleData: {},
    },
  } as unknown as GameSnapshot;
}

describe('Acquire end game dialog', () => {
  it('shows company eligibility, vote progress and submits both decisions', () => {
    const data = gameFixture();
    data.roomData.players = {
      'me-1': { playerID: 'me-1', name: 'Me', online: true, ai: false, ready: true },
      guest: { playerID: 'guest', name: 'Guest', online: false, ai: false, ready: true },
      bot: { playerID: 'bot', name: 'Bot', online: true, ai: true, ready: true },
    };
    data.roomData.endGame = {
      eligible: true, condition: 'company_size', company: 'Tower', tileCount: 41,
      votes: { 'me-1': true, guest: false, bot: true },
    };
    const onVote = vi.fn(() => true);
    const onClose = vi.fn();
    render(<EndGameDialog data={data} enabled pending={false} onClose={onClose} onVote={onVote} />);

    expect(screen.getByRole('heading', { name: '这座城，准备好落定了吗？' })).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(screen.getByText('1 位人机已默认同意')).toBeTruthy();
    expect(screen.getByText('已达到 41 块地的终局条件')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '继续对局' }));
    fireEvent.click(screen.getByRole('button', { name: /允许结束/ }));
    expect(onVote.mock.calls).toEqual([[false], [true]]);

    const calls = onVote.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: '关闭面板' }));
    expect(onVote).toHaveBeenCalledTimes(calls);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('shows the all-established-companies-safe condition', () => {
    const data = gameFixture();
    data.roomData.players = {
      'me-1': { playerID: 'me-1', online: true, ai: false, ready: true },
    };
    data.roomData.endGame = {
      eligible: true, condition: 'all_companies_safe', company: '', tileCount: 0,
      votes: { 'me-1': false },
    };
    render(<EndGameDialog data={data} enabled pending={false} onClose={vi.fn()} onVote={() => true} />);

    expect(screen.getByText('所有已成立公司')).toBeTruthy();
    expect(screen.getByText('均已达到至少 11 块地')).toBeTruthy();
  });
});
