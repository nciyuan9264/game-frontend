import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Coins, Crown, Gem,
  Layers, Trophy,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { REPLAY_PAGE_SIZE, useProgressiveReplay } from '@/hooks/useProgressiveReplay';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { GemIcon } from '../../components/Artwork';
import {
  DeckBack, DevelopmentCardView, NobleTile,
} from '../../components/GamePieces';
import { SplendorLoading } from '../../components/LoadingState';
import { deckCount, discounts, tokenTotal } from '../../model/selectors';
import type { GameSnapshot } from '../../model/session';
import { playerName } from '../../model/session';
import {
  cardColors, gemColors, type DevelopmentCard, type Noble, type PlayerState,
  type SplendorPlayer, type SplendorResult,
} from '../../model/types';
import { Results } from '../Results';
import styles from './index.module.less';

interface ReplaySnapshot {
  seq: number;
  totalEvents: number;
  currentEvent?: { seq: number; playerID: string; displayName: string; cmdType: string; payload: unknown };
  roomData: {
    normalCards: Record<string, DevelopmentCard>;
    nobleCards: Record<string, Noble>;
    deckCounts?: Partial<Record<1 | 2 | 3, number>>;
    gems: Record<string, number>;
    currentPlayer: string;
    gameStatus: GameSnapshot['roomData']['gameStatus'];
    lastData?: GameSnapshot['roomData']['lastData'];
    players: Record<string, SplendorPlayer>;
  };
  playersData: Record<string, PlayerState>;
  result: Record<string, SplendorResult>;
}

const commandLabels: Record<string, string> = {
  game_get_gem: '拿取宝石',
  game_buy_card: '购买发展卡',
  game_preserve_card: '预留发展卡',
  turn_timeout: '超时推进',
};

function adapt(snapshot: ReplaySnapshot, viewer: string, roomID: string, playerOrder: string[]): GameSnapshot {
  const cards = Object.values(snapshot.roomData.normalCards)
    .sort((left, right) => left.id - right.id)
    .filter(card => card.state === 1)
    .reduce<Record<string, DevelopmentCard[]>>((groups, card) => {
      (groups[String(card.level)] ??= []).push(card);
      return groups;
    }, {});
  const players = { ...snapshot.roomData.players };
  playerOrder.forEach((id, index) => {
    players[id] ??= { playerID: id, online: false, ai: false, ready: true, seatIndex: index };
  });
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID: `replay:${roomID}`,
    seq: snapshot.seq,
    ownerID: playerOrder[0] ?? '',
    visibility: 'public',
    phaseVersion: snapshot.seq + 1,
    turnNumber: snapshot.seq + 1,
    playerId: viewer,
    playerData: snapshot.playersData,
    result: snapshot.result,
    roomData: {
      card: cards,
      deckCounts: snapshot.roomData.deckCounts,
      gems: snapshot.roomData.gems,
      nobles: Object.values(snapshot.roomData.nobleCards)
        .filter(noble => noble.state === 1)
        .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true })),
      currentPlayer: snapshot.roomData.currentPlayer,
      gameStatus: snapshot.roomData.gameStatus,
      lastData: snapshot.roomData.lastData,
      players,
      playerOrder,
      phaseVersion: snapshot.seq + 1,
      turnNumber: snapshot.seq + 1,
    },
  };
}

