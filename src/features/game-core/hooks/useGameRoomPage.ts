import { useCallback, useMemo, useState } from 'react';
import { useClipboardCopy } from './useClipboardCopy';

export { orderGameRoomSeats } from '../model/room';

export type GameRoomPanel = 'invite' | 'settings' | 'remove' | 'start';

export interface GameRoomPlayerLike {
  playerID?: string;
  seatIndex?: number;
  online: boolean;
  ai: boolean;
  ready: boolean;
}

interface UseGameRoomPageOptions<TPlayer extends GameRoomPlayerLike> {
  roomID: string;
  inviteURL: string;
  visibility: 'public' | 'private';
  ownerID: string;
  playerID: string;
  players: Record<string, TPlayer>;
}

export function useGameRoomPage<TPlayer extends GameRoomPlayerLike>({
  roomID,
  inviteURL,
  visibility: currentVisibility,
  ownerID,
  playerID,
  players,
}: UseGameRoomPageOptions<TPlayer>) {
  const [panel, setPanel] = useState<GameRoomPanel>();
  const [targetID, setTargetID] = useState('');
  const [visibility, setVisibility] = useState(currentVisibility);
  const [copyMessage, setCopyMessage] = useState('');
  const clipboard = useClipboardCopy();
  const playerList = useMemo(() => Object.entries(players), [players]);
  const owner = playerID === ownerID;
  const readyCount = playerList.filter(([, player]) =>
    player.ready && (player.online || player.ai)).length;

  const open = useCallback((nextPanel: GameRoomPanel, target = '') => {
    if (nextPanel === 'settings') setVisibility(currentVisibility);
    if (nextPanel === 'invite') {
      clipboard.reset();
      setCopyMessage('');
    }
    setTargetID(target);
    setPanel(nextPanel);
  }, [clipboard, currentVisibility]);

  const close = useCallback(() => {
    setPanel(undefined);
    setTargetID('');
  }, []);

  const copy = useCallback(async (value: string, successMessage: string) => {
    const copied = await clipboard.copy(value);
    setCopyMessage(copied ? successMessage : '复制未成功，请稍后重试');
    return copied;
  }, [clipboard]);

  return {
    panel,
    open,
    close,
    targetID,
    visibility,
    setVisibility,
    copy,
    copyMessage,
    copyRoomID: () => copy(roomID, '房间号已复制'),
    copyInviteURL: () => copy(inviteURL, '邀请链接已复制'),
    owner,
    playerList,
    readyCount,
  };
}
