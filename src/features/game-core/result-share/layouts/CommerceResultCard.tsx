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

export function CommerceResultCard({
  model,
  design,
  density,
}: ResultCardLayoutProps) {
  return <div className={`${styles.layout} ${styles.commerce}`}>
    <section className={`${styles.hero} ${styles.commerceHero}`}>
      <div className={styles.commerceCopy}>
        <GameIdentity model={model} design={design} />
        <OutcomeSummary model={model} design={design} />
      </div>
      <ResultCardVisual design={design} className={styles.commerceVisual} />
    </section>
    <PersonalMetrics model={model} design={design} />
    <ResultStandings model={model} design={design} density={density} />
    <ResultCardFooter design={design} />
  </div>;
}
