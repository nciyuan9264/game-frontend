import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from 'react';
import { RESULT_CARD_URL } from './constants';
import { AbstractResultCard } from './layouts/AbstractResultCard';
import { CommerceResultCard } from './layouts/CommerceResultCard';
import { DeductionResultCard } from './layouts/DeductionResultCard';
import { FestivalResultCard } from './layouts/FestivalResultCard';
import type { ResultCardLayoutProps } from './layouts/types';
import type { ResultCardModel } from './model';
import {
  resultStandingsDensity,
  type ResultStandingsDensity,
} from './ResultStandings';
import { resultCardTheme, type ResultCardFamily } from './themes';
import styles from './ResultCard.module.less';

export { RESULT_CARD_URL };

const familyLayouts: Record<
  ResultCardFamily,
  (props: ResultCardLayoutProps) => JSX.Element
> = {
  commerce: CommerceResultCard,
  abstract: AbstractResultCard,
  deduction: DeductionResultCard,
  festival: FestivalResultCard,
};

export function ResultCard({
  model,
  cardRef,
  className = '',
  style,
}: {
  model: ResultCardModel;
  cardRef?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
}) {
  const design = resultCardTheme(model.gameType);
  const density: ResultStandingsDensity = resultStandingsDensity(
    model.players.length,
  );
  const FamilyLayout = familyLayouts[design.family];
  const variables = {
    '--result-primary': design.primary,
    '--result-secondary': design.secondary,
    '--result-paper': design.paper,
    '--result-ink': design.ink,
    '--result-accent': design.accent,
    '--result-surface': design.surface,
    '--result-muted': design.muted,
    '--result-winner': design.winner,
    '--result-self': design.self,
    ...style,
  } as CSSProperties;

  return <article
    ref={cardRef}
    className={`${styles.card} ${className}`}
    style={variables}
    data-result-card
    data-result-family={design.family}
    data-result-density={density}
    data-result-game={model.gameType}
  >
    <FamilyLayout model={model} design={design} density={density} />
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
    <ResultCard
      model={model}
      className={styles.previewCard}
      style={{ transform: `scale(${scale})` }}
    />
  </div>;
}
