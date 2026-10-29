import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Info, Layers3,
  Lightbulb, LogOut, Mail, Pencil, ShieldCheck, Trophy, Users,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  GameMobileAboutDialog,
  GameMobileGuide,
  GameMobileProfile,
  GameMobileRankings,
} from '@/components/GameUI/GamePublicMobile';
import { GameTabs } from '@/components/GameUI/GameTabs';
import { ProjectContact } from '@/components/GameUI/ProjectContact';
import { Feedback } from '@/components/GameUI/Panel';
import { getProfile } from '@/features/game-core/api/auth';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useGuideSteps } from '@/features/game-core/hooks/useGuideSteps';
import { useInfiniteLoad } from '@/features/game-core/hooks/useInfiniteLoad';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import type { LeaderboardSortDim, SixNimmtLeaderboardEntry } from '@/features/game-core/model/history';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { AppShell, Bull, PlayerAvatar } from '../../components/AppShell';
import { NumberCard } from '../../components/Card';
import { Dialog } from '../../components/Dialog';
import { SixNimmtLoading } from '../../components/LoadingState';
import { bullheads } from '../../model/cards';
import mascot from '../../assets/mascot.webp';

const isRankEntry = (entry: SixNimmtLeaderboardEntry | { totalGames: number }): entry is SixNimmtLeaderboardEntry => 'avgRank' in entry;

export function Rankings() {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'rank' | 'games'>('rank');
  const sentinel = useRef<HTMLDivElement>(null);
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const leaderboard = useGameLeaderboard<SixNimmtLeaderboardEntry>({ gameType: 'sixnimmt', pageSize: 20, sort, isEntry: isRankEntry });
  useInfiniteLoad(sentinel, leaderboard.entries.length > 0 && leaderboard.hasMore && !leaderboard.loading && !leaderboard.error, leaderboard.loadMore);
  const myIndex = leaderboard.entries.findIndex(entry => String(entry.userID) === String(profile.data?.id));
  if (isMobile) {
    return <AppShell title="牛头排行" profile={profile.data}>
      <GameMobileRankings eyebrow="6 NIMMT! LEADERBOARD"
        title="牧场稳手榜"
        description="用平均名次衡量稳定发挥，也记录每一场完整的经典 66 分赛。"
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
          && <SixNimmtLoading title="正在整理牧场榜单。"
            description="同步最新完成对局" />}
          {leaderboard.error && !leaderboard.entries.length
            && <Feedback error>{leaderboard.error}
              <ActionButton onClick={leaderboard.retry}>重试</ActionButton>
            </Feedback>}</>}
        footer={<div ref={sentinel} className="sn-infinite">
          {leaderboard.loading && !!leaderboard.entries.length && '继续加载中…'}
          {!leaderboard.loading && !leaderboard.hasMore
            && !!leaderboard.entries.length && '已经到底了'}
        </div>}
      />
    </AppShell>;
  }
  return <AppShell title="牛头排行" profile={profile.data}><div className="sn-community sn-rankings">
    <header className="sn-community-heading"><div><span className="sn-eyebrow">LESS BULL. MORE GLORY.</span>
      <h1>每一桌，都算数。</h1></div><span>真实完成对局</span></header>
    <section className="sn-rank-hero"><Trophy size={35} /><div><small>6 NIMMT! LEADERBOARD</small>
      <h2>牧场稳手榜</h2><p>用平均名次衡量稳定发挥，也记录每一场完整的经典 66 分赛。</p></div>
      <aside><span>我的排名</span><b>{myIndex >= 0 ? `#${myIndex + 1}` : '—'}</b>
        <small>{myIndex >= 0 ? `平均名次 ${leaderboard.entries[myIndex].avgRank.toFixed(2)}` : '完成一场后进入排行'}</small></aside></section>
    <section className="sn-rank-panel">
      <GameTabs ariaLabel="排行榜模式" value={mode} onChange={setMode} className="sn-tabs" activeClassName="active"
        items={[{ value: 'rank', label: '平均名次' }, { value: 'games', label: '完成场次' }]} />
      <div className="sn-rank-row head"><span>名次</span><span>玩家</span><span>完成对局</span><span>平均名次</span></div>
      {leaderboard.loading && !leaderboard.entries.length && <SixNimmtLoading title="正在整理牧场榜单。" description="同步最新完成对局" />}
      {leaderboard.error && !leaderboard.entries.length && <Feedback error>{leaderboard.error}<ActionButton onClick={leaderboard.retry}>重试</ActionButton></Feedback>}
      {leaderboard.entries.map((entry, index) => {
        const mine = String(entry.userID) === String(profile.data?.id);
        return <div className={`sn-rank-row ${mine ? 'self' : ''}`} key={entry.userID}>
          <span>{index === 0 ? <Trophy size={20} /> : String(index + 1).padStart(2, '0')}</span>
          <span><PlayerAvatar name={entry.displayName} size={36} /><b>{entry.displayName}</b>{mine && <em>你</em>}</span>
          <span>{entry.totalGames}<small>场</small></span><strong>{entry.avgRank.toFixed(2)}</strong></div>;
      })}
      {!leaderboard.loading && !leaderboard.error && !leaderboard.entries.length && <div className="sn-empty"><Trophy size={30} />
        <h3>榜单还在等待第一张记分表。</h3><p>完成一场线上对局后，真实成绩会出现在这里。</p></div>}
      <div ref={sentinel} className="sn-infinite">{leaderboard.loading && !!leaderboard.entries.length && '继续加载中…'}
        {!leaderboard.loading && !leaderboard.hasMore && !!leaderboard.entries.length && '已经到底了'}</div>
    </section></div></AppShell>;
}

