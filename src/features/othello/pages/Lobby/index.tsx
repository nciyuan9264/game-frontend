import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Check, Clock3, Globe2, Grid3X3, KeyRound,
  LockKeyhole, Plus, Search, Share2, ShieldCheck, Users, X, Copy,
} from 'lucide-react';
import { GameShareContent } from '@/components/GameUI/GameShareContent';
import { getProfile } from '@/features/game-core/api/auth';
import { getMyStats } from '@/features/game-core/api/history';
import { useClipboardCopy } from '@/features/game-core/hooks/useClipboardCopy';
import { playerDisplayName } from '@/features/game-core/model/room';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useLatestAsyncAction } from '@/features/game-core/hooks/useLatestAsyncAction';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { createOthelloRoom, lookupOthelloRoom } from '../../api/room';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { Brand, Disc, OthelloStillLife } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { OthelloLoading } from '../../components/LoadingState';
import { useOthelloLobby } from '../../hooks/useOthelloLobby';
import { OTHELLO_PUBLIC_URL, roomEntry, roomOwnerName } from '../../model/adapters';
import type { LobbyFilter, Visibility, OthelloRoom } from '../../model/types';
import styles from './index.module.less';

const loadStats = () => getMyStats('othello');
const roomFilters: Array<{ value: LobbyFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'joinable', label: '可加入' },
  { value: 'playing', label: '对局中' },
];

function RoomCard({
  room,
  userID,
  onEnter,
}: {
  room: OthelloRoom;
  userID: string;
  onEnter: (room: OthelloRoom) => void;
}) {
  const entry = roomEntry(room, { userID });
  const owner = roomOwnerName(room);
  return <article className={styles.roomCard}>
    <header><span className={room.status === 'match' ? styles.waiting : styles.playing}>
      <i />{room.status === 'match' ? '等待落座' : '对局中'}
    </span><b>#{room.roomID}</b>{room.visibility === 'private' && <LockKeyhole size={13} />}</header>
    <div className={styles.roomIdentity}><span><Disc side="black" /><Disc side="white" /></span>
      <div><h3>{owner} 的棋室</h3><p>经典 8 × 8 · {room.visibility === 'private' ? '私密' : '公开'}</p></div></div>
    <div className={styles.players}>{room.roomPlayer.map(player =>
      <PlayerAvatar key={player.playerID} name={playerDisplayName(player)}
        avatar={player.avatar} ai={player.ai} size={32} />)}
      {room.roomPlayer.length < 2 && <span>+</span>}
      <strong>{room.roomPlayer.length}<small> / 2</small></strong></div>
    <footer><span>{room.status === 'match' ? `${owner} 正在等你` : `盘面已有 ${room.occupiedCount ?? 4} 子`}</span>
      <ActionButton variant={entry.allowed ? 'secondary' : 'quiet'} disabled={!entry.allowed}
        onClick={() => onEnter(room)}>{entry.label}{entry.allowed && <ArrowRight size={15} />}</ActionButton></footer>
  </article>;
}

