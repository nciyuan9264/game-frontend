import { Bot, Check, Clock, Crown, Globe, Lock, MoreHorizontal, Plus, ShieldCheck, Users, Wallet } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { AnimatedValue } from '../../components/AnimatedValue';
import { PlayerAvatar } from '../../components/AppShell';
import { playerName, type MatchSnapshot } from '../../model/session';
import tableArt from '../../assets/table-art.webp';
import styles from './index.module.less';

export interface RoomProps {
  data: MatchSnapshot; enabled: boolean; pending: boolean;
  onAddAI: (seatIndex?: number) => void; onRemove: (id: string) => void; onReady: () => void;
  onStart: () => void; onInvite: () => void; onSettings: () => void;
}
export function roomReadiness(data: MatchSnapshot) {
  const players = Object.values(data.players);
  const ready = players.filter(player => player.ready && player.online).length;
  return { count: players.length, ready, canStart: players.length >= 2 && ready === players.length,
    reason: players.length < 2 ? '再来一位，就能开场。' : ready < players.length ? '等每一位合伙人准备好。' : '一切就绪，好局即将开场。' };
}
export function roomSeatOrder(data: MatchSnapshot) {
  // #region debug-point B:room-render
  void fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'room-create-filter-error', runId: 'pre-fix', hypothesisId: 'B', location: 'features/acquire/pages/Room/parts.tsx:roomSeatOrder', msg: '[DEBUG] Acquire room seat render input', data: { roomID: data.roomID, playerOrderIsArray: Array.isArray(data.playerOrder), playerOrderLength: Array.isArray(data.playerOrder) ? data.playerOrder.length : -1, playersIsRecord: !!data.players && typeof data.players === 'object', playerCount: data.players && typeof data.players === 'object' ? Object.keys(data.players).length : -1, path: window.location.pathname, serviceWorkerControlled: !!navigator.serviceWorker?.controller }, ts: Date.now() }) }).catch(() => {});
  // #endregion
  const order = [...data.playerOrder.filter(id => data.players[id]), ...Object.keys(data.players).filter(id => !data.playerOrder.includes(id))];
  const seats = Array<string | undefined>(6);
  const unassigned: string[] = [];
  order.forEach(id => {
    const seatIndex = data.players[id].seatIndex;
    if (typeof seatIndex === 'number' && Number.isInteger(seatIndex) && seatIndex >= 0 && seatIndex < seats.length && !seats[seatIndex])
      seats[seatIndex] = id;
    else unassigned.push(id);
  });
  unassigned.forEach(id => {
    const index = seats.findIndex(seat => !seat);
    if (index >= 0) seats[index] = id;
  });
  return seats;
}
export function Seats(props: RoomProps) {
  const { data, enabled } = props;
  const isOwner = data.playerID === data.ownerID;
  const seats = roomSeatOrder(data);
  return <div className={styles.seats}>{Array.from({ length: 6 }, (_, index) => {
    const id = seats[index], player = id ? data.players[id] : undefined;
    return player && id ? <article className={`${styles.seat} ${id === data.playerID ? styles.self : ''}`} key={id}>
      <span className={styles.seatNumber}>SEAT {String(index + 1).padStart(2, '0')}</span>
      <PlayerAvatar size={58} name={playerName(id, data.players)} avatar={player.avatar} ai={player.ai} />
      <strong>{playerName(id, data.players)} {id === data.ownerID && <Crown size={13} />}{id === data.playerID && <em>你</em>}</strong>
      <span className={player.ready ? styles.ready : styles.muted}>{player.ready ? <Check size={13} /> : <Users size={13} />}{player.ready ? '准备就绪' : '等待准备'}{player.ai && ' · 人机'}</span>
      {isOwner && id !== data.playerID && <button disabled={!enabled} className={styles.remove} onClick={() => props.onRemove(id)} aria-label={`管理席位 ${index + 1}`}><MoreHorizontal size={18} /></button>}
    </article> : <button className={`${styles.seat} ${styles.empty}`} key={`empty-${index}`} disabled={!enabled}
      aria-label={isOwner ? `在席位 ${index + 1} 添加人机` : `邀请好友加入席位 ${index + 1}`}
      onClick={isOwner ? () => props.onAddAI(index) : props.onInvite}>
      <span className={styles.seatNumber}>SEAT {String(index + 1).padStart(2, '0')}</span>
      <span className={styles.emptyAvatar}>{isOwner ? <Bot size={25} /> : <Plus size={25} />}</span>
      <strong>{isOwner ? '添加人机' : '等待合伙人'}</strong><small>{isOwner ? '点击入座 · 自动准备' : '邀请好友入座'}</small>
    </button>;
  })}</div>;
}
export function TablePanel(props: RoomProps) {
  const players = Object.values(props.data.players);
  const ready = players.filter(player => player.ready && player.online).length;
  return <section className={styles.tablePanel}><header><span><Users size={16} />经典对局<i /><AnimatedValue value={players.length} /> / 6 人</span>
    <div className={styles.preparation}><span className={styles.done}><Check size={12} />入座</span><i /><span className={styles.active}>02 准备</span><i /><span>03 开局</span></div></header>
    <div className={styles.tableStage}><div className={styles.orbit} /><div className={`${styles.orbit} ${styles.orbitSecond}`} />
      <img className={styles.tableArt} src={tableArt} alt="为下一场对局准备的城市桌游" />
      <Seats {...props} />
      <div className={styles.coordinates}><span>ACQ / CLASSIC</span><span>EST. 1964</span></div>
    </div>
    <footer><span><Wallet size={16} /><small>起始资金</small><b>$6,000</b></span>
      <span><Clock size={16} /><small>阶段时限</small><b>20–60 秒</b></span>
      <span><ShieldCheck size={16} /><small>已准备</small><b><AnimatedValue value={ready} /> / <AnimatedValue value={players.length} /></b></span></footer>
  </section>;
}
export function RoomFacts({ data, onAddAI, enabled }: RoomProps) {
  const { count, ready } = roomReadiness(data);
  const owner = data.playerID === data.ownerID;
  return <aside className={styles.facts}><small>BEFORE THE FIRST MOVE</small><h2>人齐了，就开场。</h2>
    <div className={styles.visibility}>{data.visibility === 'private' ? <Lock size={23} /> : <Globe size={23} />}<span><b>{data.visibility === 'private' ? '私密房间' : '公开房间'}</b><p>{data.visibility === 'private' ? '登录玩家凭完整房间号加入' : '其他玩家可从大厅找到这张桌'}</p></span></div>
    <dl><div><dt>玩法</dt><dd>经典对局</dd></div><div><dt>已入座</dt><dd><AnimatedValue value={count} /> / 6 人</dd></div>
      <div><dt>已准备</dt><dd><AnimatedValue value={ready} /> / <AnimatedValue value={count} /> 人</dd></div>
      <div><dt>人机玩家</dt><dd><AnimatedValue value={Object.values(data.players).filter(player => player.ai).length} /> 位</dd></div></dl>
    {owner && <ActionButton disabled={!enabled || count >= 6} onClick={() => onAddAI()}><Bot size={16} />{count >= 6 ? '席位已满' : '添加人机'}<Plus size={14} /></ActionButton>}
    <div className={styles.startNote}><ShieldCheck size={18} /><div><strong>至少 2 人，全部准备后开始</strong><p>{owner
      ? '人机添加后自动准备。邀请朋友入座，或直接补上人机，由你开启对局。'
      : '准备好后告诉房主。只有房主可以添加人机、管理席位和开始对局。'}</p></div></div>
  </aside>;
}
export function StartBar(props: RoomProps) {
  const { data, enabled, pending } = props;
  const { canStart, reason } = roomReadiness(data), owner = data.playerID === data.ownerID;
  return <footer className={styles.startBar}><div><span className={`${styles.readinessIcon} ${canStart ? styles.readinessDone : ''}`}>{canStart ? <Check size={18} /> : <Users size={18} />}</span>
    <span><strong>{reason}</strong><small>{owner ? '你是房主，由你开启这一局。' : data.players[data.playerID]?.ready ? '你已准备，等待房主开始。' : '准备好后，告诉房主你已就绪。'}</small></span></div>
    <div className={styles.startActions}><ActionButton variant="primary" pending={pending} disabled={!enabled || (owner && !canStart)} onClick={owner ? props.onStart : props.onReady}>
      {owner ? '开始对局' : data.players[data.playerID]?.ready ? '取消准备' : '我准备好了'}
    </ActionButton></div></footer>;
}
