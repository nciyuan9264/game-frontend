import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  EyeOff,
  Feather,
  Flag,
  Flower2,
  Heart,
  History,
  Info,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  GameMobileTopbar,
  GameMobileTopbarCountdown,
} from '@/components/GameUI/GameMobileTopbar';
import { CardBack, Hearts, PlayingCard, Portrait } from '../../components/Card';
import { Dialog } from '../../components/Dialog';
import { useLoveLetterPlayUI } from '../../hooks/useLoveLetterPlayUI';
import type { LoveLetterSession } from '../../hooks/useLoveLetterSession';
import { isMyTurn, publicCardCount } from '../../model/selectors';
import { playerLabel, type GameSnapshot } from '../../model/session';
import { ROLES, role } from '../../model/roles';
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

const actionText = (data: GameSnapshot) => {
  const phase = data.roomData.gameStatus;
  if (!isMyTurn(data)) {
    return `${playerLabel(data.roomData.currentPlayer, data.roomData.players)} 正在斟酌`;
  }
  if (phase === 'draw') return '轮到你，先摸一张';
  if (phase === 'play') return '轮到你，选一张牌打出';
  if (phase === 'chancellor') return '大臣：留一张，其余沉底';
  return '等待下一封信';
};

export function Play({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending,
}: {
  session: LoveLetterSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch: () => void;
  startNextMatchPending: boolean;
}) {
  const ui = useLoveLetterPlayUI(session, data);
  const phase = data.roomData.gameStatus;
  const myTurn = isMyTurn(data);
  const enabled = session.connection.status === 'connected' && !session.pending;
  const active = enabled && myTurn;
  const countdown = useCountdown(data.roomData.turnDeadline);
  const roundCountdown = useCountdown(data.roomData.roundTransitionDeadline);
  const self = data.playerData[data.playerId];
  const hand = data.privateData.hand ?? [];
  const opponents = data.roomData.playerOrder.filter(id => id !== data.playerId);
  const selectedRole = ui.selectedCard ? role(ui.selectedCard.rank) : undefined;

  if ((phase === 'roundEnd' || phase === 'end') && !ui.reviewing) {
    return <Results data={data} enabled={enabled} countdown={roundCountdown}
      onExit={onLeave} onReview={() => ui.setReviewing(true)}
      onNextRound={() => session.submit('game_next_round')}
      onRematch={onStartNextMatch}
      rematchPending={startNextMatchPending} />;
  }

  const chooseCard = (card: typeof hand[number]) =>
    ui.chooseCard(card, window.matchMedia('(max-width: 767px)').matches);
  const targetName = playerLabel(ui.targetPlayerID, data.roomData.players);
  const actionPanel = <ActionPanel
    data={data}
    enabled={enabled}
    active={active}
    selectedRole={selectedRole}
    ui={ui}
    onDraw={() => session.submit('game_draw_card')}
  />;

  return <div className="ll-play" data-testid="loveletter-play">
    <GameMobileTopbar
      onBack={onLeave}
      backLabel="离开对局"
      kicker="THE ROSE COURT · 玫瑰庭院"
      title={`第 ${String(data.roomData.roundNo).padStart(2, '0')} 轮 · ${
        phase === 'end' ? '终局回看' : '心意未明'}`}
      status={phase !== 'roundEnd' && phase !== 'end' && myTurn && countdown
        ? <GameMobileTopbarCountdown>{countdown}</GameMobileTopbarCountdown>
        : undefined}
      actions={<>
        <button type="button" aria-label="公开记录" title="公开记录"
          onClick={() => ui.setPanel('log')}><History size={18} /></button>
        <button type="button" aria-label="角色速查" title="角色速查"
          onClick={() => ui.setPanel('reference')}><BookOpen size={18} /></button>
        <button type="button" aria-label="对局菜单" title="对局菜单"
          onClick={onLeave}><MoreHorizontal size={20} /></button>
      </>}
    />
    <header className="ll-game-header" data-game-desktop-topbar>
      <button type="button" aria-label="离开对局" onClick={onLeave}>
        <ArrowLeft size={20} /></button>
      <div><small>THE ROSE COURT / 玫瑰庭院</small>
        <h1>第 {String(data.roomData.roundNo).padStart(2, '0')} 轮
          <span>·</span>{phase === 'end' ? '终局回看' : '心意未明'}</h1></div>
      <span className="ll-game-goal"><Heart size={14} />目标 {data.roomData.goal} 枚</span>
      {countdown && <b className="ll-game-timer">{countdown}</b>}
      <button type="button" aria-label="公开记录" onClick={() => ui.setPanel('log')}>
        <History size={18} /></button>
      <button type="button" aria-label="角色速查" onClick={() => ui.setPanel('reference')}>
        <BookOpen size={18} /></button>
      <button type="button" aria-label="对局菜单" onClick={onLeave}>
        <MoreHorizontal size={20} /></button>
    </header>

    {session.feedback && <div className="ll-game-toast" role="alert">{session.feedback}</div>}
    {phase === 'end' && ui.reviewing && <button className="ll-review-banner"
      type="button" onClick={() => ui.setReviewing(false)}>
      正在查看终局牌桌 · 返回结算<ArrowRight size={14} /></button>}

    <main className="ll-game-layout"><div className="ll-game-left">
      <section className={`ll-court players-${data.roomData.playerOrder.length}`}>
        <div className="ll-court-decoration"><Flower2 /><span>PALM LETTER</span><Flower2 /></div>
        <div className="ll-opponents">{opponents.map(id => {
          const value = data.playerData[id];
          const roomPlayer = data.roomData.players[id];
          const selectable = !!ui.selectedCard && ui.legalTargets.includes(id);
          return <button type="button" key={id}
            className={`ll-table-seat ${
              data.roomData.currentPlayer === id ? 'current' : ''} ${
              !value?.alive ? 'out' : ''} ${value?.protected ? 'protected' : ''} ${
              ui.targetPlayerID === id ? 'targeted' : ''} ${selectable ? 'selectable' : ''}`}
            onClick={() => selectable
              ? ui.setTargetPlayerID(id)
              : ui.openPlayer(id)}>
            <span className="ll-avatar-wrap"><Portrait rank={roomPlayer?.seatIndex ?? 0} />
              {value?.protected && <i><Shield size={11} /></i>}</span>
            <strong>{playerLabel(id, data.roomData.players)}</strong>
            <Hearts value={value?.favors} total={data.roomData.goal} />
            <small>{!value?.alive ? '本轮出局' : value?.protected ? '侍女保护中'
              : data.roomData.currentPlayer === id ? '正在行动' : `${value?.handCount ?? 0} 张手牌`}</small>
            <span className="ll-seat-cards">{value?.alive && <CardBack small />}
              {value?.discards.slice(-3).map(card =>
                <i key={card.cardID} title={role(card.rank).name}>{card.rank}</i>)}</span>
          </button>;
        })}</div>
        <div className="ll-deck-area">
          <span className="ll-reserve"><CardBack small />
            <small>封存 {data.roomData.reserveCount} 张</small></span>
          <button type="button"
            className={`ll-main-deck ${active && phase === 'draw' ? 'can-draw' : ''}`}
            disabled={!active || phase !== 'draw'}
            onClick={() => session.submit('game_draw_card')}
            aria-label="从牌堆摸一张"><CardBack />
            <small>{active && phase === 'draw' ? '轻点摸牌' : '待传的信'}</small></button>
          <span className="ll-deck-count"><b>{String(data.roomData.deckCount).padStart(2, '0')}</b>
            <small>牌堆剩余</small></span>
        </div>
        <footer><span><LockKeyhole size={11} />在线权威牌局 · 私密视图</span>
          <span>{Object.values(data.playerData).filter(player => player.alive).length} 位仍在本轮</span></footer>
      </section>

      <section className="ll-hand">
        <header><Portrait rank={data.roomData.players[data.playerId]?.seatIndex ?? 9} />
          <div><h2>{playerLabel(data.playerId, data.roomData.players)}
            <small>{myTurn ? '正在行动' : '执笔人'}</small></h2>
            <Hearts value={self?.favors} total={data.roomData.goal} /></div>
          <span className="ll-hand-private"><LockKeyhole size={11} />仅你可见</span></header>
        <div className="ll-hand-cards">{self?.alive
          ? hand.map((card, index) => <div key={card.cardID}>
            <small>{hand.length > 1 ? index === 0 ? '原有手牌' : '刚刚摸到' : '留在手中的信'}</small>
            <PlayingCard card={card} selected={ui.selectedCardID === card.cardID}
              disabled={!active || phase !== 'play'
                || !data.privateData.legalCardIDs.includes(card.cardID)}
              onClick={() => chooseCard(card)} />
          </div>)
          : <div className="ll-eliminated"><Flag size={26} />
            <h3>这一轮，先静观其变。</h3><p>你已出局，下一轮会重新收到一封信。</p></div>}</div>
        <p><LockKeyhole size={11} />{phase === 'play' && active
          ? '点击选择，不会立刻打出' : '手牌只来自服务端私密视图'}</p>
      </section>

      <button className="ll-activity" type="button" onClick={() => ui.setPanel('log')}>
        <Feather size={14} /><span>{data.roomData.lastData?.summary || '等待第一封信出发。'}</span>
        <b>庭院动态<ChevronRight size={14} /></b></button>
    </div>

    <aside className="ll-game-right">
      <section className="ll-action-panel">{actionPanel}</section>
      <Clues data={data} onReference={() => ui.setPanel('reference')} />
    </aside></main>

    <footer className="ll-mobile-dock"><div><b>{actionText(data)}</b>
      <small>{countdown ? `阶段剩余 ${countdown}` : '选择以服务端最新状态为准'}</small></div>
      {active && phase === 'draw'
        ? <ActionButton variant="primary" onClick={() =>
          session.submit('game_draw_card')}>摸牌<Plus size={15} /></ActionButton>
        : active && phase === 'play'
          ? <ActionButton onClick={() => ui.selectedCard
            ? ui.setPanel('action') : ui.setPanel('reference')}>
            {ui.selectedCard ? '继续选择' : '角色速查'}<BookOpen size={15} /></ActionButton>
          : <ActionButton onClick={() => ui.setPanel('reference')}>
            角色速查<BookOpen size={15} /></ActionButton>}
    </footer>

    {ui.panel === 'action' && ui.selectedCard && <Dialog title="写下你的选择"
      className="ll-action-sheet" onClose={ui.clearSelection}>
      {actionPanel}
    </Dialog>}
    {ui.panel === 'reference' && <ReferenceDialog onClose={() => ui.setPanel(undefined)} />}
    {ui.panel === 'clues' && <Dialog title="每一张公开的信，都是线索"
      onClose={() => ui.setPanel(undefined)}>
      <Clues data={data} full onReference={() => ui.setPanel('reference')} />
    </Dialog>}
    {ui.panel === 'log' && <Dialog title="庭院动态 · 本轮公开记录"
      onClose={() => ui.setPanel(undefined)}>
      <p className="ll-private-note"><LockKeyhole size={13} />
        神父查看与男爵比较的具体牌值不会进入公开记录。</p>
      <ol className="ll-log-list">{data.roomData.activityLog
        .filter(item => item.roundNo === data.roomData.roundNo)
        .map((item, index) => <li key={item.id}><span>{String(index + 1).padStart(2, '0')}</span>
          <p><b>{playerLabel(item.playerID, data.roomData.players)}</b>
            {item.summary || item.kind}{item.automatic && <small>超时托管</small>}</p></li>)}</ol>
    </Dialog>}
    {ui.panel === 'player' && <PlayerDialog data={data} playerID={ui.playerID}
      onClose={() => ui.setPanel(undefined)} />}
    {ui.panel === 'private' && data.privateData.effect && <Dialog
      title="只给你看的秘密" className="ll-secret-dialog"
      onClose={() => ui.setPanel(undefined)}
      footer={<ActionButton variant="primary" onClick={() => ui.setPanel(undefined)}>
        记住了，收起秘密<EyeOff size={15} /></ActionButton>}>
      <div className="ll-secret"><LockKeyhole size={14} />
        <span>不会向其他玩家公开</span>
        {data.privateData.effect.targetRank != null
          && <PlayingCard rank={data.privateData.effect.targetRank} />}
        <h3>{data.privateData.effect.kind === 'baron' ? '男爵完成了秘密比较' : '神父看见了这封信'}</h3>
        <p>{data.privateData.effect.summary}
          {data.privateData.effect.actorRank != null
            && ` 你的手牌点数为 ${data.privateData.effect.actorRank}。`}</p></div>
    </Dialog>}
    {ui.panel === 'chancellor' && phase === 'chancellor' && myTurn && <Dialog
      title="大臣 · 留一封，其余沉底" wide className="ll-chancellor-dialog">
      <p className="ll-private-note"><LockKeyhole size={13} />
        仅你可见。选择保留牌，其余按显示顺序放回牌堆底。</p>
      <div className="ll-chancellor-cards">{hand.map(card =>
        <PlayingCard key={card.cardID} card={card}
          selected={ui.keepCardID === card.cardID}
          onClick={() => ui.setKeepCardID(card.cardID)}
          label={`保留${role(card.rank).name}`} />)}</div>
      {ui.keepCardID && <div className="ll-bottom-order"><span>较早摸到 → 最后摸到</span>
        <div>{ui.bottomCards.map(card =>
          <b key={card.cardID}>{card.rank} · {role(card.rank).name}</b>)}
          {!ui.bottomCards.length && <b>没有其他牌需要放回</b>}</div>
        {ui.bottomCards.length > 1 && <button type="button"
          onClick={() => ui.setReverseBottom(!ui.reverseBottom)}>
          <RotateCcw size={13} />交换沉底顺序</button>}</div>}
      <ActionButton variant="primary" disabled={!ui.keepCardID || !enabled}
        onClick={ui.settleChancellor}>保留所选，确认沉底<ArrowDown size={15} /></ActionButton>
    </Dialog>}
    {ui.selectedCard?.rank === 9 && ui.panel === 'action' && <span className="sr-only">
      打出公主将立即出局
    </span>}
    {targetName && <span className="sr-only">当前目标 {targetName}</span>}
  </div>;
}

