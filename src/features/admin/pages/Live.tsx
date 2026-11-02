import { useCallback, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  CircleDot,
  Crown,
  Gamepad2,
  Radio,
  UserRound,
  Users,
} from 'lucide-react';
import { GetAdminAnalyticsLive } from '@/api/generated/game-admin';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { ErrorState, LoadingState } from '../components/ResourceState';
import { formatCount, formatDateTime, gameName } from '../model';
import styles from '../index.module.less';

export default function Live() {
  const load = useCallback(async () => (await GetAdminAnalyticsLive()).data, []);
  const { data, loading, error, retry } = useAsyncResource(load);

  useEffect(() => {
    const timer = window.setInterval(retry, 3_000);
    return () => window.clearInterval(timer);
  }, [retry]);

  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={error} retry={retry} />;

  const liveMetrics: Array<[string, string, LucideIcon, string]> = [
    ['活跃房间', data.active_rooms, Gamepad2, 'teal'],
    ['进行中对局', data.active_matches, Activity, 'blue'],
    ['在线玩家', data.online_players, Users, 'green'],
  ];

  return (
    <div className={styles.pageStack}>
      <div className={styles.liveHeader}>
        <span><Radio size={16} />3 秒自动刷新</span>
        <small>更新于 {formatDateTime(data.generated_at_unix)}</small>
      </div>

      <section className={styles.metricGrid} aria-label="实时平台指标">
        {liveMetrics.map(([label, value, Icon, tone]) => (
          <article key={String(label)} data-tone={tone}>
            <span><Icon size={17} /></span>
            <small>{label}</small>
            <strong>{formatCount(String(value))}</strong>
          </article>
        ))}
      </section>

      <section className={styles.liveGames}>
        {data.games.map(game => (
          <article key={game.game_type}>
            <div><CircleDot size={17} /><strong>{gameName(game.game_type)}</strong></div>
            <span><small>房间</small><b>{formatCount(game.active_rooms)}</b></span>
            <span><small>对局</small><b>{formatCount(game.active_matches)}</b></span>
            <span><small>在线</small><b>{formatCount(game.online_players)}</b></span>
          </article>
        ))}
      </section>

      <section className={`${styles.tablePanel} ${styles.liveTable}`} aria-label="实时房间列表">
        <div className={styles.tableScroller}>
          <table>
            <thead>
              <tr>
                <th>房间</th>
                <th>游戏</th>
                <th>状态</th>
                <th>真人玩家</th>
                <th>在线玩家</th>
                <th>开始时间</th>
              </tr>
            </thead>
            <tbody>
              {data.rooms.map(room => (
                <tr key={room.match_id}>
                  <td><strong>{room.room_id}</strong><small>{room.match_id}</small></td>
                  <td>{gameName(room.game_type)}</td>
                  <td><span className={styles.statusDot}>{room.status}</span></td>
                  <td>
                    <div className={styles.livePlayerList}>
                      {(room.players ?? []).map(player => (
                        <span
                          className={styles.livePlayer}
                          key={player.user_id}
                          title={`${player.display_name} · ${player.online ? '在线' : '离线'}`}
                        >
                          <i data-online={player.online}>
                            {player.avatar
                              ? <img src={player.avatar} alt="" />
                              : <UserRound size={14} aria-hidden="true" />}
                          </i>
                          <b>{player.display_name}</b>
                          {player.is_owner && (
                            <Crown size={13} aria-label="房主" />
                          )}
                        </span>
                      ))}
                      {(room.players ?? []).length === 0 && (
                        <span className={styles.noLivePlayers}>
                          {formatCount(room.human_players)} 名玩家
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{formatCount(room.online_players)}</td>
                  <td>{formatDateTime(room.started_at_unix)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.rooms.length === 0 && <div className={styles.emptyTable}>当前没有进行中的房间</div>}
        </div>
      </section>
    </div>
  );
}