function ReplayContent({ gameID }: { gameID: number }) {
  const replay = useProgressiveReplay<ReplaySnapshot>(gameID, 'splendor');
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
  const event = replay.currentSnapshot?.currentEvent;
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
      <Results readOnly data={finalData} onViewBoard={() => setShowResults(false)} onLeave={() => setShowResults(false)} />
    </AppShell>;
  }

  const viewerState = data?.playerData[data.playerId];
  const viewerDiscounts = discounts(viewerState);
  return <AppShell inMatch hideHeader title="对局回放" profile={replay.profile}><div className={styles.page}>
    <header className={styles.heading}><Link to="/game/splendor/me" aria-label="返回战绩"><ArrowLeft size={18} /></Link>
      <div><small>JEWEL REPLAY · 房间号</small><h1>{replay.detail?.game.roomID ?? '对局回放'}</h1></div>
      <span>只读回放</span></header>
    {replay.initialLoading && <SplendorLoading title="正在重新陈列珠宝。" description="载入回放快照与时间轴" />}
    {replay.initialError && <Feedback error>{replay.initialError}<ActionButton onClick={replay.retryInitial}>重试</ActionButton></Feedback>}
    {data && <><section className={styles.players}>{data.roomData.playerOrder.map(id => {
      const state = data.playerData[id];
      const bonus = discounts(state);
      return <article key={id} className={id === data.roomData.currentPlayer ? styles.current : ''}>
        <PlayerAvatar name={playerName(id, data.roomData.players)} ai={data.roomData.players[id]?.ai} size={34} />
        <div><b>{playerName(id, data.roomData.players)}</b><small><Layers size={10} />{state?.normalCard.length ?? 0}
          <i /> <Coins size={10} />{tokenTotal(state)} <i /> <Bookmark size={10} />{state?.reserveCard.length ?? 0}</small></div>
        <strong>{state?.score ?? 0}<small>声望</small></strong>
        <span className={styles.resources}>{gemColors.map(color => <i key={color}><GemIcon color={color} size={15} />
          <b>{color === 'Gold' ? '—' : bonus[color]}</b><em>{state?.gem[color] ?? 0}</em></i>)}</span>
      </article>;
    })}</section>
      <main className={styles.table}><section className={styles.market}><header><div><small>DEVELOPMENT MARKET</small>
        <h2>{event ? `${event.displayName} · ${commandLabels[event.cmdType] ?? event.cmdType}` : '初始状态'}</h2></div>
        <span>第 {replay.selectedIndex} / {Math.max(0, replay.totalSnapshots - 1)} 步</span></header>
        <div className={styles.nobles}><span><Crown size={14} />贵族的青睐</span>
          <div>{data.roomData.nobles.map(noble => <NobleTile key={noble.id} noble={noble} progress={viewerDiscounts} compact />)}</div></div>
        <div className={styles.cards}>{([3, 2, 1] as const).map(level => <section key={level}>
          <DeckBack level={level} count={deckCount(data, level)} />
          <div>{data.roomData.card[String(level)]?.map(card => <DevelopmentCardView key={card.id} card={card} />)}</div>
        </section>)}</div>
        <footer><span>S P L E N D O R</span><span>只读回放 · 所有局面来自权威快照</span><span>THE GILDED HOUR</span></footer></section>
        <aside><section><header><Gem size={16} />宝石库存</header><div className={styles.gems}>{gemColors.map(color =>
          <span key={color}><GemIcon color={color} size={28} /><b>{data.roomData.gems[color] ?? 0}</b><small>{color}</small></span>)}</div></section>
          <section><header><Trophy size={16} />你的收藏</header><div className={styles.collection}>{cardColors.map(color =>
            <span key={color}><GemIcon color={color} size={24} /><b>{viewerDiscounts[color]}</b></span>)}</div>
            <p>宝石 {tokenTotal(viewerState)} 枚 · 预留 {viewerState?.reserveCard.length ?? 0} 张</p></section></aside>
      </main>
      <section className={styles.timeline}><header><span>已加载 {replay.loadedCount} / {replay.totalSnapshots}</span>
        {replay.backgroundLoading && <i />}{replay.detail?.game.endedAt && <ActionButton onClick={() => void openResults()}>最终结算</ActionButton>}</header>
        {replay.progressError && <Feedback error>回放加载暂停<ActionButton variant="quiet" onClick={replay.retryProgress}>继续加载</ActionButton></Feedback>}
        <div className={styles.controls}><ActionButton disabled={!replay.selectedIndex} onClick={() => select(replay.selectedIndex - 1)}>
          <ChevronLeft size={15} />上一步</ActionButton>
          <input type="range" min={0} max={Math.max(0, replay.totalSnapshots - 1)} value={preview}
            onChange={eventValue => setPreview(Number(eventValue.target.value))}
            onPointerUp={() => replay.selectIndex(preview)} onTouchEnd={() => replay.selectIndex(preview)}
            onKeyUp={() => replay.selectIndex(preview)} aria-label="回放步骤" />
          <ActionButton disabled={replay.selectedIndex >= replay.totalSnapshots - 1}
            onClick={() => select(replay.selectedIndex + 1)}>下一步<ChevronRight size={15} /></ActionButton></div>
        <div className={styles.events}>{replay.snapshots.map((snapshot, index) => {
          const pageOffset = Math.floor(index / REPLAY_PAGE_SIZE) * REPLAY_PAGE_SIZE;
          return <button key={index} aria-pressed={index === replay.selectedIndex}
            className={!snapshot ? replay.failedOffsets.has(pageOffset) ? styles.failed : styles.unloaded : ''}
            onClick={() => select(index)}>{index}<small>{index === 0 ? '初始'
              : commandLabels[(snapshot?.currentEvent ?? replay.detail?.events[index - 1])?.cmdType ?? ''] ?? '待载入'}</small></button>;
        })}</div>
      </section></>}
  </div></AppShell>;
}

export default function Replay() {
  const { gameId } = useParams();
  const id = Number(gameId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return <AppShell title="对局回放"><Feedback error>回放编号无效。<Link to="/game/splendor/me">返回我的战绩</Link></Feedback></AppShell>;
  }
  return <ReplayContent key={id} gameID={id} />;
}
