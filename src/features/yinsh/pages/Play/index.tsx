import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Flag,
  History, Info, Maximize2, Minimize2, MoreHorizontal, RotateCcw,
  ShieldCheck, Trophy, Users, X,
} from 'lucide-react';
import TurnCountdown from '@/components/TurnCountdown';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameMobileTopbar } from '@/components/GameUI/GameMobileTopbar';
import { Board } from '../../components/Board';
import { PlayerAvatar } from '../../components/AppShell';
import { Brand, MarkerToken, RingIcon } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import type { YinshSession } from '../../hooks/useYinshSession';
import { useYinshMotion } from '../../hooks/useYinshMotion';
import { useYinshPlayUI } from '../../hooks/useYinshPlayUI';
import { BOARD_POINTS } from '../../model/board';
import { invalidMoveReason } from '../../model/interaction';
import {
  actionCopy,
  phaseCopy,
  playerForSide,
} from '../../model/selectors';
import { playerName, type GameSnapshot } from '../../model/session';
import { Results } from '../Results';
import styles from './index.module.less';

function PlayerCard({
  playerID,
  data,
  active,
  compact = false,
}: {
  playerID: string;
  data: GameSnapshot;
  active: boolean;
  compact?: boolean;
}) {
  const player = data.roomData.players[playerID];
  const state = data.playerData[playerID];
  const side = state?.side ?? 'white';
  return <article className={`${styles.playerCard} ${styles[side]} ${active ? styles.activePlayer : ''} ${compact ? styles.compactPlayer : ''}`}>
    <PlayerAvatar name={playerName(playerID, data.roomData.players)}
      avatar={player?.avatar} ai={player?.ai} size={compact ? 32 : 42} />
    <div className={styles.playerInfo}><strong>{playerName(playerID, data.roomData.players)}
      {playerID === data.playerId && <em>你</em>}</strong>
      <span>{side === 'white' ? '执白 · 本局先手' : '执黑'}{player?.ai ? ' · AI 棋手' : ''}</span></div>
    <div className={styles.playerRings}><div>{[0, 1, 2].map(index =>
      <RingIcon key={index} side={side} filled={index < (state?.ringsRemoved ?? 0)} />)}</div>
      <span>已取 <b>{state?.ringsRemoved ?? 0}</b> / 3 环</span></div>
    {active && <i className={styles.activeLine} />}
  </article>;
}

function Journal({ data, full = false }: { data: GameSnapshot; full?: boolean }) {
  const entries = full ? [...data.roomData.activity].reverse() : [...data.roomData.activity].slice(-3).reverse();
  return <div className={`${styles.journal} ${full ? styles.fullJournal : ''}`}>
    {entries.map((entry, index) => <div key={`${entry.action}-${data.roomData.activity.length - index}`}>
      <span className={styles.eventDot}>{entry.action === 'remove_ring' ? <Trophy size={10} /> : null}</span>
      <p><strong>{entry.playerID ? playerName(entry.playerID, data.roomData.players) : '系统'}</strong>
        {actionCopy(entry, data.roomData.players)}</p>
      <small>{String(data.roomData.activity.length - index).padStart(2, '0')}</small>
    </div>)}
    {!entries.length && <p className={styles.emptyJournal}>第一枚圆环落下后，棋谱会从这里开始。</p>}
  </div>;
}

const guideSections = [
  ['布置圆环', '双方轮流在空交点放置一枚圆环，各放完 5 枚后白方先移动。'],
  ['移动与翻色', '圆环沿直线移动，起点留下己方棋子。跨越连续棋子时，停在其后第一个空位并翻转全部被跨棋子。'],
  ['五子取环', '连续五枚同色棋子成行。移除这五子，再取走任意一枚己方圆环。'],
  ['胜负与特例', '先取第三环立即获胜。长连选择连续五子；交叉线逐条重算；双方同时成行时移动方先结算。'],
] as const;