const guideSteps = [
  { tab: '同时出牌', eyebrow: '01 / CHOOSE TOGETHER', title: '一人一张，同时亮相。', text: '每局每人获得 10 张手牌。每轮所有人暗选一张并锁定；全部锁定后由服务端一起公开。', points: ['公开牌从数字最小的开始处理。', '最后一位锁定后立即进入结算，不能再撤回。', '其他玩家锁定前看不到你的牌。'] },
  { tab: '如何入列', eyebrow: '02 / THE CLOSEST TAIL', title: '不是随便一行，是最接近的一行。', text: '一张牌只能进入行尾小于自己的牌列，并选择行尾数字最大、也就是正差最小的那一行。', points: ['每处理一张，后续牌都基于新牌桌重新计算。', '当前入列预览不能预测对手的牌。', '正常入列不能由玩家自由拖动。'] },
  { tab: '收牛', eyebrow: '03 / TAKE THE ROW', title: '挤满了，或太小了，都要收牛。', text: '每行最多 5 张。成为第六张时收走原五张；若牌小于全部行尾，则自己选择一行收走。', points: ['第六张不计入收牌，它成为新的行首。', '小牌收行后，同样用自己打出的牌开始新行。', '选择收行固定 60 秒，超时取牛头最少的一行。'] },
  { tab: '计分', eyebrow: '04 / COUNT THE BULLS', title: '牌上的牛头，才是你的罚分。', text: '普通牌 1 牛头，尾数 5 为 2，10 的倍数为 3，11 的倍数为 5，55 单独计 7。', points: ['55 是特例，不叠加为 12 牛头。', '牌面数字决定位置，牛头决定代价。', '只统计收取的牌，不统计自己打出的牌。'] },
  { tab: '胜负', eyebrow: '05 / SIXTY-SIX', title: '每局十张，牛头越少越好。', text: '完整 10 轮后结算本局。若有人累计达到或超过 66，累计牛头最少者赢得整场。', points: ['66 分不会在局中提前终止。', '无人达到 66 时重新洗牌并继续下一局。', '最低总分相同则并列获胜。'] },
] as const;

