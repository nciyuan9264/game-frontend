import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Globe2,
  LockKeyhole,
  Plus,
  Settings2,
  Share2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { cantStopRoomInviteURL } from '../../model/adapters';
import { playerName, type MatchSnapshot } from '../../model/session';
import type { CantStopSession } from '../../hooks/useCantStopSession';
import type { Visibility } from '../../model/types';
import { Bull, PlayerAvatar } from '../../components/AppShell';
import { NumberCard } from '../../components/Card';
import { Dialog } from '../../components/Dialog';

type Panel = 'settings' | 'invite' | 'remove' | 'start' | undefined;

export function Room({
  session,
  data,
  onLeave,
}: {
  session: CantStopSession;
  data: MatchSnapshot;
  onLeave: () => void;
}) {
  const [panel, setPanel] = useState<Panel>();
  const [target, setTarget] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(data.visibility);
  const [copyMessage, setCopyMessage] = useState('');
  const enabled = session.connection.status === 'connected' && !session.pending;
  const owner = data.playerID === data.ownerID;
  const players = Object.entries(data.players);
  const seats = useMemo(() => Array.from({ length: 4 }, (_, seatIndex) =>
    players.find(([, player]) => player.seatIndex === seatIndex),
  ), [players]);
  const allReady = players.length >= 2
    && players.every(([, player]) => player.ready && (player.online || player.ai));
  const close = () => setPanel(undefined);
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
    } catch {
      setCopyMessage('复制未成功，请选中房间号手动复制');
    }
  };

  return <div className="cs-room-page">
    <header className="cs-room-heading"><div>
      <button type="button" aria-label="离开当前房间" onClick={onLeave}>
        <ArrowLeft size={19} /></button>
      <span><small>THE PLAYFUL TABLE · 房间号</small>
        <h1>{data.roomID}<em>准备中</em></h1>
        <p>{data.visibility === 'private' ? '私密牌桌' : '公开牌桌'} · 经典登山规则</p></span>
    </div><nav>{owner && <ActionButton onClick={() => {
      setVisibility(data.visibility);
      setPanel('settings');
    }}><Settings2 size={16} />房间设置</ActionButton>}
      <ActionButton variant="primary" onClick={() => {
        setCopyMessage('');
        setPanel('invite');
      }}><Share2 size={16} />邀请好友</ActionButton></nav>
    </header>

    <section className="cs-room-banner"><div>
      <span className="cs-eyebrow">EVERYONE AT THE TABLE</span>
      <h2>伙伴就位，就差你了。</h2>
      <p>每回合四枚骰子、三位临时攀登者；服务端负责路线推进、收手、失手与超时托管。</p>
    </div><Bull size={112} /><span><Users size={15} />{players.length} / 4 已入座</span></section>

    <section className="cs-seat-grid">{seats.map((entry, index) => {
      if (!entry) {
        return <button className="cs-seat cs-seat-empty" type="button"
          key={index} disabled={!owner || !enabled}
          aria-label={`添加人机到席位 ${index + 1}`}
          onClick={() => session.submit('match_add_ai', { seatIndex: index })}>
          <span>SEAT {String(index + 1).padStart(2, '0')}</span>
          <i><Plus size={20} /></i><h3>留一个位置</h3>
          <p>{owner ? '点击添加公平 AI' : '等待房主安排席位'}</p>
        </button>;
      }
      const [id, player] = entry;
      const self = id === data.playerID;
      return <article className={`cs-seat ${self ? 'self' : ''}`} key={id}>
        <span>SEAT {String(index + 1).padStart(2, '0')}</span>
        <PlayerAvatar name={playerName(id, data.players)} avatar={player.avatar}
          ai={player.ai} size={48} />
        <small>{id === data.ownerID ? '房主' : player.ai ? '公平 AI' : '山路玩家'}</small>
        <h3>{playerName(id, data.players)}{self && <em>你</em>}</h3>
        <b className={player.ready ? 'ready' : ''}>
          {player.ready ? <Check size={12} /> : <Clock3 size={12} />}
          {player.ready ? '准备就绪' : player.online ? '等待准备' : '暂时离线'}</b>
        {owner && id !== data.ownerID && <button type="button"
          className="cs-seat-remove" disabled={!enabled}
          aria-label={`移除 ${playerName(id, data.players)}`}
          onClick={() => { setTarget(id); setPanel('remove'); }}>
          <X size={14} /></button>}
      </article>;
    })}</section>

    <section className="cs-room-summary"><div>
      {data.visibility === 'private' ? <LockKeyhole size={21} /> : <Globe2 size={21} />}
      <span><b>{data.visibility === 'private' ? '凭房间号加入' : '公开多人牌桌'}</b>
        <small>{data.visibility === 'private'
          ? '不会展示在公开大厅，请直接分享邀请链接。'
          : '其他玩家可以从大厅找到并加入。'}</small></span></div>
      <dl><div><dt>人数</dt><dd>2–4 人</dd></div>
        <div><dt>规则</dt><dd>三列登顶</dd></div>
        <div><dt>阶段时限</dt><dd>60 秒</dd></div>
        <div><dt>路线</dt><dd>2–12 · 11 条</dd></div></dl>
      <p><ShieldCheck size={14} />AI 只基于公开状态决策；骰子、合法路线和结算均由服务端权威处理。</p>
    </section>

    <footer className="cs-ready-dock"><p><Bull size={15} />{owner
      ? allReady ? '所有在座玩家已准备，可以发牌。' : '至少 2 人，并等待所有真人准备。'
      : data.players[data.playerID]?.ready ? '你已准备，等待房主发牌。' : '确认准备后，由房主开始对局。'}</p>
      {owner
        ? <ActionButton variant="primary" disabled={!enabled || !allReady}
          aria-label="开始对局" onClick={() => setPanel('start')}>
          开始对局<ArrowRight size={17} /></ActionButton>
        : <ActionButton variant="primary" disabled={!enabled}
          onClick={() => session.submit('match_ready', {
            ready: !data.players[data.playerID]?.ready,
          })}>{data.players[data.playerID]?.ready ? '已准备 · 取消准备' : '我准备好了'}
          {data.players[data.playerID]?.ready ? <Check size={17} /> : <ArrowRight size={17} />}
        </ActionButton>}
      <button type="button" onClick={onLeave}>离开房间</button>
    </footer>

    {panel === 'invite' && <Dialog title="给朋友，留一张牌桌。"
      eyebrow="INVITE SOMEONE TO THE TABLE" onClose={close}
      footer={<><ActionButton onClick={() =>
        void copy(data.roomID, '房间号已复制')}><Copy size={15} />复制房间号</ActionButton>
        <ActionButton variant="primary" onClick={() =>
          void copy(cantStopRoomInviteURL(data.roomID), '邀请链接已复制')}>
          <Copy size={15} />复制邀请链接</ActionButton></>}>
      <div className="cs-invite"><div>{players.map(([id, player]) =>
        <PlayerAvatar key={id} name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={40} />)}
        {players.length < 4 && <i><Plus size={18} /></i>}</div>
        <p>房间 {data.roomID} 还有 {4 - players.length} 个席位。</p>
        <input aria-label="邀请房间号" value={data.roomID} readOnly
          onFocus={event => event.currentTarget.select()} />
        <small>{copyMessage || (data.visibility === 'private'
          ? '私密房间请分享完整房间号或邀请链接。'
          : '朋友也可以从在线大厅找到这张牌桌。')}</small></div>
    </Dialog>}

    {owner && panel === 'settings' && <Dialog title="房间设置"
      eyebrow="ROOM VISIBILITY" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="primary" disabled={!enabled} onClick={() => {
          if (session.submit('room_update_settings', { visibility })) close();
        }}>保存设置<Check size={15} /></ActionButton></>}>
      <div className="cs-dialog-copy"><p>经典规则、4 个席位和 60 秒时限固定，只需决定房间如何被找到。</p>
        <div className="cs-choice-grid">{(['public', 'private'] as const).map(value =>
          <button type="button" key={value}
            aria-pressed={visibility === value}
            onClick={() => setVisibility(value)}>
            {value === 'public' ? <Globe2 size={23} /> : <LockKeyhole size={23} />}
            <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
              <small>{value === 'public' ? '展示在在线大厅' : '凭完整房间号加入'}</small></span>
            {visibility === value && <Check size={15} />}</button>)}</div>
      </div>
    </Dialog>}

    {panel === 'remove' && <Dialog title="让这个席位空出来？"
      eyebrow="REMOVE PLAYER" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="danger" disabled={!enabled} onClick={() => {
          if (session.submit('match_remove_player', { playerID: target })) close();
        }}>确认移除</ActionButton></>}>
      <div className="cs-remove-copy"><Bull size={48} />
        <p>{playerName(target, data.players)} 将离开当前房间。之后仍可邀请朋友或添加公平 AI。</p></div>
    </Dialog>}

    {panel === 'start' && <Dialog title="现在开始攀登？"
      eyebrow="READY FOR THE FIRST ROLL" onClose={close}
      footer={<><ActionButton onClick={close}>再等一下</ActionButton>
        <ActionButton variant="primary" disabled={!enabled || !allReady}
          onClick={() => {
            if (session.submit('match_begin')) close();
          }}>确认开局<ArrowRight size={16} /></ActionButton></>}>
      <div className="cs-start-dialog"><div>{players.map(([id, player]) =>
        <span key={id}><PlayerAvatar name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={42} />
          <b>{playerName(id, data.players)}</b><small><Check size={11} />已准备</small></span>)}</div>
        <dl><span><Users size={17} /><small>本场人数</small><b>{players.length} 人</b></span>
          <span><Bull size={17} /><small>获胜目标</small><b>3 条路线</b></span>
          <span><Clock3 size={17} /><small>阶段时限</small><b>60 秒</b></span></dl>
        <div className="cs-start-cards">{[2, 7, 12].map(value =>
          <NumberCard key={value} value={value} compact />)}</div>
        <p><ShieldCheck size={14} />确认后由服务端决定先手并同步第一回合。</p></div>
    </Dialog>}
  </div>;
}
