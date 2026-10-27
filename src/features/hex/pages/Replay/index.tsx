import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Eye, History, Maximize2,
} from 'lucide-react';
import type {
  HexPlayerState, HexReplaySnapshot, HexResult, HexRoomData,
} from '@/api/generated/game-platform';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import type { ReplayEventData } from '@/features/game-core/model/history';
import { useProgressiveReplay } from '@/hooks/useProgressiveReplay';
import { AppShell } from '../../components/AppShell';
import { Board } from '../../components/Board';
import { Stone } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { HexLoading } from '../../components/LoadingState';
import { actionLabel, sideName } from '../../model/board';
import { currentSide } from '../../model/selectors';
import {
  parseReplaySnapshot, playerName, type GameSnapshot,
} from '../../model/session';
import { Results } from '../Results';
import styles from './index.module.less';

interface ReplaySnapshot extends Omit<HexReplaySnapshot, 'currentEvent'> {
  currentEvent?: ReplayEventData;
  roomData: HexRoomData;
  playersData: Record<string, HexPlayerState>;
  result?: HexResult;
}

const commandLabels: Record<string, string> = {
  game_place_stone: '落子',
  game_swap: '交换颜色',
  game_resign: '认输',
  turn_timeout: '超时托管',
};

function adapt(
  snapshot: ReplaySnapshot,
  viewer: string,
  roomID: string,
  order: string[],
): GameSnapshot | undefined {
  const data = parseReplaySnapshot(snapshot, viewer, roomID);
  if (!data) return;
  order.forEach((id, index) => {
    data.roomData.players[id] ??= {
      playerID: id,
      displayName: `玩家 ${id}`,
      online: false,
      ai: false,
      ready: true,
      seatIndex: index,
      name: `玩家 ${id}`,
    };
  });
  return data;
}

