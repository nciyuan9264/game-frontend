import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ChevronRight, Clock, Flag, Grid3X3, History,
  Info, LogOut, Mail, Pencil, Repeat2, ShieldCheck, Swords, Trophy, Users,
} from 'lucide-react';
import {
  GameMobileAboutDialog,
  GameMobileGuide,
  GameMobileProfile,
  GameMobileRankings,
} from '@/components/GameUI/GamePublicMobile';
import { GameTabs } from '@/components/GameUI/GameTabs';
import { ProjectContact } from '@/components/GameUI/ProjectContact';
import { getProfile } from '@/features/game-core/api/auth';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useGuideSteps } from '@/features/game-core/hooks/useGuideSteps';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import type {
  LeaderboardSortDim,
  OnitamaLeaderboardEntry,
} from '@/features/game-core/model/history';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { Board } from '../../components/Board';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { BrandMark, Pawn, Torii } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { OnitamaLoading } from '../../components/LoadingState';
import { MoveCard } from '../../components/MoveCard';
import { CARD_CATALOG } from '../../model/cards';
import type { Piece } from '../../model/types';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

const guideSteps = [
  { name: '认识棋盘', title: '十枚棋子，两座山门。', copy: '棋盘为 5 × 5。每方一名宗师与四名弟子，宗师从己方底线中央山门出发；所有棋子都使用相同的招式卡移动。', note: '蓝方从下向上看，红方视角旋转 180°。宗师以高冠与“宗”字双重区分。' },
  { name: '招式流转', title: '出一式，也传一式。', copy: '基础版 16 张卡中随机取 5 张，双方各持 2 张，第 5 张放在公共区。走棋后，用过的卡与公共牌交换。', note: '公共牌印记决定先手。所有手牌公开，没有隐藏信息；前端方向图只用于展示。' },
  { name: '两条胜路', title: '不止擒王，也可入门。', copy: '用任意己方棋子擒获对方宗师，达成石之道；或让自己的宗师进入对方起始山门，达成流水之道。', note: '达成任一条件立即结束。弟子进入山门不算胜利，也不需要吃掉所有弟子。' },
  { name: '边界与例外', title: '只看落点，边界清楚。', copy: '棋子可以越过途中棋子，但不能走出棋盘或落在己方棋子上。只有两张手牌对所有己方棋子都无合法走法时，才能换牌跳过。', note: '线上每回合固定 60 秒。合法落点、擒获、换牌与胜负全部由服务端验证。' },
] as const;

const guidePieces: Piece[] = ([
  ['red-0', 'red', 'student', 0, 0],
  ['red-1', 'red', 'student', 0, 1],
  ['red-master', 'red', 'master', 0, 2],
  ['red-3', 'red', 'student', 0, 3],
  ['red-4', 'red', 'student', 0, 4],
  ['blue-0', 'blue', 'student', 4, 0],
  ['blue-1', 'blue', 'student', 4, 1],
  ['blue-master', 'blue', 'master', 4, 2],
  ['blue-3', 'blue', 'student', 4, 3],
  ['blue-4', 'blue', 'student', 4, 4],
] as const).map(([id, side, kind, row, column]) => ({
  id,
  side,
  kind,
  cell: { row, column },
}));

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className={styles.eyebrow}>{children}</span>;
}

