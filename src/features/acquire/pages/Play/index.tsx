import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Maximize2, Trophy, Wallet } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameMobileTopbar } from '@/components/GameUI/GameMobileTopbar';
import { AnimatedValue } from '../../components/AnimatedValue';
import { Board } from '../../components/Board';
import { ResponsiveDialog } from '../../components/ResponsiveDialog';
import { EndGameDialog } from '../../dialogs/EndGame';
import { TradeDialog } from '../../dialogs/Trade';
import { StockPrices } from '../../dialogs/StockPrices';
import type { AcquireSession } from '../../hooks/useAcquireSession';
import type { AcquireInteraction } from '../../hooks/useAcquireInteraction';
import { useAcquireViewport } from '../../hooks/useAcquireViewport';
import { canPlace, mergeSettlementPlayer } from '../../model/selectors';
import { endGameState, money, type GameSnapshot } from '../../model/session';
import { companyPriceTiers, type Company } from '../../model/types';
import { Results } from '../Results';
import { PlayDesktop } from './PlayDesktop';
import { PlayMobile } from './PlayMobile';
import { Activity, Deadline, EndVoteControl, PhaseAction, PhaseBanner } from './parts';
import { useMobilePlayFit } from './useMobilePlayFit';
import styles from './index.module.less';

