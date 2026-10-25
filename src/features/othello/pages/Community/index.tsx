import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Flag, History, LogOut, RotateCw,
  Settings2, ShieldCheck, SkipForward, Trophy,
} from 'lucide-react';
import { getProfile } from '@/features/game-core/api/auth';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useGuideSteps } from '@/features/game-core/hooks/useGuideSteps';
import type {
  LeaderboardSortDim,
  OthelloLeaderboardEntry,
} from '@/features/game-core/model/history';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { BrandMark, Disc } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { OthelloLoading } from '../../components/LoadingState';
import { useOthelloPreferences } from '../../hooks/useOthelloPreferences';
import styles from './index.module.less';

const guideSteps = [
  { name: '开局与落子', title: '从中心四子，走出第一步。', copy: '标准棋盘为 8 × 8，中央预置黑白各两子，黑方先行。每一步都必须落在能够夹住对方棋子的空格。', note: '线上棋盘只高亮服务端确认的合法落点，客户端不自行决定合法性。' },
  { name: '夹击与翻转', title: '一枚落下，八方判断。', copy: '从新落下的棋子向横、竖、斜八个方向检查。被新棋与己方棋子夹住的连续对方棋子必须全部翻面。', note: '一次落子可以同时形成多条夹线，所有方向都会在同一步完成翻转。' },
  { name: '跳过回合', title: '无子可下，停一回合。', copy: '当前方没有任何合法落点时必须跳过。如果对方仍有合法落点，对局继续由对方行棋。', note: '有合法落点时不能主动跳过；倒计时结束后由服务端自动处理。' },
  { name: '终局与计分', title: '最后的多，才是真正的多。', copy: '双方都没有合法落点时对局结束。按盘面实际黑白棋子数比较，多者获胜，数量相同则平局。', note: '空格不补给任何一方；认输时胜者由认输规则决定，当前盘面子数仍写入棋谱。' },
] as const;

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className={styles.eyebrow}>{children}</span>;
}

export function Rankings() {
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'winRate' | 'games'>('winRate');
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const leaderboard = useGameLeaderboard<OthelloLeaderboardEntry>({
    gameType: 'othello',
    pageSize: 50,
    sort,
  });
  const myIndex = leaderboard.entries.findIndex(entry =>
    String(entry.userID) === String(profile.data?.id));
  return <AppShell title="棋手排行" profile={profile.data}><div className={styles.page}>
    <header className={styles.title}><Eyebrow>THE QUIET MASTERS</Eyebrow>
      <h1>每一次翻转，都留下判断。</h1><p>按胜率或完成场次，看见稳定的棋手。</p></header>
    <section className={styles.rankHero}><BrandMark size={58} /><div><h2>OTHELLO 棋手榜</h2>
      <p>我的排名 {myIndex >= 0 ? `#${myIndex + 1}` : '—'}</p></div>
      <div>{leaderboard.entries.slice(0, 3).map((entry, index) => <span key={entry.userID}>
        <b>0{index + 1}</b><PlayerAvatar name={entry.displayName} size={index === 0 ? 58 : 48} />
        <strong>{entry.displayName}</strong><small>{Math.round(entry.winRate * 100)}%</small></span>)}</div></section>
    <section className={styles.panel}><div className={styles.tabs} role="tablist" aria-label="排行榜模式"><button type="button"
      role="tab" aria-selected={mode === 'winRate'} className={mode === 'winRate' ? styles.active : ''} onClick={() => setMode('winRate')}>胜率榜</button>
      <button type="button" role="tab" aria-selected={mode === 'games'} className={mode === 'games' ? styles.active : ''} onClick={() => setMode('games')}>场次榜</button></div>
      {leaderboard.loading && !leaderboard.entries.length && <OthelloLoading title="正在整理棋手名册。" description="载入排行榜记录" />}
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
    <header className={styles.title}><Eyebrow>THE OTHELLO HANDBOOK</Eyebrow>
      <h1>简单的规则，安静的较量。</h1><p>四章读懂落子、翻转、跳过与计分。</p></header>
    <div className={styles.guideLayout}><section className={styles.guideVisual}>
      <span>CHAPTER 0{guide.index + 1}</span>
      {guide.index === 0 && <div className={styles.openingLine}><Disc side="white" /><Disc side="black" /><Disc side="black" /><Disc side="white" /></div>}
      {guide.index === 1 && <div className={styles.flipLine}><Disc side="black" /><Disc side="white" /><Disc side="white" /><RotateCw size={28} /><Disc side="black" /><Disc side="black" /></div>}
      {guide.index === 2 && <div className={styles.passLine}><Disc side="black" /><SkipForward size={28} /><Disc side="white" /></div>}
      {guide.index === 3 && <div className={styles.victoryLine}><Disc side="black" /><strong>38</strong><span className={styles.scoreDivider}>:</span><strong>26</strong><Disc side="white" /><Trophy size={34} /></div>}
      <footer>OTHELLO / CLASSIC <span>{guide.index + 1} / 4</span></footer></section>
      <section className={styles.guideCopy}><nav>{guideSteps.map((step, index) => <button type="button" key={step.name}
        className={guide.index === index ? styles.active : ''} onClick={() => guide.select(index)}>
        <span>0{index + 1}</span>{step.name}</button>)}</nav>
        <Eyebrow>{current.name}</Eyebrow><h2>{current.title}</h2><p>{current.copy}</p>
        <div><ShieldCheck size={22} /><p>{current.note}</p></div>
        <footer><button type="button" disabled={guide.isFirst} onClick={guide.previous}><ArrowLeft size={15} />上一步</button>
          <ActionButton variant="primary" onClick={() => guide.isLast ? navigate('/game/othello') : guide.next()}>
            {guide.isLast ? '返回大厅' : '下一步'}<ArrowRight size={16} /></ActionButton></footer></section></div>
  </div></AppShell>;
}

