import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Flag,
  Info,
  Layers,
  MoreHorizontal,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Swords,
  Trophy,
  X,
} from 'lucide-react';
import TurnCountdown from '@/components/TurnCountdown';
import { GameMobileTopbar } from '@/components/GameUI/GameMobileTopbar';
import {
  ACTION_NAMES,
  UNITS,
  findUnit,
  planText,
  rosterOf,
  score,
  type Action,
  type Game,
  type Plan,
  type Side,
  type UnitId,
} from '../../model';
import { Board } from '../../components/Board';
import {
  ACTION_GROUPS,
  ACTION_HINTS,
  ACTION_ICONS,
  CommandAction,
  FactionPanel,
  HandCoins,
} from '../../components/BattleHud';
import {
  Brand,
  Coin,
  Crest,
  Eyebrow,
  Modal,
  SourceLink,
  TroopArt,
} from '../../visuals';

interface Props {
  game: Game;
  roomID: string;
  roomName: string;
  interactive?: boolean;
  commandPending?: boolean;
  connectionNotice?: string;
  onAction?: (actionID: string) => boolean;
  onResign?: () => boolean;
  onLeave?: () => void;
  onRematch?: () => void;
  rematchPending?: boolean;
  revealHands?: boolean;
  mobileHeading?: ReactNode;
}

const actionPath = (plan: Plan, candidates: Plan[]) => {
  const values: string[] = [];
  const distinctFrom = new Set(candidates.map(value => value.from).filter(Boolean));
  if (distinctFrom.size > 1 && plan.from) values.push(plan.from);
  if (plan.action === 'deploy' && plan.to) values.push(plan.to);
  if ((plan.action === 'bolster' || plan.action === 'control') && plan.from) values.push(plan.from);
  if (plan.action === 'move' && plan.to) values.push(plan.to);
  if (plan.action === 'attack' && plan.target) values.push(plan.target);
  if (plan.action === 'tactic') {
    if (plan.to && plan.to !== plan.from) values.push(plan.to);
    if (plan.target) values.push(plan.target);
  }
  if (plan.after) values.push(plan.after);
  return values.filter((value, index, list) => value && list[index - 1] !== value);
};

const startsWith = (values: string[], prefix: string[]) =>
  prefix.every((value, index) => values[index] === value);

