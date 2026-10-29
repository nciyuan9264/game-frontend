import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameMobileReplayHeading } from '@/components/GameUI/GameMobileTopbar';
import { Feedback } from '@/components/GameUI/Panel';
import type { SixNimmtSnapshot } from '@/features/game-core/model/history';
import { useProgressiveReplay } from '@/hooks/useProgressiveReplay';
import { AppShell, Bull, PlayerAvatar } from '../../components/AppShell';
import { BullScore, NumberCard } from '../../components/Card';
import { SixNimmtLoading } from '../../components/LoadingState';
import { rowLetters } from '../../model/cards';
import { playerName } from '../../model/session';

function ReplayContent({ gameID }: { gameID: number }) {
  const replay = useProgressiveReplay<SixNimmtSnapshot>(gameID, 'sixnimmt');
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
    <div className="sn-replay">
      <GameMobileReplayHeading
        backTo="/game/sixnimmt/me"
        backLabel="返回我的牌局"
        kicker="OMNISCIENT REPLAY · 房间号"
        title={replay.detail?.game.roomID ?? '对局回放'}
      />
      <header data-game-desktop-topbar>
      <Link to="/game/sixnimmt/me" aria-label="返回我的牌局"><ArrowLeft size={19} /></Link>
      <div><small>OMNISCIENT REPLAY · 房间号</small>
        <h1>{replay.detail?.game.roomID ?? '对局回放'}</h1></div>
      <span><LockKeyhole size={13} />参赛者全知回放</span></header>
      {replay.initialLoading && <SixNimmtLoading title="正在重建这张牌桌。" description="载入手牌、牌列与逐张结算" />}
      {replay.initialError && <Feedback error>{replay.initialError}
        <ActionButton onClick={replay.retryInitial}>重试</ActionButton></Feedback>}
      {snapshot && <><section className="sn-replay-meta">
        <span>第 {snapshot.roomData.roundNo} 局</span><span>第 {snapshot.roomData.turnNo} / 10 轮</span>
        <span>{snapshot.currentEvent ? `${snapshot.currentEvent.displayName} · ${snapshot.currentEvent.cmdType}` : '初始状态'}</span>
        <span>阶段 {snapshot.roomData.gameStatus}</span></section>
        <div className="sn-replay-layout"><section className="sn-replay-main">
          <div className="sn-replay-players">{snapshot.roomData.playerOrder.map(id => {
            const player = snapshot.roomData.players[id];
            const state = snapshot.playersData[id];
            const privateData = snapshot.privateData[id];
            return <article key={id}>
              <PlayerAvatar name={playerName(id, snapshot.roomData.players)} avatar={player?.avatar} ai={player?.ai} size={36} />
              <div><b>{playerName(id, snapshot.roomData.players)}</b>
                <small>{state?.locked ? `已锁定 ${privateData?.lockedCard ?? '—'}` : `${state?.handCount ?? 0} 张手牌`}</small></div>
              <BullScore value={state?.totalPenalty ?? 0} />
              <span>{privateData?.hand.map(card => <NumberCard key={card} value={card} compact />)}</span>
            </article>;
          })}</div>
          <div className="sn-replay-table">{snapshot.roomData.rows.map(row => <div key={row.index}>
            <b>{rowLetters[row.index]}</b><span>{row.cards.map(card => <NumberCard key={card} value={card} compact />)}</span>
            <BullScore value={row.bullheads} /></div>)}</div>
        </section><aside className="sn-replay-side"><Bull size={28} />
          <h2>此刻的全部信息</h2>
          <p>已结束对局向参赛者展示当时所有手牌、锁定牌和未使用牌，但仍直接使用服务端快照，不在浏览器重演规则。</p>
          <dl><dt>未使用牌</dt><dd>{snapshot.unusedCards.length} 张</dd>
            <dt>已锁定</dt><dd>{snapshot.roomData.lockedPlayerIDs.length} 人</dd>
            <dt>当前序号</dt><dd>{snapshot.seq}</dd></dl>
          {snapshot.roomData.lastResolution && <div className="sn-replay-resolution"><b>最近结算</b>
            {snapshot.roomData.lastResolution.placements.map(item => <span key={`${item.playerID}:${item.card}`}>
              {item.card} → {rowLetters[item.rowIndex]} 行{!!item.penalty && <em>+{item.penalty}</em>}</span>)}</div>}
        </aside></div>
        <section className="sn-replay-controls"><header><span>已加载 {replay.loadedCount} / {replay.totalSnapshots}</span>
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
      回放编号无效。<Link to="/game/sixnimmt/me">返回我的牌局</Link>
    </Feedback></AppShell>;
  }
  return <ReplayContent key={id} gameID={id} />;
}
