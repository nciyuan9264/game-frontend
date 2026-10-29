import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Check,
  Clock3,
  Gavel,
  Home,
  Info,
  LogOut,
  Mail,
  Pencil,
  ReceiptText,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  GameMobileAboutDialog,
  GameMobileGuide,
  GameMobileProfile,
  GameMobileRankings,
} from '@/components/GameUI/GamePublicMobile';
import { GameTabs } from '@/components/GameUI/GameTabs';
import { Feedback } from '@/components/GameUI/Panel';
import { ProjectContact } from '@/components/GameUI/ProjectContact';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { getProfile } from '@/features/game-core/api/auth';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useGuideSteps } from '@/features/game-core/hooks/useGuideSteps';
import { useInfiniteLoad } from '@/features/game-core/hooks/useInfiniteLoad';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import type {
  LeaderboardSortDim,
  RankLeaderboardEntry,
} from '@/features/game-core/model/history';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import sold from '../assets/sold.webp';
import { AppShell } from '../components/AppShell';
import {
  Cheque,
  PlayerAvatar,
  PropertyCard,
} from '../components/GamePieces';
import { ForSaleLoading } from '../components/LoadingState';
import {
  chequeMoney,
  refund,
  roundsFor,
  startingCoins,
} from '../model/types';

const isRankEntry = (
  entry: RankLeaderboardEntry | { totalGames: number },
): entry is RankLeaderboardEntry => 'avgRank' in entry;

export const Rankings = () => {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'rank' | 'games'>('rank');
  const sentinel = useRef<HTMLDivElement>(null);
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const leaderboard = useGameLeaderboard<RankLeaderboardEntry>({
    gameType: 'forsale',
    pageSize: 20,
    sort,
    isEntry: isRankEntry,
  });
  useInfiniteLoad(sentinel, leaderboard.entries.length > 0
    && leaderboard.hasMore && !leaderboard.loading && !leaderboard.error,
  leaderboard.loadMore);
  const myIndex = leaderboard.entries.findIndex(entry =>
    String(entry.userID) === String(profile.data?.id));
  if (isMobile) {
    return <AppShell title="财富排行" profile={profile.data}>
      <GameMobileRankings eyebrow="FOR SALE LEADERBOARD"
        title="周末买家榜"
        description="用平均名次衡量稳定发挥，也记录每一次完成的成交。"
        modes={[
          { value: 'rank', label: '平均名次' },
          { value: 'games', label: '完成场次' },
        ]}
        mode={mode} onModeChange={setMode}
        entries={leaderboard.entries.map(entry => ({
          id: String(entry.userID),
          displayName: entry.displayName,
          totalGames: entry.totalGames,
          metric: entry.avgRank.toFixed(2),
          metricLabel: '平均名次',
        }))}
        currentUserID={String(profile.data?.id ?? '')}
        renderAvatar={entry => <PlayerAvatar name={entry.displayName} size={29} />}
        state={<>{leaderboard.loading && !leaderboard.entries.length
          && <ForSaleLoading />}
          {leaderboard.error && !leaderboard.entries.length
            && <Feedback error>{leaderboard.error}
              <ActionButton onClick={leaderboard.retry}>重试</ActionButton>
            </Feedback>}</>}
        footer={<div ref={sentinel} className="fs-infinite">
          {leaderboard.loading && !!leaderboard.entries.length && '继续加载中…'}
          {!leaderboard.loading && !leaderboard.hasMore
            && !!leaderboard.entries.length && '已经到底了'}
        </div>}
      />
    </AppShell>;
  }
  return <AppShell title="财富排行" profile={profile.data}>
    <div className="fs-community fs-rankings"><header className="fs-community-heading">
      <div><span className="fs-eyebrow">THE WEEKEND'S FINEST</span>
        <h1>每一笔买卖，都算数。</h1></div><span>真实完成对局</span></header>
      <section className="fs-rank-hero"><Trophy size={37} /><div>
        <small>FOR SALE LEADERBOARD</small><h2>周末买家榜</h2>
        <p>用平均名次衡量稳定发挥，也记录每一次完成的成交。</p></div>
        <aside><span>我的排名</span><b>{myIndex >= 0 ? `#${myIndex + 1}` : '—'}</b>
          <small>{myIndex >= 0
            ? `平均名次 ${leaderboard.entries[myIndex].avgRank.toFixed(2)}`
            : '完成一场后进入排行'}</small></aside></section>
      <section className="fs-rank-panel"><GameTabs ariaLabel="排行榜模式"
        value={mode} onChange={setMode} className="fs-tabs" activeClassName="active"
        items={[{ value: 'rank', label: '平均名次' },
          { value: 'games', label: '完成场次' }]} />
        <div className="fs-rank-row head"><span>名次</span><span>玩家</span>
          <span>完成对局</span><span>平均名次</span></div>
        {leaderboard.loading && !leaderboard.entries.length && <ForSaleLoading />}
        {leaderboard.error && !leaderboard.entries.length && <Feedback error>
          {leaderboard.error}<ActionButton onClick={leaderboard.retry}>重试</ActionButton>
        </Feedback>}
        {leaderboard.entries.map((entry, index) => {
          const mine = String(entry.userID) === String(profile.data?.id);
          return <div className={`fs-rank-row ${mine ? 'self' : ''}`}
            key={entry.userID}><span>{index === 0 ? <Trophy size={20} />
              : String(index + 1).padStart(2, '0')}</span>
            <span><PlayerAvatar name={entry.displayName} size={36} />
              <b>{entry.displayName}</b>{mine && <em>你</em>}</span>
            <span>{entry.totalGames}<small>场</small></span>
            <strong>{entry.avgRank.toFixed(2)}</strong></div>;
        })}
        {!leaderboard.loading && !leaderboard.error && !leaderboard.entries.length
          && <div className="fs-empty"><Trophy size={30} />
            <h3>榜单还在等待第一声落槌。</h3>
            <p>完成一场线上对局后，真实成绩会出现在这里。</p></div>}
        <div ref={sentinel} className="fs-infinite">{
          leaderboard.loading && !!leaderboard.entries.length && '继续加载中…'}</div>
      </section></div>
  </AppShell>;
};

