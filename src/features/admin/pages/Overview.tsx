import { useCallback } from 'react';
import {
  Activity,
  Clock3,
  Gamepad2,
  Gauge,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';
import { GetAdminAnalyticsOverview } from '@/api/generated/game-admin';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { LineChart } from '../components/LineChart';
import { ErrorState, LoadingState } from '../components/ResourceState';
import {
  formatCount,
  formatDuration,
  formatHours,
  formatPercent,
  toNumber,
} from '../model';
import styles from '../index.module.less';

export default function Overview() {
  const load = useCallback(async () => (await GetAdminAnalyticsOverview()).data, []);
  const { data, loading, error, retry } = useAsyncResource(load);

  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={error} retry={retry} />;

  const metrics = data.metrics;
  const metricItems = [
    { label: '用户总数', value: formatCount(metrics.total_users), icon: Users, tone: 'teal' },
    { label: '近 30 日新增', value: formatCount(metrics.new_users), icon: UserPlus, tone: 'blue' },
    { label: '今日活跃', value: formatCount(metrics.dau), icon: Activity, tone: 'green' },
    { label: '月活跃', value: formatCount(metrics.mau), icon: Gauge, tone: 'amber' },
    { label: '首局转化', value: formatPercent(metrics.first_match_conversion_rate), icon: Target, tone: 'violet' },
    { label: '对局完成率', value: formatPercent(metrics.completion_rate), icon: Gamepad2, tone: 'red' },
    { label: '平均单局时长', value: formatDuration(metrics.average_game_duration_seconds), icon: Clock3, tone: 'slate' },
    { label: '人均对局时长', value: formatDuration(metrics.average_player_duration_seconds), icon: Clock3, tone: 'cyan' },
  ] as const;

  return (
    <div className={styles.pageStack}>
      <div className={styles.pageMeta}>
        <span>{data.window.start_date} 至 {data.window.end_date}</span>
        <button type="button" onClick={retry} disabled={loading}>刷新</button>
      </div>

      <section className={styles.metricGrid} aria-label="核心指标">
        {metricItems.map(item => {
          const Icon = item.icon;
          return (
            <article key={item.label} data-tone={item.tone}>
              <span><Icon size={17} /></span>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
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
            ariaLabel="近三十日新增用户和活跃用户趋势"
            labels={data.daily.map(item => item.date)}
            series={[
              { label: '新增用户', color: '#2563eb', values: data.daily.map(item => toNumber(item.new_users)) },
              { label: '活跃用户', color: '#0f766e', values: data.daily.map(item => toNumber(item.active_users)) },
            ]}
          />
        </section>

        <section className={styles.dataPanel}>
          <header>
            <div><small>ENGAGEMENT</small><h2>对局活跃时长（估算）</h2></div>
            <span>{formatHours(metrics.player_duration_seconds)}</span>
          </header>
          <LineChart
            ariaLabel="近三十日对局小时数和玩家投入小时数趋势"
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

      <section className={styles.retentionPanel}>
        <header>
          <div><small>RETENTION</small><h2>首局用户留存</h2></div>
          <span>按首次参与对局日分组</span>
        </header>
        <div>
          {[
            ['D1', metrics.d1_retention_rate],
            ['D7', metrics.d7_retention_rate],
            ['D30', metrics.d30_retention_rate],
            ['DAU / MAU', metrics.dau_mau_rate],
          ].map(([label, rate]) => (
            <article key={String(label)}>
              <span><b>{label}</b><strong>{formatPercent(Number(rate))}</strong></span>
              <i><em style={{ width: `${Math.min(100, Number(rate) * 100)}%` }} /></i>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.compactMetrics}>
        <span><small>WAU</small><strong>{formatCount(metrics.wau)}</strong></span>
        <span><small>MAU</small><strong>{formatCount(metrics.mau)}</strong></span>
        <span><small>开始对局</small><strong>{formatCount(metrics.games_started)}</strong></span>
        <span><small>完成对局</small><strong>{formatCount(metrics.games_completed)}</strong></span>
        <span><small>对局小时</small><strong>{formatHours(metrics.game_duration_seconds)}</strong></span>
        <span><small>玩家投入小时</small><strong>{formatHours(metrics.player_duration_seconds)}</strong></span>
      </section>
    </div>
  );
}
