import { ArrowRight, Building2, Lock, Users } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { roomOwnerProfile } from '@/features/game-core/model/room';
import type { AcquireRoom } from '../../model/types';
import { roomEntry } from '../../model/adapters';
import { PlayerAvatar } from '../AppShell';
import styles from './index.module.less';

const ACQUIRE_TILE_COUNT = 108;

function roomProgress(room: AcquireRoom) {
  if (room.status === 'match') return 0;
  if (room.status === 'end') return ACQUIRE_TILE_COUNT;
  if (typeof room.emptyTileCount === 'number') {
    return Math.min(ACQUIRE_TILE_COUNT, Math.max(0, ACQUIRE_TILE_COUNT - room.emptyTileCount));
  }
  return Math.round(ACQUIRE_TILE_COUNT / 2);
}

export function RoomCard({ room, userID, onEnter }: {
  room: AcquireRoom;
  userID: string;
  onEnter: (room: AcquireRoom) => void;
}) {
  const entry = roomEntry(room, { userID });
  const owner = roomOwnerProfile(room);
  const bots = room.roomPlayer.filter(player => player.ai).length;
  const progress = roomProgress(room);
  return <article className={styles.card} aria-label={`房间 ${room.roomID}`}>
    <div className={styles.heading}>
      <div className={styles.identity}><small>房间号</small><h3>{room.roomID}</h3></div>
      <span className={`${styles.status} ${room.status !== 'match' ? styles.playing : ''}`}>{room.status === 'match' ? '等待入座' : room.status === 'end' ? '已结束' : '对局中'}</span>
    </div>
    <div className={styles.meta}>
      <div className={styles.host}><PlayerAvatar name={owner.name} avatar={owner.avatar} size={24} /><span>房主</span><strong title={owner.name}>{owner.name}</strong></div>
      <span className={`${styles.mode} ${room.visibility === 'private' ? styles.private : ''}`}>
        {room.visibility === 'private' ? <><Lock size={13} />仅你可见</> : <><Building2 size={13} />经典对局</>}
      </span>
    </div>
    <div className={styles.progress} role="progressbar" aria-label="对局进度"
      aria-valuemin={0} aria-valuemax={ACQUIRE_TILE_COUNT} aria-valuenow={progress}>
      <i style={{ width: `${progress / ACQUIRE_TILE_COUNT * 100}%` }} />
    </div>
    <div className={styles.bottom}>
      <div className={styles.capacity}><span><Users size={16} /><b>{room.roomPlayer.length}</b> / {room.maxPlayers} 人</span><small>含 {bots} 位人机</small></div>
      <ActionButton disabled={!entry.allowed} onClick={() => onEnter(room)} aria-label={`${entry.label} ${room.roomID}`}>{entry.label}<ArrowRight size={15} /></ActionButton>
    </div>
  </article>;
}
