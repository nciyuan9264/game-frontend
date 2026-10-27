import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  GripHorizontal,
  History,
  Maximize2,
} from 'lucide-react';
import type {
  HivePlayerState,
  HiveReplaySnapshot,
  HiveResult,
  HiveRoomData,
} from '@/api/generated/game-platform';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { useReplayPanel } from '@/features/game-core/hooks/useReplayPanel';
import type { ReplayEventData } from '@/features/game-core/model/history';
import {
  REPLAY_PAGE_SIZE,
  useProgressiveReplay,
} from '@/hooks/useProgressiveReplay';
import { AppShell } from '../../components/AppShell';
import { Board } from '../../components/Board';
import { Bug } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { HiveLoading } from '../../components/LoadingState';
import {
  actionLabel,
  sideName,
} from '../../model/board';
import {
  currentSide,
  playerForSide,
} from '../../model/selectors';
import {
  parseReplaySnapshot,
  playerName,
  type GameSnapshot,
} from '../../model/session';
import type { Side } from '../../model/types';
import { Results } from '../Results';
import styles from './index.module.less';

interface ReplaySnapshot {
  seq: number;
  totalEvents: number;
  currentEvent?: ReplayEventData;
  roomData: HiveRoomData;
  playersData: Record<string, HivePlayerState>;
  result?: HiveResult;
}

const commandLabels: Record<string, string> = {
  game_place_piece: '部署棋子',
  game_move_piece: '移动棋子',
  game_resign: '认输',
  turn_timeout: '超时托管',
  forced_pass: '自动过手',
};

