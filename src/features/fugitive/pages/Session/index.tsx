import { useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Route,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getProfile } from '@/features/game-core/api/auth';
import { useStartNextMatch } from '@/features/game-core/hooks/useStartNextMatch';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { lookupFugitiveRoom } from '../../api/room';
import {
  AppShell,
  FugitiveRoot,
} from '../../components/AppShell';
import { FugitiveLoading } from '../../components/LoadingState';
import { Modal } from '../../components/Visual';
import { useFugitiveLeave } from '../../hooks/useFugitiveLeave';
import { useFugitivePreferences } from '../../hooks/useFugitivePreferences';
import { useFugitiveSession } from '../../hooks/useFugitiveSession';
import { Play } from '../Play';
import { Room } from '../Room';

function ExitState({
  title,
  message,
  onLeave,
  onRetry,
}: {
  title: string;
  message: string;
  onLeave: () => void;
  onRetry?: () => void;
}) {
  return <main className="page-content"><div className="empty-state" role="alert">
    <Route size={34} /><span className="eyebrow">SESSION CLOSED</span>
    <h1>{title}</h1><p>{message}</p>
    <div>{onRetry && <button className="button secondary" type="button" onClick={onRetry}>
      <RefreshCw size={14} />重新连接</button>}
      <button className="button primary" type="button" onClick={onLeave}>
        <ArrowLeft size={15} />返回大厅</button></div>
  </div></main>;
}

function Session({ roomID }: { roomID: string }) {
  const preferences = useFugitivePreferences();
  const loadTarget = useCallback(async () => {
    const profile = await getProfile();
    if (!roomID) return { profile, room: undefined, matchID: '' };
    const room = await lookupFugitiveRoom(roomID);
    if (!room.currentMatchID) throw new Error('当前房间没有可连接的对局');
    return { profile, room, matchID: room.currentMatchID };
  }, [roomID]);
  const target = useAsyncResource(loadTarget);
  const nextMatch = useStartNextMatch('fugitive', roomID);
  const matchID = nextMatch.matchID || target.data?.matchID || '';
  const session = useFugitiveSession(roomID, matchID);
  const leave = useFugitiveLeave(session.connection.close);
  const { connection, snapshot } = session;
  const profile = target.data?.profile;
  const initialLoading = target.loading && !target.data
    || !!roomID && !!matchID && !snapshot
      && (connection.status === 'connecting' || connection.status === 'reconnecting');

  if (initialLoading) {
    return <AppShell room title="连接追逃房间" profile={profile}>
      <FugitiveLoading description={target.data
        ? '正在建立可靠会话'
        : '正在确认身份与当前对局'} />
    </AppShell>;
  }
  if (!target.data) {
    return <AppShell room title="对局验证失败" profile={profile}>
      <ExitState title="无法确认当前对局"
        message={target.error || '暂时无法确认登录状态与当前房间，请重试。'}
        onRetry={target.retry} onLeave={leave.confirm} />
    </AppShell>;
  }

  const connectionNotice = connection.status !== 'connected'
    ? connection.status === 'reconnecting'
      ? `正在恢复连接（${connection.attempt} / 5），当前牌桌保持只读`
      : '连接暂时中断，当前牌桌保持只读'
    : nextMatch.error || undefined;

  return <FugitiveRoot className={preferences.className}>
    {!roomID && <AppShell room title="对局链接无效" profile={profile}>
      <ExitState title="对局链接无效" message="链接缺少房间号，请返回大厅重新进入。"
        onLeave={leave.confirm} />
    </AppShell>}
    {roomID && connection.fatal && <AppShell room title="无法进入房间" profile={profile}>
      <ExitState title="无法进入当前房间" message={connection.fatal}
        onLeave={leave.confirm} />
    </AppShell>}
    {roomID && !connection.fatal && snapshot?.type === 'MATCH_SYNC'
      && <AppShell room title="准备房间" profile={profile}>
        {session.feedback && <div className="toast" role="alert">{session.feedback}</div>}
        {connectionNotice && <div className="toast" role="status">{connectionNotice}</div>}
        <Room session={session} data={snapshot} room={target.data.room}
          onLeave={leave.request} />
      </AppShell>}
    {roomID && !connection.fatal && snapshot?.type === 'ROOM_SYNC'
      && <Play session={session} data={snapshot}
        roomName={target.data.room?.displayName || '午夜追缉'}
        onLeave={leave.request}
        onStartNextMatch={() => void nextMatch.start()}
        startNextMatchPending={nextMatch.pending}
        connectionNotice={connectionNotice} />}
    {leave.visible && <Modal
      title={snapshot?.type === 'ROOM_SYNC' ? '暂时离开这场追逐？' : '离开当前房间？'}
      kicker="LEAVE THE TABLE" onClose={leave.cancel}
      footer={<><button className="button secondary" type="button"
        onClick={leave.cancel}>继续留下</button>
        <button className="button primary" type="button"
          onClick={leave.confirm}>确认离开</button></>}>
      <p>{snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus !== 'end'
        ? '离开后当前身份会标记为离线。你仍可使用原房间链接重连，并恢复服务端最新状态。'
        : '离开后将返回大厅；准备阶段的真人席位会被释放。'}</p>
    </Modal>}
  </FugitiveRoot>;
}

export default function FugitiveSessionPage() {
  const [params] = useSearchParams();
  const roomID = params.get('roomID') ?? '';
  return <Session key={roomID} roomID={roomID} />;
}
