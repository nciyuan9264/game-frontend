import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bot, Check, Clock, Copy, Info, Plus, ShieldCheck, UserPlus, X,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { PlayerAvatar } from '../../components/AppShell';
import type { DavinciSession } from '../../hooks/useDavinciSession';
import { davinciRoomInviteURL } from '../../model/adapters';
import { playerName, type MatchSnapshot } from '../../model/session';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

export function Room({
  session,
  data,
  onLeave,
}: {
  session: DavinciSession;
  data: MatchSnapshot;
  onLeave: () => void;
}) {
  const [panel, setPanel] = useState<'invite' | 'info' | 'remove' | 'start'>();
  const [target, setTarget] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const enabled = session.connection.status === 'connected' && !session.pending;
  const owner = data.playerID === data.ownerID;
  const players = Object.entries(data.players);
  const seats = useMemo(() => Array.from({ length: data.maxPlayers }, (_, index) =>
    players.find(([, player]) => player.seatIndex === index) ?? players[index]), [data.maxPlayers, players]);
  const allReady = players.length === data.maxPlayers && players.every(([, player]) => player.online && player.ready);
  const inviteURL = davinciRoomInviteURL(data.roomID);
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
    } catch {
      setCopyMessage('复制未成功，请稍后重试');
    }
  };
  const close = () => setPanel(undefined);

  return <div className={styles.page}>
    <header className={styles.heading}><div><button type="button" aria-label="离开房间" onClick={onLeave}><ArrowLeft size={18} /></button>
      <span><small>CIPHER ROOM · 房间号</small><h1>{data.roomID}<em>准备中</em></h1></span></div>
      <div><ActionButton onClick={() => setPanel('info')}><Info size={15} />房间信息</ActionButton>
        <ActionButton variant="primary" onClick={() => { setCopyMessage(''); setPanel('invite'); }}><UserPlus size={15} />邀请好友</ActionButton></div></header>
    <section className={styles.table}>
      <div className={styles.tableLabel}><span>BLACK CODE</span><i /><span>WHITE CODE</span></div>
      <div className={styles.seats}>{seats.map((entry, index) => {
        const playerID = entry?.[0] ?? '';
        const player = entry?.[1];
        const empty = !player;
        const canAdd = owner && empty && enabled;
        const canRemove = owner && !!player && playerID !== data.ownerID && enabled;
        return <article key={index} className={`${styles.seat} ${empty ? styles.emptySeat : ''}`}>
          <span className={styles.seatNumber}>0{index + 1}</span>
          {player ? <PlayerAvatar name={playerName(playerID, data.players)} avatar={player.avatar} ai={player.ai} size={62} />
            : <button type="button" aria-label={`在席位 ${index + 1} 添加人机`} disabled={!canAdd}
              onClick={() => session.submit('match_add_ai', { seatIndex: index })}><Plus size={23} /></button>}
          <div><small>{playerID === data.ownerID ? '房主' : empty ? '等待入座' : player?.ai ? 'AI 对手' : '挑战者'}</small>
            <h2>{player ? playerName(playerID, data.players) : '空席位'}</h2>
            <span className={player?.ready ? styles.ready : styles.waiting}>{player?.ready ? <Check size={12} /> : <Clock size={12} />}
              {player?.ready ? '准备就绪' : empty ? '可添加人机' : player?.online ? '等待准备' : '暂时离线'}</span></div>
          {canRemove && <button type="button" className={styles.remove} aria-label={`移除 ${playerName(playerID, data.players)}`}
            onClick={() => { setTarget(playerID); setPanel('remove'); }}><X size={16} /></button>}
        </article>;
      })}</div>
      <div className={styles.tableFacts}><span><b>5</b><small>初始密码牌</small></span><span><b>0–11</b><small>数字范围</small></span><span><b>2</b><small>黑白 JOKER</small></span></div>
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

    {panel === 'invite' && <ResponsiveDialog title="给朋友留一个密码席位" eyebrow="INVITE TO THE CIPHER TABLE"
      themeClassName={rootStyles.root} onClose={close}
      footer={<><ActionButton onClick={() => void copy(data.roomID, '房间号已复制')}><Copy size={15} />复制房间号</ActionButton>
        <ActionButton variant="primary" onClick={() => void copy(inviteURL, '邀请链接已复制')}><Copy size={15} />复制邀请链接</ActionButton></>}>
      <div className={styles.invite}><div>{players.map(([id, player]) => <PlayerAvatar key={id} name={playerName(id, data.players)} avatar={player.avatar} ai={player.ai} size={47} />)}
        {players.length < data.maxPlayers && <span><Plus size={20} /></span>}</div>
        <p>房间 {data.roomID} 还有 {data.maxPlayers - players.length} 个席位。分享完整链接，朋友登录后会直接进入本房间。</p>
        <label>ROOM NUMBER<input aria-label="分享房间号" value={data.roomID} readOnly onClick={event => event.currentTarget.select()} /></label>
        <small><ShieldCheck size={14} />{copyMessage || '邀请链接不会包含玩家身份，登录身份由服务端验证。'}</small></div>
    </ResponsiveDialog>}
    {panel === 'info' && <ResponsiveDialog title="房间信息" eyebrow="ROOM PROTOCOL" themeClassName={rootStyles.root} onClose={close}
      footer={<ActionButton variant="primary" onClick={close}>知道了</ActionButton>}>
      <div className={styles.infoList}><span><UsersFact /><b>2 人固定对局</b><small>真人或人机均可占据第二席位</small></span>
        <span><Clock size={20} /><b>阶段限时</b><small>抽牌 20 秒，猜牌 60 秒，放回 20 秒</small></span>
        <span><ShieldCheck size={20} /><b>服务端规则校验</b><small>身份、回合、牌序与操作阶段均由服务端确认</small></span></div>
    </ResponsiveDialog>}
    {panel === 'remove' && <ResponsiveDialog title="让这个席位空出来？" eyebrow="REMOVE PLAYER" themeClassName={rootStyles.root} onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton><ActionButton variant="danger" disabled={!enabled}
        onClick={() => { if (session.submit('match_remove_player', { playerID: target })) close(); }}>确认移除</ActionButton></>}>
      <p className={styles.dialogText}>{playerName(target, data.players)} 将离开当前房间。你可以重新邀请朋友或添加人机。</p>
    </ResponsiveDialog>}
    {panel === 'start' && <ResponsiveDialog title="开始这场密码对决？" eyebrow="READY TO DECODE" themeClassName={rootStyles.root} onClose={close}
      footer={<><ActionButton onClick={close}>再等一下</ActionButton><ActionButton variant="primary" disabled={!enabled}
        onClick={() => { if (session.submit('match_begin')) close(); }}>确认开局<ArrowRight size={16} /></ActionButton></>}>
      <div className={styles.startPlayers}>{players.map(([id, player]) => <span key={id}><PlayerAvatar name={playerName(id, data.players)} avatar={player.avatar} ai={player.ai} size={50} /><b>{playerName(id, data.players)}</b><small><Check size={12} />准备就绪</small></span>)}</div>
      <p className={styles.dialogText}>开局后，每位玩家获得 5 张密码牌。先揭开对手全部牌的一方获胜。</p>
    </ResponsiveDialog>}
  </div>;
}

function UsersFact() {
  return <Bot size={20} />;
}
