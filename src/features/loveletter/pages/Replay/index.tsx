import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, ChevronLeft, ChevronRight, LockKeyhole,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameMobileReplayHeading } from '@/components/GameUI/GameMobileTopbar';
import { Feedback } from '@/components/GameUI/Panel';
import type { LoveLetterSnapshot } from '@/features/game-core/model/history';
import { useProgressiveReplay } from '@/hooks/useProgressiveReplay';
import { AppShell } from '../../components/AppShell';
import { CardBack, Hearts, PlayingCard, Portrait } from '../../components/Card';
import { LoveLetterLoading } from '../../components/LoadingState';
import { playerName } from '../../model/session';
import { role } from '../../model/roles';

function ReplayContent({ gameID }: { gameID: number }) {
  const replay = useProgressiveReplay<LoveLetterSnapshot>(gameID, 'loveletter');
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
    <div className="ll-replay">
      <GameMobileReplayHeading
        backTo="/game/loveletter/me"
        backLabel="返回我的信件"
        kicker="OMNISCIENT REPLAY · 房间号"
        title={replay.detail?.game.roomID ?? '对局回放'}
      />
      <header data-game-desktop-topbar><Link to="/game/loveletter/me" aria-label="返回我的信件">
      <ArrowLeft size={19} /></Link><div><small>OMNISCIENT REPLAY · 房间号</small>
        <h1>{replay.detail?.game.roomID ?? '对局回放'}</h1></div>
      <span><LockKeyhole size={13} />参赛者全知回放</span></header>
      {replay.initialLoading && <LoveLetterLoading title="正在重建这座庭院。"
        description="载入牌序、私密效果与公开记录" />}
      {replay.initialError && <Feedback error>{replay.initialError}
        <ActionButton onClick={replay.retryInitial}>重试</ActionButton></Feedback>}
      {snapshot && <><section className="ll-replay-meta">
        <span>第 {snapshot.roomData.roundNo} 轮</span>
        <span>{snapshot.currentEvent
          ? `${snapshot.currentEvent.displayName} · ${snapshot.currentEvent.cmdType}`
          : '初始状态'}</span>
        <span>阶段 {snapshot.roomData.gameStatus}</span></section>
        <div className="ll-replay-layout"><section className="ll-replay-table">
          <div className="ll-replay-players">{snapshot.roomData.playerOrder.map((id, index) => {
            const value = snapshot.playersData[id];
            const privateValue = snapshot.privateData[id];
            return <article key={id}><Portrait rank={index % 10} />
              <div><b>{playerName(id, snapshot.roomData.players)}</b>
                <Hearts value={value?.favors} total={snapshot.roomData.goal} />
                <small>{!value?.alive ? '本轮出局' : value.protected
                  ? '侍女保护中' : snapshot.roomData.currentPlayer === id ? '正在行动' : '仍在本轮'}</small></div>
              <span>{privateValue?.hand.map(card =>
                <PlayingCard key={card.cardID} card={card} compact />)}</span>
              <aside>{value?.discards.map(card =>
                <i key={card.cardID}>{card.rank} {role(card.rank).name}</i>)}</aside>
            </article>;
          })}</div>
          <div className="ll-replay-deck"><span><CardBack />
            <b>{snapshot.deck.length}</b><small>牌堆</small></span>
            <span>{snapshot.reserve ? <PlayingCard card={snapshot.reserve} compact /> : <CardBack />}
              <small>封存牌</small></span>
            <span>{snapshot.roomData.burnCards.map(card =>
              <PlayingCard key={card.cardID} card={card} compact />)}
              <small>公开移出</small></span></div>
        </section>
        <aside className="ll-replay-side"><BookOpen size={21} />
          <h2>此刻的全部信息</h2><p>已结束对局向参赛者展示当时所有手牌、牌堆顺序、封存牌与私密效果。</p>
          {snapshot.currentEvent && <dl><dt>行动者</dt>
            <dd>{snapshot.currentEvent.displayName}</dd><dt>命令</dt>
            <dd>{snapshot.currentEvent.cmdType}</dd><dt>序号</dt>
            <dd>{snapshot.currentEvent.seq}</dd></dl>}</aside></div>
        <section className="ll-replay-controls"><header><span>已加载 {
          replay.loadedCount} / {replay.totalSnapshots}</span>
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
            <ActionButton onClick={replay.retryProgress}>继续加载</ActionButton></Feedback>}
        </section></>}
      {!replay.initialLoading && replay.detail && !replay.totalSnapshots
        && <Feedback>此对局暂无可用快照。</Feedback>}
    </div>
  </AppShell>;
}

export default function Replay() {
  const { gameId } = useParams();
  const id = Number(gameId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return <AppShell title="对局回放"><Feedback error>
      回放编号无效。<Link to="/game/loveletter/me">返回我的信件</Link>
    </Feedback></AppShell>;
  }
  return <ReplayContent key={id} gameID={id} />;
}
