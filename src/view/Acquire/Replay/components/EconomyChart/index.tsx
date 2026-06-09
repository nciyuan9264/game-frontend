import React, { useMemo, useRef, useState } from 'react';
import { backendName2FrontendName } from '@/util/user';
import type { Snapshot, GamePlayer } from '@/types/history';
import styles from './index.module.less';

interface EconomyChartProps {
  snapshots: Snapshot[];
  players?: GamePlayer[];
}

const PALETTE = ['#4f8cff', '#ff7a45', '#52c41a', '#faad14', '#eb2f96', '#13c2c2'];

const PLACE_TILE = 'game_place_tile';

interface SeriesPoint {
  turn: number;
  total: number;
}
interface Series {
  playerID: string;
  color: string;
  points: SeriesPoint[];
}

// SVG 视图坐标（viewBox 内部固定坐标，宽度自适应）
const VB_W = 720;
const VB_H = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;

const formatMoney = (v: number) => {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v}`;
};

const EconomyChart: React.FC<EconomyChartProps> = ({ snapshots, players }) => {
  const [hoverTurn, setHoverTurn] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { series, turnCount, maxTotal } = useMemo(() => {
    const sorted = [...(snapshots ?? [])].sort((a, b) => a.seq - b.seq);

    // 采样：起点（seq=-1）+ 每个放牌事件后的快照
    const sampled = sorted.filter(
      (s) => s.seq === -1 || s.currentEvent?.cmdType === PLACE_TILE
    );
    const points = sampled.length > 0 ? sampled : sorted;

    // 玩家集合 / 配色顺序
    let playerIDs: string[];
    if (players && players.length > 0) {
      playerIDs = players.map((p) => p.playerID);
    } else {
      const first = points.find((s) => s.result && Object.keys(s.result).length > 0);
      playerIDs = first ? Object.keys(first.result) : [];
    }

    let max = 0;
    const s: Series[] = playerIDs.map((pid, i) => {
      const pts: SeriesPoint[] = points.map((snap, turn) => {
        const total = snap.result?.[pid]?.total ?? 0;
        if (total > max) max = total;
        return { turn, total };
      });
      return { playerID: pid, color: PALETTE[i % PALETTE.length], points: pts };
    });

    return { series: s, turnCount: points.length, maxTotal: max };
  }, [snapshots, players]);

  const yMax = maxTotal > 0 ? maxTotal * 1.1 : 100;
  const xMax = Math.max(turnCount - 1, 1);

  const xScale = (turn: number) => PAD.left + (turn / xMax) * PLOT_W;
  const yScale = (val: number) => PAD.top + PLOT_H - (val / yMax) * PLOT_H;

  // y 轴刻度
  const yTicks = useMemo(() => {
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => (yMax / count) * i);
  }, [yMax]);

  // x 轴刻度（抽稀，最多 ~8 个）
  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.ceil(turnCount / 8));
    const ticks: number[] = [];
    for (let i = 0; i < turnCount; i += step) ticks.push(i);
    if (turnCount > 0 && ticks[ticks.length - 1] !== turnCount - 1) {
      ticks.push(turnCount - 1);
    }
    return ticks;
  }, [turnCount]);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || turnCount === 0) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VB_W;
    const turn = Math.round(((x - PAD.left) / PLOT_W) * xMax);
    setHoverTurn(Math.min(Math.max(turn, 0), turnCount - 1));
  };

  if (turnCount === 0 || series.length === 0) {
    return <div className={styles.empty}>暂无经济数据</div>;
  }

  return (
    <div className={styles.chartWrap}>
      <div className={styles.legend}>
        {series.map((s) => (
          <div key={s.playerID} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            {backendName2FrontendName(s.playerID)}
          </div>
        ))}
      </div>

      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHoverTurn(null)}
      >
        {/* y 网格 + 刻度 */}
        {yTicks.map((v, i) => {
          const y = yScale(v);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={VB_W - PAD.right}
                y2={y}
                className={styles.grid}
              />
              <text x={PAD.left - 8} y={y + 3} className={styles.axisLabel} textAnchor="end">
                {formatMoney(Math.round(v))}
              </text>
            </g>
          );
        })}

        {/* x 刻度 */}
        {xTicks.map((t) => (
          <text
            key={t}
            x={xScale(t)}
            y={VB_H - 8}
            className={styles.axisLabel}
            textAnchor="middle"
          >
            {t}
          </text>
        ))}

        {/* hover 参考线 */}
        {hoverTurn !== null && (
          <line
            x1={xScale(hoverTurn)}
            y1={PAD.top}
            x2={xScale(hoverTurn)}
            y2={PAD.top + PLOT_H}
            className={styles.hoverLine}
          />
        )}

        {/* 折线 */}
        {series.map((s) => (
          <polyline
            key={s.playerID}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            points={s.points.map((p) => `${xScale(p.turn)},${yScale(p.total)}`).join(' ')}
          />
        ))}

        {/* hover 数据点 */}
        {hoverTurn !== null &&
          series.map((s) => {
            const p = s.points[hoverTurn];
            if (!p) return null;
            return (
              <circle
                key={s.playerID}
                cx={xScale(p.turn)}
                cy={yScale(p.total)}
                r={3}
                fill={s.color}
              />
            );
          })}
      </svg>

      {hoverTurn !== null && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>回合 {hoverTurn}</div>
          {series.map((s) => (
            <div key={s.playerID} className={styles.tooltipRow}>
              <span className={styles.legendDot} style={{ background: s.color }} />
              <span className={styles.tooltipName}>
                {backendName2FrontendName(s.playerID)}
              </span>
              <span className={styles.tooltipVal}>
                ${s.points[hoverTurn]?.total ?? 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EconomyChart;
