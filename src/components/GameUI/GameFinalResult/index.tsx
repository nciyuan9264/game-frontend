import type { CSSProperties, ReactNode } from 'react';
import { ArrowLeft, Eye, RotateCcw } from 'lucide-react';
import { ActionButton } from '../ActionButton';
import styles from './index.module.less';

const classes = (...values: Array<string | undefined>) =>
  values.filter(Boolean).join(' ');

export interface GameFinalResultProps {
  hero: ReactNode;
  standings: ReactNode;
  summary?: ReactNode;
  actions: ReactNode;
  footerNote?: ReactNode;
  mobileInset: 'self' | 'host';
  className?: string;
  heroClassName?: string;
  contentClassName?: string;
  standingsClassName?: string;
  summaryClassName?: string;
  summaryStyle?: CSSProperties;
  actionsClassName?: string;
  footerNoteClassName?: string;
  testId?: string;
}

export function GameFinalResult({
  hero,
  standings,
  summary,
  actions,
  footerNote,
  mobileInset,
  className,
  heroClassName,
  contentClassName,
  standingsClassName,
  summaryClassName,
  summaryStyle,
  actionsClassName,
  footerNoteClassName,
  testId,
}: GameFinalResultProps) {
  return <main
    className={classes(styles.page, className)}
    data-game-final-result
    data-game-final-result-inset={mobileInset}
    data-testid={testId}
  >
    <section
      className={classes(styles.hero, heroClassName)}
      data-game-final-result-hero
    >
      {hero}
    </section>
    <div
      className={classes(styles.content, contentClassName)}
      data-game-final-result-content
    >
      <section
        className={classes(styles.standings, standingsClassName)}
        data-game-final-result-standings
      >
        {standings}
      </section>
      {summary != null && <aside
        className={classes(styles.summary, summaryClassName)}
        style={summaryStyle}
        data-game-final-result-summary
      >
        {summary}
      </aside>}
    </div>
    <footer
      className={classes(styles.actions, actionsClassName)}
      data-game-final-result-actions
    >
      {actions}
    </footer>
    {footerNote != null && <div
      className={classes(styles.footerNote, footerNoteClassName)}
      data-game-final-result-note
    >
      {footerNote}
    </div>}
  </main>;
}

interface ReplayActionsProps {
  mode: 'replay';
  onViewBoard: () => void;
  viewBoardLabel: string;
}

interface LiveActionsProps {
  mode: 'live';
  onViewBoard: () => void;
  viewBoardLabel: string;
  onLeave: () => void;
  canRestart: boolean;
  onRestart?: () => void | Promise<unknown>;
  restartPending?: boolean;
  restartDisabled?: boolean;
  restartLabel?: string;
}

export type GameFinalResultActionsProps =
  | ReplayActionsProps
  | LiveActionsProps;

export function GameFinalResultActions(props: GameFinalResultActionsProps) {
  const viewBoard = <ActionButton
    data-game-final-result-action="view"
    onClick={props.onViewBoard}
  >
    <Eye size={16} />{props.viewBoardLabel}
  </ActionButton>;

  if (props.mode === 'replay') return viewBoard;

  const restartLabel = props.canRestart
    ? props.restartLabel ?? '再来一局'
    : '等待房主再来一局';

  return <>
    {viewBoard}
    <ActionButton
      data-game-final-result-action="leave"
      onClick={props.onLeave}
    >
      <ArrowLeft size={16} />回到大厅
    </ActionButton>
    <ActionButton
      data-game-final-result-action="restart"
      variant="primary"
      pending={props.restartPending}
      disabled={!props.canRestart || !props.onRestart || props.restartDisabled}
      onClick={() => { void props.onRestart?.(); }}
    >
      <RotateCcw size={16} />{restartLabel}
    </ActionButton>
  </>;
}
