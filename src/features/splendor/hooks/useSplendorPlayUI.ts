import { useCallback, useEffect, useRef, useState } from 'react';
import { lastActionCopy, toggleGemSelection } from '../model/selectors';
import type { GameSnapshot } from '../model/session';
import type { CardColor, GemCounts } from '../model/types';

export type PlayPanel = 'card' | 'return' | 'collection' | 'noble' | 'activity' | 'rules';

export interface PendingPlayAction {
  kind: 'take' | 'reserve';
  take?: Partial<Record<CardColor, number>>;
  cardID?: number;
}

interface PanelState {
  type: PlayPanel;
  key: number;
  phaseVersion: number;
}

export interface ActivityEntry {
  key: string;
  turnNumber: number;
  text: string;
}

export function useSplendorPlayUI(data: GameSnapshot) {
  const [panel, setPanel] = useState<PanelState>();
  const [selectedCardID, setSelectedCardID] = useState<number>();
  const [selectedPlayerID, setSelectedPlayerID] = useState<string>();
  const [selectedNobleID, setSelectedNobleID] = useState<string>();
  const [selectedGems, setSelectedGems] = useState<Partial<Record<CardColor, number>>>({});
  const [pendingAction, setPendingAction] = useState<PendingPlayAction>();
  const [returns, setReturns] = useState<GemCounts>({});
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const panelSequence = useRef(0);
  const phaseVersion = data.phaseVersion;

  const openPanel = useCallback((type: PlayPanel) => {
    const next = { type, key: ++panelSequence.current, phaseVersion };
    setPanel(next);
    return next.key;
  }, [phaseVersion]);
  const closePanel = useCallback((key?: number) => {
    setPanel(current => key != null && current?.key !== key ? current : undefined);
  }, []);

  useEffect(() => {
    setSelectedGems({});
    setPendingAction(undefined);
    setReturns({});
    setSelectedCardID(undefined);
    setPanel(current => current && current.phaseVersion < phaseVersion ? undefined : current);
  }, [phaseVersion]);

  useEffect(() => {
    const text = lastActionCopy(data.roomData.lastData);
    if (!text) return;
    const key = `${data.phaseVersion}:${JSON.stringify(data.roomData.lastData)}`;
    setActivities(current => current.some(entry => entry.key === key)
      ? current
      : [{ key, turnNumber: data.turnNumber, text }, ...current].slice(0, 40));
  }, [data.phaseVersion, data.roomData.lastData, data.turnNumber]);

  const openCard = useCallback((cardID: number) => {
    setSelectedCardID(cardID);
    return openPanel('card');
  }, [openPanel]);
  const openCollection = useCallback((playerID: string) => {
    setSelectedPlayerID(playerID);
    return openPanel('collection');
  }, [openPanel]);
  const openNoble = useCallback((nobleID: string) => {
    setSelectedNobleID(nobleID);
    return openPanel('noble');
  }, [openPanel]);
  const toggleGem = useCallback((color: CardColor) => {
    setSelectedCardID(undefined);
    setSelectedGems(current => toggleGemSelection(data.roomData.gems, current, color));
  }, [data.roomData.gems]);
  const prepareReturn = useCallback((action: PendingPlayAction) => {
    setPendingAction(action);
    setReturns({});
    return openPanel('return');
  }, [openPanel]);
  const resetAction = useCallback(() => {
    setPendingAction(undefined);
    setReturns({});
    setSelectedGems({});
    setSelectedCardID(undefined);
  }, []);

  return {
    panel,
    openPanel,
    closePanel,
    selectedCardID,
    setSelectedCardID,
    selectedPlayerID,
    setSelectedPlayerID,
    selectedNobleID,
    setSelectedNobleID,
    selectedGems,
    setSelectedGems,
    openCard,
    openCollection,
    openNoble,
    toggleGem,
    pendingAction,
    prepareReturn,
    setPendingAction,
    returns,
    setReturns,
    activities,
    resetAction,
  };
}
