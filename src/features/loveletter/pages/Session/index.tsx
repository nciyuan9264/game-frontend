import { useCallback } from 'react';
import { ArrowLeft, RefreshCw, Route } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { getProfile } from '@/features/game-core/api/auth';
import { useStartNextMatch } from '@/features/game-core/hooks/useStartNextMatch';
import {
  describeSessionConnectionFailure,
  describeSessionTargetFailure,
} from '@/features/game-core/model/sessionTarget';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { lookupLoveLetterRoom } from '../../api/room';
import { AppShell } from '../../components/AppShell';
import { Dialog } from '../../components/Dialog';
import { LoveLetterLoading } from '../../components/LoadingState';
import { useLoveLetterLeave } from '../../hooks/useLoveLetterLeave';
import { useLoveLetterSession } from '../../hooks/useLoveLetterSession';
import { playerName, selfID } from '../../model/session';
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
  return <div className="ll-session-exit" role="alert"><Route size={34} />
    <span className="ll-eyebrow">SESSION CLOSED</span><h1>{title}</h1><p>{message}</p>
    <div>{onRetry && <ActionButton onClick={onRetry}>
      <RefreshCw size={14} />重新验证</ActionButton>}
      <ActionButton variant="primary" onClick={onLeave}>
        <ArrowLeft size={15} />返回大厅</ActionButton></div></div>;
}

function Session({ roomID }: { roomID: string }) {
  const loadTarget = useCallback(async () => {
    const profile = await getProfile();
    if (!roomID) return { profile, room: undefined, matchID: '' };
    const room = await lookupLoveLetterRoom(roomID);
    if (!room.currentMatchID) throw new Error('当前房间没有可连接的对局');
    return { profile, room, matchID: room.currentMatchID };
  }, [roomID]);
  const target = useAsyncResource(loadTarget);
  const targetFailure = describeSessionTargetFailure(target.failure, target.error);
  const nextMatch = useStartNextMatch('loveletter', roomID);
  const matchID = nextMatch.matchID || target.data?.matchID || '';
  const session = useLoveLetterSession(roomID, matchID, nextMatch.adoptMatch);
  const leave = useLoveLetterLeave(session.connection.close);
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
      && (connection.status === 'connecting' || connection.status === 'reconnecting');

  if (initialLoading) return <LoveLetterLoading fullScreen
    title="正在进入玫瑰庭院。" description="正在确认身份并同步权威牌局" />;
  if (!target.data) return <AppShell inMatch title="对局验证失败" profile={profile}>
    <ExitState title={targetFailure.title}
      message={targetFailure.message}
      onRetry={targetFailure.terminal ? undefined : target.retry}
      onLeave={leave.confirm} />
  </AppShell>;

  return <AppShell inMatch hideHeader={snapshot?.type === 'ROOM_SYNC'}
    profile={profile} title={snapshot?.type === 'MATCH_SYNC' ? '准备房间' : '玫瑰庭院'}>
    {!roomID && <ExitState title="对局链接无效"
      message="链接缺少房间号，请返回大厅重新进入。" onLeave={leave.confirm} />}
    {roomID && connection.fatal && <ExitState title={connectionFailure.title}
      message={connectionFailure.message} onLeave={leave.confirm} />}
    {roomID && !connection.fatal && connection.status !== 'connected'
      && <Feedback>{connection.status === 'connecting'
        ? '正在连接庭院…'
        : connection.status === 'reconnecting'
          ? `正在恢复连接（${connection.attempt} / 5）…`
          : '连接暂时中断'}
        <span>当前画面保持只读，恢复后以服务端最新状态为准。</span>
        {connection.status === 'disconnected' && <ActionButton onClick={connection.retry}>
          <RefreshCw size={14} />重新连接</ActionButton>}</Feedback>}
    {session.feedback && !connection.fatal && snapshot?.type === 'MATCH_SYNC'
      && <Feedback error>{session.feedback}</Feedback>}
    {nextMatch.error && !connection.fatal && <Feedback error>{nextMatch.error}</Feedback>}
    {snapshot?.type === 'MATCH_SYNC' && <Room session={session}
      data={snapshot} onLeave={leave.request} />}
    {snapshot?.type === 'ROOM_SYNC' && <Play session={session} data={snapshot}
      onLeave={leave.request} onStartNextMatch={() => void nextMatch.start()}
      startNextMatchPending={nextMatch.pending} />}
    {leave.visible && <Dialog
      title={snapshot?.type === 'ROOM_SYNC' ? '暂时离开这座庭院？' : '离开当前房间？'}
      eyebrow="LEAVE THE TABLE" onClose={leave.cancel}
      footer={<><ActionButton onClick={leave.cancel}>继续留下</ActionButton>
        <ActionButton variant="danger" onClick={leave.confirm}>确认离开</ActionButton></>}>
      <p>{snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus !== 'end'
        ? '离开后会标记为离线。你仍可通过原房间链接重连，超时阶段由公平 AI 代为完成当前合法操作。'
        : '离开后将返回大厅；准备阶段的真人席位会被释放。'}</p>
    </Dialog>}
  </AppShell>;
}

export default function LoveLetterSessionPage() {
  const [params] = useSearchParams();
  const roomID = params.get('roomID') ?? '';
  return <Session key={roomID} roomID={roomID} />;
}
