import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Globe2,
  KeyRound,
  Layers3,
  LockKeyhole,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { GameShareContent } from '@/components/GameUI/GameShareContent';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { getProfile } from '@/features/game-core/api/auth';
import { getMyStats } from '@/features/game-core/api/history';
import { useClipboardCopy } from '@/features/game-core/hooks/useClipboardCopy';
import { useLatestAsyncAction } from '@/features/game-core/hooks/useLatestAsyncAction';
import { roomOwnerProfile } from '@/features/game-core/model/room';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import mascot from '../../assets/mascot.jpg';
import { createCantStopRoom, lookupCantStopRoom } from '../../api/room';
import { AppShell, Bull, PlayerAvatar } from '../../components/AppShell';
import { NumberCard } from '../../components/Card';
import { Dialog } from '../../components/Dialog';
import { CantStopLoading } from '../../components/LoadingState';
import { useCantStopLobby } from '../../hooks/useCantStopLobby';
import {
  CANTSTOP_PUBLIC_URL,
  roomEntry,
} from '../../model/adapters';
import type {
  LobbyFilter,
  CantStopRoom,
  Visibility,
} from '../../model/types';

const loadStats = () => getMyStats('cantstop');
const filters: Array<{ value: LobbyFilter; label: string }> = [
  { value: 'all', label: '全部房间' },
  { value: 'joinable', label: '可加入' },
  { value: 'playing', label: '对局中' },
];

function HeroArt() {
  return <div className="cs-hero-art" aria-hidden="true">
    <svg viewBox="0 0 360 240" focusable="false">
      <path className="cs-hero-shadow" d="M44 190c58 26 189 26 260 2 16-6 20-16 8-25-42-31-194-35-259-8-22 9-27 22-9 31z" />
      <path className="cs-hero-board" d="M39 126c36-52 81-80 134-84 58-5 103 21 139 77 10 16 8 35-7 47-43 34-185 40-250 10-20-9-28-33-16-50z" />
      <path className="cs-hero-route" d="M80 142c18-23 36-38 55-45 18-8 37-8 57 1 23 9 42 28 58 56" />
      {[76, 104, 135, 169, 205, 239].map((x, index) =>
        <circle key={x} className={`cs-hero-step step-${index}`} cx={x} cy={151 - index * 8} r="8" />)}
      <path className="cs-hero-peak" d="M154 93l30-48 23 47 18-25 42 87H96l36-61 16 26z" />
      <path className="cs-hero-snow" d="M184 45l-10 32 12-8 10 19 11 4-23-47zM154 93l-12 32 23-18 16 26 11-11-38-29z" />
      <g className="cs-hero-dice">
        <rect x="226" y="50" width="37" height="37" rx="8" />
        <circle cx="237" cy="61" r="3" />
        <circle cx="252" cy="76" r="3" />
        <rect x="274" y="84" width="37" height="37" rx="8" />
        <circle cx="285" cy="95" r="3" />
        <circle cx="299" cy="95" r="3" />
        <circle cx="292" cy="110" r="3" />
      </g>
      <path className="cs-hero-flag" d="M203 44V21h31l-8 9 8 9h-31z" />
      <path className="cs-hero-pole" d="M203 21v57" />
    </svg>
  </div>;
}

function RoomCard({
  room,
  userID,
  onEnter,
}: {
  room: CantStopRoom;
  userID: string;
  onEnter: (room: CantStopRoom) => void;
}) {
  const entry = roomEntry(room, { userID });
  const owner = roomOwnerProfile(room);
  return <article className="cs-room-card">
    <header><span><i />{room.status === 'match' ? '等待入席' : '牌局进行中'}</span>
      <b>#{room.roomID}</b>
      {room.visibility === 'private' && <LockKeyhole size={13} />}</header>
    <div className="cs-room-main"><span><Bull size={25} /></span><div>
      <h3>{owner.name} 的山路牌桌</h3>
      <p>{room.roomPlayer.length} 位玩家 · {
        room.visibility === 'private' ? '私密' : '公开'}</p></div></div>
    <div className="cs-room-players">{room.roomPlayer.slice(0, 4).map(player =>
      <PlayerAvatar key={player.playerID}
        name={player.displayName ?? player.playerID}
        avatar={player.avatar} ai={player.ai} size={30} />)}
      <strong>{room.roomPlayer.length}<small> / 4</small></strong></div>
    <footer><span>{room.status === 'match'
      ? '2–4 人准备后即可开局'
      : `${room.progressCurrent ?? room.maxClaimedColumns ?? 0} / ${room.progressTotal ?? room.targetColumns ?? 3} 条路线`}</span>
      <ActionButton disabled={!entry.allowed}
        variant={entry.allowed ? 'secondary' : 'quiet'}
        onClick={() => onEnter(room)}>{entry.label}{
          entry.allowed && <ArrowRight size={15} />}</ActionButton></footer>
  </article>;
}

