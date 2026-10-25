import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, History } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { REPLAY_PAGE_SIZE, useProgressiveReplay } from '@/hooks/useProgressiveReplay';
import { AppShell } from '../../components/AppShell';
import { Board } from '../../components/Board';
import { YinshLoading } from '../../components/LoadingState';
import { actionCopy } from '../../model/selectors';
import type { GameSnapshot } from '../../model/session';
import type {
  LastAction,
  MoveOption,
  PlayerState,
  Result,
  Row,
  Side,
  YinshPlayer,
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
    rings: Record<string, Side>;
    markers: Record<string, Side>;
    currentPlayer: string;
    moverPlayer?: string;
    resolverPlayer?: string;
    gameStatus: GameSnapshot['roomData']['gameStatus'];
    placedRings: Record<Side, number>;
    markerPool: number;
    legalMoves: Record<string, MoveOption[]>;
    candidateRows: Row[];
    lastAction?: { action: string; playerID: string; payloadJSON?: string };
    activity?: Array<{ action: string; playerID: string; payloadJSON?: string }>;
    players: Record<string, YinshPlayer>;
    playerOrder: string[];
    roundNo: number;
  };
  playersData: Record<string, PlayerState>;
  result: Result;
}

const commandLabels: Record<string, string> = {
  game_place_ring: '布置圆环',
  game_move_ring: '移动圆环',
  game_remove_row: '移除五连',
  game_remove_ring: '取环计分',
  game_resign: '认输',
  turn_timeout: '超时托管',
};

function parseAction(action?: ReplaySnapshot['roomData']['lastAction']): LastAction | undefined {
  if (!action) return;
  let payload: Record<string, unknown> | undefined;
  try {
    payload = action.payloadJSON ? JSON.parse(action.payloadJSON) : undefined;
  } catch {
    payload = undefined;
  }
  return { action: action.action, playerID: action.playerID, payload };
}

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
      lastAction: parseAction(snapshot.roomData.lastAction),
      activity: (snapshot.roomData.activity ?? []).flatMap(action => {
        const parsed = parseAction(action);
        return parsed ? [parsed] : [];
      }),
      players,
    },
  };
}

function ReplayContent({ gameID }: { gameID: number }) {
  const replay = useProgressiveReplay<ReplaySnapshot>(gameID, 'yinsh');
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

  const currentSide = data?.playerData[data.roomData.currentPlayer]?.side;
  const event = replay.currentSnapshot?.currentEvent;
  return <AppShell inMatch hideHeader title="对局回放" profile={replay.profile}><div className={styles.page}>
    <header className={styles.heading}><Link to="/game/yinsh/me" aria-label="返回战绩"><ArrowLeft size={18} /></Link>
      <div><small>YINSH REPLAY · 房间号</small><h1>{replay.detail?.game.roomID ?? '对局回放'}</h1></div>
      <span>只读回放</span></header>
    {replay.initialLoading && <YinshLoading title="正在还原棋局。" description="载入回放快照与时间轴" />}
    {replay.initialError && <Feedback error>{replay.initialError}<ActionButton onClick={replay.retryInitial}>重试</ActionButton></Feedback>}
    {data && <><main className={styles.boardArea}><section><header><div><small>THE QUIET RECORD</small>
        <h2>{event ? `${event.displayName} · ${commandLabels[event.cmdType] ?? event.cmdType}` : '初始状态'}</h2></div>
        <span>第 {replay.selectedIndex} / {Math.max(0, replay.totalSnapshots - 1)} 步</span></header>
      <div className={styles.boardFrame}><Board rings={data.roomData.rings} markers={data.roomData.markers}
        status={data.roomData.gameStatus} currentSide={currentSide} moves={[]}
        candidateRows={data.roomData.candidateRows} selectedRow={data.roomData.candidateRows[0]}
        lastAction={data.roomData.lastAction} interactive={false} coordinates hints={false}
        onPoint={() => undefined} onHover={() => undefined} /></div></section>
      <aside><History size={18} /><h3>当前局面</h3><p>{data.roomData.lastAction
        ? actionCopy(data.roomData.lastAction, data.roomData.players)
        : '双方尚未落下第一枚圆环。'}</p>
        <dl><div><dt>公共棋子</dt><dd>{data.roomData.markerPool} / 51</dd></div>
          {data.roomData.playerOrder.map(id => <div key={id}><dt>{data.roomData.players[id]?.displayName || `玩家 ${id}`}</dt>
            <dd>{data.playerData[id]?.ringsRemoved ?? 0} 环</dd></div>)}</dl>
        {replay.detail?.game.endedAt && <ActionButton onClick={() => void openResults()}><Eye size={15} />最终结算</ActionButton>}</aside></main>
      <section className={styles.timeline}><header><span>已加载 {replay.loadedCount} / {replay.totalSnapshots}</span>
        {replay.backgroundLoading && <i />}</header>
        {replay.progressError && <Feedback error>回放加载暂停<ActionButton variant="quiet" onClick={replay.retryProgress}>继续加载</ActionButton></Feedback>}
        <div className={styles.controls}><ActionButton disabled={!replay.selectedIndex} onClick={() => select(replay.selectedIndex - 1)}>
          <ChevronLeft size={15} />上一步</ActionButton>
          <input type="range" min={0} max={Math.max(0, replay.totalSnapshots - 1)} value={preview}
            onChange={value => setPreview(Number(value.target.value))}
            onPointerUp={() => replay.selectIndex(preview)} onTouchEnd={() => replay.selectIndex(preview)}
            onKeyUp={() => replay.selectIndex(preview)} aria-label="回放步骤" />
          <ActionButton disabled={replay.selectedIndex >= replay.totalSnapshots - 1}
            onClick={() => select(replay.selectedIndex + 1)}>下一步<ChevronRight size={15} /></ActionButton></div>
        <div className={styles.events}>{replay.snapshots.map((snapshot, index) => {
          const pageOffset = Math.floor(index / REPLAY_PAGE_SIZE) * REPLAY_PAGE_SIZE;
          return <button type="button" key={index} aria-pressed={index === replay.selectedIndex}
            className={!snapshot ? replay.failedOffsets.has(pageOffset) ? styles.failed : styles.unloaded : ''}
            onClick={() => select(index)}>{index}<small>{index === 0 ? '初始'
              : commandLabels[(snapshot?.currentEvent ?? replay.detail?.events[index - 1])?.cmdType ?? ''] ?? '待载入'}</small></button>;
        })}</div></section></>}
  </div></AppShell>;
}

export default function Replay() {
  const { gameId } = useParams();
  const id = Number(gameId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return <AppShell title="对局回放"><Feedback error>回放编号无效。<Link to="/game/yinsh/me">返回我的棋谱</Link></Feedback></AppShell>;
  }
  return <ReplayContent key={id} gameID={id} />;
}
