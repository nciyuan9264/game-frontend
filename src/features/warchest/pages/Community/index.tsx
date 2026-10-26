import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Backpack,
  BookOpen,
  Check,
  ChevronRight,
  Flag,
  Heart,
  History,
  Info,
  Layers,
  LogOut,
  Mail,
  Pencil,
  Search,
  ShieldCheck,
  Swords,
  Trophy,
} from 'lucide-react';
import { ProjectContact } from '@/components/GameUI/ProjectContact';
import { getProfile } from '@/features/game-core/api/auth';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useGuideSteps } from '@/features/game-core/hooks/useGuideSteps';
import type {
  LeaderboardSortDim,
  WarChestLeaderboardEntry,
} from '@/features/game-core/model/history';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { Shell, Loading, Notice } from '../../components/Shell';
import {
  UNIT_IDS,
  UNITS,
  type UnitId,
} from '../../model';
import {
  Coin,
  Crest,
  Eyebrow,
  Modal,
  SourceLink,
  TroopArt,
} from '../../visuals';

const guideSteps = [
  { name: '抽取指令', en: 'DRAW YOUR COMMAND', title: '三枚指令，无数种可能。', copy: '每轮由服务端自动从自己的军袋抽取至多 3 枚币，手牌只对自己可见。持有先手标记的一方先行动，随后双方交替使用一枚币。', extra: '军袋空时，才会将弃置区混洗回袋；补给区的币必须先通过招募进入弃置区。', note: '客户端不会自行抽币或计算结果，所有手牌都来自权威快照。' },
  { name: '部署与增援', en: 'BUILD YOUR FRONT LINE', title: '先站稳，才能走得更远。', copy: '把手中的兵种币放到己方控制的空据点就是部署；把同种币叠到已部署单位上就是增援。步兵是唯一可以同时部署两支的兵种。', extra: '整叠单位一起移动；通常每次被攻击只移除一枚币。', note: '侦察兵还可以部署在友军相邻的任意空格。' },
  { name: '调遣与调度', en: 'MAKE EVERY COIN COUNT', title: '同一枚币，不止一种用法。', copy: '正面弃置兵种币，可以让同兵种单位移动、攻击、控制或使用战术。背面弃置任意币，可以招募、争夺先手或跳过。', extra: '兵种能力优先于普通规则；复杂追加行动会继续由服务端给出合法选项。', note: '每次只提交当前快照中的 actionID，路径、伤害和后续阶段不可由客户端伪造。' },
  { name: '控制与获胜', en: 'CLAIM THE FIELD', title: '抵达不算，控制才算。', copy: '单位站在据点上后，还要再使用一枚同兵种币执行控制。先放完自己的 6 枚控制标记，立即赢得对局。', extra: '占领敌方据点会先归还对方标记，再放置自己的标记。', note: '胜负与最终控制数由服务端结算并写入战绩和全知回放。' },
] as const;

const category = (type: UnitId) => {
  if (['archer', 'crossbow'].includes(type)) return 'ranged';
  if (['light', 'cavalry', 'lancer'].includes(type)) return 'mounted';
  if (['ensign', 'marshall', 'priest'].includes(type)) return 'support';
  return 'foot';
};

