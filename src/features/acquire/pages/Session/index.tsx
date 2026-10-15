import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { ActionButton } from '../../components/ActionButton';
import { Feedback } from '../../components/Panel';
import { ResponsiveDialog } from '../../components/ResponsiveDialog';
import { useAcquireSession } from '../../hooks/useAcquireSession';
import { useAcquireInteraction } from '../../hooks/useAcquireInteraction';
import { useAcquireLeave } from '../../hooks/useAcquireLeave';
import { playerName, selfID } from '../../model/session';
import { Room } from '../Room';
import { Play } from '../Play';
import { SessionExitState } from './ExitState';
import { AcquireSessionLoading } from './Loading';

function Session({ roomID }: { roomID: string }) {
  const session = useAcquireSession(roomID);
  const interaction = useAcquireInteraction(session);
  const leave = useAcquireLeave(session.connection.close);
  const { connection, snapshot } = session;
  const players = snapshot?.type === 'MATCH_SYNC' ? snapshot.players : snapshot?.roomData.players;
  const playerID = snapshot ? selfID(snapshot) : '';
  const currentPlayer = players?.[playerID];
  const initialLoading = !!roomID && !snapshot && (connection.status === 'connecting' || connection.status === 'reconnecting');
  const profile = currentPlayer ? { name: playerName(playerID, players ?? {}), avatar: currentPlayer.avatar } : undefined;
  if (initialLoading) return <AcquireSessionLoading />;
  return <AppShell inMatch hideRail hideHeader={snapshot?.type === 'ROOM_SYNC'} profile={profile} title={snapshot?.type === 'MATCH_SYNC' ? '准备房间'
    : snapshot?.roomData.gameStatus === 'end' ? '本局结算' : '经典对局'}>
    {!roomID && <SessionExitState title="对局链接无效" message="链接缺少房间号，请返回大厅重新进入。" onLeave={leave.confirm} />}
    {connection.fatal ? <SessionExitState title="无法进入当前对局" message={connection.fatal} onLeave={leave.confirm} />
      : roomID && connection.status !== 'connected' && <Feedback>
        {connection.status === 'connecting' ? '正在连接房间…' : connection.status === 'reconnecting' ? `正在恢复连接（${connection.attempt} / 5）…` : '连接暂时中断'}
        <span>画面与草稿保留，恢复后请核对最新阶段。</span>
        {connection.status === 'disconnected' && <ActionButton onClick={connection.retry}><RefreshCw size={14} />重新连接</ActionButton>}
      </Feedback>}
    {session.feedback && !connection.fatal && <Feedback error>{session.feedback}</Feedback>}
    {snapshot?.type === 'MATCH_SYNC' && <Room session={session} data={snapshot} onLeave={leave.request} />}
    {snapshot?.type === 'ROOM_SYNC' && <Play session={session} data={snapshot} interaction={interaction} onLeave={leave.request} />}
    {leave.visible && <ResponsiveDialog title={snapshot?.type === 'ROOM_SYNC' ? '退出当前对局？' : '离开当前房间？'} eyebrow="LEAVE THE TABLE" onClose={leave.cancel}
      footer={<><ActionButton onClick={leave.cancel}>继续留在这里</ActionButton><ActionButton variant="danger" onClick={leave.confirm}>确认离开</ActionButton></>}>
      <p>{snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus !== 'end'
        ? '离开后将由系统离线托管。你可以使用原身份和房间链接重新进入，恢复时以最新对局状态为准。'
        : '离开后将返回大厅。准备阶段的席位会被释放。'}</p>
    </ResponsiveDialog>}
  </AppShell>;
}
export default function AcquireSessionPage() {
  const [params] = useSearchParams();
  const roomID = params.get('roomID') ?? '';
  return <Session key={roomID} roomID={roomID} />;
}
