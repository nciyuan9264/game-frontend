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

export function AbstractResultCard({
  model,
  design,
  density,
}: ResultCardLayoutProps) {
  return <div className={`${styles.layout} ${styles.abstract}`}>
    <section className={`${styles.hero} ${styles.abstractHero}`}>
      <GameIdentity
        model={model}
        design={design}
        className={styles.abstractIdentity}
      />
      <ResultCardVisual design={design} className={styles.abstractVisual} />
      <OutcomeSummary
        model={model}
        design={design}
        className={styles.abstractOutcome}
      />
    </section>
    <PersonalMetrics model={model} design={design} />
    <ResultStandings model={model} design={design} density={density} />
    <ResultCardFooter design={design} />
  </div>;
}
