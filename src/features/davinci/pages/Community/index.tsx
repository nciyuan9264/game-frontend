import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Clock, Fingerprint,
  Info, LogOut, Mail, Pencil, ShieldCheck, Trophy, Users,
} from 'lucide-react';
import {
  GameMobileAboutDialog,
  GameMobileGuide,
  GameMobileProfile,
  GameMobileRankings,
} from '@/components/GameUI/GamePublicMobile';
import { getProfile } from '@/features/game-core/api/auth';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameTabs } from '@/components/GameUI/GameTabs';
import { Feedback } from '@/components/GameUI/Panel';
import { ProjectContact } from '@/components/GameUI/ProjectContact';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useGuideSteps } from '@/features/game-core/hooks/useGuideSteps';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import type {
  DavinciLeaderboardEntry,
  LeaderboardEntry,
  LeaderboardSortDim,
} from '@/features/game-core/model/history';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { DavinciLoading } from '../../components/LoadingState';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

const PAGE_SIZE = 20;
const isDavinciEntry = (entry: LeaderboardEntry):
  entry is DavinciLeaderboardEntry => 'winRate' in entry;
const guideSteps = [
  {
    tab: '牌序',
    title: '先读懂序列，才有可能破解它。',
    text: '每人持有 5 张密码牌。数字从小到大排列；数字相同时，黑牌在白牌之前。',
    points: ['黑白两色各有 0–11。', 'JOKER 不受数字顺序限制，可以放在任意位置。', '对手的暗牌只显示颜色与位置。'],
  },
  {
    tab: '抽牌',
    title: '每一次抽牌，都会增加新的线索。',
    text: '轮到你时，先从中央公共牌池抽取一张牌。你知道它的数字，对手只知道颜色。',
    points: ['抽牌后进入猜牌阶段。', '观察牌池剩余颜色，可以排除部分可能。', '新抽的牌会暂存在你的序列旁。'],
  },
  {
    tab: '猜牌',
    title: '猜对可以继续，猜错就会暴露自己。',
    text: '选择对手一张未公开的牌，猜测 0–11 或 JOKER。',
    points: ['猜对：目标牌公开，你可以继续猜。', '猜错：本回合新牌公开，并轮到对手。', '已经公开的牌不能再次猜测。'],
  },
  {
    tab: '收手',
    title: '知道什么时候停，比猜中一次更重要。',
    text: '猜对后可以继续，也可以把新牌放回自己的密码序列并结束回合。',
    points: ['普通数字牌必须按顺序放回。', 'JOKER 可以选择任意合法槽位。', '率先公开对手全部密码牌的一方获胜。'],
  },
] as const;