function ActionPanel({
  data,
  active,
  enabled,
  selectedRole,
  ui,
  onDraw,
}: {
  data: GameSnapshot;
  active: boolean;
  enabled: boolean;
  selectedRole?: ReturnType<typeof role>;
  ui: ReturnType<typeof useLoveLetterPlayUI>;
  onDraw: () => void;
}) {
  const phase = data.roomData.gameStatus;
  if (!active) return <div className="ll-waiting"><span className="ll-eyebrow">THE LETTER IS TRAVELLING</span>
    <Portrait rank={data.roomData.players[data.roomData.currentPlayer]?.seatIndex ?? 0} />
    <h2>{phase === 'end' ? '正在查看终局牌桌'
      : `${playerLabel(data.roomData.currentPlayer, data.roomData.players)} 正在斟酌`}</h2>
    <p>牌桌保持只读，服务端会在阶段变化后同步最新状态。</p>
    <span>· · ·</span></div>;
  if (phase === 'draw') return <><span className="ll-eyebrow">YOUR TURN / 01</span>
    <h2>轮到你，先摸一张。</h2><p>摸一张牌，再从手中的两张里选一张打出。</p>
    <div className="ll-draw-illustration"><CardBack /><Feather /></div>
    <ActionButton variant="primary" disabled={!enabled} onClick={onDraw}>
      摸一张牌<Plus size={16} /></ActionButton></>;
  if (phase === 'chancellor') return <><span className="ll-eyebrow">CHANCELLOR</span>
    <h2>留下一封最合适的。</h2><p>大臣的候选牌只对你可见，请在私密面板完成选择。</p></>;
  if (!ui.selectedCard || !selectedRole) return <><span className="ll-eyebrow">YOUR TURN / 02</span>
    <h2>轮到你，落笔吧。</h2><p>选一张手牌打出，把另一张身份留作秘密。</p>
    <div className="ll-turn-steps"><span><i>1</i>选择手牌</span>
      <span><i>2</i>按需选择目标</span><span><i>3</i>确认出牌</span></div>
    <div className="ll-quote"><Flower2 size={21} /><p>“留在手里的，<br />才是你真正的心意。”</p></div></>;
  return <><div className="ll-action-title"><span className="ll-eyebrow">PLAY YOUR LETTER</span>
    <button type="button" onClick={ui.clearSelection}>重选</button></div>
    <h2><i>{selectedRole.rank}</i>{selectedRole.name}<small>{selectedRole.verb}</small></h2>
    <p>{selectedRole.effect}</p>
    {ui.requiresTarget && <div className="ll-targets"><label>01 · 选择目标</label>
      <div>{data.roomData.playerOrder.map(id => {
        const value = data.playerData[id];
        const legal = ui.legalTargets.includes(id);
        return <button key={id} type="button" disabled={!legal}
          className={ui.targetPlayerID === id ? 'active' : ''}
          onClick={() => ui.setTargetPlayerID(id)}>
          <span>{playerLabel(id, data.roomData.players)}{id === data.playerId && '（自己）'}</span>
          {!value?.alive ? <small>已出局</small> : value.protected
            ? <Shield size={12} /> : ui.targetPlayerID === id && <Check size={13} />}</button>;
      })}</div></div>}
    {selectedRole.rank === 1 && ui.legalTargets.length > 0 && ui.targetPlayerID
      && <div className="ll-guesses"><label>02 · 猜测角色</label><div>
        {data.privateData.guardGuessRanks.map(rankValue =>
          <button type="button" key={rankValue}
            className={ui.guessRank === rankValue ? 'active' : ''}
            onClick={() => ui.setGuessRank(rankValue)}>
            <b>{rankValue}</b><span>{role(rankValue).name}</span></button>)}</div>
        <small>不能猜卫兵；密探（0）可以被猜中。</small></div>}
    {[1, 2, 3, 7].includes(selectedRole.rank) && !ui.legalTargets.length
      && <div className="ll-action-notice"><Info size={14} />
        所有其他玩家均受保护或已出局；可以打出，但不产生效果。</div>}
    {selectedRole.rank === 9 && <div className="ll-action-notice danger">
      <Flag size={15} />弃掉公主会立即出局，这个选择无法撤回。</div>}
    <div className="ll-action-confirm"><p>{ui.canSubmit
      ? selectedRole.rank === 1 && ui.targetPlayerID
        ? `向 ${playerLabel(ui.targetPlayerID, data.roomData.players)} 猜测「${role(ui.guessRank ?? 0).name}」`
        : `确认打出「${selectedRole.name}」`
      : ui.requiresTarget && !ui.targetPlayerID ? '请先选择一位有效目标' : '完成所需选择后再确认'}</p>
      <ActionButton variant={selectedRole.rank === 9 ? 'danger' : 'primary'}
        disabled={!ui.canSubmit || !enabled} onClick={ui.submitCard}>
        {selectedRole.rank === 9 ? '确认弃掉公主并出局' : `确认打出${selectedRole.name}`}
        <ArrowRight size={15} /></ActionButton></div></>;
}

