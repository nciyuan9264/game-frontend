import { useCallback } from 'react';
import { ArrowLeft, CalendarDays, Clock3, Gamepad2, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { GetAdminAnalyticsUserActivity } from '@/api/generated/game-admin';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { LineChart } from '../components/LineChart';
import { ErrorState, LoadingState } from '../components/ResourceState';
import {
  formatCount,
  formatDateTime,
  formatHours,
  formatPercent,
  gameName,
  toNumber,
} from '../model';
import styles from '../index.module.less';

export default function UserDetail() {
  const { userID = '' } = useParams();
  const load = useCallback(async () => (
    await GetAdminAnalyticsUserActivity({ user_id: userID })
  ).data, [userID]);
  const { data, loading, error, retry } = useAsyncResource(load);

  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={error} retry={retry} />;

  const user = data.user;
  return (
    <div className={styles.pageStack}>
      <div className={styles.pageMeta}>
        <Link to="/admin/users"><ArrowLeft size={16} />返回用户列表</Link>
        <span>{data.window.start_date} 至 {data.window.end_date}</span>
      </div>

      <section className={styles.userHero}>
        {user.avatar
          ? <img src={user.avatar} alt="" />
          : <span><UserRound size={28} /></span>}
        <div>
          <small>USER #{user.user_id}</small>
          <h2>{user.display_name}</h2>
          <p>{user.email || '未提供邮箱'}</p>
        </div>
        <dl>
          <div><dt><CalendarDays size={16} />注册</dt><dd>{formatDateTime(user.created_at_unix)}</dd></div>
          <div><dt><Gamepad2 size={16} />参与对局</dt><dd>{formatCount(user.games_played)}</dd></div>
          <div><dt><Clock3 size={16} />活跃时长（估算）</dt><dd>{formatHours(user.player_duration_seconds)}</dd></div>
        </dl>
      </section>

      <section className={styles.dataPanel}>
        <header>
          <div><small>DAILY ACTIVITY</small><h2>每日对局活跃时长（估算）</h2></div>
          <span>{formatCount(user.active_days)} 个活跃日</span>
        </header>
        <LineChart
          ariaLabel={`${user.display_name}近三十日参与对局和活跃时长`}
          labels={data.daily.map(item => item.date)}
          valueLabel={value => value.toFixed(1)}
          series={[
            { label: '对局数', color: '#2563eb', values: data.daily.map(item => toNumber(item.games_played)) },
            {
              label: '投入小时',
              color: '#0f766e',
              values: data.daily.map(item => toNumber(item.player_duration_seconds) / 3600),
            },
          ]}
        />
      </section>

      <section className={styles.tablePanel}>
        <header className={styles.panelHeader}>
          <div><small>GAME PREFERENCE</small><h2>游戏偏好</h2></div>
          <span>{user.favorite_game_type ? gameName(user.favorite_game_type) : '暂无偏好'}</span>
        </header>
        <div className={styles.preferenceList}>
          {data.games.map(game => (
            <article key={game.game_type}>
              <div><strong>{gameName(game.game_type)}</strong><small>{formatCount(game.active_days)} 个活跃日</small></div>
              <i><em style={{ width: `${Math.min(100, game.share_rate * 100)}%` }} /></i>
              <span>{formatCount(game.games_played)} 局</span>
              <span>{formatHours(game.player_duration_seconds)}</span>
              <b>{formatPercent(game.share_rate)}</b>
            </article>
          ))}
          {data.games.length === 0 && <div className={styles.emptyTable}>近 30 日暂无对局</div>}
        </div>
      </section>
    </div>
  );
}
