import { ArrowRight, BookOpen, Building2, KeyRound, Plus, RefreshCw, Search, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '@/hooks/request/useProfile';
import type { Stats } from '@/types/history';
import { ActionButton } from '../../components/ActionButton';
import { CompanyGlyph } from '../../components/CompanyGlyph';
import { PlayerAvatar } from '../../components/AppShell';
import { Eyebrow, Feedback, Panel } from '../../components/Panel';
import { RoomCard } from '../../components/RoomCard';
import { useAcquireLobby } from '../../hooks/useAcquireLobby';
import type { AcquireRoom, Company, LobbyFilter } from '../../model/types';
import { companyKeys, companyColors } from '../../model/types';
import cityArt from '../../assets/city-art.webp';
import styles from './index.module.less';

export interface LobbyViewProps {
  lobby: ReturnType<typeof useAcquireLobby>;
  profile?: UserProfile;
  stats?: Stats;
  statsError: string;
  playerID: string;
  code: string;
  setCode: (value: string) => void;
  onCreate: () => void;
  onShare: () => void;
  onCompany: (company: Company) => void;
  onJoin: () => void;
  onEnter: (room: AcquireRoom) => void;
}
export function LobbyHero({ onCreate, onShare, onCompany }: Pick<LobbyViewProps, 'onCreate' | 'onShare' | 'onCompany'>) {
  return <><section className={styles.hero}>
    <img src={cityArt} alt="暖光中的城市酒店模型" />
    <div className={styles.heroCopy}><Eyebrow>YOUR NEXT CITY STARTS HERE</Eyebrow>
      <h1>落下一块地，<br />下一座城属于你。</h1>
      <p>开一张桌，邀请朋友。从第一块地开始，经营你们的城市。</p>
      <div className={styles.heroActions}>
        <ActionButton className={styles.heroCreateButton} variant="primary" onClick={onCreate}><Plus size={17} />创建房间<ArrowRight size={16} /></ActionButton>
        <ActionButton className={styles.heroShareButton} onClick={onShare}><Share2 size={16} />分享游戏</ActionButton>
      </div>
    </div><span className={styles.caption}>BUILD. MERGE. ACQUIRE.</span>
  </section><div className={styles.companies} aria-label="七家公司">
    <span>七家公司<small>THE HOTEL COLLECTION</small></span>
    <div>{companyKeys.map(company => <button type="button" key={company} style={{ color: companyColors[company] }} aria-label={`查看 ${company} 股价`} onClick={() => onCompany(company)}><CompanyGlyph company={company} size={25} /><b>{company.toUpperCase()}</b></button>)}</div>
  </div></>;
}
export function RoomBrowser({ lobby, playerID, onEnter }: Pick<LobbyViewProps, 'lobby' | 'playerID' | 'onEnter'>) {
  const filters: [LobbyFilter, string][] = [['all', '全部房间'], ['joinable', '可加入'], ['playing', '对局中']];
  return <section className={styles.browser} aria-label="可见房间">
    <div className={styles.heading}><div><Eyebrow>FIND YOUR TABLE</Eyebrow><h2>找到房间，一起开场。</h2></div><span>可见房间</span></div>
    <div className={styles.filters}>
      <div className={styles.tabs} aria-label="房间状态">{filters.map(([key, label]) =>
        <button type="button" key={key} data-click-sound="tab" aria-pressed={lobby.filter === key} className={lobby.filter === key ? styles.selected : ''}
          onClick={() => lobby.setFilter(key)}>{label}</button>)}</div>
      <label className={styles.search}><Search size={16} /><input aria-label="搜索房间号或房主" placeholder="搜索房间号 / 房主" value={lobby.query} onChange={event => lobby.setQuery(event.target.value)} /></label>
    </div>
    {lobby.error && !lobby.hasLoaded ? <div className={styles.empty}><RefreshCw size={36} />
      <h3>{lobby.errorCode === 'unauthorized' ? '需要登录后进入大厅' : '暂时没能连接到大厅'}</h3>
      <p>{lobby.error}</p><ActionButton variant="primary" onClick={lobby.refresh} pending={lobby.refreshing}><RefreshCw size={15} />重新加载</ActionButton></div>
      : <>{lobby.error && <div className={styles.error}><Feedback error>{lobby.error}</Feedback><ActionButton onClick={lobby.refresh} pending={lobby.refreshing}><RefreshCw size={15} />重试</ActionButton></div>}
    {!lobby.rooms.length ? <div className={styles.empty}><Building2 size={34} /><h3>这座城市，等你开第一桌。</h3><p>点击上方「创建房间」，邀请朋友或添加人机开始。</p></div>
        : !lobby.filteredRooms.length ? <div className={styles.empty}><Search size={32} /><h3>还没找到这张桌</h3><p>私密房间请通过完整房间号查找。</p><ActionButton onClick={() => { lobby.setQuery(''); lobby.setFilter('all'); }}>清除筛选</ActionButton></div>
          : <div className={styles.cards}>{lobby.filteredRooms.map(room => <RoomCard key={room.roomID} room={room} playerID={playerID} onEnter={onEnter} />)}</div>}</>}
  </section>;
}
export function JoinCard({ code, setCode, onJoin }: Pick<LobbyViewProps, 'code' | 'setCode' | 'onJoin'>) {
  return <Panel className={styles.join}><h3><KeyRound size={18} />朋友已经开好房间？</h3><p>输入完整房间号，找到朋友的桌。</p>
    <form onSubmit={event => { event.preventDefault(); onJoin(); }}>
      <input aria-label="查找房间号" placeholder="例如 0302_075034" value={code} onChange={event => setCode(event.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      <button disabled={!code.trim()} aria-label="查找房间" type="submit"><ArrowRight size={19} /></button>
    </form>
  </Panel>;
}
export function PlayerSummary({ profile, stats, statsError }: Pick<LobbyViewProps, 'profile' | 'stats' | 'statsError'>) {
  return <Panel className={styles.summary}><Eyebrow>YOUR PLAYER CARD</Eyebrow>
    <div className={styles.person}><PlayerAvatar name={profile?.name ?? ''} avatar={profile?.avatar} size={56} /><div><strong>{profile?.name || '玩家资料暂不可用'}</strong><small>每一局都是新的城市</small></div></div>
    <div className={styles.stats}><span><b>{stats?.totalGames ?? '—'}</b><small>完成对局</small></span><span><b>{stats?.wins ?? '—'}</b><small>获胜场次</small></span><span><b>{stats ? `${(stats.winRate * 100).toFixed(0)}%` : '—'}</b><small>胜率</small></span></div>
    {statsError && <p className={styles.statsError}>战绩暂时不可用</p>}
    <Link to="/game/acquire/me">查看我的战绩<ArrowRight size={15} /></Link>
  </Panel>;
}
export function GuideCard() {
  return <Panel className={styles.guide}><BookOpen size={28} /><Eyebrow>THE FIRST MOVE</Eyebrow><h3>先懂一招，再赢一局。</h3><p>建造、投资与并购，把一座城的可能性握在手中。</p><Link to="/game/acquire/guide">查看玩法<ArrowRight size={15} /></Link></Panel>;
}
