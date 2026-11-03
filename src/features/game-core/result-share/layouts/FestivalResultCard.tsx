import { ResultCardVisual } from '../ResultCardVisual';
import { ResultStandings } from '../ResultStandings';
import {
  GameIdentity,
  OutcomeSummary,
  PersonalMetrics,
  ResultCardFooter,
} from './ResultCardSections';
import type { ResultCardLayoutProps } from './types';
import styles from './families.module.less';

export function FestivalResultCard({
  model,
  design,
  density,
}: ResultCardLayoutProps) {
  return <div className={`${styles.layout} ${styles.festival}`}>
    <section className={`${styles.hero} ${styles.festivalHero}`}>
      <div className={styles.festivalCopy}>
        <GameIdentity model={model} design={design} />
        <OutcomeSummary model={model} design={design} />
      </div>
      <ResultCardVisual design={design} className={styles.festivalVisual} />
      <span className={styles.ticketCode}>
        FINAL / {String(model.players.length).padStart(2, '0')}
      </span>
    </section>
    <PersonalMetrics model={model} design={design} />
    <ResultStandings model={model} design={design} density={density} />
    <ResultCardFooter design={design} />
  </div>;
}
