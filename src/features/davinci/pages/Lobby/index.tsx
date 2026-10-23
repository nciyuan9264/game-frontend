import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCode } from 'antd';
import {
  ArrowRight, Check, Copy, Eye, Hash, KeyRound, ListOrdered, Plus, RefreshCw, Search, Share2, ShieldCheck, UserRound,
} from 'lucide-react';
import { getProfile } from '@/features/game-core/api/auth';
import { getMyStats } from '@/features/game-core/api/history';
import { profile2BackendName } from '@/util/user';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useLatestAsyncAction } from '@/features/game-core/hooks/useLatestAsyncAction';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameTabs } from '@/components/GameUI/GameTabs';
import { Feedback } from '@/components/GameUI/Panel';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { createDavinciRoom } from '../../api/room';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { DavinciLoading } from '../../components/LoadingState';
import { useDavinciLobby } from '../../hooks/useDavinciLobby';
import { DAVINCI_PUBLIC_URL, roomEntry, roomOwnerName } from '../../model/adapters';
import type { DavinciRoom, LobbyFilter } from '../../model/types';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

const HERO_IMAGE = 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=cinematic%20overhead%20photograph%20of%20a%20premium%20black%20and%20ivory%20Da%20Vinci%20Code%20deduction%20card%20game%20on%20a%20dark%20walnut%20table%2C%20ordered%20number%20tiles%2C%20subtle%20brass%20details%2C%20soft%20directional%20studio%20light%2C%20realistic%20materials%2C%20clear%20game%20pieces%2C%20no%20text%2C%20no%20people%2C%20professional%20editorial%20product%20photography&image_size=landscape_16_9';
const loadStats = () => getMyStats('davinci');
const cipherFacts = [
  ['0-11', '数字升序', Hash],
  ['黑先', '同号黑牌在前', ListOrdered],
  ['JOKER', '万能未知牌', KeyRound],
  ['观察', '颜色与空位', Eye],
] as const;
const roomFilters: Array<{ value: LobbyFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'joinable', label: '可加入' },
  { value: 'playing', label: '对局中' },
];

function RoomCard({ room, userID, playerID, onEnter }: {
  room: DavinciRoom;
  userID: string;
  playerID: string;
  onEnter: (room: DavinciRoom) => void;
}) {
  const entry = roomEntry(room, { userID, playerID });
  const owner = room.roomPlayer.find(player => player.playerID === room.ownerID);
  const progress = Math.max(0, Math.min(100, ((26 - (room.boardCardCount ?? 26)) / 26) * 100));
  return <article className={styles.roomCard}>
    <header><span><i className={room.status === 'match' ? styles.waiting : styles.playing} />{room.status === 'match' ? '等待加入' : '对局中'}</span><b>{room.roomID}</b></header>
    <div className={styles.owner}><PlayerAvatar name={roomOwnerName(room)} avatar={room.ownerAvatar || owner?.avatar} size={38} />
      <div><small>房主</small><strong>{roomOwnerName(room)}</strong></div></div>
    <div className={styles.seats} aria-label={`${room.roomPlayer.length} / ${room.maxPlayers} 个席位`}>
      {Array.from({ length: room.maxPlayers }, (_, index) => {
        const player = room.roomPlayer.find(item => item.seatIndex === index) ?? room.roomPlayer[index];
        return <span key={index} className={player ? styles.occupied : ''}>
          {player ? <PlayerAvatar name={player.name || player.playerID} avatar={player.avatar} ai={player.ai} size={28} /> : <UserRound size={15} />}
          <small>{player ? player.ai ? 'AI' : player.name || player.playerID.replace(/-\d+$/, '') : '空位'}</small>
        </span>;
      })}
    </div>
    <div className={styles.progress}><span><small>牌堆进度</small><b>{room.status === 'match' ? '尚未开局' : `已抽取 ${26 - (room.boardCardCount ?? 26)} 张`}</b></span>
      <i><em style={{ width: `${progress}%` }} /></i></div>
    <ActionButton variant={entry.allowed ? 'primary' : 'secondary'} disabled={!entry.allowed} onClick={() => onEnter(room)}>
      {entry.label}{entry.allowed && <ArrowRight size={15} />}
    </ActionButton>
  </article>;
}

