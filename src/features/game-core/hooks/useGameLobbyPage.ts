import { useCallback, useState } from 'react';
import { useClipboardCopy } from './useClipboardCopy';
import { useLatestAsyncAction } from './useLatestAsyncAction';

export type GameLobbyPanel = 'create' | 'join' | 'share';

interface UseGameLobbyPageOptions<TRoom, TDraft, TCreated> {
  initialDraft: TDraft | (() => TDraft);
  createRoom: (draft: TDraft, signal: AbortSignal) => Promise<TCreated>;
  enterCreated: (created: TCreated) => void;
  lookupRoom?: (code: string, signal: AbortSignal) => Promise<TRoom>;
  enterRoom: (room: TRoom) => void;
  canEnter?: (room: TRoom) => boolean;
}

export function useGameLobbyPage<TRoom, TDraft, TCreated>({
  initialDraft,
  createRoom,
  enterCreated,
  lookupRoom,
  enterRoom,
  canEnter = () => true,
}: UseGameLobbyPageOptions<TRoom, TDraft, TCreated>) {
  const [panel, setPanel] = useState<GameLobbyPanel>();
  const [draft, setDraft] = useState<TDraft>(initialDraft);
  const [code, setCodeState] = useState('');
  const [foundRoom, setFoundRoom] = useState<TRoom>();
  const action = useLatestAsyncAction();
  const clipboard = useClipboardCopy();

  const open = useCallback((nextPanel: GameLobbyPanel) => {
    action.reset();
    clipboard.reset();
    if (nextPanel === 'join') setFoundRoom(undefined);
    setPanel(nextPanel);
  }, [action, clipboard]);

  const close = useCallback(() => {
    if (action.pending) return;
    action.cancel();
    clipboard.reset();
    setPanel(undefined);
  }, [action, clipboard]);

  const setCode = useCallback((value: string) => {
    setCodeState(value);
    setFoundRoom(undefined);
    action.reset();
  }, [action]);

  const create = useCallback(async () => {
    try {
      const created = await action.run(signal => createRoom(draft, signal));
      enterCreated(created);
      return created;
    } catch {
      return undefined;
    }
  }, [action, createRoom, draft, enterCreated]);

  const find = useCallback(async () => {
    const normalized = code.trim();
    if (!lookupRoom || !normalized) return undefined;
    setFoundRoom(undefined);
    try {
      const room = await action.run(signal => lookupRoom(normalized, signal));
      setFoundRoom(room);
      return room;
    } catch {
      return undefined;
    }
  }, [action, code, lookupRoom]);

  const enterFound = useCallback(() => {
    if (!foundRoom || !canEnter(foundRoom)) return false;
    enterRoom(foundRoom);
    return true;
  }, [canEnter, enterRoom, foundRoom]);

  return {
    panel,
    open,
    close,
    draft,
    setDraft,
    code,
    setCode,
    foundRoom,
    create,
    find,
    enterFound,
    canEnterFound: !!foundRoom && canEnter(foundRoom),
    action,
    clipboard,
  };
}