const guideSteps = [
  {
    tab: '目标',
    title: '用一笔本金，做两轮买卖。',
    text: '先用金币竞价购买房产，再同时暗选房产换取支票。最终财富最高的人获胜。',
    points: ['房产数字是等级，不是价格。', '剩余金币会计入最终财富。', '3–6 人使用不同金币与轮数。'],
  },
  {
    tab: '竞价',
    title: '知道什么时候加价，也知道什么时候收手。',
    text: '轮到你时提高总出价，或退出拿走剩余最低房产。再次加价只补差额。',
    points: ['退出返还已押金币的一半并向上取整。', '最后留场者拿最高房产并支付全部出价。', '最高房产玩家开启下一轮。'],
  },
  {
    tab: '出售',
    title: '同一刻出牌，各有各的打算。',
    text: '每人暗选一张房产。全部锁定后一起揭晓，最高房产领取最高支票。',
    points: ['锁定前可以更换。', '对手选择在揭晓前保密。', '售出的房产不能再次使用。'],
  },
  {
    tab: '结算',
    title: '好买卖，最后用数字说话。',
    text: '所有房产售出后，支票合计加剩余金币就是最终财富。',
    points: ['同财富比较剩余金币。', '金币也相同则并列获胜。', '结算与回放来自服务端权威快照。'],
  },
] as const;

