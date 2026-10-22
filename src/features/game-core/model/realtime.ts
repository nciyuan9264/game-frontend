import type {
  ClientCommand,
  ClientCommandPayload,
  CommandResult,
  ErrorMessage,
  MatchSync,
  RoomSync,
} from '@/api/generated/game-platform';
import type { GameType } from '@/hooks/useGameType';

export const REALTIME_SCHEMA_VERSION = 2;

type WithNumericSeq<T extends { seq: string }> = Omit<T, 'seq'> & {
  seq: number;
};

export type RealtimeMatchSync = WithNumericSeq<MatchSync> & {
  type: 'MATCH_SYNC';
};

export type RealtimeRoomSync = WithNumericSeq<RoomSync> & {
  type: 'ROOM_SYNC';
};

export type RealtimeCommandResult = WithNumericSeq<CommandResult> & {
  type: 'COMMAND_RESULT';
};

export type RealtimeErrorMessage = WithNumericSeq<ErrorMessage> & {
  type: 'ERROR';
};

export type RealtimeServerEnvelope =
  | RealtimeMatchSync
  | RealtimeRoomSync
  | RealtimeCommandResult
  | RealtimeErrorMessage;

const messageTypes = new Set([
  'MATCH_SYNC',
  'ROOM_SYNC',
  'COMMAND_RESULT',
  'ERROR',
]);

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? value as Record<string, unknown>
    : undefined;
}

export function parseRealtimeEnvelope(
  value: string,
): RealtimeServerEnvelope | undefined {
  try {
    const data = record(JSON.parse(value));
    if (
      !data
      || data.schemaVersion !== REALTIME_SCHEMA_VERSION
      || typeof data.type !== 'string'
      || !messageTypes.has(data.type)
      || typeof data.roomID !== 'string'
      || typeof data.matchID !== 'string'
    ) {
      return;
    }
    const seq = Number(data.seq);
    if (!Number.isSafeInteger(seq) || seq < 0) return;

    if (
      data.type === 'MATCH_SYNC'
      && (
        typeof data.playerID !== 'string'
        || !record(data.players)
      )
    ) {
      return;
    }
    if (data.type === 'ROOM_SYNC' && !record(data.view)) return;
    if (
      data.type === 'COMMAND_RESULT'
      && (
        typeof data.commandID !== 'string'
        || typeof data.accepted !== 'boolean'
      )
    ) {
      return;
    }
    if (
      data.type === 'ERROR'
      && (
        typeof data.code !== 'string'
        || typeof data.message !== 'string'
      )
    ) {
      return;
    }
    return { ...data, seq } as RealtimeServerEnvelope;
  } catch {
    return;
  }
}

function commonPayload(
  commandType: string,
  payload: Record<string, unknown>,
): ClientCommandPayload | undefined {
  switch (commandType) {
    case 'match_ready':
      return { common: { matchReady: { ready: payload.ready === true } } };
    case 'match_add_ai':
    case 'match_seat':
      return {
        common: {
          matchSeat: {
            seatIndex: typeof payload.seatIndex === 'number'
              ? payload.seatIndex
              : undefined,
          },
        },
      };
    case 'match_remove_player':
      return {
        common: {
          removePlayer: { playerID: String(payload.playerID ?? '') },
        },
      };
    case 'room_update_settings':
      return {
        common: {
          roomSettings: { visibility: String(payload.visibility ?? '') },
        },
      };
    case 'match_begin':
    case 'game_ready':
    case 'game_restart_game':
      return { common: { empty: {} } };
    default:
      return;
  }
}

function gamePayload(
  gameType: GameType,
  commandType: string,
  payload: unknown,
): ClientCommandPayload {
  const objectPayload = record(payload) ?? {};
  if (gameType === 'acquire') {
    switch (commandType) {
      case 'game_place_tile':
        return { acquire: { placeTile: objectPayload as { tileKey: string } } };
      case 'game_create_company':
        return { acquire: { createCompany: objectPayload as { company: string } } };
      case 'game_merging_selection':
        return {
          acquire: {
            mergingSelection: objectPayload as { mainCompany: string },
          },
        };
      case 'game_merging_settle':
        return {
          acquire: {
            mergingSettle: objectPayload as {
              actions: Array<{
                company: string;
                sellAmount: number;
                exchangeAmount: number;
              }>;
            },
          },
        };
      case 'game_buy_stock':
        return {
          acquire: {
            buyStock: objectPayload as { stocks: Record<string, number> },
          },
        };
      case 'game_end_vote':
        return { acquire: { endVote: objectPayload as { allow: boolean } } };
    }
  }
  if (gameType === 'davinci') {
    switch (commandType) {
      case 'game_get_card':
        return { davinci: { getCard: objectPayload as { id: string } } };
      case 'game_guess_card':
        return {
          davinci: {
            guessCard: objectPayload as { id: string; num: number },
          },
        };
      case 'game_set_card':
        return {
          davinci: {
            setCard: objectPayload as { id: string; index: number },
          },
        };
    }
  }
  if (gameType === 'splendor') {
    switch (commandType) {
      case 'game_get_gem':
        return {
          splendor: {
            getGem: objectPayload as {
              take: Record<string, number>;
              returns?: Record<string, number>;
            },
          },
        };
      case 'game_buy_card':
        return {
          splendor: {
            buyCard: {
              cardID: typeof payload === 'number'
                ? payload
                : Number(objectPayload.cardID),
            },
          },
        };
      case 'game_preserve_card':
        return {
          splendor: {
            preserveCard: objectPayload as {
              cardID: number;
              returns?: Record<string, number>;
            },
          },
        };
    }
  }
  throw new Error(`不支持的实时命令: ${gameType}/${commandType}`);
}

export function createClientCommand(
  gameType: GameType,
  matchID: string,
  commandID: string,
  commandType: string,
  payload: unknown,
): ClientCommand {
  const objectPayload = record(payload) ?? {};
  return {
    schemaVersion: REALTIME_SCHEMA_VERSION,
    commandID,
    matchID,
    type: commandType,
    payload: commonPayload(commandType, objectPayload)
      ?? gamePayload(gameType, commandType, payload),
  };
}

export function createGameWebSocketURL(
  baseURL: string,
  roomID: string,
  matchID: string,
): string {
  if (!roomID || !matchID) return '';
  const url = new URL(baseURL);
  url.searchParams.set('roomID', roomID);
  url.searchParams.set('matchID', matchID);
  return url.toString();
}
