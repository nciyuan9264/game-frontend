import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
} from 'lucide-react';
import type { WarChestReplaySnapshot } from '@/api/generated/game-platform';
import { GameMobileReplayHeading } from '@/components/GameUI/GameMobileTopbar';
import { useProgressiveReplay } from '@/hooks/useProgressiveReplay';
import { Shell, Loading, Notice } from '../../components/Shell';
import { replaySource, toBattleGame } from '../../selectors';
import { Battle } from '../Battle';

function ReplayContent({ gameID }: { gameID: number }) {
  const replay = useProgressiveReplay<WarChestReplaySnapshot>(gameID, 'warchest');
  const [preview, setPreview] = useState(0);
  useEffect(() => {
    if (replay.pendingIndex == null) setPreview(replay.selectedIndex);
  }, [replay.pendingIndex, replay.selectedIndex]);
  const game = useMemo(() => replay.currentSnapshot && replay.viewer
    ? toBattleGame(replaySource(replay.currentSnapshot, replay.viewer))
    : undefined, [replay.currentSnapshot, replay.viewer]);
  const total = replay.totalSnapshots;
  const select = (index: number) => {
    setPreview(index);
    replay.selectIndex(index);
  };

  if (replay.initialLoading) return <Shell title="对局回放" profile={replay.profile}>
    <Loading text="正在还原战场与全知指令。" />
  </Shell>;
  if (replay.initialError || !game) return <Shell title="对局回放" profile={replay.profile}>
    <main className="page"><Notice error>{replay.initialError || '回放快照不可用'}
      <button type="button" className="text-button" onClick={replay.retryInitial}>重试</button></Notice></main>
  </Shell>;

  const event = replay.currentSnapshot?.currentEvent;
  return <div className="warchest-replay-root"><Battle game={game}
    roomID={replay.detail?.game.roomID ?? ''}
    roomName={replay.detail?.game.roomDisplayName || '全知对局回放'}
    interactive={false} revealHands
    mobileHeading={<GameMobileReplayHeading
      backTo="/game/warchest/me"
      backLabel="返回战绩"
      kicker="WAR CHEST REPLAY · 房间号"
      title={replay.detail?.game.roomID ?? '对局回放'}
    />} />
    <Link className="warchest-replay-back" to="/game/warchest/me"
      data-game-desktop-topbar
      aria-label="返回战绩"><ArrowLeft size={17} />返回战绩</Link>
    <section className="warchest-root replay-dock" data-testid="warchest-replay-panel">
      <header><History size={15} /><strong>{event
        ? `${event.displayName} · ${event.cmdType}` : '初始局面'}</strong>
        <span><Eye size={13} />全知视角</span></header>
      <div className="replay-controls"><button className="icon-button" type="button"
        aria-label="初始局面" disabled={!replay.selectedIndex} onClick={() => select(0)}>首</button>
        <button className="icon-button" type="button" aria-label="上一步"
          disabled={!replay.selectedIndex} onClick={() => select(replay.selectedIndex - 1)}>
          <ChevronLeft size={17} /></button>
        <input type="range" min={0} max={Math.max(0, total - 1)} value={preview}
          onChange={event => setPreview(Number(event.target.value))}
          onPointerUp={() => replay.selectIndex(preview)}
          onTouchEnd={() => replay.selectIndex(preview)}
          onKeyUp={() => replay.selectIndex(preview)}
          aria-label="回放步骤" />
        <span>{replay.selectedIndex} / {Math.max(0, total - 1)}</span>
        <button className="icon-button" type="button" aria-label="下一步"
          disabled={replay.selectedIndex >= total - 1}
          onClick={() => select(replay.selectedIndex + 1)}><ChevronRight size={17} /></button>
        <button className="icon-button" type="button" aria-label="最终局面"
          disabled={replay.selectedIndex >= total - 1} onClick={() => select(total - 1)}>末</button></div>
      {(replay.progressError || replay.backgroundLoading) && <small>
        {replay.progressError ? <button type="button" className="text-button"
          onClick={replay.retryProgress}>回放加载暂停 · 继续加载</button>
          : `后台载入 ${replay.loadedCount} / ${total}`}</small>}
    </section>
  </div>;
}

export default function Replay() {
  const { gameId } = useParams();
  const id = Number(gameId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return <Shell title="对局回放"><main className="page"><Notice error>回放编号无效。
      <Link to="/game/warchest/me">返回我的战绩</Link></Notice></main></Shell>;
  }
  return <ReplayContent key={id} gameID={id} />;
}