export function Guide() {
  const { isMobile } = useMobileViewport();
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const guide = useGuideSteps(guideSteps);
  const step = guide.current;
  const detail = <>
    {guide.index === 1 && <div className="sn-guide-rows">
      {[23, 44, 64, 90].map((tail, index) => <span key={tail}
        className={tail === 64 ? 'right' : ''}>
        <b>{String.fromCharCode(65 + index)} 行</b>
        <NumberCard value={tail} compact />
        <small>{tail < 68 ? `与 68 差 ${68 - tail}` : '不能进入'}</small>
        {tail === 64 && <Check size={14} />}
      </span>)}</div>}
    {guide.index === 2 && <div className="sn-guide-sixth">
      {[30, 35, 39, 41, 44].map(value =>
        <NumberCard key={value} value={value} compact />)}
      <ArrowRight size={20} /><NumberCard value={46} compact />
      <span><Bull size={20} /><b>收走前五张</b></span>
    </div>}
    {guide.index === 3 && <div className="sn-point-guide">
      {[23, 25, 30, 44, 55].map(value => <span key={value}>
        <NumberCard value={value} /><b>{bullheads(value)} 牛头</b>
      </span>)}</div>}
  </>;
  if (isMobile) {
    return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter>
      <GameMobileGuide
        visual={<img src={mascot} alt="抱着数字牌的小牛" />}
        facts={[
          { icon: <Users />, value: '2–10', label: '人' },
          { icon: <Clock3 />, value: '约 20', label: '分钟' },
          { icon: <Layers3 />, value: '104', label: '张牌' },
        ]}
        tabs={guideSteps.map((item, index) => ({
          value: index,
          label: `${String(index + 1).padStart(2, '0')} ${item.tab}`,
        }))}
        index={guide.index} onSelect={guide.select}
        eyebrow={step.eyebrow}
        title={step.title} description={step.text}
        points={step.points}
        detail={detail}
        hint="随机、时限、合法操作与最终计分都以服务端权威状态为准。"
        primaryLabel={guide.isLast ? '创建房间' : '下一章'}
        onPrimary={() => guide.isLast ? navigate('/game/sixnimmt') : guide.next()}
      />
    </AppShell>;
  }
  return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter><div className="sn-community sn-guide">
    <header className="sn-community-heading"><div><span className="sn-eyebrow">THE RULES, WITHOUT THE RULEBOOK</span>
      <h1>三分钟，读懂这一桌。</h1></div></header>
    <div className="sn-guide-layout"><aside><img src={mascot} alt="抱着数字牌的小牛" />
      <div><span><Users size={17} />2–10 人</span><span><Clock3 size={17} />约 20 分钟</span><span><Layers3 size={17} />104 张牌</span></div>
    </aside><section>
      <GameTabs ariaLabel="玩法章节" value={guide.index} onChange={guide.select} className="sn-tabs" activeClassName="active"
        items={guideSteps.map((item, index) => ({ value: index, label: `${String(index + 1).padStart(2, '0')} ${item.tab}` }))} />
      <small className="sn-eyebrow">{step.eyebrow}</small><h2>{step.title}</h2><p>{step.text}</p>
      <ol>{step.points.map(point => <li key={point}>{point}</li>)}</ol>
      {guide.index === 1 && <div className="sn-guide-rows">{[23, 44, 64, 90].map((tail, index) => <span key={tail} className={tail === 64 ? 'right' : ''}>
        <b>{String.fromCharCode(65 + index)} 行</b><NumberCard value={tail} compact />
        <small>{tail < 68 ? `与 68 差 ${68 - tail}` : '不能进入'}</small>{tail === 64 && <Check size={14} />}</span>)}</div>}
      {guide.index === 2 && <div className="sn-guide-sixth">{[30, 35, 39, 41, 44].map(value => <NumberCard key={value} value={value} compact />)}
        <ArrowRight size={20} /><NumberCard value={46} compact /><span><Bull size={20} /><b>收走前五张</b></span></div>}
      {guide.index === 3 && <div className="sn-point-guide">{[23, 25, 30, 44, 55].map(value => <span key={value}>
        <NumberCard value={value} /><b>{bullheads(value)} 牛头</b></span>)}</div>}
      <div className="sn-guide-hint"><Lightbulb size={15} /><span>随机、时限、合法操作与最终计分都以服务端权威状态为准。</span></div>
      <div className="sn-guide-actions"><ActionButton disabled={guide.isFirst} onClick={guide.previous}><ArrowLeft size={14} />上一章</ActionButton>
        <ActionButton variant="primary" onClick={() => guide.isLast ? navigate('/game/sixnimmt') : guide.next()}>
          {guide.isLast ? '进入大厅' : '下一章'}<ArrowRight size={15} /></ActionButton></div>
    </section></div></div></AppShell>;
}