export function My() {
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('othello');
  const history = useGameHistory({ gameType: 'othello', pageSize: 20 });
  const preferences = useOthelloPreferences();
  const logout = useGameLogout();
  const [panel, setPanel] = useState<'preferences' | 'logout'>();
  const loading = profile.loading && !profile.data
    || stats.loading && !stats.data
    || history.loading && !history.games.length;
  return <AppShell title="我的棋谱" profile={profile.data}><div className={styles.page}>
    <header className={styles.title}><Eyebrow>YOUR QUIET JOURNEY</Eyebrow>
      <h1>你的每一步，都值得回看。</h1><p>真实战绩、棋局结果与逐步回放。</p></header>
    {loading ? <OthelloLoading title="正在整理你的棋谱。" description="同步身份、战绩与历史" />
      : <div className={styles.profileLayout}><aside className={styles.identity}>
        <PlayerAvatar name={profile.data?.name ?? '棋手'} avatar={profile.data?.avatar} size={86} />
        <Eyebrow>THE OTHELLO PLAYER</Eyebrow><h2>{profile.data?.name || '棋手'}</h2>
        <p>{profile.data?.email || '在线棋手'}</p>
        <div><b>{stats.data?.totalGames ?? 0}<small>对局</small></b>
          <b>{stats.data?.wins ?? 0}<small>胜场</small></b>
          <b>{Math.round((stats.data?.winRate ?? 0) * 100)}%<small>胜率</small></b></div>
        <ActionButton onClick={() => setPanel('preferences')}><Settings2 size={16} />显示偏好</ActionButton>
        <ActionButton variant="quiet" onClick={() => setPanel('logout')}><LogOut size={14} />退出登录</ActionButton></aside>
        <section className={styles.history}><header><History size={17} /><h2>过去的棋局</h2></header>
          {history.games.map(game => {
            const me = game.players?.find(player => String(player.userID) === String(profile.data?.id));
            return <article key={game.id}><span className={me?.isWinner ? styles.win : ''}>
              {me?.isWinner ? <Trophy size={16} /> : <Flag size={16} />}</span>
              <div><h3>房间 {game.roomID}</h3><p>{new Date(game.startedAt).toLocaleString('zh-CN')} · {Math.max(0, Math.round(game.durationSeconds / 60))} 分钟</p></div>
              <b>{me?.finalScore ?? '—'}<small>终局子数</small></b>
              {game.endedAt ? <Link to={`/game/othello/replay/${game.id}`} aria-label={`回放房间 ${game.roomID}`}><ArrowRight size={17} /></Link> : <i />}</article>;
          })}
          {history.error && <Feedback error>{history.error}<ActionButton onClick={history.retry}>重试</ActionButton></Feedback>}
          {!history.loading && !history.games.length && <Feedback>还没有对局记录。<Link to="/game/othello">去大厅开始第一局</Link></Feedback>}
          {history.hasMore && <ActionButton pending={history.loading} onClick={history.loadMore}>加载更多</ActionButton>}</section></div>}
    {panel === 'preferences' && <Dialog title="专注于你的下一步。" eyebrow="PLAYING PREFERENCES" onClose={() => setPanel(undefined)}
      footer={<ActionButton variant="primary" onClick={() => setPanel(undefined)}>完成</ActionButton>}>
      <div className={styles.preference}>{[
        { label: '显示合法落点', value: preferences.hints, set: preferences.setHints },
        { label: '显示棋盘坐标', value: preferences.coordinates, set: preferences.setCoordinates },
        { label: '落子前确认', value: preferences.confirmMoves, set: preferences.setConfirmMoves },
        { label: '减少动态效果', value: preferences.reduceMotion, set: preferences.setReduceMotion },
      ].map(item => <div key={item.label}><span><b>{item.label}</b><small>偏好保存在当前设备</small></span>
        <button type="button" role="switch" aria-label={item.label} aria-checked={item.value}
          className={item.value ? styles.switchOn : ''} onClick={() => item.set(!item.value)}><i /></button></div>)}</div>
    </Dialog>}
    {panel === 'logout' && <Dialog title="离开当前账号？" eyebrow="SIGN OUT" onClose={() => setPanel(undefined)}
      footer={<><ActionButton onClick={() => setPanel(undefined)}>取消</ActionButton>
        <ActionButton variant="danger" pending={logout.pending} onClick={() => void logout.run()}>退出登录</ActionButton></>}>
      <p className={styles.dialogText}>退出不会删除棋谱与战绩，下次登录后仍可查看。</p>
    </Dialog>}
  </div></AppShell>;
}
