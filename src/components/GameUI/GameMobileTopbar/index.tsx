import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './index.module.less';

export interface GameMobileTopbarProps {
  onBack: () => void;
  backLabel: string;
  kicker?: ReactNode;
  title: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
  testId?: string;
}

export function GameMobileTopbar({
  onBack,
  backLabel,
  kicker,
  title,
  status,
  actions,
  className,
  testId,
}: GameMobileTopbarProps) {
  return <header
    className={[styles.topbar, className].filter(Boolean).join(' ')}
    data-game-mobile-topbar
    data-testid={testId}
  >
    <button
      type="button"
      className={styles.back}
      aria-label={backLabel}
      onClick={onBack}
    >
      <ArrowLeft size={19} />
    </button>
    <div className={styles.identity} data-game-mobile-topbar-identity>
      {kicker != null && <small>{kicker}</small>}
      <strong>{title}</strong>
    </div>
    {status != null && <div className={styles.status} data-game-mobile-topbar-status>
      {status}
    </div>}
    {actions != null && <div className={styles.actions} data-game-mobile-topbar-actions>
      {actions}
    </div>}
  </header>;
}

export interface GameMobileReplayHeadingProps {
  backTo: string;
  backLabel: string;
  kicker: ReactNode;
  title: ReactNode;
  className?: string;
}

export function GameMobileReplayHeading({
  backTo,
  backLabel,
  kicker,
  title,
  className,
}: GameMobileReplayHeadingProps) {
  return <header
    className={[styles.replayHeading, className].filter(Boolean).join(' ')}
    data-game-mobile-replay-heading
  >
    <Link className={styles.back} to={backTo} aria-label={backLabel}>
      <ArrowLeft size={19} />
    </Link>
    <div className={styles.identity}>
      <small>{kicker}</small>
      <strong>{title}</strong>
    </div>
  </header>;
}
