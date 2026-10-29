import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Gavel,
  Globe2,
  KeyRound,
  LockKeyhole,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  GameMobileCreateRoomDialog,
  GameMobileLobby,
  GameMobileRoomCard,
  GameMobileShareDialog,
} from '@/components/GameUI/GamePublicMobile';
import { GameShareContent } from '@/components/GameUI/GameShareContent';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { Feedback } from '@/components/GameUI/Panel';
import { getProfile } from '@/features/game-core/api/auth';
import { getMyStats } from '@/features/game-core/api/history';
import { useClipboardCopy } from '@/features/game-core/hooks/useClipboardCopy';
import { useLatestAsyncAction } from '@/features/game-core/hooks/useLatestAsyncAction';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import { roomOwnerProfile } from '@/features/game-core/model/room';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  createForSaleRoom,
  lookupForSaleRoom,
} from '../api/room';
import neighborhood from '../assets/neighborhood.webp';
import sold from '../assets/sold.webp';
import { AppShell } from '../components/AppShell';
import { PlayerAvatar } from '../components/GamePieces';
import { ForSaleLoading } from '../components/LoadingState';
import { useForSaleLobby } from '../hooks/useForSaleLobby';
import {
  FORSALE_PUBLIC_URL,
  roomEntry,
} from '../model/adapters';
import type {
  ForSaleRoom,
  LobbyFilter,
  Visibility,
} from '../model/types';

const loadStats = () => getMyStats('forsale');
const filters: Array<{ value: LobbyFilter; label: string }> = [
  { value: 'all', label: '全部房间' },
  { value: 'joinable', label: '可加入' },
  { value: 'playing', label: '对局中' },
];

const RoomCard = ({
  room,
  userID,
  onEnter,
}: {
  room: ForSaleRoom;
  userID: string;
  onEnter: (room: ForSaleRoom) => void;
}) => {
  const entry = roomEntry(room, { userID });
  const owner = roomOwnerProfile(room);
  return <article className="fs-room-card"><header><span><i />{
    room.status === 'match' ? '等待入席' : '拍卖进行中'}</span>
    <b>#{room.roomID}</b>{room.visibility === 'private'
      && <LockKeyhole size={13} />}</header>
    <div className="fs-room-main"><span><Gavel size={23} /></span><div>
      <h3>{owner.name} 的周末拍卖</h3><p>{room.roomPlayer.length} 位买家 · {
        room.visibility === 'private' ? '私密' : '公开'}</p></div></div>
    <div className="fs-room-players">{room.roomPlayer.slice(0, 6).map(player =>
      <PlayerAvatar key={player.playerID}
        name={player.displayName ?? player.playerID}
        avatar={player.avatar} ai={player.ai} size={31} />)}
      <strong>{room.roomPlayer.length}<small> / 6</small></strong></div>
    <footer><span>{room.status === 'match'
      ? '3 人起 · 60 秒操作'
      : `${room.progressCurrent ?? 0} / ${room.progressTotal ?? '—'} 轮完成`}</span>
      <ActionButton disabled={!entry.allowed}
        variant={entry.allowed ? 'secondary' : 'quiet'}
        onClick={() => onEnter(room)}>{entry.label}{
          entry.allowed && <ArrowRight size={15} />}</ActionButton></footer>
  </article>;
};