export function Rankings() {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'winRate' | 'games'>('winRate');
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const leaderboard = useGameLeaderboard<OnitamaLeaderboardEntry>({
    gameType: 'onitama',
    pageSize: 50,
    sort,
  });
  const myIndex = leaderboard.entries.findIndex(entry =>
    String(entry.userID) === String(profile.data?.id));
  if (isMobile) {
    return <AppShell title="棋手排行" profile={profile.data}>
      <GameMobileRankings eyebrow="ONITAMA LEADERBOARD"
        title="ONITAMA 棋手榜"
        description="按胜率或完成场次，看见稳定的棋手。"
        modes={[
          { value: 'winRate', label: '胜率榜' },
          { value: 'games', label: '场次榜' },
        ]}
        mode={mode} onModeChange={setMode}
        entries={leaderboard.entries.map(entry => ({
          id: String(entry.userID),
          displayName: entry.displayName,
          totalGames: entry.totalGames,
          metric: `${Math.round(entry.winRate * 100)}%`,
          metricLabel: '胜率',
        }))}
        currentUserID={String(profile.data?.id ?? '')}
        renderAvatar={entry => <PlayerAvatar name={entry.displayName} size={29} />}
        state={<>{leaderboard.loading && !leaderboard.entries.length
          && <OnitamaLoading title="正在整理棋手名册。" description="载入排行榜记录" />}
          {leaderboard.error && <Feedback error>{leaderboard.error}
            <ActionButton onClick={leaderboard.retry}>重试</ActionButton>
          </Feedback>}</>}
        footer={leaderboard.hasMore && <ActionButton
          pending={leaderboard.loading} onClick={leaderboard.loadMore}>
          加载更多
        </ActionButton>}
      />
    </AppShell>;
  }
  return <AppShell title="棋手排行" profile={profile.data}><div className={styles.page}>
    <header className={styles.title}><Eyebrow>THE QUIET MASTERS</Eyebrow>
      <h1>每一条路，都留下判断。</h1><p>按胜率或完成场次，看见稳定的棋手。</p></header>
    <section className={styles.rankHero} data-testid="onitama-rank-hero"><BrandMark size={58} /><div><small>ONITAMA LEADERBOARD</small><h2>ONITAMA 棋手榜</h2>
      <p>我的排名 {myIndex >= 0 ? `#${myIndex + 1}` : '—'}</p></div></section>
    <section className={styles.panel}><GameTabs className={styles.tabs}
      activeClassName={styles.active} ariaLabel="排行榜模式"
      value={mode} onChange={setMode} items={[
        { value: 'winRate', label: '胜率榜' },
        { value: 'games', label: '场次榜' },
      ]} />
      {leaderboard.loading && !leaderboard.entries.length && <OnitamaLoading title="正在整理棋手名册。" description="载入排行榜记录" />}
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
  const { isMobile } = useMobileViewport();
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const guide = useGuideSteps(guideSteps);
  const [flipped, setFlipped] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const current = guide.current;
  const visual = <>
    {guide.index === 0 && <div className={styles.mobileBoardVisual}>
      <Board pieces={guidePieces} view="blue" small />
    </div>}
    {guide.index === 1 && <div className={styles.flipLine}>
      <MoveCard id="tiger" side="blue" mini />
      <Repeat2 size={27} />
      <MoveCard id="crab" side="blue" mini /></div>}
    {guide.index === 2 && <div className={styles.passLine}>
      <Swords size={30} /><Pawn side="red" kind="master" />
      <Torii size={34} /></div>}
    {guide.index === 3 && <div className={styles.victoryLine}>
      <Grid3X3 size={32} /><ShieldCheck size={30} /><Flag size={30} /></div>}
  </>;
  if (isMobile) {
    return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter>
      <GameMobileGuide
        visual={visual}
        facts={[
          { icon: <Users />, value: '2', label: '人' },
          { icon: <Clock />, value: '约 15', label: '分钟' },
          { icon: <Grid3X3 />, value: '5 × 5', label: '棋盘' },
        ]}
        tabs={guideSteps.map((step, index) => ({
          value: index,
          label: `${String(index + 1).padStart(2, '0')} ${step.name}`,
        }))}
        index={guide.index} onSelect={guide.select}
        eyebrow="THE ONITAMA HANDBOOK"
        title={current.title} description={current.copy}
        hint={current.note}
        primaryLabel={guide.isLast ? '创建房间' : '下一步'}
        onPrimary={() => guide.isLast ? navigate('/game/onitama') : guide.next()}
        secondaryAction={<ActionButton onClick={() => setCatalogOpen(true)}>
          移动卡速查
        </ActionButton>}
      />
      {catalogOpen && <Dialog title="基础版十六式"
        eyebrow="THE SIXTEEN SPIRITS" onClose={() => setCatalogOpen(false)}
        footer={<><ActionButton onClick={() => setFlipped(value => !value)}>
          <Repeat2 size={15} />{flipped ? '切回己方方向' : '查看对手方向'}
        </ActionButton><ActionButton onClick={() => setCatalogOpen(false)}>
          关闭
        </ActionButton></>}>
        <section className={styles.cardLibrary}>
          <p>黑格是棋子起点，亮格是可落位置。方向图表达实际走法。</p>
          <div>{CARD_CATALOG.map(card => <MoveCard key={card.id}
            id={card.id} side={card.mark} flipped={flipped} mini />)}</div>
        </section>
      </Dialog>}
    </AppShell>;
  }
  return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter><div className={`${styles.page} ${styles.guidePage}`}>
    <header className={styles.title}><Eyebrow>THE ONITAMA HANDBOOK</Eyebrow>
      <h1>用三分钟，读懂一局。</h1><p>四章认识棋盘、招式流转、两条胜路与边界。</p></header>
    <div className={styles.guideLayout}><section className={styles.guideVisual}
      data-testid="onitama-guide-visual">
      <span>CHAPTER 0{guide.index + 1}</span>
      {guide.index === 0 && <Board pieces={guidePieces} view="blue" small />}
      {guide.index === 1 && <div className={styles.flipLine}>
        <MoveCard id="tiger" side="blue" mini />
        <Repeat2 size={27} />
        <MoveCard id="crab" side="blue" mini /></div>}
      {guide.index === 2 && <div className={styles.passLine}>
        <Swords size={30} /><Pawn side="red" kind="master" />
        <Torii size={34} /></div>}
      {guide.index === 3 && <div className={styles.victoryLine}>
        <Grid3X3 size={32} /><ShieldCheck size={30} /><Flag size={30} /></div>}
      <footer>ONITAMA / CLASSIC <span>{guide.index + 1} / 4</span></footer></section>
      <section className={styles.guideCopy} data-testid="onitama-guide-copy"><nav>{guideSteps.map((step, index) => <button type="button" key={step.name}
        className={guide.index === index ? styles.active : ''} onClick={() => guide.select(index)}>
        <span>0{index + 1}</span>{step.name}</button>)}</nav>
        <Eyebrow>{current.name}</Eyebrow><h2>{current.title}</h2><p>{current.copy}</p>
        <div><ShieldCheck size={22} /><p>{current.note}</p></div>
        <footer><button type="button" disabled={guide.isFirst} onClick={guide.previous}><ArrowLeft size={15} />上一步</button>
          <ActionButton variant="primary" onClick={() => guide.isLast ? navigate('/game/onitama') : guide.next()}>
            {guide.isLast ? '返回大厅' : '下一步'}<ArrowRight size={16} /></ActionButton></footer></section></div>
    <section className={styles.cardLibrary}>
      <header><div><Eyebrow>THE SIXTEEN SPIRITS</Eyebrow>
        <h2>基础版十六式</h2></div>
        <button type="button" onClick={() => setFlipped(value => !value)}>
          <Repeat2 size={15} />{flipped ? '切回自己的方向' : '查看对手方向'}</button></header>
      <p>黑格是棋子起点，亮格是可落位置。卡图用于辨识，方向图才表达走法。</p>
      <div>{CARD_CATALOG.map(card => <MoveCard
        key={card.id}
        id={card.id}
        side={card.mark}
        flipped={flipped}
        mini
      />)}</div>
    </section>
  </div></AppShell>;
}

