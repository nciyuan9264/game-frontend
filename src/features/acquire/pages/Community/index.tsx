import { useCallback, useRef, useState, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, ChevronRight, Clock, Info, LogOut, Mail, Pencil, ShieldCheck, Trophy, Users } from 'lucide-react';
import { GameTabs } from '@/components/GameUI/GameTabs';
import { ProjectContact } from '@/components/GameUI/ProjectContact';
import { getProfile } from '@/features/game-core/api/auth';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useGuideSteps } from '@/features/game-core/hooks/useGuideSteps';
import { useInfiniteLoad } from '@/features/game-core/hooks/useInfiniteLoad';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { AcquireLoading } from '../../components/LoadingState';
import { ResponsiveDialog } from '../../components/ResponsiveDialog';
import { StockPrices } from '../../dialogs/StockPrices';
import { useAcquireResource } from '../../hooks/useAcquireResource';
import { money } from '../../model/session';
import tableArt from '../../assets/table-art.webp';
import styles from './index.module.less';
import type { LeaderboardSortDim } from '@/features/game-core/model/history';

const RANKING_PAGE_SIZE = 8;
const HISTORY_PAGE_SIZE = 20;
const guideSteps = [
  {
    tab: '开始',
    title: '先建一张桌，再造一座城。',
    text: '2–6 位合伙人各自获得 $6,000 起始资金和 6 块地。每个回合依次完成落地、公司处理与买股。',
    points: [
      '从手牌选择一块地，先预览它在棋盘上的位置。',
      '确认落地后，根据相邻地块建立、扩张或合并公司。',
      '每回合最多购买 3 股，也可以选择不买。',
    ],
  },
  {
    tab: '建造',
    title: '让一块地，成为一家公司的起点。',
    text: '相邻的独立地块可以成立公司。创始人在库存允许时获得 1 股奖励；公司规模增长，股价随之变化。',
    points: [
      '七家公司使用固定颜色和标识，不只依赖颜色识别。',
      '尚未成立的公司不能直接买股。',
      '公司达到 11 块地后进入安全状态，不能被吞并。',
    ],
  },
  {
    tab: '并购',
    title: '合并，不只是把颜色连起来。',
    text: '规模更大的公司继续存在；规模相同时由当前玩家选择。被并公司的股东先结算奖励，再处理手中股票。',
    points: [
      '卖出：按合并时锁定的股价换取现金。',
      '兑换：每 2 股旧公司股票换 1 股存续公司股票。',
      '保留：剩余股票可以等待公司再次成立。',
    ],
  },
  {
    tab: '结束',
    title: '一城落定，看看谁的眼光更远。',
    text: '服务端满足终局条件后自动结算，现金与股票价值汇总为总资产，最终排名以总资产为准。',
    points: [
      '任一公司达到 41 块地时，系统进入终局。',
      '所有已成立公司都超过 11 块且棋盘落地超过 90 块时，系统进入终局。',
      '终局后可以查看棋盘与回放；房主可以带原房间再来一局。',
    ],
  },
] as const;
function Status({ resource, showLoading = true }: { resource: { loading: boolean; error: string; retry: () => void }; showLoading?: boolean }) {
  return <>{showLoading && resource.loading && <AcquireLoading compact title="正在整理城市档案。" description="正在同步最新对局数据" status="正在读取在线记录" />}
    {resource.error && <Feedback error>{resource.error}<ActionButton onClick={resource.retry}>重试</ActionButton></Feedback>}</>;
}
function InfiniteFooter({ loading, error, hasMore, retry, anchorRef }: {
  loading: boolean;
  error: string;
  hasMore: boolean;
  retry: () => void;
  anchorRef: RefObject<HTMLDivElement>;
}) {
  return <div ref={anchorRef} className={styles.infiniteFooter}>
    {loading && <span>继续加载中...</span>}
    {!loading && error && <><span>加载失败</span><ActionButton variant="quiet" onClick={retry}>重试</ActionButton></>}
    {!loading && !error && !hasMore && <span>已经到底了</span>}
  </div>;
}

