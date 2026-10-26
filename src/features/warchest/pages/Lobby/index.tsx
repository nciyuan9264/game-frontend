import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  Flag,
  Globe2,
  LockKeyhole,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { GameShareContent } from '@/components/GameUI/GameShareContent';
import { getProfile } from '@/features/game-core/api/auth';
import { useClipboardCopy } from '@/features/game-core/hooks/useClipboardCopy';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useLatestAsyncAction } from '@/features/game-core/hooks/useLatestAsyncAction';
import { roomOwnerProfile } from '@/features/game-core/model/room';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { createWarChestRoom, lookupWarChestRoom } from '../../api/room';
import { WARCHEST_PUBLIC_URL, roomEntry } from '../../adapters';
import { useWarChestLobby } from '../../hooks/useWarChestLobby';
import type { LobbyFilter, Visibility, WarChestRoom } from '../../types';
import { HERO, Crest, Eyebrow, Modal, UnitGlyph } from '../../visuals';
import { Shell, Loading, Notice } from '../../components/Shell';
import type { UnitId } from '../../model';

interface Draft {
  name: string;
  visibility: Visibility;
}

const defaultDraft: Draft = { name: '雾谷前哨', visibility: 'public' };
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
  room: WarChestRoom;
  userID: string;
  onEnter: (room: WarChestRoom) => void;
}) {
  const entry = roomEntry(room, { userID });
  const owner = roomOwnerProfile(room);
  const playing = room.status !== 'match';
  const progress = Math.max(0, Math.min(6, room.maxControlledLocations ?? 0));
  const glyphs: UnitId[] = ['pike', 'light', 'crossbow'];
  const glyph = glyphs[Array.from(room.roomID).reduce((sum, value) =>
    sum + value.charCodeAt(0), 0) % glyphs.length];
  return <article className="room-card">
    <div className="room-card-top"><span className={`status-tag ${playing ? 'playing' : ''}`}>
      <i />{playing ? '对局中' : '等待加入'}</span><span>#{room.roomID}</span></div>
    <div className="room-card-name"><h3>{room.displayName || '战争之匣'}</h3>
      <span className="room-ornament"><UnitGlyph type={glyph} size={34} /></span></div>
    <p>{playing ? `领先方已控制 ${progress} 处` : '完整基础版'}<span>·</span>
      {room.turnTimeoutSeconds ?? 90} 秒行动</p>
    <div className="room-card-bottom"><div className="room-seats">
      {owner.player && <span className="room-owner-avatar" aria-hidden="true">
        {owner.avatar
          ? <img src={owner.avatar} alt="" referrerPolicy="no-referrer" />
          : Array.from(owner.name.trim() || '将').slice(0, 1).join('')}
      </span>}
      {room.roomPlayer.filter(player => player !== owner.player).map(player =>
        <Crest key={player.playerID} side={1} size={30} />)}
      {room.roomPlayer.length < 2 && <span className="empty-seat-mini">+</span>}
      <span>{room.roomPlayer.length}<small> / 2</small></span></div>
      <button className={entry.allowed ? 'room-join' : 'room-view'}
        type="button" disabled={!entry.allowed} onClick={() => onEnter(room)}>
        {entry.label}{entry.allowed && <ArrowRight size={15} />}</button></div>
    <div className="room-host">{owner.name} 的房间</div>
    {playing && <div className="room-card-progress"><i style={{ width: `${progress / 6 * 100}%` }} /></div>}
  </article>;
}

