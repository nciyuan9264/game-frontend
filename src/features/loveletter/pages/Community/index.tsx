import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ChevronRight, Clock3, Heart, Info,
  Layers3, LogOut, Mail, Pencil, ShieldCheck, Trophy, Users,
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
import type {
  LeaderboardSortDim,
  LoveLetterLeaderboardEntry,
} from '@/features/game-core/model/history';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { Dialog } from '../../components/Dialog';
import { LoveLetterLoading } from '../../components/LoadingState';
import { PlayingCard, Portrait } from '../../components/Card';
import { ROLES, goalFor } from '../../model/roles';
import stillLife from '../../assets/still-life.webp';

const isRankEntry = (
  entry: LoveLetterLeaderboardEntry | { totalGames: number },
): entry is LoveLetterLeaderboardEntry => 'avgRank' in entry;

export function Rankings() {
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'rank' | 'games'>('rank');
  const sentinel = useRef<HTMLDivElement>(null);
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const leaderboard = useGameLeaderboard<LoveLetterLeaderboardEntry>({
    gameType: 'loveletter',
    pageSize: 20,
    sort,
    isEntry: isRankEntry,
  });
  useInfiniteLoad(
    sentinel,
    leaderboard.entries.length > 0 && leaderboard.hasMore
      && !leaderboard.loading && !leaderboard.error,
    leaderboard.loadMore,
  );
  const myIndex = leaderboard.entries.findIndex(entry =>
    String(entry.userID) === String(profile.data?.id));

  return <AppShell title="心意排行" profile={profile.data}>
    <div className="ll-community ll-rankings">
      <header className="ll-community-heading"><div>
        <span className="ll-eyebrow">THE COURT REMEMBERS</span>
        <h1>每一封信，都算数。</h1></div><span>真实完成对局</span></header>
      <section className="ll-rank-hero"><Trophy size={35} /><div>
        <small>PALM LETTER LEADERBOARD</small><h2>宫廷执笔人榜</h2>
        <p>用平均名次衡量稳定发挥，也记录每一场完整的好感赛。</p></div>
        <aside><span>我的排名</span><b>{myIndex >= 0 ? `#${myIndex + 1}` : '—'}</b>
          <small>{myIndex >= 0
            ? `平均名次 ${leaderboard.entries[myIndex].avgRank.toFixed(2)}`
            : '完成一场后进入排行'}</small></aside></section>
      <section className="ll-rank-panel">
        <GameTabs ariaLabel="排行榜模式" value={mode} onChange={setMode}
          className="ll-tabs" activeClassName="active"
          items={[{ value: 'rank', label: '平均名次' }, { value: 'games', label: '完成场次' }]} />
        <div className="ll-rank-row head"><span>名次</span><span>玩家</span>
          <span>完成对局</span><span>平均名次</span></div>
        {leaderboard.loading && !leaderboard.entries.length
          && <LoveLetterLoading title="正在整理宫廷名册。" description="同步最新完成对局" />}
        {leaderboard.error && !leaderboard.entries.length
          && <Feedback error>{leaderboard.error}
            <ActionButton onClick={leaderboard.retry}>重试</ActionButton></Feedback>}
        {leaderboard.entries.map((entry, index) => {
          const mine = String(entry.userID) === String(profile.data?.id);
          return <div className={`ll-rank-row ${mine ? 'self' : ''}`} key={entry.userID}>
            <span>{index === 0 ? <Trophy size={20} /> : String(index + 1).padStart(2, '0')}</span>
            <span><PlayerAvatar name={entry.displayName} size={36} />
              <b>{entry.displayName}</b>{mine && <em>你</em>}</span>
            <span>{entry.totalGames}<small>场</small></span>
            <strong>{entry.avgRank.toFixed(2)}</strong></div>;
        })}
        {!leaderboard.loading && !leaderboard.error && !leaderboard.entries.length
          && <div className="ll-empty"><Trophy size={30} />
            <h3>榜单还在等待第一封信。</h3><p>完成一场线上对局后，真实成绩会出现在这里。</p></div>}
        <div ref={sentinel} className="ll-infinite">
          {leaderboard.loading && !!leaderboard.entries.length && '继续加载中…'}
          {!leaderboard.loading && !leaderboard.hasMore
            && !!leaderboard.entries.length && '已经到底了'}</div>
      </section>
    </div>
  </AppShell>;
}

