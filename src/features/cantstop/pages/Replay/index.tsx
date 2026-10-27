import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import type { CantStopSnapshot } from '@/features/game-core/model/history';
import { useProgressiveReplay } from '@/hooks/useProgressiveReplay';
import { AppShell, Bull, PlayerAvatar } from '../../components/AppShell';
import { CantStopLoading } from '../../components/LoadingState';
import {
  COLUMNS,
  actionSummary,
  columnHeight,
  ownerAt,
  playerColor,
  playerSymbol,
  progressAt,
  savedProgress,
  savedStepCount,
} from '../../model/board';
import { playerName } from '../../model/session';

function ReplayBoard({ snapshot }: { snapshot: CantStopSnapshot }) {
  const activeID = snapshot.roomData.currentPlayer || snapshot.roomData.playerOrder[0];
  const activeSeat = snapshot.roomData.players[activeID]?.seatIndex ?? 0;
  const activeSaved = savedProgress(snapshot.playersData[activeID]);
  return <section className="cs-route-board compact">
    <header><span>REPLAY TRAILS</span><span>服务端快照</span></header>
    <div className="cs-columns">{COLUMNS.map(column => {
      const owner = ownerAt(snapshot.roomData.claimedBy, column);
      const ownerSeat = snapshot.roomData.players[owner]?.seatIndex ?? activeSeat;
      const runner = progressAt(snapshot.roomData.runners, column);
      const style = {
        '--player': owner ? playerColor(ownerSeat) : playerColor(activeSeat),
      } as CSSProperties;
      return <div className={`cs-column ${runner ? 'active' : ''} ${owner ? 'closed' : ''}`}
        key={column} style={style}>
        <div className="cs-column-cells"><div className="cs-summit">
          {owner ? <Bull size={15} /> : <span />}
          {owner && <span>{playerSymbol(ownerSeat)}</span>}</div>
          {Array.from({ length: columnHeight(column) }, (_, index) =>
            columnHeight(column) - index).map(step => <div key={step}
            className={`cs-step ${runner && step <= runner && step > progressAt(activeSaved, column) ? 'temporary' : ''}`}>
            <span className="cs-saved-pins">{snapshot.roomData.playerOrder.map(playerID => {
              const seat = snapshot.roomData.players[playerID]?.seatIndex ?? 0;
              return progressAt(savedProgress(snapshot.playersData[playerID]), column) === step
                ? <i key={playerID} style={{ background: playerColor(seat) }}>
                  {playerSymbol(seat)}</i>
                : null;
            })}</span>
            {runner === step && <span className="cs-runner">▲</span>}
          </div>)}</div>
        <b>{column}</b><small>{owner ? '已占领' : `${columnHeight(column)} 阶`}</small>
      </div>;
    })}</div>
  </section>;
}