export function Rankings() {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'wins' | 'games'>('wins');
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const { entries, loading, error, hasMore, loadMore } = useGameLeaderboard<DavinciLeaderboardEntry>({
    gameType: 'davinci',
    pageSize: PAGE_SIZE,
    sort,
    isEntry: isDavinciEntry,
  });
  const myIndex = entries.findIndex(entry => String(entry.userID) === String(profile.data?.id));

  if (isMobile) {
    return <AppShell title="排行榜" profile={profile.data}>
      <GameMobileRankings eyebrow="DAVINCI LEADERBOARD"
        title="密码破译榜"
        description="胜率记录判断的准确度，场次记录持续对局的经验。"
        modes={[
          { value: 'wins', label: '胜率榜' },
          { value: 'games', label: '场次榜' },
        ]}
        mode={mode} onModeChange={setMode}
        entries={entries.map(entry => ({
          id: String(entry.userID),
          displayName: entry.displayName,
          totalGames: entry.totalGames,
          metric: `${(entry.winRate * 100).toFixed(1)}%`,
          metricLabel: '胜率',
        }))}
        currentUserID={String(profile.data?.id ?? '')}
        renderAvatar={entry => <PlayerAvatar name={entry.displayName} size={29} />}
        state={<>{loading && !entries.length
          && <DavinciLoading title="正在整理破译记录。" description="读取排行榜" />}
          {error && <Feedback error>{error}</Feedback>}</>}
        footer={hasMore && !!entries.length && <ActionButton
          pending={loading} onClick={loadMore}>加载更多</ActionButton>}
      />
    </AppShell>;
  }
  return <AppShell title="排行榜" profile={profile.data}><div className={styles.page}>
    <header className={styles.heading}><div><small>THE SHARPEST MINDS</small><h1>每一次破解，都留下记录。</h1></div><Trophy size={30} /></header>
    <section className={styles.rankSummary}><div><small>DAVINCI LEADERBOARD</small><h2>密码破译榜</h2><p>胜率记录判断的准确度，场次记录持续对局的经验。</p></div>
      <span><small>我的排名</small><b>{myIndex >= 0 ? `#${myIndex + 1}` : '—'}</b></span></section>
    <GameTabs className={styles.rankTabs} activeClassName={styles.active}
      ariaLabel="排行榜模式" value={mode} onChange={setMode}
      items={[{ value: 'wins', label: '胜率榜' }, { value: 'games', label: '场次榜' }]} />
    <section className={styles.rankList}>
      <header><span>名次</span><span>玩家</span><span>胜场</span><span>胜率</span><span>对局</span></header>
      {entries.map((entry, index) => <div key={entry.userID} className={String(entry.userID) === String(profile.data?.id) ? styles.mine : ''}>
        <span>{index === 0 ? <Trophy size={18} /> : String(index + 1).padStart(2, '0')}</span>
        <span><PlayerAvatar name={entry.displayName} size={34} /><b>{entry.displayName}</b></span>
        <span>{entry.wins}</span><span>{(entry.winRate * 100).toFixed(1)}%</span><span>{entry.totalGames}</span>
      </div>)}
      {loading && !entries.length && <DavinciLoading title="正在整理破译记录。" description="读取排行榜" />}
      {error && <Feedback error>{error}</Feedback>}
      {!loading && !error && !entries.length && <Feedback>暂时还没有排行记录。</Feedback>}
    </section>
    {hasMore && !!entries.length && <ActionButton className={styles.loadMore} pending={loading} onClick={loadMore}>加载更多</ActionButton>}
  </div></AppShell>;
}

export function Guide() {
  const { isMobile } = useMobileViewport();
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const guide = useGuideSteps(guideSteps);
  const step = guide.current;
  if (isMobile) {
    return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter>
      <GameMobileGuide
        visualFill
        visual={<div className={styles.tileDemo}><div>
          <span className={styles.blackTile}>3</span>
          <span className={styles.whiteTile}>3</span>
          <span className={styles.blackTile}>7</span>
          <span className={styles.whiteTile}>—</span>
        </div></div>}
        facts={[
          { icon: <Users />, value: '2', label: '人' },
          { icon: <Clock />, value: '约 20', label: '分钟' },
          { icon: <Fingerprint />, value: '26', label: '张牌' },
        ]}
        tabs={guideSteps.map((item, index) => ({
          value: index,
          label: `${String(index + 1).padStart(2, '0')} ${item.tab}`,
        }))}
        index={guide.index} onSelect={guide.select}
        eyebrow="THE ESSENTIALS"
        title={step.title} description={step.text}
        points={step.points}
        hint="在线对局的合法操作与牌序由服务端校验。"
        primaryLabel={guide.isLast ? '创建房间' : '下一步'}
        onPrimary={() => guide.isLast ? navigate('/game/davinci') : guide.next()}
      />
    </AppShell>;
  }
  return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter><div className={`${styles.page} ${styles.guidePage}`}>
    <header className={styles.heading}><div><small>LEARN THE CIPHER</small><h1>四步，读懂一场密码对决。</h1></div><BookOpen size={30} /></header>
    <div className={styles.guideLayout}><aside className={styles.tileDemo}>
      <div><span className={styles.blackTile}>3</span><span className={styles.whiteTile}>3</span><span className={styles.blackTile}>7</span><span className={styles.whiteTile}>—</span></div>
      <p>黑 3 排在白 3 之前；JOKER 可以隐藏在任意位置。</p>
      <footer><span><Users size={16} />2 人</span><span><Clock size={16} />约 20 分钟</span><span><Fingerprint size={16} />26 张牌</span></footer>
    </aside><section className={styles.guidePanel}>
      <GameTabs className={styles.guideTabs} activeClassName={styles.active}
        ariaLabel="玩法章节" value={guide.index} onChange={guide.select}
        items={guideSteps.map((item, index) => ({
          value: index,
          label: `${String(index + 1).padStart(2, '0')} ${item.tab}`,
        }))} />
      <small>THE ESSENTIALS</small><h2>{step.title}</h2><p>{step.text}</p>
      <ol>{step.points.map(point => <li key={point}>{point}</li>)}</ol>
      <div className={styles.guideHint}><ShieldCheck size={16} />在线对局的合法操作与牌序由服务端校验。</div>
      <ActionButton variant="primary" onClick={() => guide.isLast ? navigate('/game/davinci') : guide.next()}>
        {guide.isLast ? '进入大厅' : '下一步'}<ArrowRight size={16} />
      </ActionButton>
    </section></div>
  </div></AppShell>;
}