export function Play({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending = false,
}: {
  session: YinshSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch?: () => Promise<boolean>;
  startNextMatchPending?: boolean;
}) {
  const ui = useYinshPlayUI(data);
  const motionState = useYinshMotion(data);
  const boardData = motionState.motion?.before ?? data;
  const ended = data.roomData.gameStatus === 'end';
  const myTurn = data.roomData.currentPlayer === data.playerId;
  const interactive = !ended && myTurn && !session.pending && !motionState.busy
    && session.connection.status === 'connected';
  const currentSide = data.playerData[data.roomData.currentPlayer]?.side;
  const boardSide = boardData.playerData[boardData.roomData.currentPlayer]?.side;
  const [phaseTitle, phaseDescription] = phaseCopy(data);
  const whiteID = playerForSide(data, 'white');
  const blackID = playerForSide(data, 'black');
  const currentRound = boardData.roomData.gameStatus === 'placement'
    ? `${(boardData.roomData.placedRings.white ?? 0) + (boardData.roomData.placedRings.black ?? 0)} / 10 已布置`
    : `第 ${boardData.roomData.roundNo} 局`;

  const submitMove = (from: string, to: string) => {
    if (session.submit('game_move_ring', { from, to })) ui.clearSelection();
  };
  const onPoint = (pointID: string) => {
    if (!interactive) return;
    const status = data.roomData.gameStatus;
    if (status === 'placement') {
      if (!data.roomData.rings[pointID] && !data.roomData.markers[pointID]) {
        session.submit('game_place_ring', { pointID });
      } else {
        ui.notify(`${pointID} 已被占用，请选择空交点布环。`, true, pointID);
      }
      return;
    }
    if (status === 'remove_row') {
      const row = data.roomData.candidateRows.find(candidate => candidate.points.includes(pointID));
      if (row) {
        ui.setSelectedRowID(row.id);
      } else {
        ui.notify('先选择一条高亮五连，再移除其中的 5 枚棋子。', true, pointID);
      }
      return;
    }
    if (status === 'remove_ring') {
      if (data.roomData.rings[pointID] === currentSide) {
        session.submit('game_remove_ring', { pointID });
      } else {
        ui.notify('只能取走己方圆环，不能取走棋子或对手的环。', true, pointID);
      }
      return;
    }
    if (data.roomData.rings[pointID] === currentSide) {
      if (!data.roomData.legalMoves[pointID]?.length) {
        ui.notify('这枚圆环被挡住了，请换一枚可移动的己方圆环。', true, pointID);
        return;
      }
      ui.setSelectedRing(current => current === pointID ? undefined : pointID);
      return;
    }
    const move = ui.moves.find(option => option.to === pointID);
    if (!ui.selectedRing || !move) {
      ui.notify(invalidMoveReason({
        from: ui.selectedRing,
        to: pointID,
        rings: data.roomData.rings,
        markers: data.roomData.markers,
        legalMoves: data.roomData.legalMoves,
      }), true, pointID);
      return;
    }
    submitMove(ui.selectedRing, pointID);
  };
  const onGrab = (pointID: string) => {
    ui.setSelectedRing(pointID);
    ui.setHoveredPoint(undefined);
  };
  const onDrop = (from: string, to?: string) => {
    if (!to) {
      ui.notify(`已返回 ${from}，没有落子。`, false);
      return;
    }
    const move = data.roomData.legalMoves[from]?.find(option => option.to === to);
    if (!move) {
      ui.setSelectedRing(from);
      ui.setHoveredPoint(undefined);
      ui.notify(invalidMoveReason({
        from,
        to,
        rings: data.roomData.rings,
        markers: data.roomData.markers,
        legalMoves: data.roomData.legalMoves,
      }), true, to);
      return;
    }
    submitMove(from, to);
  };
  const mainAction = () => {
    if (!interactive) return;
    if (data.roomData.gameStatus === 'remove_row' && ui.selectedRow) {
      session.submit('game_remove_row', { rowID: ui.selectedRow.id });
    } else {
      ui.setPanel('points');
    }
  };
  const motionCopy = motionState.motion?.kind === 'move'
    ? `留子 → 移动 → 逐子翻面 → 落稳`
    : motionState.motion?.kind === 'clear'
      ? '五子回池 → 选择圆环'
      : motionState.motion?.kind === 'score'
        ? '取环 → 收入得分区'
        : '圆环正在落稳';
  const actionLabel = motionState.busy
    ? '正在完成这一步'
    : data.roomData.gameStatus === 'remove_row'
    ? '移除这 5 枚棋子'
    : data.roomData.gameStatus === 'remove_ring'
      ? '按坐标选择圆环'
      : data.roomData.gameStatus === 'placement'
        ? '按坐标布环'
        : ui.selectedRing
          ? '按坐标选择落点'
          : myTurn
            ? '按坐标选择圆环'
            : '等待对手行动';
  const actionEnabled = interactive && (
    data.roomData.gameStatus !== 'remove_row' || !!ui.selectedRow
  );
  const pointChoices = data.roomData.gameStatus === 'placement'
    ? BOARD_POINTS.filter(point =>
      !data.roomData.rings[point.id] && !data.roomData.markers[point.id])
      .map(point => point.id)
    : data.roomData.gameStatus === 'remove_ring'
      ? Object.keys(data.roomData.rings).filter(pointID =>
        data.roomData.rings[pointID] === currentSide)
      : ui.selectedRing
        ? ui.moves.map(move => move.to)
        : Object.keys(data.roomData.legalMoves).filter(pointID =>
          data.roomData.rings[pointID] === currentSide
          && data.roomData.legalMoves[pointID]?.length);
  const choosePoint = (pointID: string) => {
    ui.setPanel(undefined);
    if (data.roomData.gameStatus === 'placement') {
      session.submit('game_place_ring', { pointID });
    } else if (data.roomData.gameStatus === 'remove_ring') {
      session.submit('game_remove_ring', { pointID });
    } else if (!ui.selectedRing) {
      onGrab(pointID);
    } else {
      submitMove(ui.selectedRing, pointID);
    }
  };

  if (ended && ui.showResults && !motionState.busy) {
    return <Results data={data} onViewBoard={() => ui.setShowResults(false)}
      onRestart={onStartNextMatch} restarting={startNextMatchPending} />;
  }

  return <div data-testid="yinsh-play" className={styles.play}>
    <GameMobileTopbar
      onBack={onLeave}
      backLabel="离开对局"
      kicker={`YINSH · ${currentRound}`}
      title={data.roomID}
      status={!ended && data.roomData.turnDeadline && myTurn
        ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
        : ended ? '已结束' : '--'}
      actions={<>
        <button type="button" aria-label="查看棋谱" title="查看棋谱"
          onClick={() => ui.setPanel('activity')}><History size={18} /></button>
        <button type="button" aria-label="玩法指南" title="玩法指南"
          onClick={() => ui.setPanel('rules')}><BookOpen size={18} /></button>
        {!ended && <button type="button" aria-label="打开对局菜单" title="打开对局菜单"
          onClick={() => ui.setPanel('menu')}><MoreHorizontal size={21} /></button>}
        {ended && <button type="button" aria-label="返回终局结算" title="返回终局结算"
          onClick={() => ui.setShowResults(true)}><Trophy size={17} /></button>}
      </>}
    />
    <header className={styles.topbar} data-game-desktop-topbar><button type="button" aria-label="离开对局" onClick={onLeave}><ArrowLeft size={20} /></button>
      <Brand /><span className={styles.divider} />
      <div className={styles.room}><strong>{data.roomID}</strong>
        <small>{currentRound} · 经典规则 · 服务端权威</small></div>
      <span className={styles.spacer} />
      <button type="button" aria-label="查看棋谱" onClick={() => ui.setPanel('activity')}><History size={18} /></button>
      <button type="button" aria-label="玩法指南" onClick={() => ui.setPanel('rules')}><BookOpen size={18} /></button>
      {!ended && <button type="button" aria-label="打开对局菜单"
        onClick={() => ui.setPanel('menu')}><MoreHorizontal size={21} /></button>}
      {ended
        ? <button type="button" className={styles.resultReturn}
          aria-label="返回终局结算" onClick={() => ui.setShowResults(true)}>
          <Trophy size={15} /><span>结算</span></button>
        : <span className={styles.timer}><small>TIME</small>
          {data.roomData.turnDeadline && myTurn
            ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
            : <b>--</b>}</span>}
    </header>
    <div className={styles.live} role="status" aria-live="polite">
      {motionState.busy ? '服务端已确认，正在展示这一步'
        : session.pending ? '等待服务端确认…' : session.connection.status !== 'connected'
        ? '连接中断，棋盘保持只读'
        : ui.feedback?.text ?? motionState.receipt ?? phaseDescription}
    </div>
    <main className={styles.content}><div className={styles.matchHeading}>
      <div><span className={styles.eyebrow}>THE QUIET STRATEGY</span><h1>进退之间，胜负无声。</h1></div>
      <div><span><Users size={14} />双人策略</span><span><Clock3 size={14} />分阶段计时</span></div></div>
      <div className={styles.layout}><section className={styles.boardColumn}>
        <div className={styles.desktopPlayers}>
          {whiteID && <PlayerCard playerID={whiteID} data={boardData} active={boardData.roomData.currentPlayer === whiteID} />}
          <span className={styles.versus}>VS<small>先取三环</small></span>
          {blackID && <PlayerCard playerID={blackID} data={boardData} active={boardData.roomData.currentPlayer === blackID} />}
        </div>
        <div className={styles.mobileOpponent} data-testid="mobile-opponent">{boardData.roomData.playerOrder.filter(id => id !== boardData.playerId).map(id =>
          <PlayerCard key={id} playerID={id} data={boardData} active={boardData.roomData.currentPlayer === id} compact />)}</div>
        <section className={styles.arena}><header><span><i />{
          boardData.roomData.gameStatus === 'placement' ? '布环阶段'
            : boardData.roomData.gameStatus === 'remove_row' ? '五连结算'
              : boardData.roomData.gameStatus === 'remove_ring' ? '取环计分'
                : '经典棋盘'
        } <small>· {currentRound}</small></span>
          <span className={styles.mobilePool}>公共池 <b>{boardData.roomData.markerPool}</b><small> / 51</small></span>
          <div className={styles.arenaTools}><button type="button"
            disabled={motionState.busy}
            aria-label={ui.zoomed ? '缩小棋盘' : '放大棋盘'}
            onClick={() => ui.setZoomed(!ui.zoomed)}>
            {ui.zoomed ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button></div></header>
          <div className={styles.boardStage}><span className={styles.boardCorner}>Y / 01</span>
            <Board rings={boardData.roomData.rings} markers={boardData.roomData.markers}
              status={boardData.roomData.gameStatus} currentSide={boardSide}
              selected={ui.selectedRing} moves={ui.moves} preview={ui.preview}
              legalMoves={data.roomData.legalMoves}
              candidateRows={boardData.roomData.candidateRows} selectedRow={ui.selectedRow}
              lastAction={boardData.roomData.lastAction} interactive={interactive}
              coordinates hints
              zoomed={ui.zoomed} motion={motionState.motion}
              errorPoint={ui.feedback?.errorPoint}
              reduced={motionState.reduced}
              onPoint={onPoint} onHover={ui.setHoveredPoint} onGrab={onGrab}
              onDrop={onDrop} onCancel={ui.clearSelection} />
            <span className={styles.boardEdition}>CLASSIC<br />EDITION</span></div>
          <footer><span><RingIcon />圆环 <MarkerToken side="white" />棋子</span>
            <span><i />可落位置 <em />上一步</span>
            <button type="button" className={styles.replay}
              aria-label="回放上一步" disabled={!motionState.canReplay || !!session.pending}
              onClick={() => motionState.replay()}><RotateCcw size={12} />回放</button></footer>
        </section>
        <div className={styles.mobileSelf} data-testid="mobile-self"><PlayerCard playerID={boardData.playerId} data={boardData}
          active={boardData.roomData.currentPlayer === boardData.playerId} compact /></div>
        <p className={styles.footnote}><ShieldCheck size={13} />第 {boardData.roomData.roundNo} 局 ·
          {boardData.roomData.players[boardData.playerId]?.ai ? 'AI' : '在线'}对局 · 所有合法操作由服务端确认</p>
      </section>
      <aside className={styles.sidebar}><section data-testid="turn-status"
        className={`${styles.actionCard} ${motionState.busy ? styles.actionMoving : ''} ${ui.feedback?.error ? styles.actionError : ''}`}>
        <div className={styles.actionEyebrow}><span className={styles.eyebrow}>{ended ? 'THE FINAL CHAPTER' : myTurn ? 'YOUR TURN' : 'OPPONENT’S TURN'}</span><i /></div>
        <div className={styles.turnCopy}><span className={styles.turnRing}><RingIcon side={motionState.motion?.side ?? currentSide ?? 'white'} /></span><div>
          <h2>{motionState.busy ? '这一手，正在落定' : ui.feedback?.error ? '这里不能落子' : phaseTitle}</h2>
          <p>{motionState.busy ? motionCopy : ui.feedback?.text ?? phaseDescription}</p></div></div>
        {motionState.busy
          ? <div className={styles.motionStatus} data-testid="motion-status">
            <span>{motionCopy}</span><i style={{ animationDuration: `${motionState.motion?.duration ?? 0}ms` }} />
          </div>
          : motionState.receipt && !ui.selectedRing
            ? <div className={styles.moveReceipt}><CheckCircle2 size={14} /><span>{motionState.receipt}</span></div>
            : null}
        {data.roomData.gameStatus === 'move' && !motionState.busy && !motionState.receipt
          && <div className={styles.steps}><span className={ui.selectedRing ? styles.done : styles.stepActive}><b>{ui.selectedRing ? <Check size={10} /> : 1}</b>选环</span><i />
          <span className={ui.selectedRing ? styles.stepActive : ''}><b>2</b>移动</span><i /><span><b>3</b>翻子</span></div>}
        {data.roomData.gameStatus === 'placement' && !motionState.busy && currentSide
          && <div className={styles.placementProgress}>{[0, 1, 2, 3, 4].map(index =>
            <RingIcon key={index} side={currentSide}
              filled={index < (data.roomData.placedRings[currentSide] ?? 0)} />)}
            <span>{data.roomData.placedRings[currentSide] ?? 0} / 5</span></div>}
        {ui.selectedRing && !motionState.busy && <div className={styles.movePreview}><span><strong>{ui.selectedRing}</strong><ArrowRight size={13} /><strong>{ui.preview?.to ?? '?'}</strong></span>
          <small>{ui.preview ? `翻转 ${ui.preview.flips.length} 子` : `${ui.moves.length} 个合法落点`}</small>
          <button type="button" aria-label="取消选择" onClick={ui.clearSelection}><X size={14} /></button></div>}
        {!motionState.busy && data.roomData.candidateRows.length > 1 && <div className={styles.rowChoices}>
          {data.roomData.candidateRows.map((row, index) => <button type="button" key={row.id}
            className={ui.selectedRow?.id === row.id ? styles.rowActive : ''}
            onClick={() => ui.setSelectedRowID(row.id)}>连线 {index + 1}<span>{row.points[0]} — {row.points[4]}</span></button>)}</div>}
        <ActionButton variant="primary" disabled={!actionEnabled}
          aria-busy={motionState.busy} onClick={mainAction}>
          {actionLabel}{motionState.busy
            ? <span className={styles.workingDots}><i /><i /><i /></span>
            : actionEnabled && <ArrowRight size={16} />}</ActionButton>
        {ui.selectedRing && !motionState.busy
          && <button type="button" className={styles.cancel} onClick={ui.clearSelection}>取消选择</button>}
      </section>
      <section className={styles.goal}><span className={styles.eyebrow}>LESS IS MORE</span><Trophy size={17} />
        <h3>取三环，赢一局。</h3><div><span>{[0, 1, 2, 3, 4].map(index => <i key={index} />)}</span><ArrowRight size={16} /><RingIcon /></div>
        <p>每次五连，取走一枚己方圆环。<br />越接近胜利，越需要深思熟虑。</p></section>
      <section className={styles.journalCard}><header><h3>行棋记录</h3><button type="button" onClick={() => ui.setPanel('activity')}>全部 <ArrowRight size={13} /></button></header>
        <Journal data={boardData} /><footer><span>公共棋子池</span><strong>{boardData.roomData.markerPool}<small> / 51</small></strong></footer></section>
      </aside></div>
    </main>
    {!ended && <div className={styles.mobileDock}
      data-testid="yinsh-mobile-dock"><button type="button" aria-label="取消选择"
      disabled={!ui.selectedRing} onClick={ui.clearSelection}><X size={18} /></button>
      <ActionButton variant="primary" disabled={!actionEnabled}
        aria-busy={motionState.busy} onClick={mainAction}>{actionLabel}</ActionButton></div>}

    {ui.panel === 'activity' && <Dialog title="这一局的每一步" eyebrow="THE GAME JOURNAL"
      onClose={() => ui.setPanel(undefined)}><Journal data={boardData} full /></Dialog>}
    {ui.panel === 'rules' && <Dialog title="每一次翻转，都有章法。" eyebrow="THE YINSH HANDBOOK" wide
      onClose={() => ui.setPanel(undefined)} footer={<ActionButton variant="primary" onClick={() => ui.setPanel(undefined)}>知道了</ActionButton>}>
      <div className={styles.rules}>{guideSections.map(([title, copy], index) => <article key={title}>
        <span>0{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}
        <p><ShieldCheck size={16} />经典三环规则，不包含 Blitz 变体。</p></div>
    </Dialog>}
    {ui.panel === 'points' && <Dialog
      title={data.roomData.gameStatus === 'placement'
        ? '按坐标布环'
        : data.roomData.gameStatus === 'remove_ring'
          ? '选择要取走的圆环'
          : ui.selectedRing
            ? '精确选择落点'
            : '选择一枚己方圆环'}
      eyebrow="A PRECISE NEXT STEP"
      onClose={() => ui.setPanel(undefined)}>
      <p className={styles.pointIntro}>{ui.selectedRing
        ? `已选 ${ui.selectedRing}。选择合法坐标后会立即提交。`
        : data.roomData.gameStatus === 'remove_ring'
          ? '以下都是可取走的己方圆环，选择后计入得分。'
          : data.roomData.gameStatus === 'placement'
            ? '只列出空交点，点选一个坐标即可落环。'
            : '只列出有合法走法的己方圆环。'}</p>
      <div className={styles.pointOptions}>{pointChoices.map(pointID =>
        <button type="button" key={pointID}
          aria-label={`${ui.selectedRing ? '预选落点' : '选择交点'} ${pointID}`}
          onClick={() => choosePoint(pointID)}>
          <strong>{pointID}</strong><small>{ui.selectedRing
            ? `翻 ${ui.moves.find(move => move.to === pointID)?.flips.length ?? 0} 子`
            : data.roomData.gameStatus === 'placement'
              ? '空交点'
              : data.roomData.gameStatus === 'remove_ring'
                ? '取走此环'
                : `${data.roomData.legalMoves[pointID]?.length ?? 0} 个落点`}</small>
        </button>)}</div>
    </Dialog>}
    {!ended && ui.panel === 'menu' && <Dialog title="落子之外" eyebrow="YOUR GAME, YOUR PACE" onClose={() => ui.setPanel(undefined)}>
      <div className={styles.menu}><button type="button" onClick={() => ui.setPanel('activity')}><History size={18} /><span><b>完整棋谱</b><small>查看本局所有权威动作</small></span><ArrowRight size={15} /></button>
        <button type="button" onClick={() => ui.setPanel('rules')}><BookOpen size={18} /><span><b>玩法指南</b><small>移动、翻色、取环与特例</small></span><ArrowRight size={15} /></button>
        <button type="button" className={styles.danger} disabled={ended} onClick={() => ui.setPanel('resign')}><Flag size={18} /><span><b>结束并认输</b><small>对手将立即获胜</small></span><ArrowRight size={15} /></button></div>
    </Dialog>}
    {ui.panel === 'resign' && <Dialog title="这一步，想好了吗？" eyebrow="END THIS GAME" onClose={() => ui.setPanel(undefined)}
      footer={<><ActionButton onClick={() => ui.setPanel(undefined)}>继续思考</ActionButton>
        <ActionButton variant="danger" disabled={!!session.pending}
          onClick={() => { if (session.submit('game_resign')) ui.setPanel(undefined); }}>确认认输<Flag size={15} /></ActionButton></>}>
      <p className={styles.resign}><Info size={17} />认输会立即结束当前对局，结果将进入正式战绩。</p>
    </Dialog>}
  </div>;
}
