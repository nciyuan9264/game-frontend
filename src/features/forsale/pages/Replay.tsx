import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameMobileReplayHeading } from '@/components/GameUI/GameMobileTopbar';
import { Feedback } from '@/components/GameUI/Panel';
import type { ForSaleReplaySnapshot } from '@/api/generated/game-platform';
import { useProgressiveReplay } from '@/hooks/useProgressiveReplay';
import { AppShell } from '../components/AppShell';
import {
  Cheque,
  PlayerAvatar,
  PropertyCard,
} from '../components/GamePieces';
import { ForSaleLoading } from '../components/LoadingState';
import { chequeMoney } from '../model/types';

const ReplayContent = ({ gameID }: { gameID: number }) => {
  const replay = useProgressiveReplay<ForSaleReplaySnapshot>(gameID, 'forsale');
  const [previewIndex, setPreviewIndex] = useState(0);
  const snapshot = replay.currentSnapshot;
  useEffect(() => {
    if (replay.pendingIndex == null) setPreviewIndex(replay.selectedIndex);
  }, [replay.pendingIndex, replay.selectedIndex]);
  const select = (index: number) => {
    setPreviewIndex(index);
    replay.selectIndex(index);
  };
  return <AppShell inMatch hideHeader title="成交回放" profile={replay.profile}>
    <div className="fs-replay">
      <GameMobileReplayHeading
        backTo="/game/forsale/me"
        backLabel="返回我的对局"
        kicker="DEAL REPLAY · 房间号"
        title={replay.detail?.game.roomID ?? '对局回放'}
      />
      <header data-game-desktop-topbar><Link to="/game/forsale/me"
      aria-label="返回我的对局"><ArrowLeft size={19} /></Link>
      <div><small>DEAL REPLAY · 房间号</small>
        <h1>{replay.detail?.game.roomID ?? '对局回放'}</h1></div>
      <span><LockKeyhole size={13} />参赛者只读回放</span></header>
      {replay.initialLoading && <ForSaleLoading title="正在重建这张拍卖桌。"
        description="载入资产、成交与公开记录" />}
      {replay.initialError && <Feedback error>{replay.initialError}
        <ActionButton onClick={replay.retryInitial}>重试</ActionButton></Feedback>}
      {snapshot && <><section className="fs-replay-meta">
        <span>第 {snapshot.roomData.round} / {snapshot.roomData.totalRounds} 轮</span>
        <span>{snapshot.currentEvent
          ? `${snapshot.currentEvent.displayName ?? snapshot.currentEvent.playerID} · ${snapshot.currentEvent.cmdType}`
          : '初始状态'}</span><span>阶段 {snapshot.roomData.gameStatus}</span>
      </section><div className="fs-replay-layout"><section>
        <div className="fs-replay-market">{snapshot.roomData.propertyMarket.map(value =>
          <PropertyCard key={value} value={value} compact />)}
          {snapshot.roomData.chequeMarket.map((value, index) =>
            <Cheque key={`${value}-${index}`} value={value} />)}</div>
        <div className="fs-replay-players">{snapshot.roomData.playerOrder.map(id => {
          const player = snapshot.roomData.players[id];
          const state = snapshot.playersData[id];
          return <article key={id}><PlayerAvatar
            name={player?.displayName ?? id} avatar={player?.avatar}
            ai={player?.ai} size={37} /><div><b>{player?.displayName ?? id}</b>
              <small>{state?.coins ?? 0} 枚金币 · {
                chequeMoney((state?.cheques ?? []).reduce(
                  (sum, value) => sum + value, 0,
                ))}</small></div>
            <span>{(state?.properties ?? []).map(value =>
              <i key={value}>{value}</i>)}</span></article>;
        })}</div></section><aside><h2>此刻的全部信息</h2>
          <p>回放展示每一步的权威资产与公开成交；尚未揭晓的暗选仍保持隐藏。</p>
          <dl><dt>当前最高价</dt><dd>{snapshot.roomData.highestBid} 枚</dd>
            <dt>已完成买房</dt><dd>{snapshot.roomData.purchases.length} 轮</dd>
            <dt>已完成卖房</dt><dd>{snapshot.roomData.sales.length} 轮</dd></dl>
        </aside></div><section className="fs-replay-controls"><header>
          <span>已加载 {replay.loadedCount} / {replay.totalSnapshots}</span>
          {replay.backgroundLoading && <small>继续载入中…</small>}</header>
          <div><ActionButton disabled={!replay.selectedIndex}
            onClick={() => select(0)}>初始</ActionButton>
            <ActionButton disabled={!replay.selectedIndex}
              onClick={() => select(replay.selectedIndex - 1)}>
              <ChevronLeft size={14} />上一步</ActionButton>
            <b>{replay.selectedIndex} / {Math.max(0, replay.totalSnapshots - 1)}</b>
            <ActionButton disabled={replay.selectedIndex >= replay.totalSnapshots - 1}
              onClick={() => select(replay.selectedIndex + 1)}>
              下一步<ChevronRight size={14} /></ActionButton>
            <ActionButton disabled={replay.selectedIndex >= replay.totalSnapshots - 1}
              onClick={() => select(replay.totalSnapshots - 1)}>末步</ActionButton></div>
          <input type="range" min={0} max={Math.max(0, replay.totalSnapshots - 1)}
            value={previewIndex} aria-label="回放步骤"
            onChange={event => setPreviewIndex(Number(event.target.value))}
            onPointerUp={() => replay.selectIndex(previewIndex)}
            onTouchEnd={() => replay.selectIndex(previewIndex)}
            onKeyUp={() => replay.selectIndex(previewIndex)}
            onBlur={() => replay.selectIndex(previewIndex)} />
          {replay.progressError && <Feedback error>{replay.progressError.message}
            <ActionButton onClick={replay.retryProgress}>继续加载</ActionButton>
          </Feedback>}</section></>}
    </div>
  </AppShell>;
};

export default function Replay() {
  const { gameId } = useParams();
  const id = Number(gameId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return <AppShell title="对局回放"><Feedback error>
      回放编号无效。<Link to="/game/forsale/me">返回我的对局</Link>
    </Feedback></AppShell>;
  }
  return <ReplayContent key={id} gameID={id} />;
}
