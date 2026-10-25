import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { REPLAY_PAGE_SIZE, useProgressiveReplay } from '@/hooks/useProgressiveReplay';
import { AppShell } from '../../components/AppShell';
import { Board } from '../../components/Board';
import { Disc } from '../../components/Artwork';
import { OthelloLoading } from '../../components/LoadingState';
import { actionCopy, sideName } from '../../model/selectors';
import { playerName, type GameSnapshot } from '../../model/session';
import type {
  Disc as DiscValue,
  GameStatus,
  LegalMove,
  MoveEntry,
  OthelloPlayer,
  PlayerState,
  Result,
  Side,
} from '../../model/types';
import { Results } from '../Results';
import styles from './index.module.less';

interface ReplaySnapshot {
  seq: number;
  totalEvents: number;
  currentEvent?: {
    seq: number;
    playerID: string;
    displayName: string;
    cmdType: string;
    payload: unknown;
  };
  roomData: {
    board: DiscValue[];
    currentPlayer: string;
    currentSide: Side;
    blackPlayerID: string;
    whitePlayerID: string;
    roundNo: number;
    gameStatus: GameStatus;
    legalMoves: LegalMove[];
    moveLog: MoveEntry[];
    lastData?: MoveEntry;
    turnDeadline?: string;
    turnTimeoutMs?: string;
    players: Record<string, OthelloPlayer>;
    playerOrder: string[];
  };
  playersData: Record<string, PlayerState>;
  result: Result;
}

const commandLabels: Record<string, string> = {
  game_place_disc: '落子',
  game_pass: '跳过回合',
  game_resign: '认输',
  turn_timeout: '超时托管',
};

function adapt(
  snapshot: ReplaySnapshot,
  viewer: string,
  roomID: string,
  playerOrder: string[],
): GameSnapshot {
  const players = { ...snapshot.roomData.players };
  playerOrder.forEach((id, index) => {
    players[id] ??= {
      playerID: id,
      displayName: `玩家 ${id}`,
      online: false,
      ai: false,
      ready: true,
      seatIndex: index,
    };
  });
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID: `replay:${roomID}`,
    seq: snapshot.seq,
    phaseVersion: snapshot.seq + 1,
    turnNumber: snapshot.seq + 1,
    ownerID: playerOrder[0] ?? '',
    visibility: 'public',
    playerId: viewer,
    playerData: snapshot.playersData,
    result: snapshot.result,
    roomData: {
      ...snapshot.roomData,
      turnTimeoutMs: snapshot.roomData.turnTimeoutMs == null
        ? undefined
        : Number(snapshot.roomData.turnTimeoutMs),
      players,
    },
  };
}

