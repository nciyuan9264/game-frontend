import type { ReactNode } from 'react';
import { ArrowRight, Lock, Users } from 'lucide-react';
import { ActionButton } from '../ActionButton';
import styles from './index.module.less';

export interface GameMobileRoomCardProps {
  roomID: string;
  title?: ReactNode;
  ownerName: ReactNode;
  ownerAvatar: ReactNode;
  playerCount: number;
  maxPlayers: number;
  status: ReactNode;
  meta?: ReactNode;
  privateRoom?: boolean;
  actionLabel: ReactNode;
  actionDisabled?: boolean;
  onEnter: () => void;
}

export function GameMobileRoomCard({
  roomID,
  title,
  ownerName,
  ownerAvatar,
  playerCount,
  maxPlayers,
  status,
  meta,
  privateRoom,
  actionLabel,
  actionDisabled,
  onEnter,
}: GameMobileRoomCardProps) {
  return <article className={styles.roomCard} data-game-mobile-room-card>
    <header><span>{privateRoom && <Lock size={12} />}{roomID}</span>
      <b>{status}</b></header>
    {title && <h3>{title}</h3>}
    <div className={styles.roomOwner}>{ownerAvatar}<span><small>房主</small>
      <strong>{ownerName}</strong></span></div>
    {meta && <div className={styles.roomMeta}>{meta}</div>}
    <footer><span><Users size={14} />{playerCount} / {maxPlayers}</span>
      <ActionButton variant="primary" disabled={actionDisabled} onClick={onEnter}>
        {actionLabel}<ArrowRight size={14} />
      </ActionButton></footer>
  </article>;
}
