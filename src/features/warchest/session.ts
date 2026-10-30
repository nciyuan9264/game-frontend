import type {
  RoomPlayer,
  WarChestMatchSetup,
  WarChestRoomView,
} from '@/api/generated/game-platform';
import type {
  SessionPendingCommand,
  SessionSnapshotBase,
} from '@/features/game-core/model/session';
import { playerDisplayLabel, playerDisplayName } from '@/features/game-core/model/room';
import {
  parseRealtimeEnvelope,
  type RealtimeCommandResult,
  type RealtimeErrorMessage,
} from '@/features/game-core/model/realtime';
import type {
  GameStatus,
  Visibility,
  WarChestPlayer,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, WarChestPlayer>;
  visibility: Visibility;
  maxPlayers: number;
  playerOrder: string[];
  setup: WarChestMatchSetup;
}

export interface GameSnapshot extends SessionSnapshotBase, WarChestRoomView {
  type: 'ROOM_SYNC';
  visibility: Visibility;
}

export type Snapshot = MatchSnapshot | GameSnapshot;
export type CommandType =
  | 'match_ready'
  | 'match_begin'
  | 'match_add_ai'
  | 'match_remove_player'
  | 'room_update_settings'
  | 'game_set_setup_mode'
  | 'game_draft_unit'
  | 'game_ready'
  | 'game_play_action'
  | 'game_resign';
export type PendingCommand = SessionPendingCommand<Snapshot, CommandType, unknown>;
export type ServerMessage = Snapshot | RealtimeCommandResult | RealtimeErrorMessage;

function normalizePlayers(
  players: Record<string, RoomPlayer>,
): Record<string, WarChestPlayer> {
  return Object.fromEntries(Object.entries(players ?? {}).map(([id, player]) => [
    id,
    { ...player, name: player.displayName },
  ]));
}

function gameSnapshot(
  envelope: Extract<ReturnType<typeof parseRealtimeEnvelope>, { type: 'ROOM_SYNC' }>,
  view: WarChestRoomView,
): GameSnapshot {
  return {
    schemaVersion: envelope.schemaVersion,
    type: 'ROOM_SYNC',
    roomID: envelope.roomID,
    matchID: envelope.matchID,
    seq: envelope.seq,
    phaseVersion: envelope.seq,
    turnNumber: envelope.seq,
    playerId: view.playerId,
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerData: view.playerData,
    privateData: view.privateData,
    result: view.result,
    roomData: {
      ...view.roomData,
      players: view.roomData.players,
    },
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
    const setup = envelope.setup?.warchest;
    if (!setup) return;
    return {
      ...common,
      type: 'MATCH_SYNC',
      ownerID: envelope.ownerID,
      status: envelope.status as GameStatus,
      playerID: envelope.playerID,
      players: normalizePlayers(envelope.players),
      visibility: envelope.visibility as Visibility,
      maxPlayers: envelope.maxPlayers,
      playerOrder: envelope.playerOrder,
      setup,
    };
  }
  const view = envelope.view.warchest;
  if (!view) return;
  return gameSnapshot(envelope, view);
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, WarChestPlayer>,
) => playerDisplayName(players?.[id], id);
export const playerLabel = (
  id: string,
  players?: Record<string, WarChestPlayer>,
) => playerDisplayLabel(players?.[id], id);
