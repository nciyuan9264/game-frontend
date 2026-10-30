import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CircleHelp, Eye, Hash, ShieldCheck } from 'lucide-react';
import TurnCountdown from '@/components/TurnCountdown';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameMobileTopbar } from '@/components/GameUI/GameMobileTopbar';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { GameCanvas, type GameCanvasHandle } from '../../components/GameCanvas';
import type { DavinciSession } from '../../hooks/useDavinciSession';
import { useInitialHandSetup } from '../../hooks/useInitialHandSetup';
import type { Card } from '../../model/types';
import { lastGuess, phaseCopy } from '../../model/selectors';
import type { GameSnapshot } from '../../model/session';
import rootStyles from '../../styles/root.module.less';
import { Results } from '../Results';
import styles from './index.module.less';

const ruleSections = [
  ['目标与牌序', ['率先公开对手全部密码牌的一方获胜。', '数字从小到大排列；相同数字中，黑牌排在白牌之前。']],
  ['回合流程', ['先从公共牌池抽一张牌，再猜测对手一张暗牌。', '猜对后可以继续猜，也可以把新牌放回并结束回合。']],
  ['猜错代价', ['目标牌不会公开真实数字。', '本回合抽到的新牌会公开并放回你的序列，然后轮到对手。']],
  ['JOKER', ['JOKER 显示为横杠，不受数字排序限制。', '开局有最多 15 秒设置位置；超时后默认放在末尾。']],
] as const;