export function My() {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('sixnimmt');
  const history = useGameHistory({ gameType: 'sixnimmt', pageSize: 20 });
  const logout = useGameLogout();
  const [panel, setPanel] = useState<'logout' | 'about'>();
  const handleLogout = useCallback(async () => { await logout.run(); }, [logout]);
  const loading = profile.loading && !profile.data || stats.loading && !stats.data || history.loading && !history.games.length;
  if (isMobile) {
    const historyItems = history.games.map(game => {
      const me = game.players?.find(player =>
        String(player.userID) === String(profile.data?.id));
      return {
        id: String(game.id),
        title: game.roomDisplayName || `牌桌 ${game.roomID}`,
        detail: `${me?.isWinner ? '本场获胜' : `最终第 ${me?.finalRank ?? '—'} 名`
        } · ${me?.finalScore ?? 0} 牛头 · ${
          Math.max(0, Math.round(game.durationSeconds / 60))} 分钟`,
        accessory: game.endedAt ? '回放' : '进行中',
        href: game.endedAt ? `/game/sixnimmt/replay/${game.id}` : undefined,
      };
    });
    return <AppShell title="我的牌局" profile={profile.data} compactMobileFooter>
      {loading
        ? <SixNimmtLoading title="正在整理你的牧场档案。"
          description="同步身份、战绩与历史对局" />
        : <GameMobileProfile
          avatar={<PlayerAvatar name={profile.data?.name || '牧场玩家'}
            avatar={profile.data?.avatar} size={60} />}
          eyebrow="ONLINE HERD KEEPER"
          name={profile.data?.name || '牧场玩家'}
          playerID={profile.data?.id ?? '—'}
          email={profile.data?.email}
          stats={[
            { label: '完成对局', value: stats.data?.totalGames ?? 0 },
            { label: '胜场', value: stats.data?.wins ?? 0 },
            { label: '平均牛头', value: (stats.data?.avgScore ?? 0).toFixed(1) },
          ]}
          historyTitle="牌局档案"
          historyItems={historyItems}
          emptyHistory={<Feedback>第一桌故事，还没开始。
            <Link to="/game/sixnimmt">进入大厅</Link>
          </Feedback>}
          historyFooter={history.hasMore && <ActionButton
            disabled={history.loading} onClick={history.loadMore}>
            {history.loading ? '载入中…' : '加载更多对局'}
          </ActionButton>}
          logoutPending={logout.pending} logoutError={logout.error}
          onLogout={() => setPanel('logout')}
          onAbout={() => setPanel('about')}
        />}
      {panel === 'about' && <GameMobileAboutDialog gameName="6 nimmt!"
        avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        themeClassName="sixnimmt-root"
        onClose={() => setPanel(undefined)} />}
      {panel === 'logout' && <Dialog title="离开当前账号？"
        eyebrow="SIGN OUT" onClose={() => setPanel(undefined)}
        footer={<><ActionButton onClick={() => setPanel(undefined)}>取消</ActionButton>
          <ActionButton variant="danger" pending={logout.pending}
            onClick={handleLogout}>退出登录</ActionButton></>}>
        <p>退出不会删除线上战绩与历史回放，下次登录后仍可查看。</p>
      </Dialog>}
    </AppShell>;
  }
  return <AppShell title="我的牌局" profile={profile.data} compactMobileFooter><div className="sn-community sn-profile-page">
    <header className="sn-community-heading"><div><span className="sn-eyebrow">YOUR TABLE STORIES</span>
      <h1>每一桌，都有点小故事。</h1></div></header>
    {loading ? <SixNimmtLoading title="正在整理你的牧场档案。" description="同步身份、战绩与历史对局" /> : <div className="sn-profile-layout">
      <section className="sn-profile-display">
        <div className="sn-profile-identity">
          <PlayerAvatar name={profile.data?.name || '牧场玩家'} avatar={profile.data?.avatar} size={72} />
          <div><small className="sn-profile-eyebrow">ONLINE HERD KEEPER</small>
            <h2>{profile.data?.name || '牧场玩家'}</h2>
            <span>PLAYER ID · {profile.data?.id ?? '—'}</span></div>
        </div>
        <div className="sn-profile-email"><Mail size={14} />{profile.data?.email || '邮箱未绑定'}</div>
        <div className="sn-profile-stats"><span><b>{stats.data?.totalGames ?? 0}</b><small>完成对局</small></span>
          <span><b>{stats.data?.wins ?? 0}</b><small>胜场</small></span>
          <span><b>{(stats.data?.avgScore ?? 0).toFixed(1)}</b><small>平均牛头</small></span></div>
        <div className="sn-profile-manage"><a href="https://auth.gamebus.online/profile"><Pencil size={14} />编辑资料</a>
          <button type="button" onClick={() => setPanel('logout')}><LogOut size={14} />退出登录</button></div>
        {logout.error && <p role="alert" className="sn-profile-logout-error">{logout.error}</p>}
      </section>
      <section className="sn-history"><header><h2>牌局档案</h2><span>{stats.data?.totalGames ?? 0} 场</span></header>
        {history.error && <Feedback error>{history.error}<ActionButton onClick={history.retry}>重试</ActionButton></Feedback>}
        {history.games.map(game => {
          const me = game.players?.find(player => String(player.userID) === String(profile.data?.id));
          return <article key={game.id}><span><Bull size={20} /></span><div><b>{game.roomDisplayName || `牌桌 ${game.roomID}`}</b>
            <small>{new Date(game.startedAt).toLocaleString('zh-CN')} · {Math.max(0, Math.round(game.durationSeconds / 60))} 分钟</small>
            <small>{me?.isWinner ? '本场获胜' : `最终第 ${me?.finalRank ?? '—'} 名`} · {me?.finalScore ?? 0} 牛头</small></div>
            {game.endedAt ? <Link to={`/game/sixnimmt/replay/${game.id}`}>全知回放<ArrowRight size={14} /></Link> : <em>进行中</em>}</article>;
        })}
        {!history.loading && !history.error && !history.games.length && <div className="sn-empty"><Bull size={30} />
          <h3>第一桌故事，还没开始。</h3><p>完成一场对局后，结果和回放会留在这里。</p>
          <Link to="/game/sixnimmt">进入大厅<ArrowRight size={14} /></Link></div>}
        {history.hasMore && <ActionButton disabled={history.loading} onClick={history.loadMore}>{history.loading ? '载入中…' : '加载更多对局'}</ActionButton>}
      </section></div>}
    <button className="sn-about-entry" type="button" onClick={() => setPanel('about')}><span><Info size={16} /></span>
      <span><b>关于与联系</b><small>项目作者、源码与联系方式</small></span><ChevronRight size={16} /></button>
    {panel === 'logout' && <Dialog title="离开当前账号？" eyebrow="SIGN OUT" onClose={() => setPanel(undefined)}
      footer={<><ActionButton onClick={() => setPanel(undefined)}>取消</ActionButton><ActionButton variant="danger" pending={logout.pending} onClick={handleLogout}>退出登录</ActionButton></>}>
      <p>退出不会删除线上战绩与历史回放，下次登录后仍可查看。</p></Dialog>}
    {panel === 'about' && <Dialog title="关于 6 nimmt! Online" eyebrow="ABOUT & CONTACT" onClose={() => setPanel(undefined)}
      footer={<ActionButton onClick={() => setPanel(undefined)}>知道了<Check size={14} /></ActionButton>}>
      <ProjectContact gameName="6 nimmt!" avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        classes={{ intro: 'sn-contact-intro', links: 'sn-contact-links', legal: 'sn-contact-legal' }} />
      <p className="sn-legal-note"><ShieldCheck size={13} />规则设计：Wolfgang Kramer · 基础规则发行：AMIGO</p></Dialog>}
  </div></AppShell>;
}
