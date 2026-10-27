import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Coins,
  Copy,
  Gavel,
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
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { forSaleRoomInviteURL } from '../model/adapters';
import {
  playerName,
  type MatchSnapshot,
} from '../model/session';
import {
  roundsFor,
  startingCoins,
  type Visibility,
} from '../model/types';
import type { ForSaleSession } from '../hooks/useForSaleSession';
import { PlayerAvatar } from '../components/GamePieces';

type Panel = 'settings' | 'invite' | 'remove' | 'start' | undefined;

export const Room = ({
  session,
  data,
  onLeave,
}: {
  session: ForSaleSession;
  data: MatchSnapshot;
  onLeave: () => void;
}) => {
  const [panel, setPanel] = useState<Panel>();
  const [target, setTarget] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(data.visibility);
  const [copyMessage, setCopyMessage] = useState('');
  const enabled = session.connection.status === 'connected' && !session.pending;
  const owner = data.playerID === data.ownerID;
  const players = Object.entries(data.players);
  const seats = useMemo(() => Array.from({ length: 6 }, (_, seatIndex) =>
    players.find(([, player]) => player.seatIndex === seatIndex),
  ), [players]);
  const allReady = players.length >= 3
    && players.every(([, player]) => player.ready && (player.online || player.ai));
  const count = Math.max(3, players.length);
  const close = () => setPanel(undefined);
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
    } catch {
      setCopyMessage('复制未成功，请选中房间号手动复制');
    }
  };

  return <div className="fs-room-page"><header className="fs-room-heading">
    <div><button type="button" aria-label="离开当前房间" onClick={onLeave}>
      <ArrowLeft size={19} /></button><span><small>THE SUNDAY AUCTION · 房间号</small>
      <h1>{data.roomID}<em>准备中</em></h1><p>{
        data.visibility === 'private' ? '私密拍卖桌' : '公开拍卖桌'} · 新版经典规则</p>
    </span></div><nav>{owner && <ActionButton onClick={() => {
      setVisibility(data.visibility);
      setPanel('settings');
    }}><Settings2 size={16} />房间设置</ActionButton>}
      <ActionButton variant="primary" onClick={() => {
        setCopyMessage('');
        setPanel('invite');
      }}><Share2 size={16} />邀请好友</ActionButton></nav></header>

    <section className="fs-room-banner"><div>
      <span className="fs-eyebrow">WELCOME TO THE TABLE</span>
      <h2>邻居都到了，就等一声落槌。</h2>
      <p>实际开局人数决定金币、移除牌和每阶段轮数。</p></div>
      <span><Gavel size={42} /></span><b><Users size={15} />{players.length} / 6 已入座</b>
    </section>

    <section className="fs-seat-grid">{seats.map((entry, index) => {
      if (!entry) {
        return <button className="fs-seat empty" type="button"
          key={index} disabled={!owner || !enabled} aria-label={`在席位 ${index + 1} 添加人机`}
          onClick={() => session.submit('match_add_ai', { seatIndex: index })}>
          <span>SEAT {String(index + 1).padStart(2, '0')}</span>
          <i><Plus size={24} /></i><h3>{owner ? '添加公平 AI' : '等待买家'}</h3>
          <p>{owner ? '点击入座 · 自动准备' : '邀请好友加入'}</p></button>;
      }
      const [id, player] = entry;
      const self = id === data.playerID;
      return <article className={`fs-seat ${self ? 'self' : ''}`} key={id}>
        <span>SEAT {String(index + 1).padStart(2, '0')}</span>
        <PlayerAvatar name={playerName(id, data.players)} avatar={player.avatar}
          ai={player.ai} size={58} />
        <small>{id === data.ownerID ? '房主' : player.ai ? '公平 AI' : '买家'}</small>
        <h3>{playerName(id, data.players)}{self && <em>你</em>}</h3>
        <b className={player.ready ? 'ready' : ''}>{
          player.ready ? <Check size={13} /> : <Clock3 size={13} />}
          {player.ready ? '准备就绪' : player.online ? '等待准备' : '暂时离线'}</b>
        {owner && id !== data.ownerID && <button type="button"
          className="fs-seat-remove" disabled={!enabled}
          aria-label={`移除 ${playerName(id, data.players)}`}
          onClick={() => { setTarget(id); setPanel('remove'); }}>
          <X size={14} /></button>}</article>;
    })}</section>

    <section className="fs-room-summary"><div>{
      data.visibility === 'private' ? <LockKeyhole size={21} /> : <Globe2 size={21} />}
      <span><b>{data.visibility === 'private' ? '凭房间号加入' : '公开多人房间'}</b>
        <small>{data.visibility === 'private'
          ? '请直接分享房间号或邀请链接。'
          : '其他玩家可以从大厅找到这张桌。'}</small></span></div>
      <dl><div><dt>预计人数</dt><dd>{players.length || '3–6'} 人</dd></div>
        <div><dt>起始金币</dt><dd><Coins size={15} />{startingCoins(count)} 枚</dd></div>
        <div><dt>阶段轮数</dt><dd>{roundsFor(count)} + {roundsFor(count)} 轮</dd></div>
        <div><dt>操作时限</dt><dd>60 秒</dd></div></dl>
      <p><ShieldCheck size={14} />真人与 AI 使用同一权威规则；隐藏资产按席位隔离。</p>
    </section>

    <footer className="fs-ready-dock"><p><Gavel size={15} />{owner
      ? allReady ? '所有买家已准备，可以开拍。' : '至少 3 人，并等待所有真人准备。'
      : data.players[data.playerID]?.ready ? '你已准备，等待房主开拍。' : '确认准备后，由房主开始。'}</p>
      {owner
        ? <ActionButton variant="primary" disabled={!enabled || !allReady}
          onClick={() => setPanel('start')}>开始拍卖<ArrowRight size={17} /></ActionButton>
        : <ActionButton variant="primary" disabled={!enabled}
          onClick={() => session.submit('match_ready', {
            ready: !data.players[data.playerID]?.ready,
          })}>{data.players[data.playerID]?.ready ? '取消准备' : '我准备好了'}
          <Check size={16} /></ActionButton>}
      <button type="button" onClick={onLeave}>离开房间</button></footer>

    {panel === 'invite' && <ResponsiveDialog title="给朋友，留一个好位置。"
      eyebrow="BETTER AROUND ONE TABLE" onClose={close}
      footer={<><ActionButton onClick={() =>
        void copy(data.roomID, '房间号已复制')}><Copy size={15} />复制房间号</ActionButton>
        <ActionButton variant="primary" onClick={() =>
          void copy(forSaleRoomInviteURL(data.roomID), '邀请链接已复制')}>
          <Copy size={15} />复制邀请链接</ActionButton></>}>
      <div className="fs-invite"><div>{players.map(([id, player]) =>
        <PlayerAvatar key={id} name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={42} />)}
        {players.length < 6 && <i><Plus size={19} /></i>}</div>
        <p>房间 {data.roomID} 还有 {6 - players.length} 个席位。</p>
        <input aria-label="邀请房间号" value={data.roomID} readOnly
          onFocus={event => event.currentTarget.select()} />
        <small>{copyMessage || '分享完整房间号或邀请链接。'}</small></div>
    </ResponsiveDialog>}

    {owner && panel === 'settings' && <ResponsiveDialog title="房间设置"
      eyebrow="ROOM VISIBILITY" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="primary" disabled={!enabled} onClick={() => {
          if (session.submit('room_update_settings', { visibility })) close();
        }}>保存设置<Check size={15} /></ActionButton></>}>
      <div className="fs-dialog-copy"><p>人数、规则和时限固定，只需决定房间如何被找到。</p>
        <div className="fs-choice-grid">{(['public', 'private'] as const).map(value =>
          <button type="button" key={value} aria-pressed={visibility === value}
            onClick={() => setVisibility(value)}>
            {value === 'public' ? <Globe2 size={23} /> : <LockKeyhole size={23} />}
            <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
              <small>{value === 'public' ? '展示在大厅' : '凭房间号加入'}</small></span>
            {visibility === value && <Check size={15} />}</button>)}</div></div>
    </ResponsiveDialog>}

    {panel === 'remove' && <ResponsiveDialog title="让这个席位空出来？"
      eyebrow="REMOVE PLAYER" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="danger" disabled={!enabled} onClick={() => {
          if (session.submit('match_remove_player', { playerID: target })) close();
        }}>确认移除</ActionButton></>}>
      <p>{playerName(target, data.players)} 将离开当前房间。</p>
    </ResponsiveDialog>}

    {panel === 'start' && <ResponsiveDialog title="合伙人齐了，开场吧。"
      eyebrow="READY FOR THE FIRST BID" onClose={close}
      footer={<><ActionButton onClick={close}>再等一下</ActionButton>
        <ActionButton variant="primary" disabled={!enabled || !allReady}
          onClick={() => { if (session.submit('match_begin')) close(); }}>
          确认开局<ArrowRight size={16} /></ActionButton></>}>
      <div className="fs-start-dialog"><div>{players.map(([id, player]) =>
        <span key={id}><PlayerAvatar name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={45} />
          <b>{playerName(id, data.players)}</b><small><Check size={11} />已准备</small></span>)}</div>
        <dl><span><Users size={17} /><small>本场人数</small><b>{players.length} 人</b></span>
          <span><Coins size={17} /><small>起始金币</small>
            <b>{startingCoins(players.length)} 枚</b></span>
          <span><Clock3 size={17} /><small>操作时限</small><b>60 秒</b></span></dl>
        <p><ShieldCheck size={14} />确认后由服务端洗牌并随机决定首位买家。</p></div>
    </ResponsiveDialog>}
  </div>;
};
