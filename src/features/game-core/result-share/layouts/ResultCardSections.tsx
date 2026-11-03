import { QRCode } from 'antd';
import { BusFront, Crown } from 'lucide-react';
import { RESULT_CARD_URL } from '../constants';
import {
  formatDuration,
  formatRank,
  formatResultDate,
  formatRole,
  formatScore,
} from '../format';
import type { ResultCardModel } from '../model';
import type { ResultCardTheme } from '../themes';
import styles from './families.module.less';

function outcomeCopy(
  model: ResultCardModel,
  design: ResultCardTheme,
): readonly [string, string] {
  if (model.outcome === 'win' && model.winnerCount > 1) {
    return ['共同登顶', '胜利由你们共同写下'];
  }
  if (model.outcome === 'loss') {
    return [formatRank(model.self.finalRank), design.headlineCopy.loss[1]];
  }
  return design.headlineCopy[model.outcome];
}

export function GameIdentity({
  model,
  design,
  className = '',
}: {
  model: ResultCardModel;
  design: ResultCardTheme;
  className?: string;
}) {
  return <header className={`${styles.identity} ${className}`}>
    <span className={styles.gameIndex}>{design.englishTitle}</span>
    <h1>{design.title}</h1>
    <span className={styles.date}>{formatResultDate(model.endedAt)}</span>
  </header>;
}

export function OutcomeSummary({
  model,
  design,
  className = '',
}: {
  model: ResultCardModel;
  design: ResultCardTheme;
  className?: string;
}) {
  const [headline, subline] = outcomeCopy(model, design);
  return <section className={`${styles.outcome} ${className}`}>
    <span className={styles.outcomeOwner}>{model.self.displayName}</span>
    <h2>{headline}</h2>
    <p>{subline}</p>
    {model.outcome === 'win' && <Crown className={styles.outcomeCrown} size={18} />}
  </section>;
}

export function PersonalMetrics({
  model,
  design,
  className = '',
}: {
  model: ResultCardModel;
  design: ResultCardTheme;
  className?: string;
}) {
  const role = formatRole(model.self, design);
  const extra = role
    ? { label: '本局身份', value: role }
    : model.self.finalMoney != null
      ? {
        label: '最终现金',
        value: `¥${model.self.finalMoney.toLocaleString('zh-CN')}`,
      }
      : model.self.finalStocks > 0
        ? { label: '持有股票', value: String(model.self.finalStocks) }
        : undefined;
  const metrics = [{
    label: '最终名次',
    value: formatRank(model.self.finalRank),
  }, {
    label: design.scoreLabel,
    value: formatScore(model.gameType, model.self.finalScore),
  }, {
    label: '对局时长',
    value: formatDuration(model.durationSeconds),
  }, ...(extra ? [extra] : [])];

  return <section
    className={`${styles.metrics} ${extra ? '' : styles.threeMetrics} ${className}`}
    data-result-metric-style={design.metricStyle}
  >
    {metrics.map(metric => <div key={metric.label}>
      <small>{metric.label}</small>
      <b>{metric.value}</b>
    </div>)}
  </section>;
}

export function ResultCardFooter({
  design,
  className = '',
}: {
  design: ResultCardTheme;
  className?: string;
}) {
  return <footer className={`${styles.footer} ${className}`}>
    <div className={styles.brandSeal}>
      <span><BusFront size={18} /></span>
      <div>
        <small>PLAYED ON</small>
        <b>GAMEBUS</b>
      </div>
    </div>
    <div className={styles.footerCopy}>
      <small>扫码上车，再开一局</small>
      <strong>board.gamebus.online</strong>
    </div>
    <div className={styles.qr} data-qr-value={RESULT_CARD_URL}>
      <QRCode
        type="svg"
        value={RESULT_CARD_URL}
        size={76}
        bordered={false}
        color={design.ink}
        bgColor={design.paper}
        errorLevel="H"
      />
    </div>
  </footer>;
}