function ReplayContent({ gameID }: { gameID: number }) {
  const replay = useProgressiveReplay<ReplaySnapshot>(gameID, 'hex');
  const [preview, setPreview] = useState(0);
  const [panel, setPanel] = useState<'results' | 'zoom'>();
  const [resultPending, setResultPending] = useState(false);

  useEffect(() => {
    if (replay.pendingIndex == null) setPreview(replay.selectedIndex);
  }, [replay.pendingIndex, replay.selectedIndex]);

  const order = replay.detail?.players.map(player => player.playerID) ?? [];
  const data = useMemo(
    () => replay.currentSnapshot && replay.viewer && replay.detail
      ? adapt(replay.currentSnapshot, replay.viewer, replay.detail.game.roomID, order)
      : undefined,
    [order, replay.currentSnapshot, replay.detail, replay.viewer],
  );
  const final = replay.snapshots[replay.totalSnapshots - 1];
  const finalData = useMemo(
    () => final && replay.viewer && replay.detail
      ? adapt(final, replay.viewer, replay.detail.game.roomID, order)
      : undefined,
    [final, order, replay.detail, replay.viewer],
  );
  const select = (index: number) => {
    setPreview(index);
    replay.selectIndex(index);
  };
  const openResults = async () => {
    setResultPending(true);
    try {
      await replay.ensureFinalSnapshot();
      setPanel('results');
    } finally {
      setResultPending(false);
    }
  };
  if (panel === 'results' && finalData) {
    return <AppShell inMatch hideHeader title="最终结算" profile={replay.profile}>
      <Results readOnly data={finalData} onViewBoard={() => setPanel(undefined)} />
    </AppShell>;
  }

  const board = data && <Board board={data.roomData.board}
    currentSide={currentSide(data)} winningPath={data.roomData.winningPath}
    lastAction={data.roomData.lastAction} interactive={false} coordinates />;
  const event = replay.currentSnapshot?.currentEvent;
  const total = replay.totalSnapshots;

  return <AppShell inMatch hideHeader title="对局回放" profile={replay.profile}>
    <div className={styles.page}><header className={styles.heading}>
      <Link to="/game/hex/me" aria-label="返回战绩"><ArrowLeft size={18} /></Link>
      <div><small>HEX REPLAY · 房间号</small>
        <h1>{replay.detail?.game.roomID ?? '对局回放'}</h1></div><span>只读回放</span>
    </header>
    {replay.initialLoading && <HexLoading title="正在还原棋局。" description="载入回放快照与时间轴" />}
    {replay.initialError && <Feedback error>{replay.initialError}
      <ActionButton onClick={replay.retryInitial}>重试</ActionButton></Feedback>}
    {data && <><main className={styles.boardArea}><section>
      <header><div><small>THE QUIET RECORD</small><h2>{event
        ? `${event.displayName} · ${commandLabels[event.cmdType] ?? event.cmdType}`
        : '初始状态'}</h2></div><div><span>
          第 {replay.selectedIndex} / {Math.max(0, total - 1)} 步</span>
          <button className={styles.zoomButton} onClick={() => setPanel('zoom')}>
            <Maximize2 size={13} />放大棋盘</button></div></header>
      <div className={styles.boardFrame}>{board}</div></section>
      <aside><History size={18} /><h3>当前局面</h3>
        <p>{data.roomData.lastAction
          ? actionLabel(data.roomData.lastAction) : '空棋盘，等待第一子。'}</p>
        <dl><div><dt>当前行棋</dt><dd><Stone side={currentSide(data)} />
          {sideName(currentSide(data))}</dd></div>
          <div><dt>陶红</dt><dd>{playerName(
            data.roomData.redPlayerID, data.roomData.players,
          )}</dd></div>
          <div><dt>湖绿</dt><dd>{playerName(
            data.roomData.tealPlayerID, data.roomData.players,
          )}</dd></div></dl></aside>
    </main>
      <section className={styles.timeline} data-testid="hex-replay-panel">
        <header><strong>对局时间轴</strong><span>已加载 {replay.loadedCount} / {total}</span>
          {replay.detail?.game.endedAt && <ActionButton pending={resultPending}
            onClick={() => void openResults()}><Eye size={14} />最终结算</ActionButton>}</header>
        {replay.progressError && <Feedback error>{replay.progressError.message}
          <ActionButton onClick={replay.retryProgress}>继续加载</ActionButton></Feedback>}
        <div className={styles.controls}>
          <ActionButton disabled={!replay.selectedIndex} onClick={() => select(0)}>初始</ActionButton>
          <ActionButton disabled={!replay.selectedIndex}
            onClick={() => select(replay.selectedIndex - 1)}>
            <ChevronLeft size={14} />上一步</ActionButton>
          <span>{replay.selectedIndex} / {Math.max(0, total - 1)}</span>
          <ActionButton disabled={replay.selectedIndex >= total - 1}
            onClick={() => select(replay.selectedIndex + 1)}>
            下一步<ChevronRight size={14} /></ActionButton>
          <ActionButton disabled={replay.selectedIndex >= total - 1}
            onClick={() => select(total - 1)}>末步</ActionButton>
        </div>
        <input className={styles.range} type="range" min={0}
          max={Math.max(0, total - 1)} value={preview}
          onChange={change => setPreview(Number(change.target.value))}
          onPointerUp={() => replay.selectIndex(preview)}
          onTouchEnd={() => replay.selectIndex(preview)}
          onKeyUp={() => replay.selectIndex(preview)}
          onBlur={() => replay.selectIndex(preview)} aria-label="回放步骤" />
      </section></>}
    {panel === 'zoom' && data && <Dialog title="回放棋盘"
      eyebrow="FOCUS ON THE RECORD" wide onClose={() => setPanel(undefined)}>
      <div className={styles.zoomBoard}>{board}</div></Dialog>}
    </div>
  </AppShell>;
}

export default function Replay() {
  const { gameId } = useParams();
  const id = Number(gameId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return <AppShell title="对局回放"><Feedback error>
      回放编号无效。<Link to="/game/hex/me">返回我的棋谱</Link>
    </Feedback></AppShell>;
  }
  return <ReplayContent key={id} gameID={id} />;
}