export const Guide = () => {
  const { isMobile } = useMobileViewport();
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const guide = useGuideSteps(guideSteps);
  const [bid, setBid] = useState(5);
  const step = guide.current;
  const detail = <>
    {guide.index === 0 && <div className="fs-rule-table">
      <span>人数</span><span>起始金币</span><span>每阶段轮数</span>
      {[3, 4, 5, 6].map(players => <div key={players}>
        <b>{players} 人</b><span>{startingCoins(players)} 枚</span>
        <span>{roundsFor(players)} 轮</span>
      </div>)}</div>}
    {guide.index === 1 && <div className="fs-refund-calc">
      <label>你已押 <select aria-label="退款演算出价" value={bid}
        onChange={event => setBid(Number(event.target.value))}>
        {Array.from({ length: 15 }, (_, value) =>
          <option key={value} value={value}>{value}</option>)}
      </select> 枚</label>
      <span><small>退回钱包</small><b>{refund(bid)} 枚</b></span>
      <ArrowDown size={17} /><span><small>实际支出</small>
        <b>{bid - refund(bid)} 枚</b></span>
    </div>}
    {guide.index === 2 && <div className="fs-guide-match">
      <PropertyCard value={27} compact /><ArrowRight size={24} />
      <Cheque value={15} best />
    </div>}
    {guide.index === 3 && <div className="fs-score-example">
      <span><small>支票</small><b>{chequeMoney(37)}</b></span><strong>+</strong>
      <span><small>金币</small><b>{chequeMoney(8)}</b></span><strong>=</strong>
      <span><small>最终财富</small><b>{chequeMoney(45)}</b></span>
    </div>}
  </>;
  if (isMobile) {
    return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter>
      <GameMobileGuide
        visual={<img src={sold} alt="周末拍卖成交牌" />}
        facts={[
          { icon: <Users />, value: '3–6', label: '人' },
          { icon: <Clock3 />, value: '20–30', label: '分钟' },
          { icon: <Gavel />, value: '2', label: '个阶段' },
        ]}
        tabs={guideSteps.map((item, index) => ({
          value: index,
          label: `${String(index + 1).padStart(2, '0')} ${item.tab}`,
        }))}
        index={guide.index} onSelect={guide.select}
        eyebrow={`CHAPTER 0${guide.index + 1} / 04`}
        title={step.title} description={step.text}
        points={step.points}
        detail={detail}
        hint="在线版本每次操作 60 秒；超时由只读取当前席位可见信息的公平 AI 托管。"
        primaryLabel={guide.isLast ? '创建房间' : '下一章'}
        onPrimary={() => guide.isLast ? navigate('/game/forsale') : guide.next()}
      />
    </AppShell>;
  }
  return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter>
    <div className="fs-community fs-guide"><header className="fs-community-heading">
      <div><span className="fs-eyebrow">THE GOOD BUYER'S HANDBOOK</span>
        <h1>规则很短，好戏很长。</h1></div></header>
      <div className="fs-guide-layout"><aside><img src={sold} alt="" />
        <div><span><Users size={17} />3–6 人</span>
          <span><Clock3 size={17} />20–30 分钟</span>
          <span><Gavel size={17} />两阶段</span></div></aside>
        <section><GameTabs ariaLabel="玩法章节" value={guide.index}
          onChange={guide.select} className="fs-tabs" activeClassName="active"
          items={guideSteps.map((item, index) => ({
            value: index,
            label: `${String(index + 1).padStart(2, '0')} ${item.tab}`,
          }))} />
          <span className="fs-eyebrow">CHAPTER 0{guide.index + 1} / 04</span>
          <h2>{step.title}</h2><p>{step.text}</p>
          <ol>{step.points.map(point => <li key={point}>{point}</li>)}</ol>
          {guide.index === 0 && <div className="fs-rule-table">
            <span>人数</span><span>起始金币</span><span>每阶段轮数</span>
            {[3, 4, 5, 6].map(players => <div key={players}>
              <b>{players} 人</b><span>{startingCoins(players)} 枚</span>
              <span>{roundsFor(players)} 轮</span></div>)}</div>}
          {guide.index === 1 && <div className="fs-refund-calc">
            <label>你已押 <select aria-label="退款演算出价" value={bid}
              onChange={event => setBid(Number(event.target.value))}>
              {Array.from({ length: 15 }, (_, value) =>
                <option key={value} value={value}>{value}</option>)}</select> 枚</label>
            <span><small>退回钱包</small><b>{refund(bid)} 枚</b></span>
            <ArrowDown size={17} /><span><small>实际支出</small>
              <b>{bid - refund(bid)} 枚</b></span></div>}
          {guide.index === 2 && <div className="fs-guide-match">
            <PropertyCard value={27} compact /><ArrowRight size={24} />
            <Cheque value={15} best /></div>}
          {guide.index === 3 && <div className="fs-score-example">
            <span><small>支票</small><b>{chequeMoney(37)}</b></span><strong>+</strong>
            <span><small>金币</small><b>{chequeMoney(8)}</b></span><strong>=</strong>
            <span><small>最终财富</small><b>{chequeMoney(45)}</b></span></div>}
          <div className="fs-guide-hint"><ShieldCheck size={15} />
            <span>在线版本每次操作 60 秒；超时由只读取当前席位可见信息的公平 AI 托管。</span></div>
          <div className="fs-guide-actions">
            <ActionButton disabled={guide.isFirst} onClick={guide.previous}>
              <ArrowLeft size={14} />上一章
            </ActionButton>
            <ActionButton variant="primary" onClick={() =>
              guide.isLast ? navigate('/game/forsale') : guide.next()}>
              {guide.isLast ? '进入大厅' : '下一章'}<ArrowRight size={15} />
            </ActionButton>
          </div></section></div>
    </div>
  </AppShell>;
};