function ReplayContent({ gameID }: { gameID: number }) {
  const replay = useProgressiveReplay<CantStopSnapshot>(gameID, 'cantstop');
  const [previewIndex, setPreviewIndex] = useState(0);
  const snapshot = replay.currentSnapshot;
  useEffect(() => {
    if (replay.pendingIndex == null) setPreviewIndex(replay.selectedIndex);
  }, [replay.pendingIndex, replay.selectedIndex]);
  const select = (index: number) => {
    setPreviewIndex(index);
    replay.selectIndex(index);
  };

  return <AppShell inMatch hideHeader title="全知回放" profile={replay.profile}>
    <div className="cs-replay"><header>
      <Link to="/game/cantstop/me" aria-label="返回我的牌局"><ArrowLeft size={19} /></Link>
      <div><small>OMNISCIENT REPLAY · 房间号</small>
        <h1>{replay.detail?.game.roomID ?? '对局回放'}</h1></div>
      <span><LockKeyhole size={13} />参赛者全知回放</span></header>
      {replay.initialLoading && <CantStopLoading title="正在重建这座山。"
        description="载入路线进度、骰子与回合记录" />}
      {replay.initialError && <Feedback error>{replay.initialError}
        <ActionButton onClick={replay.retryInitial}>重试</ActionButton></Feedback>}
      {snapshot && <><section className="cs-replay-meta">
        <span>回合 {snapshot.roomData.turnNumber}</span>
        <span>第 {snapshot.roomData.rollNumber} 掷</span>
        <span>{snapshot.currentEvent ? `${snapshot.currentEvent.displayName} · ${snapshot.currentEvent.cmdType}` : '初始状态'}</span>
        <span>阶段 {snapshot.roomData.gameStatus}</span></section>
        <div className="cs-replay-layout"><section className="cs-replay-main">
          <div className="cs-replay-players">{snapshot.roomData.playerOrder.map(id => {
            const player = snapshot.roomData.players[id];
            const state = snapshot.playersData[id];
            return <article key={id}>
              <PlayerAvatar name={playerName(id, snapshot.roomData.players)}
                avatar={player?.avatar} ai={player?.ai} size={36} />
              <div><b>{playerName(id, snapshot.roomData.players)}</b>
                <small>{state?.claimedColumns?.length ?? 0} 条路线 · {savedStepCount(state)} 步</small></div>
              <strong>{state?.claimedColumns?.join(' / ') || '—'}</strong>
            </article>;
          })}</div>
          <ReplayBoard snapshot={snapshot} />
        </section><aside className="cs-replay-side"><Bull size={28} />
          <h2>此刻的权威状态</h2>
          <p>回放直接读取服务端快照，不在浏览器重演骰子或路线推进。</p>
          <dl><dt>当前玩家</dt><dd>{playerName(snapshot.roomData.currentPlayer, snapshot.roomData.players)}</dd>
            <dt>当前序号</dt><dd>{snapshot.seq}</dd>
            <dt>总事件</dt><dd>{snapshot.totalEvents}</dd></dl>
          {snapshot.roomData.lastAction && <div className="cs-replay-resolution"><b>最近行动</b>
            <span>{actionSummary(snapshot.roomData.lastAction, id =>
              playerName(id, snapshot.roomData.players))}</span></div>}
        </aside></div>
        <section className="cs-replay-controls"><header><span>已加载 {replay.loadedCount} / {replay.totalSnapshots}</span>
          {replay.backgroundLoading && <small>继续载入中…</small>}</header>
          <div><ActionButton disabled={!replay.selectedIndex} onClick={() => select(0)}>初始</ActionButton>
            <ActionButton disabled={!replay.selectedIndex} onClick={() => select(replay.selectedIndex - 1)}>
              <ChevronLeft size={14} />上一步</ActionButton>
            <b>{replay.selectedIndex} / {Math.max(0, replay.totalSnapshots - 1)}</b>
            <ActionButton disabled={replay.selectedIndex >= replay.totalSnapshots - 1} onClick={() => select(replay.selectedIndex + 1)}>
              下一步<ChevronRight size={14} /></ActionButton>
            <ActionButton disabled={replay.selectedIndex >= replay.totalSnapshots - 1} onClick={() => select(replay.totalSnapshots - 1)}>末步</ActionButton></div>
          <input type="range" min={0} max={Math.max(0, replay.totalSnapshots - 1)} value={previewIndex} aria-label="回放步骤"
            onChange={event => setPreviewIndex(Number(event.target.value))} onPointerUp={() => replay.selectIndex(previewIndex)}
            onTouchEnd={() => replay.selectIndex(previewIndex)} onKeyUp={() => replay.selectIndex(previewIndex)}
            onBlur={() => replay.selectIndex(previewIndex)} />
          {replay.progressError && <Feedback error>{replay.progressError.message}
            <ActionButton onClick={replay.retryProgress}>继续加载</ActionButton></Feedback>}</section></>}
      {!replay.initialLoading && replay.detail && !replay.totalSnapshots && <Feedback>此对局暂无可用快照。</Feedback>}
    </div>
  </AppShell>;
}

export default function Replay() {
  const { gameId } = useParams();
  const id = Number(gameId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return <AppShell title="对局回放"><Feedback error>
      回放编号无效。<Link to="/game/cantstop/me">返回我的牌局</Link>
    </Feedback></AppShell>;
  }
  return <ReplayContent key={id} gameID={id} />;
}
