import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, GripHorizontal, Maximize2 } from 'lucide-react';
import { useReplayPanel } from '@/features/game-core/hooks/useReplayPanel';
import { snapshotToWsRoomSyncData } from './snapshotAdapter';
import EconomyChart from './EconomyChart';
import { AppShell } from '../../components/AppShell';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Board } from '../../components/Board';
import { MarketTable } from '../../components/MarketTable';
import { AcquireLoading } from '../../components/LoadingState';
import { Feedback } from '@/components/GameUI/Panel';
import { ResponsiveDialog } from '../../components/ResponsiveDialog';
import { StockPrices } from '../../dialogs/StockPrices';
import { companyPriceTiers, type Company } from '../../model/types';
import { MobileMarket, Portfolio } from '../Play/parts';
import { Results } from '../Results';
import styles from './index.module.less';
import { REPLAY_PAGE_SIZE, useProgressiveReplay } from './useProgressiveReplay';

const commandLabels: Record<string, string> = {
  game_place_tile: '放置地块', game_create_company: '成立公司', game_buy_stock: '购买股票',
  game_merging_selection: '选择存续公司', game_merging_settle: '合并结算',
  game_end_vote: '终局选择', turn_timeout: '超时推进',
};
function ReplayContent({ gameID }: { gameID: number }) {
  const replay = useProgressiveReplay(gameID);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [panel, setPanel] = useState<'score' | 'zoom'>();
  const [tab, setTab] = useState<'timeline' | 'economy'>('timeline');
  const [priceTier, setPriceTier] = useState<number>();
  const [scorePending, setScorePending] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const replayPanel = useReplayPanel();
  const snapshot = replay.currentSnapshot;
  const display = useMemo(
    () => snapshot && replay.viewer
      ? snapshotToWsRoomSyncData(snapshot, replay.viewer)
      : undefined,
    [replay.viewer, snapshot]
  );
  const finalSnapshot = replay.snapshots[replay.totalSnapshots - 1];
  const finalDisplay = useMemo(
    () => finalSnapshot && replay.viewer
      ? snapshotToWsRoomSyncData(finalSnapshot, replay.viewer)
      : undefined,
    [finalSnapshot, replay.viewer]
  );
  const total = replay.totalSnapshots;
  const event = snapshot?.currentEvent;
  const totalTurns = replay.detail?.events.filter(
    item => item.cmdType === 'game_place_tile'
  ).length ?? 0;
  useEffect(() => {
    if (replay.pendingIndex == null) setPreviewIndex(replay.selectedIndex);
  }, [replay.pendingIndex, replay.selectedIndex]);
  const selectStep = (nextIndex: number) => {
    setPreviewIndex(nextIndex);
    replay.selectIndex(nextIndex);
  };
  const openResults = async () => {
    setScorePending(true);
    setScoreError('');
    try {
      await replay.ensureFinalSnapshot();
      setPanel('score');
    } catch (reason) {
      setScoreError(reason instanceof Error ? reason.message : '最终结算载入失败');
    } finally {
      setScorePending(false);
    }
  };
  if (panel === 'score' && finalDisplay) return <AppShell inMatch title="本局结算" profile={replay.profile} hideHeader hideRail>
    <Results data={{ ...finalDisplay, roomID: replay.detail?.game.roomID }} enabled={false} onClose={() => setPanel(undefined)} />
  </AppShell>;
  return <AppShell inMatch title="对局回放" profile={replay.profile} hideHeader hideRail><div
    className={`${styles.page} ${tab === 'economy' ? styles.economyPage : ''}`}>
    <header className={styles.heading}><div className={styles.headingIdentity}><Link to="/game/acquire/me" className={styles.backButton} aria-label="返回战绩"><ArrowLeft size={19} /></Link><div><small>CLASSIC REPLAY · 房间号</small><h1>{replay.detail?.game.roomID ?? '对局回放'}</h1></div></div>
      <div className={styles.headingTools}><span className={styles.replayBadge}>只读回放</span></div></header>
    {replay.initialError && <Feedback error>{replay.initialError}<ActionButton onClick={replay.retryInitial}>重试</ActionButton></Feedback>}
    {replay.initialLoading && <AcquireLoading title="正在重建这座城。" description="正在载入首批快照与时间轴" status="正在准备回放" />}
    {!replay.initialLoading && replay.detail && !total && <Feedback>此对局暂无可用快照。</Feedback>}
    {display && <><MobileMarket data={display} onCompany={(company: Company) => setPriceTier(companyPriceTiers[company])} onActivity={() => setTab('timeline')} />
      <div className={styles.layout}><aside className={styles.marketColumn}><MarketTable data={display} /></aside>
      <section className={styles.boardColumn}><div className={styles.boardHeading}><span>{event ? `${event.displayName} · ${commandLabels[event.cmdType] ?? event.cmdType}` : '初始状态'}
        {replay.pendingIndex != null && <small className={styles.frameStatus}>正在加载第 {replay.pendingIndex} 步</small>}</span><div className={styles.boardTools}><button type="button" className={styles.zoomButton} onClick={() => setPanel('zoom')}><Maximize2 size={13} />放大棋盘</button></div></div>
        <Board data={display} mode="replay" /><p className={styles.note}>你的手牌：{display.playerData.tiles.join(' · ') || '无'}。回放不会发送对局操作。</p></section>
      <aside className={styles.portfolioColumn}><Portfolio data={display} /></aside></div>
      <section ref={replayPanel.panelRef}
        className={`${styles.timeline} ${replayPanel.collapsed ? styles.timelineCollapsed : ''}`}
        style={replayPanel.positionStyle}>
        <button type="button" className={styles.dragHandle} aria-label="移动回放面板" title="移动回放面板"
          {...replayPanel.dragHandleProps}><GripHorizontal size={18} /></button>
        <div className={styles.timelineContent}><header><div role="group" aria-label="回放内容"><ActionButton data-click-sound="tab" variant={tab === 'timeline' ? 'primary' : 'quiet'} onClick={() => setTab('timeline')}>时间轴</ActionButton><ActionButton data-click-sound="tab" variant={tab === 'economy' ? 'primary' : 'quiet'} onClick={() => setTab('economy')}>经济曲线</ActionButton></div>
          <div className={styles.loadMeta}><span className={styles.loadCount}><b>已加载 {replay.loadedCount} / {total}</b><i>{replay.loadedCount}/{total}</i></span>{replay.backgroundLoading && <span className={styles.loadSpinner} aria-label="正在载入回放" />}</div>
          {replay.detail?.game.endedAt && <ActionButton pending={scorePending} onClick={openResults}>最终结算</ActionButton>}</header>
          <div className={styles.loadTrack} role="progressbar" aria-label="回放载入进度" aria-valuemin={0} aria-valuemax={total} aria-valuenow={replay.loadedCount}><i style={{ width: `${total ? replay.loadedCount / total * 100 : 0}%` }} /></div>
          {(replay.progressError || scoreError) && <div className={styles.progressStatus} role="alert">{scoreError || '加载暂停'}{replay.progressError && <ActionButton variant="quiet" onClick={replay.retryProgress}>继续加载</ActionButton>}</div>}
          <div className={styles.controls}><ActionButton disabled={!replay.selectedIndex} onClick={() => selectStep(0)}>初始</ActionButton><ActionButton disabled={!replay.selectedIndex} onClick={() => selectStep(replay.selectedIndex - 1)}>上一步</ActionButton>{replayPanel.collapsed
            ? <button type="button" className={styles.stepCounter} aria-label="移动折叠回放面板" title="拖动移动回放面板"
              {...replayPanel.dragHandleProps}>{replay.selectedIndex} / {Math.max(0, total - 1)}</button>
            : <span className={styles.stepCounter}>{replay.selectedIndex} / {Math.max(0, total - 1)}</span>}<ActionButton disabled={replay.selectedIndex >= total - 1} onClick={() => selectStep(replay.selectedIndex + 1)}>下一步</ActionButton><ActionButton disabled={replay.selectedIndex >= total - 1} onClick={() => selectStep(total - 1)}>末步</ActionButton>
            <button type="button" className={styles.collapseToggle}
              aria-label={replayPanel.collapsed ? '展开回放面板' : '收起回放面板'}
              aria-expanded={!replayPanel.collapsed}
              title={replayPanel.collapsed ? '展开回放面板' : '收起回放面板'}
              onClick={replayPanel.toggleCollapsed}>
              {replayPanel.collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button></div>
          <input className={styles.range} type="range" min={0} max={Math.max(0, total - 1)} value={previewIndex}
            onChange={changeEvent => setPreviewIndex(Number(changeEvent.target.value))}
            onPointerUp={() => replay.selectIndex(previewIndex)}
            onTouchEnd={() => replay.selectIndex(previewIndex)}
            onKeyUp={() => replay.selectIndex(previewIndex)}
            onBlur={() => replay.selectIndex(previewIndex)}
            aria-label="回放步骤" />
          <div className={styles.timelineViewport}>{tab === 'timeline' ? <div className={styles.events}>{replay.snapshots.map((item, itemIndex) => {
            const pageOffset = Math.floor(itemIndex / REPLAY_PAGE_SIZE) * REPLAY_PAGE_SIZE;
            const isLoading = replay.inFlightOffset === pageOffset;
            const isFailed = replay.failedOffsets.has(pageOffset);
            const meta = item?.currentEvent ?? (itemIndex > 0 ? replay.detail?.events[itemIndex - 1] : undefined);
            const label = itemIndex === 0 ? '初始' : commandLabels[meta?.cmdType ?? ''] ?? meta?.cmdType ?? '待载入';
            return <button key={itemIndex} className={!item ? isFailed ? styles.failedEvent : isLoading ? styles.loadingEvent : styles.unloadedEvent : ''}
              aria-pressed={replay.selectedIndex === itemIndex} aria-busy={isLoading || undefined}
              onClick={() => selectStep(itemIndex)}>{itemIndex}<small>{isFailed ? '重试' : isLoading ? '载入中' : label}</small></button>;
          })}</div>
            : <EconomyChart snapshots={replay.contiguousSnapshots} players={replay.detail?.players}
              totalTurns={totalTurns} loadedCount={replay.loadedCount} totalSnapshots={total}
              paused={Boolean(replay.progressError)} />}</div>
        </div>
      </section></>}
    {panel === 'zoom' && display && <ResponsiveDialog title="回放棋盘" wide onClose={() => setPanel(undefined)}><Board data={display} mode="replay" zoom /></ResponsiveDialog>}
    {priceTier != null && display && <StockPrices data={display} initialTier={priceTier} onClose={() => setPriceTier(undefined)} />}
  </div></AppShell>;
}
export default function Replay() {
  const { gameId } = useParams();
  const id = Number(gameId);
  if (!Number.isSafeInteger(id) || id <= 0) return <AppShell title="对局回放"><Feedback error>回放编号无效。<Link to="/game/acquire/me">返回我的战绩</Link></Feedback></AppShell>;
  return <ReplayContent key={id} gameID={id} />;
}