export function Play({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending = false,
}: {
  session: DavinciSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch?: () => Promise<boolean>;
  startNextMatchPending?: boolean;
}) {
  const [selectedGuess, setSelectedGuess] = useState<Card>();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [showResults, setShowResults] = useState(data.roomData.gameStatus === 'end');
  const canvasRef = useRef<GameCanvasHandle>(null);
  const lastActionKey = useRef('');
  const initializing = data.roomData.gameStatus === 'initialize';
  const initialHandReady = data.cardData.initialHandReady === true;
  const initialHand = useInitialHandSetup({
    matchID: data.matchID,
    status: data.roomData.gameStatus,
    cards: data.cardData.self,
    ready: initialHandReady,
  });
  const playerTurn = data.roomData.currentPlayer === data.playerId;
  const connected = session.connection.status === 'connected';
  const interactive = !initializing && playerTurn && !session.pending && connected;
  const initializationInteractive = initializing && !initialHandReady && !session.pending && connected;
  const [phaseTitle, phaseDescription] = phaseCopy(data);
  const guess = useMemo(() => lastGuess(data), [data]);

  useEffect(() => {
    if (data.roomData.gameStatus === 'end') setShowResults(true);
  }, [data.roomData.gameStatus]);
  useEffect(() => {
    if (!guess) return;
    const key = `${guess.actor}:${guess.target}:${guess.value}:${guess.correct}`;
    if (!lastActionKey.current) {
      lastActionKey.current = key;
      return;
    }
    if (lastActionKey.current === key) return;
    lastActionKey.current = key;
    const cardID = data.roomData.lastData?.payload?.targetCardID;
    if (cardID) canvasRef.current?.flashTileFeedback(cardID, guess.correct);
  }, [data.roomData.lastData?.payload?.targetCardID, guess]);

  const handleTile = useCallback((tileID: string) => {
    if (!interactive) return;
    const opponent = data.cardData.opponents.find(card => card.id === tileID);
    if (opponent && (data.roomData.gameStatus === 'guessCard' || data.roomData.gameStatus === 'setCard')) {
      setSelectedGuess(opponent);
      return;
    }
    if (data.roomData.boardCards[tileID] && data.roomData.gameStatus === 'getCard') {
      session.submit('game_get_card', { id: tileID });
    }
  }, [data, interactive, session]);

  if (data.roomData.gameStatus === 'end' && showResults) {
    return <Results session={session} data={data} onViewBoard={() => setShowResults(false)} onLeave={onLeave}
      onRestart={onStartNextMatch} restarting={startNextMatchPending} />;
  }

  const initializationCopy = initialHandReady
    ? '牌序已确认，等待对手'
    : initialHand.activeJoker
      ? `放置${initialHand.activeJoker.color === 0 ? '白色' : '黑色'} JOKER`
      : '确认当前初始牌序';

  return <div className={`${styles.play} ${initializing ? styles.initializing : ''}`}
    data-testid="davinci-play">
    <GameMobileTopbar
      onBack={onLeave}
      backLabel="离开对局"
      kicker={`ROOM ${data.roomID}`}
      title={phaseTitle}
      status={data.roomData.turnDeadline
        && (initializing || playerTurn) && data.roomData.gameStatus !== 'end'
        ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
        : '--'}
      actions={<>
        {data.roomData.gameStatus === 'end' && <ActionButton
          aria-label="打开终局结算" title="查看结算"
          onClick={() => setShowResults(true)}><Eye size={16} />
          <span data-game-mobile-action-label>查看结算</span></ActionButton>}
        <button type="button" className={styles.ruleButton}
          aria-label="查看游戏规则" title="查看游戏规则"
          onClick={() => setRulesOpen(true)}><CircleHelp size={18} /></button>
      </>}
    />
    <header className={`${styles.topbar} ${data.roomData.gameStatus === 'end' ? styles.endedTopbar : ''}`}
      data-game-desktop-topbar>
      <div className={styles.roomTools}><button type="button" aria-label="离开对局" onClick={onLeave}><ArrowLeft size={18} /></button>
        <span><small>ROOM</small><b>{data.roomID}</b></span></div>
      <div className={`${styles.phase} ${playerTurn ? styles.myTurn : ''}`} aria-live="polite">
        <i /><span><strong>{phaseTitle}</strong><small>{phaseDescription}</small></span>
      </div>
      <div className={styles.topActions}>
        {data.roomData.gameStatus === 'end' && <ActionButton className={styles.resultsButton}
          aria-label="打开终局结算" title="查看结算" onClick={() => setShowResults(true)}>
          <Eye size={15} /><span>查看结算</span></ActionButton>}
        <button type="button" className={styles.ruleButton} aria-label="查看游戏规则" onClick={() => setRulesOpen(true)}><CircleHelp size={18} /></button>
        <span className={styles.timer}><small>TIME</small>{data.roomData.turnDeadline
          && (initializing || playerTurn) && data.roomData.gameStatus !== 'end'
          ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
          : <b>--</b>}</span>
      </div>
    </header>
    <div className={`${styles.activity} ${guess ? guess.correct ? styles.correct : styles.wrong : ''}`} aria-live="polite">
      {initializing ? <><ShieldCheck size={14} /><span>{initializationCopy}</span></>
        : guess ? <><b>{guess.correct ? '猜对' : '猜错'}</b><span>{guess.actor === data.playerId ? '你' : '对手'}猜测 {guess.value}，{guess.correct ? '目标牌已公开' : '回合即将交换'}</span></>
        : <><Hash size={14} /><span>{phaseDescription}</span></>}
    </div>
    <main className={styles.board}>
      <div className={styles.boardLabel + ' ' + styles.opponentLabel}><span>对手密码</span><small>{data.cardData.opponents.filter(card => !card.isRevealed).length} 张暗牌</small></div>
      <GameCanvas ref={canvasRef} playerHand={initializing ? initialHand.cards : data.cardData.self}
        opponentHand={data.cardData.opponents}
        pool={Object.values(data.roomData.boardCards)} isPlayerTurn={interactive || initializationInteractive}
        gameStatus={data.roomData.gameStatus} onTileClick={handleTile}
        onSelectInsertPosition={(index, tileID) => {
          if (initializing) {
            initialHand.placeJoker(index, tileID);
          } else if (tileID) {
            session.submit('game_set_card', { id: tileID, index });
          }
        }} />
      <div className={styles.boardLabel + ' ' + styles.selfLabel}><span>我的密码</span><small>{initialHand.cards.filter(card => !card.isRevealed).length} 张暗牌</small></div>
    </main>
    {initializing ? <footer className={`${styles.legend} ${styles.initializationBar}`}>
      <span><i className={styles.ivory} />白牌</span><span><i className={styles.graphite} />黑牌</span>
      <em>{session.pending ? '等待服务端确认…' : initializationCopy}</em>
      {!initialHandReady && <ActionButton variant="primary"
        disabled={!initialHand.canConfirm || !!session.pending || !connected}
        data-click-sound="game-place"
        onClick={() => session.submit('game_initialize_hand', {
          jokerPlacements: initialHand.jokerPlacements,
        })}>
        <ShieldCheck size={14} />确认牌序
      </ActionButton>}
    </footer> : <footer className={styles.legend}><span><i className={styles.ivory} />白牌</span><span><i className={styles.graphite} />黑牌</span>
      <span><i className={styles.green} />可操作</span><em>{session.pending ? '等待服务端确认…' : playerTurn ? '你的回合' : '对手回合'}</em></footer>}

    {selectedGuess && <ResponsiveDialog title="猜测这张密码牌" eyebrow="MAKE YOUR DEDUCTION" themeClassName={rootStyles.root}
      onClose={() => setSelectedGuess(undefined)} footer={<ActionButton onClick={() => setSelectedGuess(undefined)}>取消</ActionButton>}>
      <div className={styles.guessDialog}><p>选择你认为这张{selectedGuess.color === 0 ? '白牌' : '黑牌'}的数字。提交后不能撤回。</p>
        <div>{Array.from({ length: 12 }, (_, value) => <button type="button" key={value}
          data-click-sound="game-confirm"
          onClick={() => { session.submit('game_guess_card', { id: selectedGuess.id, num: value }); setSelectedGuess(undefined); }}>{value}</button>)}
          <button type="button" className={styles.joker} data-click-sound="game-confirm" onClick={() => {
            session.submit('game_guess_card', { id: selectedGuess.id, num: -1 });
            setSelectedGuess(undefined);
          }}>JOKER</button></div></div>
    </ResponsiveDialog>}
    {rulesOpen && <ResponsiveDialog title="达芬奇密码规则" eyebrow="CIPHER PROTOCOL" wide themeClassName={rootStyles.root}
      onClose={() => setRulesOpen(false)} footer={<ActionButton variant="primary" onClick={() => setRulesOpen(false)}>知道了</ActionButton>}>
      <div className={styles.rules}><header><ShieldCheck size={25} /><div><strong>观察、排除、适时收手。</strong><p>所有合法操作与牌序由服务端校验。</p></div></header>
        <div>{ruleSections.map(([title, items], index) => <section key={title}><span>0{index + 1}</span><h3>{title}</h3><ul>{items.map(item => <li key={item}>{item}</li>)}</ul></section>)}</div></div>
    </ResponsiveDialog>}
  </div>;
}
