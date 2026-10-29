import type { ReactNode } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { ActionButton } from '../ActionButton';
import { GameTabs } from '../GameTabs';
import type { GamePublicFact } from './types';
import styles from './index.module.less';

export interface GameMobileGuideProps {
  visual: ReactNode;
  visualFill?: boolean;
  facts: readonly GamePublicFact[];
  tabs: readonly { value: number; label: ReactNode }[];
  index: number;
  onSelect: (index: number) => void;
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  points?: readonly ReactNode[];
  detail?: ReactNode;
  hint: ReactNode;
  primaryLabel: ReactNode;
  onPrimary: () => void;
  secondaryAction?: ReactNode;
}

export function GameMobileGuide({
  visual,
  visualFill,
  facts,
  tabs,
  index,
  onSelect,
  eyebrow,
  title,
  description,
  points,
  detail,
  hint,
  primaryLabel,
  onPrimary,
  secondaryAction,
}: GameMobileGuideProps) {
  return <div className={`${styles.mobileOnly} ${styles.guide}`}
    data-game-public-mobile="guide">
    <aside className={styles.guideVisual} data-game-mobile-guide-visual>
      <div className={`${styles.guideMedia} ${
        visualFill ? styles.guideMediaFill : ''}`}
      data-game-mobile-guide-media>{visual}</div><div className={styles.guideFacts}>
        {facts.map((fact, factIndex) => <span key={factIndex}>{fact.icon}
          <b>{fact.value}</b><small>{fact.label}</small></span>)}
      </div>
    </aside>
    <section className={styles.guidePanel} data-game-mobile-guide-panel>
      <GameTabs items={tabs} value={index} onChange={onSelect}
        ariaLabel="玩法章节" className={styles.guideTabs}
        activeClassName={styles.activeTab} />
      <small>{eyebrow}</small><h1>{title}</h1><p>{description}</p>
      {points?.length && <ol>{points.map((point, pointIndex) =>
        <li key={pointIndex}>{point}</li>)}</ol>}
      {detail}
      <div className={styles.guideHint}><ShieldCheck size={16} />
        <span>{hint}</span></div>
      <div className={styles.guideActions}>
        <ActionButton variant="primary" onClick={onPrimary}>
          {primaryLabel}<ArrowRight size={16} />
        </ActionButton>
        {secondaryAction}
      </div>
    </section>
  </div>;
}