export function Army() {
  const profile = useAsyncResource(getProfile);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [favourites, setFavourites] = useState<UnitId[]>([]);
  const [detail, setDetail] = useState<UnitId>();
  const units = UNIT_IDS.filter(type => {
    const matches = `${UNITS[type].name}${UNITS[type].en}`.toLowerCase()
      .includes(query.trim().toLowerCase());
    return matches && (filter === 'all'
      || filter === 'fav' && favourites.includes(type)
      || category(type) === filter);
  });
  return <Shell title="兵种图鉴" profile={profile.data}><main className="page army-page">
    <div className="page-title"><div><Eyebrow>KNOW YOUR LEGION</Eyebrow>
      <h1>各有所长，合而为军。</h1><p>完整基础版 16 兵种；每局双方各获得 4 种，王室币另计。</p></div>
      <span className="collection-count">16 <small>/ 基础版兵种</small></span></div>
    <div className="library-toolbar"><div className="tabs">{[
      ['all', '全部兵种'], ['foot', '步兵'], ['ranged', '远程'],
      ['mounted', '骑兵'], ['support', '支援'], ['fav', '已收藏'],
    ].map(([id, name]) => <button type="button" key={id}
      className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>
      {name}{id === 'fav' && <span>{favourites.length}</span>}</button>)}</div>
      <label className="search-field"><Search size={16} /><input aria-label="搜索兵种"
        placeholder="搜索名称" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    <div className="unit-library">{units.map(type => <article className="library-card" key={type}>
      <button className={`favourite-button ${favourites.includes(type) ? 'saved' : ''}`}
        type="button" aria-label={`${favourites.includes(type) ? '取消收藏' : '收藏'}${UNITS[type].name}`}
        onClick={() => setFavourites(current => current.includes(type)
          ? current.filter(value => value !== type) : [...current, type])}>
        <Heart size={16} fill={favourites.includes(type) ? 'currentColor' : 'none'} /></button>
      <button className="library-detail" type="button" onClick={() => setDetail(type)}>
        <div className="library-art"><TroopArt type={type} />
          <span className="library-art-number">{String(UNITS[type].art + 1).padStart(2, '0')}</span>
          {UNITS[type].art >= 8 && <span className="complete-unit-tag">完整基础版</span>}</div>
        <div className="library-card-copy"><div><Eyebrow>{UNITS[type].en}</Eyebrow>
          <h3>{UNITS[type].name}</h3></div><Coin type={type} size={42} />
          <p>{UNITS[type].role}<span>{UNITS[type].total} 枚币</span></p>
          <div className="library-ability"><b>{UNITS[type].kind.split(' · ')[1]}</b>
            <ArrowUpRight size={15} /></div></div></button></article>)}</div>
    {!units.length && <div className="empty-state"><Swords size={34} />
      <h3>{filter === 'fav' ? '还没有收藏兵种' : '没有找到这个兵种'}</h3>
      <p>调整筛选，继续浏览完整基础兵种。</p></div>}
    <p className="demo-note"><Info size={14} />不包含扩展兵种；皇家卫队采用发行方认可的修订卡面。</p>
    {detail && <UnitDialog type={detail} onClose={() => setDetail(undefined)} />}
  </main></Shell>;
}

function UnitDialog({ type, onClose }: { type: UnitId; onClose: () => void }) {
  return <Modal title={UNITS[type].name} eyebrow={UNITS[type].en} onClose={onClose}
    className="unit-detail-modal" footer={<button className="button primary full"
      type="button" onClick={onClose}>知道了 <Check size={17} /></button>}>
    <div className="unit-detail-art"><TroopArt type={type} /><Coin type={type} size={64} /></div>
    <h3>{UNITS[type].kind}</h3><p>{UNITS[type].ability}</p>
    {UNITS[type].restriction && <div className="warning-note">{UNITS[type].restriction}</div>}
    <p className="muted">{UNITS[type].tip}</p>
    <div className="info-note"><Layers size={17} />全套 {UNITS[type].total} 枚 · 开局 2 枚入袋</div>
  </Modal>;
}

export function Guide() {
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const guide = useGuideSteps(guideSteps);
  const current = guide.current;
  return <Shell title="玩法指南" profile={profile.data}><main className="page guide-page">
    <div className="page-title"><div><Eyebrow>YOUR FIRST CAMPAIGN</Eyebrow>
      <h1>懂得规则，才懂得破局。</h1><p>四步开始第一场交锋；战场只展示服务端确认的合法行动。</p></div>
      <BookOpen size={41} strokeWidth={1} /></div>
    <div className="guide-chapters">{guideSteps.map((step, index) =>
      <button type="button" key={step.name} className={guide.index === index ? 'active' : ''}
        onClick={() => guide.select(index)}><span>0{index + 1}</span>{step.name}<Check size={15} /></button>)}</div>
    <div className="guide-layout"><section className={`guide-visual step-${guide.index}`}>
      <span className="guide-visual-title">WAR CHEST / FIELD MANUAL</span><div className="guide-orbits" />
      {guide.index === 0 ? <><div className="guide-bag"><Backpack size={74} strokeWidth={1} />
        <span>YOUR COMMAND</span></div><div className="guide-coin-row">{(['sword', 'light', 'royal'] as UnitId[])
          .map(type => <Coin type={type} size={77} key={type} />)}</div><p>藏于袋中，成于心中。</p></>
        : guide.index === 1 ? <><div className="guide-deploy"><div><Coin type="sword" size={82} />
          <span>部署 · 一枚</span></div><ArrowRight size={25} /><div><Coin type="sword" size={82} count={2} />
            <span>增援 · 叠加</span></div></div><p>一枚是军队，再一枚是底气。</p></>
          : guide.index === 2 ? <><div className="guide-action-types"><div><Flag size={26} /><b>放置</b><small>部署 / 增援</small></div>
            <div><Swords size={26} /><b>调遣</b><small>正面弃置</small></div>
            <div><Layers size={26} /><b>调度</b><small>背面弃置</small></div></div>
            <div className="guide-coin-row"><Coin type="light" size={91} /></div><p>调遣战场，也经营未来。</p></>
            : <><div className="guide-win"><Crest size={108} /><strong>6</strong>
              <span>LOCATIONS TO VICTORY</span></div><div className="guide-flags">
                {Array.from({ length: 6 }, (_, index) => <Flag key={index} size={24} />)}</div>
              <p>让最后一面旗帜，为你升起。</p></>}
      <div className="guide-bottom"><span>THE ART OF COMMAND</span><b>0{guide.index + 1} — 04</b></div>
    </section><section className="guide-copy"><Eyebrow>{current.en}</Eyebrow><h2>{current.title}</h2>
      <p>{current.copy}</p><p>{current.extra}</p><div className="guide-callout"><Info size={21} /><p>{current.note}</p></div>
      <div className="guide-actions"><button className="text-button" type="button" disabled={guide.isFirst}
        onClick={guide.previous}><ArrowLeft size={16} />上一步</button><span>{guide.index + 1} / 4</span>
        <button className="button primary" type="button"
          onClick={() => guide.isLast ? navigate('/game/warchest') : guide.next()}>
          {guide.isLast ? '返回大厅' : '下一步'}<ArrowRight size={17} /></button></div>
    </section></div>
    <div className="guide-source"><ShieldCheck size={16} />
      <span>依据 AEG 基础版规则与兵种卡；完整 16 兵种，双人在线对局。</span><SourceLink /></div>
  </main></Shell>;
}

