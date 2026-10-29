import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Footprints,
  Shield,
  Trophy,
} from 'lucide-react';
import { GameTabs } from '@/components/GameUI/GameTabs';
import { GameMobileRankings } from '@/components/GameUI/GamePublicMobile';
import { getProfile } from '@/features/game-core/api/auth';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import type {
  FugitiveLeaderboardEntry,
  LeaderboardSortDim,
} from '@/features/game-core/model/history';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { AppShell } from '../../components/AppShell';
import {
  Modal,
  roleName,
} from '../../components/Visual';
import type { Role } from '../../model/types';
import styles from '../community.module.less';

type RankingRole = 'all' | Role;

const roleOptions = [
  { value: 'all', label: '综合榜' },
  { value: 'fugitive', label: '逃亡榜' },
  { value: 'marshal', label: '追捕榜' },
] as const;

function RankingRoleSelect({
  value,
  onChange,
}: {
  value: RankingRole;
  onChange: (value: RankingRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const selectedIndex = roleOptions.findIndex(option => option.value === value);
  const selectedOption = roleOptions[selectedIndex] ?? roleOptions[0];

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [open]);

  const openListbox = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const selectOption = (nextValue: RankingRole) => {
    onChange(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openListbox();
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(current =>
        (current + direction + roleOptions.length) % roleOptions.length);
      return;
    }

    if (open && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : roleOptions.length - 1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) selectOption(roleOptions[activeIndex].value);
      else openListbox();
    }
  };

  return <div className={styles.roleSelect} ref={rootRef}
    onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
    }}>
    <button ref={triggerRef} type="button" role="combobox"
      className={`${styles.roleSelectTrigger} ${open ? styles.roleSelectOpen : ''}`}
      aria-label="排行榜身份" aria-expanded={open}
      aria-controls={listboxId}
      aria-activedescendant={open ? `${listboxId}-${activeIndex}` : undefined}
      onClick={() => open ? setOpen(false) : openListbox()}
      onKeyDown={handleKeyDown}>
      <span>{selectedOption.label}</span>
      <ChevronDown size={15} aria-hidden="true" />
    </button>
    {open && <ul id={listboxId} className={styles.roleSelectMenu}
      role="listbox" aria-label="排行榜身份选项">
      {roleOptions.map((option, index) =>
        <li key={option.value}>
          <button id={`${listboxId}-${index}`} type="button" role="option"
            className={styles.roleSelectOption}
            aria-selected={option.value === value}
            data-active={index === activeIndex}
            tabIndex={-1}
            onPointerMove={() => setActiveIndex(index)}
            onClick={() => selectOption(option.value)}>
            <span>{option.label}</span>
            {option.value === value && <Check size={12} aria-hidden="true" />}
          </button>
        </li>)}
    </ul>}
  </div>;
}

function RankAvatar({
  name,
  index,
}: {
  name: string;
  index: number;
}) {
  const variants = [
    styles.avatarGold,
    styles.avatarSage,
    styles.avatarCopper,
    styles.avatarBlue,
  ];
  return <span className={`${styles.rankAvatar} ${variants[index % variants.length]}`}
    aria-hidden="true">{Array.from(name.trim() || '追')[0]}</span>;
}

