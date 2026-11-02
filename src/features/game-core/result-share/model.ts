import type {
  ResultCardData as ResultCardResponseData,
} from '@/api/generated/game-platform';
import type { GameType } from '@/hooks/useGameType';

export type ResultOutcome = 'win' | 'loss' | 'draw';

export interface ResultCardPlayer {
  displayName: string;
  seatIndex: number;
  isAI: boolean;
  finalScore?: number;
  finalMoney?: number;
  finalStocks: number;
  finalRank?: number;
  isWinner: boolean;
  gameRole?: string;
  isSelf: boolean;
}

export interface ResultCardModel {
  gameType: GameType;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  players: ResultCardPlayer[];
  self: ResultCardPlayer;
  outcome: ResultOutcome;
  winnerCount: number;
}

export function toResultCardModel(
  data: ResultCardResponseData,
  gameType: GameType,
): ResultCardModel {
  const players = data.players.map(player => ({
    displayName: player.display_name,
    seatIndex: player.seat_index,
    isAI: player.is_ai,
    finalScore: player.final_score,
    finalMoney: player.final_money,
    finalStocks: player.final_stocks,
    finalRank: player.final_rank,
    isWinner: player.is_winner,
    gameRole: player.game_role,
    isSelf: player.is_self,
  }));
  const self = players.find(player => player.isSelf);
  if (!self) throw new Error('战绩中缺少当前玩家');
  const winners = players.filter(player => player.isWinner);
  const leaders = players.filter(player => player.finalRank === 1);
  const draw = winners.length === 0 && leaders.length > 1;
  return {
    gameType,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    durationSeconds: data.duration_seconds,
    players,
    self,
    outcome: self.isWinner ? 'win' : draw ? 'draw' : 'loss',
    winnerCount: winners.length,
  };
}
