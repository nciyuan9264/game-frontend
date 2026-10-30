import {
  Bot,
  Check,
  Clock,
  Globe,
  Grid3X3,
  Lock,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Timer,
  Users,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { PlayerAvatar } from '../../components/AppShell';
import { Brand, Disc } from '../../components/Artwork';
import { playerLabel, playerName, type MatchSnapshot } from '../../model/session';
import styles from './index.module.less';

export interface RoomProps {
  data: MatchSnapshot;
  enabled: boolean;
  pending: boolean;
  onAddAI: (seatIndex?: number) => void;
  onRemove: (playerID: string) => void;
  onReady: () => void;
  onStart: () => void;
  onInvite: () => void;
  onSettings: () => void;
}

export function roomReadiness(data: MatchSnapshot) {
  const players = Object.values(data.players);
  const ready = players.filter(player =>
    (player.online || player.ai) && player.ready).length;
  const canStart = players.length === 2 && ready === players.length;
  return {
    count: players.length,
    ready,
    canStart,
    reason: players.length < 2
      ? '再来一位，就能开场。'
      : ready < players.length
        ? '等双方都准备好。'
        : '双方就绪，好局即将开始。',
  };
}

export function roomSeatOrder(data: MatchSnapshot) {
  const order = [
    ...data.playerOrder.filter(id => data.players[id]),
    ...Object.keys(data.players).filter(id => !data.playerOrder.includes(id)),
  ];
  const seats = Array<string | undefined>(2).fill(undefined);
  const unassigned: string[] = [];
  order.forEach(id => {
    const seatIndex = data.players[id].seatIndex;
    if (
      typeof seatIndex === 'number'
      && Number.isInteger(seatIndex)
      && seatIndex >= 0
      && seatIndex < seats.length
      && !seats[seatIndex]
    ) {
      seats[seatIndex] = id;
    } else {
      unassigned.push(id);
    }
  });
  unassigned.forEach(id => {
    const index = seats.findIndex(seat => !seat);
    if (index >= 0) seats[index] = id;
  });
  return seats;
}

export function Seats(props: RoomProps) {
  const { data, enabled } = props;
  const owner = data.playerID === data.ownerID;
  return <div className={styles.seats}>{roomSeatOrder(data).map((id, index) => {
    const player = id ? data.players[id] : undefined;
    const side = index === 0 ? 'white' : 'black';
    return player && id
      ? <article className={`${styles.seat} ${id === data.playerID ? styles.self : ''}`}
        data-testid="hive-room-seat" key={id}>
        <span className={styles.seatNumber}>SEAT {String(index + 1).padStart(2, '0')}</span>
        <Disc side={side} className={styles.sideMarker} />
        <PlayerAvatar name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={54} />
        <strong>{playerLabel(id, data.players)}
          {id === data.playerID && <em>你</em>}</strong>
        <span className={player.ready ? styles.ready : styles.muted}>
          {player.ready ? <Check size={12} /> : <Clock size={12} />}
          {player.ready ? '准备就绪' : player.online ? '等待准备' : '暂时离线'}
          {player.ai && ' · 人机'}</span>
        {owner && id !== data.ownerID && <button type="button"
          className={styles.remove} disabled={!enabled}
          aria-label={`管理席位 ${index + 1}`}
          onClick={() => props.onRemove(id)}><MoreHorizontal size={17} /></button>}
      </article>
      : <button type="button" className={`${styles.seat} ${styles.empty}`}
        data-testid="hive-room-seat" key={`empty-${index}`} disabled={!enabled}
        aria-label={owner
          ? `在席位 ${index + 1} 添加人机`
          : `邀请对手加入席位 ${index + 1}`}
        onClick={owner ? () => props.onAddAI(index) : props.onInvite}>
        <span className={styles.seatNumber}>SEAT {String(index + 1).padStart(2, '0')}</span>
        <span className={styles.emptyAvatar}>
          {owner ? <Bot size={23} /> : <Plus size={23} />}</span>
        <strong>{owner ? '添加人机' : '等待对手'}</strong>
        <small>{owner ? '点击入座 · 自动准备' : '邀请朋友加入'}</small>
      </button>;
  })}</div>;
}

export function TablePanel(props: RoomProps) {
  const readiness = roomReadiness(props.data);
  return <section className={styles.tablePanel} data-testid="hive-room-table">
    <header><span><Users size={15} />基础对局<i />
      {readiness.count} / 2 人</span>
      <div className={styles.preparation}><span className={styles.done}>
        <Check size={11} />入座</span><i /><span className={styles.active}>
          02 准备</span><i /><span>03 开局</span></div></header>
    <div className={styles.tableStage}>
      <div className={styles.boardPattern} aria-hidden="true" />
      <Brand small />
      <Seats {...props} />
      <div className={styles.coordinates}><span>HIVE / 22 TILES</span>
        <span>ONE HIVE · MANY PATHS</span></div>
    </div>
    <footer><span><Grid3X3 size={15} /><small>棋盘</small><b>无边界</b></span>
      <span><Timer size={15} /><small>回合</small><b>120 秒</b></span>
      <span><ShieldCheck size={15} /><small>已准备</small>
        <b>{readiness.ready} / {readiness.count}</b></span></footer>
  </section>;
}

export function RoomFacts(props: RoomProps) {
  const { data, enabled } = props;
  const readiness = roomReadiness(data);
  const owner = data.playerID === data.ownerID;
  const aiCount = Object.values(data.players).filter(player => player.ai).length;
  return <aside className={styles.facts} data-testid="hive-room-facts"><small>BEFORE THE FIRST STEP</small>
    <h2>人齐了，就开场。</h2>
    <div className={styles.visibility}>
      {data.visibility === 'private' ? <Lock size={22} /> : <Globe size={22} />}
      <span><b>{data.visibility === 'private' ? '私密棋室' : '公开棋室'}</b>
        <p>{data.visibility === 'private'
          ? '凭完整房间号或邀请链接加入'
          : '其他棋手可从大厅找到这张桌'}</p></span></div>
    <dl><div><dt>玩法</dt><dd>基础虫棋</dd></div>
      <div><dt>棋子</dt><dd>每方 11 枚</dd></div>
      <div><dt>已入座</dt><dd>{readiness.count} / 2 人</dd></div>
      <div><dt>已准备</dt><dd>{readiness.ready} / {readiness.count} 人</dd></div>
      <div><dt>人机棋手</dt><dd>{aiCount} 位</dd></div></dl>
    {owner && <ActionButton disabled={!enabled || readiness.count >= 2}
      onClick={() => props.onAddAI()}><Bot size={15} />
      {readiness.count >= 2 ? '席位已满' : '添加人机'}<Plus size={13} /></ActionButton>}
    <div className={styles.startNote}><ShieldCheck size={17} /><div>
      <strong>固定 2 人，基础 22 枚，无扩展</strong>
      <p>{owner
        ? '邀请朋友入座，或添加自动准备的人机棋手，由你开启对局。'
        : '准备好后等待房主开局。只有房主可以管理席位。'}</p></div></div>
  </aside>;
}

export function StartBar(props: RoomProps) {
  const { data, enabled, pending } = props;
  const readiness = roomReadiness(data);
  const owner = data.playerID === data.ownerID;
  const selfReady = data.players[data.playerID]?.ready;
  return <footer className={styles.startBar}><div>
    <span className={`${styles.readinessIcon} ${readiness.canStart ? styles.readinessDone : ''}`}>
      {readiness.canStart ? <Check size={17} /> : <Users size={17} />}</span>
    <span><strong>{readiness.reason}</strong><small>{owner
      ? '你是房主，由你落下开局指令。'
      : selfReady ? '你已准备，等待房主开始。' : '准备好后告诉房主你已就绪。'}</small></span></div>
    <div className={styles.startActions}><ActionButton variant="primary"
      pending={pending} disabled={!enabled || (owner && !readiness.canStart)}
      onClick={owner ? props.onStart : props.onReady}>
      {owner ? '开始对局' : selfReady ? '取消准备' : '我准备好了'}</ActionButton></div>
  </footer>;
}