export function Rankings() {
  const profile = useAcquireResource(getProfile);
  const [mode, setMode] = useState<'score' | 'games'>('score');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const rankingSort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const {
    entries,
    loading,
    error,
    hasMore,
    loadMore,
    retry,
  } = useGameLeaderboard({
    gameType: 'acquire',
    pageSize: RANKING_PAGE_SIZE,
    sort: rankingSort,
  });
  useInfiniteLoad(sentinelRef, entries.length > 0 && hasMore && !loading && !error, loadMore);
  const sorted = entries;
  const myIndex = sorted.findIndex(entry => String(entry.userID) === String(profile.data?.id));
  return <AppShell title="排行榜" profile={profile.data}><div className={styles.page + ' ' + styles.rankPage}>
    <header className={styles.communityHeading}><div><small>THE CITY'S FINEST</small><h1>每一局，都算数。</h1></div><span className={styles.outlineTag}>真实对局记录</span></header>
    <section className={styles.rankHero}><Trophy size={39} /><div><small>ACQUIRE LEADERBOARD</small><h2>城市合伙人榜</h2><p>用平均名次衡量稳定发挥，也记录每一张完成的桌。</p></div>
      <div className={styles.myRank}><span>我的排名</span><b>{myIndex >= 0 ? '#' + (myIndex + 1) : '—'}</b><small>{myIndex >= 0 && 'avgRank' in sorted[myIndex] ? '平均名次 ' + sorted[myIndex].avgRank.toFixed(2) : '完成对局后进入排行'}</small></div>
    </section>
    <section className={styles.rankPanel}><GameTabs className={styles.rankTabs} activeClassName={styles.activeTab}
      ariaLabel="排行榜模式" value={mode} onChange={setMode}
      items={[{ value: 'score', label: '战绩榜' }, { value: 'games', label: '场次榜' }]}
      getItemProps={() => ({ 'data-click-sound': 'tab' })} />
      <div className={styles.rankRow + ' ' + styles.rankHead}><span>名次</span><span>玩家</span><span>完成对局</span><span>平均名次</span></div>
      <Status resource={{ loading: loading && !entries.length, error: error && !entries.length ? error : '', retry }} />{sorted.map((entry, index) => { const mine = String(entry.userID) === String(profile.data?.id); return <div className={styles.rankRow + (mine ? ' ' + styles.rankSelf : '')} key={entry.userID}>
        <span className={styles.rankNumber}>{index === 0 ? <Trophy size={22} /> : String(index + 1).padStart(2, '0')}</span>
        <span className={styles.rankPlayer}><PlayerAvatar name={entry.displayName} size={36} /><b>{entry.displayName}</b>{mine && <em>你</em>}</span>
        <span>{entry.totalGames}<small>场</small></span><span>{'avgRank' in entry ? entry.avgRank.toFixed(2) : '—'}</span>
      </div>; })}
      {!loading && !error && !sorted.length && <Feedback>暂时还没有排名记录，来完成一局吧。</Feedback>}
      {!!entries.length && <InfiniteFooter loading={loading} error={error} hasMore={hasMore} retry={retry} anchorRef={sentinelRef} />}
    </section>
  </div></AppShell>;
}
export function My() {
  const profile = useAcquireResource(getProfile);
  const stats = useGameStats('acquire');
  const {
    games,
    loading: historyLoading,
    error: historyError,
    hasMore,
    loadMore: loadNextHistoryPage,
    retry: retryHistory,
  } = useGameHistory({ gameType: 'acquire', pageSize: HISTORY_PAGE_SIZE });
  const logoutAction = useGameLogout();
  const [aboutOpen, setAboutOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleLogout = useCallback(async () => {
    if (!window.confirm('确定要退出登录吗？')) return;
    await logoutAction.run();
  }, [logoutAction]);
  useInfiniteLoad(sentinelRef, games.length > 0 && hasMore && !historyLoading && !historyError, loadNextHistoryPage);
  const loading = profile.loading && !profile.data || stats.loading && !stats.data || historyLoading && !games.length;
  return <AppShell title="玩家档案" profile={profile.data} compactMobileFooter><div className={styles.page + ' ' + styles.profilePage}>
    <header className={styles.communityHeading}><div><small>YOUR PLAYER IDENTITY</small><h1>让这张筹码，代表你。</h1></div></header>
    {loading ? <AcquireLoading title="正在整理你的城市档案。" description="正在同步身份、战绩与对局记录" status="正在读取玩家资料" />
      : <div className={styles.profileLayout}><section className={styles.profileDisplay}>
      <Status resource={profile} showLoading={false} />{profile.data && <><div className={styles.profileIdentity}><PlayerAvatar name={profile.data.name} avatar={profile.data.avatar} size={72} />
        <div><small className={styles.profileEyebrow}>THE CITY PARTNER</small><h2>{profile.data.name}</h2><span>PLAYER ID · {profile.data.id}</span></div></div>
        <div className={styles.profileEmail}><Mail size={14} />{profile.data.email || '邮箱未绑定'}</div></>}
      <Status resource={stats} showLoading={false} />{stats.data && <div className={styles.profileStats}><span><b>{stats.data.totalGames}</b><small>对局</small></span><span><b>{stats.data.wins}</b><small>胜场</small></span><span><b>{money(Math.round(stats.data.avgScore))}</b><small>平均资产</small></span></div>}
      {profile.data && <><div className={styles.profileManage}><a className={styles.profileEdit} href="https://auth.gamebus.online/profile"><Pencil size={14} />编辑资料</a>
          <ActionButton variant="quiet" className={styles.profileLogout} pending={logoutAction.pending} onClick={handleLogout}><LogOut size={14} />退出登录</ActionButton></div>
        {logoutAction.error && <p role="alert" className={styles.profileLogoutError}>{logoutAction.error}</p>}</>}
    </section><section className={styles.profileHistory}><h2>对局记录</h2><Status resource={{ loading: historyLoading && !games.length, error: historyError && !games.length ? historyError : '', retry: retryHistory }} showLoading={false} />
      <ol className={styles.history}>{games.map(game => { const me = game.players?.find(player => player.userID != null && String(player.userID) === String(profile.data?.id)); return <li key={game.id}><div><strong>{game.roomID}</strong><small>{new Date(game.startedAt).toLocaleString('zh-CN')} · {game.endedAt ? '已结束' : '进行中'}</small>
        <small>{me?.isWinner ? '本局获胜 · ' : ''}{me?.finalScore != null ? money(me.finalScore) + ' · ' : ''}时长 {Math.max(0, Math.round(game.durationSeconds / 60))} 分钟</small></div>
        {game.endedAt ? <Link className={styles.link} to={'/game/acquire/replay/' + game.id}>回放 <ArrowRight size={14} /></Link> : <span className={styles.note}>等待结束</span>}</li>; })}</ol>
      {!historyLoading && !historyError && !games.length && <Feedback>还没有对局记录。<Link className={styles.link} to="/game/acquire">去大厅开一桌</Link></Feedback>}
      {!!games.length && <InfiniteFooter loading={historyLoading} error={historyError} hasMore={hasMore} retry={retryHistory} anchorRef={sentinelRef} />}
    </section></div>}
    <button type="button" className={styles.aboutEntry} data-testid="acquire-about-entry"
      onClick={() => setAboutOpen(true)}>
      <span className={styles.aboutEntryIcon}><Info size={17} /></span>
      <span><b>关于与联系</b><small>项目作者、源码与联系方式</small></span>
      <ChevronRight size={17} />
    </button>
    {aboutOpen && <ResponsiveDialog title="关于 Acquire Online" eyebrow="ABOUT & CONTACT" className={styles.aboutDialog}
      onClose={() => setAboutOpen(false)} footer={<ActionButton onClick={() => setAboutOpen(false)}>知道了</ActionButton>}>
      <ProjectContact gameName="Acquire" avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        classes={{ intro: styles.aboutIntro, links: styles.aboutLinks, legal: styles.aboutLegal }} />
    </ResponsiveDialog>}
  </div></AppShell>;
}
export function Guide() {
  const navigate = useNavigate();
  const profile = useAcquireResource(getProfile);
  const [prices, setPrices] = useState(false);
  const guide = useGuideSteps(guideSteps);
  const step = guide.current;
  const handlePrimaryAction = () => {
    if (guide.isLast) {
      navigate('/game/acquire');
      return;
    }
    guide.next();
  };
  return <AppShell title="玩法指南" profile={profile.data}><div className={`${styles.page} ${styles.guidePage}`}>
    <div className={styles.guide}>
      <header className={styles.guideHeading}><small>LEARN THE FIRST MOVE</small><h1>先懂一招，再赢一局。</h1></header>
      <div className={styles.guideLayout}><aside><img src={tableArt} alt="Acquire 桌面材质示意" />
        <div className={styles.guideFacts}><span><Users size={18} />2–6 人</span><span><Clock size={18} />45–90 分钟</span><span><Building2 size={18} />108 块地</span></div>
      </aside><section className={styles.guidePanel}>
        <GameTabs className={styles.guideTabs} activeClassName={styles.activeTab}
          ariaLabel="玩法章节" value={guide.index} onChange={guide.select}
          items={guideSteps.map((item, index) => ({
            value: index,
            label: `${String(index + 1).padStart(2, '0')} ${item.tab}`,
          }))} />
        <small className={styles.guideEyebrow}>THE ESSENTIALS</small><h2>{step.title}</h2><p>{step.text}</p>
        <ol>{step.points.map(point => <li key={point}>{point}</li>)}</ol>
        <div className={styles.guideHint}><ShieldCheck size={16} /><span>本页遵循当前在线版本。股价、并列分红与超时处理以实际游戏服务为准。</span></div>
        <div className={styles.guideActions}><ActionButton variant="primary" onClick={handlePrimaryAction}>{guide.isLast ? '创建房间' : '下一步'}<ArrowRight size={16} /></ActionButton>
          <ActionButton onClick={() => setPrices(true)}>股价速查</ActionButton></div>
      </section></div>
    </div>
    {prices && <StockPrices onClose={() => setPrices(false)} />}</div></AppShell>;
}
