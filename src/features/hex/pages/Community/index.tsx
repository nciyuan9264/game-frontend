import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowLeftRight, ArrowRight, ChevronRight, CircleDot, Flag,
  Hexagon, History, Info, LogOut, Mail, Pencil, Route, ShieldCheck, Trophy,
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
  HexLeaderboardEntry,
} from '@/features/game-core/model/history';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { BrandMark, Stone } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { HexLoading } from '../../components/LoadingState';
import styles from './index.module.less';

const guideSteps = [
  { name: '目标与回合', title: '先连接，先抵达。', copy: '经典棋盘为 11 × 11。陶红连接南北两岸，湖绿连接东西两岸；双方轮流在任意空格放下一枚自己颜色的棋子。', note: '首局先手随机，后续对局轮换先手；每回合固定 60 秒，超时由服务端自动代下。' },
  { name: '六向相邻', title: '共用一条边，才算相连。', copy: '每个内部六角格有六个相邻格。路径可以转弯，但只靠近一个角点并不相连；棋子落定后不会移动，也不会被移除。', note: '客户端只提交落点，空格、回合归属与获胜路径均由服务端权威判断。' },
  { name: '交换规则', title: '后手，也有一次选择。', copy: '先手落下第一子后，后手可以正常落子，也可以交换双方颜色与目标边。首子留在原位，交换本身消耗这一手。', note: '线上对局始终启用 Pie rule，交换机会只在第一子之后出现一次。' },
  { name: '连接与胜负', title: '一条不断开的路，就是终点。', copy: '最先用同色棋子连通自己两条对边的一方立即获胜。Hex 不比较棋子数量，也不存在双方都无法获胜的平局。', note: '主动认输和超时托管都会写入正式棋谱，终局可逐手回放。' },
] as const;

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className={styles.eyebrow}>{children}</span>;
}

export function Rankings() {
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'winRate' | 'games'>('winRate');
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const leaderboard = useGameLeaderboard<HexLeaderboardEntry>({
    gameType: 'hex',
    pageSize: 50,
    sort,
  });
  const myIndex = leaderboard.entries.findIndex(entry =>
    String(entry.userID) === String(profile.data?.id));
  return <AppShell title="棋手排行" profile={profile.data}><div className={styles.page}>
    <header className={styles.title}><Eyebrow>THE QUIET MASTERS</Eyebrow>
      <h1>每一条路，都留下判断。</h1><p>按胜率或完成场次，看见稳定的棋手。</p></header>
    <section className={styles.rankHero} data-testid="hex-rank-hero"><BrandMark size={58} /><div><small>HEX LEADERBOARD</small><h2>HEX 棋手榜</h2>
      <p>我的排名 {myIndex >= 0 ? `#${myIndex + 1}` : '—'}</p></div></section>
    <section className={styles.panel}><div className={styles.tabs} role="tablist" aria-label="排行榜模式"><button type="button"
      role="tab" aria-selected={mode === 'winRate'} className={mode === 'winRate' ? styles.active : ''} onClick={() => setMode('winRate')}>胜率榜</button>
      <button type="button" role="tab" aria-selected={mode === 'games'} className={mode === 'games' ? styles.active : ''} onClick={() => setMode('games')}>场次榜</button></div>
      {leaderboard.loading && !leaderboard.entries.length && <HexLoading title="正在整理棋手名册。" description="载入排行榜记录" />}
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
  return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter><div className={`${styles.page} ${styles.guidePage}`}>
    <header className={styles.title}><Eyebrow>THE HEX HANDBOOK</Eyebrow>
      <h1>规则很短，路可以很长。</h1><p>四章读懂目标、相邻、交换与胜负。</p></header>
    <div className={styles.guideLayout}><section className={styles.guideVisual}
      data-testid="hex-guide-visual">
      <span>CHAPTER 0{guide.index + 1}</span>
      {guide.index === 0 && <div className={styles.openingLine}>
        <Stone side="red" /><Route size={28} /><Stone side="red" /></div>}
      {guide.index === 1 && <div className={styles.flipLine}>
        <Hexagon size={34} /><CircleDot size={29} /><Hexagon size={34} /></div>}
      {guide.index === 2 && <div className={styles.passLine}>
        <Stone side="red" /><ArrowLeftRight size={30} /><Stone side="teal" /></div>}
      {guide.index === 3 && <div className={styles.victoryLine}>
        <Stone side="teal" /><Route size={31} /><Trophy size={34} /></div>}
      <footer>HEX / CLASSIC <span>{guide.index + 1} / 4</span></footer></section>
      <section className={styles.guideCopy} data-testid="hex-guide-copy"><nav>{guideSteps.map((step, index) => <button type="button" key={step.name}
        className={guide.index === index ? styles.active : ''} onClick={() => guide.select(index)}>
        <span>0{index + 1}</span>{step.name}</button>)}</nav>
        <Eyebrow>{current.name}</Eyebrow><h2>{current.title}</h2><p>{current.copy}</p>
        <div><ShieldCheck size={22} /><p>{current.note}</p></div>
        <footer><button type="button" disabled={guide.isFirst} onClick={guide.previous}><ArrowLeft size={15} />上一步</button>
          <ActionButton variant="primary" onClick={() => guide.isLast ? navigate('/game/hex') : guide.next()}>
            {guide.isLast ? '返回大厅' : '下一步'}<ArrowRight size={16} /></ActionButton></footer></section></div>
  </div></AppShell>;
}

export function My() {
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('hex');
  const history = useGameHistory({ gameType: 'hex', pageSize: 20 });
  const logout = useGameLogout();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const loading = profile.loading && !profile.data
    || stats.loading && !stats.data
    || history.loading && !history.games.length;
  return <AppShell title="我的棋谱" profile={profile.data} compactMobileFooter><div className={`${styles.page} ${styles.profilePage}`}>
    <header className={styles.title}><Eyebrow>YOUR QUIET JOURNEY</Eyebrow>
      <h1>你的每一步，都值得回看。</h1><p>真实战绩、棋局结果与逐步回放。</p></header>
    {loading ? <HexLoading title="正在整理你的棋谱。" description="同步身份、战绩与历史" />
      : <div className={styles.profileLayout}><aside className={styles.identity}>
        <div className={styles.identityHeader}><PlayerAvatar name={profile.data?.name ?? '棋手'}
          avatar={profile.data?.avatar} size={72} /><div><Eyebrow>THE HEX PLAYER</Eyebrow>
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
              {game.endedAt ? <Link to={`/game/hex/replay/${game.id}`} aria-label={`回放房间 ${game.roomID}`}><ArrowRight size={17} /></Link> : <i />}</article>;
          })}
          {history.error && <Feedback error>{history.error}<ActionButton onClick={history.retry}>重试</ActionButton></Feedback>}
          {!history.loading && !history.games.length && <Feedback>还没有对局记录。<Link to="/game/hex">去大厅开始第一局</Link></Feedback>}
          {history.hasMore && <ActionButton pending={history.loading} onClick={history.loadMore}>加载更多</ActionButton>}</section></div>}
    <button className={styles.aboutEntry} data-testid="hex-about-entry" type="button"
      onClick={() => setAboutOpen(true)}><span><Info size={17} /></span>
      <span><b>关于与联系</b><small>项目作者、源码与联系方式</small></span>
      <ChevronRight size={17} /></button>
    {aboutOpen && <Dialog title="关于 Hex Online" eyebrow="ABOUT & CONTACT"
      onClose={() => setAboutOpen(false)}
      footer={<ActionButton onClick={() => setAboutOpen(false)}>知道了</ActionButton>}>
      <ProjectContact gameName="Hex" avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
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
