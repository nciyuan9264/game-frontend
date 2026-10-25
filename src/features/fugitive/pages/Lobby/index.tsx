import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Footprints,
  Globe2,
  Hash,
  Layers,
  LockKeyhole,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { getProfile } from '@/features/game-core/api/auth';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useLatestAsyncAction } from '@/features/game-core/hooks/useLatestAsyncAction';
import { playerDisplayName } from '@/features/game-core/model/room';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  createFugitiveRoom,
  lookupFugitiveRoom,
} from '../../api/room';
import { AppShell, ProfileMonogram } from '../../components/AppShell';
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
  roomEntry,
  roomOwnerName,
} from '../../model/adapters';
import type {
  FugitiveRoom,
  LobbyFilter,
  Role,
  Visibility,
} from '../../model/types';

interface RoomDraft {
  name: string;
  visibility: Visibility;
  turnTimeoutSeconds: number;
}

const defaultDraft: RoomDraft = {
  name: '午夜追缉',
  visibility: 'public',
  turnTimeoutSeconds: 60,
};

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
  const owner = roomOwnerName(room);
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
      <h3>{room.displayName || '午夜追缉'}</h3>
      <p>{playing
        ? `最高公开 ${room.highestRevealed ?? 0}`
        : `等待${roleName(ownerRole === 'fugitive' ? 'marshal' : 'fugitive')}`}
        {' · '}{timeoutLabel(room.turnTimeoutSeconds)}</p>
    </div><Scene index={scene} className="room-card-art" /></div>
    <div className="room-card-bottom">
      <div className="room-members">
        <Portrait role={ownerRole} className="avatar" />
        {room.roomPlayer.length > 1
          ? <Portrait role={ownerRole === 'fugitive' ? 'marshal' : 'fugitive'} className="avatar" />
          : <span className="vacant-avatar"><Plus size={12} /></span>}
        <span><b>{room.roomPlayer.length} / 2</b><small>{owner} 的房间</small></span>
      </div>
      <button className={`button ${entry.allowed ? 'room-join' : 'secondary'}`}
        type="button" disabled={!entry.allowed}
        onClick={() => onEnter(room)}>
        {entry.label}{entry.allowed && <ArrowRight size={14} />}
      </button>
    </div>
  </article>;
}

