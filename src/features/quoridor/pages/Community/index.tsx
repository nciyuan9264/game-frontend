import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BrickWall, ChevronRight, Flag, Footprints, History,
  Info, LogOut, Mail, Pencil, Route, ShieldCheck, Trophy,
} from 'lucide-react';
import { ProjectContact } from '@/components/GameUI/ProjectContact';
import { getProfile } from '@/features/game-core/api/auth';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useGuideSteps } from '@/features/game-core/hooks/useGuideSteps';
import type {
  LeaderboardSortDim,
  QuoridorLeaderboardEntry,
} from '@/features/game-core/model/history';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { BrandMark, Pawn } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { QuoridorLoading } from '../../components/LoadingState';
import styles from './index.module.less';

const guideSteps = [
  { name: '目标与回合', title: '从自己的起点，走到对边。', copy: '标准棋盘为 9 × 9。双方从各自底边中央出发，各持 10 道围墙；每回合只能移动棋子或放置一道围墙。', note: '先手与南北方由服务端按局公平轮换，线上对局固定为 60 秒权威回合。' },
  { name: '围墙', title: '可以设障，不能绝路。', copy: '一墙横跨两格，可以横放或竖放，但不能与已有围墙重叠、交叉，也不能封死任一方到达对边的全部通路。', note: '客户端只展示服务端计算的墙位合法性与原因，不自行判定通路。' },
  { name: '相遇与跳跃', title: '相逢时，换一种走法。', copy: '两枚棋子迎面相邻且背后无墙时，可以直线跳过；背后被墙或边界阻挡时，才可从侧面斜向绕行。', note: '跳跃不会吃掉对手；能直跳时不能任意选择斜绕。' },
  { name: '抵达与胜负', title: '抵达的那一步，就是胜局。', copy: '第一个到达自己对边任意一格的棋手立即获胜，不比较余墙数量，也不用等待双方完成相同回合数。', note: '主动认输或回合超时后的自动行动同样由服务端写入正式棋谱。' },
] as const;

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className={styles.eyebrow}>{children}</span>;
}

export function Rankings() {
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'winRate' | 'games'>('winRate');
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const leaderboard = useGameLeaderboard<QuoridorLeaderboardEntry>({
    gameType: 'quoridor',
    pageSize: 50,
    sort,
  });
  const myIndex = leaderboard.entries.findIndex(entry =>
    String(entry.userID) === String(profile.data?.id));
  return <AppShell title="棋手排行" profile={profile.data}><div className={styles.page}>
    <header className={styles.title}><Eyebrow>THE QUIET MASTERS</Eyebrow>
      <h1>每一条路，都留下判断。</h1><p>按胜率或完成场次，看见稳定的棋手。</p></header>
    <section className={styles.rankHero} data-testid="quoridor-rank-hero"><BrandMark size={58} /><div><h2>QUORIDOR 棋手榜</h2>
      <p>我的排名 {myIndex >= 0 ? `#${myIndex + 1}` : '—'}</p></div></section>
    <section className={styles.panel}><div className={styles.tabs} role="tablist" aria-label="排行榜模式"><button type="button"
      role="tab" aria-selected={mode === 'winRate'} className={mode === 'winRate' ? styles.active : ''} onClick={() => setMode('winRate')}>胜率榜</button>
      <button type="button" role="tab" aria-selected={mode === 'games'} className={mode === 'games' ? styles.active : ''} onClick={() => setMode('games')}>场次榜</button></div>
      {leaderboard.loading && !leaderboard.entries.length && <QuoridorLoading title="正在整理棋手名册。" description="载入排行榜记录" />}
      {leaderboard.error && <Feedback error>{leaderboard.error}<ActionButton onClick={leaderboard.retry}>重试</ActionButton></Feedback>}
      <div className={`${styles.rankRow} ${styles.rankHead}`}><span>名次</span><span>棋手</span><span>完成对局</span><span>胜场</span><span>胜率</span></div>
      {leaderboard.entries.map((entry, index) => <div className={`${styles.rankRow} ${String(entry.userID) === String(profile.data?.id) ? styles.mine : ''}`} key={entry.userID}>
        <b>{String(index + 1).padStart(2, '0')}</b><span><PlayerAvatar name={entry.displayName} size={36} /><strong>{entry.displayName}</strong></span>
        <span>{entry.totalGames}</span><span>{entry.wins}</span><strong>{Math.round(entry.winRate * 100)}%</strong></div>)}
      {!leaderboard.loading && !leaderboard.entries.length && <Feedback>暂时还没有排名记录。</Feedback>}
    </section>
  </div></AppShell>;
}

