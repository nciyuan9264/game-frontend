import {
  ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Eye, Flag, History,
  Info, Lightbulb, MoreHorizontal, Settings2, ShieldCheck, Trophy, Users, X,
} from 'lucide-react';
import TurnCountdown from '@/components/TurnCountdown';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Board } from '../../components/Board';
import { PlayerAvatar } from '../../components/AppShell';
import { Brand, MarkerToken, RingIcon } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import type { YinshSession } from '../../hooks/useYinshSession';
import { useYinshPlayUI } from '../../hooks/useYinshPlayUI';
import { useYinshPreferences } from '../../hooks/useYinshPreferences';
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
      avatar={player?.avatar} ai={player?.ai} size={compact ? 38 : 42} />
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
  const preferences = useYinshPreferences();
  const ended = data.roomData.gameStatus === 'end';
  const myTurn = data.roomData.currentPlayer === data.playerId;
  const interactive = !ended && myTurn && !session.pending
    && session.connection.status === 'connected';
  const currentSide = data.playerData[data.roomData.currentPlayer]?.side;
  const [phaseTitle, phaseDescription] = phaseCopy(data);
  const whiteID = playerForSide(data, 'white');
  const blackID = playerForSide(data, 'black');
  const selectedMove = ui.moves.find(move => move.to === ui.pendingPoint);
  const currentRound = data.roomData.gameStatus === 'placement'
    ? `${(data.roomData.placedRings.white ?? 0) + (data.roomData.placedRings.black ?? 0)} / 10 已布置`
    : `第 ${data.roomData.roundNo} 局`;

  const submitMove = (from: string, to: string) => {
    if (session.submit('game_move_ring', { from, to })) ui.clearSelection();
  };
  const onPoint = (pointID: string) => {
    if (!interactive) return;
    const status = data.roomData.gameStatus;
    if (status === 'placement') {
      session.submit('game_place_ring', { pointID });
      return;
    }
    if (status === 'remove_row') {
      const row = data.roomData.candidateRows.find(candidate => candidate.points.includes(pointID));
      if (row) ui.setSelectedRowID(row.id);
      return;
    }
    if (status === 'remove_ring') {
      if (data.roomData.rings[pointID] === currentSide) {
        session.submit('game_remove_ring', { pointID });
      }
      return;
    }
    if (data.roomData.rings[pointID] === currentSide) {
      ui.setSelectedRing(current => current === pointID ? undefined : pointID);
      ui.setPendingPoint(undefined);
      return;
    }
    const move = ui.moves.find(option => option.to === pointID);
    if (!ui.selectedRing || !move) return;
    if (preferences.confirmMoves) {
      ui.setPendingPoint(pointID);
      ui.setHoveredPoint(pointID);
    } else {
      submitMove(ui.selectedRing, pointID);
    }
  };
  const mainAction = () => {
    if (!interactive) return;
    if (data.roomData.gameStatus === 'remove_row' && ui.selectedRow) {
      session.submit('game_remove_row', { rowID: ui.selectedRow.id });
    } else if (ui.selectedRing && ui.pendingPoint && selectedMove) {
      submitMove(ui.selectedRing, ui.pendingPoint);
    }
  };
  const actionLabel = data.roomData.gameStatus === 'remove_row'
    ? '移除这 5 枚棋子'
    : data.roomData.gameStatus === 'remove_ring'
      ? '在棋盘选择要取走的环'
      : data.roomData.gameStatus === 'placement'
        ? '在棋盘选择空交点'
        : ui.pendingPoint
          ? '确认落子'
          : ui.selectedRing
            ? '选择高亮落点'
            : myTurn
              ? '选择一枚圆环'
              : '等待对手行动';
  const actionEnabled = interactive && (
    data.roomData.gameStatus === 'remove_row' && !!ui.selectedRow
    || data.roomData.gameStatus === 'move' && !!ui.pendingPoint
  );

  if (ended && ui.showResults) {
    return <Results data={data} onViewBoard={() => ui.setShowResults(false)} onLeave={onLeave}
      onRestart={onStartNextMatch} restarting={startNextMatchPending} />;
  }

  return <div className={`${styles.play} ${preferences.reduceMotion ? styles.reduceMotion : ''}`}>
    <header className={styles.topbar}><button type="button" aria-label="离开对局" onClick={onLeave}><ArrowLeft size={20} /></button>
      <Brand /><span className={styles.divider} />
      <div className={styles.room}><strong>{data.roomID}</strong>
        <small>{currentRound} · 经典规则 · 服务端权威</small></div>
      <span className={styles.spacer} />
      {ended && <ActionButton onClick={() => ui.setShowResults(true)}><Eye size={15} />查看结算</ActionButton>}
      <button type="button" aria-label="查看棋谱" onClick={() => ui.setPanel('activity')}><History size={18} /></button>
      <button type="button" aria-label="玩法指南" onClick={() => ui.setPanel('rules')}><BookOpen size={18} /></button>
      <button type="button" aria-label="打开对局菜单" onClick={() => ui.setPanel('menu')}><MoreHorizontal size={21} /></button>
      <span className={styles.timer}><small>TIME</small>
        {data.roomData.turnDeadline && myTurn && !ended
          ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
          : <b>--</b>}</span>
    </header>
    <div className={styles.live} role="status" aria-live="polite">
      {session.pending ? '等待服务端确认…' : session.connection.status !== 'connected'
        ? '连接中断，棋盘保持只读'
        : phaseDescription}
    </div>
    <main className={styles.content}><div className={styles.matchHeading}>
      <div><span className={styles.eyebrow}>THE QUIET STRATEGY</span><h1>进退之间，胜负无声。</h1></div>
      <div><span><Users size={14} />双人策略</span><span><Clock3 size={14} />分阶段计时</span></div></div>
      <div className={styles.layout}><section className={styles.boardColumn}>
        <div className={styles.desktopPlayers}>
          {whiteID && <PlayerCard playerID={whiteID} data={data} active={data.roomData.currentPlayer === whiteID} />}
          <span className={styles.versus}>VS<small>先取三环</small></span>
          {blackID && <PlayerCard playerID={blackID} data={data} active={data.roomData.currentPlayer === blackID} />}
        </div>
        <div className={styles.mobileOpponent}>{data.roomData.playerOrder.filter(id => id !== data.playerId).map(id =>
          <PlayerCard key={id} playerID={id} data={data} active={data.roomData.currentPlayer === id} compact />)}</div>
        <section className={styles.arena}><header><span><i />{
          data.roomData.gameStatus === 'placement' ? '布环阶段'
            : data.roomData.gameStatus === 'remove_row' ? '五连结算'
              : data.roomData.gameStatus === 'remove_ring' ? '取环计分'
                : '经典棋盘'
        } <small>· {currentRound}</small></span>
          <button type="button" className={preferences.hints ? styles.toolActive : ''}
            aria-label={preferences.hints ? '关闭落点提示' : '开启落点提示'}
            onClick={() => preferences.setHints(!preferences.hints)}><Lightbulb size={15} />落点提示</button></header>
          <div className={styles.boardStage}><span className={styles.boardCorner}>Y / 01</span>
            <Board rings={data.roomData.rings} markers={data.roomData.markers}
              status={data.roomData.gameStatus} currentSide={currentSide}
              selected={ui.selectedRing} moves={ui.moves} preview={ui.preview}
              candidateRows={data.roomData.candidateRows} selectedRow={ui.selectedRow}
              lastAction={data.roomData.lastAction} interactive={interactive}
              coordinates={preferences.coordinates} hints={preferences.hints}
              onPoint={onPoint} onHover={ui.setHoveredPoint} />
            <span className={styles.boardEdition}>CLASSIC<br />EDITION</span></div>
          <footer><span><RingIcon />圆环 <MarkerToken side="white" />棋子</span>
            <span><i />可落位置 <em />上一步</span><span>85 个交点，万千种可能。</span></footer>
        </section>
        <div className={styles.mobileSelf}><PlayerCard playerID={data.playerId} data={data}
          active={data.roomData.currentPlayer === data.playerId} compact /></div>
        <p className={styles.footnote}><ShieldCheck size={13} />第 {data.roomData.roundNo} 局 ·
          {data.roomData.players[data.playerId]?.ai ? 'AI' : '在线'}对局 · 所有合法操作由服务端确认</p>
      </section>
      <aside className={styles.sidebar}><section className={styles.actionCard}>
        <div className={styles.actionEyebrow}><span className={styles.eyebrow}>{ended ? 'THE FINAL CHAPTER' : myTurn ? 'YOUR TURN' : 'OPPONENT’S TURN'}</span><i /></div>
        <div className={styles.turnCopy}><RingIcon side={currentSide ?? 'white'} /><div><h2>{phaseTitle}</h2><p>{phaseDescription}</p></div></div>
        {data.roomData.gameStatus === 'move' && <div className={styles.steps}><span className={ui.selectedRing ? styles.done : styles.stepActive}><b>{ui.selectedRing ? <Check size={10} /> : 1}</b>选环</span><i />
          <span className={ui.selectedRing ? styles.stepActive : ''}><b>2</b>移动</span><i /><span><b>3</b>翻子</span></div>}
        {ui.selectedRing && <div className={styles.movePreview}><span><strong>{ui.selectedRing}</strong><ArrowRight size={13} /><strong>{ui.preview?.to ?? '?'}</strong></span>
          <small>{ui.preview ? `翻转 ${ui.preview.flips.length} 子` : `${ui.moves.length} 个合法落点`}</small>
          <button type="button" aria-label="取消选择" onClick={ui.clearSelection}><X size={14} /></button></div>}
        {data.roomData.candidateRows.length > 1 && <div className={styles.rowChoices}>
          {data.roomData.candidateRows.map((row, index) => <button type="button" key={row.id}
            className={ui.selectedRow?.id === row.id ? styles.rowActive : ''}
            onClick={() => ui.setSelectedRowID(row.id)}>连线 {index + 1}<span>{row.points[0]} — {row.points[4]}</span></button>)}</div>}
        <ActionButton variant="primary" disabled={!actionEnabled} onClick={mainAction}>
          {actionLabel}{actionEnabled && <ArrowRight size={16} />}</ActionButton>
        {ui.selectedRing && <button type="button" className={styles.cancel} onClick={ui.clearSelection}>取消选择</button>}
      </section>
      <section className={styles.goal}><span className={styles.eyebrow}>LESS IS MORE</span><Trophy size={17} />
        <h3>取三环，赢一局。</h3><div><span>{[0, 1, 2, 3, 4].map(index => <i key={index} />)}</span><ArrowRight size={16} /><RingIcon /></div>
        <p>每次五连，取走一枚己方圆环。<br />越接近胜利，越需要深思熟虑。</p></section>
      <section className={styles.journalCard}><header><h3>行棋记录</h3><button type="button" onClick={() => ui.setPanel('activity')}>全部 <ArrowRight size={13} /></button></header>
        <Journal data={data} /><footer><span>公共棋子池</span><strong>{data.roomData.markerPool}<small> / 51</small></strong></footer></section>
      </aside></div>
    </main>
    <div className={styles.mobileDock}><button type="button" aria-label="取消选择"
      disabled={!ui.selectedRing} onClick={ui.clearSelection}><X size={18} /></button>
      <ActionButton variant="primary" disabled={!actionEnabled} onClick={mainAction}>{actionLabel}</ActionButton></div>

    {ui.panel === 'activity' && <Dialog title="这一局的每一步" eyebrow="THE GAME JOURNAL"
      onClose={() => ui.setPanel(undefined)}><Journal data={data} full /></Dialog>}
    {ui.panel === 'rules' && <Dialog title="每一次翻转，都有章法。" eyebrow="THE YINSH HANDBOOK" wide
      onClose={() => ui.setPanel(undefined)} footer={<ActionButton variant="primary" onClick={() => ui.setPanel(undefined)}>知道了</ActionButton>}>
      <div className={styles.rules}>{guideSections.map(([title, copy], index) => <article key={title}>
        <span>0{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}
        <p><ShieldCheck size={16} />经典三环规则，不包含 Blitz 变体。</p></div>
    </Dialog>}
    {ui.panel === 'settings' && <Dialog title="专注于你的下一步。" eyebrow="PLAYING PREFERENCES"
      onClose={() => ui.setPanel(undefined)} footer={<ActionButton variant="primary" onClick={() => ui.setPanel(undefined)}>完成</ActionButton>}>
      <div className={styles.settings}>{[
        { label: '显示合法落点', value: preferences.hints, set: preferences.setHints },
        { label: '显示棋盘坐标', value: preferences.coordinates, set: preferences.setCoordinates },
        { label: '落子前确认', value: preferences.confirmMoves, set: preferences.setConfirmMoves },
        { label: '减少动态效果', value: preferences.reduceMotion, set: preferences.setReduceMotion },
      ].map(item => <div key={item.label}><span><b>{item.label}</b><small>只影响当前设备上的显示和操作</small></span>
        <button type="button" role="switch" aria-label={item.label} aria-checked={item.value}
          className={item.value ? styles.switchOn : ''} onClick={() => item.set(!item.value)}><i /></button></div>)}</div>
    </Dialog>}
    {ui.panel === 'menu' && <Dialog title="落子之外" eyebrow="YOUR GAME, YOUR PACE" onClose={() => ui.setPanel(undefined)}>
      <div className={styles.menu}><button type="button" onClick={() => ui.setPanel('settings')}><Settings2 size={18} /><span><b>对局偏好</b><small>坐标、落点提示与防误触</small></span><ArrowRight size={15} /></button>
        <button type="button" onClick={() => ui.setPanel('activity')}><History size={18} /><span><b>完整棋谱</b><small>查看本局所有权威动作</small></span><ArrowRight size={15} /></button>
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
