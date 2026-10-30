import {
  useEffect,
  useState,
  type CSSProperties,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Dices,
  Flag,
  History,
  Map,
  Mountain,
  Settings2,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameMobileTopbar } from '@/components/GameUI/GameMobileTopbar';
import { PlayerAvatar } from '../../components/AppShell';
import { Dialog } from '../../components/Dialog';
import type { CantStopSession } from '../../hooks/useCantStopSession';
import {
  COLUMNS,
  TARGET_COLUMNS,
  actionSourceLabel,
  actionSummary,
  bustRiskPercent,
  claimedCount,
  columnHeight,
  dicePairText,
  formatColumns,
  optionDeltaText,
  ownerAt,
  peakColumns,
  playerColor,
  playerSymbol,
  progressAt,
  savedProgress,
  savedStepCount,
  statusTitle,
  turnGain,
  type Progress,
} from '../../model/board';
import {
  isChoosing,
  isDeciding,
  isMyTurn,
  isTransition,
} from '../../model/selectors';
import {
  playerLabel,
  playerName,
  turnKey,
  type GameSnapshot,
} from '../../model/session';
import { Results } from '../Results';

function useCountdown(deadline?: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  if (!deadline) return '';
  return `${Math.ceil(Math.max(0, new Date(deadline).getTime() - now) / 1000)}s`;
}

function Dice({
  value,
  small = false,
  muted = false,
}: {
  value: number;
  small?: boolean;
  muted?: boolean;
}) {
  const dots: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  return <span className={`cs-die ${small ? 'small' : ''} ${muted ? 'muted' : ''}`}
    role="img" aria-label={`${value || '?'} 点骰子`}>
    <svg viewBox="0 0 30 30" aria-hidden="true">
      {(dots[value] || []).map(index => <circle key={index}
        cx={7 + (index % 3) * 8} cy={7 + Math.floor(index / 3) * 8} r="2.6" />)}
    </svg>
  </span>;
}

function PlayerBar({ data }: { data: GameSnapshot }) {
  return <section className={`cs-players-row players-${data.roomData.playerOrder.length}`}>
    {data.roomData.playerOrder.map(id => {
      const player = data.roomData.players[id];
      const seat = player?.seatIndex ?? 0;
      const active = id === data.roomData.currentPlayer;
      const self = id === data.playerId;
      const style = { '--player': playerColor(seat) } as CSSProperties;
      return <article key={id} style={style}
        className={`cs-player-chip ${active ? 'current' : ''} ${self ? 'self' : ''}`}>
        <PlayerAvatar name={playerName(id, data.roomData.players)}
          avatar={player?.avatar} ai={player?.ai} size={32} />
        <div className="cs-player-name"><b>{playerLabel(id, data.roomData.players)}</b>
          <small>{data.result?.winnerID === id ? '本局登顶者'
            : active ? '本回合行动' : player?.online || player?.ai ? '等待回合' : '暂时离线'}</small></div>
        <span className="cs-flag-count"><Flag size={13} />
          <b>{claimedCount(data, id)}</b><small>/{TARGET_COLUMNS}</small></span>
      </article>;
    })}
  </section>;
}