export default function Rankings() {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const [role, setRole] = useState<RankingRole>('all');
  const [mode, setMode] = useState<'winRate' | 'games'>('winRate');
  const [selected, setSelected] = useState<FugitiveLeaderboardEntry>();
  const [rulesOpen, setRulesOpen] = useState(false);
  const sort: LeaderboardSortDim = mode === 'games' ? 'totalGames' : 'metric';
  const leaderboard = useGameLeaderboard<FugitiveLeaderboardEntry>({
    gameType: 'fugitive',
    pageSize: 50,
    sort,
    gameRole: role === 'all' ? undefined : role,
  });
  const entries = leaderboard.entries;
  const myIndex = entries.findIndex(entry =>
    String(entry.userID) === String(profile.data?.id));
  const self = myIndex >= 0 ? entries[myIndex] : undefined;
  const boardName = roleOptions.find(option => option.value === role)?.label
    ?? '综合榜';

  if (isMobile) {
    return <AppShell title="排行榜" profile={profile.data} compactMobileFooter>
      <main className="page-content"><GameMobileRankings
        eyebrow="FUGITIVE LEADERBOARD"
        title="城市风云榜"
        description="用真实胜率衡量稳定发挥，也记录每一次完成的追逐。"
        modes={[
          { value: 'winRate', label: '战绩榜' },
          { value: 'games', label: '场次榜' },
        ]}
        mode={mode}
        onModeChange={setMode}
        entries={entries.map(entry => ({
          id: String(entry.userID),
          displayName: entry.displayName,
          totalGames: entry.totalGames,
          metric: `${Math.round(entry.winRate * 100)}%`,
          metricLabel: '胜率',
        }))}
        currentUserID={String(profile.data?.id ?? '')}
        renderAvatar={entry => <RankAvatar name={entry.displayName}
          index={entries.findIndex(item =>
            String(item.userID) === String(entry.id))} />}
        controls={<RankingRoleSelect value={role} onChange={setRole} />}
        state={<>{leaderboard.loading && !entries.length
          && <div className={styles.rankState} role="status">
            正在整理城市名册...
          </div>}
          {leaderboard.error && !entries.length
            && <div className={`${styles.rankState} ${styles.rankError}`}
              role="alert">
              <span>{leaderboard.error}</span>
              <button className="button secondary" type="button"
                onClick={leaderboard.retry}>重试</button>
            </div>}</>}
        footer={!!entries.length && leaderboard.hasMore
          && <div className={styles.rankMore}>
            <span>已加载 {entries.length} 位玩家</span>
            <button className="button secondary" type="button"
              disabled={leaderboard.loading}
              onClick={leaderboard.loadMore}>加载更多</button>
          </div>}
      /></main>
    </AppShell>;
  }
  return <AppShell title="排行榜" profile={profile.data} compactMobileFooter>
    <main className={`page-content ${styles.page} ${styles.rankPage}`}>
      <header className={styles.communityHeading}><div>
        <small>THE CITY'S MOST WANTED</small>
        <h1>每一场追逐，都留下痕迹。</h1>
      </div><span className={styles.outlineTag}>真实对局记录</span></header>

      <section className={styles.rankHero} data-testid="fugitive-rank-hero">
        <button type="button" className={styles.heroInfo}
          aria-label="查看榜单说明" onClick={() => setRulesOpen(true)}>
          <Trophy size={29} />
        </button>
        <div><small>FUGITIVE LEADERBOARD</small><h2>城市风云榜</h2>
          <p>用真实胜率衡量稳定发挥，也记录每一次完成的追逐。</p></div>
        <div className={styles.myRank}><span>我的排名</span>
          <b>{myIndex >= 0 ? `#${myIndex + 1}` : '—'}</b>
          <small>{self
            ? `${Math.round(self.winRate * 100)}% 胜率 · ${self.totalGames} 场`
            : '完成对局后进入排行'}</small>
        </div>
      </section>

      <section className={styles.rankPanel} data-testid="fugitive-rank-panel">
        <div className={styles.rankControls}>
          <GameTabs className={styles.rankTabs} activeClassName={styles.activeTab}
            ariaLabel="排行榜模式" value={mode} onChange={setMode}
            items={[
              { value: 'winRate', label: '战绩榜' },
              { value: 'games', label: '场次榜' },
            ]} />
          <div className={styles.roleFilter}>
            <RankingRoleSelect value={role} onChange={setRole} />
          </div>
        </div>

        <div className={`${styles.rankRow} ${styles.rankHead}`}>
          <span>名次</span><span>玩家</span><span>胜率</span><span>获胜 / 场次</span>
        </div>
        {leaderboard.loading && !entries.length
          && <div className={styles.rankState} role="status">正在整理城市名册...</div>}
        {leaderboard.error && !entries.length
          && <div className={`${styles.rankState} ${styles.rankError}`} role="alert">
            <span>{leaderboard.error}</span>
            <button className="button secondary" type="button"
              onClick={leaderboard.retry}>重试</button>
          </div>}
        {entries.map((entry, index) => {
          const mine = String(entry.userID) === String(profile.data?.id);
          return <div className={`${styles.rankRow} ${mine ? styles.rankSelf : ''}`}
            key={entry.userID}>
            <span className={styles.rankNumber}>
              {index === 0 ? <Trophy size={20} /> : String(index + 1).padStart(2, '0')}
            </span>
            <button className={styles.rankPlayer} type="button"
              onClick={() => setSelected(entry)}>
              <RankAvatar name={entry.displayName} index={index} />
              <span><b>{entry.displayName}{mine && <em>你</em>}</b>
                <small>#{entry.playerID}</small></span>
            </button>
            <span className={styles.winRate}>{Math.round(entry.winRate * 100)}%</span>
            <span className={styles.games}><b>{entry.wins}</b> / {entry.totalGames}</span>
          </div>;
        })}
        {!leaderboard.loading && !entries.length && !leaderboard.error
          && <div className={styles.rankEmpty}><Trophy size={28} />
            <h3>这个榜单还在等待第一位玩家。</h3>
            <p>完成一场线上对局后，真实成绩会出现在这里。</p></div>}
        {!!entries.length && leaderboard.hasMore && <div className={styles.rankMore}>
          <span>已加载 {entries.length} 位玩家</span>
          <button className="button secondary" type="button"
            disabled={leaderboard.loading}
            onClick={leaderboard.loadMore}>加载更多</button>
        </div>}
      </section>
    </main>

    {rulesOpen && <Modal title="名次有依据。"
      kicker="LEADERBOARD NOTES" onClose={() => setRulesOpen(false)}
      footer={<button className="button primary" type="button"
        onClick={() => setRulesOpen(false)}>知道了<Check size={15} /></button>}>
      <div className={styles.ruleList}>
        <p><b>01 · 三种榜单</b>综合榜统计全部 Fugitive 对局；逃亡榜和追捕榜只统计对应身份。</p>
        <p><b>02 · 默认排序</b>胜率降序、总场次降序、用户编号升序，确保相同成绩下顺序稳定。</p>
        <p><b>03 · 场次榜</b>切换后按完成场次查看活跃玩家，身份筛选仍然生效。</p>
        <p><b>04 · 真实记录</b>只有已完成真人账号对局进入统计，AI 不会出现在榜单。</p>
      </div>
    </Modal>}

    {selected && <Modal title={selected.displayName}
      kicker={`PLAYER DOSSIER / #${selected.playerID}`}
      onClose={() => setSelected(undefined)}
      footer={<button className="button secondary" type="button"
        onClick={() => setSelected(undefined)}><ArrowLeft size={14} />返回排行榜</button>}>
      <div className={styles.playerDossier}>
        <RankAvatar name={selected.displayName} index={entries.indexOf(selected)} />
        <div><span>{boardName}</span><h3>线上追逃记录</h3>
          <p>{selected.totalGames} 场已完成对局</p></div>
      </div>
      <div className={styles.performance}><div>
        <span>{role === 'marshal' ? <Shield size={18} /> : <Footprints size={18} />}
          <b>{role === 'all' ? '综合' : roleName(role)}</b></span>
        <strong>{Math.round(selected.winRate * 100)}%</strong><small>胜率</small>
        <p>获胜 <b>{selected.wins}</b> · 完成 <b>{selected.totalGames}</b></p>
      </div></div>
    </Modal>}
  </AppShell>;
}