export default function Lobby() {
  const navigate = useNavigate();
  const lobby = useWarChestLobby();
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('warchest');
  const action = useLatestAsyncAction();
  const shareClipboard = useClipboardCopy();
  const [panel, setPanel] = useState<'create' | 'join' | 'share'>();
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [code, setCode] = useState('');
  const [foundRoom, setFoundRoom] = useState<WarChestRoom>();
  const userID = profile.data?.id ?? '';
  const ownRoom = useMemo(() => lobby.rooms.find(room =>
    room.roomPlayer.some(player =>
      player.userID === userID || player.playerID === userID)), [lobby.rooms, userID]);

  const enter = (room: WarChestRoom) => {
    if (roomEntry(room, { userID }).allowed) {
      navigate(`/game/warchest/match?roomID=${encodeURIComponent(room.roomID)}`);
    }
  };
  const create = async () => {
    const displayName = draft.name.trim();
    if (!displayName) return;
    try {
      const room = await action.run(signal => createWarChestRoom({
        displayName,
        visibility: draft.visibility,
      }, signal));
      navigate(`/game/warchest/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch { /* Shared action owns the error. */ }
  };
  const find = async () => {
    if (!code.trim()) return;
    setFoundRoom(undefined);
    try {
      setFoundRoom(await action.run(signal =>
        lookupWarChestRoom(code.trim(), signal)));
    } catch { /* Shared action owns the error. */ }
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

  return <Shell title="游戏大厅" profile={profile.data}>
    {initialLoading ? <Loading text="正在同步战场与在线指挥官。" />
      : <main className="page lobby-page"><div className="welcome-row">
        <p>欢迎归来，{profile.data?.name || '指挥官'}。</p><span>沉着落子，自有回响。</span></div>
      <section className="hero" data-testid="warchest-lobby-hero">
        <img className="hero-image" src={HERO} alt="墨绿色山地与城堡前的骑兵，前景为金属兵种币" />
        <div className="hero-shade" /><div className="hero-copy">
          <Eyebrow><span />THE ART OF COMMAND</Eyebrow><h1>方寸之间，<br />运筹千军。</h1>
          <p>从一枚指令，到一场胜局。<br />让每一次调遣，都成为你的远见。</p>
          <div className="hero-actions"><button className="button gold" type="button"
            onClick={() => { setDraft(defaultDraft); action.reset(); setPanel('create'); }}>
            <Plus size={17} />创建房间<ArrowRight size={16} /></button>
            <button className="button hero-secondary" type="button"
              onClick={() => { shareClipboard.reset(); setPanel('share'); }}>
              <Share2 size={15} />分享游戏</button></div></div>
        <div className="hero-seal"><span>WAR CHEST</span><Flag size={24} /><small>静 默 行 军</small></div>
        <span className="hero-caption">A QUIET MIND. A DECISIVE MOVE.</span>
      </section>
      <div className="game-facts" data-testid="warchest-lobby-facts">
        <span><Users size={18} /><b>2</b><small>位指挥官</small></span>
        <span><Clock3 size={18} /><b>90</b><small>秒行动</small></span>
        <span><Flag size={18} /><b>6</b><small>据点即胜</small></span>
        <button type="button" onClick={() => navigate('/game/warchest/guide')}>第一次出征？
          <b>了解玩法</b><ArrowUpRight size={15} /></button></div>
      {ownRoom && <section className="own-room-return"><Crest size={40} /><div>
        <b>{ownRoom.displayName || '战争之匣'}</b><small>{ownRoom.visibility === 'private' ? '私密房间' : '你的公开房间'}
          {' · '}{ownRoom.roomPlayer.length}/2 已入座</small></div>
        <button className="button secondary" type="button" onClick={() => enter(ownRoom)}>
          返回房间<ArrowRight size={14} /></button></section>}
      <div className="lobby-columns"><section className="rooms-section">
        <div className="section-heading"><div><Eyebrow>CHOOSE YOUR BATTLEFIELD</Eyebrow>
          <h2>为下一场交锋，入席。</h2></div>
          <button className="text-button" type="button"
            onClick={() => { setCode(''); setFoundRoom(undefined); action.reset(); setPanel('join'); }}>
            房间号加入 <ArrowRight size={15} /></button></div>
        <div className="room-toolbar"><div className="tabs">{filters.map(item =>
          <button type="button" key={item.value} className={lobby.filter === item.value ? 'active' : ''}
            onClick={() => lobby.setFilter(item.value)}>{item.label}
            {item.value === 'all' && <span>{lobby.rooms.length}</span>}</button>)}</div>
          <label className="search-field"><Search size={15} /><input aria-label="搜索房间"
            placeholder="搜索房间名称 / 房间号 / 房主" value={lobby.query}
            onChange={event => lobby.setQuery(event.target.value)} />
            {lobby.query && <button type="button" aria-label="清空房间搜索"
              onClick={() => lobby.setQuery('')}><X size={13} /></button>}</label></div>
        {lobby.error && <Notice error>{lobby.error} <button className="text-button"
          type="button" onClick={lobby.refresh}>重试</button></Notice>}
        <div className="room-cards">{lobby.filteredRooms.map(room =>
          <RoomCard key={room.roomID} room={room} userID={userID} onEnter={enter} />)}
          {!lobby.error && !lobby.filteredRooms.length && <div className="empty-state room-empty">
            <Search size={30} /><h3>还没有找到这片战场</h3><p>换个关键词，或升起自己的战旗。</p>
            <button className="button secondary" type="button"
              onClick={() => { lobby.setQuery(''); lobby.setFilter('all'); }}>清空筛选</button></div>}</div>
        <p className="demo-note online-note"><ShieldCheck size={13} />房间、编成、抽币和所有行动均由服务端验证</p>
      </section><aside className="lobby-aside"><section className="commander-card">
        <div className="commander-top"><Crest size={44} /><div><small>你的指挥官手册</small>
          <h3>{profile.data?.name || '指挥官'}</h3></div></div>
        <div className="commander-stats"><div><b>{stats.data?.totalGames ?? '—'}</b><span>完成对局</span></div>
          <div><b>{stats.data?.wins ?? '—'}</b><span>胜局</span></div>
          <div><b>{stats.data ? `${Math.round(stats.data.winRate * 100)}%` : '—'}</b><span>胜率</span></div></div>
        <Link to="/game/warchest/me">查看我的战绩 <ArrowRight size={16} /></Link></section>
        <Link className="learning-card" to="/game/warchest/army"><div>
          <Eyebrow>KNOW YOUR LEGION</Eyebrow><h3>十六兵种，各有所长。</h3>
          <p>认识能力，再决定编成。</p><span>翻开兵种图鉴 <ArrowRight size={15} /></span></div>
          <Swords size={51} strokeWidth={0.9} /></Link>
        <div className="quick-role-actions"><Link to="/game/warchest/rankings"><Trophy size={18} />
          <span>指挥官排行<small>真实线上胜率</small></span><ArrowUpRight size={14} /></Link></div>
      </aside></div></main>}

    {panel === 'create' && <Modal title="为下一场交锋，升起战旗。" eyebrow="CREATE A ROOM"
      onClose={close} footer={<><button className="button secondary" type="button"
        disabled={action.pending} onClick={close}>取消</button><button className="button primary"
          type="button" disabled={action.pending || !draft.name.trim()} onClick={() => void create()}>
          创建并入座 <ArrowRight size={17} /></button></>}>
      <label className="field-label" htmlFor="warchest-room-name">房间名称
        <small>{draft.name.length}/18</small></label>
      <input id="warchest-room-name" className="input full" maxLength={18}
        placeholder="为这片战场命名" value={draft.name}
        onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} />
      {!draft.name.trim() && <p className="field-error">请先填写房间名称。</p>}
      <div className="field-label">房间可见性</div><div className="privacy-options">
        {([{ id: 'public', title: '公开房间', text: '展示在在线大厅', icon: Globe2 },
          { id: 'private', title: '私密房间', text: '仅通过房间号进入', icon: LockKeyhole }] as const)
          .map(item => <button key={item.id} type="button" className={draft.visibility === item.id ? 'selected' : ''}
            onClick={() => setDraft(current => ({ ...current, visibility: item.id }))}>
            <item.icon size={21} /><span><b>{item.title}</b><small>{item.text}</small></span>
            {draft.visibility === item.id && <Check size={15} />}</button>)}</div>
      <div className="field-label">对局规则</div><div className="segmented">
        <button className="active" type="button">双人完整基础版</button><button disabled type="button">固定 90 秒</button></div>
      <div className="info-note"><ShieldCheck size={17} /><span>进入房间后选择推荐、随机或官方轮抽编成</span></div>
      {action.error && <Notice error>{action.error}</Notice>}
    </Modal>}

    {panel === 'join' && <Modal title="朋友为你留了席位？" eyebrow="JOIN A ROOM" onClose={close}
      footer={<><button className="button secondary" type="button" onClick={close}>取消</button>
        <button className="button primary" type="button" disabled={action.pending || !code.trim()}
          onClick={() => foundRoom ? enter(foundRoom) : void find()}>
          {foundRoom ? roomEntry(foundRoom, { userID }).label : '查找房间'}<ArrowRight size={17} /></button></>}>
      <p className="dialog-intro">输入完整房间号，找到下一场交锋。</p>
      <label className="field-label" htmlFor="warchest-room-code">房间号</label>
      <input id="warchest-room-code" className="input full" value={code}
        placeholder="输入完整房间号" autoCapitalize="off" autoCorrect="off" spellCheck={false}
        onChange={event => { setCode(event.target.value); setFoundRoom(undefined); action.reset(); }} />
      {action.error && <Notice error>{action.error}</Notice>}
      {foundRoom && <div style={{ marginTop: 16 }}><RoomCard room={foundRoom} userID={userID} onEnter={enter} /></div>}
    </Modal>}

    {panel === 'share' && <Modal title="邀请一位指挥官。" eyebrow="SHARE WAR CHEST" onClose={close}
      footer={<><button className="button secondary" type="button" onClick={close}>关闭</button>
        <button className="button primary" type="button"
          onClick={() => void shareClipboard.copy(WARCHEST_PUBLIC_URL)}>
          {shareClipboard.copiedValue === WARCHEST_PUBLIC_URL ? <Check size={16} /> : <Copy size={16} />}
          {shareClipboard.copiedValue === WARCHEST_PUBLIC_URL ? '链接已复制' : '复制游戏链接'}
        </button></>}>
      <GameShareContent url={WARCHEST_PUBLIC_URL} color="#263b30" background="#f1ead8"
        classes={{ root: 'share-content', qr: 'share-qr', address: 'share-address', hint: 'share-hint' }} />
    </Modal>}
  </Shell>;
}
