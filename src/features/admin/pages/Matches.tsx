import { FormEvent, useCallback, useState } from 'react';
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Search,
  Trophy,
  UserRound,
} from 'lucide-react';
import { ListAdminAnalyticsMatches, type MatchSummary } from '@/api/generated/game-admin';
import { gameCatalog } from '@/features/home/model/gameCatalog';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { ErrorState, LoadingState } from '../components/ResourceState';
import { formatCount, formatDateTime, formatDuration, gameName, toNumber } from '../model';
import styles from '../index.module.less';

const pageSize = 20;

const endReasonLabel = (reason: string): string => {
  if (reason === 'completed') return '正常完成';
  if (reason === 'abandoned') return '已废弃';
  return '已结束';
};

const winnerLabel = (match: MatchSummary): string => {
  const winners = match.players.filter(player => player.is_winner);
  return winners.length > 0
    ? winners.map(player => player.display_name).join('、')
    : '—';
};

export default function Matches() {
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [gameType, setGameType] = useState('');
  const [endReason, setEndReason] = useState('');
  const load = useCallback(async () => (
    await ListAdminAnalyticsMatches({
      page,
      page_size: pageSize,
      query: query || undefined,
      game_type: gameType || undefined,
      end_reason: endReason || undefined,
    })
  ).data, [endReason, gameType, page, query]);
  const { data, loading, error, retry } = useAsyncResource(load);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(input.trim());
  };

  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={error} retry={retry} />;

  const total = toNumber(data.total);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.pageStack} aria-busy={loading}>
      <div className={`${styles.tableToolbar} ${styles.matchToolbar}`}>
        <form onSubmit={submit}>
          <Search size={17} aria-hidden="true" />
          <input
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="搜索房间号、Match ID 或玩家"
            aria-label="搜索历史对局"
          />
          <button type="submit">搜索</button>
        </form>
        <div className={styles.matchFilters}>
          <select
            value={gameType}
            aria-label="按游戏筛选"
            onChange={event => {
              setPage(1);
              setGameType(event.target.value);
            }}
          >
            <option value="">全部游戏</option>
            {gameCatalog.map(game => (
              <option key={game.key} value={game.key}>{game.title}</option>
            ))}
          </select>
          <select
            value={endReason}
            aria-label="按对局结果筛选"
            onChange={event => {
              setPage(1);
              setEndReason(event.target.value);
            }}
          >
            <option value="">全部结果</option>
            <option value="completed">正常完成</option>
            <option value="abandoned">已废弃</option>
          </select>
          <span>共 {formatCount(total)} 条记录</span>
        </div>
      </div>

      <section className={`${styles.tablePanel} ${styles.matchTable}`} aria-label="历史对局列表">
        <div className={styles.tableScroller}>
          <table>
            <thead>
              <tr>
                <th>游戏 / Match</th>
                <th>房间</th>
                <th>结果</th>
                <th>玩家</th>
                <th>胜者</th>
                <th>开始 / 结束</th>
                <th>时长</th>
              </tr>
            </thead>
            <tbody>
              {data.matches.map(match => (
                <tr key={match.game_id}>
                  <td>
                    <strong>{gameName(match.game_type)}</strong>
                    <small>{match.match_id || `历史记录 #${match.game_id}`}</small>
                  </td>
                  <td>
                    <strong>{match.room_id}</strong>
                    <small>记录 #{match.game_id}</small>
                  </td>
                  <td>
                    <span className={styles.matchStatus} data-reason={match.end_reason}>
                      {endReasonLabel(match.end_reason)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.matchPlayerList}>
                      {match.players.map(player => (
                        <span
                          className={styles.matchPlayer}
                          data-winner={player.is_winner || undefined}
                          key={`${match.game_id}-${player.seat_index}-${player.player_id}`}
                        >
                          <i>{player.is_ai
                            ? <Bot size={13} aria-label="AI" />
                            : <UserRound size={13} aria-label="真人玩家" />}</i>
                          <span>
                            <b>{player.display_name}</b>
                            <small>
                              {player.final_rank ? `第 ${player.final_rank} 名` : `座位 ${player.seat_index + 1}`}
                            </small>
                          </span>
                          {player.is_winner && <Trophy size={13} aria-label="胜者" />}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{winnerLabel(match)}</td>
                  <td>
                    <strong>{formatDateTime(match.started_at_unix)}</strong>
                    <small>{formatDateTime(match.ended_at_unix)}</small>
                  </td>
                  <td>{formatDuration(match.duration_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.matches.length === 0 && <div className={styles.emptyTable}>没有匹配的历史对局</div>}
        </div>
        <footer className={styles.pagination}>
          <span>第 {page} / {pages} 页</span>
          <div>
            <button type="button" onClick={() => setPage(value => value - 1)} disabled={page <= 1}>
              <ChevronLeft size={17} />
              <span>上一页</span>
            </button>
            <button type="button" onClick={() => setPage(value => value + 1)} disabled={page >= pages}>
              <span>下一页</span>
              <ChevronRight size={17} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