export function My() {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('davinci');
  const {
    games,
    error: historyError,
    loading: historyLoading,
  } = useGameHistory({ gameType: 'davinci', pageSize: 20 });
  const logoutAction = useGameLogout();
  const [aboutOpen, setAboutOpen] = useState(false);
  const handleLogout = async () => {
    if (!window.confirm('确定要退出登录吗？')) return;
    await logoutAction.run();
  };
  const loading = profile.loading && !profile.data || stats.loading && !stats.data || historyLoading && !games.length;

  if (isMobile) {
    const historyItems = games.map(game => {
      const me = game.players?.find(player => player.userID != null
        && String(player.userID) === String(profile.data?.id));
      const opponent = game.players?.find(player => player.id !== me?.id);
      return {
        id: String(game.id),
        title: opponent?.displayName || '未知对手',
        detail: `${new Date(game.startedAt).toLocaleString('zh-CN')} · ${
          Math.max(0, Math.round(game.durationSeconds / 60))} 分钟`,
        accessory: me?.isWinner ? '胜' : '负',
      };
    });
    return <AppShell title="玩家档案" profile={profile.data} compactMobileFooter>
      {loading
        ? <DavinciLoading title="正在整理你的破译档案。"
          description="同步身份、战绩与历史对局" />
        : <GameMobileProfile
          avatar={<PlayerAvatar name={profile.data?.name ?? '玩家'}
            avatar={profile.data?.avatar} size={60} />}
          eyebrow="THE CODE BREAKER"
          name={profile.data?.name || '玩家'}
          playerID={profile.data?.id ?? '—'}
          email={profile.data?.email}
          stats={[
            { label: '对局', value: stats.data?.totalGames ?? 0 },
            { label: '胜场', value: stats.data?.wins ?? 0 },
            { label: '胜率', value: `${((stats.data?.winRate ?? 0) * 100).toFixed(0)}%` },
          ]}
          historyTitle="最近对局"
          historyItems={historyItems}
          emptyHistory={<Feedback>还没有对局记录。
            <Link to="/game/davinci">去大厅开始第一局</Link>
          </Feedback>}
          logoutPending={logoutAction.pending}
          logoutError={logoutAction.error}
          onLogout={() => void handleLogout()}
          onAbout={() => setAboutOpen(true)}
        />}
      {aboutOpen && <GameMobileAboutDialog gameName="DaVinci Code"
        avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        themeClassName={rootStyles.root}
        onClose={() => setAboutOpen(false)} />}
    </AppShell>;
  }
  return <AppShell title="玩家档案" profile={profile.data} compactMobileFooter><div className={`${styles.page} ${styles.profilePage}`}>
    <header className={styles.heading}><div><small>YOUR CIPHER RECORD</small><h1>身份、判断与每一场对决。</h1></div><UserRoundIcon /></header>
    {loading ? <DavinciLoading title="正在整理你的破译档案。" description="同步身份、战绩与历史对局" /> : <div className={styles.profileLayout}>
      <section className={styles.profileDisplay} data-testid="davinci-profile-card">
        {profile.data && <><div className={styles.profileIdentity} data-testid="davinci-profile-identity">
          <PlayerAvatar name={profile.data.name} avatar={profile.data.avatar} size={72} />
          <div><small className={styles.profileEyebrow}>THE CODE BREAKER</small><h2>{profile.data.name}</h2>
            <span>PLAYER ID · {profile.data.id}</span></div>
        </div>
        <div className={styles.profileEmail}><Mail size={14} />{profile.data.email || '邮箱未绑定'}</div></>}
        <div className={styles.profileStats}><span><b>{stats.data?.totalGames ?? '—'}</b><small>对局</small></span>
          <span><b>{stats.data?.wins ?? '—'}</b><small>胜场</small></span>
          <span><b>{stats.data ? `${(stats.data.winRate * 100).toFixed(0)}%` : '—'}</b><small>胜率</small></span></div>
        <div className={styles.profileManage}><a className={styles.profileEdit} href="https://auth.gamebus.online/profile"><Pencil size={14} />编辑资料</a>
          <ActionButton variant="quiet" pending={logoutAction.pending} onClick={() => void handleLogout()}><LogOut size={14} />退出登录</ActionButton></div>
        {logoutAction.error && <Feedback error>{logoutAction.error}</Feedback>}
      </section>
      <section className={styles.profileHistory} data-testid="davinci-profile-history"><h2>最近对局</h2>
        {games.map(game => {
          const me = game.players?.find(player => player.userID != null && String(player.userID) === String(profile.data?.id));
          const opponent = game.players?.find(player => player.id !== me?.id);
          return <article key={game.id}><span className={me?.isWinner ? styles.win : styles.loss}>{me?.isWinner ? '胜' : '负'}</span>
            <div><strong>{opponent?.displayName || '未知对手'}</strong>
              <small>{new Date(game.startedAt).toLocaleString('zh-CN')}</small></div>
            <span><b>{Math.max(0, Math.round(game.durationSeconds / 60))}</b><small>分钟</small></span></article>;
        })}
        {historyError && <Feedback error>{historyError}</Feedback>}
        {!historyLoading && !historyError && !games.length && <Feedback>还没有对局记录。<Link to="/game/davinci">去大厅开始第一局</Link></Feedback>}
      </section>
    </div>}
    <button className={styles.aboutEntry} data-testid="davinci-about-entry" type="button"
      onClick={() => setAboutOpen(true)}><span className={styles.aboutEntryIcon}><Info size={17} /></span>
      <span><b>关于与联系</b><small>项目作者、源码与联系方式</small></span><ArrowRight size={16} /></button>
    {aboutOpen && <ResponsiveDialog title="关于 DaVinci Code Online" eyebrow="ABOUT & CONTACT" themeClassName={rootStyles.root}
      onClose={() => setAboutOpen(false)} footer={<ActionButton onClick={() => setAboutOpen(false)}>知道了</ActionButton>}>
      <ProjectContact gameName="DaVinci Code" avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        classes={{ intro: styles.aboutIntro, links: styles.aboutLinks, legal: styles.aboutLegal }} />
    </ResponsiveDialog>}
  </div></AppShell>;
}

function UserRoundIcon() {
  return <span className={styles.headingIcon}><Fingerprint size={28} /></span>;
}