export function Battle({
  game,
  roomID,
  roomName,
  interactive = true,
  commandPending = false,
  connectionNotice,
  onAction,
  onResign,
  onLeave,
  onRematch,
  rematchPending = false,
  revealHands = false,
  mobileHeading,
}: Props) {
  const self = game.players[game.selfSide];
  const opponentSide = (1 - game.selfSide) as Side;
  const opponent = game.players[opponentSide];
  const myTurn = interactive
    && game.phase !== 'end'
    && game.currentPlayerID === self.playerID;
  const canInput = myTurn && !commandPending && !connectionNotice;
  const [selectedCoin, setSelectedCoin] = useState<string>();
  const [action, setAction] = useState<Action>();
  const [scope, setScope] = useState<Plan[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [plan, setPlan] = useState<Plan>();
  const [inspect, setInspect] = useState<UnitId>(self.roster[0] ?? 'sword');
  const [panel, setPanel] = useState<'unit' | 'bag' | 'enemy-bag' | 'pile' | 'log' | 'rules' | 'more' | 'recruit' | 'menu' | 'result'>();
  const [pileSide, setPileSide] = useState<Side>(game.selfSide);
  const [notice, setNotice] = useState('');
  const [recruit, setRecruit] = useState<UnitId>();
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pendingOwnDecision = game.pending?.playerID === self.playerID;
  const pendingOptions = pendingOwnDecision ? game.legalActions : [];
  const coinOptions = selectedCoin
    ? game.legalActions.filter(value => value.coinID === selectedCoin)
    : [];
  const options = pendingOwnDecision ? pendingOptions : coinOptions;
  const actions = new Set(options.map(value => value.action));
  const candidatePaths = useMemo(() => scope.map(value => actionPath(value, scope)), [scope]);
  const remaining = scope.filter((_, index) => startsWith(candidatePaths[index], selectedKeys));
  const depth = selectedKeys.length;
  const targets = [...new Set(scope.flatMap((_, index) =>
    startsWith(candidatePaths[index], selectedKeys) && candidatePaths[index][depth]
      ? [candidatePaths[index][depth]] : []))];
  const preview = plan ?? (selectedKeys.length && remaining.length ? remaining[0] : undefined);
  const currentType = pendingOwnDecision
    ? game.pending?.unitType ?? options[0]?.type
    : self.hand.find(value => value.id === selectedCoin)?.type;
  const selectedField = preview?.from
    ?? (currentType ? findUnit(game, currentType, game.selfSide) : undefined);
  const defensive = pendingOwnDecision && game.pending?.kind === 'guard';

  const clearChoice = () => {
    setAction(undefined);
    setScope([]);
    setSelectedKeys([]);
    setPlan(undefined);
  };
  useEffect(() => {
    clearChoice();
    if (pendingOwnDecision) {
      setSelectedCoin(undefined);
      const nextType = game.pending?.unitType ?? game.legalActions[0]?.type;
      if (nextType) setInspect(nextType);
      return;
    }
    const first = self.hand.find(coin => game.legalActions.some(plan => plan.coinID === coin.id));
    setSelectedCoin(first?.id);
    if (first?.type) setInspect(first.type === 'royal' && self.roster.includes('guard') ? 'guard' : first.type);
  }, [game.actions, game.round, game.phase, game.pending?.kind, self.hand.map(value => value.id).join('|')]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (game.phase === 'end') setPanel('result');
  }, [game.phase]);

  const selectCoin = (coinID: string) => {
    if (!canInput || pendingOwnDecision) return;
    setSelectedCoin(coinID);
    const type = self.hand.find(value => value.id === coinID)?.type;
    if (type) setInspect(type === 'royal' && self.roster.includes('guard') ? 'guard' : type);
    clearChoice();
  };
  const chooseAction = (nextAction: Action) => {
    if (!canInput) return;
    const candidates = options.filter(value => value.action === nextAction);
    if (!candidates.length) return;
    setAction(nextAction);
    setScope(candidates);
    setSelectedKeys([]);
    setPlan(undefined);
    if (nextAction === 'recruit') {
      const first = candidates[0].recruit;
      setRecruit(first);
      setPanel('recruit');
      return;
    }
    if (candidates.length === 1) {
      setPlan(candidates[0]);
      return;
    }
    if (['initiative', 'pass', 'finish'].includes(nextAction)) {
      setPlan(candidates[0]);
    }
  };
  const clickCell = (key: string) => {
    if (!action) {
      const piece = game.board[key];
      if (piece) {
        setInspect(piece.type);
        setPanel('unit');
      }
      return;
    }
    if (!targets.includes(key)) {
      setNotice('请选择棋盘上高亮的服务端合法目标。');
      return;
    }
    const nextKeys = [...selectedKeys, key];
    const nextRemaining = scope.filter(value => startsWith(actionPath(value, scope), nextKeys));
    setSelectedKeys(nextKeys);
    const exact = nextRemaining.find(value =>
      actionPath(value, scope).length === nextKeys.length);
    if (exact) setPlan(exact);
    else if (nextRemaining.length === 1) setPlan(nextRemaining[0]);
  };
  const submit = (selected: Plan | undefined = plan) => {
    if (!selected || !canInput) return;
    if (onAction?.(selected.actionID) !== false) clearChoice();
  };
  const actionProps = (value: Action) => ({
    action: value,
    active: action === value,
    enabled: actions.has(value) && canInput,
    reason: actions.has(value) ? ACTION_HINTS[value] : '当前权威快照没有这种合法行动。',
    onChoose: chooseAction,
  });
  const pendingCopy = game.pending?.description
    || (game.pending?.kind === 'guard' ? '皇家卫队必须选择损失来源。'
      : game.pending?.kind === 'priest' ? '立即使用战斗牧师新抽出的指令。'
        : game.pending ? '完成当前追加调遣，或选择结束。' : '');
  const latest = game.log[0];
  const unitInfo = UNITS[inspect];
  const end = game.phase === 'end';
  const playerScore = (side: Side) => score(game, side);

  return <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
    <div className={`warchest-root battle-app ${myTurn ? 'is-your-turn' : ''}`}
      data-testid="warchest-battle" data-round={game.round} data-phase={game.phase}>
      <div className="battle-atmosphere" aria-hidden="true" />
      {mobileHeading ?? <GameMobileTopbar
        onBack={() => onLeave?.()}
        backLabel="退出对局"
        kicker={`房间 ${roomID} · ROUND ${game.round}`}
        title={roomName}
        status={!end && game.turnDeadline
          ? <TurnCountdown bare secondsOnly deadline={game.turnDeadline} />
          : end ? '已结束' : '--'}
        actions={<>
          <button className="icon-button" type="button" aria-label="查看对局规则"
            title="查看对局规则"
            onClick={() => setPanel('rules')}><BookOpen size={19} /></button>
          {end
            ? <button className="icon-button" type="button" aria-label="打开终局结算"
              title="打开终局结算"
              onClick={() => setPanel('result')}><Trophy size={19} /></button>
            : <button className="icon-button" type="button" aria-label="打开对局菜单"
              title="打开对局菜单"
              onClick={() => setPanel('menu')}><MoreHorizontal size={21} /></button>}
        </>}
      />}
      <header className="battle-header" data-game-desktop-topbar><button className="icon-button back-lobby" type="button"
        aria-label="退出对局" onClick={onLeave}><ArrowLeft size={20} /></button><Brand />
        <div className="battle-room"><span /><b>{roomName}</b><small>房间 {roomID}</small></div>
        <div className="header-space" /><span className="local-label"><i />服务端权威 · 90 秒</span>
        <button className="icon-button" type="button" aria-label="查看对局规则"
          onClick={() => setPanel('rules')}><BookOpen size={19} /></button>
        {end
          ? <button className="icon-button" type="button" aria-label="打开终局结算"
            onClick={() => setPanel('result')}><Trophy size={19} /></button>
          : <button className="icon-button" type="button" aria-label="打开对局菜单"
            onClick={() => setPanel('menu')}><MoreHorizontal size={21} /></button>}
        {!end && <span className="battle-timer"><Clock3 size={13} />
          {game.turnDeadline ? <TurnCountdown bare secondsOnly deadline={game.turnDeadline} /> : '--'}</span>}
      </header>
      {connectionNotice && <div className="battle-connection" role="status">{connectionNotice}</div>}
      <div className="mobile-scoreboard"><div><Crest size={34} /><span>{game.players[0].name}
        <small>{game.players[0].playerID === self.playerID ? '你 · ' : ''}{game.initiative === 0 ? '先手' : '橡木军团'}</small></span>
        <b>{playerScore(0)}<small>/6</small></b></div><span className="score-vs">VS</span>
        <div><Crest side={1} size={34} /><span>{game.players[1].name}
          <small>{game.players[1].playerID === self.playerID ? '你 · ' : ''}{game.initiative === 1 ? '先手' : '赤隼军团'}</small></span>
          <b>{playerScore(1)}<small>/6</small></b></div></div>
      <div className="battle-grid"><aside className="battle-left"><Eyebrow>THE TWO BANNERS</Eyebrow>
        <FactionPanel game={game} side={opponentSide} onBag={() => setPanel('enemy-bag')}
          onPile={() => { setPileSide(opponentSide); setPanel('pile'); }} revealHand={revealHands} />
        <div className="versus-line"><span />VS<span /></div>
        <FactionPanel game={game} side={game.selfSide} onBag={() => setPanel('bag')}
          onPile={() => { setPileSide(game.selfSide); setPanel('pile'); }} />
        <div className="last-dispatch"><div><ScrollText size={13} /><span>最近行动</span>
          <button type="button" aria-label="查看完整战报" onClick={() => setPanel('log')}>
            <ChevronRight size={13} /></button></div>
          <p>{latest?.text || '双方已经就位，等待第一道指令。'}</p>
          <small><Flag size={11} />控局，而非歼灭。六处据点即胜。</small></div></aside>
        <section className="arena"><div className="arena-toolbar">
          <span className="round-label">ROUND <b>{game.round}</b></span>
          <span data-testid="warchest-turn-status" className={`turn-badge ${myTurn ? 'your-turn' : ''}`}>
            <i />{commandPending ? '等待服务端确认' : end ? '对局结束' : myTurn ? '轮到你行动' : '等待对手指令'}</span>
          <button type="button" aria-label="打开战报" className="icon-button mobile-log-button"
            onClick={() => setPanel('log')}><ScrollText size={17} /></button>
          <span className={`arena-mode ${targets.length ? 'has-targets' : ''}`}>
            {targets.length ? `${targets.length} 处合法目标` : '完整基础版 · 权威局面'}</span></div>
          <div className="board-stage"><Board game={game} targets={canInput ? targets : []}
            selected={selectedField} plan={preview} followups={action === 'attack' && selectedKeys.length ? targets : []}
            onCell={clickCell} onConfirm={() => submit()} showCoordinates={showCoordinates}
            locked={commandPending || !interactive} /></div>
          <div className="board-legend"><span><i className="legend-own" />橡木</span>
            <span><i className="legend-enemy" />赤隼</span><span><Flag size={12} />据点</span>
            <p>{plan ? '目标已锁定 · 确认前可取消' : action ? '点击高亮目标继续' : '移动 ≠ 控制 · 所有候选来自服务端'}</p></div>
        </section>
        <aside className="battle-right"><div className="panel-tabs"><button className="active" type="button">军团情报</button>
          <button type="button" onClick={() => setPanel('log')}>战报<span>{game.log.length}</span></button></div>
          <div className={`unit-inspector ${rosterOf(game, opponentSide).includes(inspect) ? 'enemy-inspector' : ''}`}>
            <div className="inspector-title"><div><Eyebrow>{unitInfo.en}</Eyebrow><h2>{unitInfo.name}</h2></div>
              <Coin type={inspect} side={rosterOf(game, opponentSide).includes(inspect) ? opponentSide : game.selfSide} size={43} /></div>
            <div className="unit-portrait"><div className="portrait-orbit" /><TroopArt type={inspect} />
              <span className="unit-role">{unitInfo.role}</span></div>
            <div className="unit-ability"><span>{unitInfo.kind}</span><p>{unitInfo.ability}</p>
              {unitInfo.restriction && <small>{unitInfo.restriction}</small>}</div></div>
          <section className="supply-section"><div className="small-heading"><b>我的补给</b><small>招募后进入弃置区</small></div>
            <div className="supply-grid">{self.roster.map(type => <button key={type} type="button"
              data-supply={type} className={inspect === type ? 'active' : ''} onClick={() => setInspect(type)}>
              <Coin type={type} side={game.selfSide} size={38} /><span>{UNITS[type].name}<b>×{self.supply[type] || 0}</b></span></button>)}</div>
          </section></aside></div>

      {!end && interactive && <section className={`command-dock ${plan ? 'has-preview' : ''} ${pendingOwnDecision ? 'has-continuation' : ''} ${defensive ? 'guard-pending' : ''}`}
        aria-label="指令操作区"><div className="hand-panel"><div className="small-heading">
          <b>{pendingOwnDecision ? '追加决策' : '你的指令'} <span>{self.hand.length} / 3</span></b>
          <button type="button" onClick={() => setPanel('bag')}><Backpack size={14} />{self.bagCount}<ChevronRight size={12} /></button></div>
          {pendingOwnDecision ? <div className="continuation-card"><div><Layers size={15} /><b>{game.pending?.kind} · 后续决策</b></div>
            <p>{pendingCopy}</p>{actions.has('finish') && <button className="text-button" type="button"
              disabled={!canInput} onClick={() => chooseAction('finish')}>结束追加调遣</button>}</div>
            : <div className="hand-coins"><HandCoins game={game} selected={selectedCoin} enabled={canInput}
              onSelect={selectCoin} /><button className="mobile-army-button" type="button"
                onClick={() => setPanel('unit')}><Info size={18} /><span>情报</span></button></div>}
        </div>
        {defensive ? <div className="defense-choices">{options.filter(value => value.action === 'defend').map(value =>
          <button key={value.actionID} type="button" className={value.defense === 'supply' ? 'supply-defense' : 'field-defense'}
            disabled={!canInput} onClick={() => submit(value)}>{value.defense === 'supply' ? <ShieldCheck size={26} /> : <Swords size={26} />}
            <span><b>{value.defense === 'supply' ? '以补给抵挡' : '承受棋盘损失'}</b>
              <small>{value.defense === 'supply' ? '永久移除一枚补给，场上单位不受损' : '从棋盘皇家卫队移除一枚币'}</small></span>
            <ArrowRight size={17} /></button>)}</div> : <>
          <div className="desktop-action-panel"><div className="small-heading"><b>{currentType
            ? `使用${UNITS[currentType].name}` : '选择一枚指令币'}<span> · 一枚币，一次决策</span></b>
            {action && <button className="cancel-plan" type="button" onClick={clearChoice}><X size={13} />取消选择</button>}</div>
            <div className="action-groups">{ACTION_GROUPS.map((group, index) => <div className="action-group" key={index}>
              <small>{['放置棋盘', '正面弃置 · 调遣', '背面弃置 · 调度'][index]}</small><div>
                {group.map(value => <CommandAction key={value} {...actionProps(value)} />)}</div></div>)}</div></div>
          <div className="mobile-action-panel">{(['deploy', 'move', 'attack', 'control', 'tactic'] as Action[])
            .filter(value => actions.has(value)).slice(0, 4).map(value => <CommandAction key={value} {...actionProps(value)} compact />)}
            <button className={`action-button ${['bolster', 'recruit', 'initiative', 'pass'].includes(action || 'deploy') ? 'active' : ''}`}
              type="button" disabled={!currentType || !canInput} aria-label="更多行动" onClick={() => setPanel('more')}>
              <MoreHorizontal size={19} /><span>更多</span></button></div>
          <div className={`commit-panel ${plan ? 'ready' : ''}`}><div className="commit-copy" aria-live="polite">
            <span className="commit-kicker">{commandPending ? '等待确认' : plan ? '行动预览' : !myTurn ? '等待指令' : action ? '选择目标' : '等待你的决策'}</span>
            <p>{commandPending ? '服务端正在验证行动。' : plan ? planText(plan) : connectionNotice || (!myTurn
              ? '留意对手行动，再决定下一步。' : action ? ACTION_HINTS[action] : pendingCopy || '先选一枚币，再决定如何使用。')}</p>
            {plan && <small>{plan.free ? '追加行动 · 不再消耗手牌' : '仅提交当前快照中的 actionID'}</small>}</div>
            <div className="commit-buttons">{action && <button className="icon-button mobile-cancel" type="button"
              aria-label="取消行动选择" onClick={clearChoice}><RotateCcw size={17} /></button>}
              <button className="button primary commit-button" type="button" disabled={!plan || !canInput}
                onClick={() => submit()}>{plan ? '确认行动' : '选择目标'}<ArrowRight size={16} /></button></div></div></>}
      </section>}

      <AnimatePresence>{notice && <motion.div className="toast battle-toast" role="status"
        initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <Info size={15} />{notice}</motion.div>}</AnimatePresence>

      {panel === 'more' && <Modal title="一枚币，还有这些可能。" eyebrow="COMMAND OPTIONS"
        onClose={() => setPanel(undefined)}><div className="more-actions">
        {(['bolster', 'recruit', 'initiative', 'pass'] as Action[]).map(value => {
          const Icon = ACTION_ICONS[value];
          return <button key={value} type="button" disabled={!actions.has(value)} onClick={() => {
            setPanel(undefined); chooseAction(value);
          }}><span><Icon size={21} /></span><div><b>{ACTION_NAMES[value]}</b>
            <p>{actions.has(value) ? ACTION_HINTS[value] : '当前权威快照没有这种合法行动。'}</p></div>
            <ChevronRight size={18} /></button>;
        })}</div></Modal>}

      {panel === 'recruit' && <Modal title="为下一轮，招募援军。" eyebrow="RECRUIT A UNIT"
        onClose={() => { setPanel(undefined); clearChoice(); }} footer={<button className="button primary full"
          type="button" disabled={!recruit} onClick={() => {
            const selected = scope.find(value => value.recruit === recruit);
            setPlan(selected); setPanel(undefined);
          }}>预览招募{recruit ? UNITS[recruit].name : ''}<ArrowRight size={17} /></button>}>
        <p className="dialog-intro">支付当前指令币。新币会先进入弃置区，不会立即加入手牌。</p>
        <div className="recruit-options">{scope.map(value => value.recruit).filter(Boolean).map(type =>
          <button key={type} type="button" className={recruit === type ? 'selected' : ''}
            onClick={() => setRecruit(type)}><TroopArt type={type!} /><span><b>{UNITS[type!].name}</b>
              <small>补给剩余 {self.supply[type!] || 0} 枚</small></span>{recruit === type && <Check size={17} />}</button>)}</div>
      </Modal>}

      {panel === 'unit' && <Modal title={unitInfo.name} eyebrow={unitInfo.en}
        onClose={() => setPanel(undefined)} className="unit-detail-modal">
        <div className="unit-detail-art"><TroopArt type={inspect} /><Coin type={inspect} size={63} /></div>
        <h3>{unitInfo.kind}</h3><p>{unitInfo.ability}</p>
        {unitInfo.restriction && <div className="warning-note">{unitInfo.restriction}</div>}
        <p className="muted">{unitInfo.tip}</p></Modal>}

      {panel === 'bag' && <Modal title="你的军袋" eyebrow="THE ART OF BAG BUILDING"
        onClose={() => setPanel(undefined)}><div className="bag-summary"><Backpack size={43} />
        <div><b>{self.bagCount}</b><span>袋中指令币</span></div><div><b>{self.hand.length}</b><span>当前手牌</span></div></div>
        <p className="dialog-intro">实时对局只公开数量与自己的可见统计，不展示服务端军袋顺序。</p>
        <div className="inventory-list">{[...self.roster, 'royal' as UnitId].map(type => <div key={type}>
          <Coin type={type} side={game.selfSide} size={38} /><b>{UNITS[type].name}</b>
          <span>补给 × {self.supply[type] || 0}</span></div>)}</div></Modal>}

      {panel === 'enemy-bag' && <Modal title="对手的军袋" eyebrow="HIDDEN COMMANDS"
        onClose={() => setPanel(undefined)}><div className="bag-summary"><Backpack size={43} />
        <div><b>{opponent.bagCount}</b><span>袋中指令币</span></div><div><b>{opponent.handCount}</b><span>隐藏手牌</span></div></div>
        <p>数量公开，兵种与顺序保持隐藏。正面弃置的指令可在弃置区查看。</p></Modal>}

      {panel === 'pile' && <Modal title={pileSide === game.selfSide ? '我的弃置区' : '对手弃置区'}
        eyebrow="DISCARD PILE" onClose={() => setPanel(undefined)}><p className="dialog-intro">
          正面币公开；背面币只向本人显示真实兵种。</p><div className="discard-coins">
          {game.players[pileSide].discard.map(value => <div key={value.id}><Coin type={value.type ?? 'royal'}
            side={pileSide} back={!value.type} size={54} /><span>{value.type ? UNITS[value.type].name : '隐藏币'}</span>
            <small>{value.faceUp ? '正面' : '背面'}</small></div>)}</div>
        {!game.players[pileSide].discard.length && <div className="empty-state"><Layers size={36} />
          <h3>这里暂时没有币</h3></div>}</Modal>}

      {panel === 'log' && <Modal title="战场纪事" eyebrow="FIELD DISPATCHES"
        onClose={() => setPanel(undefined)}><div className="battle-log">{game.log.map(entry => <div
          className="log-entry" key={entry.id}><span className={`log-dot ${entry.side === 1 ? 'enemy' : ''}`} />
          <small>第 {entry.round} 轮 · {entry.side == null ? '系统' : game.players[entry.side].name}</small>
          <p>{entry.text}</p></div>)}</div></Modal>}

      {panel === 'rules' && <Modal title="先控局，再言胜。" eyebrow="QUICK REFERENCE"
        onClose={() => setPanel(undefined)}><div className="quick-rules">{[
          ['01', '每轮自动抽至多 3 枚币', '服务端抽币，双方轮流使用一枚，不是一次用完三枚。'],
          ['02', '一枚币，一种用途', '放置棋盘、正面调遣或背面调度，最终均由 actionID 验证。'],
          ['03', '到达并不代表控制', '仍需使用对应指令执行控制，才能获得脚下据点。'],
          ['04', '放完 6 枚控制标记即胜', '无需消灭所有敌军，也不用等待本轮结束。'],
        ].map(([number, title, copy]) => <div key={number}><span>{number}</span><section>
          <h3>{title}</h3><p>{copy}</p></section></div>)}</div><SourceLink /></Modal>}

      {panel === 'menu' && <Modal title="战场设置" eyebrow="FIELD OPTIONS"
        onClose={() => setPanel(undefined)}><div className="preference-row"><div><h3>显示棋盘坐标</h3>
          <p>便于识别目标与阅读战报</p></div><button role="switch" type="button" aria-checked={showCoordinates}
            className={`switch ${showCoordinates ? 'on' : ''}`} onClick={() => setShowCoordinates(value => !value)}><span /></button></div>
        <div className="preference-row"><div><h3>减少战场动效</h3><p>直接呈现服务端最新局面</p></div>
          <button role="switch" type="button" aria-checked={reducedMotion}
            className={`switch ${reducedMotion ? 'on' : ''}`} onClick={() => setReducedMotion(value => !value)}><span /></button></div>
        {!end && interactive && onResign && <button className="button secondary full warchest-resign" type="button" disabled={!canInput}
          onClick={() => { if (onResign()) setPanel(undefined); }}>认输本局</button>}
      </Modal>}

      {panel === 'result' && end && <Modal title={game.winner === game.selfSide
        ? '六面旗帜，见证你的远见。' : '战局已定，下次再战。'}
        eyebrow={game.winner === game.selfSide ? 'VICTORY · THE FIELD IS YOURS' : 'A BATTLE WELL FOUGHT'}
        onClose={() => setPanel(undefined)} className="victory-modal game-result-modal"
        footer={<><button className="button secondary" type="button" onClick={() => setPanel(undefined)}>回到棋盘</button>
          {onRematch && <button className="button primary" type="button" disabled={rematchPending}
            onClick={onRematch}>{rematchPending ? '正在建立下一局' : '再来一局'}<ArrowRight size={16} /></button>}</>}>
        <div className="victory-emblem"><Crest side={game.winner ?? 0} size={101} /><Trophy size={27} /></div>
        <div className="victory-six-flags">{Array.from({ length: 6 }, (_, index) => <span key={index}><Flag size={17} /></span>)}</div>
        <div className="victory-result"><span>橡木军团</span><b>{playerScore(0)} <small>:</small> {playerScore(1)}</b><span>赤隼军团</span></div>
        <p>最后一枚控制标记落下，对局立即结束。</p><div className="result-stats"><div><b>{game.round}</b><span>结束轮次</span></div>
          <div><b>{game.actions}</b><span>本次行动</span></div><div><b>6</b><span>获胜据点</span></div></div>
      </Modal>}
    </div>
  </MotionConfig>;
}
