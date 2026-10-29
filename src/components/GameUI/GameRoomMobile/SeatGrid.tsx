import type { ReactNode } from 'react';
import { Bot, Check, Clock3, Crown, MoreHorizontal, Plus } from 'lucide-react';
import type { GameMobileRoomPlayer } from './types';
import styles from './index.module.less';

export interface GameMobileSeatGridProps {
  seats: readonly (GameMobileRoomPlayer | undefined)[];
  owner: boolean;
  enabled: boolean;
  renderAvatar: (player: GameMobileRoomPlayer, size: number) => ReactNode;
  renderDecoration?: (player: GameMobileRoomPlayer, index: number) => ReactNode;
  emptyLabel?: ReactNode;
  emptyDescription?: ReactNode;
  dense?: boolean;
  onAddAI: (seatIndex: number) => void;
  onInvite: () => void;
  onRemove: (playerID: string) => void;
  className?: string;
  seatClassName?: string;
}

export function GameMobileSeatGrid({
  seats,
  owner,
  enabled,
  renderAvatar,
  renderDecoration,
  emptyLabel = '等待玩家',
  emptyDescription = '邀请朋友加入',
  dense,
  onAddAI,
  onInvite,
  onRemove,
  className = '',
  seatClassName = '',
}: GameMobileSeatGridProps) {
  return <div className={`${styles.seatGrid} ${dense ? styles.denseSeats : ''} ${className}`}
    data-game-mobile-room-seats>
    {seats.map((player, index) => player
      ? <article className={`${styles.seat} ${player.self ? styles.selfSeat : ''} ${seatClassName}`}
        data-game-mobile-room-seat key={player.id}>
        <span className={styles.seatNumber}>
          SEAT {String(index + 1).padStart(2, '0')}</span>
        {renderDecoration?.(player, index)}
        <div className={styles.seatAvatar}>{renderAvatar(player, dense ? 42 : 48)}</div>
        <strong>{player.name}{player.owner && <Crown size={12} />}
          {player.self && <em>你</em>}</strong>
        {player.role && <small className={styles.seatRole}>{player.role}</small>}
        <span className={player.ready ? styles.ready : styles.waiting}>
          {player.ready ? <Check size={12} /> : <Clock3 size={12} />}
          {player.ready ? '准备就绪' : player.online ? '等待准备' : '暂时离线'}
          {player.ai && ' · 人机'}
        </span>
        {owner && !player.owner && <button type="button" className={styles.seatRemove}
          disabled={!enabled} aria-label={`管理席位 ${index + 1}`}
          onClick={() => onRemove(player.id)}><MoreHorizontal size={17} /></button>}
      </article>
      : <button type="button" className={`${styles.seat} ${styles.emptySeat} ${seatClassName}`}
        data-game-mobile-room-seat key={`empty-${index}`} disabled={!enabled}
        aria-label={owner ? `在席位 ${index + 1} 添加人机` : `邀请玩家加入席位 ${index + 1}`}
        onClick={owner ? () => onAddAI(index) : onInvite}>
        <span className={styles.seatNumber}>
          SEAT {String(index + 1).padStart(2, '0')}</span>
        <span className={styles.emptyAvatar}>
          {owner ? <Bot size={21} /> : <Plus size={21} />}</span>
        <strong>{owner ? '添加公平 AI' : emptyLabel}</strong>
        <small>{owner ? '点击入座 · 自动准备' : emptyDescription}</small>
      </button>)}
  </div>;
}