function Board({
  data,
  preview,
  compact = false,
}: {
  data: GameSnapshot;
  preview?: Progress;
  compact?: boolean;
}) {
  const activeID = data.roomData.currentPlayer || data.playerId;
  const activePlayer = data.roomData.players[activeID];
  const activeSeat = activePlayer?.seatIndex ?? 0;
  const activeSaved = savedProgress(data.playerData[activeID]);
  return <section className={`cs-route-board ${compact ? 'compact' : ''}`}
    role="img"
    aria-label={`十一条路线棋盘，当前玩家 ${playerLabel(activeID, data.roomData.players)}`}>
    <header><span>THE ELEVEN TRAILS</span>
      <span>率先占领 <b>{TARGET_COLUMNS}</b> 条路线</span></header>
    <div className="cs-mountain-lines" aria-hidden="true">
      <svg viewBox="0 0 950 420" preserveAspectRatio="none">
        {[0, 1, 2, 3, 4, 5, 6].map(index => <path key={index}
          d={`M ${-180 + index * 25} 410 Q 260 ${420 - index * 18} 400 ${100 + index * 18} Q 470 ${-20 + index * 22} 560 ${115 + index * 20} Q 690 ${350 + index * 2} ${1080 - index * 20} 410`}
          fill="none" stroke="currentColor" />)}
      </svg>
    </div>
    <div className="cs-columns">{COLUMNS.map(column => {
      const owner = ownerAt(data.roomData.claimedBy, column);
      const ownerSeat = data.roomData.players[owner]?.seatIndex ?? activeSeat;
      const runner = progressAt(data.roomData.runners, column);
      const ghost = progressAt(preview, column);
      const hasRunner = runner > 0;
      const hasGhost = ghost > 0 && ghost !== runner;
      const style = {
        '--player': owner ? playerColor(ownerSeat) : playerColor(activeSeat),
      } as CSSProperties;
      return <div className={[
        'cs-column',
        hasRunner ? 'active' : '',
        owner ? 'closed' : '',
        hasGhost ? 'preview' : '',
      ].filter(Boolean).join(' ')}
        key={column} style={style}>
        <div className="cs-column-cells"><div className="cs-summit">
          <Flag size={17} fill={owner ? 'currentColor' : 'none'} />
          {owner && <span>{playerSymbol(ownerSeat)}</span>}</div>
          {Array.from({ length: columnHeight(column) }, (_, index) =>
            columnHeight(column) - index).map(step => {
            const temporary = hasRunner
              && step <= runner
              && step > progressAt(activeSaved, column);
            const ghostStep = hasGhost && ghost === step;
            return <div key={step} className={[
              'cs-step',
              temporary ? 'temporary' : '',
              ghostStep ? 'ghost' : '',
            ].filter(Boolean).join(' ')}>
              <span className="cs-saved-pins">{data.roomData.playerOrder.map(playerID => {
                const player = data.roomData.players[playerID];
                const seat = player?.seatIndex ?? 0;
                return progressAt(savedProgress(data.playerData[playerID]), column) === step
                  ? <i key={playerID}
                    title={`${playerLabel(playerID, data.roomData.players)}：${column}号 ${step}/${columnHeight(column)}`}
                    style={{ background: playerColor(seat) }}>
                    {playerSymbol(seat)}</i>
                  : null;
              })}</span>
              {runner === step && <span className="cs-runner" title="本回合临时进度，尚未保存">▲</span>}
              {ghostStep && <span className="cs-ghost-pin">+</span>}
            </div>;
          })}</div>
        <b>{column}</b><small>{owner ? '已占领' : `${columnHeight(column)} 阶`}</small>
      </div>;
    })}</div>
    <footer><span><i className="cs-legend-saved" />已保存</span>
      <span><i className="cs-legend-runner">▲</i>本回合 · 未保存</span>
      <span><i className="cs-legend-ghost">+</i>预选落点</span></footer>
  </section>;
}

function DiceTray({ data }: { data: GameSnapshot }) {
  const dice = data.roomData.dice.length ? data.roomData.dice : [0, 0, 0, 0];
  return <section className="cs-dice-tray">
    <div>{dice.map((value, index) => <span key={index}>
      <Dice value={value} muted={!value} /><small>{String.fromCharCode(65 + index)}</small>
    </span>)}</div>
    <p>{data.roomData.gameStatus === 'roll'
      ? '点击行动按钮，掷出四枚骰子'
      : data.roomData.gameStatus === 'choose'
        ? '四枚骰子，两两配对'
        : '这一次的点数已经处理'}</p>
  </section>;
}