export function Play({ data, session, interaction, onLeave, onStartNextMatch, startNextMatchPending = false }: {
  data: GameSnapshot;
  session: AcquireSession;
  interaction: AcquireInteraction;
  onLeave: () => void;
  onStartNextMatch?: () => Promise<boolean>;
  startNextMatchPending?: boolean;
}) {
  const { isMobile } = useAcquireViewport();
  const [panel, setPanel] = useState<'zoom' | 'activity' | 'finish' | 'results' | 'restart'>();
  const [priceTier, setPriceTier] = useState<number>();
  const [toast, setToast] = useState<{ id: number; text: string }>();
  const toastSequence = useRef(0);
  const finishPrompted = useRef('');
  const [endedKey, setEndedKey] = useState('');
  const end = data.roomData.gameStatus === 'end';
  const endGame = endGameState(data);
  const showEndVote = endGame.eligible && !end;
  const endVotePending = session.pending?.type === 'game_end_vote';
  const timedPlayerID = data.roomData.gameStatus === 'mergingSettle'
    ? mergeSettlementPlayer(data)
    : data.roomData.currentPlayer;
  const turnDeadline = timedPlayerID === data.playerId
    ? data.roomData.turnDeadline
    : undefined;
  const endKey = end ? `${data.roomID}:${data.phaseVersion}` : '';
  if (endKey !== endedKey) {
    setEndedKey(endKey); setPanel(end ? 'results' : undefined);
  }
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!showEndVote || finishPrompted.current === data.roomID || interaction.panel ||
      panel || priceTier != null) return;
    finishPrompted.current = data.roomID;
    setPanel('finish');
  }, [data.roomID, interaction.panel, panel, priceTier, showEndVote]);
  const notify = (text: string) => setToast({ id: ++toastSequence.current, text });
  const openFinish = () => {
    finishPrompted.current = data.roomID;
    setPanel('finish');
  };
  const submitEndVote = (allow: boolean) => session.submit('game_end_vote', { allow });
  const endVoteControl = showEndVote ? <EndVoteControl data={data} enabled={interaction.enabled}
    pending={endVotePending} onToggle={submitEndVote} onHelp={openFinish} /> : undefined;
  const mobileFit = useMobilePlayFit(isMobile && !(end && (panel === 'results' || panel === 'restart')));
  const playFitClassName = [
    styles.playFitRoot,
    isMobile && mobileFit.fitLevel >= 1 ? styles.fitHideBoardHeading : '',
    isMobile && mobileFit.fitLevel >= 2 ? styles.fitCompactMarket : '',
    isMobile && mobileFit.fitLevel >= 3 ? styles.fitCompactPhase : '',
  ].filter(Boolean).join(' ');
  const boardProps = { data, mode: 'live' as const, selected: interaction.draft.tile, canSelect: interaction.enabled && canPlace(data),
    onSelect: interaction.selectTile, onInspect: notify };
  const board = <Board {...boardProps} />;
  const props = { data, interaction, board, pending: !!session.pending, activity: session.activity,
    onCompany: (company: Company) => setPriceTier(companyPriceTiers[company]),
    onActivity: () => setPanel('activity'),
    resultsAction: end ? <ActionButton variant="primary" aria-label="查看本局结算" onClick={() => setPanel('results')}><Trophy size={16} />查看结算</ActionButton> : undefined,
    boardTools: <div className={styles.boardTools}><button className={styles.zoomButton} onClick={() => setPanel('zoom')}><Maximize2 size={13} />放大棋盘</button></div> };
  if (end && (panel === 'results' || panel === 'restart')) return <><Results data={data} enabled={interaction.enabled} onClose={() => setPanel(undefined)}
    onLeave={onLeave} onRestart={data.ownerID === data.playerId && onStartNextMatch ? () => setPanel('restart') : undefined} />
    {panel === 'restart' && <ResponsiveDialog title="重新开局" onClose={() => setPanel('results')}
      footer={<><ActionButton onClick={() => setPanel('results')}>取消</ActionButton><ActionButton variant="primary"
        disabled={!interaction.enabled || startNextMatchPending} onClick={() => {
          void onStartNextMatch?.().then(started => { if (started) setPanel(undefined); });
        }}>确认重开</ActionButton></>}>
      <p>本局已结束。确认后回到准备房间，由房主开始下一局。</p>
    </ResponsiveDialog>}</>;
  return <>
    <div ref={mobileFit.containerRef} className={playFitClassName}>
      <GameMobileTopbar
        onBack={onLeave}
        backLabel="离开当前对局"
        kicker="CLASSIC TABLE · 房间号"
        title={data.roomID}
        status={<Deadline deadline={turnDeadline} />}
        actions={<>
          <ActionButton aria-label="股价速查" title="股价速查"
            onClick={() => setPriceTier(0)}><Wallet size={17} />
            <span data-game-mobile-action-label>股价速查</span></ActionButton>
          {end && <ActionButton aria-label="查看本局结算" title="查看结算"
            onClick={() => setPanel('results')}><Trophy size={17} />
            <span data-game-mobile-action-label>查看结算</span></ActionButton>}
        </>}
      />
      <div className={styles.heading} data-game-desktop-topbar><div className={styles.headingIdentity}><button type="button" className={styles.backButton} aria-label="离开当前对局" onClick={onLeave}><ArrowLeft size={19} /></button><div><small>CLASSIC TABLE · 房间号</small><h1>{data.roomID}</h1></div></div>
      <div className={styles.headingTools}><Deadline deadline={turnDeadline} /><ActionButton onClick={() => setPriceTier(0)}>股价速查</ActionButton>
      {end && !isMobile && <ActionButton onClick={() => setPanel('results')}>查看结算</ActionButton>}
      {!isMobile && endVoteControl}
      <div className={styles.cash}><Wallet size={18} /><span><small>可用现金</small><b><AnimatedValue value={data.playerData.money} formatter={money} /></b></span></div></div></div>
      <PhaseBanner data={data} interaction={interaction}
        action={!end ? isMobile ? endVoteControl
          : <PhaseAction data={data} interaction={interaction} pending={!!session.pending} buttonOnly /> : undefined} />
      {isMobile ? <PlayMobile {...props} /> : <PlayDesktop {...props} />}
    </div>
    <TradeDialog interaction={interaction} session={session} />
    {panel === 'zoom' && <ResponsiveDialog title="城市棋盘 · 放大查看" wide onClose={() => setPanel(undefined)} footer={<ActionButton onClick={() => setPanel(undefined)}>返回操作区确认</ActionButton>}>
      <Board {...boardProps} zoom />
    </ResponsiveDialog>}
    {panel === 'activity' && <ResponsiveDialog title="城市动态" onClose={() => setPanel(undefined)}><Activity items={session.activity} /></ResponsiveDialog>}
    {panel === 'finish' && showEndVote && <EndGameDialog data={data} enabled={interaction.enabled}
      pending={endVotePending} onClose={() => setPanel(undefined)} onVote={submitEndVote} />}
    {priceTier != null && <StockPrices data={data} initialTier={priceTier} onClose={() => setPriceTier(undefined)} />}
    {toast && <div className={styles.toast} role="status" aria-live="polite"><span />{toast.text}</div>}
  </>;
}
