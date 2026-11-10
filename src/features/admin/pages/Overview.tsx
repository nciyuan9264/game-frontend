import { useCallback } from 'react';
import {
  Activity,
  CircleCheck,
  CircleOff,
  Clock3,
  Gamepad2,
  Gauge,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';
import { GetAdminAnalyticsOverview } from '@/api/generated/game-admin';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { DateRangePicker } from '../components/DateRangePicker';
import { LineChart } from '../components/LineChart';
import { ErrorState, LoadingState } from '../components/ResourceState';
import { useOverviewDateRange } from '../hooks/useOverviewDateRange';
import {
  cumulativeUserTotals,
  formatCount,
  formatDuration,
  formatHours,
  formatPercent,
  toNumber,
} from '../model';
import styles from '../index.module.less';

export default function Overview() {
  const dateRange = useOverviewDateRange();
  const allTime = dateRange.preset === 'all_time';
  const load = useCallback(async () => (await GetAdminAnalyticsOverview({
    start_date: allTime ? undefined : dateRange.range.start,
    end_date: allTime ? undefined : dateRange.range.end,
    all_time: allTime || undefined,
  })).data, [allTime, dateRange.range.end, dateRange.range.start]);
  const { data, loading, error, retry } = useAsyncResource(load);

  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={error} retry={retry} />;

  const metrics = data.metrics;
  const userTotals = cumulativeUserTotals(
    metrics.total_users,
    data.daily.map(item => item.new_users),
  );
  const acquisitionSources = [...data.acquisition_sources]
    .filter(item => toNumber(item.users) > 0)
    .sort((left, right) => {
      if (left.source === 'unanswered') return 1;
      if (right.source === 'unanswered') return -1;
      return toNumber(right.users) - toNumber(left.users);
    });
  const answeredUsers = data.acquisition_sources
    .filter(item => item.source !== 'unanswered')
    .reduce((total, item) => total + toNumber(item.users), 0);
  const maxSourceUsers = Math.max(1, ...acquisitionSources.map(item => toNumber(item.users)));
  const windowLabel = `${data.window.start_date} 至 ${data.window.end_date}`;
  const metricItems = [
    {
      label: '用户总数',
      value: formatCount(metrics.total_users),
      definition: `截至 ${data.window.end_date} 的累计未注销账号`,
      icon: Users,
      tone: 'teal',
    },
    {
      label: '对局总数',
      value: formatCount(metrics.total_games),
      definition: `截至 ${data.window.end_date} 的累计对局记录`,
      icon: Gamepad2,
      tone: 'blue',
    },
    {
      label: '区间新增',
      value: formatCount(metrics.new_users),
      definition: `${windowLabel} 内注册的账号`,
      icon: UserPlus,
      tone: 'blue',
    },
    {
      label: '结束日活跃',
      value: formatCount(metrics.dau),
      definition: `${data.window.end_date} 至少参与 1 局的去重真人用户`,
      icon: Activity,
      tone: 'green',
    },
    {
      label: '区间活跃',
      value: formatCount(metrics.mau),
      definition: `${windowLabel} 内至少参与 1 局的去重真人用户`,
      icon: Gauge,
      tone: 'amber',
    },
    {
      label: '首局转化',
      value: formatPercent(metrics.first_match_conversion_rate),
      definition: '区间新用户中截至结束日曾参与对局的占比',
      icon: Target,
      tone: 'violet',
    },
    {
      label: '对局完成率',
      value: formatPercent(metrics.completion_rate),
      definition: '区间正常完成对局数 / 开始对局数',
      icon: CircleCheck,
      tone: 'green',
    },
    {
      label: '废弃对局',
      value: formatCount(metrics.games_abandoned),
      definition: '区间开始后未正常完成并被关闭的对局',
      icon: CircleOff,
      tone: 'red',
    },
    {
      label: '平均单局时长',
      value: formatDuration(metrics.average_game_duration_seconds),
      definition: '区间正常完成对局累计时长 / 正常完成局数',
      icon: Clock3,
      tone: 'slate',
    },
    {
      label: '人均对局时长',
      value: formatDuration(metrics.average_player_duration_seconds),
      definition: '区间真人累计对局时长 / 区间活跃用户数（估算）',
      icon: Clock3,
      tone: 'cyan',
    },
  ] as const;

  return (
    <div className={styles.pageStack}>
      <div className={styles.pageMeta}>
        <DateRangePicker
          value={dateRange.range}
          today={dateRange.today}
          allowAllTime
          activePreset={dateRange.preset}
          loading={loading}
          onSelectPreset={dateRange.selectPreset}
          onChange={dateRange.selectCustomRange}
        />
        <button type="button" onClick={retry} disabled={loading}>
          {loading ? '刷新中' : '刷新'}
        </button>
      </div>

      <section className={styles.metricGrid} aria-label="核心指标">
        {metricItems.map(item => {
          const Icon = item.icon;
          return (
            <article key={item.label} data-tone={item.tone}>
              <span><Icon size={17} /></span>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
              <p>{item.definition}</p>
            </article>
          );
        })}
      </section>

      <div className={styles.chartGrid}>
        <section className={styles.dataPanel}>
          <header>
            <div><small>USER GROWTH</small><h2>用户增长与活跃</h2></div>
            <span>北京时间</span>
          </header>
          <LineChart
            ariaLabel="所选日期范围累计用户和活跃用户趋势"
            labels={data.daily.map(item => item.date)}
            series={[
              { label: '累计用户', color: '#2563eb', values: userTotals },
              { label: '活跃用户', color: '#0f766e', values: data.daily.map(item => toNumber(item.active_users)) },
            ]}
          />
        </section>

        <section className={styles.dataPanel}>
          <header>
            <div><small>GAME OUTCOMES</small><h2>对局开始、完成与废弃</h2></div>
            <span>按开始日期归属</span>
          </header>
          <LineChart
            ariaLabel="所选日期范围开始、正常完成和废弃对局趋势"
            labels={data.daily.map(item => item.date)}
            series={[
              { label: '开始对局', color: '#2563eb', values: data.daily.map(item => toNumber(item.games_started)) },
              { label: '正常完成', color: '#0f766e', values: data.daily.map(item => toNumber(item.games_completed)) },
              { label: '废弃对局', color: '#a43f4b', values: data.daily.map(item => toNumber(item.games_abandoned)) },
            ]}
          />
        </section>

        <section className={styles.dataPanel}>
          <header>
            <div><small>ENGAGEMENT</small><h2>对局活跃时长（估算）</h2></div>
            <span>{formatHours(metrics.player_duration_seconds)}</span>
          </header>
          <LineChart
            ariaLabel="所选日期范围对局小时数和玩家投入小时数趋势"
            labels={data.daily.map(item => item.date)}
            valueLabel={value => `${value.toFixed(1)}h`}
            series={[
              {
                label: '对局小时',
                color: '#d97706',
                values: data.daily.map(item => toNumber(item.game_duration_seconds) / 3600),
              },
              {
                label: '玩家投入小时',
                color: '#be123c',
                values: data.daily.map(item => toNumber(item.player_duration_seconds) / 3600),
              },
            ]}
          />
        </section>
      </div>

      <section className={styles.sourcePanel}>
        <header>
          <div><small>ACQUISITION SOURCES</small><h2>新增玩家来源</h2></div>
          <span>{formatCount(answeredUsers)} / {formatCount(metrics.new_users)} 已回答</span>
        </header>
        {acquisitionSources.length > 0
          ? (
            <div className={styles.sourceBars}>
              {acquisitionSources.map(item => {
                const users = toNumber(item.users);
                return (
                  <article key={item.source} data-unanswered={item.source === 'unanswered' || undefined}>
                    <span><b>{item.label}</b><strong>{formatCount(users)}</strong></span>
                    <i><em style={{ width: `${users / maxSourceUsers * 100}%` }} /></i>
                  </article>
                );
              })}
            </div>
          )
          : <p className={styles.emptySource}>所选区间暂无新增用户</p>}
      </section>

      <section className={styles.retentionPanel}>
        <header>
          <div><small>RETENTION</small><h2>首局用户留存</h2></div>
          <span>截至 {data.window.end_date}，按首次参与对局日分组</span>
        </header>
        <div>
          {[
            ['D1', metrics.d1_retention_rate],
            ['D7', metrics.d7_retention_rate],
            ['D30', metrics.d30_retention_rate],
            ['结束日 / 区间活跃', metrics.dau_mau_rate],
          ].map(([label, rate]) => (
            <article key={String(label)}>
              <span><b>{label}</b><strong>{formatPercent(Number(rate))}</strong></span>
              <i><em style={{ width: `${Math.min(100, Number(rate) * 100)}%` }} /></i>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.compactMetrics}>
        <span><small>区间末 7 日活跃</small><strong>{formatCount(metrics.wau)}</strong></span>
        <span><small>区间活跃</small><strong>{formatCount(metrics.mau)}</strong></span>
        <span><small>开始对局</small><strong>{formatCount(metrics.games_started)}</strong></span>
        <span><small>正常完成</small><strong>{formatCount(metrics.games_completed)}</strong></span>
        <span><small>对局小时</small><strong>{formatHours(metrics.game_duration_seconds)}</strong></span>
        <span><small>玩家投入小时</small><strong>{formatHours(metrics.player_duration_seconds)}</strong></span>
      </section>
    </div>
  );
}
