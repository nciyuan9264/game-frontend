import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Flag,
  History,
  Maximize2,
  MoreHorizontal,
  Repeat2,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import TurnCountdown from '@/components/TurnCountdown';
import { GameMobileTopbar } from '@/components/GameUI/GameMobileTopbar';
import { Board } from '../../components/Board';
import {
  Brand,
  Torii,
} from '../../components/Artwork';
import {
  CardArtwork,
  MiniGrid,
  MoveCard,
} from '../../components/MoveCard';
import { Dialog } from '../../components/Dialog';
import type { OnitamaSession } from '../../hooks/useOnitamaSession';
import { useOnitamaPlayUI } from '../../hooks/useOnitamaPlayUI';
import {
  CARDS,
  coordinate,
  otherSide,
  sideColorName,
  sideName,
} from '../../model/cards';
import {
  currentSide,
  legalMoveAt,
  phaseCopy,
  pieceByID,
  piecesForSide,
  playerForSide,
  viewerSide,
} from '../../model/selectors';
import {
  playerLabel,
  playerName,
  type GameSnapshot,
} from '../../model/session';
import type {
  CardID,
  Side,
} from '../../model/types';
import { Results } from '../Results';

function PlayerStrip({
  data,
  side,
  view,
}: {
  data: GameSnapshot;
  side: Side;
  view: Side;
}) {
  const playerID = playerForSide(data, side);
  const player = data.roomData.players[playerID];
  const state = data.playerData[playerID];
  const active = data.roomData.gameStatus === 'playing'
    && data.roomData.currentPlayer === playerID;
  const pieces = piecesForSide(data, side);
  return <div className={`player-strip ${side} ${active ? 'active' : ''}`}>
    <span className={`avatar ${side}`}>
      {playerName(playerID, data.roomData.players).slice(0, 1)}
    </span>
    <div className="player-name">
      <strong>{playerName(playerID, data.roomData.players)}
        <small>{side === view ? '你' : '对手'}</small>
      </strong>
      <span>{sideColorName(side)} · 宗师 {
        state?.masterAlive ? 1 : 0
      } / 弟子 {pieces.filter(piece => piece.kind === 'student').length}{
        player?.ai ? ' · AI' : ''
      }</span>
    </div>
    <span className="player-state"><i />{
      active ? '正在行棋' : '静候一式'
    }</span>
  </div>;
}

function MoveJournal({
  data,
  full = false,
}: {
  data: GameSnapshot;
  full?: boolean;
}) {
  const entries = full
    ? data.roomData.moveLog
    : data.roomData.moveLog.slice(-5);
  if (!entries.length) {
    return <div className="history-empty">
      <span>—</span>
      <p>第一式，尚未落下。</p>
      <small>走过的每一步，都会留在这里。</small>
    </div>;
  }
  return <div className="move-history">{entries.map(entry =>
    <div className="history-line" key={entry.id}>
      <small>{String(entry.id).padStart(2, '0')}</small>
      <i className={`side-dot ${entry.side}`} />
      <strong>{entry.cardID ? CARDS[entry.cardID].name : sideName(entry.side)}</strong>
      <span>{entry.kind === 'move'
        ? `${coordinate(entry.from)} → ${coordinate(entry.to)}`
        : entry.kind === 'pass'
          ? '换牌跳过'
          : '认输结束'}</span>
      {entry.capturedPieceID && <span className="capture-symbol">擒</span>}
      {entry.automatic && <span className="automatic-symbol">托管</span>}
    </div>)}</div>;
}