function DecisionPanel({
  data,
  enabled,
  selectedActionID,
  setSelectedActionID,
  setHoveredActionID,
  onRoll,
  onAdvance,
  onBank,
  onNextTurn,
}: {
  data: GameSnapshot;
  enabled: boolean;
  selectedActionID?: string;
  setSelectedActionID: (value?: string) => void;
  setHoveredActionID: (value?: string) => void;
  onRoll: () => void;
  onAdvance: () => void;
  onBank: () => void;
  onNextTurn: () => void;
}) {
  const phase = data.roomData.gameStatus;
  const activeID = data.roomData.currentPlayer;
  const activeName = playerLabel(activeID, data.roomData.players);
  const selfTurn = isMyTurn(data);
  const canAct = enabled && selfTurn;
  const gain = turnGain(data);
  const peaks = peakColumns(data);
  const risk = bustRiskPercent(data);
  const last = data.roomData.lastAction;
  const transitionCountdown = useCountdown(data.roomData.turnTransitionDeadline);
  if (phase === 'waiting') return <section className="cs-decision-panel">
    <header><span className="cs-eyebrow">SYNCING TABLE</span>
      <h2>所有人正在抵达山脚。</h2>
      <p>连接完成后，服务端会统一发出第一回合。</p></header>
    <div className="cs-waiting"><Mountain size={46} /><span>· · ·</span></div>
  </section>;
  if (phase === 'roll') return <section className="cs-decision-panel phase-roll">
    <header><span className="cs-eyebrow">{selfTurn ? 'YOUR NEXT MOVE' : 'WAITING FOR ROLL'}</span>
      <h2>{selfTurn ? '轮到你，出发吧。' : `等待 ${activeName} 掷骰。`}</h2>
      <p>本回合最多启用三条路线。掷出后必须选择一个合法配对。</p></header>
    <DiceTray data={data} />
    <div className="cs-three-runners"><span>▲</span><span>▲</span><span>▲</span></div>
    <ActionButton variant="primary" disabled={!canAct} data-click-sound="game-confirm" onClick={onRoll}>
      <Dices size={18} />掷出四枚骰子</ActionButton>
  </section>;
  if (phase === 'choose') return <section className="cs-decision-panel phase-choose">
    <header><span className="cs-eyebrow">{selfTurn ? 'CHOOSE A PAIRING' : 'CHOOSING PAIRING'}</span>
      <h2>{selfTurn ? '选一组，向上走。' : `等待 ${activeName} 选择路线。`}</h2>
      <p>能走的点数都会自动推进；若配对有不同落点，服务端已经拆成可选方案。</p></header>
    <DiceTray data={data} />
    <div className="cs-pairings">{data.roomData.pairingOptions.map((option, index) =>
      <button type="button" key={option.actionID}
        className={selectedActionID === option.actionID ? 'selected' : ''}
        disabled={!canAct}
        aria-pressed={selectedActionID === option.actionID}
        aria-label={`配对 ${index + 1}：${option.sums.join(' 和 ')}`}
        onMouseEnter={() => setHoveredActionID(option.actionID)}
        onMouseLeave={() => setHoveredActionID(undefined)}
        onClick={() => setSelectedActionID(option.actionID)}>
        <small>0{index + 1}</small><div><b>{option.sums[0]}</b>
          <span>{option.sums[0] === option.sums[1] ? '×2' : '+'}</span>
          {option.sums[0] !== option.sums[1] && <b>{option.sums[1]}</b>}
          <em>{dicePairText(option, data.roomData.dice)}</em></div>
        <strong>{optionDeltaText(option) || '无法推进'}
          {selectedActionID === option.actionID
            ? <CheckCircle2 size={15} /> : <i />}</strong>
      </button>)}</div>
    {!data.roomData.pairingOptions.length && <div className="cs-risk-card">
      <TriangleAlert size={18} /><span>没有合法路线，服务端会结算为失手。</span></div>}
    <ActionButton variant="primary" disabled={!canAct || !selectedActionID}
      data-click-sound="game-place" onClick={onAdvance}>沿这组前进<ArrowRight size={16} /></ActionButton>
  </section>;
  if (phase === 'decide') return <section className="cs-decision-panel phase-decide">
    <header><span className="cs-eyebrow">{selfTurn ? 'PRESS OR STOP' : 'WAITING FOR DECISION'}</span>
      <h2>{peaks.length ? '到了山顶，记得收手。' : '再高一点，还是收手？'}</h2>
      <p>{selfTurn ? '继续是勇气，停下也是选择。' : `等待 ${activeName} 决定是否继续。`}</p></header>
    <DiceTray data={data} />
    <div className={`cs-risk-card ${peaks.length ? 'peak' : ''}`}>
      <span>{peaks.length ? <Flag size={17} /> : <Mountain size={17} />}
        {peaks.length ? '待锁定山顶' : '本回合背包'}</span>
      <b>{peaks.length ? formatColumns(peaks) : `+${gain} 步`}</b>
      <p>{peaks.length
        ? '收手后才占领；继续掷骰仍可能全部失去。'
        : '再掷若无法推进，这些步数会全部退回。'}</p>
      <div><small>下一掷失手风险</small><strong>{risk}%</strong>
        <i><em style={{ width: `${risk}%` }} /></i></div>
    </div>
    <div className="cs-decision-actions">
      <ActionButton variant="primary" disabled={!canAct} data-click-sound="game-confirm" onClick={onRoll}>
        <Dices size={16} />继续掷骰</ActionButton>
      <ActionButton disabled={!canAct || gain <= 0} data-click-sound="game-confirm" onClick={onBank}>
        <ShieldCheck size={16} />{peaks.length ? '收手，锁定山顶' : '收手，保存进度'}</ActionButton>
    </div>
  </section>;
  if (isTransition(data)) return <section className={`cs-decision-panel phase-${phase}`}>
    <header><span className="cs-eyebrow">{phase === 'bust' ? 'TAKE A BREATH' : 'SAFELY BANKED'}</span>
      <h2>{phase === 'bust' ? `退回 ${data.roomData.lostGain} 步。` : `保存 ${last?.gain ?? gain} 步。`}</h2>
      <p>{last ? actionSummary(last, id => playerLabel(id, data.roomData.players)) : statusTitle(data)}</p></header>
    <div className="cs-turn-ended">{phase === 'bust'
      ? <TriangleAlert size={42} /> : <ShieldCheck size={42} />}
      <p>接下来轮到 {playerLabel(data.roomData.nextPlayer, data.roomData.players)}。</p>
      <ActionButton variant="primary" disabled={!enabled} onClick={onNextTurn}>
        下一位出发<ArrowRight size={16} /></ActionButton>
      {transitionCountdown && <small>自动推进 {transitionCountdown}</small>}</div>
  </section>;
  return <section className="cs-decision-panel"><header>
    <span className="cs-eyebrow">GAME COMPLETE</span><h2>本局已经结束。</h2>
    <p>可以查看终局棋盘或返回结算页。</p></header></section>;
}