const guideSteps = [
  {
    tab: '上手',
    eyebrow: '01 / HOW TO PLAY',
    title: '摸一张，打出一张。',
    text: '每轮开始时，每人持有 1 张牌。轮到你时先摸 1 张，再从两张中打出 1 张并结算角色效果。',
    points: ['成为本轮唯一未出局者即可获胜。', '牌堆耗尽时，未出局者比较手牌点数。', '最高点数相同则共同获胜，各得 1 枚好感。'],
  },
  {
    tab: '角色',
    eyebrow: '02 / TEN CONFIDANTS',
    title: '十位角色，十种心意。',
    text: '21 张牌包含密探到公主十种角色。点数决定轮末比较，效果决定你如何留在局中。',
    points: ['卫兵不能猜卫兵，但可以猜密探。', '神父与男爵的具体牌值只对相关玩家可见。', '侍女保护持续到本人下一个回合开始。'],
  },
  {
    tab: '特殊',
    eyebrow: '03 / UNSPOKEN RULES',
    title: '有些选择，不只看点数。',
    text: '伯爵夫人、公主、大臣和王子会改变普通的摸一张、打一张节奏。',
    points: ['伯爵夫人与王子或国王同持时，必须打出伯爵夫人。', '公主只要被弃掉，持有者立即出局。', '大臣保留一张，其余按选择顺序放回牌堆底。'],
  },
  {
    tab: '好感',
    eyebrow: '04 / FAVORS & VICTORY',
    title: '把心意，一枚一枚收好。',
    text: '一场线上对局由多轮组成。达到人数对应的好感目标，即赢得整场。',
    points: ['2 / 3 / 4 / 5–6 人目标分别为 6 / 5 / 4 / 3。', '唯一使用过密探且仍存活的玩家额外获得 1 枚好感。', '同一轮多人达到目标时，可以共同赢得整场。'],
  },
] as const;

export function Guide() {
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const guide = useGuideSteps(guideSteps);
  const [detail, setDetail] = useState<number>();
  const step = guide.current;
  return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter>
    <div className="ll-community ll-guide">
      <header className="ll-community-heading"><div>
        <span className="ll-eyebrow">A GUIDE TO THE COURT</span>
        <h1>读懂规则，也读懂人心。</h1></div></header>
      <div className="ll-guide-layout"><aside>
        <img src={stillLife} alt="信件、玫瑰与缎带" />
        <div><span><Users size={17} />2–6 人</span><span><Clock3 size={17} />约 20 分钟</span>
          <span><Layers3 size={17} />21 张牌</span></div>
      </aside><section>
        <GameTabs ariaLabel="玩法章节" value={guide.index} onChange={guide.select}
          className="ll-tabs" activeClassName="active"
          items={guideSteps.map((item, index) => ({
            value: index,
            label: `${String(index + 1).padStart(2, '0')} ${item.tab}`,
          }))} />
        <small className="ll-eyebrow">{step.eyebrow}</small><h2>{step.title}</h2>
        <p>{step.text}</p><ol>{step.points.map(point => <li key={point}>{point}</li>)}</ol>
        {guide.index === 1 && <div className="ll-guide-roles">{ROLES.map(item =>
          <button type="button" key={item.rank} onClick={() => setDetail(item.rank)}>
            <Portrait rank={item.rank} /><span><b>{item.rank} · {item.name}</b>
              <small>{item.short}</small></span><i>×{item.count}</i></button>)}</div>}
        {guide.index === 3 && <div className="ll-goals">{[2, 3, 4, 5, 6].map(players =>
          <span key={players}><small>{players} 人局</small><Heart size={13} />
            <b>{goalFor(players)}</b><em>枚好感</em></span>)}</div>}
        <div className="ll-guide-hint"><ShieldCheck size={15} />
          <span>本页对应当前在线的 21 张牌新版；随机、计时和合法操作以服务端为准。</span></div>
        <ActionButton variant="primary" onClick={() =>
          guide.isLast ? navigate('/game/loveletter') : guide.next()}>
          {guide.isLast ? '进入大厅' : '下一章'}<ArrowRight size={15} /></ActionButton>
      </section></div>
      {detail != null && <Dialog title={`${ROLES[detail].name} · 角色详情`}
        onClose={() => setDetail(undefined)}><div className="ll-card-detail">
        <PlayingCard rank={detail} /><div><span className="ll-eyebrow">{ROLES[detail].en}</span>
          <h2>{ROLES[detail].verb}，是一种选择。</h2><p>{ROLES[detail].effect}</p>
          <small>点数 {detail} · 共 {ROLES[detail].count} 张</small></div></div>
      </Dialog>}
    </div>
  </AppShell>;
}

