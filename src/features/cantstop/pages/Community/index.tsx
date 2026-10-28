import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Info, Layers3,
  Lightbulb, LogOut, Pencil, ShieldCheck, Trophy, Users,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
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
import type { LeaderboardSortDim, CantStopLeaderboardEntry } from '@/features/game-core/model/history';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import campArt from '../../assets/camp.webp';
import { AppShell, Bull, PlayerAvatar } from '../../components/AppShell';
import { NumberCard } from '../../components/Card';
import { Dialog } from '../../components/Dialog';
import { CantStopLoading } from '../../components/LoadingState';
import { columnHeight } from '../../model/board';

const isRankEntry = (entry: CantStopLeaderboardEntry | { totalGames: number }): entry is CantStopLeaderboardEntry => 'winRate' in entry;

export function Rankings() {
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'rank' | 'games'>('rank');
  const sentinel = useRef<HTMLDivElement>(null);
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const leaderboard = useGameLeaderboard<CantStopLeaderboardEntry>({ gameType: 'cantstop', pageSize: 20, sort, isEntry: isRankEntry });
  useInfiniteLoad(sentinel, leaderboard.entries.length > 0 && leaderboard.hasMore && !leaderboard.loading && !leaderboard.error, leaderboard.loadMore);
  const myIndex = leaderboard.entries.findIndex(entry => String(entry.userID) === String(profile.data?.id));
  return <AppShell title="登顶排行" profile={profile.data}><div className="cs-community cs-rankings">
    <header className="cs-community-heading"><div><span className="cs-eyebrow">THREE SUMMITS. ONE WINNER.</span>
      <h1>每一桌，都算数。</h1></div><span>真实完成对局</span></header>
    <section className="cs-rank-hero"><Trophy size={35} /><div><small>CAN'T STOP LEADERBOARD</small>
      <h2>山路登顶榜</h2><p>用胜场与胜率衡量稳定发挥，也记录每一场完整线上对局。</p></div>
      <aside><span>我的排名</span><b>{myIndex >= 0 ? `#${myIndex + 1}` : '—'}</b>
        <small>{myIndex >= 0 ? `胜率 ${(leaderboard.entries[myIndex].winRate * 100).toFixed(1)}%` : '完成一场后进入排行'}</small></aside></section>
    <section className="cs-rank-panel">
      <GameTabs ariaLabel="排行榜模式" value={mode} onChange={setMode} className="cs-tabs" activeClassName="active"
        items={[{ value: 'rank', label: '胜率' }, { value: 'games', label: '完成场次' }]} />
      <div className="cs-rank-row head"><span>名次</span><span>玩家</span><span>胜场 / 对局</span><span>胜率</span></div>
      {leaderboard.loading && !leaderboard.entries.length && <CantStopLoading title="正在整理山路榜单。" description="同步最新完成对局" />}
      {leaderboard.error && !leaderboard.entries.length && <Feedback error>{leaderboard.error}<ActionButton onClick={leaderboard.retry}>重试</ActionButton></Feedback>}
      {leaderboard.entries.map((entry, index) => {
        const mine = String(entry.userID) === String(profile.data?.id);
        return <div className={`cs-rank-row ${mine ? 'self' : ''}`} key={entry.userID}>
          <span>{index === 0 ? <Trophy size={20} /> : String(index + 1).padStart(2, '0')}</span>
          <span><PlayerAvatar name={entry.displayName}
            avatar={mine ? profile.data?.avatar : undefined} size={36} />
            <b>{entry.displayName}</b>{mine && <em>你</em>}</span>
          <span>{entry.wins}<small> / {entry.totalGames}</small></span><strong>{(entry.winRate * 100).toFixed(1)}%</strong></div>;
      })}
      {!leaderboard.loading && !leaderboard.error && !leaderboard.entries.length && <div className="cs-empty"><Trophy size={30} />
        <h3>榜单还在等待第一位登顶者。</h3><p>完成一场线上对局后，真实成绩会出现在这里。</p></div>}
      <div ref={sentinel} className="cs-infinite">{leaderboard.loading && !!leaderboard.entries.length && '继续加载中…'}
        {!leaderboard.loading && !leaderboard.hasMore && !!leaderboard.entries.length && '已经到底了'}</div>
    </section></div></AppShell>;
}

