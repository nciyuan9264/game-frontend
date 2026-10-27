import { useCallback } from 'react';
import { ArrowLeft, RefreshCw, Route } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { getProfile } from '@/features/game-core/api/auth';
import { useStartNextMatch } from '@/features/game-core/hooks/useStartNextMatch';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { lookupSixNimmtRoom } from '../../api/room';
import { AppShell } from '../../components/AppShell';
import { Dialog } from '../../components/Dialog';
import { SixNimmtLoading } from '../../components/LoadingState';
import { useSixNimmtLeave } from '../../hooks/useSixNimmtLeave';
import { useSixNimmtSession } from '../../hooks/useSixNimmtSession';
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
  return <div className="sn-session-exit" role="alert"><Route size={34} />
    <span className="sn-eyebrow">SESSION CLOSED</span><h1>{title}</h1><p>{message}</p>
    <div>{onRetry && <ActionButton onClick={onRetry}>
      <RefreshCw size={14} />重新验证</ActionButton>}
      <ActionButton variant="primary" onClick={onLeave}>
        <ArrowLeft size={15} />返回大厅</ActionButton></div></div>;
}

function Session({ roomID }: { roomID: string }) {
  const loadTarget = useCallback(async () => {
    const profile = await getProfile();
    if (!roomID) return { profile, room: undefined, matchID: '' };
    const room = await lookupSixNimmtRoom(roomID);
    if (!room.currentMatchID) throw new Error('当前房间没有可连接的对局');
    return { profile, room, matchID: room.currentMatchID };
  }, [roomID]);
  const target = useAsyncResource(loadTarget);
  const nextMatch = useStartNextMatch('sixnimmt', roomID);
  const matchID = nextMatch.matchID || target.data?.matchID || '';
  const session = useSixNimmtSession(roomID, matchID, nextMatch.adoptMatch);
  const leave = useSixNimmtLeave(session.connection.close);
  const { connection, snapshot } = session;
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

  if (initialLoading) return <SixNimmtLoading fullScreen
    title="正在进入牧场牌桌。" description="正在确认身份并同步权威牌局" />;
  if (!target.data) return <AppShell inMatch title="对局验证失败" profile={profile}>
    <ExitState title="无法确认当前对局"
      message={target.error || '暂时无法确认登录状态与当前房间，请重试。'}
      onRetry={target.retry} onLeave={leave.confirm} />
  </AppShell>;

  return <AppShell inMatch hideHeader={snapshot?.type === 'ROOM_SYNC'}
    profile={profile} title={snapshot?.type === 'MATCH_SYNC' ? '准备房间' : '牧场牌桌'}>
    {!roomID && <ExitState title="对局链接无效"
      message="链接缺少房间号，请返回大厅重新进入。" onLeave={leave.confirm} />}
    {roomID && connection.fatal && <ExitState title="无法进入当前房间"
      message={connection.fatal} onLeave={leave.confirm} />}
    {roomID && !connection.fatal && connection.status !== 'connected'
      && <Feedback>{connection.status === 'connecting'
        ? '正在连接牌桌…'
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
      title={snapshot?.type === 'ROOM_SYNC' ? '暂时离开这张牌桌？' : '离开当前房间？'}
      eyebrow="LEAVE THE TABLE" onClose={leave.cancel}
      footer={<><ActionButton onClick={leave.cancel}>继续留下</ActionButton>
        <ActionButton variant="danger" onClick={leave.confirm}>确认离开</ActionButton></>}>
      <p>{snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus !== 'end'
        ? '离开后会标记为离线。你仍可通过原房间链接重连，超时阶段由公平 AI 代为完成当前合法操作。'
        : '离开后将返回大厅；准备阶段的真人席位会被释放。'}</p>
    </Dialog>}
  </AppShell>;
}

export default function SixNimmtSessionPage() {
  const [params] = useSearchParams();
  const roomID = params.get('roomID') ?? '';
  return <Session key={roomID} roomID={roomID} />;
}
