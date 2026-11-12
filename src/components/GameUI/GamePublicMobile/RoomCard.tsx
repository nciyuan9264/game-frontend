import type { ReactNode } from 'react';
import { ArrowRight, Globe2, Lock, Users } from 'lucide-react';
import { ActionButton } from '../ActionButton';
import styles from './index.module.less';

export interface GameMobileRoomProgress {
  current: number;
  total: number;
  label: string;
  description?: ReactNode;
}

export interface GameMobileRoomCardProps {
  roomID: string;
  ownerName: ReactNode;
  ownerAvatar: ReactNode;
  playerCount: number;
  maxPlayers: number;
  status: ReactNode;
  progress?: GameMobileRoomProgress;
  privateRoom?: boolean;
  actionLabel: ReactNode;
  actionDisabled?: boolean;
  onEnter: () => void;
}

export function GameMobileRoomCard({
  roomID,
  ownerName,
  ownerAvatar,
  playerCount,
  maxPlayers,
  status,
  progress,
  privateRoom,
  actionLabel,
  actionDisabled,
  onEnter,
}: GameMobileRoomCardProps) {
  const progressTotal = progress?.total ?? 0;
  const rawProgressCurrent = progress?.current ?? 0;
  const hasProgress = !!progress
    && Number.isFinite(rawProgressCurrent)
    && Number.isFinite(progressTotal)
    && progressTotal > 0;
  const progressCurrent = hasProgress
    ? Math.min(progressTotal, Math.max(0, rawProgressCurrent))
    : 0;

  return <article className={styles.roomCard} data-game-mobile-room-card>
    <div className={styles.roomCardHeading}>
      <div className={styles.roomIdentity}><small>房间号</small>
        <h3>{roomID}</h3></div>
      <span className={styles.roomStatus}>{status}</span>
    </div>
    <div className={styles.roomMetaLine}>
      <div className={styles.roomOwner}>{ownerAvatar}
        <strong>{ownerName}</strong></div>
      <span className={styles.roomMode}>{privateRoom
        ? <><Lock size={12} />私密房间</>
        : <><Globe2 size={12} />公开房间</>}</span>
    </div>
    {hasProgress && <div className={styles.roomProgress} role="progressbar"
      aria-label={progress.label} aria-valuemin={0}
      aria-valuemax={progressTotal} aria-valuenow={progressCurrent}>
      <i style={{ width: `${progressCurrent / progressTotal * 100}%` }} />
    </div>}
    <footer><div className={styles.roomCapacity}>
      <span><Users size={14} />{playerCount} / {maxPlayers}</span>
      {hasProgress && progress.description
        && <small>{progress.description}</small>}
    </div>
      <ActionButton variant="primary" disabled={actionDisabled} onClick={onEnter}>
        {actionLabel}<ArrowRight size={14} />
      </ActionButton></footer>
  </article>;
}
