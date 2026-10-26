import { useState } from 'react';
import {
  ArrowLeft,
  Award,
  Check,
  Footprints,
  Info,
  LocateFixed,
  Shield,
  Trophy,
} from 'lucide-react';
import { getProfile } from '@/features/game-core/api/auth';
import { useGameLeaderboard } from '@/features/game-core/hooks/useGameLeaderboard';
import type {
  FugitiveLeaderboardEntry,
  LeaderboardSortDim,
} from '@/features/game-core/model/history';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { AppShell } from '../../components/AppShell';
import { FugitiveLoading } from '../../components/LoadingState';
import {
  Eyebrow,
  Modal,
  roleName,
} from '../../components/Visual';
import type { Role } from '../../model/types';

type RankingRole = 'all' | Role;

function RankAvatar({
  name,
  index,
}: {
  name: string;
  index: number;
}) {
  const classes = ['', 'sage', 'copper', 'blue'];
  return <span className={`rank-avatar ${classes[index % classes.length]}`}
    aria-hidden="true">{Array.from(name.trim() || '追')[0]}</span>;
}

export default function Rankings() {
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
  const boardName = role === 'all' ? '综合榜'
    : role === 'fugitive' ? '逃亡榜' : '追捕榜';

  return <AppShell title="排行榜" profile={profile.data}>
    <main className="page-content leaderboard-page">
      <div className="page-heading split-heading"><div>
        <Eyebrow>THE CITY'S MOST WANTED</Eyebrow>
        <h1>城市风云榜<span className="season-badge">ALL TIME</span></h1>
        <p>有人擅长消失，有人擅长看穿。所有记录都来自已完成的线上对局。</p>
      </div><button className="button secondary" type="button"
        onClick={() => setRulesOpen(true)}><Info size={15} />榜单说明</button></div>
      <div className="ranking-notice"><span className="pill">真实战绩</span>
        <span>按胜率、总场次和用户编号稳定排序；AI 不进入排行榜。</span>
        <span>{entries.length} 位玩家</span></div>

      {self && <div className="mobile-rank-summary">
        <RankAvatar name={self.displayName} index={myIndex} /><div>
          <b>我的位置 <strong>#{String(myIndex + 1).padStart(2, '0')}</strong></b>
          <small>{boardName} · {Math.round(self.winRate * 100)}% 胜率</small>
        </div><button className="button secondary" type="button"
          onClick={() => document.querySelector('.self-row')
            ?.scrollIntoView({ block: 'center', behavior: 'smooth' })}>
          <LocateFixed size={14} />定位我的名次</button>
      </div>}

      <div className="ranking-layout">
        <section className="ranking-table-panel dark-panel">
          <div className="ranking-tabs"><div className="tabs" role="tablist"
            aria-label="排行榜模式">
            {([
              { id: 'all', title: '综合榜', icon: Trophy },
              { id: 'fugitive', title: '逃亡榜', icon: Footprints },
              { id: 'marshal', title: '追捕榜', icon: Shield },
            ] as const).map(item => <button type="button" key={item.id}
              aria-pressed={role === item.id}
              role="tab" aria-selected={role === item.id}
              className={role === item.id ? 'active' : ''}
              onClick={() => setRole(item.id)}>
              <item.icon size={14} />{item.title}</button>)}
          </div><select aria-label="排行榜排序" value={mode}
            onChange={event => setMode(event.target.value as 'winRate' | 'games')}>
            <option value="winRate">按胜率</option>
            <option value="games">按完成场次</option>
          </select></div>
          <div className="ranking-toolbar"><span><i />
            {mode === 'winRate' ? '胜率优先排序' : '完成场次优先排序'}
            <small> · {entries.length} 位玩家</small></span></div>

          {leaderboard.loading && !entries.length
            && <FugitiveLoading title="正在整理城市名册。" description="载入真实排行榜记录" />}
          {leaderboard.error && <p className="notice">{leaderboard.error}
            <button className="text-button" type="button"
              onClick={leaderboard.retry}>重试</button></p>}
          <div className="ranking-table-scroll"><table className="ranking-table">
            <thead><tr><th>排名</th><th>玩家</th><th>胜率</th>
              <th>获胜 / 场次</th><th>身份榜</th><th><span className="sr-only">详情</span></th></tr></thead>
            <tbody>{entries.map((entry, index) => {
              const mine = String(entry.userID) === String(profile.data?.id);
              return <tr key={entry.userID} className={mine ? 'self-row' : ''}>
                <td><span className={`rank-number ${index < 3 ? 'top-rank' : ''}`}>
                  {String(index + 1).padStart(2, '0')}</span></td>
                <td><button className="rank-player-button" type="button"
                  onClick={() => setSelected(entry)}>
                  <RankAvatar name={entry.displayName} index={index} />
                  <span><b>{entry.displayName}{mine && <em>你</em>}</b>
                    <small>#{entry.playerID}</small></span></button></td>
                <td className="rating-cell">{Math.round(entry.winRate * 100)}%</td>
                <td className="games-cell"><b>{entry.wins}</b><span> / {entry.totalGames}</span></td>
                <td>{boardName}</td>
                <td><button className="icon-button" type="button"
                  aria-label={`查看 ${entry.displayName} 详情`}
                  onClick={() => setSelected(entry)}><Info size={15} /></button></td>
              </tr>;
            })}</tbody>
          </table></div>
          {!leaderboard.loading && !entries.length && !leaderboard.error
            && <div className="empty-state ranking-empty"><Trophy size={28} />
              <h3>这个榜单还在等待第一位玩家。</h3>
              <p>完成一场线上对局后，真实成绩会出现在这里。</p></div>}
          {leaderboard.hasMore && <div className="ranking-pagination">
            <span>已加载 {entries.length} 位玩家</span>
            <button className="button secondary" type="button"
              disabled={leaderboard.loading} onClick={leaderboard.loadMore}>加载更多</button>
          </div>}
        </section>

        <aside className="ranking-aside">
          <section className="my-ranking dark-panel">
            <div className="section-title"><h3>我的位置</h3>
              <span className="pill">{boardName}</span></div>
            {self ? <><div className="my-ranking-person">
              <RankAvatar name={self.displayName} index={myIndex} />
              <div><h3>{self.displayName}</h3><small>#{self.playerID}</small></div>
              <Award size={24} /></div>
              <div className="my-rank-score"><span><small>当前排名</small>
                <b><em>#</em>{String(myIndex + 1).padStart(2, '0')}</b></span>
                <span><small>真实胜率</small>
                  <b>{Math.round(self.winRate * 100)}%</b></span></div>
              <div className="my-rank-caption">{self.wins} 胜 / {self.totalGames} 场</div>
            </> : <p>当前筛选下还没有你的已完成对局。</p>}
          </section>
        </aside>
      </div>
    </main>

    {rulesOpen && <Modal title="名次有依据。"
      kicker="LEADERBOARD NOTES" onClose={() => setRulesOpen(false)}
      footer={<button className="button primary" type="button"
        onClick={() => setRulesOpen(false)}>知道了<Check size={15} /></button>}>
      <div className="rule-list"><p><b>01 · 三种榜单</b>综合榜统计全部 Fugitive 对局；逃亡榜和追捕榜只统计对应身份。</p>
        <p><b>02 · 默认排序</b>胜率降序、总场次降序、用户编号升序，确保相同成绩下顺序稳定。</p>
        <p><b>03 · 场次榜</b>切换后按完成场次查看活跃玩家，身份筛选仍然生效。</p>
        <p><b>04 · 真实记录</b>只有已完成真人账号对局进入统计，AI 不会出现在榜单。</p></div>
    </Modal>}

    {selected && <Modal title={selected.displayName}
      kicker={`PLAYER DOSSIER / #${selected.playerID}`}
      className="player-dossier" onClose={() => setSelected(undefined)}
      footer={<button className="button secondary" type="button"
        onClick={() => setSelected(undefined)}><ArrowLeft size={14} />返回排行榜</button>}>
      <div className="player-dossier-head">
        <RankAvatar name={selected.displayName} index={entries.indexOf(selected)} />
        <div><span className="pill">{boardName}</span><h3>线上追逃记录</h3>
          <p>{selected.totalGames} 场已完成对局</p></div>
      </div>
      <div className="role-performance"><div>
        <span>{role === 'marshal' ? <Shield size={18} /> : <Footprints size={18} />}
          <b>{role === 'all' ? '综合' : roleName(role)}</b></span>
        <strong>{Math.round(selected.winRate * 100)}%</strong><small>胜率</small>
        <div><span>获胜 <b>{selected.wins}</b></span>
          <span>完成 <b>{selected.totalGames}</b></span></div>
      </div></div>
    </Modal>}
  </AppShell>;
}
