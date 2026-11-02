import { FormEvent, useCallback, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ListAdminAnalyticsUsers,
} from '@/api/generated/game-admin';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { ErrorState, LoadingState } from '../components/ResourceState';
import { formatCount, formatDateTime, formatHours, gameName, toNumber } from '../model';
import styles from '../index.module.less';

const pageSize = 20;

type SortKey =
  | 'user'
  | 'created_at'
  | 'last_active_at'
  | 'active_days'
  | 'games_played'
  | 'player_duration'
  | 'favorite_game';
type SortDirection = 'ascending' | 'descending';
type SortState = { key: SortKey; direction: SortDirection };

export default function Users() {
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>();
  const load = useCallback(async () => (
    await ListAdminAnalyticsUsers({
      page,
      page_size: pageSize,
      query: query || undefined,
      sort_by: sort?.key,
      sort_order: sort
        ? sort.direction === 'ascending' ? 'asc' : 'desc'
        : undefined,
    })
  ).data, [page, query, sort]);
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
  const ariaSort = (key: SortKey): SortDirection | 'none' =>
    sort?.key === key ? sort.direction : 'none';
  const sortHeader = (key: SortKey, label: string) => {
    const active = sort?.key === key;
    const nextDirection = active && sort.direction === 'ascending' ? 'descending' : 'ascending';
    const Icon = active
      ? sort.direction === 'ascending' ? ArrowUp : ArrowDown
      : ChevronsUpDown;
    const directionLabel = nextDirection === 'ascending' ? '升序' : '降序';

    return (
      <button
        type="button"
        onClick={() => {
          setPage(1);
          setSort({ key, direction: nextDirection });
        }}
        aria-label={`按${label}${directionLabel}排序`}
        title={`按${label}${directionLabel}排序`}
      >
        <span>{label}</span>
        <Icon size={13} aria-hidden="true" />
      </button>
    );
  };

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
                <th scope="col" aria-sort={ariaSort('user')}>{sortHeader('user', '用户')}</th>
                <th scope="col" aria-sort={ariaSort('created_at')}>{sortHeader('created_at', '注册时间')}</th>
                <th scope="col" aria-sort={ariaSort('last_active_at')}>{sortHeader('last_active_at', '最近活跃')}</th>
                <th scope="col" aria-sort={ariaSort('active_days')}>{sortHeader('active_days', '活跃天数')}</th>
                <th scope="col" aria-sort={ariaSort('games_played')}>{sortHeader('games_played', '参与对局')}</th>
                <th scope="col" aria-sort={ariaSort('player_duration')}>
                  {sortHeader('player_duration', '对局活跃时长（估算）')}
                </th>
                <th scope="col" aria-sort={ariaSort('favorite_game')}>
                  {sortHeader('favorite_game', '偏好游戏')}
                </th>
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
