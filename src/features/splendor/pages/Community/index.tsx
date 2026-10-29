import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Bookmark, ChevronRight, Clock, Crown, Gem, Info,
  Layers, LogOut, Mail, Pencil, ShieldCheck, Trophy, Users,
} from 'lucide-react';
import {
  GameMobileAboutDialog,
  GameMobileGuide,
  GameMobileProfile,
  GameMobileRankings,
} from '@/components/GameUI/GamePublicMobile';
import { ProjectContact } from '@/components/GameUI/ProjectContact';
import { getProfile } from '@/features/game-core/api/auth';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameTabs } from '@/components/GameUI/GameTabs';
import { Feedback } from '@/components/GameUI/Panel';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useGuideSteps } from '@/features/game-core/hooks/useGuideSteps';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import type {
  LeaderboardEntry,
  LeaderboardSortDim,
} from '@/features/game-core/model/history';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { Artwork, Eyebrow, GemIcon } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { SplendorLoading } from '../../components/LoadingState';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

const guideSteps = [
  {
    eyebrow: 'COLLECT',
    title: '先有宝石，再有可能。',
    paragraphs: [
      '拿取 3 种不同色各 1 枚，或拿取同色 2 枚。同色拿取前，银行必须至少有该色 4 枚。',
      '如果普通宝石种类不足，就按可用颜色选择。黄金不能直接拿取。',
    ],
    callout: '筹码上限在回合结束时检查，超过 10 枚需要精确退还多出的筹码。',
  },
  {
    eyebrow: 'DEVELOP',
    title: '每一次购买，都是积累。',
    paragraphs: [
      '从市场或自己的预留中购买 1 张卡。每张已购卡带来 1 枚永久折扣，部分卡还带来声望。',
      '先从原价减去对应颜色的折扣，再支付同色筹码，黄金自动补足剩余缺口。',
    ],
    callout: '折扣足够时可以免费购卡，公开卡被买走后会从相同等级补入一张。',
  },
  {
    eyebrow: 'RESERVE',
    title: '好机会，可以先留住。',
    paragraphs: [
      '从公开市场预留 1 张发展卡。银行有黄金时，同时获得 1 枚黄金；黄金用完仍可预留。',
      '预留卡只有你可以购买，其他玩家只能看到你的预留数量。',
    ],
    callout: '最多同时预留 3 张，不能主动弃掉，只有购买才能腾出位置。',
  },
  {
    eyebrow: 'ATTRACT',
    title: '让你的收藏，赢得青睐。',
    paragraphs: [
      '回合结束时，永久折扣达到贵族要求就会自动迎来一位贵族，获得 3 点声望。',
      '任一玩家达到 15 点后完成当前轮。最高声望获胜；同分时发展卡更少者优先。',
    ],
    callout: '行动次数相同后才结算；声望和发展卡数量都相同则共享胜利。',
  },
] as const;

export function Rankings() {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const [mode, setMode] = useState<'score' | 'games'>('score');
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const { entries, loading, error, retry } = useGameLeaderboard<LeaderboardEntry>({
    gameType: 'splendor',
    pageSize: 50,
    sort,
  });
  const myIndex = entries.findIndex(entry => String(entry.userID) === String(profile.data?.id));

  if (isMobile) {
    return <AppShell title="收藏家榜" profile={profile.data}>
      <GameMobileRankings eyebrow="SPLENDOR LEADERBOARD"
        title="收藏家荣誉榜"
        description="用平均名次衡量稳定发挥，也记录每一场完成的珠宝展。"
        modes={[
          { value: 'score', label: '战绩榜' },
          { value: 'games', label: '场次榜' },
        ]}
        mode={mode} onModeChange={setMode}
        entries={entries.map(entry => ({
          id: String(entry.userID),
          displayName: entry.displayName,
          totalGames: entry.totalGames,
          metric: 'avgRank' in entry ? entry.avgRank.toFixed(2) : '—',
          metricLabel: '平均名次',
        }))}
        currentUserID={String(profile.data?.id ?? '')}
        renderAvatar={entry => <PlayerAvatar name={entry.displayName} size={29} />}
        state={<>{loading && !entries.length
          && <SplendorLoading title="正在整理皇家名册。" description="载入排行榜记录" />}
          {error && <Feedback error>{error}
            <ActionButton onClick={retry}>重试</ActionButton>
          </Feedback>}</>}
      />
    </AppShell>;
  }
  return <AppShell title="收藏家榜" profile={profile.data}><div className={`${styles.page} ${styles.rankPage}`}>
    <header className={styles.pageTitle}><Eyebrow>THE DISTINGUISHED COLLECTORS</Eyebrow>
      <h1>让每一次远见，都留下声望。</h1><p>在宝石的世界里，稳定的眼光值得被看见。</p></header>
    <section className={styles.rankHero}><div><Crown size={36} /><h2>收藏家荣誉榜</h2>
      <p>累积收藏的不是宝石，而是每一步的智慧。</p>
      <span>我的排名 {myIndex >= 0 ? `#${myIndex + 1}` : '—'}</span></div></section>
    <section className={styles.rankPanel}><GameTabs className={styles.rankTabs}
      ariaLabel="排行榜模式" value={mode} onChange={setMode} activeClassName={styles.active}
      items={[{ value: 'score', label: '战绩榜' }, { value: 'games', label: '场次榜' }]}
      trailing={<span>{mode === 'score' ? '按平均名次升序排列' : '按完成对局数降序排列'}</span>} />
      <div className={`${styles.rankRow} ${styles.rankHead}`}><span>名次</span><span>收藏家</span><span>完成对局</span><span>平均名次</span></div>
      {loading && !entries.length && <SplendorLoading title="正在整理皇家名册。" description="载入排行榜记录" />}
      {error && <Feedback error>{error}<ActionButton onClick={retry}>重试</ActionButton></Feedback>}
      {entries.map((entry, index) => {
        const mine = String(entry.userID) === String(profile.data?.id);
        return <div className={`${styles.rankRow} ${mine ? styles.mine : ''}`} key={entry.userID}>
          <span className={styles.rankNumber}>{String(index + 1).padStart(2, '0')}</span>
          <span className={styles.rankPlayer}><PlayerAvatar name={entry.displayName} size={37} />
            <strong>{entry.displayName}</strong>{mine && <em>你</em>}</span>
          <span>{entry.totalGames}</span><b>{'avgRank' in entry ? entry.avgRank.toFixed(2) : '—'}</b>
        </div>;
      })}
      {!loading && !error && !entries.length && <Feedback>暂时还没有排名记录。</Feedback>}
    </section>
  </div></AppShell>;
}

