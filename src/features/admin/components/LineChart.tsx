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

export function LineChart({
  labels,
  series,
  valueLabel = value => String(Math.round(value)),
  ariaLabel,
}: LineChartProps) {
  const maximum = Math.max(...series.flatMap(item => item.values), 1);
  const xAt = (index: number) =>
    labels.length <= 1
      ? (plotLeft + plotRight) / 2
      : plotLeft + (index / (labels.length - 1)) * (plotRight - plotLeft);
  const yAt = (value: number) =>
    plotBottom - (value / maximum) * (plotBottom - plotTop);
  const labelStep = Math.max(1, Math.ceil(labels.length / 6));

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
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
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
      </svg>
    </div>
  );
}
