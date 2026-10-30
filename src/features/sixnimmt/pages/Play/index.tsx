import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Grid2X2,
  Hand,
  History,
  LockKeyhole,
  MoreHorizontal,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameMobileTopbar } from '@/components/GameUI/GameMobileTopbar';
import { Bull, PlayerAvatar } from '../../components/AppShell';
import {
  BullScore,
  CardBack,
  NumberCard,
} from '../../components/Card';
import { Dialog } from '../../components/Dialog';
import type { SixNimmtSession } from '../../hooks/useSixNimmtSession';
import { bullheads, rowLetters, targetRow } from '../../model/cards';
import {
  isMyRowChoice,
  isSelecting,
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

function phaseText(data: GameSnapshot) {
  const phase = data.roomData.gameStatus;
  const self = data.playerData[data.playerId];
  if (phase === 'waiting') return '正在同步所有玩家';
  if (phase === 'chooseRow') {
    return isMyRowChoice(data) ? '牌太小，选择一行收取' : '等待玩家选择收行';
  }
  if (phase === 'selecting') {
    return self?.locked ? '已锁定，等待其他玩家' : '选一张手牌，别挤成第六张';
  }
  return '牌桌正在结算';
}

function PlayerBar({ data }: { data: GameSnapshot }) {
  return <section className={`sn-players-bar ${
    data.roomData.playerOrder.length > 4 ? 'many' : ''}`}>
    {data.roomData.playerOrder.map(id => {
      const player = data.roomData.players[id];
      const score = data.playerData[id];
      const self = id === data.playerId;
      return <article key={id} className={self ? 'self' : ''}>
        <PlayerAvatar name={playerName(id, data.roomData.players)}
          avatar={player?.avatar} ai={player?.ai} size={34} />
        <div><b>{playerName(id, data.roomData.players)}
          {player?.ai && <small>AI</small>}</b>
          <span>{score?.locked ? '已锁定'
            : player?.online ? '正在选牌' : '暂时离线'}</span></div>
        <BullScore value={score?.totalPenalty ?? 0} />
      </article>;
    })}
  </section>;
}

function ResolutionQueue({ data }: { data: GameSnapshot }) {
  const resolution = data.roomData.lastResolution;
  if (!resolution?.selections.length) return null;
  return <section className="sn-reveal-queue"><span>入列顺序</span>
    {resolution.selections.map((selection, index) => {
      const placement = resolution.placements[index];
      return <div key={`${selection.playerID}:${selection.card}`}
        className={placement ? 'resolved' : 'current'}>
        <strong>{selection.card}</strong>
        <small>{playerLabel(selection.playerID, data.roomData.players)}</small>
        {placement && <Check size={11} />}
      </div>;
    })}
    <small>小 <ArrowRight size={12} /> 大</small></section>;
}

function Table({
  data,
  selectedCard,
  selectedRow,
  onSelectRow,
}: {
  data: GameSnapshot;
  selectedCard?: number;
  selectedRow?: number;
  onSelectRow: (index: number) => void;
}) {
  const choosing = isMyRowChoice(data);
  const previewRow = selectedCard != null && isSelecting(data)
    ? targetRow(data.roomData.rows.map(row => row.cards), selectedCard)
    : -2;
  return <section className={`sn-table ${choosing ? 'choosing' : ''}`}>
    <header><span><Grid2X2 size={15} />公共牌桌
      <small>4 行 · 每行最多 5 张</small></span>
      <span>第 6 张，收走前 5 张 <Bull size={14} /></span></header>
    <div>{data.roomData.rows.map(row => {
      const cost = data.roomData.pendingChoice?.rowPenalties[row.index]
        ?? row.bullheads;
      const predicted = previewRow === row.index;
      const chosen = selectedRow === row.index;
      return <button type="button" key={row.index}
        className={[
          'sn-table-row',
          row.cards.length === 5 ? 'full' : '',
          predicted ? 'predicted' : '',
          chosen ? 'chosen' : '',
        ].filter(Boolean).join(' ')}
        disabled={!choosing}
        aria-pressed={chosen}
        aria-label={`收取 ${rowLetters[row.index]} 行，${cost} 牛头`}
        onClick={() => onSelectRow(row.index)}>
        <span className="sn-row-id"><b>{rowLetters[row.index]}</b>
          <small>{row.cards.length}/5</small></span>
        <span className="sn-row-cards">
          {Array.from({ length: 5 }, (_, index) => row.cards[index]
            ? <NumberCard key={row.cards[index]} value={row.cards[index]} compact />
            : <i key={`empty-${index}`}>{index + 1}</i>)}
          <span className="sn-sixth-slot"><b>6</b><small>收牛</small></span>
        </span>
        <span className="sn-row-cost"><Bull size={15} /><b>{cost}</b>
          <small>{choosing ? chosen ? '已选择' : '收行代价'
            : predicted ? '当前预计' : row.cards.length === 5 ? '满行警戒' : '行内牛头'}</small></span>
        {chosen && <Check className="sn-row-check" size={13} />}
      </button>;
    })}</div>
    <footer><span><i />按数字递增，靠近小于自己的最大行尾</span>
      <span><i />第六张收牛</span></footer>
  </section>;
}

function ActionPanel({
  data,
  selectedCard,
  selectedRow,
  enabled,
  onLock,
  onUnlock,
  onChooseRow,
}: {
  data: GameSnapshot;
  selectedCard?: number;
  selectedRow?: number;
  enabled: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onChooseRow: () => void;
}) {
  const phase = data.roomData.gameStatus;
  const self = data.playerData[data.playerId];
  const locked = self?.locked;
  const rows = data.roomData.rows.map(row => row.cards);
  const preview = selectedCard == null ? -2 : targetRow(rows, selectedCard);
  const choiceCard = data.roomData.pendingChoice?.card;
  if (phase === 'waiting') return <div className="sn-waiting">
    <CardBack /><h2>所有人正在同步牌桌。</h2>
    <p>连接完成后，服务端会统一发出第一轮手牌。</p><span>· · ·</span></div>;
  if (phase === 'chooseRow') {
    if (!isMyRowChoice(data)) return <div className="sn-waiting">
      <NumberCard value={choiceCard ?? 1} compact />
      <h2>{playerLabel(data.roomData.pendingChoice?.playerID ?? '',
        data.roomData.players)} 正在选择收行</h2>
      <p>这张牌小于全部行尾，牌桌会在选择完成后继续结算。</p><span>· · ·</span></div>;
    const penalty = selectedRow == null
      ? undefined : data.roomData.pendingChoice?.rowPenalties[selectedRow];
    return <><span className="sn-eyebrow">TOO LOW / CHOOSE A ROW</span>
      <h2>牌太小，选一行收走。</h2>
      <p>{choiceCard} 小于所有行尾。先看清每行牛头，再确认选择。</p>
      <div className="sn-choice-preview"><NumberCard value={choiceCard ?? 1} compact />
        <span><Bull size={28} /><b>{penalty == null ? '?' : `+${penalty}`}</b>
          <small>{selectedRow == null ? '尚未选择'
            : `收取 ${rowLetters[selectedRow]} 行`}</small></span></div>
      <ActionButton variant="primary" disabled={!enabled || selectedRow == null}
        onClick={onChooseRow}>{selectedRow == null
          ? '请先选择一行'
          : `确认收取 ${rowLetters[selectedRow]} 行`}
        <ArrowRight size={16} /></ActionButton></>;
  }
  if (locked) return <><span className="sn-eyebrow">CARD LOCKED</span>
    <h2>心意已定，等其他人。</h2>
    <p>你的选择仍然保密。最后一位玩家锁定后，服务端会自动公开并结算。</p>
    <div className="sn-lock-preview"><CardBack /><span><LockKeyhole size={19} />
      <b>{data.roomData.lockedPlayerIDs.length} / {
        data.roomData.playerOrder.length} 人已锁定</b>
      <small>锁定牌只对你可见：{data.privateData.lockedCard}</small></span></div>
    <ActionButton disabled={!enabled} onClick={onUnlock}>
      <RotateCcw size={14} />撤回选择</ActionButton></>;
  if (phase !== 'selecting') return <div className="sn-waiting">
    <Bull size={45} /><h2>牌桌正在按数字结算。</h2>
    <p>每放入一张牌，后续牌都会基于更新后的行尾重新计算。</p><span>· · ·</span></div>;
  return <><span className="sn-eyebrow">YOUR NEXT MOVE</span>
    <h2>{selectedCard == null ? '选一张，藏住心思。' : '这一手，确认锁定？'}</h2>
    <p>{selectedCard == null
      ? '从下方十张手牌中选择一张，不会立刻提交。'
      : preview < 0 ? '按当前牌桌，这张牌低于所有行尾，需要主动收取一行。'
        : data.roomData.rows[preview].cards.length === 5
          ? `按当前牌桌，它会成为 ${rowLetters[preview]} 行第六张。`
          : `按当前牌桌，预计进入 ${rowLetters[preview]} 行。`}</p>
    <div className="sn-selection-preview">{selectedCard == null
      ? <span className="sn-blank-card"><Hand size={27} /></span>
      : <NumberCard value={selectedCard} />}
      <div><small>{selectedCard == null ? '尚未选择' : '已选手牌'}</small>
        <b>{selectedCard ?? '—'}</b>
        <span>{selectedCard == null ? '这一手，你说了算。'
          : `${bullheads(selectedCard)} 牛头 · 锁定前可以重选`}</span></div></div>
    <p className="sn-forecast-note"><CircleHelp size={13} />
      预览只基于当前牌桌；其他玩家更小的牌可能先改变行尾。</p>
    <ActionButton variant="primary"
      disabled={!enabled || selectedCard == null} onClick={onLock}>
      {selectedCard == null ? '先选择一张手牌' : `锁定出牌 · ${selectedCard}`}
      <LockKeyhole size={15} /></ActionButton></>;
}

export function Play({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending,
}: {
  session: SixNimmtSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch: () => void;
  startNextMatchPending: boolean;
}) {
  const [selectedCard, setSelectedCard] = useState<number>();
  const [selectedRow, setSelectedRow] = useState<number>();
  const [panel, setPanel] = useState<'rules' | 'scores' | 'log'>();
  const [reviewing, setReviewing] = useState(false);
  const key = turnKey(data);
  const phase = data.roomData.gameStatus;
  const enabled = session.connection.status === 'connected' && !session.pending;
  const countdown = useCountdown(data.roomData.turnDeadline);
  const roundCountdown = useCountdown(data.roomData.roundTransitionDeadline);
  const self = data.playerData[data.playerId];
  const hand = useMemo(() => [...data.privateData.hand].sort((a, b) => a - b),
    [data.privateData.hand]);

  useEffect(() => {
    setSelectedCard(data.privateData.lockedCard);
    setSelectedRow(undefined);
    setReviewing(false);
  }, [key]);
  useEffect(() => {
    if (data.privateData.lockedCard != null) {
      setSelectedCard(data.privateData.lockedCard);
    } else if (self?.locked) {
      setSelectedCard(undefined);
    }
  }, [data.privateData.lockedCard, self?.locked]);
  useEffect(() => {
    setSelectedRow(undefined);
  }, [
    data.roomData.pendingChoice?.card,
    data.roomData.pendingChoice?.playerID,
  ]);

  if ((phase === 'roundEnd' || phase === 'end') && !reviewing) {
    return <Results data={data} enabled={enabled} countdown={roundCountdown}
      onExit={onLeave} onReview={() => setReviewing(true)}
      onNextRound={() => session.submit('game_next_round')}
      onRematch={onStartNextMatch}
      rematchPending={startNextMatchPending} />;
  }

  const lock = () => {
    if (selectedCard == null) return;
    session.submit('game_lock_card', { card: selectedCard });
  };
  const unlock = () => {
    if (session.submit('game_unlock_card')) setSelectedCard(undefined);
  };
  const chooseRow = () => {
    if (selectedRow == null) return;
    session.submit('game_choose_row', { rowIndex: selectedRow });
  };

  return <div className="sn-play" data-testid="sixnimmt-play">
    <GameMobileTopbar
      onBack={onLeave}
      backLabel="离开对局"
      kicker="6 NIMMT! · 经典 66 分制"
      title={`第 ${data.roomData.roundNo} 局 · 第 ${data.roomData.turnNo} / 10 轮`}
      status={countdown}
      actions={<>
        <button type="button" aria-label="打开记分板" title="打开记分板"
          onClick={() => setPanel('scores')}><Trophy size={18} /></button>
        <button type="button" aria-label="玩法速查" title="玩法速查"
          onClick={() => setPanel('rules')}><BookOpen size={18} /></button>
        <button type="button" aria-label="对局菜单" title="对局菜单"
          onClick={onLeave}><MoreHorizontal size={20} /></button>
      </>}
    />
    <header className="sn-game-header" data-game-desktop-topbar>
      <button type="button" aria-label="离开对局" onClick={onLeave}>
        <ArrowLeft size={20} /></button>
      <div><small>A LITTLE BLUFF. A LOT OF FUN.</small>
        <h1>第 {data.roomData.roundNo} 局
          <span>·</span>第 {data.roomData.turnNo} / 10 轮</h1></div>
      <span className="sn-game-mode"><ShieldCheck size={13} />经典 66 分制</span>
      {countdown && <b className="sn-game-timer">{countdown}</b>}
      <button type="button" aria-label="打开记分板" onClick={() => setPanel('scores')}>
        <Trophy size={18} /></button>
      <button type="button" aria-label="玩法速查" onClick={() => setPanel('rules')}>
        <BookOpen size={18} /></button>
      <button type="button" aria-label="对局菜单" onClick={onLeave}>
        <MoreHorizontal size={20} /></button>
    </header>

    {session.feedback && <div className="sn-game-toast" role="alert">{session.feedback}</div>}
    {(phase === 'roundEnd' || phase === 'end') && reviewing
      && <button className="sn-review-banner"
      type="button" onClick={() => setReviewing(false)}>
      正在查看终局牌桌 · 返回结算<ArrowRight size={14} /></button>}

    <main className="sn-game-layout"><div className="sn-table-column">
      <PlayerBar data={data} />
      <div className="sn-phase-track"><span className={phase === 'selecting' ? 'active' : ''}>
        <i>1</i>同时选牌</span><b />
        <span className={data.roomData.lastResolution ? 'complete' : ''}>
          <i>2</i>统一公开</span><b />
        <span className={phase === 'chooseRow' ? 'active' : ''}>
          <i>3</i>从小到大入列</span></div>
      <ResolutionQueue data={data} />
      <Table data={data} selectedCard={selectedCard}
        selectedRow={selectedRow} onSelectRow={setSelectedRow} />
      <section className="sn-hand-panel"><header><div><Hand size={16} />
        <h2>你的手牌</h2><span>{hand.length} 张</span><small>只有你看得见</small></div>
        <button type="button" aria-label="按数字排序">
          <Settings2 size={13} />按数字</button></header>
        <div className="sn-hand-cards">{hand.map(card =>
          <NumberCard key={card} value={card}
            selected={selectedCard === card}
            disabled={!enabled || phase !== 'selecting' || !!self?.locked
              || !data.privateData.legalCards.includes(card)}
            onClick={() => setSelectedCard(current => current === card
              ? undefined : card)} />)}
          {!hand.length && <div className="sn-hand-empty"><Check size={20} />
            十张手牌已出完，等待本局计分。</div>}</div>
        <footer><span><LockKeyhole size={11} />选择后需再次确认，不会误触出牌。</span>
          <span>基础牌组 · 不补牌</span></footer>
      </section>
      <button className="sn-activity" type="button" onClick={() => setPanel('log')}>
        <History size={14} /><span>{data.roomData.activityLog.at(-1)?.summary
          || '牌桌还很安静，锁定后故事就开始了。'}</span>
        <b>全部记录<ChevronRight size={14} /></b></button>
    </div>

    <aside className="sn-game-aside">
      <section className="sn-action-panel"><ActionPanel data={data}
        selectedCard={selectedCard} selectedRow={selectedRow}
        enabled={enabled} onLock={lock} onUnlock={unlock}
        onChooseRow={chooseRow} /></section>
      <section className="sn-event-panel"><header><h3>牌桌动态</h3>
        <button type="button" aria-label="查看全部出牌记录"
          onClick={() => setPanel('log')}><MoreHorizontal size={19} /></button></header>
        {data.roomData.activityLog.length
          ? data.roomData.activityLog.slice(-3).reverse().map(item =>
            <article key={item.id}><span>{item.card ?? '·'}</span><div>
              <p>{item.summary || item.kind}</p>
              <small>第 {item.turnNo} 轮{
                item.automationKind === 'ai' ? ' · AI 操作'
                  : item.automationKind === 'timeout' ? ' · 超时托管' : ''}</small></div>
              {!!item.penalty && <b>+{item.penalty}</b>}</article>)
          : <div className="sn-event-empty"><Bull size={25} />
            <p>牌桌还很安静。<br />所有人锁定后，故事就开始了。</p></div>}
      </section>
    </aside></main>

    <footer className="sn-mobile-dock"><div><b>{phaseText(data)}</b>
      <small>{countdown ? `阶段剩余 ${countdown}` : '以服务端最新状态为准'}</small></div>
      {phase === 'selecting' && self?.locked
        ? <ActionButton disabled={!enabled} onClick={unlock}>
          <RotateCcw size={14} />撤回</ActionButton>
        : phase === 'selecting'
          ? <ActionButton variant="primary"
            disabled={!enabled || selectedCard == null} onClick={lock}>
            {selectedCard == null ? '选择手牌' : `锁定 ${selectedCard}`}
            <LockKeyhole size={14} /></ActionButton>
          : isMyRowChoice(data)
            ? <ActionButton variant="primary"
              disabled={!enabled || selectedRow == null} onClick={chooseRow}>
              {selectedRow == null ? '选择一行' : `确认 ${rowLetters[selectedRow]} 行`}
              <ArrowRight size={14} /></ActionButton>
            : <ActionButton onClick={() => setPanel('rules')}>
              玩法速查<BookOpen size={14} /></ActionButton>}
    </footer>

    {panel === 'scores' && <Dialog title="记分板 · 牛头越少越好"
      onClose={() => setPanel(undefined)}>
      <div className="sn-score-dialog">{[...data.roomData.playerOrder]
        .sort((a, b) => (data.playerData[a]?.totalPenalty ?? 0)
          - (data.playerData[b]?.totalPenalty ?? 0))
        .map(id => <div key={id}><PlayerAvatar
          name={playerName(id, data.roomData.players)}
          avatar={data.roomData.players[id]?.avatar}
          ai={data.roomData.players[id]?.ai} size={35} />
          <b>{playerLabel(id, data.roomData.players)}</b>
          <span>本局 +{data.playerData[id]?.roundPenalty ?? 0}</span>
          <BullScore value={data.playerData[id]?.totalPenalty ?? 0} /></div>)}</div>
      <p className="sn-note">66 分只在完整 10 轮结束后判断；累计牛头最少者获胜。</p>
    </Dialog>}
    {panel === 'log' && <Dialog title="出牌记录" wide
      onClose={() => setPanel(undefined)}>
      <ol className="sn-log-list">{data.roomData.activityLog.slice().reverse().map(item =>
        <li key={item.id}><span>{item.card ?? '·'}</span><div>
          <p>{item.summary || item.kind}</p><small>第 {item.roundNo} 局 · 第 {item.turnNo} 轮
            {item.rowIndex != null && ` · ${rowLetters[item.rowIndex]} 行`}
            {item.automationKind === 'ai' ? ' · AI 操作'
              : item.automationKind === 'timeout' ? ' · 超时托管' : ''}</small></div>
          {!!item.penalty && <b>+{item.penalty}</b>}</li>)}</ol>
      {!data.roomData.activityLog.length && <div className="sn-empty">
        <History size={30} /><h3>还没有出牌记录。</h3>
        <p>所有人锁定第一张牌后，这里会展示公开结果。</p></div>}
    </Dialog>}
    {panel === 'rules' && <Dialog title="牌桌上的规则速查"
      onClose={() => setPanel(undefined)}>
      <div className="sn-quick-rules">{[
        ['1', '所有人先选一张牌', '锁定后自动公开，再从最小数字开始处理。'],
        ['2', '去往最接近的行尾', '只能比行尾大；在可选行中找最大行尾。'],
        ['6', '第六张，收走前五张', '收取牌上的牛头计入罚分，自己的牌成为新行首。'],
        ['!', '比所有行尾都小？', '自己选择一行收走，再用自己的牌开始新行。'],
      ].map(item => <div key={item[0]}><span>{item[0]}</span><section>
        <b>{item[1]}</b><p>{item[2]}</p></section></div>)}
        <div className="sn-point-legend">{[23, 25, 30, 44, 55].map(value =>
          <span key={value}><NumberCard value={value} compact />
            <small>{bullheads(value)} 牛头</small></span>)}</div>
        <p className="sn-note">每局 10 轮。经典模式在局末有人累计达到或超过 66 牛头时结束。</p>
      </div>
    </Dialog>}
  </div>;
}