export function Guide() {
  const { isMobile } = useMobileViewport();
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const guide = useGuideSteps(guideSteps);
  const step = guide.index;
  const current = guide.current;
  if (isMobile) {
    return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter>
      <GameMobileGuide
        visual={<Artwork index={[0, 6, 4, 8][step]} />}
        facts={[
          { icon: <Users />, value: '2–4', label: '人' },
          { icon: <Clock />, value: '约 30', label: '分钟' },
          { icon: <Crown />, value: '15', label: '声望终局' },
        ]}
        tabs={guideSteps.map((_item, index) => ({
          value: index,
          label: `${String(index + 1).padStart(2, '0')} ${
            ['拿取宝石', '购买发展卡', '公开预留', '贵族与终局'][index]}`,
        }))}
        index={step} onSelect={guide.select}
        eyebrow={current.eyebrow}
        title={current.title}
        description={current.paragraphs[0]}
        points={current.paragraphs.slice(1)}
        hint={current.callout}
        primaryLabel={guide.isLast ? '创建房间' : '下一步'}
        onPrimary={() => guide.isLast ? navigate('/game/splendor') : guide.next()}
      />
    </AppShell>;
  }
  return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter><div className={`${styles.page} ${styles.guidePage}`}>
    <header className={styles.pageTitle}><Eyebrow>YOUR FIRST GEM</Eyebrow>
      <h1>简单的规则，长远的眼光。</h1><p>每回合做一件事，让每张卡都成为下一次机会。</p></header>
    <div className={styles.guideLayout}><section className={styles.guideVisual}>
      <Artwork index={[0, 6, 4, 8][step]} /><i /><span>CHAPTER 0{step + 1}</span>
      <div className={styles.guideGraphic}>
        {step === 0 && <div className={styles.guideGems}>{(['White', 'Blue', 'Green'] as const).map(color =>
          <span key={color}><GemIcon color={color} size={48} /></span>)}</div>}
        {step === 1 && <div className={styles.formula}><span><GemIcon color="Blue" size={45} /><b>3</b><small>原价</small></span>
          <em>−</em><span><Layers size={43} /><b>2</b><small>永久折扣</small></span><em>=</em>
          <span><GemIcon color="Blue" size={45} /><b>1</b><small>实际支付</small></span></div>}
        {step === 2 && <div className={styles.reserveGraphic}><span><Bookmark size={42} /><b>RESERVED</b></span>
          <PlusMark /><span><GemIcon color="Gold" size={52} /><b>+1</b></span></div>}
        {step === 3 && <div className={styles.nobleGraphic}><Crown size={39} /><b>+3</b><span>贵族声望</span></div>}
      </div>
      <footer><span>SPLENDOR / CLASSIC</span><span>0{step + 1} — 04</span></footer>
    </section>
    <section className={styles.guideInstructions}><GameTabs className={styles.guideTabs}
      activeClassName={styles.active} ariaLabel="玩法章节" value={step} onChange={guide.select}
      items={guideSteps.map((item, index) => ({
        value: index,
        label: item.title,
      }))}
      renderItem={(_item, _selected, index) => <><span>0{index + 1}</span>
        {['拿取宝石', '购买发展卡', '公开预留', '贵族与终局'][index]}</>} />
      <div className={styles.guideCopy}><Eyebrow>{current.eyebrow}</Eyebrow><h2>{current.title}</h2>
        {current.paragraphs.map(text => <p key={text}>{text}</p>)}
        <div className={styles.callout}><ShieldCheck size={30} /><div><b>规则要点</b><p>{current.callout}</p></div></div></div>
      <div className={styles.guideNavigation}><button disabled={guide.isFirst} onClick={guide.previous}>
        <ArrowLeft size={16} />上一步</button><span>{step + 1} / 4</span>
        <ActionButton variant="primary" onClick={() => guide.isLast ? navigate('/game/splendor') : guide.next()}>
          {guide.isLast ? '返回大厅' : '下一步'}<ArrowRight size={17} /></ActionButton></div>
    </section></div>
    <p className={styles.guideSource}><ShieldCheck size={15} />经典版规则，不包含盲抽预留、Duel 与扩展。</p>
  </div></AppShell>;
}

