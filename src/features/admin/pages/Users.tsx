import { FormEvent, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ListAdminAnalyticsUsers } from '@/api/generated/game-admin';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { ErrorState, LoadingState } from '../components/ResourceState';
import { formatCount, formatDateTime, formatHours, gameName, toNumber } from '../model';
import styles from '../index.module.less';

const pageSize = 20;

export default function Users() {
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const load = useCallback(async () => (
    await ListAdminAnalyticsUsers({ page, page_size: pageSize, query: query || undefined })
  ).data, [page, query]);
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
    <div className={styles.pageStack}>
      <div className={styles.tableToolbar}>
        <form onSubmit={submit}>
          <Search size={17} />
          <input
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="搜索用户 ID、名称或邮箱"
            aria-label="搜索用户"
          />
          <button type="submit">搜索</button>
        </form>
        <span>共 {formatCount(total)} 名用户</span>
      </div>

      <section className={styles.tablePanel} aria-label="用户活跃列表">
        <div className={styles.tableScroller}>
          <table>
            <thead>
              <tr>
                <th>用户</th>
                <th>注册时间</th>
                <th>最近活跃</th>
                <th>活跃天数</th>
                <th>参与对局</th>
                <th>对局活跃时长（估算）</th>
                <th>偏好游戏</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => (
                <tr key={user.user_id}>
                  <td>
                    <Link className={styles.userCell} to={`/admin/users/${user.user_id}`}>
                      {user.avatar
                        ? <img src={user.avatar} alt="" />
                        : <span><UserRound size={17} /></span>}
                      <div><strong>{user.display_name}</strong><small>{user.email || `ID ${user.user_id}`}</small></div>
                    </Link>
                  </td>
                  <td>{formatDateTime(user.created_at_unix)}</td>
                  <td>{user.last_active_at_unix ? formatDateTime(user.last_active_at_unix) : '尚未参与'}</td>
                  <td>{formatCount(user.active_days)}</td>
                  <td>{formatCount(user.games_played)}</td>
                  <td>{formatHours(user.player_duration_seconds)}</td>
                  <td>{user.favorite_game_type ? gameName(user.favorite_game_type) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.users.length === 0 && <div className={styles.emptyTable}>没有匹配的用户</div>}
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