export const My = () => {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('forsale');
  const history = useGameHistory({ gameType: 'forsale', pageSize: 20 });
  const logout = useGameLogout();
  const [panel, setPanel] = useState<'logout' | 'about'>();
  const handleLogout = useCallback(async () => logout.run(), [logout]);
  const loading = profile.loading && !profile.data
    || stats.loading && !stats.data
    || history.loading && !history.games.length;
  if (isMobile) {
    const historyItems = history.games.map(game => {
      const me = game.players?.find(player =>
        String(player.userID) === String(profile.data?.id));
      return {
        id: String(game.id),
        title: `${game.maxPlayers} 人经典局 · 房间 ${game.roomID}`,
        detail: `${me?.isWinner ? '本场第一' : `最终第 ${me?.finalRank ?? '—'} 名`
        } · ${chequeMoney(me?.finalScore ?? 0)} · ${
          Math.max(0, Math.round(game.durationSeconds / 60))} 分钟`,
        accessory: game.endedAt ? '回放' : '进行中',
        href: game.endedAt ? `/game/forsale/replay/${game.id}` : undefined,
      };
    });
    return <AppShell title="我的对局" profile={profile.data} compactMobileFooter>
      {loading
        ? <ForSaleLoading />
        : <GameMobileProfile
          avatar={<PlayerAvatar name={profile.data?.name || '周末买家'}
            avatar={profile.data?.avatar} size={60} />}
          eyebrow="THE WEEKEND BUYER"
          name={profile.data?.name || '周末买家'}
          playerID={profile.data?.id ?? '—'}
          email={profile.data?.email}
          stats={[
            { label: '完成对局', value: stats.data?.totalGames ?? 0 },
            { label: '第一名', value: stats.data?.wins ?? 0 },
            { label: '平均财富', value: chequeMoney(Math.round(stats.data?.avgScore ?? 0)) },
          ]}
          historyTitle="成交档案"
          historyItems={historyItems}
          emptyHistory={<Feedback>第一笔好买卖，等你来写。
            <Link to="/game/forsale">进入大厅</Link>
          </Feedback>}
          historyFooter={history.hasMore && <ActionButton
            disabled={history.loading} onClick={history.loadMore}>
            加载更多对局
          </ActionButton>}
          logoutPending={logout.pending} logoutError={logout.error}
          onLogout={() => setPanel('logout')}
          onAbout={() => setPanel('about')}
        />}
      {panel === 'about' && <GameMobileAboutDialog gameName="For Sale"
        avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        themeClassName="forsale-root"
        onClose={() => setPanel(undefined)} />}
      {panel === 'logout' && <ResponsiveDialog title="离开当前账号？"
        eyebrow="SIGN OUT" onClose={() => setPanel(undefined)}
        themeClassName="forsale-root"
        footer={<><ActionButton onClick={() => setPanel(undefined)}>取消</ActionButton>
          <ActionButton variant="danger" pending={logout.pending}
            onClick={handleLogout}>退出登录</ActionButton></>}>
        <p>退出不会删除线上战绩与历史回放。</p>
      </ResponsiveDialog>}
    </AppShell>;
  }
  return <AppShell title="我的对局" profile={profile.data} compactMobileFooter>
    <div className="fs-community fs-profile-page"><header className="fs-community-heading">
      <div><span className="fs-eyebrow">EVERY DEAL HAS A STORY</span>
        <h1>每一场买卖，都值得回味。</h1></div></header>
      {loading ? <ForSaleLoading /> : <div className="fs-profile-layout">
        <section className="fs-profile-card"><PlayerAvatar
          name={profile.data?.name || '周末买家'}
          avatar={profile.data?.avatar} size={72} />
          <span className="fs-eyebrow">THE WEEKEND BUYER</span>
          <h2>{profile.data?.name || '周末买家'}</h2>
          <p>PLAYER ID · {profile.data?.id ?? '—'}</p>
          <div><Mail size={14} />{profile.data?.email || '邮箱未绑定'}</div>
          <dl><span><b>{stats.data?.totalGames ?? 0}</b><small>完成对局</small></span>
            <span><b>{stats.data?.wins ?? 0}</b><small>第一名</small></span>
            <span><b>{chequeMoney(Math.round(stats.data?.avgScore ?? 0))}</b>
              <small>平均财富</small></span></dl>
          <nav><a href="https://auth.gamebus.online/profile">
            <Pencil size={14} />编辑资料</a>
            <button type="button" onClick={() => setPanel('logout')}>
              <LogOut size={14} />退出登录</button></nav></section>
        <section className="fs-history"><header><h2>成交档案</h2>
          <span>{stats.data?.totalGames ?? 0} 场</span></header>
          {history.error && <Feedback error>{history.error}
            <ActionButton onClick={history.retry}>重试</ActionButton></Feedback>}
          {history.games.map(game => {
            const me = game.players?.find(player =>
              String(player.userID) === String(profile.data?.id));
            return <article key={game.id}><span><ReceiptText size={19} /></span>
              <div><b>{game.maxPlayers} 人经典局 · 房间 {game.roomID}</b>
                <small>{new Date(game.startedAt).toLocaleString('zh-CN')} · {
                  Math.max(0, Math.round(game.durationSeconds / 60))} 分钟</small>
                <small>{me?.isWinner ? '本场第一' : `最终第 ${me?.finalRank ?? '—'} 名`}
                  {' · '}{chequeMoney(me?.finalScore ?? 0)}</small></div>
              {game.endedAt
                ? <Link to={`/game/forsale/replay/${game.id}`}>
                  回放<ArrowRight size={14} /></Link> : <em>进行中</em>}</article>;
          })}
          {!history.loading && !history.error && !history.games.length
            && <div className="fs-empty"><Home size={30} />
              <h3>第一笔好买卖，等你来写。</h3>
              <p>完成一场对局后，结果和回放会留在这里。</p></div>}
          {history.hasMore && <ActionButton onClick={history.loadMore}
            disabled={history.loading}>加载更多对局</ActionButton>}
        </section></div>}
      <button className="fs-about-entry" type="button" onClick={() => setPanel('about')}>
        <span><Info size={16} /></span><span><b>关于与联系</b>
          <small>项目作者、源码与联系方式</small></span><ChevronRight size={16} /></button>
      {panel === 'logout' && <ResponsiveDialog title="离开当前账号？"
        eyebrow="SIGN OUT" onClose={() => setPanel(undefined)}
        footer={<><ActionButton onClick={() => setPanel(undefined)}>取消</ActionButton>
          <ActionButton variant="danger" pending={logout.pending}
            onClick={handleLogout}>退出登录</ActionButton></>}>
        <p>退出不会删除线上战绩与历史回放。</p>
      </ResponsiveDialog>}
      {panel === 'about' && <ResponsiveDialog title="关于 For Sale Online"
        eyebrow="ABOUT & CONTACT" onClose={() => setPanel(undefined)}
        footer={<ActionButton onClick={() => setPanel(undefined)}>
          知道了<Check size={14} /></ActionButton>}>
        <ProjectContact gameName="For Sale" avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
          classes={{
            intro: 'fs-contact-intro',
            links: 'fs-contact-links',
            legal: 'fs-contact-legal',
          }} />
      </ResponsiveDialog>}
    </div>
  </AppShell>;
};
