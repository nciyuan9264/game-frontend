import type { ReactNode } from 'react';
import { orderGameRoomSeats } from '@/features/game-core/model/room';
import { GameMobileRoom } from './Room';
import {
  GameMobileRoomInviteDialog,
  GameMobileRoomRemoveDialog,
  GameMobileRoomSettingsDialog,
  GameMobileRoomStartDialog,
} from './dialogs';
import type {
  GameMobileRoomFact,
  GameMobileRoomPlayer,
  GameMobileRoomSummary,
} from './types';

export interface StandardRoomPlayerData {
  avatar?: string;
  ai: boolean;
  online: boolean;
  ready: boolean;
  seatIndex?: number;
}

export interface StandardRoomData<
  TPlayer extends StandardRoomPlayerData = StandardRoomPlayerData,
> {
  roomID: string;
  ownerID: string;
  playerID: string;
  players: Record<string, TPlayer>;
  playerOrder: string[];
  visibility: 'public' | 'private';
  maxPlayers: number;
}

export interface StandardRoomCopy {
  kicker: ReactNode;
  gameLabel: ReactNode;
  facts: readonly GameMobileRoomFact[];
  summary: readonly GameMobileRoomSummary[];
  summaryTitle: ReactNode;
  summaryEyebrow?: ReactNode;
  ownerHint: ReactNode;
  memberHint: ReactNode;
  waitingTitle?: ReactNode;
  readyTitle?: ReactNode;
  ownerDescription: ReactNode;
  memberReadyDescription: ReactNode;
  memberWaitingDescription: ReactNode;
  ownerActionLabel?: ReactNode;
  memberReadyLabel?: ReactNode;
  memberCancelReadyLabel?: ReactNode;
}

export interface StandardGameMobileRoomProps<
  TPlayer extends StandardRoomPlayerData,
> {
  data: StandardRoomData<TPlayer>;
  copy: StandardRoomCopy;
  enabled: boolean;
  pending?: boolean;
  minPlayers?: number;
  canStart?: boolean;
  denseSeats?: boolean;
  media?: ReactNode;
  extension?: ReactNode;
  getPlayerName: (playerID: string) => string;
  getPlayerRole?: (
    playerID: string,
    player: TPlayer,
    seatIndex: number,
  ) => ReactNode;
  renderAvatar: (player: GameMobileRoomPlayer, size: number) => ReactNode;
  renderSeatDecoration?: (
    player: GameMobileRoomPlayer,
    seatIndex: number,
  ) => ReactNode;
  onLeave: () => void;
  onSettings: () => void;
  onInvite: () => void;
  onAddAI: (seatIndex?: number) => void;
  onRemove: (playerID: string) => void;
  onReady: () => void;
  onStart: () => void;
  classNames?: {
    table?: string;
    summary?: string;
    dock?: string;
    seatGrid?: string;
    seat?: string;
  };
}

export function standardRoomPlayers<
  TPlayer extends StandardRoomPlayerData,
>(
  data: StandardRoomData<TPlayer>,
  getPlayerName: (playerID: string) => string,
  getPlayerRole?: (
    playerID: string,
    player: TPlayer,
    seatIndex: number,
  ) => ReactNode,
) {
  const seatByID = standardRoomSeatIDs(data)
    .reduce<Record<string, number>>((result, playerID, index) => {
      if (playerID) result[playerID] = index;
      return result;
    }, {});
  return Object.entries(data.players).map(([id, player]) => ({
    id,
    name: getPlayerName(id),
    avatar: player.avatar,
    ai: player.ai,
    online: player.online,
    ready: player.ready,
    owner: id === data.ownerID,
    self: id === data.playerID,
    role: getPlayerRole?.(id, player, seatByID[id] ?? 0),
  } satisfies GameMobileRoomPlayer));
}

export function standardRoomSeatIDs<
  TPlayer extends StandardRoomPlayerData,
>(data: StandardRoomData<TPlayer>) {
  return orderGameRoomSeats(
    data.players,
    data.playerOrder,
    data.maxPlayers,
  );
}

export function standardRoomCanStart<
  TPlayer extends StandardRoomPlayerData,
>(data: StandardRoomData<TPlayer>, minPlayers = 2) {
  const players = Object.values(data.players) as TPlayer[];
  return players.length >= minPlayers
    && players.every(player => (player.online || player.ai) && player.ready);
}

export function StandardGameMobileRoom<
  TPlayer extends StandardRoomPlayerData,
