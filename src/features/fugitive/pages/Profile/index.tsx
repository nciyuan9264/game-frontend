import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Footprints,
  LogOut,
  Route,
  Settings2,
  Shield,
} from 'lucide-react';
import { getProfile } from '@/features/game-core/api/auth';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import type { Game } from '@/features/game-core/model/history';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  AppShell,
  ProfileMonogram,
} from '../../components/AppShell';
import { FugitiveLoading } from '../../components/LoadingState';
import {
  Eyebrow,
  Modal,
  Portrait,
  Scene,
  roleName,
} from '../../components/Visual';
import { useFugitivePreferences } from '../../hooks/useFugitivePreferences';
import type { Role } from '../../model/types';

const gameRole = (value?: string): Role =>
  value === 'marshal' ? 'marshal' : 'fugitive';

export default function Profile() {
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('fugitive');
  const history = useGameHistory({ gameType: 'fugitive', pageSize: 20 });
  const preferences = useFugitivePreferences();
  const logout = useGameLogout();
  const [panel, setPanel] = useState<'preferences' | 'logout' | 'record'>();
  const [record, setRecord] = useState<Game>();
  const loading = profile.loading && !profile.data
    || stats.loading && !stats.data
    || history.loading && !history.games.length;
  const wins = stats.data?.wins ?? 0;
  const total = stats.data?.totalGames ?? 0;
  const fugitiveGames = stats.data?.gamesByRole?.fugitive ?? 0;
  const marshalGames = stats.data?.gamesByRole?.marshal ?? 0;
  const openRecord = (game: Game) => {
    setRecord(game);
    setPanel('record');
  };

  return <AppShell title="我的档案" profile={profile.data}>
    {loading
      ? <FugitiveLoading title="正在整理你的追逃档案。"
        description="同步身份、角色战绩与历史对局" />
      : <main className="page-content profile-page">
        <div className="page-heading"><Eyebrow>YOUR TRACE IN THE CITY</Eyebrow>
          <h1>每一场追逐，都有你的痕迹。</h1>
          <p>真实线上战绩、角色表现与已完成对局。</p></div>
        <div className="profile-layout">
          <section className="profile-card"><Scene index={1} />
            <ProfileMonogram profile={profile.data} className="profile-monogram" />
            <Eyebrow>ONLINE FIELD AGENT</Eyebrow>
            <h2>{profile.data?.name || '城市追踪者'}</h2>
            <p>{profile.data?.email || '在线玩家'}</p>
            <div className="profile-stats"><span><b>{total}</b>完成对局</span>
              <span><b>{wins}</b>获胜</span></div>
            <button className="button secondary" type="button"
              onClick={() => setPanel('preferences')}>
              <Settings2 size={16} />显示偏好</button>
            <button className="text-button" type="button"
              onClick={() => setPanel('logout')}><LogOut size={14} />退出登录</button>
          </section>
          <section className="profile-history">
            <div className="profile-role-stats">
              <span><Footprints size={17} /><b>{fugitiveGames}</b>逃亡对局</span>
              <span><Shield size={17} /><b>{marshalGames}</b>追捕对局</span>
            </div>
            <div className="section-heading"><h2>追逃档案</h2>
              <span className="pill">{total
                ? `${Math.round((stats.data?.winRate ?? 0) * 100)}% 胜率`
                : '等待第一局'}</span></div>
            {history.error && <p className="notice">{history.error}
              <button className="text-button" type="button"
                onClick={history.retry}>重试</button></p>}
            {!history.loading && !history.games.length
              ? <div className="empty-state profile-empty"><Route size={38} />
                <h3>城市还在等你的第一步。</h3>
                <p>完成一次逃脱或追捕后，对局会出现在这里。</p>
                <Link className="button primary" to="/game/fugitive">
                  开始第一场追逐<ArrowRight size={16} /></Link>
              </div>
              : history.games.map(game => {
                const me = game.players?.find(player =>
                  String(player.userID) === String(profile.data?.id));
                const role = gameRole(me?.gameRole);
                return <button className="record-row" type="button"
                  key={game.id} onClick={() => openRecord(game)}>
                  <Portrait role={role} className="avatar" />
                  <span className="record-copy">
                    <b>{game.roomDisplayName || `房间 ${game.roomID}`}</b>
                    <small>{roleName(role)} · {new Date(game.startedAt)
                      .toLocaleString('zh-CN')}</small>
                  </span>
                  <span className={`pill ${me?.isWinner ? 'won' : ''}`}>
                    {me?.isWinner ? '本局获胜' : '未能获胜'}</span>
                  <ChevronRight size={16} />
                </button>;
              })}
            {history.hasMore && <button className="button secondary full"
              type="button" disabled={history.loading}
              onClick={history.loadMore}>
              {history.loading ? '载入中…' : '加载更多对局'}</button>}
          </section>
        </div>
      </main>}

    {panel === 'preferences' && <Modal title="让行动更顺手。"
      kicker="DISPLAY PREFERENCES" onClose={() => setPanel(undefined)}
      footer={<button className="button primary full" type="button"
        onClick={() => setPanel(undefined)}>完成<Check size={16} /></button>}>
      <div className="preference-row"><div><h3>更清晰的文字</h3>
        <p>提高辅助文字对比度，牌桌同步生效。</p></div>
        <button type="button" role="switch" aria-label="更清晰的文字"
          aria-checked={preferences.contrast}
          className={`switch ${preferences.contrast ? 'on' : ''}`}
          onClick={() => preferences.setContrast(!preferences.contrast)}><span /></button>
      </div>
      <div className="preference-row"><div><h3>减少动效</h3>
        <p>关闭卡牌位移和装饰动画。</p></div>
        <button type="button" role="switch" aria-label="减少动效"
          aria-checked={preferences.reduced}
          className={`switch ${preferences.reduced ? 'on' : ''}`}
          onClick={() => preferences.setReduced(!preferences.reduced)}><span /></button>
      </div>
    </Modal>}

    {panel === 'logout' && <Modal title="离开当前账号？" kicker="SIGN OUT"
      onClose={() => setPanel(undefined)}
      footer={<><button className="button secondary" type="button"
        onClick={() => setPanel(undefined)}>取消</button>
        <button className="button primary" type="button"
          disabled={logout.pending} onClick={() => void logout.run()}>
          {logout.pending ? '正在退出…' : '退出登录'}</button></>}>
      <p>退出不会删除线上战绩与历史记录，下次登录后仍可查看。</p>
    </Modal>}

    {panel === 'record' && record && <Modal
      title={record.roomDisplayName || '追逃记录'}
      kicker="YOUR COMPLETED CHASE" onClose={() => setPanel(undefined)}
      footer={<button className="button secondary full" type="button"
        onClick={() => setPanel(undefined)}>返回档案</button>}>
      {(() => {
        const me = record.players?.find(player =>
          String(player.userID) === String(profile.data?.id));
        const role = gameRole(me?.gameRole);
        return <><div className="record-detail-heading">
          <Eyebrow>{new Date(record.startedAt).toLocaleString('zh-CN')}</Eyebrow>
          <h3>{record.roomDisplayName || `房间 ${record.roomID}`}</h3>
          <span className={`pill ${me?.isWinner ? 'won' : ''}`}>
            {me?.isWinner ? '本局获胜' : '未能获胜'}</span>
        </div><dl className="record-detail-list">
          <div><dt>你的身份</dt><dd>{roleName(role)}</dd></div>
          <div><dt>对局时长</dt><dd>{Math.max(0, Math.round(record.durationSeconds / 60))} 分钟</dd></div>
          <div><dt>结束原因</dt><dd>{record.endReason || '正常结算'}</dd></div>
          <div><dt>房间号</dt><dd>{record.roomID}</dd></div>
        </dl><p className="notice">Fugitive 首发只保存结算与历史摘要，不提供正式回放入口。</p></>;
      })()}
    </Modal>}
  </AppShell>;
}
