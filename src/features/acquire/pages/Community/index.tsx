import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Clock, LogOut, Mail, Pencil, ShieldCheck, Trophy, Users } from 'lucide-react';
import { getProfile, logout } from '@/api/room';
import { getMyStats, listMyGames } from '@/api/history';
import { getLeaderboard } from '@/api/leaderboard';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { ActionButton } from '../../components/ActionButton';
import { Feedback } from '../../components/Panel';
import { AcquireLoading } from '../../components/LoadingState';
import { StockPrices } from '../../dialogs/StockPrices';
import { useAcquireResource } from '../../hooks/useAcquireResource';
import { money } from '../../model/session';
import tableArt from '../../assets/table-art.webp';
import styles from './index.module.less';
import type { Game } from '@/types/history';
import type { LeaderboardEntry, LeaderboardSortDim } from '@/types/leaderboard';

const RANKING_PAGE_SIZE = 8;
const HISTORY_PAGE_SIZE = 20;
const LOAD_MORE_MARGIN = 180;
const loadStats = () => getMyStats('acquire');
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

function findScrollParent(element: HTMLElement): HTMLElement | Window {
  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

function useInfiniteLoad(
  anchorRef: RefObject<HTMLDivElement>,
  enabled: boolean,
  loadMore: () => void
) {
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || !enabled) return;

    let frame = 0;
    const checkNearEnd = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        if (anchor.getBoundingClientRect().top <= viewportHeight + LOAD_MORE_MARGIN) {
          loadMoreRef.current();
        }
      });
    };

    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMoreRef.current();
    }, { rootMargin: `${LOAD_MORE_MARGIN}px 0px` });
    observer?.observe(anchor);

    const scrollParent = findScrollParent(anchor);
    scrollParent.addEventListener('scroll', checkNearEnd, { passive: true });
    window.addEventListener('resize', checkNearEnd);
    checkNearEnd();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      scrollParent.removeEventListener('scroll', checkNearEnd);
      window.removeEventListener('resize', checkNearEnd);
    };
  }, [anchorRef, enabled]);
}

