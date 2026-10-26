import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Check, Clock3, Crown, Globe2, KeyRound, LockKeyhole,
  Plus, Search, Share2, ShieldCheck, Sparkles, Users, X, Copy,
} from 'lucide-react';
import { GameShareContent } from '@/components/GameUI/GameShareContent';
import { getProfile } from '@/features/game-core/api/auth';
import { getMyStats } from '@/features/game-core/api/history';
import { useClipboardCopy } from '@/features/game-core/hooks/useClipboardCopy';
import { playerDisplayName, roomOwnerProfile } from '@/features/game-core/model/room';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useLatestAsyncAction } from '@/features/game-core/hooks/useLatestAsyncAction';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { GameTabs } from '@/components/GameUI/GameTabs';
import hero from '../../assets/hero.webp';
import { createSplendorRoom, lookupSplendorRoom } from '../../api/room';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { Artwork, Eyebrow, GemIcon } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { SplendorLoading } from '../../components/LoadingState';
import { useSplendorLobby } from '../../hooks/useSplendorLobby';
import { SPLENDOR_PUBLIC_URL, roomEntry } from '../../model/adapters';
import type { LobbyFilter, SplendorRoom, Visibility } from '../../model/types';
import styles from './index.module.less';

const loadStats = () => getMyStats('splendor');
const roomFilters: Array<{ value: LobbyFilter; label: string }> = [
  { value: 'all', label: '全部房间' },
  { value: 'joinable', label: '可加入' },
  { value: 'playing', label: '对局中' },
];

function RoomCard({ room, userID, onEnter, artIndex }: {
  room: SplendorRoom;
  userID: string;
  onEnter: (room: SplendorRoom) => void;
  artIndex: number;
}) {
  const entry = roomEntry(room, { userID });
  const owner = roomOwnerProfile(room);
  const players = owner.player
    ? [owner.player, ...room.roomPlayer.filter(player => player !== owner.player)]
    : room.roomPlayer;
  return <article className={styles.roomCard}>
    <div className={styles.roomTop}><span className={room.status === 'match' ? styles.waiting : styles.playing}>
      <i />{room.status === 'match' ? '等待加入' : '对局中'}</span>
      <b>#{room.roomID}</b>{room.visibility === 'private' && <LockKeyhole size={13} />}</div>
    <div className={styles.roomTitle}><div><h3>{owner.name} 的商会</h3><p>经典对局 · {room.visibility === 'private' ? '私密' : '公开'}</p></div>
      <Artwork index={artIndex} /></div>
    <div className={styles.people}>{players.slice(0, 3).map(player =>
      <PlayerAvatar key={player.playerID} name={playerDisplayName(player)}
        avatar={player.avatar} ai={player.ai} size={31} />)}
      {players.length < room.maxPlayers && <span>+</span>}
      <strong>{players.length} <small>/ {room.maxPlayers} 人</small></strong></div>
    <div className={styles.roomBottom}><span>{room.status === 'match' ? `${owner.name} 正在等待` : `最高声望 ${room.maxScore ?? 0}`}</span>
      <ActionButton variant={entry.allowed ? 'secondary' : 'quiet'} disabled={!entry.allowed} onClick={() => onEnter(room)}>
        {entry.label}{entry.allowed && <ArrowRight size={15} />}
      </ActionButton></div>
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
  return <section className={styles.joinCard}><h3><KeyRound size={18} />朋友已经开好房间？</h3>
    <p>输入完整房间号，找到朋友的商会。</p>
    <form onSubmit={event => { event.preventDefault(); onJoin(); }}>
      <input aria-label="查找房间号" placeholder="输入完整房间号" value={code}
        onChange={event => setCode(event.target.value)} autoCapitalize="off"
        autoCorrect="off" spellCheck={false} />
      <button disabled={!code.trim()} aria-label="查找房间" type="submit"><ArrowRight size={19} /></button>
    </form>
  </section>;
}

