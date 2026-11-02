import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import styles from '../index.module.less';

export interface ChartSeries {
  label: string;
  color: string;
  values: number[];
}

interface LineChartProps {
  labels: string[];
  series: ChartSeries[];
  valueLabel?: (value: number) => string;
  ariaLabel: string;
}

const width = 900;
const height = 240;
const plotLeft = 24;
const plotRight = 876;
const plotTop = 18;
const plotBottom = 202;
const tooltipWidth = 190;

export function LineChart({
  labels,
  series,
  valueLabel = value => String(Math.round(value)),
  ariaLabel,
}: LineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>();
  const maximum = Math.max(...series.flatMap(item => item.values), 1);
  const xAt = (index: number) =>
    labels.length <= 1
      ? (plotLeft + plotRight) / 2
      : plotLeft + (index / (labels.length - 1)) * (plotRight - plotLeft);
  const yAt = (value: number) =>
    plotBottom - (value / maximum) * (plotBottom - plotTop);
  const labelStep = Math.max(1, Math.ceil(labels.length / 6));
  const visibleIndex = activeIndex !== undefined && activeIndex < labels.length
    ? activeIndex
    : undefined;
  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (labels.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;
    const chartX = ((event.clientX - bounds.left) / bounds.width) * width;
    const ratio = (chartX - plotLeft) / (plotRight - plotLeft);
    const nextIndex = labels.length === 1
      ? 0
      : Math.round(Math.min(1, Math.max(0, ratio)) * (labels.length - 1));
    setActiveIndex(nextIndex);
  };
  const tooltipHeight = 34 + series.length * 21;
  const activeX = visibleIndex === undefined ? 0 : xAt(visibleIndex);
  const tooltipX = Math.min(
    plotRight - tooltipWidth,
    Math.max(plotLeft, activeX - tooltipWidth / 2),
  );

  return (
    <div className={styles.chart} role="img" aria-label={ariaLabel}>
      <div className={styles.chartLegend}>
        {series.map(item => (
          <span key={item.label}>
            <i style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActiveIndex(undefined)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = plotBottom - ratio * (plotBottom - plotTop);
          return (
            <g key={ratio}>
              <line x1={plotLeft} x2={plotRight} y1={y} y2={y} className={styles.chartGridLine} />
              <text x={plotLeft} y={y - 5} className={styles.chartAxis}>
                {valueLabel(maximum * ratio)}
              </text>
            </g>
          );
        })}
        {series.map(item => {
          const points = item.values
            .map((value, index) => `${xAt(index)},${yAt(value)}`)
            .join(' ');
          return (
            <g key={item.label}>
              <polyline
                points={points}
                fill="none"
                stroke={item.color}
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
              {item.values.map((value, index) => (
                <circle
                  key={`${item.label}-${labels[index]}`}
                  cx={xAt(index)}
                  cy={yAt(value)}
                  r="4"
                  fill={item.color}
                >
                  <title>{`${labels[index]} · ${item.label} ${valueLabel(value)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
        {labels.map((label, index) => (
          index % labelStep === 0 || index === labels.length - 1
            ? (
              <text key={label} x={xAt(index)} y="228" textAnchor="middle" className={styles.chartAxis}>
                {label.slice(5)}
              </text>
            )
            : null
        ))}
        <rect
          x={plotLeft}
          y={plotTop}
          width={plotRight - plotLeft}
          height={plotBottom - plotTop}
          className={styles.chartHitArea}
        />
        {visibleIndex !== undefined && (
          <g className={styles.chartHover}>
            <line
              x1={activeX}
              x2={activeX}
              y1={plotTop}
              y2={plotBottom}
              className={styles.chartHoverLine}
            />
            {series.map(item => (
              <circle
                key={`active-${item.label}`}
                cx={activeX}
                cy={yAt(item.values[visibleIndex] ?? 0)}
                r="5"
                fill={item.color}
                className={styles.chartHoverPoint}
              />
            ))}
            <g
              role="tooltip"
              aria-label={`${labels[visibleIndex]}，${series
                .map(item => `${item.label} ${valueLabel(item.values[visibleIndex] ?? 0)}`)
                .join('，')}`}
              data-chart-tooltip
              className={styles.chartTooltip}
            >
              <rect
                x={tooltipX}
                y={plotTop + 6}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="5"
              />
              <text x={tooltipX + 11} y={plotTop + 24} className={styles.chartTooltipDate}>
                {labels[visibleIndex]}
              </text>
              {series.map((item, index) => {
                const rowY = plotTop + 45 + index * 21;
                return (
                  <g key={`tooltip-${item.label}`}>
                    <circle cx={tooltipX + 12} cy={rowY - 4} r="4" fill={item.color} />
                    <text x={tooltipX + 23} y={rowY} className={styles.chartTooltipLabel}>
                      {item.label}
                    </text>
                    <text
                      x={tooltipX + tooltipWidth - 10}
                      y={rowY}
                      textAnchor="end"
                      className={styles.chartTooltipValue}
                    >
                      {valueLabel(item.values[visibleIndex] ?? 0)}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