export function Rankings() {
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'winRate' | 'games'>('winRate');
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const leaderboard = useGameLeaderboard<WarChestLeaderboardEntry>({
    gameType: 'warchest', pageSize: 50, sort,
  });
  return <Shell title="指挥官排行" profile={profile.data}><main className="page records-page ranking-page">
    <div className="page-title"><div><Eyebrow>THE FIELD COMMANDERS</Eyebrow>
      <h1>每一次调遣，都留下判断。</h1><p>按胜率或完成场次，看见稳定的指挥官。</p></div><Trophy size={41} /></div>
    <section className="record-list-panel"><div className="section-heading"><h2>指挥官排行</h2>
      <div className="tabs" role="tablist" aria-label="排行榜模式">
        <button role="tab" type="button" aria-selected={mode === 'winRate'} className={mode === 'winRate' ? 'active' : ''}
          onClick={() => setMode('winRate')}>胜率榜</button>
        <button role="tab" type="button" aria-selected={mode === 'games'} className={mode === 'games' ? 'active' : ''}
          onClick={() => setMode('games')}>场次榜</button></div></div>
      {leaderboard.loading && !leaderboard.entries.length && <Loading text="正在整理指挥官名册。" />}
      {leaderboard.error && <Notice error>{leaderboard.error}
        <button type="button" className="text-button" onClick={leaderboard.retry}>重试</button></Notice>}
      <div className="rank-row head"><span>名次</span><span>指挥官</span><span>完成对局</span><span>胜场</span><span>胜率</span></div>
      {leaderboard.entries.map((entry, index) => <div className="rank-row" key={entry.userID}>
        <b>{String(index + 1).padStart(2, '0')}</b><span><Crest size={34} /><strong>{entry.displayName}</strong></span>
        <span>{entry.totalGames}</span><span>{entry.wins}</span><strong>{Math.round(entry.winRate * 100)}%</strong></div>)}
      {!leaderboard.loading && !leaderboard.entries.length && <div className="empty-state">
        <Trophy size={34} /><h3>名册还没有写下名字</h3><p>完成第一场对局后，排名会出现在这里。</p></div>}
    </section>
  </main></Shell>;
}

