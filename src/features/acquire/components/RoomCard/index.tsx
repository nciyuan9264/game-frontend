import { ArrowRight, Building2, Lock, Users } from 'lucide-react';
import type { AcquireRoom } from '../../model/types';
import { roomEntry, roomOwnerName } from '../../model/adapters';
import { ActionButton } from '../ActionButton';
import { PlayerAvatar } from '../AppShell';
import styles from './index.module.less';

export function RoomCard({ room, playerID, onEnter }: { room: AcquireRoom; playerID: string; onEnter: (room: AcquireRoom) => void }) {
  const entry = roomEntry(room, playerID);
  const owner = room.roomPlayer.find(player => player.playerID === room.ownerID);
  const name = roomOwnerName(room);
  const bots = room.roomPlayer.filter(player => player.ai).length;
  return <article className={styles.card} aria-label={`房间 ${room.roomID}`}>
    <div className={styles.heading}>
      <div className={styles.identity}><small>房间号</small><h3>{room.roomID}</h3></div>
      <span className={`${styles.status} ${room.status !== 'match' ? styles.playing : ''}`}>{room.status === 'match' ? '等待入座' : room.status === 'end' ? '已结束' : '对局中'}</span>
    </div>
    <div className={styles.meta}>
      <div className={styles.host}><PlayerAvatar name={name} avatar={room.ownerAvatar || owner?.avatar} size={24} /><span>房主</span><strong title={name}>{name}</strong></div>
      <span className={`${styles.mode} ${room.visibility === 'private' ? styles.private : ''}`}>
        {room.visibility === 'private' ? <><Lock size={13} />仅你可见</> : <><Building2 size={13} />经典对局</>}
      </span>
    </div>
    <div className={styles.bottom}>
      <div className={styles.capacity}><span><Users size={16} /><b>{room.roomPlayer.length}</b> / {room.maxPlayers} 人</span><small>含 {bots} 位人机</small></div>
      <ActionButton disabled={!entry.allowed} onClick={() => onEnter(room)} aria-label={`${entry.label} ${room.roomID}`}>{entry.label}<ArrowRight size={15} /></ActionButton>
    </div>
  </article>;
}