export default function Lobby() {
  const navigate = useNavigate();
  const lobby = useFugitiveLobby();
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('fugitive');
  const action = useLatestAsyncAction();
  const [panel, setPanel] = useState<'create' | 'join'>();
  const [draft, setDraft] = useState<RoomDraft>(defaultDraft);
  const [code, setCode] = useState('');
  const [foundRoom, setFoundRoom] = useState<FugitiveRoom>();
  const userID = profile.data?.id ?? '';
  const ownRoom = useMemo(() => lobby.rooms.find(room =>
    room.roomPlayer.some(player =>
      player.userID === userID || player.playerID === userID)), [lobby.rooms, userID]);

  const enter = (room: FugitiveRoom) => {
    if (roomEntry(room, { userID }).allowed) {
      navigate(`/game/fugitive/match?roomID=${encodeURIComponent(room.roomID)}`);
    }
  };
  const openCreate = () => {
    setDraft(defaultDraft);
    action.reset();
    setPanel('create');
  };
  const create = async () => {
    const name = draft.name.trim();
    if (!name) return;
    try {
      const room = await action.run(signal => createFugitiveRoom({
        ...draft,
        displayName: name,
      }, signal));
      navigate(`/game/fugitive/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch { /* Shared action exposes the error. */ }
  };
  const find = async () => {
    if (!code.trim()) return;
    setFoundRoom(undefined);
    try {
      setFoundRoom(await action.run(signal =>
        lookupFugitiveRoom(code.trim(), signal)));
    } catch { /* Shared action exposes the error. */ }
  };
  const close = () => {
    if (action.pending) return;
    setPanel(undefined);
    setFoundRoom(undefined);
    action.reset();
  };
  const initialLoading = !lobby.hasLoaded && !lobby.error
    || profile.loading && !profile.data;

  return <AppShell title="游戏大厅" profile={profile.data}>
    {initialLoading
      ? <FugitiveLoading description="正在同步追逃房间与在线玩家" />
      : <main className="page-content lobby-page framework-lobby">
        <section className="lobby-hero">
          <img className="hero-art" src={ART.hero}
            alt="午夜城市与高架铁路，追逃主题插画" />
          <div className="hero-copy"><Eyebrow>A TWO-PLAYER GAME OF CAT & MOUSE</Eyebrow>
            <h1>下一步，<br />让他猜。</h1>
            <p>一个制造谜题，一个追寻答案。<br />在这座不眠的城市，谁能走在前面？</p>
            <div className="hero-actions">
              <button className="button primary" type="button" onClick={openCreate}>
                <Plus size={17} />创建房间<ArrowRight size={17} />
              </button>
              <Link className="button hero-secondary" to="/game/fugitive/guide">
                了解玩法<ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <div className="hero-label"><span>THE MIDNIGHT RUN</span>
            <span>一 场 没 有 回 头 路 的 追 逐</span></div>
        </section>
        <div className="game-facts">
          <span><Users size={16} /><b>2</b> 位玩家</span>
          <span><Clock3 size={16} /><b>10–20</b> 分钟</span>
          <span><Layers size={16} /><b>43</b> 张地点牌</span>
          <Link to="/game/fugitive/guide">第一次来？读懂规则 <ArrowRight size={15} /></Link>
        </div>
        {ownRoom && <section className="own-room-return">
          <ProfileMonogram profile={profile.data} className="own-room-mark" />
          <div><b>{ownRoom.displayName || '午夜追缉'}</b>
            <small>{ownRoom.visibility === 'private' ? '私密房间' : '你的公开房间'}
              {' · '}{ownRoom.roomPlayer.length}/2 已入座</small></div>
          <button className="button secondary" type="button" onClick={() => enter(ownRoom)}>
            返回房间<ArrowRight size={14} /></button>
        </section>}
        <div className="lobby-lower"><section className="room-panel">
          <div className="section-heading"><div><Eyebrow>TAKE YOUR SIDE</Eyebrow>
            <h2>找一个对手，开一场追逐。</h2></div>
            <button className="text-button" type="button"
              onClick={() => { setCode(''); action.reset(); setPanel('join'); }}>
              <Hash size={14} />房间号加入</button>
          </div>
          <div className="room-toolbar"><div className="tabs">
            {([
              { id: 'all', text: '全部' },
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
            <input aria-label="搜索房间" placeholder="房间名称、房间号或房主"
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
        <aside className="lobby-aside">
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
          <Link className="learning-card" to="/game/fugitive/guide"><div>
            <Eyebrow>BEFORE YOUR FIRST MOVE</Eyebrow><h3>先读懂，再看穿。</h3>
            <p>3 分钟，学会你的第一场追逐。</p>
            <b>了解玩法<ArrowUpRight size={14} /></b>
          </div><BookOpen size={40} strokeWidth={1.2} /></Link>
          <div className="quick-role-actions">
            <button type="button" onClick={openCreate}><Footprints size={18} />
              <span>做逃亡者<small>手牌规划与冲刺</small></span><ArrowUpRight size={14} /></button>
            <button type="button" onClick={openCreate}><Shield size={18} />
              <span>做追捕者<small>线索排除与搜查</small></span><ArrowUpRight size={14} /></button>
          </div>
        </aside></div>
        <div className="lobby-bottom-links">
          <Link to="/game/fugitive/cards"><Layers size={16} />
            <span><b>完整牌库</b> · 查询 43 张地点牌</span><ArrowUpRight size={14} /></Link>
          <Link to="/game/fugitive/rankings"><Trophy size={16} />
            <span>城市风云榜 · 真实线上战绩</span><ArrowUpRight size={14} /></Link>
        </div>
      </main>}

    {panel === 'create' && <Modal title="为这场追逐，留一个名字。"
      kicker="OPEN YOUR OWN ROOM" onClose={close}
      footer={<><button className="button secondary" type="button"
        disabled={action.pending} onClick={close}>取消</button>
        <button className="button primary" type="button"
          disabled={action.pending || !draft.name.trim()} onClick={() => void create()}>
          创建并入座<ArrowRight size={16} /></button></>}>
      <label className="form-label" htmlFor="fugitive-room-name">房间名称</label>
      <input className="input" id="fugitive-room-name" maxLength={18}
        value={draft.name} onChange={event => setDraft(current => ({
          ...current,
          name: event.target.value,
        }))} placeholder="给这场追逐起个名字" />
      {!draft.name.trim() && <p className="field-error">填写房间名称后才能继续。</p>}
      <label className="form-label">谁可以加入？</label>
      <div className="privacy-options">{([
        { id: 'public', title: '公开房间', text: '展示在在线大厅', icon: Globe2 },
        { id: 'private', title: '私密房间', text: '凭完整房间号加入', icon: LockKeyhole },
      ] as const).map(item => <button type="button" key={item.id}
        className={draft.visibility === item.id ? 'selected' : ''}
        aria-pressed={draft.visibility === item.id}
        onClick={() => setDraft(current => ({ ...current, visibility: item.id }))}>
        <item.icon size={22} /><span><b>{item.title}</b><small>{item.text}</small></span>
        {draft.visibility === item.id && <Check size={17} />}
      </button>)}</div>
      <div className="room-form-split"><div><label className="form-label">席位数量</label>
        <div className="fixed-capacity"><Users size={17} /><b>2 人固定</b></div></div>
        <div><label className="form-label" htmlFor="fugitive-turn-time">每回合思考时间</label>
          <select id="fugitive-turn-time" className="input"
            value={draft.turnTimeoutSeconds}
            onChange={event => setDraft(current => ({
              ...current,
              turnTimeoutSeconds: Number(event.target.value),
            }))}>
            <option value={60}>60 秒</option><option value={90}>90 秒</option>
            <option value={0}>不限时</option>
          </select></div>
      </div>
      <p className="notice"><ShieldCheck size={16} />
        <span>洗牌、手牌、暗置路线、合法性与胜负均由服务端验证。</span></p>
      {action.error && <p className="field-error" role="alert">{action.error}</p>}
    </Modal>}

    {panel === 'join' && <Modal title="他已经在等你了？"
      kicker="FOLLOW THE ROOM CODE" onClose={close}
      footer={<button className="button primary full" type="button"
        disabled={action.pending || !code.trim()}
        onClick={() => foundRoom ? enter(foundRoom) : void find()}>
        {foundRoom ? roomEntry(foundRoom, { userID }).label : '查找房间'}<ArrowRight size={17} />
      </button>}>
      <p className="muted">输入完整房间号，找到留下的位置。</p>
      <label className="form-label" htmlFor="fugitive-join-code">房间号</label>
      <input className="input code-input" id="fugitive-join-code"
        autoComplete="off" enterKeyHint="go" placeholder="输入完整房间号"
        value={code} onChange={event => {
          setCode(event.target.value);
          setFoundRoom(undefined);
          action.reset();
        }} onKeyDown={event => {
          if (event.key === 'Enter' && code.trim()) void find();
        }} />
      {action.error && <p className="field-error" role="alert">{action.error}</p>}
      {foundRoom && <div className="invitation"><h3>{foundRoom.displayName || '午夜追缉'}</h3>
        <p>{roomOwnerName(foundRoom)} · {foundRoom.roomPlayer.length}/2 已入座</p>
        <p>{foundRoom.roomPlayer.map(player => playerDisplayName(player)).join(' / ')}</p>
      </div>}
    </Modal>}
  </AppShell>;
}