function JoinCard({
  code,
  pending,
  onChange,
  onSubmit,
}: {
  code: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return <section className={styles.joinCard} data-testid="othello-join-card">
    <h3><KeyRound size={18} />朋友已经开好房间？</h3>
    <p>输入完整房间号，找到朋友的棋室。</p>
    <form onSubmit={event => {
      event.preventDefault();
      onSubmit();
    }}>
      <input aria-label="查找房间号" placeholder="输入完整房间号"
        value={code} disabled={pending}
        onChange={event => onChange(event.target.value)}
        autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      <button type="submit" aria-label="查找房间"
        disabled={pending || !code.trim()}><ArrowRight size={19} /></button>
    </form>
  </section>;
}

export default function Lobby() {
  const navigate = useNavigate();
  const lobby = useOthelloLobby();
  const profile = useAsyncResource(getProfile);
  const stats = useAsyncResource(loadStats);
  const action = useLatestAsyncAction();
  const [panel, setPanel] = useState<'create' | 'join' | 'share'>();
  const shareClipboard = useClipboardCopy();
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [code, setCode] = useState('');
  const [foundRoom, setFoundRoom] = useState<OthelloRoom>();
  const userID = profile.data?.id ?? '';
  const identity = { userID };

  const enter = (room: OthelloRoom) => {
    if (roomEntry(room, identity).allowed) {
      navigate(`/game/othello/match?roomID=${encodeURIComponent(room.roomID)}`);
    }
  };
  const create = async () => {
    try {
      const room = await action.run(signal => createOthelloRoom(visibility, signal));
      navigate(`/game/othello/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch { /* Shared action owns the error state. */ }
  };
  const find = async () => {
    if (!code.trim()) return;
    setFoundRoom(undefined);
    setPanel('join');
    try {
      setFoundRoom(await action.run(signal => lookupOthelloRoom(code.trim(), signal)));
    } catch { /* Shared action owns the error state. */ }
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

  return <AppShell title="对局大厅" profile={profile.data}>
    {initialLoading ? <OthelloLoading description="正在同步棋室与在线棋手" /> : <div className={styles.page}>
      <section className={styles.hero} data-testid="othello-lobby-hero"><div className={styles.heroCopy}>
        <span className={styles.eyebrow}>THE QUIET COLLECTION / 02</span>
        <h1>黑白之间，<br />总有转机。</h1>
        <p>简单的两种颜色，不简单的下一步。<br />在六十四格里，留一段安静思考的时间。</p>
        <div className={styles.heroActions}><ActionButton variant="primary" disabled={!profile.data}
          onClick={() => { setVisibility('public'); action.reset(); setPanel('create'); }}>
          <Plus size={17} />新开一局<ArrowRight size={17} />
        </ActionButton><ActionButton onClick={() => { shareClipboard.reset(); setPanel('share'); }}>
          <Share2 size={16} />分享游戏</ActionButton></div></div>
        <OthelloStillLife /><span className={styles.heroCaption}>OTHELLO / THE QUIET COLLECTION</span></section>
      <div className={styles.facts} data-testid="othello-lobby-facts"><span><Users size={17} /><b>2</b> 位棋手</span>
        <span><Grid3X3 size={17} /><b>8 × 8</b> 经典棋盘</span>
        <span><Clock3 size={17} /><b>60</b> 秒回合</span>
        <Link to="/game/othello/guide">第一次来？读懂规则 <ArrowRight size={15} /></Link></div>

      <div className={styles.layout}><section className={styles.rooms}>
        <header className={styles.sectionHeading}><div><span className={styles.eyebrow}>TAKE YOUR NEXT STEP</span>
          <h2>挑一局，慢慢想。</h2></div></header>
        <div className={styles.toolbar}><div>{roomFilters.map(item => <button type="button" key={item.value}
          className={lobby.filter === item.value ? styles.active : ''}
          onClick={() => lobby.setFilter(item.value)}>{item.label}{item.value === 'all' && <span>{lobby.rooms.length}</span>}</button>)}</div>
          <label><Search size={15} /><input aria-label="搜索房间" placeholder="搜索房间号 / 房主"
            value={lobby.query} onChange={event => lobby.setQuery(event.target.value)} />
            {lobby.query && <button type="button" aria-label="清空搜索" onClick={() => lobby.setQuery('')}><X size={14} /></button>}</label></div>
        {lobby.error && <Feedback error>{lobby.error}<ActionButton onClick={lobby.refresh}>重试</ActionButton></Feedback>}
        <div className={styles.roomGrid}>{lobby.filteredRooms.map(room =>
          <RoomCard key={room.roomID} room={room} userID={userID} onEnter={enter} />)}</div>
        {!lobby.error && !lobby.filteredRooms.length && <div className={styles.empty}><Search size={30} />
          <h3>还没有找到这间棋室</h3><p>换个关键词，或开一局自己的棋。</p></div>}
      </section>
      <aside className={styles.side}><section className={styles.profile}>
        <PlayerAvatar name={profile.data?.name ?? '棋手'} avatar={profile.data?.avatar} size={48} />
        <span>欢迎回来</span><h3>{profile.data?.name || '棋手'}</h3>
        <div><b>{stats.data?.totalGames ?? '—'}<small>对局</small></b>
          <b>{stats.data?.wins ?? '—'}<small>胜场</small></b>
          <b>{stats.data ? `${Math.round(stats.data.winRate * 100)}%` : '—'}<small>胜率</small></b></div>
        <Link to="/game/othello/me">查看我的棋谱 <ArrowRight size={15} /></Link></section>
        <JoinCard code={code} pending={action.pending}
          onChange={value => { setCode(value); setFoundRoom(undefined); action.reset(); }}
          onSubmit={() => void find()} />
        <Link className={styles.guide} to="/game/othello/guide"><BookOpen size={34} /><div>
          <span>THE OTHELLO HANDBOOK</span><h3>每一次翻转，都有章法。</h3><b>开始了解 <ArrowRight size={14} /></b></div></Link>
        <Brand small /></aside></div>
      <div className={styles.mobileJoin}><JoinCard code={code} pending={action.pending}
        onChange={value => { setCode(value); setFoundRoom(undefined); action.reset(); }}
        onSubmit={() => void find()} /></div>
    </div>}

    {panel === 'create' && <Dialog title="为两个人，开一局。" eyebrow="A TABLE FOR TWO" onClose={close}
      footer={<><ActionButton onClick={close} disabled={action.pending}>取消</ActionButton>
        <ActionButton variant="primary" pending={action.pending} disabled={!profile.data}
          onClick={() => void create()}>创建并入座<ArrowRight size={16} /></ActionButton></>}>
      <div className={styles.create}><p>选择其他棋手如何找到这间棋室。</p>
        <div>{(['public', 'private'] as const).map(value => <button type="button" key={value}
          aria-pressed={visibility === value} onClick={() => setVisibility(value)}>
          {value === 'public' ? <Globe2 size={23} /> : <LockKeyhole size={23} />}
          <span><b>{value === 'public' ? '公开棋室' : '私密棋室'}</b>
            <small>{value === 'public' ? '展示在大厅，等待新对手' : '凭完整房间号加入'}</small></span>
          {visibility === value && <Check size={16} />}</button>)}</div>
        <dl><div><dt>席位</dt><dd>固定 2 人</dd></div><div><dt>规则</dt><dd>经典黑白棋</dd></div></dl>
        <span><ShieldCheck size={16} />身份、回合、移动与结算均由服务端验证。</span>
        {action.error && <Feedback error>{action.error}</Feedback>}</div>
    </Dialog>}

    {panel === 'join' && <Dialog title="对面已经留好了位置？" eyebrow="ENTER THE QUIET ROOM" onClose={close}
      footer={<ActionButton variant="primary" pending={action.pending} disabled={!code.trim()}
        onClick={() => foundRoom ? enter(foundRoom) : void find()}>
        {foundRoom ? roomEntry(foundRoom, identity).label : '查找棋室'}<ArrowRight size={16} /></ActionButton>}>
      <form className={styles.join} onSubmit={event => { event.preventDefault(); foundRoom ? enter(foundRoom) : void find(); }}>
        <KeyRound size={28} /><p>输入完整房间号，找到朋友的棋室。</p>
        <label>房间号<input aria-label="房间号" value={code}
          onChange={event => { setCode(event.target.value); setFoundRoom(undefined); action.reset(); }}
          placeholder="输入完整房间号" autoCapitalize="off" autoCorrect="off" spellCheck={false} /></label></form>
      {action.error && <Feedback error>{action.error}</Feedback>}
      {foundRoom && <RoomCard room={foundRoom} userID={userID} onEnter={enter} />}
    </Dialog>}
    {panel === 'share' && <Dialog title="分享 Othello" eyebrow="INVITE SOMEONE TO THE BOARD" onClose={close}
      footer={<><ActionButton onClick={close}>关闭</ActionButton>
        <ActionButton variant="primary" onClick={() => void shareClipboard.copy(OTHELLO_PUBLIC_URL)}>
          {shareClipboard.copiedValue === OTHELLO_PUBLIC_URL ? <Check size={16} /> : <Copy size={16} />}
          {shareClipboard.copiedValue === OTHELLO_PUBLIC_URL ? '链接已复制' : '复制游戏链接'}
        </ActionButton></>}>
      <GameShareContent url={OTHELLO_PUBLIC_URL} color="#60454b" background="#fffaf3"
        classes={{ root: styles.shareContent, qr: styles.shareQr, address: styles.shareAddress, hint: styles.shareHint }} />
    </Dialog>}
  </AppShell>;
}
