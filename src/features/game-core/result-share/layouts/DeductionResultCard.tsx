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

export function DeductionResultCard({
  model,
  design,
  density,
}: ResultCardLayoutProps) {
  return <div className={`${styles.layout} ${styles.deduction}`}>
    <section className={`${styles.hero} ${styles.deductionHero}`}>
      <ResultCardVisual design={design} className={styles.deductionVisual} />
      <div className={styles.caseFile}>
        <GameIdentity model={model} design={design} />
        <OutcomeSummary model={model} design={design} />
      </div>
      <span className={styles.caseNumber}>
        CASE / {String(model.self.seatIndex + 1).padStart(2, '0')}
      </span>
    </section>
    <PersonalMetrics model={model} design={design} />
    <ResultStandings model={model} design={design} density={density} />
    <ResultCardFooter design={design} />
  </div>;
}
