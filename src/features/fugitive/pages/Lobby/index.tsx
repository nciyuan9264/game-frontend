import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Copy,
  Globe2,
  KeyRound,
  Layers,
  LockKeyhole,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { GameShareContent } from '@/components/GameUI/GameShareContent';
import {
  GameMobileCreateRoomDialog,
  GameMobileLobby,
  GameMobileRoomCard,
  GameMobileShareDialog,
} from '@/components/GameUI/GamePublicMobile';
import { getProfile } from '@/features/game-core/api/auth';
import { useClipboardCopy } from '@/features/game-core/hooks/useClipboardCopy';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useLatestAsyncAction } from '@/features/game-core/hooks/useLatestAsyncAction';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import { playerDisplayLabel, roomOwnerProfile } from '@/features/game-core/model/room';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  createFugitiveRoom,
  lookupFugitiveRoom,
} from '../../api/room';
import {
  AppShell,
  fugitiveThemeClassName,
  ProfileMonogram,
} from '../../components/AppShell';
import { FugitiveLoading } from '../../components/LoadingState';
import {
  ART,
  Eyebrow,
  Modal,
  Portrait,
  Scene,
  roleName,
} from '../../components/Visual';
import { useFugitiveLobby } from '../../hooks/useFugitiveLobby';
import {
  FUGITIVE_PUBLIC_URL,
  roomEntry,
} from '../../model/adapters';
import type {
  FugitiveRoom,
  LobbyFilter,
  Role,
  Visibility,
} from '../../model/types';

const timeoutLabel = (value?: number) =>
  value ? `${value} 秒` : '不限时';

function roomRole(room: FugitiveRoom): Role {
  return room.roomPlayer.find(player => player.playerID === room.ownerID)
    ?.gameRole === 'marshal' ? 'marshal' : 'fugitive';
}

function RoomCard({
  room,
  userID,
  onEnter,
}: {
  room: FugitiveRoom;
  userID: string;
  onEnter: (room: FugitiveRoom) => void;
}) {
  const entry = roomEntry(room, { userID });
  const owner = roomOwnerProfile(room);
  const playing = room.status !== 'match';
  const ownerRole = roomRole(room);
  const scene = Array.from(room.roomID).reduce((total, value) =>
    total + value.charCodeAt(0), 0) % 6;

  return <article className="lobby-room-card">
    <div className="room-card-top">
      <span className={`pill ${playing ? 'playing-pill' : ''}`}>
        <i />{playing ? '对局中' : '等待加入'}
      </span>
      <span>#{room.roomID}</span>
    </div>
    <div className="room-card-title"><div>
      <h3>{room.roomID}</h3>
      <p>{playing
        ? `最高公开 ${room.highestRevealed ?? 0}`
        : `等待${roleName(ownerRole === 'fugitive' ? 'marshal' : 'fugitive')}`}
        {' · '}{timeoutLabel(room.turnTimeoutSeconds)}</p>
    </div><Scene index={scene} className="room-card-art" /></div>
    <div className="room-card-bottom">
      <div className="room-members">
        <ProfileMonogram profile={{ name: owner.name, avatar: owner.avatar }}
          className="avatar owner-avatar" />
        {room.roomPlayer.length > 1
          ? <Portrait role={ownerRole === 'fugitive' ? 'marshal' : 'fugitive'} className="avatar" />
          : <span className="vacant-avatar"><Plus size={12} /></span>}
        <span><b>{room.roomPlayer.length} / 2</b><small>{owner.name} 的房间</small></span>
      </div>
      <button className={`button ${entry.allowed ? 'room-join' : 'secondary'}`}
        type="button" disabled={!entry.allowed}
        onClick={() => onEnter(room)}>
        {entry.label}{entry.allowed && <ArrowRight size={14} />}
      </button>
    </div>
  </article>;
}