export default function Lobby() {
  const navigate = useNavigate();
  const lobby = useCantStopLobby();
  const profile = useAsyncResource(getProfile);
  const stats = useAsyncResource(loadStats);
  const action = useLatestAsyncAction();
  const clipboard = useClipboardCopy();
  const [panel, setPanel] = useState<'create' | 'join' | 'share'>();
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [code, setCode] = useState('');
  const [found, setFound] = useState<CantStopRoom>();
  const userID = profile.data?.id ?? '';
  const identity = { userID };

  const enter = (room: CantStopRoom) => {
    if (roomEntry(room, identity).allowed) {
      navigate(`/game/cantstop/match?roomID=${encodeURIComponent(room.roomID)}`);
    }
  };
  const create = async () => {
    try {
      const room = await action.run(signal =>
        createCantStopRoom(visibility, signal));
      navigate(`/game/cantstop/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch { /* Shared action owns feedback. */ }
  };
  const find = async () => {
    if (!code.trim()) return;
    setFound(undefined);
    setPanel('join');
    try {
      setFound(await action.run(signal =>
        lookupCantStopRoom(code.trim(), signal)));
    } catch { /* Shared action owns feedback. */ }
  };
  const close = () => {
    if (action.pending) return;
    setPanel(undefined);
    setFound(undefined);
    action.reset();
    clipboard.reset();
  };
  const initialLoading = !lobby.hasLoaded && !lobby.error
    || profile.loading && !profile.data;

  return <AppShell title="游戏大厅" profile={profile.data}>
    {initialLoading ? <CantStopLoading /> : <div className="cs-lobby">
      <section className="cs-hero">
        <HeroArt />
        <div className="cs-hero-copy"><span className="cs-eyebrow">ONE MORE ROLL. ONE MORE SUMMIT.</span>
          <h1>再高一点，<br /><em>还是见好就收？</em></h1>
          <p>四枚骰子，三位攀登者。<br />率先占领三条路线，就赢下这座山。</p>
          <div><ActionButton variant="primary" disabled={!profile.data}
            onClick={() => {
              setVisibility('public');
              action.reset();
              setPanel('create');
            }}><Plus size={17} />创建房间<ArrowRight size={16} /></ActionButton>
            <ActionButton onClick={() => setPanel('share')}>
              <Share2 size={16} />分享游戏</ActionButton></div>
        </div><span className="cs-hero-stamp"><small>THE SUMMIT</small>
          <Bull size={26} /><small>CLUB</small></span>
      </section>
      <div className="cs-facts"><span><Users size={16} /><b>2–4</b> 人同桌</span>
        <span><Layers3 size={16} /><b>11</b> 条路线</span>
        <span><Bull size={16} />先占 <b>3</b> 列</span>
        <Link to="/game/cantstop/guide">第一次来？3 分钟学会 <ArrowRight size={15} /></Link>
      </div>

      <div className="cs-lobby-layout"><section className="cs-room-browser">
        <header><div><span className="cs-eyebrow">PICK YOUR TABLE</span>
          <h2>找到山路，一起登顶。</h2></div>
          <span>{lobby.rooms.length} 个可见房间</span></header>
        <div className="cs-room-tools"><div>{filters.map(item =>
          <button type="button" key={item.value}
            className={lobby.filter === item.value ? 'active' : ''}
            onClick={() => lobby.setFilter(item.value)}>{item.label}</button>)}</div>
          <label><Search size={15} /><input aria-label="搜索房间"
            placeholder="搜索房间号 / 房主" value={lobby.query}
            onChange={event => lobby.setQuery(event.target.value)} />
            {lobby.query && <button type="button" aria-label="清空搜索"
              onClick={() => lobby.setQuery('')}><X size={14} /></button>}</label></div>
        {lobby.error && <Feedback error>{lobby.error}
          <ActionButton onClick={lobby.refresh}>重试</ActionButton></Feedback>}
        <div className="cs-room-grid">{lobby.filteredRooms.map(room =>
          <RoomCard key={room.roomID} room={room}
            userID={userID} onEnter={enter} />)}</div>
        {!lobby.error && !lobby.filteredRooms.length && <div className="cs-empty">
          <Bull size={34} /><h3>这片山路，等着第一桌开局。</h3>
          <p>创建房间，邀请朋友或添加公平 AI。</p></div>}
      </section>
      <aside className="cs-lobby-side"><section className="cs-profile-card">
        <PlayerAvatar name={profile.data?.name ?? '山路玩家'}
          avatar={profile.data?.avatar} size={54} />
        <span>YOUR PLAYER CARD</span><h3>{profile.data?.name || '山路玩家'}</h3>
        <div><b>{stats.data?.totalGames ?? '—'}<small>对局</small></b>
          <b>{stats.data?.wins ?? '—'}<small>胜场</small></b>
          <b>{stats.data ? stats.data.avgScore.toFixed(1) : '—'}<small>平均占列</small></b></div>
        <Link to="/game/cantstop/me">查看我的牌局 <ArrowRight size={15} /></Link>
      </section>
      <section className="cs-join-card"><KeyRound size={20} /><h3>朋友已经开好房间？</h3>
        <p>输入完整房间号，直接回到那张牌桌。</p>
        <form onSubmit={event => { event.preventDefault(); void find(); }}>
          <input aria-label="查找房间号" placeholder="输入完整房间号"
            value={code} onChange={event => {
              setCode(event.target.value);
              setFound(undefined);
            }} />
          <button aria-label="查找房间" disabled={!code.trim()}>
            <ArrowRight size={18} /></button>
        </form></section>
      <Link className="cs-guide-card" to="/game/cantstop/guide">
        <img src={mascot} alt="抱着数字牌的小牛" />
        <span><BookOpen size={20} /><small>THE RULES, WITHOUT THE RULEBOOK</small>
          <h3>三分钟，读懂这座山。</h3>
          <b>查看玩法 <ArrowRight size={14} /></b></span>
      </Link></aside></div>
    </div>}

    {panel === 'create' && <Dialog title="开一张新的山路牌桌"
      eyebrow="CREATE YOUR TABLE" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="primary" pending={action.pending}
          onClick={() => void create()}>创建并入座<ArrowRight size={16} /></ActionButton></>}>
      <div className="cs-dialog-copy"><p>经典规则、4 个固定席位和 60 秒阶段时限均已确定，只需选择公开范围。</p>
        <div className="cs-choice-grid">{(['public', 'private'] as const).map(value =>
          <button type="button" key={value}
            aria-pressed={visibility === value}
            onClick={() => setVisibility(value)}>
            {value === 'public' ? <Globe2 size={23} /> : <LockKeyhole size={23} />}
            <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
              <small>{value === 'public' ? '显示在大厅' : '凭完整房间号加入'}</small></span>
            {visibility === value && <Check size={15} />}</button>)}</div>
        <div className="cs-hint"><ShieldCheck size={16} />
          官方基础规则 · 2–4 人 · 公平 AI · 服务端权威骰子</div>
        {action.error && <Feedback error>{action.error}</Feedback>}</div>
    </Dialog>}

    {panel === 'join' && <Dialog title="通过房间号加入"
      eyebrow="FIND YOUR FRIENDS' TABLE" onClose={close}
      footer={<ActionButton variant="primary" pending={action.pending}
        disabled={!code.trim() || !!found && !roomEntry(found, identity).allowed}
        onClick={() => found ? enter(found) : void find()}>
        {found ? roomEntry(found, identity).label : '查找房间'}
        <ArrowRight size={16} /></ActionButton>}>
      <div className="cs-dialog-copy"><label>房间号<input aria-label="房间号"
        value={code} onChange={event => {
          setCode(event.target.value);
          setFound(undefined);
        }} placeholder="输入完整房间号" /></label>
        {action.error && <Feedback error>{action.error}</Feedback>}
        {found && <RoomCard room={found} userID={userID} onEnter={enter} />}</div>
    </Dialog>}

    {panel === 'share' && <Dialog title="分享 CAN'T STOP"
      eyebrow="INVITE SOMEONE TO THE TABLE" onClose={close}
      footer={<><ActionButton onClick={close}>关闭</ActionButton>
        <ActionButton variant="primary"
          onClick={() => void clipboard.copy(CANTSTOP_PUBLIC_URL)}>
          {clipboard.copiedValue === CANTSTOP_PUBLIC_URL
            ? <Check size={16} /> : <Copy size={16} />}
          {clipboard.copiedValue === CANTSTOP_PUBLIC_URL ? '链接已复制' : '复制游戏链接'}
        </ActionButton></>}>
      <GameShareContent url={CANTSTOP_PUBLIC_URL}
        color="#b95532" background="#f7f5ef"
        classes={{
          root: 'cs-share',
          qr: 'cs-share-qr',
          address: 'cs-share-address',
          hint: 'cs-share-hint',
        }} />
      <div className="cs-share-cards">{[2, 7, 12].map(value =>
        <NumberCard key={value} value={value} compact />)}</div>
    </Dialog>}
  </AppShell>;
}
