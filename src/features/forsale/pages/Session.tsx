import { useCallback } from 'react';
import { ArrowLeft, RefreshCw, Route } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { Feedback } from '@/components/GameUI/Panel';
import { getProfile } from '@/features/game-core/api/auth';
import { useStartNextMatch } from '@/features/game-core/hooks/useStartNextMatch';
import {
  describeSessionConnectionFailure,
  describeSessionTargetFailure,
} from '@/features/game-core/model/sessionTarget';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { lookupForSaleRoom } from '../api/room';
import { AppShell } from '../components/AppShell';
import { ForSaleLoading } from '../components/LoadingState';
import { useForSaleLeave } from '../hooks/useForSaleLeave';
import { useForSaleSession } from '../hooks/useForSaleSession';
import {
  playerName,
  selfID,
} from '../model/session';
import { Play } from './Play';
import { Room } from './Room';

const ExitState = ({
  title,
  message,
  onLeave,
  onRetry,
}: {
  title: string;
  message: string;
  onLeave: () => void;
  onRetry?: () => void;
}) => <div className="fs-session-exit" role="alert"><Route size={34} />
  <span className="fs-eyebrow">SESSION CLOSED</span><h1>{title}</h1>
  <p>{message}</p><div>{onRetry && <ActionButton onClick={onRetry}>
    <RefreshCw size={14} />重新验证</ActionButton>}
    <ActionButton variant="primary" onClick={onLeave}>
      <ArrowLeft size={15} />返回大厅</ActionButton></div></div>;

const Session = ({ roomID }: { roomID: string }) => {
  const loadTarget = useCallback(async () => {
    const profile = await getProfile();
    if (!roomID) return { profile, matchID: '' };
    const room = await lookupForSaleRoom(roomID);
    if (!room.currentMatchID) throw new Error('当前房间没有可连接的对局');
    return { profile, matchID: room.currentMatchID };
  }, [roomID]);
  const target = useAsyncResource(loadTarget);
  const targetFailure = describeSessionTargetFailure(target.failure, target.error);
  const nextMatch = useStartNextMatch('forsale', roomID);
  const matchID = nextMatch.matchID || target.data?.matchID || '';
  const session = useForSaleSession(roomID, matchID, nextMatch.adoptMatch);
  const leave = useForSaleLeave(session.connection.close);
  const { connection, snapshot } = session;
  const connectionFailure = describeSessionConnectionFailure(connection.fatalCode, connection.fatal);
  const players = snapshot?.type === 'MATCH_SYNC'
    ? snapshot.players : snapshot?.roomData.players;
  const id = snapshot ? selfID(snapshot) : '';
  const current = players?.[id];
  const profile = current
    ? { name: playerName(id, players), avatar: current.avatar }
    : target.data?.profile;
  const initialLoading = target.loading && !target.data
    || !!roomID && !!matchID && !snapshot
      && (connection.status === 'connecting'
        || connection.status === 'reconnecting');
  if (initialLoading) return <ForSaleLoading fullScreen
    title="正在进入周末拍卖所。" description="确认身份并同步权威牌桌" />;
  if (!target.data) return <AppShell inMatch title="对局验证失败" profile={profile}>
    <ExitState title={targetFailure.title}
      message={targetFailure.message}
      onRetry={targetFailure.terminal ? undefined : target.retry}
      onLeave={leave.confirm} />
  </AppShell>;
  return <AppShell inMatch hideHeader={snapshot?.type === 'ROOM_SYNC'}
    profile={profile} title={snapshot?.type === 'MATCH_SYNC' ? '准备房间' : '拍卖现场'}>
    {!roomID && <ExitState title="对局链接无效"
      message="链接缺少房间号，请返回大厅重新进入。" onLeave={leave.confirm} />}
    {roomID && connection.fatal && <ExitState title={connectionFailure.title}
      message={connectionFailure.message} onLeave={leave.confirm} />}
    {roomID && !connection.fatal && connection.status !== 'connected'
      && <Feedback>{connection.status === 'connecting'
        ? '正在连接牌桌…'
        : connection.status === 'reconnecting'
          ? `正在恢复连接（${connection.attempt} / 5）…`
          : '连接暂时中断'}
        <span>当前画面保持只读，恢复后以服务端最新状态为准。</span>
        {connection.status === 'disconnected' && <ActionButton onClick={connection.retry}>
          <RefreshCw size={14} />重新连接</ActionButton>}</Feedback>}
    {session.feedback && snapshot?.type === 'MATCH_SYNC'
      && <Feedback error>{session.feedback}</Feedback>}
    {nextMatch.error && <Feedback error>{nextMatch.error}</Feedback>}
    {snapshot?.type === 'MATCH_SYNC' && <Room session={session}
      data={snapshot} onLeave={leave.request} />}
    {snapshot?.type === 'ROOM_SYNC' && <Play session={session} data={snapshot}
      onLeave={leave.request} onStartNextMatch={() => void nextMatch.start()}
      startNextMatchPending={nextMatch.pending} />}
    {leave.visible && <ResponsiveDialog
      title={snapshot?.type === 'ROOM_SYNC' ? '暂时离开这张牌桌？' : '离开当前房间？'}
      eyebrow="LEAVE THE TABLE" onClose={leave.cancel}
      footer={<><ActionButton onClick={leave.cancel}>继续留下</ActionButton>
        <ActionButton variant="danger" onClick={leave.confirm}>
          确认离开</ActionButton></>}>
      <p>{snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus !== 'end'
        ? '离开后会标记为离线。你可以通过原链接重连，超时阶段由公平 AI 托管。'
        : '离开后将返回大厅；准备阶段的真人席位会被释放。'}</p>
    </ResponsiveDialog>}
  </AppShell>;
};

export default function ForSaleSessionPage() {
  const [params] = useSearchParams();
  const roomID = params.get('roomID') ?? '';
  return <Session key={roomID} roomID={roomID} />;
}
