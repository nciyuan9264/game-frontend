import { useCallback } from 'react';
import { ArrowLeft, RefreshCw, Swords } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getProfile } from '@/features/game-core/api/auth';
import { useStartNextMatch } from '@/features/game-core/hooks/useStartNextMatch';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { lookupWarChestRoom } from '../../api/room';
import { Shell, Loading, Notice } from '../../components/Shell';
import { useWarChestLeave } from '../../hooks/useWarChestLeave';
import { useWarChestSession } from '../../hooks/useWarChestSession';
import { toBattleGame } from '../../selectors';
import { Modal } from '../../visuals';
import { Battle } from '../Battle';
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
  return <main className="page"><div className="empty-state" role="alert">
    <Swords size={36} /><span className="eyebrow">SESSION CLOSED</span>
    <h1>{title}</h1><p>{message}</p><div>
      {onRetry && <button className="button secondary" type="button" onClick={onRetry}>
        <RefreshCw size={14} />重新连接</button>}
      <button className="button primary" type="button" onClick={onLeave}>
        <ArrowLeft size={15} />返回大厅</button></div></div></main>;
}

function Session({ roomID }: { roomID: string }) {
  const loadTarget = useCallback(async () => {
    const profile = await getProfile();
    if (!roomID) return { profile, room: undefined, matchID: '' };
    const room = await lookupWarChestRoom(roomID);
    if (!room.currentMatchID) throw new Error('当前房间没有可连接的对局');
    return { profile, room, matchID: room.currentMatchID };
  }, [roomID]);
  const target = useAsyncResource(loadTarget);
  const nextMatch = useStartNextMatch('warchest', roomID);
  const matchID = nextMatch.matchID || target.data?.matchID || '';
  const session = useWarChestSession(roomID, matchID, nextMatch.adoptMatch);
  const leave = useWarChestLeave(session.connection.close);
  const { connection, snapshot } = session;
  const profile = target.data?.profile;
  const initialLoading = target.loading && !target.data
    || !!roomID && !!matchID && !snapshot
      && (connection.status === 'connecting' || connection.status === 'reconnecting');

  if (initialLoading) return <div className="warchest-root">
    <Loading text="正在进入战争之匣。" />
  </div>;
  if (!target.data) return <Shell title="对局验证失败" profile={profile}>
    <ExitState title="无法确认当前对局"
      message={target.error || '暂时无法确认登录状态与当前房间，请重试。'}
      onRetry={target.retry} onLeave={leave.confirm} />
  </Shell>;
  if (!roomID) return <Shell title="对局链接无效" profile={profile}>
    <ExitState title="对局链接无效" message="链接缺少房间号，请返回大厅重新进入。"
      onLeave={leave.confirm} />
  </Shell>;
  if (connection.fatal) return <Shell title="无法进入房间" profile={profile}>
    <ExitState title="无法进入当前房间" message={connection.fatal} onLeave={leave.confirm} />
  </Shell>;

  const connectionNotice = connection.status !== 'connected'
    ? connection.status === 'reconnecting'
      ? `正在恢复连接（${connection.attempt} / 5），当前战场保持只读`
      : '连接暂时中断，当前战场保持只读'
    : session.feedback || nextMatch.error || undefined;

  return <>
    {snapshot?.type === 'MATCH_SYNC' && <Shell inMatch title="备战房间" profile={profile}>
      {session.feedback && <div className="toast" role="alert">{session.feedback}</div>}
      {connectionNotice && !session.feedback && <Notice>{connectionNotice}</Notice>}
      <Room session={session} data={snapshot} room={target.data.room}
        onLeave={leave.request} />
    </Shell>}
    {snapshot?.type === 'ROOM_SYNC' && <Battle
      game={toBattleGame(snapshot)} roomID={roomID}
      roomName={target.data.room?.displayName || '战争之匣'}
      interactive={connection.status === 'connected'}
      commandPending={!!session.pending}
      connectionNotice={connectionNotice}
      onAction={actionID => session.submit('game_play_action', { actionID })}
      onResign={() => session.submit('game_resign')}
      onLeave={leave.request}
      onRematch={() => { void nextMatch.start(); }}
      rematchPending={nextMatch.pending} />}
    {leave.visible && <div className="warchest-root warchest-modal-root"><Modal
      title={snapshot?.type === 'ROOM_SYNC' ? '暂时收起战旗？' : '离开当前房间？'}
      eyebrow="LEAVE THE FIELD" onClose={leave.cancel}
      footer={<><button className="button secondary" type="button" onClick={leave.cancel}>继续留下</button>
        <button className="button primary" type="button" onClick={leave.confirm}>确认离开</button></>}>
      <p>{snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus !== 'end'
        ? '离开后会标记为离线；仍可使用原房间链接重连并恢复服务端最新局面。'
        : '离开后将返回大厅；准备阶段的真人席位会被释放。'}</p>
    </Modal></div>}
  </>;
}

export default function WarChestSessionPage() {
  const [params] = useSearchParams();
  const roomID = params.get('roomID') ?? '';
  return <Session key={roomID} roomID={roomID} />;
}