export default function Lobby() {
  const navigate = useNavigate();
  const lobby = useSplendorLobby();
  const profile = useAsyncResource(getProfile);
  const stats = useAsyncResource(loadStats);
  const [panel, setPanel] = useState<'create' | 'join' | 'share'>();
  const shareClipboard = useClipboardCopy();
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [code, setCode] = useState('');
  const [foundRoom, setFoundRoom] = useState<SplendorRoom>();
  const action = useLatestAsyncAction();
  const { error, pending } = action;
  const userID = profile.data?.id ?? '';
  const identity = { userID };

  const enter = (room: SplendorRoom) => {
    if (roomEntry(room, identity).allowed) {
      navigate(`/game/splendor/match?roomID=${encodeURIComponent(room.roomID)}`);
    }
  };
  const create = async () => {
    try {
      const room = await action.run(signal => createSplendorRoom(visibility, signal));
      navigate(`/game/splendor/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch { /* Error state is owned by the shared action hook. */ }
  };
  const find = async () => {
    if (!code.trim()) return;
    setFoundRoom(undefined);
    setPanel('join');
    try {
      setFoundRoom(await action.run(signal => lookupSplendorRoom(code.trim(), signal)));
    } catch { /* Error state is owned by the shared action hook. */ }
  };
  const close = () => {
    if (pending) return;
    setPanel(undefined);
    setFoundRoom(undefined);
    shareClipboard.reset();
    action.reset();
  };
  const initialLoading = !lobby.hasLoaded && !lobby.error || profile.loading && !profile.data;

  return <AppShell title="游戏大厅" profile={profile.data}>
    {initialLoading ? <SplendorLoading description="正在同步商会与在线收藏家" /> : <div className={styles.page}>
      <section className={styles.hero} data-testid="splendor-lobby-hero">
        <img src={hero} alt="暮色下的文艺复兴商港与宝石收藏" />
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}><Eyebrow>THE ART OF PROSPERITY</Eyebrow>
          <h1>从一颗宝石，<br />到一座商业帝国。</h1>
          <p>收集宝石，拓展商路，赢得贵族的青睐。<br />你的下一次远见，将在这里闪耀。</p>
          <div className={styles.heroActions}><ActionButton variant="primary" disabled={!profile.data}
            onClick={() => { setVisibility('public'); action.reset(); setPanel('create'); }}>
            <Plus size={17} />创建房间<ArrowRight size={16} />
          </ActionButton><ActionButton onClick={() => { shareClipboard.reset(); setPanel('share'); }}>
            <Share2 size={16} />分享游戏</ActionButton></div></div>
        <div className={styles.heroStamp}><GemIcon color="Red" size={23} /><span>THE GILDED HOUR<small>暮色宝石商会</small></span></div>
      </section>

      <div className={styles.gameFacts} data-testid="splendor-lobby-facts"><span><Users size={17} /><b>4</b> 位收藏家</span>
        <span><Clock3 size={17} /><b>60</b> 秒回合时限</span>
        <span><Crown size={18} /><b>15</b> 点声望开启终局</span>
        <Link to="/game/splendor/guide">初次来访？了解玩法 <ArrowRight size={15} /></Link></div>

      <div className={styles.layout}><section className={styles.rooms} data-testid="splendor-lobby-browser">
        <div className={styles.sectionHeading}><div><Eyebrow>TAKE YOUR SEAT</Eyebrow><h2>好的一局，从入座开始。</h2></div>
          <span className={styles.visibleRooms}>可见房间</span></div>
        <div className={styles.toolbar}><GameTabs items={roomFilters} value={lobby.filter}
          onChange={lobby.setFilter} ariaLabel="房间筛选" className={styles.tabs} activeClassName={styles.active}
          renderItem={item => <>{item.label}{item.value === 'all' && <span>{lobby.rooms.length}</span>}</>} />
          <label><Search size={16} /><input aria-label="搜索房间" placeholder="搜索房间号 / 房主" value={lobby.query}
            onChange={event => lobby.setQuery(event.target.value)} />
            {lobby.query && <button type="button" aria-label="清空搜索" onClick={() => lobby.setQuery('')}><X size={14} /></button>}</label></div>
        {lobby.error && <Feedback error>{lobby.error}<ActionButton onClick={lobby.refresh}>重试</ActionButton></Feedback>}
        <div className={styles.roomGrid}>{lobby.filteredRooms.map((room, index) =>
          <RoomCard key={room.roomID} room={room} userID={userID} onEnter={enter} artIndex={[4, 5, 7][index % 3]} />)}</div>
        {!lobby.error && !lobby.filteredRooms.length && <div className={styles.empty}><Search size={32} />
          <h3>还没有找到这间商会</h3><p>换个关键词，或开一间自己的房间。</p>
          <ActionButton onClick={() => { lobby.setQuery(''); lobby.setFilter('all'); }}>清空筛选</ActionButton></div>}
      </section>

      <aside className={styles.side} data-testid="splendor-lobby-aside"><section className={styles.collector}>
        <div className={styles.collectorHeading}><PlayerAvatar name={profile.data?.name ?? '玩家'} avatar={profile.data?.avatar} size={44} />
          <div><span>欢迎回来，收藏家</span><h3>{profile.data?.name || '玩家'} <Sparkles size={15} /></h3></div></div>
        <div className={styles.stats}><div><b>{stats.data?.totalGames ?? '—'}</b><span>完成对局</span></div>
          <div><b>{stats.data?.wins ?? '—'}</b><span>获胜场次</span></div>
          <div><b>{stats.data ? `${Math.round(stats.data.winRate * 100)}%` : '—'}</b><span>胜率</span></div></div>
        <Link to="/game/splendor/me">我的收藏家档案 <ArrowRight size={16} /></Link></section>
        <JoinCard code={code} setCode={setCode} onJoin={() => void find()} />
        <Link className={styles.learning} to="/game/splendor/guide"><div><span>THE FIRST GEM</span><h3>先积累，再闪耀。</h3>
          <p>读懂你的第一局。</p><b>开始了解 <ArrowRight size={15} /></b></div><BookOpen size={51} /></Link></aside>
      </div>
      <div className={styles.mobileJoin} data-testid="splendor-lobby-mobile-join">
        <JoinCard code={code} setCode={setCode} onJoin={() => void find()} />
      </div>
    </div>}

    {panel === 'create' && <Dialog title="为今晚，开一间商会。" eyebrow="OPEN YOUR OWN SALON" onClose={close}
      footer={<><ActionButton onClick={close} disabled={pending}>取消</ActionButton>
        <ActionButton variant="primary" pending={pending} disabled={!profile.data} onClick={() => void create()}>
          创建并入座<ArrowRight size={17} /></ActionButton></>}>
      <div className={styles.create}><p>选择谁可以找到这间商会。</p>
        <div>{(['public', 'private'] as const).map(value => <button type="button" key={value}
          aria-pressed={visibility === value} onClick={() => setVisibility(value)}>
          {value === 'public' ? <Globe2 size={24} /> : <LockKeyhole size={24} />}
          <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
            <small>{value === 'public' ? '展示在大厅，与新收藏家相遇' : '凭完整房间号加入'}</small></span>
          {visibility === value && <Check size={17} />}</button>)}</div>
        <dl><div><dt>席位数量</dt><dd>固定 4 人</dd></div><div><dt>回合时限</dt><dd>固定 60 秒</dd></div></dl>
        <span><ShieldCheck size={16} />经典规则固定，身份与全部操作由服务端验证。</span>
        {error && <Feedback error>{error}</Feedback>}</div>
    </Dialog>}

    {panel === 'join' && <Dialog title="朋友已经留好了席位？" eyebrow="AN INVITATION TO THE SALON" onClose={close}
      footer={<ActionButton variant="primary" pending={pending} disabled={!code.trim()}
        onClick={() => foundRoom ? enter(foundRoom) : void find()}>
        {foundRoom ? roomEntry(foundRoom, identity).label : '查找房间'}<ArrowRight size={17} /></ActionButton>}>
      <form className={styles.join} onSubmit={event => { event.preventDefault(); foundRoom ? enter(foundRoom) : void find(); }}>
        <KeyRound size={28} /><p>输入完整房间号，找到朋友的商会。</p>
        <label>房间号<input aria-label="房间号" value={code} onChange={event => { setCode(event.target.value); setFoundRoom(undefined); action.reset(); }}
          placeholder="输入完整房间号" autoCapitalize="off" autoCorrect="off" spellCheck={false} /></label></form>
      {error && <Feedback error>{error}</Feedback>}
      {foundRoom && <RoomCard room={foundRoom} userID={userID} onEnter={enter} artIndex={4} />}
    </Dialog>}
    {panel === 'share' && <Dialog title="分享 Splendor" eyebrow="INVITE SOMEONE TO THE SALON" onClose={close}
      footer={<><ActionButton onClick={close}>关闭</ActionButton>
        <ActionButton variant="primary" onClick={() => void shareClipboard.copy(SPLENDOR_PUBLIC_URL)}>
          {shareClipboard.copiedValue === SPLENDOR_PUBLIC_URL ? <Check size={16} /> : <Copy size={16} />}
          {shareClipboard.copiedValue === SPLENDOR_PUBLIC_URL ? '链接已复制' : '复制游戏链接'}
        </ActionButton></>}>
      <GameShareContent url={SPLENDOR_PUBLIC_URL} color="#583b3e" background="#fffaf1"
        classes={{ root: styles.shareContent, qr: styles.shareQr, address: styles.shareAddress, hint: styles.shareHint }} />
    </Dialog>}
  </AppShell>;
}
