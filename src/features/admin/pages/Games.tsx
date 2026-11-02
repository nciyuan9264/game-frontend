import { useCallback } from 'react';
import { ListAdminAnalyticsGames } from '@/api/generated/game-admin';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { ErrorState, LoadingState } from '../components/ResourceState';
import {
  formatCount,
  formatDuration,
  formatHours,
  formatPercent,
  gameName,
  toNumber,
} from '../model';
import styles from '../index.module.less';

export default function Games() {
  const load = useCallback(async () => (await ListAdminAnalyticsGames()).data, []);
  const { data, loading, error, retry } = useAsyncResource(load);

  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={error} retry={retry} />;

  const maxDuration = Math.max(...data.games.map(game => toNumber(game.player_duration_seconds)), 1);
  return (
    <div className={styles.pageStack}>
      <div className={styles.pageMeta}>
        <span>{data.window.start_date} 至 {data.window.end_date}</span>
        <button type="button" onClick={retry} disabled={loading}>刷新</button>
      </div>

      <section className={styles.gameBars} aria-label="各游戏玩家投入时长">
        {data.games.map(game => (
          <article key={game.game_type}>
            <div><strong>{gameName(game.game_type)}</strong><small>{formatCount(game.active_users)} 位活跃玩家</small></div>
            <i><em style={{ width: `${toNumber(game.player_duration_seconds) / maxDuration * 100}%` }} /></i>
            <span>{formatHours(game.player_duration_seconds)}</span>
          </article>
        ))}
      </section>

      <section className={styles.tablePanel} aria-label="游戏活跃分析">
        <div className={styles.tableScroller}>
          <table>
            <thead>
              <tr>
                <th>游戏</th>
                <th>活跃玩家</th>
                <th>开始对局</th>
                <th>完成对局</th>
                <th>完成率</th>
                <th>对局小时</th>
                <th>玩家投入小时</th>
                <th>平均单局</th>
                <th>平均真人玩家</th>
              </tr>
            </thead>
            <tbody>
              {data.games.map(game => (
                <tr key={game.game_type}>
                  <td><strong>{gameName(game.game_type)}</strong><small>{game.game_type}</small></td>
                  <td>{formatCount(game.active_users)}</td>
                  <td>{formatCount(game.games_started)}</td>
                  <td>{formatCount(game.games_completed)}</td>
                  <td>{formatPercent(game.completion_rate)}</td>
                  <td>{formatHours(game.game_duration_seconds)}</td>
                  <td>{formatHours(game.player_duration_seconds)}</td>
                  <td>{formatDuration(game.average_game_duration_seconds)}</td>
                  <td>{game.average_human_players.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
