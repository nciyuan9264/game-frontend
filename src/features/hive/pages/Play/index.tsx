import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Flag,
  History,
  Info,
  Layers,
  Lightbulb,
  Maximize2,
  MoreHorizontal,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react';
import TurnCountdown from '@/components/TurnCountdown';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameMobileTopbar } from '@/components/GameUI/GameMobileTopbar';
import { Board } from '../../components/Board';
import { PlayerAvatar } from '../../components/AppShell';
import {
  Brand,
  Bug,
  Tile,
} from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import type { HiveSession } from '../../hooks/useHiveSession';
import { useHivePlayUI } from '../../hooks/useHivePlayUI';
import {
  PIECE_INFO,
  PIECE_KINDS,
  actionLabel,
  coordinate,
  findPiece,
  pieceKindFromID,
  pieceName,
  sideName,
} from '../../model/board';
import {
  currentSide,
  isLegalAction,
  legalActionsForPiece,
  optionAt,
  phaseCopy,
  placementPieceForKind,
  playerForSide,
  topPieceAt,
} from '../../model/selectors';
import {
  playerLabel,
  playerName,
  type GameSnapshot,
} from '../../model/session';
import type {
  Hex,
  PendingAction,
  Side,
} from '../../model/types';
import { Results } from '../Results';

function PlayerCard({
  data,
  side,
}: {
  data: GameSnapshot;
  side: Side;
}) {
  const playerID = playerForSide(data, side);
  const player = data.roomData.players[playerID];
  const state = data.playerData[playerID];
  const active = data.roomData.gameStatus === 'playing'
    && data.roomData.currentPlayer === playerID;
  const pressure = state?.queenPressure ?? 0;
  const reserve = state
    ? Object.values(state.reserveByKind).reduce((total, count) => total + count, 0)
    : 11;
  return <article className={`hive-player-card ${side} ${active ? 'active' : ''}`}>
    <span className="hive-player-stone"><Bug kind="queen" size={22} /></span>
    <div className="hive-player-name">
      <strong>{playerName(playerID, data.roomData.players)}
        {playerID === data.playerId && <em>你</em>}</strong>
      <small>{sideName(side)}{player?.ai ? ' · 行舟 AI' : ''}
        {active ? ' · 行动中' : ''}</small>
      <span>{state?.queenPlaced
        ? <><i className={`pressure-dots ${pressure >= 5 ? 'danger' : ''}`}>
          {Array.from({ length: 6 }, (_, index) =>
            <b className={index < pressure ? 'filled' : ''} key={index} />)}
        </i><em>{6 - pressure} 个气口</em></>
        : <em>蜂后未入场 · 第 2-4 手部署</em>}</span>
    </div>
    <div className="hive-player-inventory">
      {PIECE_KINDS.map(kind => <span key={kind}
        title={`${PIECE_INFO[kind].name}剩余 ${state?.reserveByKind[kind] ?? 0}`}>
        <Bug kind={kind} size={15} />
        <small>{state?.reserveByKind[kind] ?? 0}</small>
      </span>)}
    </div>
    <span className="hive-reserve-count">手中 {reserve}</span>
  </article>;
}

function Journal({
  data,
  full = false,
}: {
  data: GameSnapshot;
  full?: boolean;
}) {
  const entries = [...data.roomData.moveLog].reverse();
  const visible = full ? entries : entries.slice(0, 3);
  if (!visible.length) {
    return <p className="hive-journal-empty">第一枚棋子落下后，从这里记录。</p>;
  }
  return <ol className="hive-journal-list">
    {visible.map(entry => <li key={entry.id}>
      <small>{String(entry.id).padStart(2, '0')}</small>
      <span className={entry.side}><Bug
        kind={pieceKindFromID(entry.pieceID) ?? 'queen'} size={14} /></span>
      <div><strong>{actionLabel(entry)}</strong>
        <small>{playerLabel(entry.playerID, data.roomData.players)}
          {entry.automatic ? ' · 自动行动' : ''}</small></div>
    </li>)}
  </ol>;
}