function ProfileStat({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function My() {
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('warchest');
  const history = useGameHistory({ gameType: 'warchest', pageSize: 20 });
  const logout = useGameLogout();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const loading = profile.loading && !profile.data
    || stats.loading && !stats.data
    || history.loading && !history.games.length;
  return <Shell title="我的战绩" profile={profile.data} compactMobileFooter><main className="page records-page profile-page">
    <div className="page-title"><div><Eyebrow>YOUR CAMPAIGN JOURNAL</Eyebrow>
      <h1>每一步，都留下回响。</h1><p>真实战绩、终局控制数与全知逐步回放。</p></div></div>
    {loading ? <Loading text="正在整理你的战场纪事。" /> : <div className="records-layout">
      <aside className="profile-card"><Eyebrow>THE COMMANDER</Eyebrow><Crest size={112} />
        <h2>{profile.data?.name || '指挥官'}</h2>
        <p className="profile-id">PLAYER ID · {profile.data?.id ?? '—'}</p>
        <div className="profile-email"><Mail size={14} />{profile.data?.email || '邮箱未绑定'}</div>
        <span className="profile-badge"><Flag size={14} />静默行军</span>
        <div className="profile-numbers"><ProfileStat><b>{stats.data?.totalGames ?? 0}</b><span>完成对局</span></ProfileStat>
          <ProfileStat><b>{stats.data?.wins ?? 0}</b><span>胜局</span></ProfileStat>
          <ProfileStat><b>{Math.round((stats.data?.winRate ?? 0) * 100)}%</b><span>胜率</span></ProfileStat></div>
        <div className="profile-actions"><a href="https://auth.gamebus.online/profile">
          <Pencil size={14} />编辑资料</a>
          <button type="button" onClick={() => setLogoutOpen(true)}>
            <LogOut size={15} />退出登录</button></div>
      </aside><section className="record-list-panel"><div className="section-heading"><h2>战场纪事</h2>
        <Link className="text-button" to="/game/warchest/rankings">查看排行 <ArrowRight size={14} /></Link></div>
        <div className="history-list">{history.games.map(game => {
          const me = game.players?.find(player => String(player.userID) === String(profile.data?.id));
          return <Link key={game.id} to={game.endedAt ? `/game/warchest/replay/${game.id}` : '#'} className="history-row">
            <Crest side={me?.isWinner ? 0 : 1} size={49} /><div><h3>{game.roomDisplayName || `房间 ${game.roomID}`}</h3>
              <p>{new Date(game.startedAt).toLocaleString('zh-CN')} · {Math.max(0, Math.round(game.durationSeconds / 60))} 分钟</p></div>
            <span className={`result-tag ${me?.isWinner ? 'won' : ''}`}>{me?.isWinner ? '胜利' : '失利'}</span>
            <strong>{me?.finalScore ?? '—'}<small> / 6</small></strong><ArrowRight size={17} /></Link>;
        })}</div>
        {history.error && <Notice error>{history.error}<button className="text-button" type="button"
          onClick={history.retry}>重试</button></Notice>}
        {!history.loading && !history.games.length && <div className="record-empty"><History size={56} strokeWidth={1} />
          <h2>下一页，等待你来书写。</h2><p>完成一场在线对局后，战绩会显示在这里。</p>
          <Link className="button primary" to="/game/warchest">开始第一场交锋 <ArrowRight size={16} /></Link></div>}
        {history.hasMore && <button className="button secondary full" type="button" disabled={history.loading}
          onClick={history.loadMore}>加载更多</button>}
        <div className="journal-quote"><span>“</span><p>最好的进攻，<br />是让对手追不上你的下一步。</p>
          <Link className="text-button" to="/game/warchest/army">认识兵种 <ArrowUpRight size={16} /></Link></div>
      </section></div>}
    <button className="profile-about" data-testid="warchest-about-entry" type="button"
      onClick={() => setAboutOpen(true)}><span><Info size={17} /></span>
      <span><b>关于与联系</b><small>项目作者、源码与联系方式</small></span>
      <ChevronRight size={17} /></button>
    {aboutOpen && <Modal title="关于 War Chest Online" eyebrow="ABOUT & CONTACT"
      onClose={() => setAboutOpen(false)}
      footer={<button className="button secondary full" type="button"
        onClick={() => setAboutOpen(false)}>知道了</button>}>
      <ProjectContact gameName="War Chest" avatar={<Crest size={58} />}
        classes={{ intro: 'project-contact-intro', links: 'project-contact-links', legal: 'project-contact-legal' }} />
    </Modal>}
    {logoutOpen && <Modal title="离开当前账号？" eyebrow="SIGN OUT" onClose={() => setLogoutOpen(false)}
      footer={<><button className="button secondary" type="button" onClick={() => setLogoutOpen(false)}>取消</button>
        <button className="button primary" type="button" disabled={logout.pending} onClick={() => void logout.run()}>退出登录</button></>}>
      <p>退出不会删除战绩与回放，下次登录后仍可查看。</p>
      {logout.error && <Notice error>{logout.error}</Notice>}
    </Modal>}
  </main></Shell>;
}
