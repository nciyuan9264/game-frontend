import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AcquireInteraction } from '../../hooks/useAcquireInteraction';
import type { AcquireSession } from '../../hooks/useAcquireSession';
import type { GameSnapshot } from '../../model/session';
import { companyKeys, type Company } from '../../model/types';
import { TradeDialog } from '.';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mergeSnapshot(): GameSnapshot {
  return {
    playerId: 'me',
    playerData: {
      money: 6000,
      stocks: Object.fromEntries(companyKeys.map(company => [company, company === 'American' ? 3 : company === 'Festival' ? 4 : 0])),
      tiles: [],
    },
    roomData: {
      gameStatus: 'mergingSettle',
      companyInfo: Object.fromEntries(companyKeys.map(company => [company, {
        name: company,
        tiles: company === 'American' || company === 'Tower' || company === 'Festival' ? 4 : 0,
        stockPrice: 400,
        stockTotal: 25,
      }])),
      playerOrder: ['me', 'guest'],
      players: {
        me: { playerID: 'me', name: 'WZY', online: true, ai: false, ready: true },
        guest: { playerID: 'guest', name: 'Guest', online: true, ai: false, ready: true },
      },
    },
    tempData: {
      merge_main_company_temp: 'Tower',
      merge_settle_current_player: 'me',
      merge_selection_temp: { mainCompany: [], otherCompany: [] },
      mergeSettleData: {
        American: { hoders: ['me'], dividends: { me: 4000, guest: 2000 } },
        Festival: { hoders: ['me'], dividends: { me: 3000 } },
      },
    },
  } as unknown as GameSnapshot;
}