function ReplayContent({ gameID }: { gameID: number }) {
  const replay = useProgressiveReplay<ReplaySnapshot>(gameID, 'othello');
  const [preview, setPreview] = useState(0);
  const [showResults, setShowResults] = useState(false);
  useEffect(() => {
    if (replay.pendingIndex == null) setPreview(replay.selectedIndex);
  }, [replay.pendingIndex, replay.selectedIndex]);
  const order = replay.detail?.players.map(player => player.playerID) ?? [];
  const data = useMemo(() => replay.currentSnapshot && replay.viewer && replay.detail
    ? adapt(replay.currentSnapshot, replay.viewer, replay.detail.game.roomID, order)
    : undefined, [order, replay.currentSnapshot, replay.detail, replay.viewer]);
  const final = replay.snapshots[replay.totalSnapshots - 1];
  const finalData = useMemo(() => final && replay.viewer && replay.detail
    ? adapt(final, replay.viewer, replay.detail.game.roomID, order)
    : undefined, [final, order, replay.detail, replay.viewer]);
  const select = (index: number) => {
    setPreview(index);
    replay.selectIndex(index);
  };
  const openResults = async () => {
    await replay.ensureFinalSnapshot();
    setShowResults(true);
  };

  if (showResults && finalData) {
    return <AppShell inMatch hideHeader title="最终结算" profile={replay.profile}>
      <Results readOnly data={finalData} onViewBoard={() => setShowResults(false)}
        onLeave={() => setShowResults(false)} />
    </AppShell>;
  }

  const event = replay.currentSnapshot?.currentEvent;
  const last = data?.roomData.lastData;
  return <AppShell inMatch hideHeader title="对局回放" profile={replay.profile}>
    <div className={styles.page}>
      <header className={styles.heading}>
        <Link to="/game/othello/me" aria-label="返回战绩"><ArrowLeft size={18} /></Link>
        <div><small>OTHELLO REPLAY · 房间号</small>
          <h1>{replay.detail?.game.roomID ?? '对局回放'}</h1></div>
        <span>只读回放</span>
      </header>
      {replay.initialLoading && <OthelloLoading title="正在还原棋局。" description="载入回放快照与时间轴" />}
      {replay.initialError && <Feedback error>{replay.initialError}
        <ActionButton onClick={replay.retryInitial}>重试</ActionButton></Feedback>}
      {data && <><main className={styles.boardArea}>
        <section><header><div><small>THE QUIET RECORD</small>
          <h2>{event ? `${event.displayName} · ${commandLabels[event.cmdType] ?? event.cmdType}` : '初始状态'}</h2>
        </div><span>第 {replay.selectedIndex} / {Math.max(0, replay.totalSnapshots - 1)} 步</span></header>
          <div className={styles.boardFrame}><Board
            board={data.roomData.board}
            currentSide={data.roomData.currentSide}
            legalMoves={[]}
            lastData={data.roomData.lastData}
            interactive={false}
            coordinates
            hints={false}
            onCell={() => undefined}
            onHover={() => undefined}
          /></div></section>
        <aside><History size={18} /><h3>当前局面</h3>
          <p>{last ? actionCopy(last, data.roomData.players) : '中央四子已经摆好，等待黑方第一步。'}</p>
          <dl><div><dt>当前行棋</dt><dd><Disc side={data.roomData.currentSide} />
            {sideName(data.roomData.currentSide)}</dd></div>
            <div><dt>{playerName(data.roomData.blackPlayerID, data.roomData.players)}</dt>
              <dd>{data.playerData[data.roomData.blackPlayerID]?.discCount ?? 0} 黑子</dd></div>
            <div><dt>{playerName(data.roomData.whitePlayerID, data.roomData.players)}</dt>
              <dd>{data.playerData[data.roomData.whitePlayerID]?.discCount ?? 0} 白子</dd></div></dl>
          {replay.detail?.game.endedAt && <ActionButton onClick={() => void openResults()}>
            <Eye size={15} />最终结算</ActionButton>}</aside>
      </main>
      <section className={styles.timeline}><header>
        <span>已加载 {replay.loadedCount} / {replay.totalSnapshots}</span>
        {replay.backgroundLoading && <i />}</header>
        {replay.progressError && <Feedback error>回放加载暂停
          <ActionButton variant="quiet" onClick={replay.retryProgress}>继续加载</ActionButton></Feedback>}
        <div className={styles.controls}>
          <ActionButton disabled={!replay.selectedIndex} onClick={() => select(replay.selectedIndex - 1)}>
            <ChevronLeft size={15} />上一步</ActionButton>
          <input type="range" min={0} max={Math.max(0, replay.totalSnapshots - 1)}
            value={preview} onChange={value => setPreview(Number(value.target.value))}
            onPointerUp={() => replay.selectIndex(preview)}
            onTouchEnd={() => replay.selectIndex(preview)}
            onKeyUp={() => replay.selectIndex(preview)}
            aria-label="回放步骤" />
          <ActionButton disabled={replay.selectedIndex >= replay.totalSnapshots - 1}
            onClick={() => select(replay.selectedIndex + 1)}>
            下一步<ChevronRight size={15} /></ActionButton>
        </div>
        <div className={styles.events}>{replay.snapshots.map((snapshot, index) => {
          const pageOffset = Math.floor(index / REPLAY_PAGE_SIZE) * REPLAY_PAGE_SIZE;
          return <button type="button" key={index} aria-pressed={index === replay.selectedIndex}
            className={!snapshot ? replay.failedOffsets.has(pageOffset) ? styles.failed : styles.unloaded : ''}
            onClick={() => select(index)}>{index}<small>{index === 0 ? '初始'
              : commandLabels[(snapshot?.currentEvent ?? replay.detail?.events[index - 1])?.cmdType ?? ''] ?? '待载入'}</small>
          </button>;
        })}</div>
      </section></>}
    </div>
  </AppShell>;
}

export default function Replay() {
  const { gameId } = useParams();
  const id = Number(gameId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return <AppShell title="对局回放"><Feedback error>回放编号无效。
      <Link to="/game/othello/me">返回我的棋谱</Link></Feedback></AppShell>;
  }
  return <ReplayContent key={id} gameID={id} />;
}