export default function Lobby() {
  const navigate = useNavigate();
  const lobby = useDavinciLobby();
  const profile = useAsyncResource(getProfile);
  const stats = useAsyncResource(loadStats);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');
  const [heroReady, setHeroReady] = useState(false);
  const createAction = useLatestAsyncAction();
  const { pending, error: createError } = createAction;
  const userID = profile.data?.id ?? '';
  const playerID = profile2BackendName(profile.data);
  const identity = { userID, playerID };

  const enter = (room: DavinciRoom) => {
    if (roomEntry(room, identity).allowed) {
      navigate(`/game/davinci/match?roomID=${encodeURIComponent(room.roomID)}`);
    }
  };
  const create = async () => {
    try {
      const room = await createAction.run(createDavinciRoom);
      navigate(`/game/davinci/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch { /* Error state is owned by the shared action hook. */ }
  };
  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(DAVINCI_PUBLIC_URL);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const joinByCode = () => {
    const roomID = code.trim();
    if (!roomID) return;
    navigate(`/game/davinci/match?roomID=${encodeURIComponent(roomID)}`);
  };
  const initialLoading = !lobby.hasLoaded && !lobby.error || profile.loading && !profile.data;

  return <AppShell title="游戏大厅" profile={profile.data}>
    {initialLoading ? <DavinciLoading description="正在同步密码桌与在线玩家" /> : <div className={styles.page}>
      <section className={styles.hero}>
        <img className={heroReady ? styles.heroImageReady : ''} src={HERO_IMAGE} alt="黑白密码牌桌面"
          onLoad={event => {
            const image = event.currentTarget;
            setHeroReady(image.naturalWidth > image.naturalHeight * 1.25);
          }} />
        {!heroReady && <div className={styles.heroTiles} aria-hidden="true">
          {[['1', false], ['3', true], ['5', false], ['—', true], ['8', false], ['10', true]].map(([value, white], index) =>
            <span key={`${value}-${index}`} className={white ? styles.heroWhiteTile : styles.heroBlackTile}>{value}</span>)}
        </div>}
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}><small>THE CIPHER TABLE</small><h1>达芬奇密码</h1>
          <p>隐藏你的序列，观察每一次试探，在对手破解之前揭开他的密码。</p>
          <div><ActionButton variant="primary" pending={pending} disabled={!profile.data} onClick={() => void create()}>
            <Plus size={17} />创建房间<ArrowRight size={16} /></ActionButton>
            <ActionButton onClick={() => { setCopied(false); setShareOpen(true); }}><Share2 size={16} />分享游戏</ActionButton></div>
        </div>
        <span className={styles.heroCaption}>OBSERVE · DEDUCE · REVEAL</span>
      </section>
      <div className={styles.cipherStrip} aria-label="达芬奇密码规则要点">
        <span>四个线索<small>THE CIPHER BASICS</small></span>
        <div>{cipherFacts.map(([value, label, Icon]) => <button type="button" key={value} aria-label={label}>
          <Icon size={24} /><b>{value}</b><small>{label}</small>
        </button>)}</div>
      </div>
      {createError && <Feedback error>{createError}</Feedback>}
      <div className={styles.layout}><section className={styles.rooms}>
        <header className={styles.sectionHeading}><div><small>OPEN TABLES</small><h2>选择一张密码桌</h2></div>
          <ActionButton variant="quiet" onClick={lobby.refresh} disabled={lobby.refreshing}><RefreshCw size={15} />刷新</ActionButton></header>
        <div className={styles.controls}>
          <GameTabs items={roomFilters} value={lobby.filter} onChange={lobby.setFilter}
            ariaLabel="房间筛选" className={styles.tabs} activeClassName={styles.active} />
          <label><Search size={15} /><input aria-label="搜索房间" placeholder="搜索房间号或房主" value={lobby.query}
            onChange={event => lobby.setQuery(event.target.value)} /></label>
        </div>
        {lobby.error && <Feedback error>{lobby.error}<ActionButton onClick={lobby.refresh}>重试</ActionButton></Feedback>}
        <div className={styles.roomGrid}>{lobby.filteredRooms.map(room =>
          <RoomCard key={room.roomID} room={room} userID={userID} playerID={playerID} onEnter={enter} />)}</div>
        {!lobby.error && !lobby.filteredRooms.length && <div className={styles.empty}><KeyRound size={25} /><h3>当前没有匹配的密码桌</h3><p>创建一个房间，或清空筛选条件查看全部。</p></div>}
      </section>
      <aside className={styles.side}>
        <section className={styles.identity}><PlayerAvatar name={profile.data?.name ?? '玩家'} avatar={profile.data?.avatar} size={54} />
          <div><small>当前身份</small><h3>{profile.data?.name || '玩家资料暂不可用'}</h3><span>已验证登录</span></div></section>
        <section className={styles.stats}><header><span>我的战绩</span><ShieldCheck size={16} /></header>
          <div><span><b>{stats.data?.totalGames ?? '—'}</b><small>对局</small></span><span><b>{stats.data ? `${Math.round(stats.data.winRate * 100)}%` : '—'}</b><small>胜率</small></span></div></section>
        <section className={styles.tip}><small>推理提示</small><h3>颜色与顺序同样重要。</h3><p>数字从小到大排列；相同数字中，黑牌排在白牌之前。</p></section>
      </aside></div>
      <section className={styles.mobileJoin}><h3><KeyRound size={18} />朋友已经开好房间？</h3><p>输入完整房间号，找到朋友的桌。</p>
        <form onSubmit={event => { event.preventDefault(); joinByCode(); }}>
          <input aria-label="查找房间号" placeholder="例如 1019_153709" value={code}
            onChange={event => setCode(event.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          <button disabled={!code.trim()} aria-label="查找房间" type="submit"><ArrowRight size={19} /></button>
        </form>
      </section>
    </div>}
    {shareOpen && <ResponsiveDialog title="邀请朋友破解密码" eyebrow="SHARE THE CIPHER TABLE"
      themeClassName={rootStyles.root} onClose={() => setShareOpen(false)}
      footer={<><ActionButton onClick={() => setShareOpen(false)}>关闭</ActionButton>
        <ActionButton variant="primary" onClick={() => void copyShare()}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? '链接已复制' : '复制游戏链接'}</ActionButton></>}>
      <div className={styles.share}><QRCode type="svg" value={DAVINCI_PUBLIC_URL} size={176} bordered={false} color="#20231f" bgColor="#eee8d8" />
        <p>扫码进入达芬奇密码大厅，创建房间后再分享房间邀请链接。</p><strong>{DAVINCI_PUBLIC_URL}</strong></div>
    </ResponsiveDialog>}
  </AppShell>;
}
