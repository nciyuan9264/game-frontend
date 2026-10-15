import { useCallback, useEffect, useRef, useState } from 'react';
import { actionPanel, buyPreview, canPlace, mergeCompanies, mergePreview, tilePreview } from '../model/selectors';
import { phaseKey, type BusinessPanel, type BuyDraft, type GameSnapshot, type MergeDraft } from '../model/session';
import { companyKeys, type Company } from '../model/types';
import type { AcquireSession } from './useAcquireSession';

interface Draft {
  key: string; tile?: string; company?: Company; buy: BuyDraft; merge: MergeDraft; panel?: BusinessPanel;
}
export function useAcquireInteraction(session: AcquireSession) {
  const data = session.snapshot?.type === 'ROOM_SYNC' ? session.snapshot : undefined;
  const phasePanel = actionPanel(data);
  const noStock = data && phasePanel === 'buy' && !companyKeys.some(company => {
    const item = data.roomData.companyInfo[company];
    return item.tiles > 0 && item.stockTotal > 0 && item.stockPrice <= data.playerData.money;
  });
  const eligiblePanel = noStock ? undefined : phasePanel;
  const key = phaseKey(data);
  const [draft, setDraft] = useState<Draft>({ key, buy: {}, merge: {}, panel: eligiblePanel });
  // Reset before children render; layout changes never own or reset this state.
  if (draft.key !== key) setDraft({ key, buy: {}, merge: {}, panel: eligiblePanel });
  const active = draft.key === key ? draft : { key, buy: {}, merge: {}, panel: eligiblePanel };
  const [openedFor, setOpenedFor] = useState('');
  const entitlement = `${key}:${eligiblePanel ?? ''}`;
  if (openedFor !== entitlement) {
    setOpenedFor(entitlement);
    if (draft.key === key) setDraft(value => ({ ...value, panel: eligiblePanel }));
  }
  const connected = session.connection.status === 'connected';
  const enabled = connected && !session.pending;
  const update = useCallback((patch: Partial<Draft>) => setDraft(value => ({ ...value, ...patch })), []);
  const selectTile = (tile: string) => {
    if (data && enabled && canPlace(data) && tilePreview(data, tile).valid)
      update({ tile: active.tile === tile ? undefined : tile });
  };
  const changeBuy = (company: Company, amount: number) => {
    if (!data || !enabled) return;
    const next = { ...active.buy, [company]: amount };
    if (buyPreview(data, next).valid) update({ buy: next });
  };
  const changeMerge = (company: Company, field: 'sell' | 'groups', amount: number) => {
    if (!data || !enabled) return;
    const next = { ...active.merge, [company]: { sell: active.merge[company]?.sell ?? 0, groups: active.merge[company]?.groups ?? 0, [field]: amount } };
    // Allow reducing a stale draft even if another holding still exceeds fresh inventory.
    if (mergePreview(data, next).valid || amount < (active.merge[company]?.[field] ?? 0)) update({ merge: next });
  };
  const selectCompany = (company: Company) => {
    if (!data || !enabled) return;
    const selectable = eligiblePanel === 'found'
      ? data.roomData.companyInfo[company].tiles === 0
      : eligiblePanel === 'survivor' && data.tempData.merge_selection_temp.mainCompany.includes(company);
    if (selectable) update({ company: active.company === company ? undefined : company });
  };
  const submitCompany = () => {
    const company = active.company;
    if (data && company && enabled && eligiblePanel === 'found' && data.roomData.companyInfo[company].tiles === 0)
      session.submit('game_create_company', { company });
  };
  const submitSurvivor = () => {
    const company = active.company;
    if (data && company && enabled && eligiblePanel === 'survivor'
      && data.tempData.merge_selection_temp.mainCompany.includes(company))
      session.submit('game_merging_selection', { mainCompany: company });
  };
  const submitBuy = (skip = false) => {
    if (!data || !enabled || eligiblePanel !== 'buy') return;
    const stocks = skip ? {} : active.buy;
    if (buyPreview(data, stocks).valid) session.submit('game_buy_stock', { stocks });
  };
  const skipped = useRef('');
  const { submit } = session;
  useEffect(() => {
    if (noStock && enabled && skipped.current !== key && submit('game_buy_stock', { stocks: {} })) skipped.current = key;
  }, [noStock, enabled, key, submit]);
  return {
    data, enabled, eligiblePanel, autoSkippingBuy: !!noStock, draft: active,
    panel: active.panel === eligiblePanel ? active.panel : undefined,
    open: () => update({ panel: eligiblePanel }), close: () => update({ panel: undefined }),
    selectTile, selectCompany, changeBuy, changeMerge, submitBuy, submitCompany, submitSurvivor,
    place: () => {
      if (data && enabled && canPlace(data) && active.tile && tilePreview(data, active.tile).valid)
        session.submit('game_place_tile', { tileKey: active.tile });
    },
    submitMerge: () => {
      if (data && enabled && eligiblePanel === 'merge' && mergePreview(data, active.merge).valid)
        session.submit('game_merging_settle', { actions: mergeCompanies(data).map(company => ({
          company, sellAmount: active.merge[company]?.sell ?? 0, exchangeAmount: (active.merge[company]?.groups ?? 0) * 2,
        })) });
    },
  };
}
export type AcquireInteraction = ReturnType<typeof useAcquireInteraction>;
export type LiveGame = GameSnapshot;
