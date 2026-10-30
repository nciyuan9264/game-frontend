import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AcquireInteraction } from '../../hooks/useAcquireInteraction';
import type { GameSnapshot } from '../../model/session';
import { companyKeys } from '../../model/types';
import { PlayDesktop } from './PlayDesktop';
import { PlayMobile } from './PlayMobile';

afterEach(cleanup);

function endedSnapshot(): GameSnapshot {
  return {
    playerId: 'me',
    playerData: {
      money: 6000,
      stocks: Object.fromEntries(companyKeys.map(company => [company, company === 'Tower' ? 2 : 0])),
      tiles: [],
    },
    roomData: {
      gameStatus: 'end',
      currentPlayer: 'me',
      playerOrder: ['me'],
      players: { me: { playerID: 'me', name: 'Player', online: true, ai: false, ready: true } },
      companyInfo: Object.fromEntries(companyKeys.map(company => [company, {
        name: company,
        tiles: company === 'Tower' ? 5 : 0,
        stockPrice: 500,
        stockTotal: 23,
      }])),
    },
  } as unknown as GameSnapshot;
}

describe('Play layouts', () => {
  it('keeps market and board without duplicating the hand controls below the desktop board', () => {
    const data = endedSnapshot();
    data.roomData.gameStatus = 'setTile';
    data.playerData.tiles = ['1A'];
    render(<PlayDesktop
      data={data}
      interaction={{} as AcquireInteraction}
      board={<div>BOARD CONTENT</div>}
      boardTools={<button type="button">放大棋盘</button>}
      activity={[]}
      pending={false}
      onCompany={vi.fn()}
      onActivity={vi.fn()}
    />);

    expect(screen.getByText('BOARD CONTENT')).toBeTruthy();
    expect(screen.queryByText('AT THE TABLE')).toBeNull();
    expect(screen.queryByText('我的地块')).toBeNull();
    expect(screen.getByText('我的持股')).toBeTruthy();
    expect(screen.getByText('公司行情')).toBeTruthy();
  });

  it('renders the mobile action below the board legend without a hand dock', () => {
    const data = endedSnapshot();
    data.roomData.gameStatus = 'setTile';
    data.playerData.tiles = ['1A'];
    const interaction = { draft: {}, enabled: true } as unknown as AcquireInteraction;
    const onCompany = vi.fn();
    const onActivity = vi.fn();
    render(<PlayMobile
      data={data}
      interaction={interaction}
      board={<div>BOARD CONTENT</div>}
      boardTools={<button type="button">放大棋盘</button>}
      activity={[]}
      pending={false}
      onCompany={onCompany}
      onActivity={onActivity}
    />);

    expect(screen.queryByText('我的地块')).toBeNull();
    expect(screen.queryByText('Player')).toBeNull();
    expect(screen.getByRole('table', { name: '公司行情与我的持股' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '我持股' })).toBeTruthy();
    expect(screen.getByLabelText('可用现金 $6,000')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '查看对局动态' }));
    expect(onActivity).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '股价速查' }));
    expect(onCompany).toHaveBeenCalledWith('Tower');
    const legendHelper = screen.getByText('点高亮地块选择');
    const actionRegion = legendHelper.parentElement?.nextElementSibling;
    expect(actionRegion).toBeTruthy();
    expect(within(actionRegion as HTMLElement).getByRole('button', { name: '先选择一块地' })).toBeTruthy();
  });

  it('renders the mobile results action immediately after the ended phase', () => {
    const onResults = vi.fn();
    render(<PlayMobile
      data={endedSnapshot()}
      interaction={{} as AcquireInteraction}
      board={<div>FINAL BOARD</div>}
      boardTools={<button type="button">放大棋盘</button>}
      activity={[]}
      pending={false}
      resultsAction={<button type="button" aria-label="查看本局结算" onClick={onResults}>查看结算</button>}
      onCompany={vi.fn()}
      onActivity={vi.fn()}
    />);

    fireEvent.click(screen.getByRole('button', { name: '查看本局结算' }));
    expect(onResults).toHaveBeenCalledTimes(1);
    expect(screen.getByText('FINAL BOARD')).toBeTruthy();
    expect(screen.queryByLabelText('可用现金 $6,000')).toBeNull();
  });
});
