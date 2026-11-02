import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from 'react';
import { QRCode } from 'antd';
import { BusFront, Crown, Trophy } from 'lucide-react';
import {
  formatDuration,
  formatRank,
  formatResultDate,
  formatRole,
  formatScore,
} from './format';
import type { ResultCardModel, ResultCardPlayer } from './model';
import { resultCardTheme } from './themes';
import styles from './ResultCard.module.less';

export const RESULT_CARD_URL = 'https://board.gamebus.online';

function initial(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? '?';
}

function outcomeCopy(model: ResultCardModel) {
  if (model.outcome === 'win') {
    return model.winnerCount > 1
      ? ['共同登顶', '胜利由你们共同写下']
      : ['赢下这一局', '漂亮的一局，值得留下'];
  }
  if (model.outcome === 'draw') return ['势均力敌', '这一局，没有人先退一步'];
  return [formatRank(model.self.finalRank), '胜负落定，下一局继续'];
}

function PlayerRow({
  player,
  model,
}: {
  player: ResultCardPlayer;
  model: ResultCardModel;
}) {
  const theme = resultCardTheme(model.gameType);
  const role = formatRole(player, theme);
  return <div
    className={[
      styles.playerRow,
      player.isWinner ? styles.winner : '',
      player.isSelf ? styles.self : '',
    ].filter(Boolean).join(' ')}
  >
    <b className={styles.rank}>
      {player.finalRank == null
        ? '—'
        : String(player.finalRank).padStart(2, '0')}
    </b>
    <span className={styles.avatar}>{initial(player.displayName)}</span>
    <div className={styles.playerName}>
      <strong>{player.displayName}</strong>
      <small>{player.isSelf ? '我的战绩' : player.isAI ? 'AI 玩家' : role ?? '参赛玩家'}</small>
    </div>
    {player.isWinner && <span className={styles.winnerTag}>
      <Crown size={11} />冠军
    </span>}
    <span className={styles.rowScore}>
      <b>{formatScore(model.gameType, player.finalScore)}</b>
      <small>{theme.scoreLabel}</small>
    </span>
  </div>;
}

export function ResultCard({
  model,
  cardRef,
  className = '',
}: {
  model: ResultCardModel;
  cardRef?: Ref<HTMLDivElement>;
  className?: string;
}) {
  const theme = resultCardTheme(model.gameType);
  const [headline, subline] = outcomeCopy(model);
  const role = formatRole(model.self, theme);
  const compact = model.players.length > 6;
  const hasExtraMetric = !!role
    || model.self.finalMoney != null
    || model.self.finalStocks > 0;
  const variables = {
    '--result-primary': theme.primary,
    '--result-secondary': theme.secondary,
    '--result-paper': theme.paper,
    '--result-ink': theme.ink,
    '--result-accent': theme.accent,
  } as CSSProperties;
  return <article
    ref={cardRef}
    className={`${styles.card} ${compact ? styles.compact : ''} ${className}`}
    style={variables}
    data-result-card
  >
    <header className={styles.header}>
      <span className={styles.brand}><BusFront size={19} /><b>GAMEBUS</b></span>
      <span>{formatResultDate(model.endedAt)}</span>
    </header>
    <section className={styles.hero}>
      <div>
        <small>{theme.englishTitle} · FINAL RESULT</small>
        <h1>{theme.title}</h1>
      </div>
      <div className={styles.outcome}>
        <span className={styles.trophy}><Trophy size={31} /></span>
        <div><small>{model.self.displayName}</small><strong>{headline}</strong>
          <p>{subline}</p></div>
      </div>
    </section>
    <section className={`${styles.metrics} ${hasExtraMetric ? '' : styles.threeMetrics}`}>
      <div><small>最终名次</small><b>{formatRank(model.self.finalRank)}</b></div>
      <div><small>{theme.scoreLabel}</small>
        <b>{formatScore(model.gameType, model.self.finalScore)}</b></div>
      <div><small>对局时长</small><b>{formatDuration(model.durationSeconds)}</b></div>
      {hasExtraMetric && <div>
        <small>{role ? '本局身份' : model.self.finalMoney != null ? '最终现金' : '持有股票'}</small>
        <b>{role ?? (model.self.finalMoney != null
          ? `¥${model.self.finalMoney.toLocaleString('zh-CN')}`
          : model.self.finalStocks)}</b>
      </div>}
    </section>
    <section className={styles.standings}>
      <header><div><small>FINAL STANDINGS</small><h2>最终排名</h2></div>
        <span>{model.players.length} 位玩家</span></header>
      <div className={styles.playerList}>
        {model.players.map((player, index) =>
          <PlayerRow key={`${player.seatIndex}-${index}`}
            player={player} model={model} />)}
      </div>
    </section>
    <footer className={styles.footer}>
      <div className={styles.callout}><BusFront size={21} />
        <div><small>扫码上车，再开一局</small>
          <strong>board.gamebus.online</strong></div></div>
      <div className={styles.qr} data-qr-value={RESULT_CARD_URL}>
        <QRCode
          type="svg"
          value={RESULT_CARD_URL}
          size={76}
          bordered={false}
          color={theme.ink}
          bgColor={theme.paper}
          errorLevel="H"
        />
      </div>
    </footer>
  </article>;
}

export function ResultCardPreview({ model }: { model: ResultCardModel }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => setScale(viewport.clientWidth / 540);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);
  return <div ref={viewportRef} className={styles.preview}>
    <ResultCard model={model} className={styles.previewCard}
      cardRef={undefined} />
    <style>{`.${styles.previewCard}{transform:scale(${scale});}`}</style>
  </div>;
}