function adapt(
  snapshot: ReplaySnapshot,
  viewer: string,
  roomID: string,
  playerOrder: string[],
): GameSnapshot | undefined {
  const data = parseReplaySnapshot(
    snapshot as Pick<
      HiveReplaySnapshot,
      'seq' | 'roomData' | 'playersData' | 'result'
    >,
    viewer,
    roomID,
  );
  if (!data) return;
  playerOrder.forEach((id, index) => {
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
  const replay = useProgressiveReplay<ReplaySnapshot>(gameID, 'hive');
  const replayPanel = useReplayPanel();
  const [preview, setPreview] = useState(0);
  const [panel, setPanel] = useState<'results' | 'zoom'>();
  const [resultPending, setResultPending] = useState(false);
  const [resultError, setResultError] = useState('');

  useEffect(() => {
    if (replay.pendingIndex == null) setPreview(replay.selectedIndex);
  }, [replay.pendingIndex, replay.selectedIndex]);

  const order = replay.detail?.players.map(player => player.playerID) ?? [];
  const data = useMemo(
    () => replay.currentSnapshot && replay.viewer && replay.detail
      ? adapt(
          replay.currentSnapshot,
          replay.viewer,
          replay.detail.game.roomID,
          order,
        )
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
    setResultError('');
    try {
      await replay.ensureFinalSnapshot();
      setPanel('results');
    } catch (reason) {
      setResultError(reason instanceof Error
        ? reason.message
        : '最终结算载入失败');
    } finally {
      setResultPending(false);
    }
  };

  if (panel === 'results' && finalData?.result) {
    return <AppShell inMatch hideHeader title="最终结算" profile={replay.profile}>
      <Results readOnly data={finalData}
        onViewBoard={() => setPanel(undefined)} />
    </AppShell>;
  }

  const event = replay.currentSnapshot?.currentEvent;
  const last = data?.roomData.lastAction;
  const total = replay.totalSnapshots;
  const board = data && <Board
    stacks={data.roomData.stacks}
    lastAction={last}
    interactive={false}
    coordinates
    showMoves={false}
    readOnly
  />;

  return <AppShell inMatch hideHeader title="对局回放" profile={replay.profile}>
    <div className={styles.page}>
      <header className={styles.heading}>
        <Link to="/game/hive/me" aria-label="返回战绩">
          <ArrowLeft size={18} /></Link>
        <div><small>HIVE REPLAY · 房间号</small>
          <h1>{replay.detail?.game.roomID ?? '对局回放'}</h1></div>
        <span>只读回放</span>
      </header>
      {replay.initialLoading && <HiveLoading
        title="正在还原蜂巢。"
        description="载入回放快照与时间轴"
      />}
      {replay.initialError && <Feedback error>{replay.initialError}
        <ActionButton onClick={replay.retryInitial}>重试</ActionButton>
      </Feedback>}
      {data && <>
        <main className={styles.boardArea}>
          <section>
            <header><div><small>THE HIVE RECORD</small>
              <h2>{event
                ? `${event.displayName} · ${
                  commandLabels[event.cmdType] ?? event.cmdType
                }`
                : '初始状态'}</h2>
              {replay.pendingIndex != null && <small className={styles.frameStatus}>
                正在加载第 {replay.pendingIndex} 步
              </small>}</div>
              <div><span>第 {replay.selectedIndex} / {
                Math.max(0, total - 1)
              } 步</span>
                <button type="button" className={styles.zoomButton}
                  onClick={() => setPanel('zoom')}>
                  <Maximize2 size={13} />放大棋盘</button></div>
            </header>
            <div className={styles.boardFrame}>{board}</div>
          </section>
          <aside><History size={18} /><h3>当前局面</h3>
            <p>{last
              ? actionLabel(last)
              : '双方各持 11 枚棋子，从中央长出同一片蜂巢。'}</p>
            <dl>
              <div><dt>当前行棋</dt><dd><Bug kind="queen" size={14} />
                {sideName(currentSide(data))}</dd></div>
              {(['white', 'black'] as Side[]).map(side => {
                const playerID = playerForSide(data, side);
                const state = data.playerData[playerID];
                return <div key={side}><dt>{playerName(
                  playerID,
                  data.roomData.players,
                )}</dt><dd>{state?.queenPressure ?? 0} / 6 压力 · {
                  state ? Object.values(state.reserveByKind).reduce(
                    (sum, count) => sum + count,
                    0,
                  ) : 0
                } 枚在手</dd></div>;
              })}
            </dl>
          </aside>
        </main>
        <section ref={replayPanel.panelRef}
          data-testid="hive-replay-panel"
          className={`${styles.timeline} ${
            replayPanel.collapsed ? styles.timelineCollapsed : ''
          }`}
          style={replayPanel.positionStyle}>
          <button type="button" className={styles.dragHandle}
            aria-label="移动回放面板" title="移动回放面板"
            {...replayPanel.dragHandleProps}><GripHorizontal size={18} /></button>
          <div className={styles.timelineContent}>
            <header><strong>对局时间轴</strong>
              <div className={styles.loadMeta}>
                <span>已加载 {replay.loadedCount} / {total}</span>
                {replay.backgroundLoading && <i aria-label="正在载入回放" />}
              </div>
              {replay.detail?.game.endedAt && <ActionButton
                pending={resultPending}
                onClick={() => void openResults()}>
                <Eye size={14} />最终结算</ActionButton>}
            </header>
            <div className={styles.loadTrack} role="progressbar"
              aria-label="回放载入进度" aria-valuemin={0}
              aria-valuemax={total} aria-valuenow={replay.loadedCount}>
              <i style={{
                width: `${total ? replay.loadedCount / total * 100 : 0}%`,
              }} />
            </div>
            {(replay.progressError || resultError) &&
              <div className={styles.progressStatus} role="alert">
                {resultError || '回放加载暂停'}
                {replay.progressError && <ActionButton variant="quiet"
                  onClick={replay.retryProgress}>继续加载</ActionButton>}
              </div>}
            <div className={styles.controls}>
              <ActionButton disabled={!replay.selectedIndex}
                onClick={() => select(0)}>初始</ActionButton>
              <ActionButton disabled={!replay.selectedIndex}
                onClick={() => select(replay.selectedIndex - 1)}>
                <ChevronLeft size={14} />上一步</ActionButton>
              {replayPanel.collapsed
                ? <button type="button" className={styles.stepCounter}
                  aria-label="移动折叠回放面板" title="拖动移动回放面板"
                  {...replayPanel.dragHandleProps}>
                  {replay.selectedIndex} / {Math.max(0, total - 1)}</button>
                : <span className={styles.stepCounter}>
                  {replay.selectedIndex} / {Math.max(0, total - 1)}</span>}
              <ActionButton disabled={replay.selectedIndex >= total - 1}
                onClick={() => select(replay.selectedIndex + 1)}>
                下一步<ChevronRight size={14} /></ActionButton>
              <ActionButton disabled={replay.selectedIndex >= total - 1}
                onClick={() => select(total - 1)}>末步</ActionButton>
              <button type="button" className={styles.collapseToggle}
                aria-label={replayPanel.collapsed ? '展开回放面板' : '收起回放面板'}
                aria-expanded={!replayPanel.collapsed}
                title={replayPanel.collapsed ? '展开回放面板' : '收起回放面板'}
                onClick={replayPanel.toggleCollapsed}>
                {replayPanel.collapsed
                  ? <ChevronUp size={14} />
                  : <ChevronDown size={14} />}
              </button>
            </div>
            <input className={styles.range} type="range" min={0}
              max={Math.max(0, total - 1)} value={preview}
              onChange={change => setPreview(Number(change.target.value))}
              onPointerUp={() => replay.selectIndex(preview)}
              onTouchEnd={() => replay.selectIndex(preview)}
              onKeyUp={() => replay.selectIndex(preview)}
              onBlur={() => replay.selectIndex(preview)}
              aria-label="回放步骤" />
            <div className={styles.timelineViewport}>
              <div className={styles.events}>
                {replay.snapshots.map((snapshot, index) => {
                  const pageOffset = Math.floor(index / REPLAY_PAGE_SIZE)
                    * REPLAY_PAGE_SIZE;
                  const loading = replay.inFlightOffset === pageOffset;
                  const failed = replay.failedOffsets.has(pageOffset);
                  const meta = snapshot?.currentEvent
                    ?? (index > 0 ? replay.detail?.events[index - 1] : undefined);
                  const label = index === 0
                    ? '初始'
                    : commandLabels[meta?.cmdType ?? '']
                      ?? meta?.cmdType
                      ?? '待载入';
                  return <button type="button" key={index}
                    aria-pressed={index === replay.selectedIndex}
                    aria-busy={loading || undefined}
                    className={!snapshot
                      ? failed
                        ? styles.failed
                        : loading
                          ? styles.loading
                          : styles.unloaded
                      : ''}
                    onClick={() => select(index)}>
                    {index}<small>{failed
                      ? '重试'
                      : loading
                        ? '载入中'
                        : label}</small></button>;
                })}
              </div>
            </div>
          </div>
        </section>
      </>}
      {panel === 'zoom' && data && <Dialog title="回放蜂巢"
        eyebrow="FOCUS ON THE RECORD" wide
        onClose={() => setPanel(undefined)}>
        <div className={styles.zoomBoard}>{board}</div>
      </Dialog>}
    </div>
  </AppShell>;
}

export default function Replay() {
  const { gameId } = useParams();
  const id = Number(gameId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return <AppShell title="对局回放"><Feedback error>
      回放编号无效。<Link to="/game/hive/me">返回我的棋谱</Link>
    </Feedback></AppShell>;
  }
  return <ReplayContent key={id} gameID={id} />;
}