describe('TradeDialog merger state', () => {
  it('renders icons and actions for multiple acquired companies', () => {
    const data = mergeSnapshot();
    const interaction = {
      data,
      panel: 'merge',
      draft: { key: 'room:4', buy: {}, merge: {}, panel: 'merge' },
      enabled: true,
      close: vi.fn(),
      changeMerge: vi.fn(),
      submitMerge: vi.fn(),
    } as unknown as AcquireInteraction;
    const session = { pending: undefined, feedback: '' } as unknown as AcquireSession;

    render(<TradeDialog interaction={interaction} session={session} />);

    expect(screen.getByText('多家公司，一次新的机会。')).toBeTruthy();
    expect(screen.getAllByText('当前股价 $400 / 股')).toHaveLength(3);
    expect(screen.queryByText('并入 Tower')).toBeNull();
    const dividends = screen.getByRole('region', { name: '股东奖励明细', hidden: true });
    expect(within(dividends).getByText('Guest')).toBeTruthy();
    expect(within(dividends).getByText('+$2,000')).toBeTruthy();
    expect(screen.getByRole('button', { name: '确认股票处理', hidden: true })).toBeTruthy();
  });
  it('renders the submitted receipt while another shareholder is pending', () => {
    const data = mergeSnapshot();
    data.tempData.mergeSettleData.American = {
      hoders: ['guest'], dividends: { me: 4000 },
      settled: { me: { holdingBefore: 3, sellAmount: 1, exchangeAmount: 2 } },
    };
    data.tempData.mergeSettleData.Festival = {
      hoders: [], dividends: { me: 3000 },
      settled: { me: { holdingBefore: 4, sellAmount: 0, exchangeAmount: 2 } },
    };
    data.tempData.merge_settle_current_player = 'guest';
    const interaction = {
      data,
      panel: 'merge-wait',
      draft: { key: 'room:4', buy: {}, merge: {}, panel: 'merge-wait' },
      enabled: true,
      close: vi.fn(),
    } as unknown as AcquireInteraction;
    const session = { pending: undefined, feedback: '' } as unknown as AcquireSession;

    render(<TradeDialog interaction={interaction} session={session} />);

    expect(screen.getByText('你的选择已确认，等待其他股东。')).toBeTruthy();
    expect(screen.getByText('American + Festival → Tower')).toBeTruthy();
    expect(screen.getByText('卖出旧股')).toBeTruthy();
    expect(screen.getByText('兑换新股')).toBeTruthy();
    expect(screen.getByText('保留旧股')).toBeTruthy();
    const receipt = screen.getByText('保留旧股').closest('div');
    expect(receipt?.textContent).toContain('2 股');
    expect(screen.getByRole('region', { name: '股东奖励明细', hidden: true })).toBeTruthy();
    expect(screen.getByText('已完成')).toBeTruthy();
    expect(screen.getByText('处理中')).toBeTruthy();
  });
  it('renders a waiting state before this shareholder turn', () => {
    const data = mergeSnapshot();
    data.tempData.merge_settle_current_player = 'guest';
    data.tempData.mergeSettleData.American.hoders = ['me', 'guest'];
    const interaction = {
      data,
      panel: 'merge-wait',
      draft: { key: 'room:4', buy: {}, merge: {}, panel: 'merge-wait' },
      enabled: true,
      close: vi.fn(),
    } as unknown as AcquireInteraction;
    const session = { pending: undefined, feedback: '' } as unknown as AcquireSession;

    render(<TradeDialog interaction={interaction} session={session} />);

    expect(screen.getByText('尚未轮到你')).toBeTruthy();
    expect(screen.getByText('等待中')).toBeTruthy();
    expect(screen.queryByText('卖出旧股')).toBeNull();
  });
  it('shows a read-only settlement checklist to a non-shareholder', () => {
    const data = mergeSnapshot();
    data.playerId = 'observer';
    data.roomData.playerOrder = ['me', 'guest', 'observer'];
    data.roomData.players.observer = { playerID: 'observer', name: 'Observer', online: true, ai: false, ready: true } as never;
    data.tempData.merge_settle_current_player = 'guest';
    data.tempData.mergeSettleData.American.hoders = ['guest'];
    data.tempData.mergeSettleData.Festival.hoders = [];
    const interaction = {
      data,
      panel: 'merge-wait',
      draft: { key: 'room:4', buy: {}, merge: {}, panel: 'merge-wait' },
      enabled: true,
      close: vi.fn(),
    } as unknown as AcquireInteraction;
    const session = { pending: undefined, feedback: '' } as unknown as AcquireSession;

    render(<TradeDialog interaction={interaction} session={session} />);

    expect(screen.getByText('并购结算清单')).toBeTruthy();
    expect(screen.getByText('处理中')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '确认股票处理', hidden: true })).toBeNull();
  });
});

describe('TradeDialog company founding', () => {
  it('shows the placed tile and selects an available company without submitting', () => {
    const data = mergeSnapshot();
    data.roomData.gameStatus = 'createCompany';
    data.roomData.currentPlayer = 'me';
    data.tempData.last_tile_key = '9D';
    const interaction = {
      data,
      panel: 'found',
      draft: { key: 'room:5', buy: {}, merge: {}, panel: 'found' },
      enabled: true,
      close: vi.fn(),
      selectCompany: vi.fn(),
      submitCompany: vi.fn(),
    } as unknown as AcquireInteraction;
    const session = { pending: undefined, feedback: '' } as unknown as AcquireSession;

    render(<TradeDialog interaction={interaction} session={session} />);

    expect(screen.getByText('9D')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^创建 /, hidden: true })).toHaveLength(7);
    expect((screen.getByRole('button', { name: '创建 American', hidden: true }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '创建 Sackson', hidden: true }));
    expect(interaction.selectCompany).toHaveBeenCalledWith('Sackson');
    expect(interaction.submitCompany).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: '确认创建公司', hidden: true }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('confirms the selected company explicitly', () => {
    const data = mergeSnapshot();
    data.roomData.gameStatus = 'createCompany';
    data.roomData.currentPlayer = 'me';
    const interaction = {
      data,
      panel: 'found',
      draft: { key: 'room:5', company: 'Sackson', buy: {}, merge: {}, panel: 'found' },
      enabled: true,
      close: vi.fn(),
      selectCompany: vi.fn(),
      submitCompany: vi.fn(),
    } as unknown as AcquireInteraction;
    const session = { pending: undefined, feedback: '' } as unknown as AcquireSession;

    render(<TradeDialog interaction={interaction} session={session} />);
    fireEvent.click(screen.getByRole('button', { name: '确认创建公司', hidden: true }));

    expect(interaction.submitCompany).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Sackson · 创始奖励 1 股')).toBeTruthy();
    expect(screen.getByText(/你将获得 1 股创始奖励/)).toBeTruthy();
  });
});

