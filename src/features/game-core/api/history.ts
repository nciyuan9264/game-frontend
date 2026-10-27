import {
  GetHistoryDetail,
  GetLeaderboard,
  GetSnapshot,
  GetStats,
  ListHistoryGames,
  ListSnapshots,
  type HistoryGame,
  type HistoryGamePlayer,
  type ReplaySnapshot,
} from '@/api/generated/game-platform';
import {
  parseReplayPayload,
  toLeaderboardEntry,
  type Game,
  type GameDetailData,
  type GameID,
  type GamePlayer,
  type HistoryGameType,
  type LeaderboardData,
  type LeaderboardSortDim,
  type ListGamesData,
  type SnapshotPageData,
  type Stats,
} from '../model/history';

interface RequestOptions {
  signal?: AbortSignal;
}

export interface ListGamesParams extends RequestOptions {
  gameType: HistoryGameType;
  limit?: number;
  offset?: number;
}

export interface SnapshotPageParams extends RequestOptions {
  offset?: number;
  limit?: number;
}

export interface GetLeaderboardParams extends RequestOptions {
  gameType: HistoryGameType;
  limit?: number;
  offset?: number;
  sort?: LeaderboardSortDim;
  gameRole?: string;
}

const requestOptions = ({ signal }: RequestOptions) => ({ signal });

function toGamePlayer(player: HistoryGamePlayer): GamePlayer {
  return {
    ...player,
    displayName: player.displayName ?? (player.isAI ? 'AI' : `玩家 ${player.playerID}`),
  };
}

function toGame(game: HistoryGame): Game {
  return {
    ...game,
    gameType: game.gameType as HistoryGameType,
    players: game.players?.map(toGamePlayer),
  };
}

function unwrapReplaySnapshot<TSnapshot>(
  value: ReplaySnapshot,
  gameType: HistoryGameType,
): TSnapshot {
  const snapshot = gameType === 'acquire'
    ? value.acquire
    : gameType === 'splendor'
      ? value.splendor
      : gameType === 'yinsh'
        ? value.yinsh
        : gameType === 'othello'
          ? value.othello
          : gameType === 'warchest'
            ? value.warchest
            : gameType === 'quoridor'
              ? value.quoridor
            : gameType === 'loveletter'
              ? value.loveletter
            : gameType === 'sixnimmt'
              ? value.sixnimmt
            : gameType === 'onitama'
              ? value.onitama
            : undefined;
  if (!snapshot) {
    throw new Error(`回放快照与游戏类型 ${gameType} 不匹配`);
  }
  return {
    ...snapshot,
    currentEvent: parseReplayPayload(snapshot.currentEvent),
  } as TSnapshot;
}

export async function listMyGames(
  { gameType, limit = 20, offset = 0, signal }: ListGamesParams,
): Promise<ListGamesData> {
  const response = await ListHistoryGames(
    { game_type: gameType, limit, offset },
    requestOptions({ signal }),
  );
  return { games: response.data.games.map(toGame) };
}

export async function getGameDetail(
  id: GameID,
  gameType: HistoryGameType,
): Promise<GameDetailData> {
  const response = await GetHistoryDetail({
    id: String(id),
    game_type: gameType,
  });
  return {
    game: toGame(response.data.game),
    players: response.data.players.map(toGamePlayer),
    events: response.data.events.map(event => ({
      ...event,
      displayName: event.displayName ?? `玩家 ${event.playerID}`,
    })),
  };
}

export async function getSnapshot<TSnapshot>(
  id: GameID,
  seq: number,
  gameType: HistoryGameType,
): Promise<TSnapshot> {
  const response = await GetSnapshot({
    id: String(id),
    game_type: gameType,
    seq,
  });
  return unwrapReplaySnapshot<TSnapshot>(response.data, gameType);
}

export async function getSnapshotPage<TSnapshot>(
  id: GameID,
  gameType: HistoryGameType,
  { offset = 0, limit = 20, signal }: SnapshotPageParams = {},
): Promise<SnapshotPageData<TSnapshot>> {
  const response = await ListSnapshots(
    {
      id: String(id),
      game_type: gameType,
      offset,
      limit,
    },
    requestOptions({ signal }),
  );
  const { page } = response.data;
  return {
    snapshots: response.data.snapshots.map(snapshot =>
      unwrapReplaySnapshot<TSnapshot>(snapshot, gameType)),
    totalEvents: response.data.totalEvents,
    totalSnapshots: response.data.totalSnapshots,
    offset: page.offset,
    limit: page.limit,
    nextOffset: page.nextOffset ?? page.offset + response.data.snapshots.length,
    hasMore: page.hasMore,
  };
}

export async function getMyStats(
  gameType: HistoryGameType,
): Promise<Stats> {
  const response = await GetStats({ game_type: gameType });
  return response.data;
}

export async function getLeaderboard(
  {
    gameType,
    limit = 50,
    offset = 0,
    sort = 'metric',
    gameRole,
    signal,
  }: GetLeaderboardParams,
): Promise<LeaderboardData> {
  const response = await GetLeaderboard(
    {
      game_type: gameType,
      limit,
      offset,
      sort,
      game_role: gameRole,
    },
    requestOptions({ signal }),
  );
  return {
    gameType: response.data.gameType as HistoryGameType,
    entries: response.data.entries.map(toLeaderboardEntry),
  };
}
