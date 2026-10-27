import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
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
import { createSixNimmtRoom, lookupSixNimmtRoom } from '../../api/room';
import { AppShell, Bull, PlayerAvatar } from '../../components/AppShell';
import { NumberCard } from '../../components/Card';
import { Dialog } from '../../components/Dialog';
import { SixNimmtLoading } from '../../components/LoadingState';
import { useSixNimmtLobby } from '../../hooks/useSixNimmtLobby';
import {
  SIXNIMMT_PUBLIC_URL,
  roomEntry,
} from '../../model/adapters';
import type {
  LobbyFilter,
  SixNimmtRoom,
  Visibility,
} from '../../model/types';
import hero from '../../assets/hero.webp';

const loadStats = () => getMyStats('sixnimmt');
const filters: Array<{ value: LobbyFilter; label: string }> = [
  { value: 'all', label: '全部房间' },
  { value: 'joinable', label: '可加入' },
  { value: 'playing', label: '对局中' },
];

function RoomCard({
  room,
  userID,
  onEnter,
}: {
  room: SixNimmtRoom;
  userID: string;
  onEnter: (room: SixNimmtRoom) => void;
}) {
  const entry = roomEntry(room, { userID });
  const owner = roomOwnerProfile(room);
  return <article className="sn-room-card">
    <header><span><i />{room.status === 'match' ? '等待入席' : '牌局进行中'}</span>
      <b>#{room.roomID}</b>
      {room.visibility === 'private' && <LockKeyhole size={13} />}</header>
    <div className="sn-room-main"><span><Bull size={25} /></span><div>
      <h3>{owner.name} 的牧场牌桌</h3>
      <p>{room.roomPlayer.length} 位玩家 · {
        room.visibility === 'private' ? '私密' : '公开'}</p></div></div>
    <div className="sn-room-players">{room.roomPlayer.slice(0, 6).map(player =>
      <PlayerAvatar key={player.playerID}
        name={player.displayName ?? player.playerID}
        avatar={player.avatar} ai={player.ai} size={30} />)}
      <strong>{room.roomPlayer.length}<small> / 10</small></strong></div>
    <footer><span>{room.status === 'match'
      ? '2–10 人准备后即可开局'
      : `第 ${room.currentRound ?? room.nextRoundNo ?? 1} 局 · 经典 66 分制`}</span>
      <ActionButton disabled={!entry.allowed}
        variant={entry.allowed ? 'secondary' : 'quiet'}
        onClick={() => onEnter(room)}>{entry.label}{
          entry.allowed && <ArrowRight size={15} />}</ActionButton></footer>
  </article>;
}

