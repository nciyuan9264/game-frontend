import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Clock, Copy, Globe, Info,
  Grid3X3, Lock, Plus, ShieldCheck, Timer, UserPlus, Users, X,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { PlayerAvatar } from '../../components/AppShell';
import { Brand, Disc } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import type { OthelloSession } from '../../hooks/useOthelloSession';
import { othelloRoomInviteURL } from '../../model/adapters';
import { playerName, type MatchSnapshot } from '../../model/session';
import type { Visibility } from '../../model/types';
import styles from './index.module.less';

export function Room({
  session,
  data,
  onLeave,
}: {
  session: OthelloSession;
  data: MatchSnapshot;
  onLeave: () => void;
}) {
  const [panel, setPanel] = useState<'invite' | 'settings' | 'remove' | 'start'>();
  const [target, setTarget] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(data.visibility);
  const [copyMessage, setCopyMessage] = useState('');
  const enabled = session.connection.status === 'connected' && !session.pending;
  const owner = data.playerID === data.ownerID;
  const players = Object.entries(data.players);
  const seats = useMemo(() => Array.from({ length: 2 }, (_, index) =>
    players.find(([, player]) => player.seatIndex === index) ?? players[index]), [players]);
  const allReady = players.length === 2
    && players.every(([, player]) => player.online && player.ready);
  const inviteURL = othelloRoomInviteURL(data.roomID);
  const close = () => setPanel(undefined);
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
    } catch {
      setCopyMessage('复制未成功，请稍后重试');
    }
  };

  return <div className={styles.page}>
    <header className={styles.heading}><div><button type="button" aria-label="离开房间" onClick={onLeave}><ArrowLeft size={18} /></button>
      <span><small>A TABLE FOR TWO · 房间号</small><h1>{data.roomID}<em>准备中</em></h1></span></div>
      <div><ActionButton onClick={() => { setVisibility(data.visibility); setPanel('settings'); }}>
        <Info size={15} />{owner ? '棋室设置' : '棋室信息'}</ActionButton>
        <ActionButton variant="primary" onClick={() => { setCopyMessage(''); setPanel('invite'); }}>
          <UserPlus size={15} />邀请对手</ActionButton></div></header>
    <section className={styles.table}><div className={styles.tableLabel}><span>SEAT · 01</span><Brand small /><span>SEAT · 02</span></div>
      <div className={styles.seats}>{seats.map((entry, index) => {
        const playerID = entry?.[0] ?? '';
        const player = entry?.[1];
        const empty = !player;
        const canAdd = owner && empty && enabled;
        const canRemove = owner && !!player && playerID !== data.ownerID && enabled;
        return <article key={index} className={`${styles.seat} ${empty ? styles.empty : ''}`}>
          <span className={styles.seatNumber}>0{index + 1}</span>
          <Disc side={index === 0 ? 'black' : 'white'} />
          {player ? <PlayerAvatar name={playerName(playerID, data.players)}
            avatar={player.avatar} ai={player.ai} size={66} />
            : <button type="button" aria-label={`在席位 ${index + 1} 添加人机`} disabled={!canAdd}
              onClick={() => session.submit('match_add_ai', { seatIndex: index })}><Plus size={24} /></button>}
          <div><small>{playerID === data.ownerID ? '棋室主人' : empty ? '等待落座' : player?.ai ? 'AI 棋手' : '挑战者'}</small>
            <h2>{player ? playerName(playerID, data.players) : '空席位'}</h2>
            <span className={player?.ready ? styles.ready : styles.waiting}>
              {player?.ready ? <Check size={12} /> : <Clock size={12} />}
              {player?.ready ? '准备就绪' : empty ? '可添加人机' : player?.online ? '等待准备' : '暂时离线'}
            </span></div>
          {canRemove && <button type="button" className={styles.remove}
            aria-label={`移除 ${playerName(playerID, data.players)}`}
            onClick={() => { setTarget(playerID); setPanel('remove'); }}><X size={16} /></button>}
        </article>;
      })}</div>
      <div className={styles.facts}><span><Users size={17} /><b>2 人固定对局</b></span>
        <span><Grid3X3 size={17} /><b>8 × 8 经典棋盘</b></span>
        <span><Timer size={17} /><b>每回合 60 秒</b></span></div>
    </section>
    <footer className={styles.actionBar}><div><small>{owner ? '房主控制' : '你的状态'}</small>
      <strong>{owner ? allReady ? '双方已就绪，可以开始。' : '邀请朋友或添加人机，等待双方准备。'
        : data.players[data.playerID]?.ready ? '你已准备，等待房主开局。' : '确认准备后，房主即可开始。'}</strong></div>
      {owner ? <ActionButton variant="primary" disabled={!enabled || !allReady} onClick={() => setPanel('start')}>
        开始对局<ArrowRight size={16} /></ActionButton>
        : <ActionButton variant={data.players[data.playerID]?.ready ? 'secondary' : 'primary'} disabled={!enabled}
          onClick={() => session.submit('match_ready', { ready: !data.players[data.playerID]?.ready })}>
          {data.players[data.playerID]?.ready ? '取消准备' : '准备就绪'}<Check size={15} /></ActionButton>}
    </footer>

    {panel === 'invite' && <Dialog title="给对面留一个位置" eyebrow="INVITE TO THE QUIET ROOM" onClose={close}
      footer={<><ActionButton onClick={() => void copy(data.roomID, '房间号已复制')}><Copy size={15} />复制房间号</ActionButton>
        <ActionButton variant="primary" onClick={() => void copy(inviteURL, '邀请链接已复制')}><Copy size={15} />复制邀请链接</ActionButton></>}>
      <div className={styles.invite}><p>分享完整链接，对手登录后会直接进入房间 {data.roomID}。</p>
        <label>ROOM NUMBER<input aria-label="分享房间号" value={data.roomID} readOnly
          onClick={event => event.currentTarget.select()} /></label>
        <small><ShieldCheck size={14} />{copyMessage || '邀请链接不包含身份信息。'}</small></div>
    </Dialog>}
    {panel === 'settings' && <Dialog title={owner ? '棋室设置' : '棋室信息'} eyebrow="ROOM VISIBILITY" onClose={close}
      footer={owner ? <><ActionButton onClick={close}>取消</ActionButton><ActionButton variant="primary" disabled={!enabled}
        onClick={() => { if (session.submit('room_update_settings', { visibility })) close(); }}>保存设置</ActionButton></>
        : <ActionButton variant="primary" onClick={close}>知道了</ActionButton>}>
      <div className={styles.settings}>{(['public', 'private'] as const).map(value => <button type="button" key={value}
        disabled={!owner || !enabled} aria-pressed={visibility === value} onClick={() => setVisibility(value)}>
        {value === 'public' ? <Globe size={21} /> : <Lock size={21} />}<span>
          <b>{value === 'public' ? '公开棋室' : '私密棋室'}</b>
          <small>{value === 'public' ? '展示在大厅' : '通过完整房间号加入'}</small></span>
        {visibility === value && <Check size={14} />}</button>)}</div>
    </Dialog>}
    {panel === 'remove' && <Dialog title="让这个席位空出来？" eyebrow="REMOVE PLAYER" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton><ActionButton variant="danger" disabled={!enabled}
        onClick={() => { if (session.submit('match_remove_player', { playerID: target })) close(); }}>确认移除</ActionButton></>}>
      <p className={styles.dialogText}>{playerName(target, data.players)} 将离开当前棋室。</p>
    </Dialog>}
    {panel === 'start' && <Dialog title="让第一枚黑子落下？" eyebrow="BEGIN THE QUIET MATCH" onClose={close}
      footer={<><ActionButton onClick={close}>再等一下</ActionButton><ActionButton variant="primary" disabled={!enabled}
        onClick={() => { if (session.submit('match_begin')) close(); }}>确认开局<ArrowRight size={16} /></ActionButton></>}>
      <div className={styles.start}><div>{players.map(([id, player]) =>
        <span key={id}><PlayerAvatar name={playerName(id, data.players)} avatar={player.avatar}
          ai={player.ai} size={54} /><b>{playerName(id, data.players)}</b></span>)}</div>
        <p>标准中心四子开局，黑方先行。每回合 60 秒，超时由服务端自动代下；双方均无合法落点时按盘面实际子数结算。</p></div>
    </Dialog>}
  </div>;
}
