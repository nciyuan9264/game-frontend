import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AcquireSession } from './useAcquireSession';
import { useAcquireInteraction } from './useAcquireInteraction';
import type { GameSnapshot } from '../model/session';
import { companyKeys } from '../model/types';

function createSession(phase: string = 'buyStock'): AcquireSession {
  return {
    snapshot: {
      type: 'ROOM_SYNC', roomID: 'room', phaseVersion: 2, playerId: 'me',
      playerData: { money: 6000, tiles: ['1A', '2A'], stocks: {} },
      roomData: {
        currentPlayer: 'me', gameStatus: phase, tiles: { '1A': { belong: '' }, '2A': { belong: '' } },
        companyInfo: Object.fromEntries(companyKeys.map(key => [key, { tiles: 2, stockTotal: 25, stockPrice: 200 }])),
      },
      tempData: { mergeSettleData: {}, merge_main_company_temp: 'Tower' },
    },
    connection: { status: 'connected' }, submit: vi.fn(() => true),
  } as unknown as AcquireSession;
}
describe('Acquire drafts', () => {
  it('retains a closed draft on repeated snapshots and reconnect, clears it for a new phase', () => {
    const session = createSession();
    const { result, rerender } = renderHook(({ value }) => useAcquireInteraction(value), { initialProps: { value: session } });
    act(() => result.current.changeBuy('Tower', 2));
    act(() => result.current.close());
    expect(result.current.panel).toBeUndefined();
    rerender({ value: { ...session, snapshot: structuredClone(session.snapshot) } });
    expect(result.current.panel).toBeUndefined();
    expect(result.current.draft.buy.Tower).toBe(2);
    rerender({ value: { ...session, connection: { ...session.connection, status: 'reconnecting' } } });
    expect(result.current.enabled).toBe(false);
    expect(result.current.draft.buy.Tower).toBe(2);
    rerender({ value: session });
    act(() => result.current.open());
    expect(result.current.draft.buy.Tower).toBe(2);
    expect(session.submit).not.toHaveBeenCalled();
    rerender({ value: { ...session, snapshot: { ...session.snapshot!, phaseVersion: 3 } } });
    expect(result.current.draft.buy).toEqual({});
  });
  it('preselects, switches and deselects without sending; prevents actions on another turn', () => {
    const session = createSession('setTile');
    const { result, rerender } = renderHook(({ value }) => useAcquireInteraction(value), { initialProps: { value: session } });
    act(() => result.current.selectTile('1A'));
    expect(result.current.draft.tile).toBe('1A');
    act(() => result.current.selectTile('2A'));
    expect(result.current.draft.tile).toBe('2A');
    act(() => result.current.selectTile('2A'));
    expect(result.current.draft.tile).toBeUndefined();
    expect(session.submit).not.toHaveBeenCalled();
    const game = session.snapshot as GameSnapshot;
    rerender({ value: { ...session, snapshot: { ...game, roomData: { ...game.roomData, currentPlayer: 'other' } } } });
    act(() => { result.current.selectTile('1A'); result.current.place(); });
    expect(session.submit).not.toHaveBeenCalled();
  });
  it('allows placing a tile between two safe companies', () => {
    const session = createSession('setTile');
    const data = session.snapshot as GameSnapshot;
    data.roomData.tiles = {
      '1A': { belong: '' }, '2A': { belong: 'Blank' }, '3A': { belong: 'Tower' },
      '1B': { belong: 'American' },
    } as never;
    data.roomData.companyInfo.Tower.tiles = 11;
    data.roomData.companyInfo.American.tiles = 11;
    const { result } = renderHook(() => useAcquireInteraction(session));

    act(() => result.current.selectTile('1A'));
    expect(result.current.draft.tile).toBe('1A');
  });
  it('selects an available company locally and submits only after confirmation', () => {
    const session = createSession('createCompany');
    const data = session.snapshot as GameSnapshot;
    data.roomData.companyInfo.Sackson.tiles = 0;
    const { result } = renderHook(() => useAcquireInteraction(session));

    act(() => result.current.selectCompany('Sackson'));
    expect(result.current.draft.company).toBe('Sackson');
    expect(session.submit).not.toHaveBeenCalled();

    act(() => result.current.selectCompany('Tower'));
    expect(result.current.draft.company).toBe('Sackson');
    act(() => result.current.submitCompany());
    expect(session.submit).toHaveBeenCalledWith('game_create_company', { company: 'Sackson' });
  });
  it('selects a surviving company locally and submits only after confirmation', () => {
    const session = createSession('mergingSelection');
    const data = session.snapshot as GameSnapshot;
    data.tempData.merge_selection_temp = { mainCompany: ['American', 'Tower'], otherCompany: [] };
    const { result } = renderHook(() => useAcquireInteraction(session));

    act(() => result.current.selectCompany('Tower'));
    expect(result.current.draft.company).toBe('Tower');
    expect(session.submit).not.toHaveBeenCalled();

    act(() => result.current.selectCompany('Festival'));
    expect(result.current.draft.company).toBe('Tower');
    act(() => result.current.submitSurvivor());
    expect(session.submit).toHaveBeenCalledWith('game_merging_selection', { mainCompany: 'Tower' });
  });
  it('auto-skips unaffordable stock once per phase, including after reconnect', () => {
    const session = createSession(), data = session.snapshot as GameSnapshot;
    data.playerData.money = 0;
    const { result, rerender } = renderHook(({ value }) => useAcquireInteraction(value), { initialProps: { value: session } });
    expect(result.current.autoSkippingBuy).toBe(true);
    expect(result.current.eligiblePanel).toBeUndefined();
    expect(result.current.panel).toBeUndefined();
    expect(session.submit).toHaveBeenCalledWith('game_buy_stock', { stocks: {} });
    expect(session.submit).toHaveBeenCalledTimes(1);
    rerender({ value: { ...session, connection: { ...session.connection, status: 'reconnecting' } } });
    rerender({ value: session });
    expect(session.submit).toHaveBeenCalledTimes(1);
  });
  it('opens the merger dialog when the server marks this player as a pending holder', () => {
    const session = createSession('mergingSettle');
    const data = session.snapshot as GameSnapshot;
    data.playerData.stocks.American = 3;
    data.tempData.mergeSettleData.American = { hoders: ['me'], dividends: { me: 3000 } };

    const { result } = renderHook(() => useAcquireInteraction(session));

    expect(result.current.eligiblePanel).toBe('merge');
    expect(result.current.panel).toBe('merge');
  });
  it('switches from merger actions to the waiting dialog after submission is acknowledged', () => {
    const session = createSession('mergingSettle');
    const data = session.snapshot as GameSnapshot;
    data.roomData.playerOrder = ['me', 'guest'];
    data.roomData.players = { me: { playerID: 'me' }, guest: { playerID: 'guest' } } as never;
    data.playerData.stocks.American = 4;
    data.tempData.mergeSettleData.American = { hoders: ['me', 'guest'], dividends: { me: 3000 } };
    const { result, rerender } = renderHook(({ value }) => useAcquireInteraction(value), { initialProps: { value: session } });
    expect(result.current.panel).toBe('merge');

    const next = structuredClone(data);
    next.tempData.mergeSettleData.American = {
      hoders: ['guest'], dividends: { me: 3000 },
      settled: { me: { holdingBefore: 4, sellAmount: 2, exchangeAmount: 2 } },
    };
    rerender({ value: { ...session, snapshot: next } });

    expect(result.current.eligiblePanel).toBe('merge-wait');
    expect(result.current.panel).toBe('merge-wait');
  });
});