export default function Lobby() {
  const navigate = useNavigate();
  const lobby = useSixNimmtLobby();
  const profile = useAsyncResource(getProfile);
  const stats = useAsyncResource(loadStats);
  const action = useLatestAsyncAction();
  const clipboard = useClipboardCopy();
  const [panel, setPanel] = useState<'create' | 'join' | 'share'>();
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [code, setCode] = useState('');
  const [found, setFound] = useState<SixNimmtRoom>();
  const userID = profile.data?.id ?? '';
  const identity = { userID };

  const enter = (room: SixNimmtRoom) => {
    if (roomEntry(room, identity).allowed) {
      navigate(`/game/sixnimmt/match?roomID=${encodeURIComponent(room.roomID)}`);
    }
  };
  const create = async () => {
    try {
      const room = await action.run(signal =>
        createSixNimmtRoom(visibility, signal));
      navigate(`/game/sixnimmt/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch { /* Shared action owns feedback. */ }
  };
  const find = async () => {
    if (!code.trim()) return;
    setFound(undefined);
    setPanel('join');
    try {
      setFound(await action.run(signal =>
        lookupSixNimmtRoom(code.trim(), signal)));
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
    {initialLoading ? <SixNimmtLoading /> : <div className="sn-lobby">
      <section className="sn-hero">
        <img src={hero} alt="橙色小牛站在数字牌组成的牧场中" />
        <div><span className="sn-eyebrow">A LITTLE BLUFF. A LOT OF FUN.</span>
          <h1>别做第六个。<br /><em>让牛头，去别人家。</em></h1>
          <p>所有人同时出牌，再从小到大入列。<br />看清牌桌，也猜中对手的下一步。</p>
          <div><ActionButton variant="primary" disabled={!profile.data}
            onClick={() => {
              setVisibility('public');
              action.reset();
              setPanel('create');
            }}><Plus size={17} />创建房间<ArrowRight size={16} /></ActionButton>
            <ActionButton onClick={() => setPanel('share')}>
              <Share2 size={16} />分享游戏</ActionButton></div>
        </div><span className="sn-hero-stamp"><small>LESS IS</small>
          <Bull size={26} /><small>MORE FUN</small></span>
      </section>
      <div className="sn-facts"><span><Users size={16} /><b>2–10</b> 人同桌</span>
        <span><Layers3 size={16} /><b>104</b> 张数字牌</span>
        <span><Bull size={16} />经典 <b>66</b> 分制</span>
        <Link to="/game/sixnimmt/guide">第一次来？3 分钟学会 <ArrowRight size={15} /></Link>
      </div>

      <div className="sn-lobby-layout"><section className="sn-room-browser">
        <header><div><span className="sn-eyebrow">PICK YOUR TABLE</span>
          <h2>找到牌桌，一起躲牛。</h2></div>
          <span>{lobby.rooms.length} 个可见房间</span></header>
        <div className="sn-room-tools"><div>{filters.map(item =>
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
        <div className="sn-room-grid">{lobby.filteredRooms.map(room =>
          <RoomCard key={room.roomID} room={room}
            userID={userID} onEnter={enter} />)}</div>
        {!lobby.error && !lobby.filteredRooms.length && <div className="sn-empty">
          <Bull size={34} /><h3>这片牧场，等着第一桌开局。</h3>
          <p>创建房间，邀请朋友或添加公平 AI。</p></div>}
      </section>
      <aside className="sn-lobby-side"><section className="sn-profile-card">
        <PlayerAvatar name={profile.data?.name ?? '牧场玩家'}
          avatar={profile.data?.avatar} size={54} />
        <span>YOUR PLAYER CARD</span><h3>{profile.data?.name || '牧场玩家'}</h3>
        <div><b>{stats.data?.totalGames ?? '—'}<small>对局</small></b>
          <b>{stats.data?.wins ?? '—'}<small>胜场</small></b>
          <b>{stats.data ? stats.data.avgScore.toFixed(1) : '—'}<small>平均牛头</small></b></div>
        <Link to="/game/sixnimmt/me">查看我的牌局 <ArrowRight size={15} /></Link>
      </section>
      <section className="sn-join-card"><KeyRound size={20} /><h3>朋友已经开好房间？</h3>
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
      </aside></div>
    </div>}

    {panel === 'create' && <Dialog title="开一张新的牧场牌桌"
      eyebrow="CREATE YOUR TABLE" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="primary" pending={action.pending}
          onClick={() => void create()}>创建并入座<ArrowRight size={16} /></ActionButton></>}>
      <div className="sn-dialog-copy"><p>经典 66 分制、10 个固定席位和 60 秒阶段时限均已确定，只需选择公开范围。</p>
        <div className="sn-choice-grid">{(['public', 'private'] as const).map(value =>
          <button type="button" key={value}
            aria-pressed={visibility === value}
            onClick={() => setVisibility(value)}>
            {value === 'public' ? <Globe2 size={23} /> : <LockKeyhole size={23} />}
            <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
              <small>{value === 'public' ? '显示在大厅' : '凭完整房间号加入'}</small></span>
            {visibility === value && <Check size={15} />}</button>)}</div>
        <div className="sn-hint"><ShieldCheck size={16} />
          官方基础规则 · 2–10 人 · 公平 AI · 服务端权威洗牌</div>
        {action.error && <Feedback error>{action.error}</Feedback>}</div>
    </Dialog>}

    {panel === 'join' && <Dialog title="通过房间号加入"
      eyebrow="FIND YOUR FRIENDS' TABLE" onClose={close}
      footer={<ActionButton variant="primary" pending={action.pending}
        disabled={!code.trim() || !!found && !roomEntry(found, identity).allowed}
        onClick={() => found ? enter(found) : void find()}>
        {found ? roomEntry(found, identity).label : '查找房间'}
        <ArrowRight size={16} /></ActionButton>}>
      <div className="sn-dialog-copy"><label>房间号<input aria-label="房间号"
        value={code} onChange={event => {
          setCode(event.target.value);
          setFound(undefined);
        }} placeholder="输入完整房间号" /></label>
        {action.error && <Feedback error>{action.error}</Feedback>}
        {found && <RoomCard room={found} userID={userID} onEnter={enter} />}</div>
    </Dialog>}

    {panel === 'share' && <Dialog title="分享 6 nimmt!"
      eyebrow="INVITE SOMEONE TO THE TABLE" onClose={close}
      footer={<><ActionButton onClick={close}>关闭</ActionButton>
        <ActionButton variant="primary"
          onClick={() => void clipboard.copy(SIXNIMMT_PUBLIC_URL)}>
          {clipboard.copiedValue === SIXNIMMT_PUBLIC_URL
            ? <Check size={16} /> : <Copy size={16} />}
          {clipboard.copiedValue === SIXNIMMT_PUBLIC_URL ? '链接已复制' : '复制游戏链接'}
        </ActionButton></>}>
      <GameShareContent url={SIXNIMMT_PUBLIC_URL}
        color="#b95532" background="#f7f5ef"
        classes={{
          root: 'sn-share',
          qr: 'sn-share-qr',
          address: 'sn-share-address',
          hint: 'sn-share-hint',
        }} />
      <div className="sn-share-cards">{[24, 55, 88].map(value =>
        <NumberCard key={value} value={value} compact />)}</div>
    </Dialog>}
  </AppShell>;
}