const guideSections = [
  ['目标与蜂巢', '所有棋子必须始终组成一片相连的蜂巢。率先让六枚棋子占满对方蜂后周围六个气口，即可获胜。'],
  ['部署规则', '首枚棋子从中央开始。此后新虫必须接触己方且不能接触对方；蜂后不能首手部署，必须在本方第 2 至第 4 手入场。'],
  ['移动规则', '蜂后入场后才可移动。蜂后一步、蚂蚁任意步、甲虫一步且可登顶、蚱蜢直线跳跃、蜘蛛恰好三步。'],
  ['胜负与过手', '双方蜂后同手被围则和棋。没有合法行动时由服务端自动过手；双方连续无合法行动时和棋。'],
] as const;

function StackDetail({
  data,
  position,
}: {
  data: GameSnapshot;
  position?: Hex;
}) {
  const stack = data.roomData.stacks.find(item =>
    item.position.q === position?.q && item.position.r === position?.r);
  if (!stack) return <p className="hive-dialog-copy">这个位置当前没有棋子。</p>;
  return <div className="hive-stack-list">
    {[...stack.pieces].reverse().map((piece, index) =>
      <article key={piece.pieceID}>
        <small>第 {stack.pieces.length - index} 层</small>
        <span><Tile side={piece.side} kind={piece.kind} /></span>
        <div><strong>{sideName(piece.side)}{pieceName(piece.kind)}</strong>
          <p>{piece.pieceID} · {index === 0 ? '当前顶层' : '被甲虫覆盖'}</p></div>
      </article>)}
  </div>;
}

