import type {
  FugitiveActionLog,
  FugitiveCard,
  FugitiveDeckState,
  FugitiveRouteCard,
  FugitiveRoomData,
  RoomPlayer,
} from '@/api/generated/game-platform';
import type {
  SessionPendingCommand,
  SessionSnapshotBase,
} from '@/features/game-core/model/session';
import { playerDisplayName } from '@/features/game-core/model/room';
import {
  parseRealtimeEnvelope,
  type RealtimeCommandResult,
  type RealtimeErrorMessage,
} from '@/features/game-core/model/realtime';
import type {
  ActionLog,
  Card,
  DeckState,
  FugitivePlayer,
  GameStatus,
  PlayerState,
  Result,
  Role,
  RouteCard,
  Visibility,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, FugitivePlayer>;
  visibility: Visibility;
  maxPlayers: number;
  playerOrder: string[];
}

export interface GameSnapshot extends SessionSnapshotBase {
  type: 'ROOM_SYNC';
  ownerID: string;
  visibility: Visibility;
  playerId: string;
  playerData: Record<string, PlayerState>;
  hand: Card[];
  result?: Result;
  roomData: {
    currentPlayer: string;
    gameStatus: GameStatus;
    roundNo: number;
    drawsRemaining: number;
    highestRevealed: number;
    hiddenHideoutCount: number;
    openingHideoutsPlaced: number;
    route: RouteCard[];
    decks: DeckState[];
    activityLog: ActionLog[];
    lastData?: ActionLog;
    turnDeadline?: string;
    turnTimeoutMs?: number;
    players: Record<string, FugitivePlayer>;
    playerOrder: string[];
  };
}

export type Snapshot = MatchSnapshot | GameSnapshot;
export type CommandType =
  | 'match_ready'
  | 'match_begin'
  | 'match_add_ai'
  | 'match_remove_player'
  | 'match_select_role'
  | 'room_update_settings'
  | 'game_ready'
  | 'game_draw_card'
  | 'game_play_hideout'
  | 'game_finish_opening'
  | 'game_lay_low'
  | 'game_search_hideouts';

export type PendingCommand = SessionPendingCommand<
  Snapshot,
  CommandType,
  unknown
>;

export type ServerMessage =
  | Snapshot
  | RealtimeCommandResult
  | RealtimeErrorMessage;

const role = (value: string | undefined): Role =>
  value === 'marshal' ? 'marshal' : 'fugitive';

const card = (value: FugitiveCard): Card => ({
  number: Number(value.number),
  sprint: Number(value.sprint),
});

const routeCard = (value: FugitiveRouteCard): RouteCard => ({
  index: Number(value.index),
  revealed: value.revealed,
  sprintCount: Number(value.sprintCount),
  card: value.card ? card(value.card) : undefined,
  sprints: value.sprints?.map(card),
});

const deck = (value: FugitiveDeckState): DeckState => ({
  deckIndex: Number(value.deckIndex),
  min: Number(value.min),
  max: Number(value.max),
  remaining: Number(value.remaining),
});

const action = (value: FugitiveActionLog): ActionLog => ({
  id: Number(value.id),
  roundNo: Number(value.roundNo),
  kind: value.kind,
  playerID: value.playerID,
  role: role(value.role),
  deckIndex: value.deckIndex == null ? undefined : Number(value.deckIndex),
  numbers: value.numbers?.map(Number),
  destination: value.destination == null
    ? undefined
    : Number(value.destination),
  sprintCount: Number(value.sprintCount),
  success: value.success,
  automatic: value.automatic,
  private: value.private,
});

function normalizePlayers(
  players: Record<string, RoomPlayer>,
): Record<string, FugitivePlayer> {
  return Object.fromEntries(Object.entries(players).map(([id, player]) => [
    id,
    {
      ...player,
      gameRole: player.gameRole ? role(player.gameRole) : undefined,
      name: player.displayName,
    },
  ]));
}

function roomData(value: FugitiveRoomData): GameSnapshot['roomData'] {
  return {
    currentPlayer: value.currentPlayer,
    gameStatus: value.gameStatus as GameStatus,
    roundNo: Number(value.roundNo),
    drawsRemaining: Number(value.drawsRemaining),
    highestRevealed: Number(value.highestRevealed),
    hiddenHideoutCount: Number(value.hiddenHideoutCount),
    openingHideoutsPlaced: Number(value.openingHideoutsPlaced),
    route: value.route?.map(routeCard) ?? [],
    decks: value.decks?.map(deck) ?? [],
    activityLog: value.activityLog?.map(action) ?? [],
    lastData: value.lastData ? action(value.lastData) : undefined,
    turnDeadline: value.turnDeadline,
    turnTimeoutMs: value.turnTimeoutMs == null
      ? undefined
      : Number(value.turnTimeoutMs),
    players: normalizePlayers(value.players ?? {}),
    playerOrder: value.playerOrder ?? [],
  };
}

export function parseServerMessage(value: string): ServerMessage | undefined {
  const envelope = parseRealtimeEnvelope(value);
  if (!envelope) return;
  if (envelope.type === 'COMMAND_RESULT' || envelope.type === 'ERROR') {
    return envelope;
  }
  const common = {
    schemaVersion: envelope.schemaVersion,
    roomID: envelope.roomID,
    matchID: envelope.matchID,
    seq: envelope.seq,
    phaseVersion: envelope.seq,
    turnNumber: envelope.seq,
  };
  if (envelope.type === 'MATCH_SYNC') {
    return {
      ...common,
      type: 'MATCH_SYNC',
      ownerID: envelope.ownerID,
      status: envelope.status as GameStatus,
      playerID: envelope.playerID,
      players: normalizePlayers(envelope.players ?? {}),
      visibility: envelope.visibility as Visibility,
      maxPlayers: envelope.maxPlayers,
      playerOrder: envelope.playerOrder ?? [],
    };
  }
  const view = envelope.view.fugitive;
  if (!view) return;
  return {
    ...common,
    type: 'ROOM_SYNC',
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerId: view.playerId,
    playerData: Object.fromEntries(
      Object.entries(view.playerData ?? {}).map(([id, state]) => [
        id,
        { role: role(state.role), handCount: Number(state.handCount) },
      ]),
    ),
    hand: view.hand?.map(card) ?? [],
    result: view.result
      ? {
          winnerID: view.result.winnerID,
          winnerRole: role(view.result.winnerRole),
          reason: view.result.reason,
          searches: Number(view.result.searches),
        }
      : undefined,
    roomData: roomData(view.roomData),
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, FugitivePlayer>,
) => playerDisplayName(players?.[id], id);