function CardDetailDialog({
  id,
  flipped,
  onFlip,
  onClose,
}: {
  id: CardID;
  flipped: boolean;
  onFlip: () => void;
  onClose: () => void;
}) {
  const card = CARDS[id];
  return <Dialog
    title={`${card.name} · ${card.englishName}`}
    eyebrow="READ THE MOVEMENT"
    onClose={onClose}
    footer={<button type="button" className="button full" onClick={onFlip}>
      <Repeat2 size={16} />
      {flipped ? '切换为自己的方向' : '切换为对手方向'}
    </button>}
  >
    <div className="card-detail-art">
      <CardArtwork id={id} />
      <div>
        <span className="detail-direction">
          {flipped ? <ArrowDown size={15} /> : <ArrowUp size={15} />}
          {flipped ? '对手方向' : '执牌者方向'}
        </span>
        <MiniGrid id={id} flipped={flipped} side={flipped ? 'red' : 'blue'} />
      </div>
    </div>
    <p className="card-description">{card.description}</p>
    <div className="detail-legend">
      <span><i className="origin-swatch" />当前棋子</span>
      <span><i className="move-swatch" />可落位置</span>
      <span>仅落点吃子</span>
    </div>
    <p className="modal-footnote">
      对手方向旋转 180°。插图保持正向，走法按棋盘方向显示。
    </p>
  </Dialog>;
}

