import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  Footprints,
  Info,
  LogOut,
  Mail,
  Pencil,
  Route,
  Shield,
} from 'lucide-react';
import { ProjectContact } from '@/components/GameUI/ProjectContact';
import {
  GameMobileAboutDialog,
  GameMobileProfile,
} from '@/components/GameUI/GamePublicMobile';
import { getProfile } from '@/features/game-core/api/auth';
import { useGameHistory } from '@/features/game-core/hooks/useGameHistory';
import { useGameLogout } from '@/features/game-core/hooks/useGameLogout';
import { useGameStats } from '@/features/game-core/hooks/useGameStats';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import type { Game } from '@/features/game-core/model/history';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  AppShell,
  fugitiveDialogThemeClassName,
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
import type { Role } from '../../model/types';

const gameRole = (value?: string): Role =>
  value === 'marshal' ? 'marshal' : 'fugitive';

export default function Profile() {
  const { isMobile } = useMobileViewport();
  const profile = useAsyncResource(getProfile);
  const stats = useGameStats('fugitive');
  const history = useGameHistory({ gameType: 'fugitive', pageSize: 20 });
  const logout = useGameLogout();
  const [panel, setPanel] = useState<'logout' | 'record' | 'about'>();
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
  if (isMobile) {
    const historyItems = history.games.map(game => {
      const me = game.players?.find(player =>
        String(player.userID) === String(profile.data?.id));
      const role = gameRole(me?.gameRole);
      const startedAt = new Date(game.startedAt).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return {
        id: String(game.id),
        title: game.roomID,
        detail: `${roleName(role)} · ${startedAt} · ${
          Math.max(0, Math.round(game.durationSeconds / 60))} 分钟`,
        accessory: me?.isWinner ? '本局获胜' : '未能获胜',
        onClick: () => openRecord(game),
      };
    });
    return <AppShell title="我的档案" profile={profile.data} compactMobileFooter>
      <main className="page-content profile-page">{loading
        ? <FugitiveLoading title="正在整理你的追逃档案。"
          description="同步身份、角色战绩与历史对局" />
        : <GameMobileProfile
          avatar={<ProfileMonogram profile={profile.data}
            className="profile-monogram" />}
          eyebrow="ONLINE FIELD AGENT"
          name={profile.data?.name || '城市追踪者'}
          playerID={profile.data?.id ?? '—'}
          email={profile.data?.email}
          stats={[
            { label: '完成对局', value: total },
            { label: '获胜', value: wins },
            { label: '胜率', value: `${total
              ? Math.round((stats.data?.winRate ?? 0) * 100) : 0}%` },
          ]}
          historyTitle="追逃档案"
          historyItems={historyItems}
          emptyHistory={<div className="empty-state profile-empty">
            <Route size={38} /><h3>城市还在等你的第一步。</h3>
            <Link className="button primary" to="/game/fugitive">
              开始第一场追逐
            </Link>
          </div>}
          historyFooter={history.hasMore && <button
            className="button secondary full" type="button"
            disabled={history.loading} onClick={history.loadMore}>
            {history.loading ? '载入中…' : '加载更多对局'}
          </button>}
          historyStatus={history.games.length && !history.hasMore
            ? '已经到底了' : undefined}
          logoutPending={logout.pending}
          logoutError={logout.error}
          onLogout={() => setPanel('logout')}
          onAbout={() => setPanel('about')}
        />}</main>
      {panel === 'about' && <GameMobileAboutDialog gameName="Fugitive"
        avatar={<ProfileMonogram profile={{ name: 'nciyuan9264' }}
          className="contact-monogram" />}
        themeClassName={fugitiveDialogThemeClassName}
        onClose={() => setPanel(undefined)} />}
      {panel === 'logout' && <Modal title="离开当前账号？" kicker="SIGN OUT"
        onClose={() => setPanel(undefined)}
        footer={<><button className="button secondary" type="button"
          onClick={() => setPanel(undefined)}>取消</button>
          <button className="button primary" type="button"
            disabled={logout.pending} onClick={() => void logout.run()}>
            {logout.pending ? '正在退出…' : '退出登录'}
          </button></>}>
        <p>退出不会删除线上战绩与历史记录，下次登录后仍可查看。</p>
      </Modal>}
      {panel === 'record' && record && <Modal
        title={record.roomID}
        kicker="YOUR COMPLETED CHASE" onClose={() => setPanel(undefined)}
        footer={<button className="button secondary full" type="button"
          onClick={() => setPanel(undefined)}>返回档案</button>}>
        {(() => {
          const me = record.players?.find(player =>
            String(player.userID) === String(profile.data?.id));
          const role = gameRole(me?.gameRole);
          return <><div className="record-detail-heading">
            <Eyebrow>{new Date(record.startedAt).toLocaleString('zh-CN')}</Eyebrow>
            <h3>{record.roomID}</h3>
            <span className={`pill ${me?.isWinner ? 'won' : ''}`}>
              {me?.isWinner ? '本局获胜' : '未能获胜'}
            </span>
          </div><dl className="record-detail-list">
            <div><dt>你的身份</dt><dd>{roleName(role)}</dd></div>
            <div><dt>对局时长</dt><dd>{
              Math.max(0, Math.round(record.durationSeconds / 60))} 分钟</dd></div>
            <div><dt>结束原因</dt><dd>{record.endReason || '正常结算'}</dd></div>
            <div><dt>房间号</dt><dd>{record.roomID}</dd></div>
          </dl><p className="notice">
            Fugitive 首发只保存结算与历史摘要，不提供正式回放入口。
          </p></>;
        })()}
      </Modal>}
    </AppShell>;
  }

  return <AppShell title="我的档案" profile={profile.data} compactMobileFooter>
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
            <p className="profile-id">PLAYER ID · {profile.data?.id ?? '—'}</p>
            <div className="profile-email"><Mail size={14} />
              {profile.data?.email || '邮箱未绑定'}</div>
            <div className="profile-stats"><span><b>{total}</b>完成对局</span>
              <span><b>{wins}</b>获胜</span>
              <span><b>{total ? Math.round((stats.data?.winRate ?? 0) * 100) : 0}%</b>胜率</span></div>
            <div className="profile-actions"><a href="https://auth.gamebus.online/profile">
              <Pencil size={14} />编辑资料</a>
              <button className="text-button" type="button"
                onClick={() => setPanel('logout')}><LogOut size={14} />退出登录</button></div>
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
                    <b>{game.roomID}</b>
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
        <button className="profile-about" data-testid="fugitive-about-entry"
          type="button" onClick={() => setPanel('about')}><span><Info size={17} /></span>
          <span><b>关于与联系</b><small>项目作者、源码与联系方式</small></span>
          <ChevronRight size={17} /></button>
      </main>}

    {panel === 'about' && <Modal title="关于 Fugitive Online"
      kicker="ABOUT & CONTACT" onClose={() => setPanel(undefined)}
      footer={<button className="button secondary full" type="button"
        onClick={() => setPanel(undefined)}>知道了</button>}>
      <ProjectContact gameName="Fugitive"
        avatar={<ProfileMonogram profile={{ name: 'nciyuan9264' }} className="contact-monogram" />}
        classes={{ intro: 'project-contact-intro', links: 'project-contact-links', legal: 'project-contact-legal' }} />
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
      title={record.roomID}
      kicker="YOUR COMPLETED CHASE" onClose={() => setPanel(undefined)}
      footer={<button className="button secondary full" type="button"
        onClick={() => setPanel(undefined)}>返回档案</button>}>
      {(() => {
        const me = record.players?.find(player =>
          String(player.userID) === String(profile.data?.id));
        const role = gameRole(me?.gameRole);
        return <><div className="record-detail-heading">
          <Eyebrow>{new Date(record.startedAt).toLocaleString('zh-CN')}</Eyebrow>
          <h3>{record.roomID}</h3>
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