const guideSteps = [
  { tab: '掷骰', eyebrow: '01 / ROLL FOUR DICE', title: '四枚骰子，三种配对。', text: '每回合同时掷出四枚六面骰，再把它们两两分组。每组点数和对应 2 到 12 号路线。', points: ['四枚骰子固定有三种配对方式。', '同一个点数出现两次时，会在同一路线前进两步。', '掷骰后不能直接收手，必须先完成一个合法配对。'] },
  { tab: '路线', eyebrow: '02 / THREE RUNNERS', title: '每回合最多三条路线。', text: '临时攀登者代表本回合尚未保存的进度。一个回合里最多只能启用三条不同路线。', points: ['已有临时标记的路线可以继续前进。', '三条路线已满后，不能开启第四条新路线。', '服务端会过滤出所有合法配对方案。'] },
  { tab: '收手', eyebrow: '03 / BANK OR BUST', title: '再高一点，还是见好就收。', text: '成功推进后，可以继续掷骰，也可以收手保存本回合进度。若下一掷没有任何合法配对，本回合临时进度全部失去。', points: ['失手不会清除之前已经保存的进度。', '收手后进度才真正落袋。', '真人阶段固定 60 秒，超时由公平 AI 代为执行。'] },
  { tab: '登顶', eyebrow: '04 / CLAIM A COLUMN', title: '到顶之后，还要收手。', text: '临时标记到达路线终点，只是暂时登顶。选择收手后才正式占领该路线，并关闭这条路线。', points: ['被占领的路线所有人都不能再使用。', '其他玩家在该路线的已保存进度会被移除。', '率先占领三条路线的玩家立即获胜。'] },
  { tab: '公平', eyebrow: '05 / SERVER AUTHORITY', title: '骰子、合法操作和结算都在服务端。', text: '前端只展示权威状态并提交玩家选择；骰子、路线推进、失手、收手和历史回放均由服务端记录。', points: ['断线后可以通过原房间重连。', 'AI 与超时动作会在行动日志中标记。', '历史回放直接使用服务端快照。'] },
] as const;

export function Guide() {
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const guide = useGuideSteps(guideSteps);
  const step = guide.current;
  return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter><div className="cs-community cs-guide">
    <header className="cs-community-heading"><div><span className="cs-eyebrow">THE RULES, WITHOUT THE RULEBOOK</span>
      <h1>三分钟，读懂这座山。</h1></div></header>
    <div className="cs-guide-layout"><aside><img src={campArt} alt="山路、骰子与登顶旗帜" />
      <div><span><Users size={17} />2–4 人</span><span><Clock3 size={17} />约 20 分钟</span><span><Layers3 size={17} />11 条路线</span></div>
    </aside><section>
      <GameTabs ariaLabel="玩法章节" value={guide.index} onChange={guide.select} className="cs-tabs" activeClassName="active"
        items={guideSteps.map((item, index) => ({ value: index, label: `${String(index + 1).padStart(2, '0')} ${item.tab}` }))} />
      <small className="cs-eyebrow">{step.eyebrow}</small><h2>{step.title}</h2><p>{step.text}</p>
      <ol>{step.points.map(point => <li key={point}>{point}</li>)}</ol>
      {guide.index === 0 && <div className="cs-guide-sixth">{[2, 3, 4, 5].map(value => <NumberCard key={value} value={value} compact />)}
        <ArrowRight size={20} /><span><Bull size={20} /><b>配成两组路线</b></span></div>}
      {guide.index === 1 && <div className="cs-guide-rows">{[6, 7, 8].map((route, index) => <span key={route} className={route === 7 ? 'right' : ''}>
        <b>攀登者 {index + 1}</b><NumberCard value={route} compact />
        <small>{columnHeight(route)} 阶路线</small>{route === 7 && <Check size={14} />}</span>)}</div>}
      {guide.index === 3 && <div className="cs-point-guide">{[2, 5, 7, 9, 12].map(value => <span key={value}>
        <NumberCard value={value} /><b>{columnHeight(value)} 阶</b></span>)}</div>}
      <div className="cs-guide-hint"><Lightbulb size={15} /><span>随机、时限、合法操作与最终计分都以服务端权威状态为准。</span></div>
      <div className="cs-guide-actions"><ActionButton disabled={guide.isFirst} onClick={guide.previous}><ArrowLeft size={14} />上一章</ActionButton>
        <ActionButton variant="primary" onClick={() => guide.isLast ? navigate('/game/cantstop') : guide.next()}>
          {guide.isLast ? '进入大厅' : '下一章'}<ArrowRight size={15} /></ActionButton></div>
    </section></div></div></AppShell>;
}