export function My() {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('onitama');
  const history = useGameHistory({ gameType: 'onitama', pageSize: 20 });
  const logout = useGameLogout();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const loading = profile.loading && !profile.data
    || stats.loading && !stats.data
    || history.loading && !history.games.length;
  if (isMobile) {
    const historyItems = history.games.map(game => {
      const me = game.players?.find(player =>
        String(player.userID) === String(profile.data?.id));
      return {
        id: String(game.id),
        title: `房间 ${game.roomID}`,
        detail: `${new Date(game.startedAt).toLocaleString('zh-CN')} · ${
          Math.max(0, Math.round(game.durationSeconds / 60))} 分钟`,
        accessory: me?.isWinner ? '胜' : '负',
        href: game.endedAt ? `/game/onitama/replay/${game.id}` : undefined,
      };
    });
    return <AppShell title="我的棋谱" profile={profile.data} compactMobileFooter>
      {loading
        ? <OnitamaLoading title="正在整理你的棋谱。" description="同步身份、战绩与历史" />
        : <GameMobileProfile
          avatar={<PlayerAvatar name={profile.data?.name ?? '棋手'}
            avatar={profile.data?.avatar} size={60} />}
          eyebrow="THE ONITAMA PLAYER"
          name={profile.data?.name || '棋手'}
          playerID={profile.data?.id ?? '—'}
          email={profile.data?.email}
          stats={[
            { label: '对局', value: stats.data?.totalGames ?? 0 },
            { label: '胜场', value: stats.data?.wins ?? 0 },
            { label: '胜率', value: `${Math.round((stats.data?.winRate ?? 0) * 100)}%` },
          ]}
          historyTitle="过去的棋局"
          historyItems={historyItems}
          emptyHistory={<Feedback>还没有对局记录。
            <Link to="/game/onitama">去大厅开始第一局</Link>
          </Feedback>}
          historyFooter={history.hasMore && <ActionButton
            pending={history.loading} onClick={history.loadMore}>加载更多</ActionButton>}
          logoutPending={logout.pending} logoutError={logout.error}
          onLogout={() => setLogoutOpen(true)}
          onAbout={() => setAboutOpen(true)}
        />}
      {aboutOpen && <GameMobileAboutDialog gameName="Onitama"
        avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        themeClassName={rootStyles.root}
        onClose={() => setAboutOpen(false)} />}
      {logoutOpen && <Dialog title="离开当前账号？" eyebrow="SIGN OUT"
        onClose={() => setLogoutOpen(false)}
        footer={<><ActionButton onClick={() => setLogoutOpen(false)}>取消</ActionButton>
          <ActionButton variant="danger" pending={logout.pending}
            onClick={() => void logout.run()}>退出登录</ActionButton></>}>
        <p className={styles.dialogText}>退出不会删除棋谱与战绩，下次登录后仍可查看。</p>
        {logout.error && <Feedback error>{logout.error}</Feedback>}
      </Dialog>}
    </AppShell>;
  }
  return <AppShell title="我的棋谱" profile={profile.data} compactMobileFooter><div className={`${styles.page} ${styles.profilePage}`}>
    <header className={styles.title}><Eyebrow>YOUR QUIET JOURNEY</Eyebrow>
      <h1>你的每一步，都值得回看。</h1><p>真实战绩、棋局结果与逐步回放。</p></header>
    {loading ? <OnitamaLoading title="正在整理你的棋谱。" description="同步身份、战绩与历史" />
      : <div className={styles.profileLayout}><aside className={styles.identity}>
        <div className={styles.identityHeader}><PlayerAvatar name={profile.data?.name ?? '棋手'}
          avatar={profile.data?.avatar} size={72} /><div><Eyebrow>THE ONITAMA PLAYER</Eyebrow>
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
              {game.endedAt ? <Link to={`/game/onitama/replay/${game.id}`} aria-label={`回放房间 ${game.roomID}`}><ArrowRight size={17} /></Link> : <i />}</article>;
          })}
          {history.error && <Feedback error>{history.error}<ActionButton onClick={history.retry}>重试</ActionButton></Feedback>}
          {!history.loading && !history.games.length && <Feedback>还没有对局记录。<Link to="/game/onitama">去大厅开始第一局</Link></Feedback>}
          {history.hasMore && <ActionButton pending={history.loading} onClick={history.loadMore}>加载更多</ActionButton>}</section></div>}
    <button className={styles.aboutEntry} data-testid="onitama-about-entry" type="button"
      onClick={() => setAboutOpen(true)}><span><Info size={17} /></span>
      <span><b>关于与联系</b><small>项目作者、源码与联系方式</small></span>
      <ChevronRight size={17} /></button>
    {aboutOpen && <Dialog title="关于 Onitama Online" eyebrow="ABOUT & CONTACT"
      onClose={() => setAboutOpen(false)}
      footer={<ActionButton onClick={() => setAboutOpen(false)}>知道了</ActionButton>}>
      <ProjectContact gameName="Onitama" avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
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