function PlusMark() {
  return <strong className={styles.plus}>+</strong>;
}

export function My() {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('splendor');
  const {
    games,
    loading,
    error,
    hasMore,
    loadMore,
    retry,
  } = useGameHistory({ gameType: 'splendor', pageSize: 20 });
  const logoutAction = useGameLogout();
  const [panel, setPanel] = useState<'logout' | 'about'>();
  const doLogout = async () => {
    await logoutAction.run();
  };
  const firstLoading = profile.loading && !profile.data || stats.loading && !stats.data || loading && !games.length;

  if (isMobile) {
    const historyItems = games.map(game => {
      const me = game.players?.find(player =>
        String(player.userID) === String(profile.data?.id));
      return {
        id: String(game.id),
        title: `房间 ${game.roomID}`,
        detail: `${new Date(game.startedAt).toLocaleString('zh-CN')} · ${
          Math.max(0, Math.round(game.durationSeconds / 60))} 分钟`,
        accessory: me?.isWinner ? '本局获胜' : game.endedAt ? '已结束' : '进行中',
        href: game.endedAt ? `/game/splendor/replay/${game.id}` : undefined,
      };
    });
    return <AppShell title="我的收藏" profile={profile.data} compactMobileFooter>
      {firstLoading
        ? <SplendorLoading title="正在整理你的收藏档案。"
          description="同步身份、战绩与对局记录" />
        : <GameMobileProfile
          avatar={<PlayerAvatar name={profile.data?.name ?? '玩家'}
            avatar={profile.data?.avatar} size={60} />}
          eyebrow="THE GEM COLLECTOR"
          name={profile.data?.name || '玩家'}
          playerID={profile.data?.id ?? '—'}
          email={profile.data?.email}
          stats={[
            { label: '对局', value: stats.data?.totalGames ?? 0 },
            { label: '胜场', value: stats.data?.wins ?? 0 },
            { label: '平均声望', value: (stats.data?.avgScore ?? 0).toFixed(1) },
          ]}
          historyTitle="过去的精彩"
          historyItems={historyItems}
          emptyHistory={<Feedback>还没有对局记录。
            <Link to="/game/splendor">去大厅开一桌</Link>
          </Feedback>}
          historyFooter={hasMore && <ActionButton pending={loading}
            onClick={loadMore}>加载更多</ActionButton>}
          logoutPending={logoutAction.pending}
          logoutError={logoutAction.error}
          onLogout={() => setPanel('logout')}
          onAbout={() => setPanel('about')}
        />}
      {panel === 'about' && <GameMobileAboutDialog gameName="Splendor"
        avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        themeClassName={rootStyles.root}
        onClose={() => setPanel(undefined)} />}
      {panel === 'logout' && <Dialog title="退出当前收藏家账号？"
        eyebrow="UNTIL NEXT TIME" onClose={() => setPanel(undefined)}
        footer={<><ActionButton onClick={() => setPanel(undefined)}>取消</ActionButton>
          <ActionButton variant="danger" pending={logoutAction.pending}
            onClick={() => void doLogout()}>确认退出</ActionButton></>}>
        <p className={styles.logoutCopy}>退出后将返回登录页。</p>
        {logoutAction.error && <Feedback error>{logoutAction.error}</Feedback>}
      </Dialog>}
    </AppShell>;
  }
  return <AppShell title="我的收藏" profile={profile.data} compactMobileFooter><div className={`${styles.page} ${styles.profilePage}`}>
    <header className={styles.pageTitle}><Eyebrow>YOUR COLLECTOR'S JOURNEY</Eyebrow>
      <h1>你的眼光，值得珍藏。</h1><p>每一局都是新的旅程，每一步都有自己的印记。</p></header>
    {firstLoading ? <SplendorLoading title="正在整理你的收藏档案。" description="同步身份、战绩与对局记录" />
      : <div className={styles.profileLayout}><section className={styles.identity}>
        <Gem className={styles.identityDecoration} size={160} strokeWidth={.5} />
        <PlayerAvatar name={profile.data?.name ?? '玩家'} avatar={profile.data?.avatar} size={88} />
        <span>THE GEM COLLECTOR</span><h2>{profile.data?.name || '玩家'}</h2>
        <p className={styles.profileID}>PLAYER ID · {profile.data?.id ?? '—'}</p>
        <div className={styles.profileEmail}><Mail size={14} />{profile.data?.email || '邮箱未绑定'}</div>
        <em><Crown size={14} />收藏家档案</em>
        <div className={styles.identityStats}><div><b>{stats.data?.totalGames ?? 0}</b><span>完成对局</span></div>
          <div><b>{stats.data?.wins ?? 0}</b><span>胜利</span></div>
          <div><b>{(stats.data?.avgScore ?? 0).toFixed(1)}</b><span>平均声望</span></div></div>
        <div className={styles.profileActions}><a href="https://auth.gamebus.online/profile">
          <Pencil size={14} />编辑资料</a>
          <ActionButton variant="quiet" onClick={() => setPanel('logout')}><LogOut size={14} />退出登录</ActionButton></div>
      </section>
      <section className={styles.history}><div className={styles.highlights}>
        <div><Trophy size={19} /><span>完成对局</span><b>{stats.data?.totalGames ?? 0}</b></div>
        <div><Crown size={19} /><span>获胜场次</span><b>{stats.data?.wins ?? 0}</b></div>
        <div><Layers size={19} /><span>平均声望</span><b>{(stats.data?.avgScore ?? 0).toFixed(1)}</b></div></div>
        <div className={styles.matchHistory}><header><h2>过去的精彩</h2><span>真实对局记录</span></header>
          {games.map((game, index) => {
            const me = game.players?.find(player => String(player.userID) === String(profile.data?.id));
            return <article key={game.id}><Artwork index={[7, 5, 0][index % 3]} />
              <div><h3>房间 {game.roomID}</h3><p>{new Date(game.startedAt).toLocaleString('zh-CN')} · {Math.max(0, Math.round(game.durationSeconds / 60))} 分钟</p></div>
              <span>{me?.isWinner ? <><Crown size={14} />本局获胜</> : game.endedAt ? '已结束' : '进行中'}</span>
              <b>{me?.finalScore ?? '—'}<small>声望</small></b>
              {game.endedAt ? <Link to={`/game/splendor/replay/${game.id}`} aria-label={`回放房间 ${game.roomID}`}><ArrowRight size={18} /></Link> : <i />}
            </article>;
          })}
          {error && <Feedback error>{error}<ActionButton onClick={retry}>重试</ActionButton></Feedback>}
          {!loading && !games.length && <Feedback>还没有对局记录。<Link to="/game/splendor">去大厅开一桌</Link></Feedback>}
          {hasMore && <ActionButton className={styles.more} pending={loading} onClick={loadMore}>加载更多</ActionButton>}
        </div>
      </section></div>}
    <button className={styles.aboutEntry} data-testid="splendor-about-entry" type="button"
      onClick={() => setPanel('about')}><span><Info size={17} /></span>
      <span><b>关于与联系</b><small>项目作者、源码与联系方式</small></span>
      <ChevronRight size={17} /></button>
    {panel === 'about' && <Dialog title="关于 Splendor Online" eyebrow="ABOUT & CONTACT"
      onClose={() => setPanel(undefined)}
      footer={<ActionButton onClick={() => setPanel(undefined)}>知道了</ActionButton>}>
      <ProjectContact gameName="Splendor" avatar={<PlayerAvatar name="nciyuan9264" size={58} />}
        classes={{ intro: styles.aboutIntro, links: styles.aboutLinks, legal: styles.aboutLegal }} />
    </Dialog>}
    {panel === 'logout' && <Dialog title="退出当前收藏家账号？" eyebrow="UNTIL NEXT TIME"
      onClose={() => setPanel(undefined)} footer={<><ActionButton onClick={() => setPanel(undefined)}>取消</ActionButton>
        <ActionButton variant="danger" pending={logoutAction.pending} onClick={() => void doLogout()}>确认退出</ActionButton></>}>
      <p className={styles.logoutCopy}>退出后将返回登录页。</p>
      {logoutAction.error && <Feedback error>{logoutAction.error}</Feedback>}
    </Dialog>}
  </div></AppShell>;
}