function Clues({
  data,
  full,
  onReference,
}: {
  data: GameSnapshot;
  full?: boolean;
  onReference: () => void;
}) {
  return <section className="ll-clues"><header><h3>公开线索</h3>
    <span>公开 / 总张数</span></header><div>{ROLES.map(item =>
      <button type="button" key={item.rank} onClick={onReference}>
        <b>{item.rank}</b><span>{item.name}</span>
        <small><strong>{publicCardCount(data, item.rank)}</strong> / {item.count}</small>
      </button>)}</div><p><Info size={11} />仅统计公开弃牌与 2 人局公开移出牌。</p>
    {full && !!data.roomData.burnCards.length && <aside><span>公开移出：</span>
      {data.roomData.burnCards.map(card =>
        <b key={card.cardID}>{card.rank} {role(card.rank).name}</b>)}</aside>}
  </section>;
}

function ReferenceDialog({ onClose }: { onClose: () => void }) {
  const [detail, setDetail] = useState<number>();
  const content: ReactNode = detail == null
    ? <div className="ll-reference-grid">{ROLES.map(item =>
      <button type="button" key={item.rank} onClick={() => setDetail(item.rank)}>
        <Portrait rank={item.rank} /><span><b>{item.rank} · {item.name}</b>
          <small>{item.short}</small></span><i>×{item.count}</i></button>)}</div>
    : <div className="ll-card-detail"><PlayingCard rank={detail} /><div>
      <span className="ll-eyebrow">{role(detail).en} / {role(detail).count} COPIES</span>
      <h2>{role(detail).verb}，是一种选择。</h2><p>{role(detail).effect}</p>
      <button type="button" onClick={() => setDetail(undefined)}>
        <ArrowLeft size={14} />返回角色列表</button></div></div>;
  return <Dialog title={detail == null ? '宫廷角色速查' : `${role(detail).name} · 角色详情`}
    wide onClose={onClose}>{content}</Dialog>;
}

function PlayerDialog({
  data,
  playerID,
  onClose,
}: {
  data: GameSnapshot;
  playerID: string;
  onClose: () => void;
}) {
  const value = data.playerData[playerID];
  return <Dialog title={`${playerLabel(playerID, data.roomData.players)} · 公开信息`}
    onClose={onClose}><div className="ll-player-dialog">
      <Portrait rank={data.roomData.players[playerID]?.seatIndex ?? 0} />
      <div><h2>{playerLabel(playerID, data.roomData.players)}</h2>
        <Hearts value={value?.favors} total={data.roomData.goal} />
        <p>{!value?.alive ? '本轮已经出局' : value.protected
          ? '侍女保护中，直到自己的下一回合开始' : '仍在本轮，手牌身份保密'}</p></div></div>
    <h3 className="ll-dialog-section-title">本轮公开弃牌</h3>
    <div className="ll-public-cards">{value?.discards.length
      ? value.discards.map(card => <span key={card.cardID}>
        <b>{card.rank}</b>{role(card.rank).name}</span>)
      : <p>还没有公开弃牌。</p>}</div>
    {value?.spyUsed && value.alive && <p className="ll-private-note">
      使用过密探；是否获得奖励将在轮末统一判定。</p>}
  </Dialog>;
}
