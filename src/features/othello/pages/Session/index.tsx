import { useCallback } from 'react';
import { ArrowLeft, CircleAlert, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getProfile } from '@/features/game-core/api/auth';
import { lookupGameRoom } from '@/features/game-core/api/room';
import { useStartNextMatch } from '@/features/game-core/hooks/useStartNextMatch';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { AppShell } from '../../components/AppShell';
import { Dialog } from '../../components/Dialog';
import { OthelloLoading } from '../../components/LoadingState';
import { useOthelloLeave } from '../../hooks/useOthelloLeave';
import { useOthelloSession } from '../../hooks/useOthelloSession';
import { playerName, selfID } from '../../model/session';
import { Play } from '../Play';
import { Room } from '../Room';
import styles from './index.module.less';

function ExitState({
  title,
  message,
  onLeave,
}: {
  title: string;
  message: string;
  onLeave: () => void;
}) {
  return <div className={styles.exit}><section role="alert">
    <CircleAlert size={25} /><small>SESSION CLOSED</small><h1>{title}</h1><p>{message}</p>
    <ActionButton variant="primary" onClick={onLeave}><ArrowLeft size={16} />返回大厅</ActionButton>
  </section></div>;
}

function Session({ roomID }: { roomID: string }) {
  const loadTarget = useCallback(async () => {
    const profile = await getProfile();
    if (!roomID) return { profile, matchID: '' };
    const room = await lookupGameRoom('othello', roomID);
    if (!room.currentMatchID) throw new Error('当前房间没有可连接的对局');
    return { profile, matchID: room.currentMatchID };
  }, [roomID]);
  const target = useAsyncResource(loadTarget);
  const nextMatch = useStartNextMatch('othello', roomID);
  const matchID = nextMatch.matchID || target.data?.matchID || '';
  const session = useOthelloSession(roomID, matchID, nextMatch.adoptMatch);
  const leave = useOthelloLeave(session.connection.close);
  const { connection, snapshot } = session;
  const players = snapshot?.type === 'MATCH_SYNC'
    ? snapshot.players
    : snapshot?.roomData.players;
  const playerID = snapshot ? selfID(snapshot) : '';
  const currentPlayer = players?.[playerID];
  const profile = currentPlayer
    ? { name: playerName(playerID, players), avatar: currentPlayer.avatar }
    : undefined;
  const initialLoading = target.loading && !target.data
    || !!roomID && !!matchID && !snapshot
      && (connection.status === 'connecting' || connection.status === 'reconnecting');

  if (initialLoading) return <AppShell inMatch title="连接棋室">
    <OthelloLoading description={target.data ? '正在建立可靠会话' : '正在确认身份与当前对局'} />
  </AppShell>;
  if (!target.data) return <AppShell inMatch title="对局验证失败"><div className={styles.authError}>
    <Feedback error>对局信息确认失败<span>{target.error || '暂时无法确认登录状态与当前对局，请重试。'}</span>
      <ActionButton onClick={target.retry}><RefreshCw size={14} />重新验证</ActionButton></Feedback>
  </div></AppShell>;

  return <AppShell inMatch hideHeader={snapshot?.type === 'ROOM_SYNC'} profile={profile}
    title={snapshot?.type === 'MATCH_SYNC' ? '准备棋室' : snapshot?.roomData.gameStatus === 'end' ? '本局结算' : 'OTHELLO 对局'}>
    {!roomID && <ExitState title="对局链接无效" message="链接缺少房间号，请返回大厅重新进入。" onLeave={leave.confirm} />}
    {connection.fatal ? <ExitState title="无法进入当前对局" message={connection.fatal} onLeave={leave.confirm} />
      : roomID && connection.status !== 'connected' && snapshot && <div className={styles.connection}><Feedback>
        {connection.status === 'reconnecting' ? `正在恢复连接（${connection.attempt} / 5）…` : '连接暂时中断'}
        <span>当前棋盘保持只读，恢复后请核对最新局面。</span>
        {connection.status === 'disconnected' && <ActionButton onClick={connection.retry}><RefreshCw size={14} />重新连接</ActionButton>}
      </Feedback></div>}
    {session.feedback && !connection.fatal && <div className={styles.feedback}><Feedback error>{session.feedback}</Feedback></div>}
    {nextMatch.error && !connection.fatal && <div className={styles.feedback}><Feedback error>{nextMatch.error}</Feedback></div>}
    {snapshot?.type === 'MATCH_SYNC' && <Room session={session} data={snapshot} onLeave={leave.request} />}
    {snapshot?.type === 'ROOM_SYNC' && <Play session={session} data={snapshot} onLeave={leave.request}
      onStartNextMatch={nextMatch.start} startNextMatchPending={nextMatch.pending} />}
    {leave.visible && <Dialog title={snapshot?.type === 'ROOM_SYNC' ? '退出当前对局？' : '离开当前棋室？'}
      eyebrow="LEAVE THE QUIET ROOM" onClose={leave.cancel}
      footer={<><ActionButton onClick={leave.cancel}>继续留在这里</ActionButton>
        <ActionButton variant="danger" onClick={leave.confirm}>确认离开</ActionButton></>}>
      <p className={styles.leaveText}>{snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus !== 'end'
        ? '离开后当前身份会标记为离线。你仍可使用原房间链接重新连接，以服务端最新状态为准。'
        : '离开后将返回大厅，准备阶段的席位会被释放。'}</p>
    </Dialog>}
  </AppShell>;
}

export default function OthelloSessionPage() {
  const [params] = useSearchParams();
  const roomID = params.get('roomID') ?? '';
  return <Session key={roomID} roomID={roomID} />;
}