function JoinCard({
  code,
  setCode,
  onJoin,
}: {
  code: string;
  setCode: (value: string) => void;
  onJoin: () => void;
}) {
  return <section className="lobby-join-card"><h3><KeyRound size={18} />朋友已经开好房间？</h3>
    <p>输入完整房间号，找到朋友的追逐。</p>
    <form onSubmit={event => { event.preventDefault(); onJoin(); }}>
      <input aria-label="查找房间号" placeholder="输入完整房间号" value={code}
        onChange={event => setCode(event.target.value)} autoCapitalize="off"
        autoCorrect="off" spellCheck={false} />
      <button disabled={!code.trim()} aria-label="查找房间" type="submit"><ArrowRight size={19} /></button>
    </form>
  </section>;
}

export default function Lobby() {
  const { isMobile } = useMobileViewport();
  const navigate = useNavigate();
  const lobby = useFugitiveLobby();
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('fugitive');
  const action = useLatestAsyncAction();
  const [panel, setPanel] = useState<'create' | 'join' | 'share'>();
  const shareClipboard = useClipboardCopy();
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [code, setCode] = useState('');
  const [foundRoom, setFoundRoom] = useState<FugitiveRoom>();
  const userID = profile.data?.id ?? '';

  const enter = (room: FugitiveRoom) => {
    if (roomEntry(room, { userID }).allowed) {
      navigate(`/game/fugitive/match?roomID=${encodeURIComponent(room.roomID)}`);
    }
  };
  const openCreate = () => {
    setVisibility('public');
    action.reset();
    setPanel('create');
  };
  const create = async () => {
    try {
      const room = await action.run(signal =>
        createFugitiveRoom(visibility, signal));
      navigate(`/game/fugitive/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch { /* Shared action exposes the error. */ }
  };
  const find = async () => {
    if (!code.trim()) return;
    setFoundRoom(undefined);
    setPanel('join');
    try {
      setFoundRoom(await action.run(signal =>
        lookupFugitiveRoom(code.trim(), signal)));
    } catch { /* Shared action exposes the error. */ }
  };
  const close = () => {
    if (action.pending) return;
    setPanel(undefined);
    setFoundRoom(undefined);
    shareClipboard.reset();
    action.reset();
  };
  const initialLoading = !lobby.hasLoaded && !lobby.error
    || profile.loading && !profile.data;
  const renderMobileRoom = (room: FugitiveRoom) => {
    const entry = roomEntry(room, { userID });
    const ownerProfile = roomOwnerProfile(room);
    const ownerRole = roomRole(room);
    return <GameMobileRoomCard key={room.roomID}
      roomID={room.roomID}
      title={room.roomID}
      ownerName={ownerProfile.name}
      ownerAvatar={<ProfileMonogram profile={{
        name: ownerProfile.name,
        avatar: ownerProfile.avatar,
      }} />}
      playerCount={room.roomPlayer.length}
      maxPlayers={room.maxPlayers}
      status={room.status === 'match' ? '等待加入' : '对局中'}
      meta={room.status === 'match'
        ? `等待${roleName(ownerRole === 'fugitive' ? 'marshal' : 'fugitive')
        } · ${timeoutLabel(room.turnTimeoutSeconds)}`
        : `最高公开 ${room.highestRevealed ?? 0}`}
      privateRoom={room.visibility === 'private'}
      actionLabel={entry.label}
      actionDisabled={!entry.allowed}
      onEnter={() => enter(room)}
    />;
  };

  if (isMobile) {
    return <AppShell title="游戏大厅" profile={profile.data}>
      <main className="page-content">{initialLoading
        ? <FugitiveLoading description="正在同步追逃房间与在线玩家" />
        : <GameMobileLobby
          eyebrow="A TWO-PLAYER GAME OF CAT & MOUSE"
          title={<>下一步，<br />让他猜。</>}
          description="一个制造谜题，一个追寻答案。在这座不眠的城市，谁能走在前面？"
          media={<img src={ART.hero} alt="午夜城市与高架铁路，追逃主题插画" />}
          caption="THE MIDNIGHT RUN"
          facts={[
            { icon: <Users />, value: '2', label: '位玩家' },
            { icon: <Clock3 />, value: '10–20', label: '分钟' },
            { icon: <Layers />, value: '43', label: '张地点牌' },
          ]}
          browserEyebrow="TAKE YOUR SIDE"
          browserTitle="找一个对手，开一场追逐。"
          roomCount={`${lobby.rooms.length} 个可见房间`}
          filters={[
            { value: 'all', label: '全部房间' },
            { value: 'joinable', label: '可加入' },
            { value: 'playing', label: '对局中' },
          ]}
          filter={lobby.filter}
          onFilterChange={lobby.setFilter}
          query={lobby.query}
          onQueryChange={lobby.setQuery}
          rooms={lobby.filteredRooms}
          renderRoom={renderMobileRoom}
          onCreate={openCreate}
          onShare={() => {
            shareClipboard.reset();
            setPanel('share');
          }}
          joinCode={code}
          onJoinCodeChange={value => {
            setCode(value);
            setFoundRoom(undefined);
            action.reset();
          }}
          onJoin={() => void find()}
          joinDescription="输入完整房间号，找到朋友的追逐。"
          error={lobby.error && <p className="notice">{lobby.error}
            <button className="text-button" type="button"
              onClick={lobby.refresh}>重试</button>
          </p>}
        />}</main>
      {panel === 'create' && <GameMobileCreateRoomDialog
        description="选择房间的加入方式，创建后立即进入准备席。"
        visibility={visibility} onVisibilityChange={setVisibility}
        hint="午夜追缉 · 固定 2 人 · 每回合 120 秒"
        error={action.error && <p className="field-error"
          role="alert">{action.error}</p>}
        pending={action.pending} disabled={!profile.data}
        themeClassName={fugitiveThemeClassName}
        onClose={close} onSubmit={() => void create()} />}
      {panel === 'share' && <GameMobileShareDialog gameName="Fugitive"
        url={FUGITIVE_PUBLIC_URL} color="#172c22" background="#eee8d8"
        themeClassName={fugitiveThemeClassName} onClose={close} />}
      {panel === 'join' && <Modal title="通过房间号加入"
        kicker="FIND YOUR FRIENDS' TABLE" onClose={close}
        footer={<button className="button primary" type="button"
          disabled={action.pending || !code.trim()
            || !!foundRoom && !roomEntry(foundRoom, { userID }).allowed}
          onClick={() => foundRoom ? enter(foundRoom) : void find()}>
          {foundRoom ? roomEntry(foundRoom, { userID }).label : '查找房间'}
          <ArrowRight size={16} />
        </button>}>
        {action.error && <p className="field-error" role="alert">{action.error}</p>}
        {foundRoom && renderMobileRoom(foundRoom)}
      </Modal>}
    </AppShell>;
  }

  return <AppShell title="游戏大厅" profile={profile.data}>
    {initialLoading
      ? <FugitiveLoading description="正在同步追逃房间与在线玩家" />
      : <main className="page-content lobby-page framework-lobby">
        <section className="lobby-hero" data-testid="fugitive-lobby-hero">
          <img className="hero-art" src={ART.hero}
            alt="午夜城市与高架铁路，追逃主题插画" />
          <div className="hero-copy"><Eyebrow>A TWO-PLAYER GAME OF CAT & MOUSE</Eyebrow>
            <h1>下一步，<br />让他猜。</h1>
            <p>一个制造谜题，一个追寻答案。<br />在这座不眠的城市，谁能走在前面？</p>
            <div className="hero-actions">
              <button className="button primary" type="button" onClick={openCreate}>
                <Plus size={17} />创建房间<ArrowRight size={16} />
              </button>
              <button className="button hero-secondary" type="button"
                onClick={() => {
                  shareClipboard.reset();
                  setPanel('share');
                }}>
                <Share2 size={16} />分享游戏
              </button>
            </div>
          </div>
          <div className="hero-label"><span>THE MIDNIGHT RUN</span>
            <span>一 场 没 有 回 头 路 的 追 逐</span></div>
        </section>
        <div className="game-facts" data-testid="fugitive-lobby-facts">
          <span><Users size={16} /><b>2</b> 位玩家</span>
          <span><Clock3 size={16} /><b>10–20</b> 分钟</span>
          <span><Layers size={16} /><b>43</b> 张地点牌</span>
        </div>
        <div className="lobby-lower"><section className="room-panel" data-testid="fugitive-lobby-browser">
          <div className="section-heading"><div><Eyebrow>TAKE YOUR SIDE</Eyebrow>
            <h2>找一个对手，开一场追逐。</h2></div>
            <span className="visible-rooms">可见房间</span>
          </div>
          <div className="room-toolbar"><div className="tabs">
            {([
              { id: 'all', text: '全部房间' },
              { id: 'joinable', text: '可加入' },
              { id: 'playing', text: '对局中' },
            ] as Array<{ id: LobbyFilter; text: string }>).map(item =>
              <button type="button" key={item.id}
                className={lobby.filter === item.id ? 'active' : ''}
                aria-pressed={lobby.filter === item.id}
                onClick={() => lobby.setFilter(item.id)}>{item.text}
                {item.id === 'all' && <span>{lobby.rooms.length}</span>}</button>)}
          </div>
          <label className="search-field"><Search size={16} />
            <input aria-label="搜索房间" placeholder="搜索房间号 / 房主"
              value={lobby.query} onChange={event => lobby.setQuery(event.target.value)} />
            {lobby.query && <button type="button" aria-label="清空搜索"
              onClick={() => lobby.setQuery('')}><X size={16} /></button>}
          </label></div>
          {lobby.error && <p className="notice">{lobby.error}
            <button className="text-button" type="button" onClick={lobby.refresh}>重试</button></p>}
          <div className="room-card-grid">
            {lobby.filteredRooms.map(room => <RoomCard key={room.roomID}
              room={room} userID={userID} onEnter={enter} />)}
            {!lobby.error && !lobby.filteredRooms.length && <div className="empty-state">
              <Search size={30} /><h3>还没有找到这场追逐。</h3>
              <p>换个关键词，或开一间自己的房间。</p>
              <button className="button secondary" type="button"
                onClick={() => { lobby.setQuery(''); lobby.setFilter('all'); }}>清空筛选</button>
            </div>}
          </div>
        </section>
        <aside className="lobby-aside" data-testid="fugitive-lobby-aside">
          <section className="lobby-profile">
            <div className="lobby-profile-head">
              <ProfileMonogram profile={profile.data} className="profile-monogram-small" />
              <div><small>欢迎回来，城市追踪者</small>
                <h3>{profile.data?.name || '玩家'}</h3></div><Check size={16} />
            </div>
            <div className="lobby-profile-stats">
              <span><b>{stats.data?.totalGames ?? '—'}</b>完成对局</span>
              <span><b>{stats.data?.wins ?? '—'}</b>获胜</span>
              <span><b>{stats.data ? `${Math.round(stats.data.winRate * 100)}%` : '—'}</b>胜率</span>
            </div>
            <Link className="text-button full" to="/game/fugitive/me">
              我的追逃档案<ArrowRight size={15} /></Link>
          </section>
          <JoinCard code={code} setCode={setCode} onJoin={() => void find()} />
          <Link className="learning-card" to="/game/fugitive/guide"><div>
            <Eyebrow>BEFORE YOUR FIRST MOVE</Eyebrow><h3>先读懂，再看穿。</h3>
            <p>3 分钟，学会你的第一场追逐。</p>
            <b>查看指南<ArrowRight size={14} /></b>
          </div><BookOpen size={40} strokeWidth={1.2} /></Link>
        </aside></div>
        <div className="mobile-lobby-join" data-testid="fugitive-lobby-mobile-join">
          <JoinCard code={code} setCode={setCode} onJoin={() => void find()} />
        </div>
      </main>}

    {panel === 'create' && <Modal title="创建房间"
      kicker="OPEN YOUR OWN ROOM" onClose={close}
      footer={<><button className="button secondary" type="button"
        disabled={action.pending} onClick={close}>取消</button>
        <button className="button primary" type="button"
          disabled={action.pending} onClick={() => void create()}>
          创建并入座<ArrowRight size={16} /></button></>}>
      <p>选择房间的加入方式，创建后立即进入准备席。</p>
      <label className="form-label">谁可以加入？</label>
      <div className="privacy-options">{([
        { id: 'public', title: '公开房间', text: '展示在在线大厅', icon: Globe2 },
        { id: 'private', title: '私密房间', text: '凭完整房间号加入', icon: LockKeyhole },
      ] as const).map(item => <button type="button" key={item.id}
        className={visibility === item.id ? 'selected' : ''}
        aria-pressed={visibility === item.id}
        onClick={() => setVisibility(item.id)}>
        <item.icon size={22} /><span><b>{item.title}</b><small>{item.text}</small></span>
        {visibility === item.id && <Check size={17} />}
      </button>)}</div>
      <p className="notice"><ShieldCheck size={16} />
        <span>午夜追缉 · 固定 2 人 · 每回合 120 秒</span></p>
      {action.error && <p className="field-error" role="alert">{action.error}</p>}
    </Modal>}

    {panel === 'join' && <Modal title="通过房间号加入"
      kicker="FIND YOUR FRIENDS' TABLE" onClose={close}
      footer={<><button className="button secondary" type="button"
        disabled={action.pending} onClick={close}>取消</button>
        <button className="button primary" type={foundRoom ? 'button' : 'submit'}
          form={foundRoom ? undefined : 'fugitive-join-room'}
          disabled={action.pending || !code.trim()
            || !!foundRoom && !roomEntry(foundRoom, { userID }).allowed}
          onClick={() => {
            if (foundRoom) enter(foundRoom);
          }}>
          {foundRoom ? roomEntry(foundRoom, { userID }).label : '加入房间'}
          <ArrowRight size={16} />
        </button></>}>
      <form id="fugitive-join-room" className="join-form"
        onSubmit={event => {
          event.preventDefault();
          void find();
        }}>
        <div className="modal-emblem"><KeyRound size={29} /></div>
        <label className="form-label" htmlFor="fugitive-join-code">房间号
          <input className="input code-input" id="fugitive-join-code"
            autoComplete="off" autoCapitalize="off" spellCheck={false}
            placeholder="输入完整房间号" disabled={action.pending}
            value={code} onChange={event => {
              setCode(event.target.value);
              setFoundRoom(undefined);
              action.reset();
            }} />
        </label>
      </form>
      {action.error && <p className="field-error" role="alert">{action.error}</p>}
      <div className="join-hint"><ShieldCheck size={16} />
        <span>输入朋友分享的完整房间号。</span></div>
      {foundRoom && <div className="invitation"><h3>{foundRoom.roomID}</h3>
        <p>{roomOwnerProfile(foundRoom).name} · {foundRoom.roomPlayer.length}/2 已入座</p>
        <p>{foundRoom.roomPlayer.map(player => playerDisplayLabel(player)).join(' / ')}</p>
      </div>}
    </Modal>}

    {panel === 'share' && <Modal title="分享 Fugitive"
      kicker="INVITE SOMEONE TO THE CHASE" className="share-dialog"
      onClose={close}
      footer={<><button className="button secondary" type="button"
        onClick={close}>关闭</button>
        <button className="button primary" type="button"
          onClick={() => void shareClipboard.copy(FUGITIVE_PUBLIC_URL)}>
          {shareClipboard.copiedValue === FUGITIVE_PUBLIC_URL ? <Check size={16} /> : <Copy size={16} />}
          {shareClipboard.copiedValue === FUGITIVE_PUBLIC_URL ? '链接已复制' : '复制游戏链接'}
        </button></>}>
      <GameShareContent url={FUGITIVE_PUBLIC_URL} color="#172c22" background="#eee8d8"
        classes={{ root: 'share-content', qr: 'share-qr', address: 'share-address', hint: 'share-hint' }} />
    </Modal>}
  </AppShell>;
}