>({
  data,
  copy,
  enabled,
  pending,
  minPlayers = 2,
  canStart: canStartOverride,
  denseSeats,
  media,
  extension,
  getPlayerName,
  getPlayerRole,
  renderAvatar,
  renderSeatDecoration,
  onLeave,
  onSettings,
  onInvite,
  onAddAI,
  onRemove,
  onReady,
  onStart,
  classNames,
}: StandardGameMobileRoomProps<TPlayer>) {
  const players = standardRoomPlayers(data, getPlayerName, getPlayerRole);
  const byID = Object.fromEntries(players.map(player => [player.id, player]));
  const seats = standardRoomSeatIDs(data).map(id => id ? byID[id] : undefined);
  const canStart = canStartOverride ?? standardRoomCanStart(data, minPlayers);
  const waitingTitle = copy.waitingTitle
    ?? (players.length < minPlayers
      ? '再来一位，就能开场。'
      : '等待所有玩家准备。');

  return <GameMobileRoom
    roomID={data.roomID}
    kicker={copy.kicker}
    visibility={data.visibility}
    gameLabel={copy.gameLabel}
    players={players}
    seats={seats}
    facts={copy.facts}
    summary={copy.summary}
    summaryTitle={copy.summaryTitle}
    summaryEyebrow={copy.summaryEyebrow}
    authorityHint={data.playerID === data.ownerID
      ? copy.ownerHint
      : copy.memberHint}
    readinessTitle={canStart ? copy.readyTitle ?? '所有玩家已经就绪。' : waitingTitle}
    readinessDescription={data.playerID === data.ownerID
      ? copy.ownerDescription
      : data.players[data.playerID]?.ready
        ? copy.memberReadyDescription
        : copy.memberWaitingDescription}
    ownerActionLabel={copy.ownerActionLabel}
    memberReadyLabel={copy.memberReadyLabel}
    memberCancelReadyLabel={copy.memberCancelReadyLabel}
    owner={data.playerID === data.ownerID}
    enabled={enabled}
    pending={pending}
    canStart={canStart}
    denseSeats={denseSeats}
    media={media}
    extension={extension}
    renderAvatar={renderAvatar}
    renderSeatDecoration={renderSeatDecoration}
    onLeave={onLeave}
    onSettings={onSettings}
    onInvite={onInvite}
    onAddAI={onAddAI}
    onRemove={onRemove}
    onReady={onReady}
    onStart={onStart}
    classNames={classNames}
  />;
}

export interface StandardGameMobileRoomDialogsProps<
  TPlayer extends StandardRoomPlayerData,
> {
  panel?: 'invite' | 'settings' | 'remove' | 'start';
  data: StandardRoomData<TPlayer>;
  targetID?: string;
  visibility: 'public' | 'private';
  copyMessage?: ReactNode;
  enabled: boolean;
  getPlayerName: (playerID: string) => string;
  renderAvatar: (player: GameMobileRoomPlayer, size: number) => ReactNode;
  inviteTitle?: string;
  settingsFields?: ReactNode;
  settingsHint: ReactNode;
  startTitle?: string;
  startFacts: readonly GameMobileRoomFact[];
  startHint: ReactNode;
  themeClassName?: string;
  onVisibilityChange: (value: 'public' | 'private') => void;
  onCopyRoomID: () => void;
  onCopyInviteURL: () => void;
  onSaveSettings: () => void;
  onConfirmRemove: () => void;
  onConfirmStart: () => void;
  onClose: () => void;
}

export function StandardGameMobileRoomDialogs<
  TPlayer extends StandardRoomPlayerData,
>({
  panel,
  data,
  targetID,
  visibility,
  copyMessage,
  enabled,
  getPlayerName,
  renderAvatar,
  inviteTitle,
  settingsFields,
  settingsHint,
  startTitle,
  startFacts,
  startHint,
  themeClassName,
  onVisibilityChange,
  onCopyRoomID,
  onCopyInviteURL,
  onSaveSettings,
  onConfirmRemove,
  onConfirmStart,
  onClose,
}: StandardGameMobileRoomDialogsProps<TPlayer>) {
  const players = standardRoomPlayers(data, getPlayerName);
  if (panel === 'invite') {
    return <GameMobileRoomInviteDialog
      title={inviteTitle}
      roomID={data.roomID}
      playerCount={players.length}
      maxPlayers={data.maxPlayers}
      visibility={data.visibility}
      players={players}
      renderAvatar={renderAvatar}
      copyMessage={copyMessage}
      themeClassName={themeClassName}
      onCopyRoomID={onCopyRoomID}
      onCopyInviteURL={onCopyInviteURL}
      onClose={onClose}
    />;
  }
  if (panel === 'settings' && data.playerID === data.ownerID) {
    return <GameMobileRoomSettingsDialog
      roomID={data.roomID}
      visibility={visibility}
      onVisibilityChange={onVisibilityChange}
      fields={settingsFields}
      hint={settingsHint}
      enabled={enabled}
      themeClassName={themeClassName}
      onSave={onSaveSettings}
      onClose={onClose}
    />;
  }
  if (panel === 'remove') {
    return <GameMobileRoomRemoveDialog
      playerName={targetID ? getPlayerName(targetID) : '该玩家'}
      enabled={enabled}
      themeClassName={themeClassName}
      onConfirm={onConfirmRemove}
      onClose={onClose}
    />;
  }
  if (panel === 'start') {
    return <GameMobileRoomStartDialog
      title={startTitle}
      players={players}
      renderAvatar={renderAvatar}
      facts={startFacts}
      hint={startHint}
      enabled={enabled}
      themeClassName={themeClassName}
      onConfirm={onConfirmStart}
      onClose={onClose}
    />;
  }
  return null;
}