export function Rankings() {
  const profile = useAcquireResource(getProfile);
  const [mode, setMode] = useState<'score' | 'games'>('score');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const requestSeq = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingNextRef = useRef(false);
  const rankingSort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const retry = useCallback(() => {
    loadingNextRef.current = false;
    setEntries([]);
    setHasMore(true);
    setPage(0);
    setRevision(value => value + 1);
  }, []);
  useEffect(() => {
    const requestID = ++requestSeq.current;
    setLoading(true);
    setError('');
    getLeaderboard({ gameType: 'acquire', limit: RANKING_PAGE_SIZE, offset: page * RANKING_PAGE_SIZE, sort: rankingSort })
      .then(result => {
        if (requestID !== requestSeq.current) return;
        const next = result.entries ?? [];
        setEntries(current => page === 0 ? next : [
          ...current,
          ...next.filter(entry => !current.some(item => item.userID === entry.userID)),
        ]);
        setHasMore(next.length === RANKING_PAGE_SIZE);
      })
      .catch(reason => {
        if (requestID === requestSeq.current) setError(reason instanceof Error ? reason.message : '加载失败，请重试');
      })
      .finally(() => {
        if (requestID === requestSeq.current) {
          loadingNextRef.current = false;
          setLoading(false);
        }
      });
    return () => { requestSeq.current = requestID + 1; };
  }, [page, rankingSort, revision]);
  const changeMode = useCallback((nextMode: 'score' | 'games') => {
    if (nextMode === mode) return;
    loadingNextRef.current = false;
    setMode(nextMode);
    setEntries([]);
    setHasMore(true);
    setLoading(true);
    setPage(0);
    setRevision(value => value + 1);
  }, [mode]);
  const loadNextPage = useCallback(() => {
    if (!hasMore || loading || error || loadingNextRef.current) return;
    loadingNextRef.current = true;
    setLoading(true);
    setPage(value => value + 1);
  }, [error, hasMore, loading]);
  useInfiniteLoad(sentinelRef, entries.length > 0 && hasMore && !loading && !error, loadNextPage);
  const sorted = entries;
  const myIndex = sorted.findIndex(entry => String(entry.userID) === String(profile.data?.id));
  return <AppShell title="排行榜" profile={profile.data}><div className={styles.page + ' ' + styles.rankPage}>
    <header className={styles.communityHeading}><div><small>THE CITY'S FINEST</small><h1>每一局，都算数。</h1></div><span className={styles.outlineTag}>真实对局记录</span></header>
    <section className={styles.rankHero}><Trophy size={39} /><div><small>ACQUIRE LEADERBOARD</small><h2>城市合伙人榜</h2><p>用平均名次衡量稳定发挥，也记录每一张完成的桌。</p></div>
      <div className={styles.myRank}><span>我的排名</span><b>{myIndex >= 0 ? '#' + (myIndex + 1) : '—'}</b><small>{myIndex >= 0 && 'avgRank' in sorted[myIndex] ? '平均名次 ' + sorted[myIndex].avgRank.toFixed(2) : '完成对局后进入排行'}</small></div>
    </section>
    <section className={styles.rankPanel}><div className={styles.rankTabs}><button className={mode === 'score' ? styles.activeTab : ''} onClick={() => changeMode('score')}>战绩榜</button><button className={mode === 'games' ? styles.activeTab : ''} onClick={() => changeMode('games')}>场次榜</button></div>
      <div className={styles.rankRow + ' ' + styles.rankHead}><span>名次</span><span>玩家</span><span>完成对局</span><span>平均名次</span></div>
      <Status resource={{ loading: loading && !entries.length, error: error && !entries.length ? error : '', retry }} />{sorted.map((entry, index) => { const mine = String(entry.userID) === String(profile.data?.id); return <div className={styles.rankRow + (mine ? ' ' + styles.rankSelf : '')} key={entry.userID}>
        <span className={styles.rankNumber}>{index === 0 ? <Trophy size={22} /> : String(index + 1).padStart(2, '0')}</span>
        <span className={styles.rankPlayer}><PlayerAvatar name={entry.playerID.replace(/-\d+$/, '')} size={36} /><b>{entry.playerID.replace(/-\d+$/, '')}</b>{mine && <em>你</em>}</span>
        <span>{entry.totalGames}<small>场</small></span><span>{'avgRank' in entry ? entry.avgRank.toFixed(2) : '—'}</span>
      </div>; })}
      {!loading && !error && !sorted.length && <Feedback>暂时还没有排名记录，来完成一局吧。</Feedback>}
      {!!entries.length && <InfiniteFooter loading={loading} error={error} hasMore={hasMore} retry={retry} anchorRef={sentinelRef} />}
    </section>
  </div></AppShell>;
}
export function My() {
  const profile = useAcquireResource(getProfile);
  const stats = useAcquireResource(loadStats);
  const [games, setGames] = useState<Game[]>([]);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [revision, setRevision] = useState(0);
  const requestSeq = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingNextRef = useRef(false);
  const retryHistory = useCallback(() => {
    loadingNextRef.current = false;
    setGames([]);
    setHasMore(true);
    setPage(0);
    setRevision(value => value + 1);
  }, []);
  useEffect(() => {
    const requestID = ++requestSeq.current;
    setHistoryLoading(true);
    setHistoryError('');
    listMyGames({ gameType: 'acquire', limit: HISTORY_PAGE_SIZE, offset: page * HISTORY_PAGE_SIZE })
      .then(result => {
        if (requestID !== requestSeq.current) return;
        const next = result.games ?? [];
        setGames(current => page === 0 ? next : [
          ...current,
          ...next.filter(game => !current.some(item => item.id === game.id)),
        ]);
        setHasMore(next.length === HISTORY_PAGE_SIZE);
      })
      .catch(reason => {
        if (requestID === requestSeq.current) setHistoryError(reason instanceof Error ? reason.message : '加载失败，请重试');
      })
      .finally(() => {
        if (requestID === requestSeq.current) {
          loadingNextRef.current = false;
          setHistoryLoading(false);
        }
      });
    return () => { requestSeq.current = requestID + 1; };
  }, [page, revision]);
  const loadNextHistoryPage = useCallback(() => {
    if (!hasMore || historyLoading || historyError || loadingNextRef.current) return;
    loadingNextRef.current = true;
    setHistoryLoading(true);
    setPage(value => value + 1);
  }, [hasMore, historyError, historyLoading]);
  const handleLogout = useCallback(async () => {
    if (!window.confirm('确定要退出登录吗？')) return;
    setLogoutPending(true);
    setLogoutError('');
    try {
      await logout();
      localStorage.removeItem('profile');
      window.location.href = 'https://auth.gamebus.online/login?redirect=' + encodeURIComponent(window.location.href);
    } catch (reason) {
      setLogoutError(reason instanceof Error ? reason.message : '退出登录失败，请稍后重试');
      setLogoutPending(false);
    }
  }, []);
  useInfiniteLoad(sentinelRef, games.length > 0 && hasMore && !historyLoading && !historyError, loadNextHistoryPage);
  const loading = profile.loading && !profile.data || stats.loading && !stats.data || historyLoading && !games.length;
  return <AppShell title="玩家档案" profile={profile.data}><div className={styles.page + ' ' + styles.profilePage}>
    <header className={styles.communityHeading}><div><small>YOUR PLAYER IDENTITY</small><h1>让这张筹码，代表你。</h1></div></header>
    {loading ? <AcquireLoading title="正在整理你的城市档案。" description="正在同步身份、战绩与对局记录" status="正在读取玩家资料" />
      : <div className={styles.profileLayout}><section className={styles.profileDisplay}>
      <Status resource={profile} showLoading={false} />{profile.data && <><div className={styles.profileIdentity}><PlayerAvatar name={profile.data.name} avatar={profile.data.avatar} size={72} />
        <div><small className={styles.profileEyebrow}>THE CITY PARTNER</small><h2>{profile.data.name}</h2><span>PLAYER ID · {profile.data.id}</span></div></div>
        <div className={styles.profileEmail}><Mail size={14} />{profile.data.email || '邮箱未绑定'}</div></>}
      <Status resource={stats} showLoading={false} />{stats.data && <div className={styles.profileStats}><span><b>{stats.data.totalGames}</b><small>对局</small></span><span><b>{stats.data.wins}</b><small>胜场</small></span><span><b>{money(Math.round(stats.data.avgScore))}</b><small>平均资产</small></span></div>}
      {profile.data && <><div className={styles.profileManage}><a className={styles.profileEdit} href="https://auth.gamebus.online/profile"><Pencil size={14} />编辑资料</a>
          <ActionButton variant="quiet" className={styles.profileLogout} pending={logoutPending} onClick={handleLogout}><LogOut size={14} />退出登录</ActionButton></div>
        {logoutError && <p role="alert" className={styles.profileLogoutError}>{logoutError}</p>}</>}
    </section><section className={styles.profileHistory}><h2>对局记录</h2><Status resource={{ loading: historyLoading && !games.length, error: historyError && !games.length ? historyError : '', retry: retryHistory }} showLoading={false} />
      <ol className={styles.history}>{games.map(game => { const me = game.players?.find(player => player.userID != null && String(player.userID) === String(profile.data?.id)); return <li key={game.id}><div><strong>{game.roomID}</strong><small>{new Date(game.startedAt).toLocaleString('zh-CN')} · {game.endedAt ? '已结束' : '进行中'}</small>
        <small>{me?.isWinner ? '本局获胜 · ' : ''}{me?.finalScore != null ? money(me.finalScore) + ' · ' : ''}时长 {Math.max(0, Math.round(game.durationSeconds / 60))} 分钟</small></div>
        {game.endedAt ? <Link className={styles.link} to={'/game/acquire/replay/' + game.id}>回放 <ArrowRight size={14} /></Link> : <span className={styles.note}>等待结束</span>}</li>; })}</ol>
      {!historyLoading && !historyError && !games.length && <Feedback>还没有对局记录。<Link className={styles.link} to="/game/acquire">去大厅开一桌</Link></Feedback>}
      {!!games.length && <InfiniteFooter loading={historyLoading} error={historyError} hasMore={hasMore} retry={retryHistory} anchorRef={sentinelRef} />}
    </section></div>}
  </div></AppShell>;
}
export function Guide() {
  const navigate = useNavigate();
  const profile = useAcquireResource(getProfile);
  const [prices, setPrices] = useState(false);
  const [guideTab, setGuideTab] = useState(0);
  const step = guideSteps[guideTab];
  const lastStep = guideTab === guideSteps.length - 1;
  const handlePrimaryAction = () => {
    if (lastStep) {
      navigate('/game/acquire');
      return;
    }
    setGuideTab(index => Math.min(index + 1, guideSteps.length - 1));
  };
  return <AppShell title="玩法指南" profile={profile.data}><div className={`${styles.page} ${styles.guidePage}`}>
    <div className={styles.guide}>
      <header className={styles.guideHeading}><small>LEARN THE FIRST MOVE</small><h1>先懂一招，再赢一局。</h1></header>
      <div className={styles.guideLayout}><aside><img src={tableArt} alt="Acquire 桌面材质示意" />
        <div className={styles.guideFacts}><span><Users size={18} />2–6 人</span><span><Clock size={18} />45–90 分钟</span><span><Building2 size={18} />108 块地</span></div>
      </aside><section className={styles.guidePanel}>
        <div className={styles.guideTabs} role="tablist" aria-label="玩法章节">{guideSteps.map((item, index) =>
          <button key={item.tab} role="tab" aria-selected={guideTab === index} className={guideTab === index ? styles.activeTab : ''} onClick={() => setGuideTab(index)}>
            {String(index + 1).padStart(2, '0')} {item.tab}
          </button>)}</div>
        <small className={styles.guideEyebrow}>THE ESSENTIALS</small><h2>{step.title}</h2><p>{step.text}</p>
        <ol>{step.points.map(point => <li key={point}>{point}</li>)}</ol>
        <div className={styles.guideHint}><ShieldCheck size={16} /><span>本页遵循当前在线版本。股价、并列分红与超时处理以实际游戏服务为准。</span></div>
        <div className={styles.guideActions}><ActionButton variant="primary" onClick={handlePrimaryAction}>{lastStep ? '创建房间' : '下一步'}<ArrowRight size={16} /></ActionButton>
          <ActionButton onClick={() => setPrices(true)}>股价速查</ActionButton></div>
      </section></div>
    </div>
    {prices && <StockPrices onClose={() => setPrices(false)} />}</div></AppShell>;
}