describe('TradeDialog quantity controls', () => {
  it('updates an interactive quantity immediately without an interpolated frame', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    const data = mergeSnapshot();
    data.roomData.gameStatus = 'buyStock';
    data.roomData.currentPlayer = 'me';
    const session = { pending: undefined, feedback: '' } as unknown as AcquireSession;
    function BuyHarness() {
      const [amount, setAmount] = useState(0);
      const interaction = {
        data,
        panel: 'buy',
        draft: { key: 'room:7', buy: { American: amount }, merge: {}, panel: 'buy' },
        enabled: true,
        close: vi.fn(),
        changeBuy: (_company: Company, next: number) => setAmount(next),
        submitBuy: vi.fn(),
      } as unknown as AcquireInteraction;
      return <TradeDialog interaction={interaction} session={session} />;
    }

    render(<BuyHarness />);
    expect(screen.queryByText(/家公司尚未成立/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '增加American 买入股数', hidden: true }));

    expect(screen.getByRole('status', { name: 'American 买入股数', hidden: true }).textContent).toBe('1');
  });
});

describe('TradeDialog surviving company selection', () => {
  it('selects a company without submitting and keeps confirmation disabled until state updates', () => {
    const data = mergeSnapshot();
    data.roomData.gameStatus = 'mergingSelection';
    data.roomData.currentPlayer = 'me';
    data.tempData.merge_selection_temp.mainCompany = ['American', 'Tower'];
    const interaction = {
      data,
      panel: 'survivor',
      draft: { key: 'room:6', buy: {}, merge: {}, panel: 'survivor' },
      enabled: true,
      close: vi.fn(),
      selectCompany: vi.fn(),
      submitSurvivor: vi.fn(),
    } as unknown as AcquireInteraction;
    const session = { pending: undefined, feedback: '' } as unknown as AcquireSession;

    render(<TradeDialog interaction={interaction} session={session} />);
    fireEvent.click(screen.getByRole('button', { name: '保留 Tower', hidden: true }));

    expect(interaction.selectCompany).toHaveBeenCalledWith('Tower');
    expect(interaction.submitSurvivor).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: '确认存续公司', hidden: true }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByText('作为存续公司')).toHaveLength(2);
  });

  it('submits the selected surviving company only after confirmation', () => {
    const data = mergeSnapshot();
    data.roomData.gameStatus = 'mergingSelection';
    data.roomData.currentPlayer = 'me';
    data.tempData.merge_selection_temp.mainCompany = ['American', 'Tower'];
    const interaction = {
      data,
      panel: 'survivor',
      draft: { key: 'room:6', company: 'Tower', buy: {}, merge: {}, panel: 'survivor' },
      enabled: true,
      close: vi.fn(),
      selectCompany: vi.fn(),
      submitSurvivor: vi.fn(),
    } as unknown as AcquireInteraction;
    const session = { pending: undefined, feedback: '' } as unknown as AcquireSession;

    render(<TradeDialog interaction={interaction} session={session} />);
    fireEvent.click(screen.getByRole('button', { name: '确认存续公司', hidden: true }));

    expect(interaction.submitSurvivor).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '保留 Tower', hidden: true }).getAttribute('aria-pressed')).toBe('true');
  });
});