function RunnerSlots({ data }: { data: GameSnapshot }) {
  const columns = Object.keys(data.roomData.runners).map(Number).sort((a, b) => a - b);
  return <div className="cs-runner-slots"><span>本回合路线</span>
    {[0, 1, 2].map(index => {
      const column = columns[index];
      return <span key={index} className={column ? 'used' : ''}>
        <b>▲</b>{column ? `${column} 号` : '空位'}</span>;
    })}</div>;
}

function ActivityStrip({
  data,
  onOpen,
}: {
  data: GameSnapshot;
  onOpen: () => void;
}) {
  const last = data.roomData.lastAction;
  return <button className="cs-activity" type="button"
    aria-label="查看最近记录" onClick={onOpen}>
    <History size={15} /><span>{last
      ? actionSummary(last, id => playerLabel(id, data.roomData.players))
      : '牌桌刚刚开始，等待第一掷。'}</span>
    {last && <b>{actionSourceLabel(last)}<ArrowRight size={12} /></b>}
  </button>;
}

export function Play({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending,
}: {
  session: CantStopSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch: () => void;
  startNextMatchPending: boolean;
}) {
  const [selectedActionID, setSelectedActionID] = useState<string>();
  const [hoveredActionID, setHoveredActionID] = useState<string>();
  const [panel, setPanel] = useState<'rules' | 'scores' | 'log' | 'routes'>();
  const [reviewing, setReviewing] = useState(false);
  const enabled = session.connection.status === 'connected' && !session.pending;
  const countdown = useCountdown(data.roomData.turnDeadline);
  const key = turnKey(data);
  const selectedOption = data.roomData.pairingOptions.find(option =>
    option.actionID === selectedActionID);
  const hoveredOption = data.roomData.pairingOptions.find(option =>
    option.actionID === hoveredActionID);
  const preview = selectedOption?.runnerPositions
    ?? hoveredOption?.runnerPositions;
  const phase = data.roomData.gameStatus;
  const activeName = playerLabel(data.roomData.currentPlayer, data.roomData.players);

  useEffect(() => {
    setSelectedActionID(undefined);
    setHoveredActionID(undefined);
  }, [key]);

  if (phase === 'end' && !reviewing) {
    return <Results data={data} onExit={onLeave}
      onReview={() => setReviewing(true)} onRematch={onStartNextMatch}
      enabled={enabled} rematchPending={startNextMatchPending} />;
  }

  const submitAdvance = () => {
    if (selectedActionID) session.submit('game_advance', { actionID: selectedActionID });
  };
  const latestLog = [...data.roomData.activityLog].slice(-8).reverse();
  const ranked = [...data.roomData.playerOrder].sort((a, b) =>
    claimedCount(data, b) - claimedCount(data, a)
      || savedStepCount(data.playerData[b]) - savedStepCount(data.playerData[a])
      || (data.roomData.players[a]?.seatIndex ?? 0)
        - (data.roomData.players[b]?.seatIndex ?? 0));

  return <div className="cs-play" data-testid="cantstop-play">
    <GameMobileTopbar
      onBack={onLeave}
      backLabel="离开牌桌"
      kicker={`CAN'T STOP · 第 ${data.roomData.turnNumber || 1} 回合`}
      title={phase === 'end' ? '终局棋盘' : statusTitle(data)}
      status={countdown}
      actions={<>
        <button type="button" aria-label="规则速览" title="规则速览"
          onClick={() => setPanel('rules')}><BookOpen size={18} /></button>
        <button type="button" aria-label="牌桌菜单" title="牌桌菜单"
          onClick={() => setPanel('routes')}><Settings2 size={18} /></button>
      </>}
    />
    <header className="cs-game-header" data-game-desktop-topbar>
      <button type="button" aria-label="离开牌桌" onClick={onLeave}>
        <ArrowLeft size={20} /></button>
      <div><small>CAN&apos;T STOP · ONLINE TABLE</small>
        <h1>{phase === 'end' ? '终局棋盘' : statusTitle(data)}
          <span>·</span>{data.roomData.turnNumber || 1}</h1></div>
      {reviewing && <button className="cs-review-banner" type="button"
        onClick={() => setReviewing(false)}>正在查看终局棋盘 · 返回结算
        <ArrowRight size={14} /></button>}
      <span className="cs-game-mode"><Map size={15} />3 条路线登顶获胜</span>
      <b className="cs-game-timer">{countdown}</b>
      <button type="button" aria-label="规则速览" onClick={() => setPanel('rules')}>
        <BookOpen size={18} /></button>
      <button type="button" aria-label="牌桌菜单" onClick={() => setPanel('routes')}>
        <Settings2 size={18} /></button>
    </header>

    {session.feedback && <div className="cs-game-toast">{session.feedback}</div>}
    <main className="cs-game-layout"><section className="cs-board-side">
      <PlayerBar data={data} />
      <Board data={data} preview={preview} />
      <div className="cs-under-board"><RunnerSlots data={data} />
        <span>{isChoosing(data) ? '选择配对后，棋盘会预览落点'
          : isDeciding(data) ? `当前行动：${activeName}` : '服务端权威同步中'}</span></div>
      <ActivityStrip data={data} onOpen={() => setPanel('log')} />
    </section>
    <aside className="cs-action-side">
      <DecisionPanel data={data} enabled={enabled}
        selectedActionID={selectedActionID}
        setSelectedActionID={setSelectedActionID}
        setHoveredActionID={setHoveredActionID}
        onRoll={() => session.submit('game_roll_dice')}
        onAdvance={submitAdvance}
        onBank={() => session.submit('game_bank')}
        onNextTurn={() => session.submit('game_next_turn')} />
      <section className="cs-event-panel"><header><h3>最近记录</h3>
        <button type="button" onClick={() => setPanel('log')}>
          <History size={15} /></button></header>
        {latestLog.length ? latestLog.slice(0, 4).map(action =>
          <article key={action.id}><span>{action.kind === 'roll' ? <Dices size={16} />
            : action.kind === 'bank' ? <ShieldCheck size={16} />
              : action.kind === 'bust' ? <TriangleAlert size={16} /> : <Flag size={16} />}</span>
            <div><p>{actionSummary(action, id => playerLabel(id, data.roomData.players))}</p>
              <small>{actionSourceLabel(action)}</small></div>
            {!!action.gain && <b>{action.gain > 0 ? `+${action.gain}` : action.gain}</b>}</article>)
          : <div className="cs-event-empty"><CircleHelp size={18} />
            <p>行动记录会在第一掷之后出现。</p></div>}
      </section>
    </aside></main>

    <footer className="cs-mobile-dock">
      <div><b>{statusTitle(data)}</b>
        <small>{isMyTurn(data) ? '轮到你行动' : `等待 ${activeName || '玩家'}`}</small></div>
      {phase === 'roll' && <ActionButton variant="primary"
        disabled={!enabled || !isMyTurn(data)} data-click-sound="game-confirm"
        onClick={() => session.submit('game_roll_dice')}>
        掷骰<Dices size={15} /></ActionButton>}
      {phase === 'choose' && <ActionButton variant="primary"
        disabled={!enabled || !isMyTurn(data) || !selectedActionID}
        data-click-sound="game-place" onClick={submitAdvance}>前进<ArrowRight size={14} /></ActionButton>}
      {phase === 'decide' && <><ActionButton disabled={!enabled || !isMyTurn(data)}
        data-click-sound="game-confirm"
        onClick={() => session.submit('game_bank')}>收手<ShieldCheck size={14} /></ActionButton>
        <ActionButton variant="primary" disabled={!enabled || !isMyTurn(data)}
          data-click-sound="game-confirm"
          onClick={() => session.submit('game_roll_dice')}>再掷<Dices size={14} /></ActionButton></>}
      {isTransition(data) && <ActionButton variant="primary" disabled={!enabled}
        onClick={() => session.submit('game_next_turn')}>下一位<ArrowRight size={14} /></ActionButton>}
    </footer>

    {panel === 'scores' && <Dialog title="登顶进度" eyebrow="SCOREBOARD"
      onClose={() => setPanel(undefined)}>
      <div className="cs-score-dialog">{ranked.map(id => <div key={id}>
        <PlayerAvatar name={playerName(id, data.roomData.players)}
          avatar={data.roomData.players[id]?.avatar}
          ai={data.roomData.players[id]?.ai} size={32} />
        <b>{playerLabel(id, data.roomData.players)}</b>
        <span>{claimedCount(data, id)} 条路线</span>
        <span>{savedStepCount(data.playerData[id])} 步</span></div>)}</div>
    </Dialog>}
    {panel === 'log' && <Dialog title="回合记录" eyebrow="ACTION LOG"
      onClose={() => setPanel(undefined)}>
      <ol className="cs-log-list">{latestLog.map(action =>
        <li key={action.id}><span>{action.kind === 'roll' ? <Dices size={16} />
          : action.kind === 'bank' ? <ShieldCheck size={16} />
            : action.kind === 'bust' ? <TriangleAlert size={16} /> : <Flag size={16} />}</span>
          <div><p>{actionSummary(action, id => playerLabel(id, data.roomData.players))}</p>
            <small>第 {action.turnNumber} 回合 · 第 {action.rollNumber} 掷 · {actionSourceLabel(action)}</small></div>
          {!!action.gain && <b>{action.gain > 0 ? `+${action.gain}` : action.gain}</b>}</li>)}</ol>
    </Dialog>}
    {panel === 'routes' && <Dialog title="十一条路线" eyebrow="TRAIL MAP"
      onClose={() => setPanel(undefined)}>
      <div className="cs-route-dialog">{COLUMNS.map(column => {
        const owner = ownerAt(data.roomData.claimedBy, column);
        return <div key={column}><b>{column}</b>
          <span>{columnHeight(column)} 阶</span>
          <small>{owner ? `${playerLabel(owner, data.roomData.players)} 已占领`
            : progressAt(data.roomData.runners, column)
              ? `临时 ${progressAt(data.roomData.runners, column)} 阶`
              : '开放中'}</small></div>;
      })}</div>
    </Dialog>}
    {panel === 'rules' && <Dialog title="一分钟，读懂这局"
      eyebrow="QUICK RULES" onClose={() => setPanel(undefined)}>
      <div className="cs-quick-rules">
        {[
          ['01', '四骰，两组', '把四枚骰子两两配对，每组点数和对应一条路线。'],
          ['02', '最多三条路', '每回合最多使用三位临时攀登者，不能开启第四条新路线。'],
          ['03', '收手才保存', '继续掷骰若无路可走，只失去本回合临时进度。'],
          ['04', '三列即获胜', '临时到顶后收手才封列，率先占领三列获胜。'],
        ].map(([no, title, text]) => <div key={no}><span>{no}</span>
          <section><b>{title}</b><p>{text}</p></section></div>)}
      </div>
    </Dialog>}
  </div>;
}