export function Play({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending = false,
}: {
  session: HiveSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch?: () => Promise<boolean>;
  startNextMatchPending?: boolean;
}) {
  const ui = useHivePlayUI(data);
  const ended = data.roomData.gameStatus === 'end';
  const side = currentSide(data);
  const mySide = data.playerData[data.playerId]?.side;
  const myState = data.playerData[data.playerId];
  const myTurn = data.roomData.currentPlayer === data.playerId;
  const connected = session.connection.status === 'connected';
  const interactive = !ended
    && data.roomData.gameStatus === 'playing'
    && myTurn
    && connected
    && !session.pending;
  const [, phaseDescription] = phaseCopy(data);
  const placePieceID = ui.mode === 'place'
    ? placementPieceForKind(data, ui.kind)
    : undefined;
  const activePieceID = ui.mode === 'place'
    ? placePieceID
    : ui.selectedPieceID;
  const options = legalActionsForPiece(data, activePieceID);
  const pendingLegal = !!ui.pending && isLegalAction(
    data.roomData.legalActions,
    ui.pending.kind,
    ui.pending.pieceID,
    ui.pending.to,
  );
  const selectedPiece = findPiece(data.roomData.stacks, ui.selectedPieceID);
  const selectedKind = ui.mode === 'place'
    ? ui.kind
    : selectedPiece?.piece.kind ?? 'ant';
  const queenDue = !!myState && !myState.queenPlaced && myState.turnsTaken >= 3;
  const canMove = !!myState?.queenPlaced
    && data.roomData.legalActions.some(option => option.kind === 'move');

  const chooseCell = (position: Hex) => {
    if (!interactive) return;
    if (activePieceID) {
      const selectedOption = optionAt(
        data.roomData.legalActions,
        ui.mode,
        activePieceID,
        position,
      );
      if (selectedOption) {
        ui.setPending({
          kind: selectedOption.kind,
          pieceID: selectedOption.pieceID,
          to: selectedOption.to,
          path: selectedOption.path,
        });
        return;
      }
    }
    if (ui.mode === 'move') {
      const piece = topPieceAt(data, position);
      if (
        piece
        && piece.side === side
        && data.roomData.legalActions.some(option =>
          option.kind === 'move' && option.pieceID === piece.pieceID)
      ) {
        ui.selectPiece(piece.pieceID);
      }
    }
  };

  const commit = (action: PendingAction) => {
    if (!interactive || !pendingLegal) return;
    const accepted = session.submit(
      action.kind === 'place' ? 'game_place_piece' : 'game_move_piece',
      { pieceID: action.pieceID, to: action.to },
    );
    if (accepted) ui.clearSelection();
  };

  const instruction = session.pending
    ? '行动已发送，正在等待服务端权威快照。'
    : !connected
      ? '连接暂时中断，棋盘保持只读。'
      : !myTurn
        ? phaseDescription
        : !data.roomData.legalActions.length
          ? '当前没有合法行动，服务端将自动过手。'
          : ui.pending
            ? `${ui.pending.kind === 'place' ? '部署' : '移动'}${pieceName(selectedKind)}到 ${coordinate(ui.pending.to)}，确认后生效。`
            : ui.mode === 'place'
              ? options.length
                ? `${options.length} 个合法落点。选中一处，再确认。`
                : queenDue && ui.kind !== 'queen'
                  ? '这是你的第 4 手，必须先部署蜂后。'
                  : '这类棋子当前没有合法部署位置。'
              : !ui.selectedPieceID
                ? '点击蜂巢中一枚可移动的己方棋子。'
                : options.length
                  ? `${options.length} 个合法落点。选中一处，再确认。`
                  : '这枚棋子当前没有合法移动。';

  const board = (readOnly = false, prefix = '') => <Board
    stacks={data.roomData.stacks}
    options={readOnly ? [] : options}
    selectedPieceID={readOnly ? undefined : ui.selectedPieceID}
    pending={readOnly ? undefined : ui.pending?.to}
    previewKind={selectedKind}
    previewSide={side}
    lastAction={data.roomData.lastAction}
    interactive={!readOnly && interactive}
    coordinates={ui.coordinates}
    showMoves={ui.showMoves}
    readOnly={readOnly}
    testPrefix={prefix}
    onCell={readOnly ? undefined : chooseCell}
  />;

  if (ended && ui.showResults) {
    return <Results data={data}
      onViewBoard={() => ui.setShowResults(false)}
      onRestart={onStartNextMatch}
      restarting={startNextMatchPending} />;
  }

  return <div className="hive-game-page" data-testid="hive-game-page"
    data-turns={data.roomData.moveLog.length}
    data-stacks={data.roomData.stacks.length}>
    <GameMobileTopbar
      onBack={onLeave}
      backLabel="返回大厅"
      kicker={`HIVE · 第 ${data.roomData.roundNo} 局`}
      title={data.roomID}
      status={!ended && data.roomData.turnDeadline
        ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
        : ended ? '已结束' : '--'}
      actions={<>
        <button type="button" aria-label="查看行棋记录" title="查看行棋记录"
          onClick={() => ui.setPanel('activity')}><History size={18} /></button>
        <button type="button" aria-label="玩法指南" title="玩法指南"
          onClick={() => ui.setPanel('rules')}><BookOpen size={18} /></button>
        {!ended && <button type="button" aria-label="打开对局菜单"
          title="打开对局菜单"
          onClick={() => ui.setPanel('menu')}><MoreHorizontal size={21} /></button>}
        {ended && <button type="button" aria-label="返回终局结算"
          title="返回终局结算"
          onClick={() => ui.setShowResults(true)}><Trophy size={17} /></button>}
      </>}
    />
    <header className="hive-game-header" data-game-desktop-topbar>
      <button type="button" aria-label="返回大厅" onClick={onLeave}>
        <ArrowLeft size={20} /></button>
      <Brand small />
      <span className="hive-header-divider" />
      <div className="hive-match-context"><strong>{data.roomID}</strong>
        <small>第 {data.roomData.roundNo} 局 · 120 秒回合</small></div>
      <span className="hive-header-space" />
      <span className="hive-authority"><i />服务端权威</span>
      <button type="button" aria-label="查看行棋记录"
        onClick={() => ui.setPanel('activity')}><History size={18} /></button>
      <button type="button" aria-label="玩法指南"
        onClick={() => ui.setPanel('rules')}><BookOpen size={18} /></button>
      {!ended && <button type="button" aria-label="打开对局菜单"
        onClick={() => ui.setPanel('menu')}><MoreHorizontal size={21} /></button>}
      {ended
        ? <button type="button" className="hive-result-return"
          onClick={() => ui.setShowResults(true)}><Trophy size={15} />
          <span>结算</span></button>
        : <span className="hive-turn-clock">
          <small>TIME</small>
          {data.roomData.turnDeadline
            ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
            : <b>--</b>}
        </span>}
      <PlayerAvatar name={playerName(data.playerId, data.roomData.players)}
        avatar={data.roomData.players[data.playerId]?.avatar}
        ai={data.roomData.players[data.playerId]?.ai} size={31} />
    </header>

    <main className="hive-game-main">
      <div className="hive-game-heading">
        <div><span>05 / AT THE TABLE</span>
          <h1>一片蜂巢，等你布局。</h1></div>
        <div><small>基础 22 枚 · 无扩展</small>
          <button type="button" aria-label="放大棋盘"
            onClick={() => ui.setPanel('zoom')}><Maximize2 size={18} /></button></div>
      </div>
      <div className="hive-stepbar" role="status">
        <span><i className={!myTurn ? 'thinking' : ''} />
          第 {data.roomData.moveLog.length + 1} 步 · {sideName(side)}行动</span>
        <small>{queenDue
          ? '这是本方第 4 手，请先部署蜂后。'
          : '棋子相连，就是棋盘。'}</small>
      </div>

      <div className="hive-game-grid">
        <section className="hive-table-column">
          <div className="hive-players-row">
            <PlayerCard data={data} side="white" />
            <span>vs.</span>
            <PlayerCard data={data} side="black" />
          </div>
          <div className="hive-arena">{board()}</div>
          <div className="hive-table-legend">
            <span><i className="white" />白方</span>
            <span><i className="black" />黑方</span>
            <span><i className="target" />合法落点</span>
            <span><Layers size={12} />数字为叠层层数</span>
            <small>气口 = 蜂后周围未被占据的邻位</small>
          </div>
          <div className="hive-table-footnote"><ShieldCheck size={15} />
            <span>连着，才是一局。任何移动都不能把蜂巢拆开。</span></div>
        </section>

        <aside className="hive-action-column">
          <section className="hive-action-panel"
            data-testid={interactive ? 'human-turn' : 'opponent-turn'}>
            <div className="hive-action-heading"><span>{
              myTurn ? `${sideName(side)} / YOUR MOVE` : 'OPPONENT’S TURN'
            }</span><h2>{!myTurn
              ? `${playerLabel(data.roomData.currentPlayer, data.roomData.players)}在思考。`
              : !data.roomData.legalActions.length
                ? '这一手，只能过手。'
                : queenDue
                  ? '先让蜂后入场。'
                  : ui.mode === 'place'
                    ? '让蜂巢，再长一格。'
                    : '调动你的虫群。'}</h2></div>
            <div className="hive-action-segment">
              <button type="button" aria-pressed={ui.mode === 'place'}
                disabled={!interactive}
                onClick={() => ui.setMode('place')}>部署新虫</button>
              <button type="button" aria-pressed={ui.mode === 'move'}
                disabled={!interactive || !canMove}
                onClick={() => ui.setMode('move')}>移动棋子</button>
            </div>
            {ui.mode === 'place'
              ? <div className="hive-reserve-tray">
                {PIECE_KINDS.map(kind => {
                  const count = myState?.reserveByKind[kind] ?? 0;
                  const legal = data.roomData.legalActions.some(option =>
                    option.kind === 'place'
                    && pieceKindFromID(option.pieceID) === kind);
                  return <button type="button" key={kind}
                    aria-label={`部署${PIECE_INFO[kind].name}`}
                    aria-pressed={ui.kind === kind}
                    disabled={!interactive || count <= 0 || !legal}
                    className={ui.kind === kind ? 'selected' : ''}
                    onClick={() => ui.setKind(kind)}>
                    <span><Tile kind={kind} side={mySide ?? side}
                      selected={ui.kind === kind} /><i>{count}</i></span>
                    <strong>{PIECE_INFO[kind].name}</strong>
                    <small>{kind === 'queen' && (myState?.turnsTaken ?? 0) === 0
                      ? '第 2 手起'
                      : PIECE_INFO[kind].move}</small>
                  </button>;
                })}
              </div>
              : <div className="hive-moving-piece">
                <span>{selectedPiece
                  ? <Tile kind={selectedPiece.piece.kind}
                    side={selectedPiece.piece.side}
                    layers={selectedPiece.stack.pieces.length} selected />
                  : <i><Bug kind="ant" size={29} /></i>}</span>
                <div><strong>{selectedPiece
                  ? `${sideName(selectedPiece.piece.side)}${pieceName(selectedPiece.piece.kind)}`
                  : '选择一枚己方棋子'}</strong>
                  <small>{selectedPiece
                    ? PIECE_INFO[selectedPiece.piece.kind].move
                    : '棋盘上的每枚虫，都有自己的步法。'}</small></div>
                {selectedPiece && <button type="button"
                  aria-label={`查看${pieceName(selectedPiece.piece.kind)}步法`}
                  onClick={() => ui.openInsect(selectedPiece.piece.kind)}>
                  <BookOpen size={17} /></button>}
              </div>}
            <div className={`hive-action-message ${ui.pending ? 'preview' : ''}`}
              data-testid="hive-action-status">
              <span>{ui.pending ? <Check size={15} />
                : !data.roomData.legalActions.length ? <Info size={15} />
                  : <Lightbulb size={15} />}</span>
              <p>{instruction}</p>
            </div>
            <div className="hive-action-aux">
              <button type="button" disabled={!interactive || !options.length}
                onClick={() => {
                  const first = options[0];
                  if (first) ui.setPending({
                    kind: first.kind,
                    pieceID: first.pieceID,
                    to: first.to,
                    path: first.path,
                  });
                }}><Lightbulb size={14} />预览建议落点</button>
              {selectedPiece && selectedPiece.stack.pieces.length > 1
                ? <button type="button"
                  onClick={() => ui.openStack(selectedPiece.stack.position)}>
                  <Layers size={14} />查看叠层</button>
                : <button type="button"
                  onClick={() => ui.openInsect(selectedKind)}>
                  <BookOpen size={14} />{pieceName(selectedKind)}步法</button>}
            </div>
            <div className={`hive-queen-clock ${queenDue ? 'due' : ''}`}>
              <Bug kind="queen" size={18} /><span>{myState?.queenPlaced
                ? '蜂后已入场，可以部署或移动。'
                : queenDue
                  ? '你的第 4 手 · 本手必须部署蜂后'
                  : `蜂后尚未入场 · 本方第 ${(myState?.turnsTaken ?? 0) + 1} 手`}
              </span>
            </div>
            <div className="hive-move-dock">
              <ActionButton disabled={!ui.pending}
                onClick={ui.clearSelection}><X size={15} />取消</ActionButton>
              <ActionButton variant="primary"
                disabled={!interactive || !ui.pending || !pendingLegal}
                pending={!!session.pending}
                data-click-sound="game-place"
                onClick={() => ui.pending && commit(ui.pending)}>
                {ui.pending
                  ? ui.pending.kind === 'place' ? '确认部署' : '确认移动'
                  : '选择合法落点'}<ArrowRight size={16} />
              </ActionButton>
            </div>
          </section>
          <section className="hive-insect-note">
            <span style={{ color: PIECE_INFO[selectedKind].color }}>
              <Bug kind={selectedKind} size={28} /></span>
            <div><small>{PIECE_INFO[selectedKind].english}</small>
              <strong>{pieceName(selectedKind)} · {PIECE_INFO[selectedKind].move}</strong>
              <p>{PIECE_INFO[selectedKind].detail}</p></div>
          </section>
          <section className="hive-recent-moves"><div>
            <h3>最近落子</h3><button type="button"
              onClick={() => ui.setPanel('activity')}>
              查看全部<ChevronRight size={13} /></button></div>
            <Journal data={data} />
          </section>
        </aside>
      </div>
      <footer className="hive-game-footer"><Brand small />
        <span>ONE HIVE · MANY PATHS</span>
        <span>基础版 22 枚 · 服务端权威</span></footer>
    </main>

    {ui.panel === 'activity' && <Dialog title="每一步，都长成蜂巢。"
      eyebrow="THE GAME JOURNAL" wide onClose={() => ui.setPanel(undefined)}>
      <div className="hive-activity"><Journal data={data} full /></div>
    </Dialog>}
    {ui.panel === 'rules' && <Dialog title="规则很短，变化没有边界。"
      eyebrow="THE HIVE HANDBOOK" wide onClose={() => ui.setPanel(undefined)}>
      <div className="hive-rules">{guideSections.map(([title, copy], index) =>
        <article key={title}><span>0{index + 1}</span><div>
          <h3>{title}</h3><p>{copy}</p></div></article>)}
        <p><ShieldCheck size={16} />
          客户端只展示服务端确认的合法行动，不自行重算规则。</p>
      </div>
    </Dialog>}
    {!ended && ui.panel === 'menu' && <Dialog title="落子之外。"
      eyebrow="YOUR GAME, YOUR PACE" onClose={() => ui.setPanel(undefined)}>
      <div className="hive-menu">
        <button type="button" onClick={() => ui.setPanel('activity')}>
          <History size={21} /><span><b>行棋记录</b>
            <small>查看本局每一次部署、移动与过手</small></span>
          <ChevronRight size={16} /></button>
        <button type="button" onClick={() => ui.setPanel('rules')}>
          <BookOpen size={21} /><span><b>玩法指南</b>
            <small>蜂巢、部署、虫群步法与胜负</small></span>
          <ChevronRight size={16} /></button>
        <button type="button" className="danger"
          onClick={() => ui.setPanel('resign')}>
          <Flag size={21} /><span><b>结束并认输</b>
            <small>需要再次确认，本局立即结束</small></span>
          <ChevronRight size={16} /></button>
      </div>
    </Dialog>}
    {!ended && ui.panel === 'resign' && <Dialog title="这一巢，要停在这里吗？"
      eyebrow="END THIS MATCH" onClose={() => ui.setPanel(undefined)}
      footer={<><ActionButton onClick={() => ui.setPanel(undefined)}>
        继续思考</ActionButton>
      <ActionButton variant="danger" disabled={!interactive}
        onClick={() => {
          if (session.submit('game_resign')) ui.setPanel(undefined);
        }}>确认认输<Flag size={16} /></ActionButton></>}>
      <p className="hive-dialog-copy"><Info size={18} />
        确认后，本局将由服务端以你认输结束并写入正式棋谱。</p>
    </Dialog>}
    {ui.panel === 'zoom' && <Dialog title="蜂巢全局"
      eyebrow="A QUIET LOOK AT THE HIVE" wide
      onClose={() => ui.setPanel(undefined)}>
      <div className="hive-focus-board">{board(true, 'zoom-')}</div>
      <p className="hive-focus-note">只读棋盘，不会改变当前对局。</p>
    </Dialog>}
    {ui.panel === 'insect' && <Dialog
      title={`${pieceName(ui.detailKind)} · ${PIECE_INFO[ui.detailKind].move}`}
      eyebrow={PIECE_INFO[ui.detailKind].english}
      onClose={() => ui.setPanel(undefined)}>
      <div className="hive-insect-detail">
        <Tile kind={ui.detailKind} side={mySide ?? side} />
        <p>{PIECE_INFO[ui.detailKind].detail}</p>
      </div>
    </Dialog>}
    {ui.panel === 'stack' && <Dialog title="查看叠层"
      eyebrow={`STACK · ${coordinate(ui.detailPosition)}`}
      onClose={() => ui.setPanel(undefined)}>
      <StackDetail data={data} position={ui.detailPosition} />
    </Dialog>}
  </div>;
}