export function My() {
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('loveletter');
  const history = useGameHistory({ gameType: 'loveletter', pageSize: 20 });
  const logout = useGameLogout();
  const [panel, setPanel] = useState<'logout' | 'about'>();
  const handleLogout = useCallback(async () => {
    await logout.run();
  }, [logout]);
  const loading = profile.loading && !profile.data
    || stats.loading && !stats.data
    || history.loading && !history.games.length;
  return <AppShell title="我的信件" profile={profile.data} compactMobileFooter>
    <div className="ll-community ll-profile">
      <header className="ll-community-heading"><div>
        <span className="ll-eyebrow">LETTERS WORTH KEEPING</span>
        <h1>寄出的信，都有回音。</h1></div></header>
      {loading ? <LoveLetterLoading title="正在整理你的信件档案。"
        description="同步身份、战绩与历史对局" /> : <div className="ll-profile-layout">
        <section className="ll-profile-display">
          <div className="ll-profile-identity">
            <PlayerAvatar name={profile.data?.name || '执笔人'}
              avatar={profile.data?.avatar} size={72} />
            <div><small className="ll-profile-eyebrow">ONLINE LETTER KEEPER</small>
              <h2>{profile.data?.name || '执笔人'}</h2>
              <span>PLAYER ID · {profile.data?.id ?? '—'}</span></div>
          </div>
          <div className="ll-profile-email"><Mail size={14} />{profile.data?.email || '邮箱未绑定'}</div>
          <div className="ll-profile-stats"><span><b>{stats.data?.totalGames ?? 0}</b><small>完成对局</small></span>
            <span><b>{stats.data?.wins ?? 0}</b><small>胜场</small></span>
            <span><b>{(stats.data?.avgScore ?? 0).toFixed(1)}</b><small>平均好感</small></span></div>
          <div className="ll-profile-manage"><a href="https://auth.gamebus.online/profile"><Pencil size={14} />编辑资料</a>
            <button type="button" disabled={logout.pending} onClick={() => setPanel('logout')}>
              <LogOut size={14} />退出登录</button></div>
          {logout.error && <p role="alert" className="ll-profile-logout-error">{logout.error}</p>}
        </section>
        <section className="ll-history"><header><h2>信件档案</h2>
          <span>{stats.data?.totalGames ?? 0} 场</span></header>
          {history.error && <Feedback error>{history.error}
            <ActionButton onClick={history.retry}>重试</ActionButton></Feedback>}
          {history.games.map(game => {
            const me = game.players?.find(player =>
              String(player.userID) === String(profile.data?.id));
            return <article key={game.id}><span><Mail size={19} /></span><div>
              <b>{game.roomDisplayName || `庭院 ${game.roomID}`}</b>
              <small>{new Date(game.startedAt).toLocaleString('zh-CN')} · {
                Math.max(0, Math.round(game.durationSeconds / 60))} 分钟</small>
              <small>{me?.isWinner ? '本场获胜' : `最终第 ${me?.finalRank ?? '—'} 名`}
                {' · '}{me?.finalScore ?? 0} 枚好感</small></div>
              {game.endedAt
                ? <Link to={`/game/loveletter/replay/${game.id}`}>全知回放<ArrowRight size={14} /></Link>
                : <em>进行中</em>}</article>;
          })}
          {!history.loading && !history.error && !history.games.length
            && <div className="ll-empty"><Mail size={30} />
              <h3>第一封信，等你落笔。</h3><p>完成一场对局后，结果和回放会留在这里。</p>
              <Link to="/game/loveletter">进入大厅<ArrowRight size={14} /></Link></div>}
          {history.hasMore && <ActionButton disabled={history.loading}
            onClick={history.loadMore}>{history.loading ? '载入中…' : '加载更多对局'}</ActionButton>}
        </section></div>}
      <button className="ll-about-entry" type="button" onClick={() => setPanel('about')}>
        <span><Info size={16} /></span><span><b>关于与联系</b>
          <small>项目作者、源码与联系方式</small></span><ChevronRight size={16} /></button>
      {panel === 'logout' && <Dialog title="离开当前账号？" eyebrow="SIGN OUT"
        onClose={() => setPanel(undefined)}
        footer={<><ActionButton onClick={() => setPanel(undefined)}>取消</ActionButton>
          <ActionButton variant="danger" pending={logout.pending}
            onClick={handleLogout}>退出登录</ActionButton></>}>
        <p>退出不会删除线上战绩与历史回放，下次登录后仍可查看。</p>
      </Dialog>}
      {panel === 'about' && <Dialog title="关于掌心密信 Online"
        eyebrow="ABOUT & CONTACT" onClose={() => setPanel(undefined)}
        footer={<ActionButton onClick={() => setPanel(undefined)}>知道了</ActionButton>}>
        <ProjectContact gameName="掌心密信"
          avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
          classes={{ intro: 'll-contact-intro', links: 'll-contact-links', legal: 'll-contact-legal' }} />
      </Dialog>}
    </div>
  </AppShell>;
}
