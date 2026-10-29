import type { ReactNode } from 'react';
import { Trophy } from 'lucide-react';
import { GameTabs } from '../GameTabs';
import type { GameMobileRankingEntry } from './types';
import styles from './index.module.less';

export interface GameMobileRankingsProps<TMode extends string> {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  modes: readonly { value: TMode; label: ReactNode }[];
  mode: TMode;
  onModeChange: (mode: TMode) => void;
  entries: readonly GameMobileRankingEntry[];
  currentUserID?: string;
  renderAvatar: (entry: GameMobileRankingEntry) => ReactNode;
  controls?: ReactNode;
  state?: ReactNode;
  footer?: ReactNode;
}

export function GameMobileRankings<TMode extends string>({
  eyebrow,
  title,
  description,
  icon = <Trophy size={39} />,
  modes,
  mode,
  onModeChange,
  entries,
  currentUserID,
  renderAvatar,
  controls,
  state,
  footer,
}: GameMobileRankingsProps<TMode>) {
  return <div className={`${styles.mobileOnly} ${styles.rankings}`}
    data-game-public-mobile="rankings">
    <section className={styles.rankHero} data-game-mobile-rank-hero>
      {icon}<div><small>{eyebrow}</small><h1>{title}</h1>
        <p>{description}</p></div>
    </section>
    <section className={styles.rankPanel} data-game-mobile-rank-panel>
      <div className={styles.rankControls}>
        <GameTabs items={modes} value={mode} onChange={onModeChange}
          ariaLabel="排行榜模式" className={styles.rankTabs}
          activeClassName={styles.activeTab} />
        {controls}
      </div>
      <div className={`${styles.rankRow} ${styles.rankHead}`}>
        <span>名次</span><span>玩家</span><span>场次</span><span>战绩</span>
      </div>
      {state}
      {entries.map((entry, index) => {
        const mine = String(entry.id) === String(currentUserID);
        return <div className={`${styles.rankRow} ${mine ? styles.rankSelf : ''}`}
          key={entry.id}>
          <span className={styles.rankNumber}>
            {index === 0 ? <Trophy size={18} /> : index + 1}
          </span>
          <span className={styles.rankPlayer}>{renderAvatar(entry)}
            <b>{entry.displayName}</b>{mine && <em>你</em>}</span>
          <span>{entry.totalGames}</span>
          <strong aria-label={entry.metricLabel}>{entry.metric}</strong>
        </div>;
      })}
      {footer}
    </section>
  </div>;
}