export function Play({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending = false,
}: {
  session: OnitamaSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch?: () => Promise<boolean>;
  startNextMatchPending?: boolean;
}) {
  const ui = useOnitamaPlayUI(data);
  const ended = data.roomData.gameStatus === 'end';
  const view = viewerSide(data);
  const activeSide = currentSide(data);
  const opponent = otherSide(view);
  const myTurn = data.roomData.currentPlayer === data.playerId;
  const connected = session.connection.status === 'connected';
  const interactive = !ended
    && data.roomData.gameStatus === 'playing'
    && myTurn
    && connected
    && !session.pending;
  const noMoves = interactive && data.roomData.canPass;
  const selectedPiece = pieceByID(data, ui.selectedPiece);
  const pendingMove = legalMoveAt(
    data,
    ui.selectedCard,
    ui.selectedPiece,
    ui.pendingTarget,
  );
  const ownHand = data.roomData.hands[view];
  const opponentHand = data.roomData.hands[opponent];
  const [phaseTitle, phaseDescription] = phaseCopy(data);

  const commit = () => {
    if (!interactive || !ui.selectedCard) return;
    const accepted = noMoves
      ? session.submit('game_pass', { cardID: ui.selectedCard })
      : pendingMove
        ? session.submit('game_move_piece', {
            cardID: pendingMove.cardID,
            pieceID: pendingMove.pieceID,
            to: pendingMove.to,
          })
        : false;
    if (accepted) ui.clearSelection();
  };

  const clickCell: Parameters<typeof Board>[0]['onCell'] = (cell, piece) => {
    if (!interactive) return;
    if (piece?.side === activeSide) {
      ui.selectPiece(piece.id);
      return;
    }
    if (ui.selectedCard && ui.selectedPiece) {
      const move = legalMoveAt(data, ui.selectedCard, ui.selectedPiece, cell);
      if (move) {
        ui.selectTarget(cell);
        return;
      }
    }
    session.setFeedback(
      !ui.selectedCard
        ? '先选一张招式卡，或先选自己的棋子。'
        : !ui.selectedPiece
          ? '请选择一枚自己的棋子。'
          : '这里不是当前招式的合法落点。',
    );
  };

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
        || target.isContentEditable
      ) {
        return;
      }
      if (event.key === 'Escape') ui.clearSelection();
      if (
        interactive
        && (event.key === '1' || event.key === '2')
      ) {
        const card = ownHand[Number(event.key) - 1];
        if (card) ui.selectCard(card);
      }
      if (event.key === 'Enter' && (pendingMove || noMoves)) commit();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  if (ended && ui.showResults) {
    return <Results
      data={data}
      onViewBoard={() => ui.setShowResults(false)}
      onRestart={onStartNextMatch}
      restarting={startNextMatchPending}
    />;
  }

  const board = (small = false) => <Board
    pieces={data.roomData.pieces}
    view={view}
    selectedPiece={ui.selectedPiece}
    legalMoves={
      ui.selectedCard && ui.selectedPiece
        ? ui.legalMoves
        : []
    }
    pendingMove={pendingMove}
    lastAction={data.roomData.lastAction}
    interactive={interactive}
    small={small}
    onCell={clickCell}
  />;

  const selectOwnCard = (id: CardID) => {
    if (interactive) ui.selectCard(id);
    else ui.inspectCard(id);
  };

  const hand = (
    ids: CardID[],
    side: Side,
    own: boolean,
  ) => ids.map((id, index) => <MoveCard
    key={id}
    id={id}
    side={side}
    flipped={!own}
    compact={!own}
    mini={!own}
    selected={own && ui.selectedCard === id}
    shortcut={own ? String(index + 1) : undefined}
    label={own ? `使用${CARDS[id].name}` : `查看${CARDS[id].name}详解`}
    onClick={() => own ? selectOwnCard(id) : ui.inspectCard(id, true)}
  />);

  const actionLabelText = session.pending
    ? '等待服务端确认'
    : !connected
      ? '等待连接恢复'
      : !myTurn
        ? '等待对手行动'
        : noMoves
          ? ui.selectedCard
            ? '换牌并跳过'
            : '选择一张卡'
          : pendingMove
            ? pendingMove.winning
              ? '落子并结束对局'
              : '落子并换牌'
            : '选择招式、棋子与落点';
  const canCommit = interactive
    && !!ui.selectedCard
    && (noMoves || !!pendingMove);
  const instruction = session.pending
    ? '行动已发送，等待权威快照确认。'
    : !connected
      ? '连接暂时中断，棋盘保持只读。'
      : !myTurn
        ? phaseDescription
        : noMoves
          ? ui.selectedCard
            ? `${CARDS[ui.selectedCard].name}将与公共牌交换，本回合跳过。`
            : '两张手牌均无合法走法，请选一张完成交换。'
          : pendingMove && selectedPiece
            ? `${coordinate(selectedPiece.cell)} → ${coordinate(pendingMove.to)} · ${
              pendingMove.winning ? '胜利预览' : '确认后换牌'
            }`
            : ui.selectedCard && ui.selectedPiece
              ? '请选择棋盘上亮起的合法落点。'
              : ui.selectedCard
                ? `已选${CARDS[ui.selectedCard].name}，请选择一枚自己的棋子。`
                : ui.selectedPiece
                  ? '棋子已选，再选一张手中招式。'
                  : '先选招式或棋子，再选择服务端标出的落点。';

  return <div
    className="onitama-play"
    data-testid="game-page"
    data-turns={data.roomData.moveLog.length}
    data-blue-pieces={piecesForSide(data, 'blue').length}
    data-red-pieces={piecesForSide(data, 'red').length}
  >
    <GameMobileTopbar
      onBack={onLeave}
      backLabel="返回大厅"
      kicker={`ONITAMA · 第 ${data.roomData.roundNo} 局`}
      title={data.roomID}
      status={!ended && myTurn && data.roomData.turnDeadline
        ? <TurnCountdown deadline={data.roomData.turnDeadline} secondsOnly bare />
        : undefined}
      actions={<>
        <button type="button" className="icon-button" aria-label="查看行棋记录"
          title="查看行棋记录"
          onClick={() => ui.setPanel('activity')}><History size={18} /></button>
        <button type="button" className="icon-button" aria-label="规则速查"
          title="规则速查"
          onClick={() => ui.setPanel('rules')}><BookOpen size={18} /></button>
        {ended && <button type="button" className="icon-button"
          aria-label="返回终局结算" title="返回终局结算"
          onClick={() => ui.setShowResults(true)}><Trophy size={18} /></button>}
        {!ended && <button type="button" className="icon-button"
          aria-label="对局菜单" title="对局菜单"
          onClick={() => ui.setPanel('menu')}><MoreHorizontal size={20} /></button>}
      </>}
    />
    <header className="game-header" data-game-desktop-topbar>
      <button type="button" className="icon-button" aria-label="返回大厅"
        onClick={onLeave}><ArrowLeft size={19} /></button>
      <Brand small />
      <div className="game-header-title">
        <strong>山门对弈</strong>
        <span>房间 {data.roomID} · 第 {data.roomData.roundNo} 局</span>
      </div>
      <TurnCountdown
        deadline={data.roomData.turnDeadline}
        secondsOnly
        bare
      />
      <button type="button" className="icon-button" aria-label="查看行棋记录"
        onClick={() => ui.setPanel('activity')}><History size={18} /></button>
      <button type="button" className="icon-button" aria-label="规则速查"
        onClick={() => ui.setPanel('rules')}><BookOpen size={18} /></button>
      {ended && <button type="button" className="icon-button" aria-label="返回终局结算"
        onClick={() => ui.setShowResults(true)}><Trophy size={18} /></button>}
      {!ended && <button type="button" className="icon-button" aria-label="对局菜单"
        onClick={() => ui.setPanel('menu')}><MoreHorizontal size={20} /></button>}
    </header>

    <div className="game-titlebar">
      <div><span className="eyebrow">THE ART OF THE NEXT MOVE</span>
        <h1>山门对弈 <span className="badge">权威在线局</span></h1></div>
      <div className="game-top-actions">
        <button type="button" className="icon-button" aria-label="放大棋盘"
          onClick={() => ui.setPanel('zoom')}><Maximize2 size={18} /></button>
      </div>
    </div>

    <div className="game-layout">
      <aside className="opponent-column">
        <div className="column-head"><h3>对手的招式</h3>
          <span><ArrowDown size={12} />朝向与你相反</span></div>
        <div className="opponent-hand">{hand(opponentHand, opponent, false)}</div>
        <section className="history-panel">
          <div className="column-head"><h3>行棋记录</h3>
            <span>{data.roomData.moveLog.length} 步</span></div>
          <MoveJournal data={data} />
        </section>
        <div className="win-reminder"><Torii size={24} />
          <p>擒获对方宗师，<br />或让宗师进入对方山门。</p></div>
      </aside>

      <main className="board-column">
        <PlayerStrip data={data} side={opponent} view={view} />
        <div className={`board-meta ${myTurn ? 'is-your-turn' : ''}`}
          data-testid="onitama-turn-status-desktop" role="status" aria-live="polite">
          <span><i className={`side-dot ${activeSide}`} /><small>当前回合</small>
            <strong>{phaseTitle}</strong></span>
          <span>{sideName(activeSide)} <em>·</em>
            第 {data.roomData.moveLog.length + 1} 步 <em>·</em> 5 × 5</span>
        </div>
        {board()}
        <div className="board-legend">
          <span><i className="legend-dot" />可落点</span>
          <span><i className="legend-square" />上一步</span>
          <span><ArrowUp size={12} />你的前方</span>
        </div>
        <PlayerStrip data={data} side={view} view={view} />
        <div className="board-message"><ShieldCheck size={16} />
          <span>{instruction}</span></div>
      </main>

      <aside className="your-column">
        <div className="column-head"><h3>你的招式</h3>
          <button type="button" className="text-button"
            onClick={() => ui.inspectCard(ui.selectedCard ?? ownHand[0])}>
            走法说明<CircleHelp size={13} /></button></div>
        <div className="your-hand">{hand(ownHand, view, true)}</div>
        <div className={`exchange-panel ${pendingMove || noMoves ? 'will-exchange' : ''}`}>
          <div className="exchange-head"><Repeat2 size={15} />
            <strong>公共牌</strong>
            <span>{pendingMove?.winning ? '胜利后无需换牌' : '下次换入'}</span></div>
          <button type="button" className="exchange-card"
            onClick={() => ui.inspectCard(data.roomData.transitCardID)}>
            <CardArtwork id={data.roomData.transitCardID} />
            <div><strong>{CARDS[data.roomData.transitCardID].name}</strong>
              <small>{CARDS[data.roomData.transitCardID].englishName}</small></div>
            <MiniGrid id={data.roomData.transitCardID} side={view} />
            <ChevronRight size={15} />
          </button>
          <p>{pendingMove?.winning
            ? <><Flag size={12} />达成胜利，对局立即结束。</>
            : ui.selectedCard && (pendingMove || noMoves)
              ? <><span>{CARDS[ui.selectedCard].name}</span>交出
                <ArrowRight size={12} />
                <span>{CARDS[data.roomData.transitCardID].name}</span>入手</>
              : '走棋后，用过的招式与公共牌交换。'}</p>
        </div>
        <div className="action-box">
          <div className="action-caption" aria-live="polite">
            {pendingMove
              ? <><span className="badge">{pendingMove.winning ? '胜利预览' : '落子预览'}</span>
                <strong>{coordinate(selectedPiece?.cell)} → {coordinate(pendingMove.to)}</strong>
                <button type="button" aria-label="取消落点"
                  onClick={ui.clearSelection}><X size={13} /></button></>
              : <><i className="status-dot" /><span>{instruction}</span></>}
          </div>
          <button type="button" className="button primary action-submit"
            disabled={!canCommit} onClick={commit}>
            {actionLabelText}<ArrowRight size={17} />
          </button>
        </div>
      </aside>
    </div>

    <div className="mobile-game-table">
      <div className="mobile-opponent"><span><i className={`side-dot ${opponent}`} />
        <strong>{playerLabel(playerForSide(data, opponent), data.roomData.players)}</strong>
        <small>{sideName(opponent)} · {piecesForSide(data, opponent).length} 枚</small></span>
        <span><ArrowDown size={12} />对手向下</span></div>
      <div className="opponent-hand">{hand(opponentHand, opponent, false)}</div>
      {board()}
      <div className="mobile-public"><Repeat2 size={15} /><span>公共牌</span>
        <button type="button" onClick={() => ui.inspectCard(data.roomData.transitCardID)}>
          <strong>{CARDS[data.roomData.transitCardID].name}</strong>
          <MiniGrid id={data.roomData.transitCardID} side={view} />
        </button><small>{pendingMove?.winning
          ? '即将达成胜利'
          : ui.selectedCard && (pendingMove || noMoves)
            ? `${CARDS[ui.selectedCard].name} → ${CARDS[data.roomData.transitCardID].name}`
            : '走棋后换入'}</small></div>
      <div className={`mobile-turn ${myTurn ? 'is-your-turn' : ''}`}
        data-testid="onitama-turn-status-mobile" role="status" aria-live="polite">
        <span><i className={`side-dot ${activeSide}`} /><span className="mobile-turn-copy">
          <small>当前回合 · {sideName(activeSide)} · 第 {
            data.roomData.moveLog.length + 1
          } 步</small>
          <strong>{phaseTitle}</strong></span></span>
        <button type="button" className="text-button"
          onClick={() => ui.inspectCard(ui.selectedCard ?? ownHand[0])}>
          向上为前方<ArrowUp size={12} /></button></div>
      <div className="your-hand">{hand(ownHand, view, true)}</div>
      <div className="mobile-action-wrap">
        <div className="action-caption" aria-live="polite">
          {pendingMove
            ? <><span className="badge">{pendingMove.winning ? '胜利预览' : '落子预览'}</span>
              <strong>{coordinate(selectedPiece?.cell)} → {coordinate(pendingMove.to)}</strong>
              <button type="button" aria-label="取消落点"
                onClick={ui.clearSelection}><X size={13} /></button></>
            : <><i className="status-dot" /><span>{instruction}</span></>}
        </div>
        <button type="button" className="button primary action-submit"
          disabled={!canCommit} onClick={commit}>
          {actionLabelText}<ArrowRight size={17} />
        </button>
      </div>
    </div>

    {ui.cardDetail && <CardDetailDialog
      id={ui.cardDetail.id}
      flipped={ui.cardDetail.flipped}
      onFlip={() => ui.setCardDetail({
        ...ui.cardDetail!,
        flipped: !ui.cardDetail!.flipped,
      })}
      onClose={() => ui.setCardDetail(undefined)}
    />}
    {ui.panel === 'activity' && <Dialog title="行过的每一式。"
      eyebrow="THE MOVE JOURNAL" onClose={() => ui.setPanel(undefined)}
      footer={<button type="button" className="button full"
        onClick={() => ui.setPanel(undefined)}>回到棋盘</button>}>
      <MoveJournal data={data} full />
    </Dialog>}
    {ui.panel === 'rules' && <Dialog title="每一步，先看招式。"
      eyebrow="A QUICK REMINDER" onClose={() => ui.setPanel(undefined)}
      footer={<button type="button" className="button primary full"
        onClick={() => ui.setPanel(undefined)}>明白了，继续落子</button>}>
      <ol className="quick-rules">
        <li><span>1</span><div><strong>选一式，走一子</strong>
          <p>宗师和弟子均可使用手牌走法。亮起的是落点，不是路径。</p></div></li>
        <li><span>2</span><div><strong>落子后，自动换牌</strong>
          <p>用过的卡与公共牌交换，随后轮到对手。</p></div></li>
        <li><span>3</span><div><strong>擒宗师，或入山门</strong>
          <p>宗师进入对方起始山门也能取胜，弟子不行。</p></div></li>
      </ol>
      <p className="rule-small-note">
        可以越过棋子，不能出界或叠在己方棋子上。只有两张手牌都无路可走时，才可换牌并跳过。
      </p>
    </Dialog>}
    {ui.panel === 'menu' && <Dialog title="停一停，也无妨。"
      eyebrow="A MOMENT BETWEEN MOVES" onClose={() => ui.setPanel(undefined)}
      footer={<button type="button" className="button primary full"
        onClick={() => ui.setPanel(undefined)}>继续对弈</button>}>
      <div className="menu-options">
        <button type="button" onClick={() => ui.setPanel('activity')}>
          <History size={21} /><span><strong>完整棋谱</strong>
            <small>查看已经走过的每一式</small></span><ChevronRight size={18} /></button>
        <button type="button" onClick={() => ui.setPanel('rules')}>
          <BookOpen size={21} /><span><strong>规则速查</strong>
            <small>招式流转与两条胜路</small></span><ChevronRight size={18} /></button>
        <button type="button" onClick={() => ui.setPanel('resign')}>
          <Flag size={21} /><span><strong>认输结束</strong>
            <small>结束这盘棋，棋谱仍会保留</small></span><ChevronRight size={18} /></button>
      </div>
    </Dialog>}
    {ui.panel === 'resign' && <Dialog title="确定结束这一局？"
      eyebrow="CONCEDE THE GAME" onClose={() => ui.setPanel(undefined)}
      footer={<><button type="button" className="button"
        onClick={() => ui.setPanel(undefined)}>再想一想</button>
        <button type="button" className="button danger"
          disabled={!connected || !!session.pending}
          onClick={() => {
            if (session.submit('game_resign')) ui.setPanel(undefined);
          }}>确认认输</button></>}>
      <p className="modal-copy">
        {sideName(view)}将认输，对方获胜。终局棋盘与完整棋谱仍可回看。
      </p>
    </Dialog>}
    {ui.panel === 'zoom' && <Dialog title="山门棋盘"
      eyebrow="FOCUS ON THE BOARD" wide onClose={() => ui.setPanel(undefined)}>
      <div className="zoom-board">{board()}</div>
    </Dialog>}
  </div>;
}