export function My() {
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('cantstop');
  const history = useGameHistory({ gameType: 'cantstop', pageSize: 20 });
  const logout = useGameLogout();
  const [panel, setPanel] = useState<'logout' | 'about'>();
  const handleLogout = useCallback(async () => { await logout.run(); }, [logout]);
  const loading = profile.loading && !profile.data || stats.loading && !stats.data || history.loading && !history.games.length;
  return <AppShell title="我的牌局" profile={profile.data} compactMobileFooter><div className="cs-community cs-profile-page">
    <header className="cs-community-heading"><div><span className="cs-eyebrow">YOUR TABLE STORIES</span>
      <h1>每一桌，都有点小故事。</h1></div></header>
    {loading ? <CantStopLoading title="正在整理你的山路档案。" description="同步身份、战绩与历史对局" /> : <div className="cs-profile-layout">
      <section className="cs-profile-card cs-profile-detail"><img src={campArt} alt="" />
        <PlayerAvatar name={profile.data?.name || '山路玩家'} avatar={profile.data?.avatar} size={72} />
        <span className="cs-eyebrow">ONLINE CLIMBER</span><h2>{profile.data?.name || '山路玩家'}</h2>
        <p>PLAYER ID · {profile.data?.id ?? '—'}</p><dl>
          <span><b>{stats.data?.totalGames ?? 0}</b><small>完成对局</small></span>
          <span><b>{stats.data?.wins ?? 0}</b><small>胜场</small></span>
          <span><b>{(stats.data?.avgScore ?? 0).toFixed(1)}</b><small>平均占列</small></span></dl>
        <nav><a href="https://auth.gamebus.online/profile"><Pencil size={14} />编辑资料</a>
          <button type="button" onClick={() => setPanel('logout')}><LogOut size={14} />退出登录</button></nav></section>
      <section className="cs-history"><header><h2>牌局档案</h2><span>{stats.data?.totalGames ?? 0} 场</span></header>
        {history.error && <Feedback error>{history.error}<ActionButton onClick={history.retry}>重试</ActionButton></Feedback>}
        {history.games.map(game => {
          const me = game.players?.find(player => String(player.userID) === String(profile.data?.id));
          return <article key={game.id}><span><Bull size={20} /></span><div><b>{game.roomDisplayName || `牌桌 ${game.roomID}`}</b>
            <small>{new Date(game.startedAt).toLocaleString('zh-CN')} · {Math.max(0, Math.round(game.durationSeconds / 60))} 分钟</small>
            <small>{me?.isWinner ? '本场获胜' : `最终第 ${me?.finalRank ?? '—'} 名`} · {me?.finalScore ?? 0} 条路线</small></div>
            {game.endedAt ? <Link to={`/game/cantstop/replay/${game.id}`}>全知回放<ArrowRight size={14} /></Link> : <em>进行中</em>}</article>;
        })}
        {!history.loading && !history.error && !history.games.length && <div className="cs-empty"><Bull size={30} />
          <h3>第一桌故事，还没开始。</h3><p>完成一场对局后，结果和回放会留在这里。</p>
          <Link to="/game/cantstop">进入大厅<ArrowRight size={14} /></Link></div>}
        {history.hasMore && <ActionButton disabled={history.loading} onClick={history.loadMore}>{history.loading ? '载入中…' : '加载更多对局'}</ActionButton>}
      </section></div>}
    <button className="cs-about-entry" type="button" onClick={() => setPanel('about')}><span><Info size={16} /></span>
      <span><b>关于与联系</b><small>项目作者、源码与联系方式</small></span><ChevronRight size={16} /></button>
    {panel === 'logout' && <Dialog title="离开当前账号？" eyebrow="SIGN OUT" onClose={() => setPanel(undefined)}
      footer={<><ActionButton onClick={() => setPanel(undefined)}>取消</ActionButton><ActionButton variant="danger" pending={logout.pending} onClick={handleLogout}>退出登录</ActionButton></>}>
      <p>退出不会删除线上战绩与历史回放，下次登录后仍可查看。</p></Dialog>}
    {panel === 'about' && <Dialog title="关于 CAN'T STOP Online" eyebrow="ABOUT & CONTACT" onClose={() => setPanel(undefined)}
      footer={<ActionButton onClick={() => setPanel(undefined)}>知道了<Check size={14} /></ActionButton>}>
      <ProjectContact gameName="CAN'T STOP" avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        classes={{ intro: 'cs-contact-intro', links: 'cs-contact-links', legal: 'cs-contact-legal' }} />
      <p className="cs-legal-note"><ShieldCheck size={13} />规则设计：Sid Sackson · 本站仅为在线规则实现</p></Dialog>}
  </div></AppShell>;
}
