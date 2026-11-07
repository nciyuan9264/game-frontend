import { Info } from 'lucide-react';
import type { PositionAnalysis as PositionAnalysisValue } from '../../model/types';
import styles from './index.module.less';

const explanation = '由 Edax 盘差和误差模型换算，不是历史胜率；推荐点仅在主动使用提示后显示。';

function integerRates(analysis: PositionAnalysisValue) {
  const values = [
    analysis.blackWinRate ?? 0,
    analysis.drawRate ?? 0,
    analysis.whiteWinRate ?? 0,
  ].map(value => value * 100);
  const rounded = values.map(Math.floor);
  const order = values
    .map((value, index) => ({ index, remainder: value - rounded[index] }))
    .sort((left, right) =>
      right.remainder - left.remainder || left.index - right.index
    );
  let remaining = 100 - rounded.reduce((sum, value) => sum + value, 0);
  for (const item of order) {
    if (remaining <= 0) break;
    rounded[item.index] += 1;
    remaining -= 1;
  }
  return rounded as [number, number, number];
}

export function PositionAnalysis({
  analysis,
  stale = false,
}: {
  analysis?: PositionAnalysisValue;
  stale?: boolean;
}) {
  const ready = analysis?.status === 'ready';
  const [black, draw, white] = ready
    ? integerRates(analysis)
    : [0, 0, 0];
  const label = ready
    ? `黑方胜率 ${black}%，和棋 ${draw}%，白方胜率 ${white}%`
    : '形势参考，暂无分析数据';
  return <section className={styles.analysis}
    data-testid="othello-position-analysis"
    data-status={ready ? (stale ? 'stale' : 'ready') : 'empty'}
    aria-label={label}>
    <div className={styles.summary}>
      <span className={styles.label}>形势参考</span>
      <div className={styles.rates}>
        <strong>黑 {ready ? `${black}%` : '--'}</strong>
        <span>和 {ready ? `${draw}%` : '--'}</span>
        <strong>白 {ready ? `${white}%` : '--'}</strong>
      </div>
      {ready && <span className={styles.engine}>
        {analysis.exact
          ? '最终结果'
          : `Edax · 深度 ${analysis.depth ?? 0} · 局面估计`}
      </span>}
      <span className={styles.info} title={explanation} aria-label={explanation}>
        <Info size={13} />
      </span>
    </div>
    <div className={styles.bar} aria-hidden="true">
      <i className={styles.black} style={{ width: `${black}%` }} />
      <i className={styles.draw} style={{ width: `${draw}%` }} />
      <i className={styles.white} style={{ width: `${white}%` }} />
    </div>
  </section>;
}