export default function Lobby() {
  const { isMobile } = useMobileViewport();
  const navigate = useNavigate();
  const lobby = useForSaleLobby();
  const profile = useAsyncResource(getProfile);
  const stats = useAsyncResource(loadStats);
  const action = useLatestAsyncAction();
  const clipboard = useClipboardCopy();
  const [panel, setPanel] = useState<'create' | 'join' | 'share'>();
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [code, setCode] = useState('');
  const [found, setFound] = useState<ForSaleRoom>();
  const userID = profile.data?.id ?? '';
  const enter = (room: ForSaleRoom) => {
    if (roomEntry(room, { userID }).allowed) {
      navigate(`/game/forsale/match?roomID=${encodeURIComponent(room.roomID)}`);
    }
  };
  const create = async () => {
    try {
      const room = await action.run(signal =>
        createForSaleRoom(visibility, signal));
      navigate(`/game/forsale/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch { /* Shared action owns feedback. */ }
  };
  const find = async () => {
    if (!code.trim()) return;
    setFound(undefined);
    try {
      setFound(await action.run(signal =>
        lookupForSaleRoom(code.trim(), signal)));
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
  const renderMobileRoom = (room: ForSaleRoom) => {
    const entry = roomEntry(room, { userID });
    const ownerProfile = roomOwnerProfile(room);
    return <GameMobileRoomCard key={room.roomID}
      roomID={room.roomID}
      title={`${ownerProfile.name} 的周末拍卖`}
      ownerName={ownerProfile.name}
      ownerAvatar={<PlayerAvatar name={ownerProfile.name}
        avatar={ownerProfile.avatar} size={32} />}
      playerCount={room.roomPlayer.length}
      maxPlayers={room.maxPlayers}
      status={room.status === 'match' ? '等待入席' : '拍卖进行中'}
      meta={room.status === 'match'
        ? '3 人起 · 60 秒操作'
        : `${room.progressCurrent ?? 0} / ${room.progressTotal ?? '—'} 轮完成`}
      privateRoom={room.visibility === 'private'}
      actionLabel={entry.label}
      actionDisabled={!entry.allowed}
      onEnter={() => enter(room)}
    />;
  };

  if (isMobile) {
    return <AppShell title="游戏大厅" profile={profile.data}>
      {initialLoading
        ? <ForSaleLoading />
        : <GameMobileLobby
          eyebrow="A LITTLE BID. A BIG DEAL."
          title={<>好房在手，<br />好戏开场。</>}
          description="从小屋到庄园，眼光比运气更重要。买得聪明，卖得漂亮。"
          media={<img src={neighborhood} alt="阳光下等待拍卖的周末街区" />}
          caption="THE SUNDAY AUCTION / ONLINE"
          facts={[
            { icon: <Users />, value: '3–6', label: '位玩家' },
            { icon: <Clock3 />, value: '20–30', label: '分钟' },
            { icon: <Gavel />, value: '2', label: '个阶段' },
          ]}
          browserEyebrow="FIND YOUR TABLE"
          browserTitle="找到房间，一起开场。"
          roomCount={`${lobby.rooms.length} 个可见房间`}
          filters={filters}
          filter={lobby.filter}
          onFilterChange={lobby.setFilter}
          query={lobby.query}
          onQueryChange={lobby.setQuery}
          rooms={lobby.filteredRooms}
          renderRoom={renderMobileRoom}
          onCreate={() => {
            setVisibility('public');
            action.reset();
            setPanel('create');
          }}
          onShare={() => setPanel('share')}
          joinCode={code}
          onJoinCodeChange={value => {
            setCode(value);
            setFound(undefined);
            action.reset();
          }}
          onJoin={() => {
            setPanel('join');
            void find();
          }}
          joinDescription="输入完整房间号，找到朋友的桌。"
          error={lobby.error && <Feedback error>{lobby.error}
            <ActionButton onClick={lobby.refresh}>重试</ActionButton>
          </Feedback>}
        />}
      {panel === 'create' && <GameMobileCreateRoomDialog
        description="选择房间公开范围；实际开局人数决定金币和轮数。"
        visibility={visibility} onVisibilityChange={setVisibility}
        hint="3–6 人经典新版 · 60 秒操作时限"
        error={action.error && <Feedback error>{action.error}</Feedback>}
        pending={action.pending} disabled={!profile.data}
        themeClassName="forsale-root"
        onClose={close} onSubmit={() => void create()} />}
      {panel === 'share' && <GameMobileShareDialog gameName="For Sale"
        url={FORSALE_PUBLIC_URL} color="#294f43" background="#f7f4ec"
        themeClassName="forsale-root" onClose={close} />}
      {panel === 'join' && <ResponsiveDialog title="通过房间号加入"
        eyebrow="FIND YOUR FRIENDS' TABLE" onClose={close}
        themeClassName="forsale-root"
        footer={<ActionButton variant="primary" pending={action.pending}
          disabled={!code.trim() || !!found
            && !roomEntry(found, { userID }).allowed}
          onClick={() => found ? enter(found) : void find()}>
          {found ? roomEntry(found, { userID }).label : '查找房间'}
          <ArrowRight size={16} />
        </ActionButton>}>
        {action.error && <Feedback error>{action.error}</Feedback>}
        {found && renderMobileRoom(found)}
      </ResponsiveDialog>}
    </AppShell>;
  }

  return <AppShell title="游戏大厅" profile={profile.data}>
    {initialLoading ? <ForSaleLoading /> : <div className="fs-lobby">
      <section className="fs-hero"><img src={neighborhood}
        alt="阳光下等待拍卖的周末街区" />
        <div><span className="fs-eyebrow">A LITTLE BID. A BIG DEAL.</span>
          <h1>好房在手，<br /><em>好戏开场。</em></h1>
          <p>从小屋到庄园，眼光比运气更重要。<br />买得聪明，卖得漂亮。</p>
          <nav><ActionButton variant="primary" disabled={!profile.data}
            onClick={() => { action.reset(); setPanel('create'); }}>
            <Plus size={17} />创建房间<ArrowRight size={16} /></ActionButton>
            <ActionButton onClick={() => setPanel('share')}>
              <Share2 size={16} />分享游戏</ActionButton></nav>
        </div><small>THE SUNDAY AUCTION / ONLINE</small></section>
      <div className="fs-facts"><span><Users size={16} /><b>3–6</b> 位玩家</span>
        <span><Clock3 size={16} /><b>20–30</b> 分钟</span>
        <span><Gavel size={16} />竞价 · 暗选 · 揭晓</span>
        <Link to="/game/forsale/guide">两分钟读懂玩法<ArrowRight size={14} /></Link></div>
      <div className="fs-lobby-layout"><section className="fs-browser">
        <header><div><span className="fs-eyebrow">FIND YOUR TABLE</span>
          <h2>找到房间，一起开场。</h2></div>
          <span>{lobby.rooms.length} 个可见房间</span></header>
        <div className="fs-room-tools"><div>{filters.map(item =>
          <button type="button" key={item.value}
            className={lobby.filter === item.value ? 'active' : ''}
            onClick={() => lobby.setFilter(item.value)}>{item.label}</button>)}</div>
          <label><Search size={15} /><input aria-label="搜索房间"
            placeholder="搜索房间号 / 房主" value={lobby.query}
            onChange={event => lobby.setQuery(event.target.value)} /></label></div>
        {lobby.error && <Feedback error>{lobby.error}
          <ActionButton onClick={lobby.refresh}>重试</ActionButton></Feedback>}
        <div className="fs-room-grid">{lobby.filteredRooms.map(room =>
          <RoomCard key={room.roomID} room={room}
            userID={userID} onEnter={enter} />)}</div>
        {!lobby.error && !lobby.filteredRooms.length && <div className="fs-empty">
          <Gavel size={31} /><h3>这张桌，等你喊出第一口价。</h3>
          <p>创建房间，邀请朋友或添加公平 AI 开始。</p></div>}
      </section><aside className="fs-lobby-side"><section className="fs-player-card">
        <PlayerAvatar name={profile.data?.name ?? '周末买家'}
          avatar={profile.data?.avatar} size={58} />
        <span className="fs-eyebrow">YOUR PLAYER CARD</span>
        <h3>{profile.data?.name || '周末买家'}</h3>
        <div><b>{stats.data?.totalGames ?? '—'}<small>完成对局</small></b>
          <b>{stats.data?.wins ?? '—'}<small>第一名</small></b>
          <b>{stats.data ? stats.data.avgScore.toFixed(0) : '—'}
            <small>平均财富</small></b></div>
        <Link to="/game/forsale/me">查看我的成交档案<ArrowRight size={14} /></Link>
      </section><section className="fs-join-card"><KeyRound size={20} />
        <h3>朋友已经开好房间？</h3><p>输入完整房间号，找到朋友的桌。</p>
        <form onSubmit={event => { event.preventDefault(); setPanel('join'); void find(); }}>
          <input aria-label="查找房间号" placeholder="输入完整房间号"
            value={code} onChange={event => setCode(event.target.value)} />
          <button aria-label="查找房间" disabled={!code.trim()}>
            <ArrowRight size={18} /></button></form></section>
      <section className="fs-guide-card"><img src={sold} alt="" /><div>
        <span className="fs-eyebrow">THE ART OF A GOOD DEAL</span>
        <h3>不是最贵的房子，<br />而是最好的买卖。</h3>
        <Link to="/game/forsale/guide">查看玩法<ArrowRight size={14} /></Link>
      </div></section></aside></div>
    </div>}

    {panel === 'create' && <ResponsiveDialog title="创建房间"
      eyebrow="CREATE YOUR NEXT TABLE" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="primary" pending={action.pending}
          onClick={() => void create()}>创建并入座<ArrowRight size={16} /></ActionButton></>}>
      <div className="fs-dialog-copy"><p>选择房间公开范围；实际开局人数决定金币和轮数。</p>
        <div className="fs-choice-grid">{(['public', 'private'] as const).map(value =>
          <button type="button" key={value} aria-pressed={visibility === value}
            onClick={() => setVisibility(value)}>
            {value === 'public' ? <Globe2 size={23} /> : <LockKeyhole size={23} />}
            <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
              <small>{value === 'public' ? '显示在大厅' : '凭完整房间号加入'}</small></span>
            {visibility === value && <Check size={15} />}</button>)}</div>
        <div className="fs-hint"><ShieldCheck size={15} />
          3–6 人经典新版 · 60 秒操作时限</div>
        {action.error && <Feedback error>{action.error}</Feedback>}</div>
    </ResponsiveDialog>}

    {panel === 'join' && <ResponsiveDialog title="通过房间号加入"
      eyebrow="FIND YOUR FRIENDS' TABLE" onClose={close}
      footer={<ActionButton variant="primary" pending={action.pending}
        disabled={!code.trim() || !!found && !roomEntry(found, { userID }).allowed}
        onClick={() => found ? enter(found) : void find()}>
        {found ? roomEntry(found, { userID }).label : '查找房间'}
        <ArrowRight size={16} /></ActionButton>}>
      <div className="fs-dialog-copy"><label>房间号<input aria-label="房间号"
        value={code} onChange={event => { setCode(event.target.value); setFound(undefined); }}
        placeholder="输入完整房间号" /></label>
        {action.error && <Feedback error>{action.error}</Feedback>}
        {found && <RoomCard room={found} userID={userID} onEnter={enter} />}</div>
    </ResponsiveDialog>}

    {panel === 'share' && <ResponsiveDialog title="分享 For Sale"
      eyebrow="INVITE SOMEONE TO THE TABLE" onClose={close}
      footer={<><ActionButton onClick={close}>关闭</ActionButton>
        <ActionButton variant="primary"
          onClick={() => void clipboard.copy(FORSALE_PUBLIC_URL)}>
          {clipboard.copiedValue === FORSALE_PUBLIC_URL
            ? <Check size={16} /> : <Copy size={16} />}
          {clipboard.copiedValue === FORSALE_PUBLIC_URL ? '链接已复制' : '复制游戏链接'}
        </ActionButton></>}>
      <GameShareContent url={FORSALE_PUBLIC_URL}
        color="#294f43" background="#f7f4ec"
        classes={{ root: 'fs-share', qr: 'fs-share-qr',
          address: 'fs-share-address', hint: 'fs-share-hint' }} />
    </ResponsiveDialog>}
  </AppShell>;
}