export function Guide() {
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const guide = useGuideSteps(guideSteps);
  const current = guide.current;
  return <AppShell title="玩法指南" profile={profile.data}><div className={styles.page}>
    <header className={styles.title}><Eyebrow>THE QUORIDOR HANDBOOK</Eyebrow>
      <h1>规则很短，路可以很长。</h1><p>四章读懂目标、围墙、跳跃与胜负。</p></header>
    <div className={styles.guideLayout}><section className={styles.guideVisual}
      data-testid="quoridor-guide-visual">
      <span>CHAPTER 0{guide.index + 1}</span>
      {guide.index === 0 && <div className={styles.openingLine}>
        <Pawn side="north" /><Route size={28} /><Pawn side="south" /></div>}
      {guide.index === 1 && <div className={styles.flipLine}>
        <Pawn side="south" /><BrickWall size={36} /><Pawn side="north" /></div>}
      {guide.index === 2 && <div className={styles.passLine}>
        <Pawn side="south" /><Footprints size={30} /><Pawn side="north" /></div>}
      {guide.index === 3 && <div className={styles.victoryLine}>
        <Pawn side="south" /><Route size={31} /><Trophy size={34} /></div>}
      <footer>QUORIDOR / CLASSIC <span>{guide.index + 1} / 4</span></footer></section>
      <section className={styles.guideCopy}><nav>{guideSteps.map((step, index) => <button type="button" key={step.name}
        className={guide.index === index ? styles.active : ''} onClick={() => guide.select(index)}>
        <span>0{index + 1}</span>{step.name}</button>)}</nav>
        <Eyebrow>{current.name}</Eyebrow><h2>{current.title}</h2><p>{current.copy}</p>
        <div><ShieldCheck size={22} /><p>{current.note}</p></div>
        <footer><button type="button" disabled={guide.isFirst} onClick={guide.previous}><ArrowLeft size={15} />上一步</button>
          <ActionButton variant="primary" onClick={() => guide.isLast ? navigate('/game/quoridor') : guide.next()}>
            {guide.isLast ? '返回大厅' : '下一步'}<ArrowRight size={16} /></ActionButton></footer></section></div>
  </div></AppShell>;
}

export function My() {
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('quoridor');
  const history = useGameHistory({ gameType: 'quoridor', pageSize: 20 });
  const logout = useGameLogout();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const loading = profile.loading && !profile.data
    || stats.loading && !stats.data
    || history.loading && !history.games.length;
  return <AppShell title="我的棋谱" profile={profile.data} compactMobileFooter><div className={`${styles.page} ${styles.profilePage}`}>
    <header className={styles.title}><Eyebrow>YOUR QUIET JOURNEY</Eyebrow>
      <h1>你的每一步，都值得回看。</h1><p>真实战绩、棋局结果与逐步回放。</p></header>
    {loading ? <QuoridorLoading title="正在整理你的棋谱。" description="同步身份、战绩与历史" />
      : <div className={styles.profileLayout}><aside className={styles.identity}>
        <div className={styles.identityHeader}><PlayerAvatar name={profile.data?.name ?? '棋手'}
          avatar={profile.data?.avatar} size={72} /><div><Eyebrow>THE QUORIDOR PLAYER</Eyebrow>
            <h2>{profile.data?.name || '棋手'}</h2>
            <span>PLAYER ID · {profile.data?.id ?? '—'}</span></div></div>
        <div className={styles.profileEmail}><Mail size={14} />{profile.data?.email || '邮箱未绑定'}</div>
        <div className={styles.profileStats}><b>{stats.data?.totalGames ?? 0}<small>对局</small></b>
          <b>{stats.data?.wins ?? 0}<small>胜场</small></b>
          <b>{Math.round((stats.data?.winRate ?? 0) * 100)}%<small>胜率</small></b></div>
        <div className={styles.profileActions}><a href="https://auth.gamebus.online/profile">
          <Pencil size={14} />编辑资料</a>
          <ActionButton variant="quiet" onClick={() => setLogoutOpen(true)}>
            <LogOut size={14} />退出登录</ActionButton></div></aside>
        <section className={styles.history}><header><History size={17} /><h2>过去的棋局</h2></header>
          {history.games.map(game => {
            const me = game.players?.find(player => String(player.userID) === String(profile.data?.id));
            return <article key={game.id}><span className={me?.isWinner ? styles.win : ''}>
              {me?.isWinner ? <Trophy size={16} /> : <Flag size={16} />}</span>
              <div><h3>房间 {game.roomID}</h3><p>{new Date(game.startedAt).toLocaleString('zh-CN')} · {Math.max(0, Math.round(game.durationSeconds / 60))} 分钟</p></div>
              <b>{me?.isWinner ? '胜' : '负'}<small>对局结果</small></b>
              {game.endedAt ? <Link to={`/game/quoridor/replay/${game.id}`} aria-label={`回放房间 ${game.roomID}`}><ArrowRight size={17} /></Link> : <i />}</article>;
          })}
          {history.error && <Feedback error>{history.error}<ActionButton onClick={history.retry}>重试</ActionButton></Feedback>}
          {!history.loading && !history.games.length && <Feedback>还没有对局记录。<Link to="/game/quoridor">去大厅开始第一局</Link></Feedback>}
          {history.hasMore && <ActionButton pending={history.loading} onClick={history.loadMore}>加载更多</ActionButton>}</section></div>}
    <button className={styles.aboutEntry} data-testid="quoridor-about-entry" type="button"
      onClick={() => setAboutOpen(true)}><span><Info size={17} /></span>
      <span><b>关于与联系</b><small>项目作者、源码与联系方式</small></span>
      <ChevronRight size={17} /></button>
    {aboutOpen && <Dialog title="关于 Quoridor Online" eyebrow="ABOUT & CONTACT"
      onClose={() => setAboutOpen(false)}
      footer={<ActionButton onClick={() => setAboutOpen(false)}>知道了</ActionButton>}>
      <ProjectContact gameName="Quoridor" avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        classes={{ intro: styles.aboutIntro, links: styles.aboutLinks, legal: styles.aboutLegal }} />
    </Dialog>}
    {logoutOpen && <Dialog title="离开当前账号？" eyebrow="SIGN OUT" onClose={() => setLogoutOpen(false)}
      footer={<><ActionButton onClick={() => setLogoutOpen(false)}>取消</ActionButton>
        <ActionButton variant="danger" pending={logout.pending} onClick={() => void logout.run()}>退出登录</ActionButton></>}>
      <p className={styles.dialogText}>退出不会删除棋谱与战绩，下次登录后仍可查看。</p>
      {logout.error && <Feedback error>{logout.error}</Feedback>}
    </Dialog>}
  </div></AppShell>;
}
