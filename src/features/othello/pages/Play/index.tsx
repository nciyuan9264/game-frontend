import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  Flag,
  History,
  Info,
  Lightbulb,
  Maximize2,
  MoreHorizontal,
  Settings2,
  ShieldCheck,
  SkipForward,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import TurnCountdown from '@/components/TurnCountdown';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Board } from '../../components/Board';
import { PlayerAvatar } from '../../components/AppShell';
import { Brand, Disc } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import type { OthelloSession } from '../../hooks/useOthelloSession';
import { useOthelloPlayUI } from '../../hooks/useOthelloPlayUI';
import { useOthelloPreferences } from '../../hooks/useOthelloPreferences';
import { coordinate } from '../../model/board';
import {
  actionCopy,
  phaseCopy,
  playerForSide,
  sideName,
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
  const side = state?.side ?? 'black';
  return <article className={[
    styles.playerCard,
    styles[side],
    active ? styles.activePlayer : '',
    compact ? styles.compactPlayer : '',
  ].filter(Boolean).join(' ')}>
    <span className={styles.avatarWrap}>
      <PlayerAvatar
        name={playerName(playerID, data.roomData.players)}
        avatar={player?.avatar}
        ai={player?.ai}
        size={compact ? 32 : 39}
      />
      <Disc side={side} />
    </span>
    <div className={styles.playerInfo}>
      <strong>{playerName(playerID, data.roomData.players)}
        {playerID === data.playerId && <em>你</em>}</strong>
      <span>{side === 'black' ? '执黑 · 先手' : '执白 · 后手'}
        {player?.ai ? ' · AI 棋手' : ''}</span>
    </div>
    <div className={styles.playerScore}>
      <span>{active && data.roomData.gameStatus !== 'end'
        ? <><i />正在行棋</>
        : '盘面子数'}</span>
      <strong>{String(state?.discCount ?? 0).padStart(2, '0')}<small>子</small></strong>
    </div>
    {active && data.roomData.gameStatus !== 'end' && <i className={styles.activeLine} />}
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
  return <div className={`${styles.journal} ${full ? styles.fullJournal : ''}`}>
    {visible.map(entry => <div key={entry.id}>
      <span className={styles.journalIndex}>{String(entry.id).padStart(2, '0')}</span>
      <Disc side={entry.side} />
      <p><strong>{entry.kind === 'move' ? coordinate(entry.index ?? -1)
        : entry.kind === 'pass' ? '跳过' : '认输'}</strong>
        <span>{actionCopy(entry, data.roomData.players)}</span></p>
      {entry.id === data.roomData.moveLog.length && <i />}
    </div>)}
    {!visible.length && <p className={styles.emptyJournal}>第一步，等你落下。<small>每次落子与翻转都会记录在这里。</small></p>}
  </div>;
}

const guideSections = [
  ['开局与落子', '棋盘中央摆好四枚棋子，黑方先行。每一步必须落在能夹住至少一枚对方棋子的空格。'],
  ['夹击与翻转', '横、竖、斜八个方向分别判断。新棋与己方棋子之间连续的对方棋子都会同时翻面。'],
  ['无子可下', '当前方没有合法落点时必须跳过；如果另一方仍可落子，对局继续。'],
  ['终局与计分', '双方都无合法落点时结束，按盘面实际棋子数计分，棋子更多者获胜，空格不补计分。'],
] as const;

export function Play({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending = false,
}: {
  session: OthelloSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch?: () => Promise<boolean>;
  startNextMatchPending?: boolean;
}) {
  const ui = useOthelloPlayUI(data);
  const preferences = useOthelloPreferences();
  const ended = data.roomData.gameStatus === 'end';
  const myTurn = data.roomData.currentPlayer === data.playerId;
  const playable = data.roomData.gameStatus === 'playing';
  const mustPass = data.roomData.gameStatus === 'pass';
  const interactive = !ended
    && myTurn
    && !session.pending
    && session.connection.status === 'connected';
  const [phaseTitle, phaseDescription] = phaseCopy(data);
  const blackID = playerForSide(data, 'black');
  const whiteID = playerForSide(data, 'white');
  const occupied = data.roomData.board.filter(Boolean).length;
  const empty = 64 - occupied;
  const last = data.roomData.lastData;

  const submitPlace = (index: number) => {
    if (session.submit('game_place_disc', { index })) ui.clearSelection();
  };
  const onCell = (index: number) => {
    if (!interactive || !playable) return;
    if (preferences.confirmMoves) {
      ui.setPendingIndex(index);
      ui.setHoveredIndex(undefined);
    } else {
      submitPlace(index);
    }
  };
  const mainAction = () => {
    if (!interactive) return;
    if (mustPass) {
      session.submit('game_pass');
    } else if (ui.pendingIndex != null) {
      submitPlace(ui.pendingIndex);
    }
  };
  const actionLabel = mustPass
    ? '跳过本回合'
    : ui.pendingIndex != null
      ? `确认落子 · ${coordinate(ui.pendingIndex)}`
      : myTurn
        ? '选择棋盘上的合法位置'
        : '等待对手落子';
  const actionEnabled = interactive && (mustPass || ui.pendingIndex != null);
  const actionButton = <ActionButton
    variant="primary"
    disabled={!actionEnabled}
    onClick={mainAction}
  >{actionLabel}{mustPass ? <SkipForward size={17} />
      : ui.pendingIndex != null ? <Check size={17} /> : <ArrowRight size={17} />}</ActionButton>;

  const board = (zoom = false) => <Board
    board={data.roomData.board}
    currentSide={data.roomData.currentSide}
    legalMoves={data.roomData.legalMoves}
    preview={interactive ? ui.preview : undefined}
    pendingIndex={ui.pendingIndex}
    lastData={data.roomData.lastData}
    interactive={interactive && playable}
    coordinates={preferences.coordinates}
    hints={preferences.hints}
    onCell={onCell}
    onHover={ui.setHoveredIndex}
    testPrefix={zoom ? 'zoom-cell' : 'cell'}
  />;

  if (ended && ui.showResults) {
    return <Results
      data={data}
      onViewBoard={() => ui.setShowResults(false)}
      onLeave={onLeave}
      onRestart={onStartNextMatch}
      restarting={startNextMatchPending}
    />;
  }

  return <div className={`${styles.play} ${preferences.reduceMotion ? styles.reduceMotion : ''}`}>
    <header className={styles.topbar}>
      <button type="button" aria-label="离开对局" onClick={onLeave}><ArrowLeft size={20} /></button>
      <Brand /><span className={styles.divider} />
      <div className={styles.room}><strong>{data.roomID}</strong>
        <small>第 {data.roomData.roundNo} 局 · 经典规则 · 服务端权威</small></div>
      <span className={styles.spacer} />
      {ended && <ActionButton onClick={() => ui.setShowResults(true)}><Eye size={15} />查看结算</ActionButton>}
      <button type="button" aria-label="查看棋谱" onClick={() => ui.setPanel('activity')}><History size={18} /></button>
      <button type="button" aria-label="玩法指南" onClick={() => ui.setPanel('rules')}><BookOpen size={18} /></button>
      <button type="button" aria-label="打开对局菜单" onClick={() => ui.setPanel('menu')}><MoreHorizontal size={21} /></button>
      <span className={styles.timer}><small>TIME</small>
        {data.roomData.turnDeadline && !ended
          ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
          : <b>--</b>}</span>
    </header>
    <div className={styles.live} role="status" aria-live="polite">
      {session.pending ? '等待服务端确认…'
        : session.connection.status !== 'connected' ? '连接中断，棋盘保持只读'
          : phaseDescription}
    </div>
    <main className={styles.content}>
      <div className={styles.matchHeading}>
        <div><span className={styles.eyebrow}><i />THE ART OF REVERSAL</span>
          <h1>黑白之间，一步转机。</h1></div>
        <div><span><Users size={14} />双人策略</span><span><Clock3 size={14} />60 秒回合</span></div>
      </div>
      <div className={styles.layout}>
        <section className={styles.boardColumn}>
          <div className={styles.desktopPlayers}>
            {blackID && <PlayerCard playerID={blackID} data={data}
              active={data.roomData.currentPlayer === blackID} />}
            <span className={styles.versus}>VS<small>终局子多者胜</small></span>
            {whiteID && <PlayerCard playerID={whiteID} data={data}
              active={data.roomData.currentPlayer === whiteID} />}
          </div>
          <div className={styles.mobileOpponent}>
            {data.roomData.playerOrder.filter(id => id !== data.playerId).map(id =>
              <PlayerCard key={id} playerID={id} data={data}
                active={data.roomData.currentPlayer === id} compact />)}
          </div>
          <section className={styles.arena}>
            <header><span><i />经典棋盘 <small>· {
              ended ? '终局' : `第 ${data.roomData.moveLog.filter(entry => entry.kind === 'move').length + 1} 手`
            }</small></span><div>
              <button type="button" aria-label={preferences.hints ? '关闭落点提示' : '开启落点提示'}
                aria-pressed={preferences.hints}
                className={preferences.hints ? styles.toolActive : ''}
                onClick={() => preferences.setHints(!preferences.hints)}>
                <Lightbulb size={15} /><b>落点提示</b></button>
              <button type="button" aria-label="放大棋盘" onClick={() => ui.setPanel('zoom')}>
                <Maximize2 size={15} /></button>
            </div></header>
            <div className={styles.boardStage}>
              <span className={styles.boardCorner}>O / 02<br /><i />THE QUIET<br />COLLECTION</span>
              {board()}
              <span className={styles.boardEdition}><strong>64</strong> 方格之间<br /><i />EVERY MOVE<br />MATTERS</span>
            </div>
            <footer><span><i />可落位置 <em />上一步</span>
              <span>{ui.preview
                ? `预览 ${coordinate(ui.preview.index)} · 将翻转 ${ui.preview.flips.length} 枚`
                : last?.kind === 'move'
                  ? `上一步 ${coordinate(last.index ?? -1)} · 翻转 ${last.flips.length} 枚`
                  : `${sideName(data.roomData.currentSide)}行棋 · 从中心开始`}</span>
              <span>8 × 8 · CLASSIC</span></footer>
          </section>
          <div className={styles.mobileSelf}>
            <PlayerCard playerID={data.playerId} data={data}
              active={data.roomData.currentPlayer === data.playerId} compact />
          </div>
          <div className={styles.footnote}><ShieldCheck size={13} />
            <span>合法落点、翻转与计分均由服务端验证 · 超时自动代下</span></div>
        </section>
        <aside className={styles.sidebar}>
          <section className={`${styles.actionCard} ${mustPass ? styles.passCard : ''}`}>
            <div className={styles.actionEyebrow}><span className={styles.eyebrow}>
              {ended ? 'THE FINAL CHAPTER' : myTurn ? 'YOUR TURN' : 'OPPONENT’S TURN'}
            </span><i /></div>
            <div className={styles.turnCopy}><Disc side={data.roomData.currentSide} />
              <div><h2>{phaseTitle}</h2><p>{phaseDescription}</p></div></div>
            <div className={styles.movePreview}>
              <div><span>{ui.preview ? '预览落点' : '可落位置'}</span>
                <strong>{ui.preview ? coordinate(ui.preview.index) : data.roomData.legalMoves.length}
                  {!ui.preview && <small>处</small>}</strong></div>
              <i />
              <div><span>{ui.preview ? '将翻转' : '当前棋色'}</span>
                <strong>{ui.preview ? ui.preview.flips.length : <Disc side={data.roomData.currentSide} />}
                  <small>{ui.preview ? '枚' : sideName(data.roomData.currentSide)}</small></strong></div>
              {ui.preview && <small>{ui.preview.lines.length} 个方向</small>}
            </div>
            {actionButton}
            {ui.pendingIndex != null && <button type="button" className={styles.cancel}
              onClick={ui.clearSelection}><X size={14} />取消选择</button>}
          </section>
          <section className={styles.goal}><Trophy size={17} />
            <span className={styles.eyebrow}>THINK BEYOND THIS TURN</span>
            <h3>最后的多，<br />才是真正的多。</h3>
            <div><Disc side="black" /><Disc side="white" /><Disc side="white" />
              <ArrowRight size={15} /><Disc side="black" /><Disc side="black" /><Disc side="black" /></div>
            <p>终局时，棋子更多的一方获胜。<br />此刻少一点，也可能是下一步的伏笔。</p>
          </section>
          <section className={styles.journalCard}><header><h3>行棋记录</h3>
            <button type="button" onClick={() => ui.setPanel('activity')}>全部<ChevronRight size={13} /></button></header>
            <Journal data={data} />
            <footer><span>已落 {data.roomData.moveLog.filter(entry => entry.kind === 'move').length} 手</span>
              <span>余 <strong>{empty}</strong><small> 格</small></span></footer>
          </section>
          <div className={styles.strategyNote}><Lightbulb size={18} /><div>
            <strong>角落，是不会被翻转的底气。</strong><p>留意四个角，而不只是眼前的子数。</p></div></div>
        </aside>
      </div>
    </main>
    <div className={styles.mobileDock}>
      <button type="button" aria-label="取消落点选择" disabled={ui.pendingIndex == null}
        onClick={ui.clearSelection}><X size={20} /></button>
      {actionButton}
    </div>

    {ui.panel === 'activity' && <Dialog title="这一局的每一步" eyebrow="THE GAME JOURNAL"
      wide onClose={() => ui.setPanel(undefined)}><Journal data={data} full /></Dialog>}
    {ui.panel === 'rules' && <Dialog title="每一次翻转，都有章法。" eyebrow="THE OTHELLO HANDBOOK"
      wide onClose={() => ui.setPanel(undefined)}><div className={styles.rules}>
        {guideSections.map((section, index) => <article key={section[0]}>
          <span>0{index + 1}</span><div><h3>{section[0]}</h3><p>{section[1]}</p></div></article>)}
        <p><Info size={15} />线上对局不提供撤回或策略推荐；合法落点提示不改变服务端判定。</p>
      </div></Dialog>}
    {ui.panel === 'settings' && <Dialog title="专注于你的下一步。" eyebrow="PLAYING PREFERENCES"
      onClose={() => ui.setPanel(undefined)}
      footer={<ActionButton variant="primary" onClick={() => ui.setPanel(undefined)}>完成</ActionButton>}>
      <div className={styles.settings}>{[
        ['显示合法落点', preferences.hints, preferences.setHints],
        ['显示棋盘坐标', preferences.coordinates, preferences.setCoordinates],
        ['落子前确认', preferences.confirmMoves, preferences.setConfirmMoves],
        ['减少动态效果', preferences.reduceMotion, preferences.setReduceMotion],
      ].map(([label, value, setter]) => <div key={String(label)}><span><b>{String(label)}</b>
        <small>偏好只影响当前设备的显示与操作方式</small></span>
        <button type="button" role="switch" aria-label={String(label)} aria-checked={Boolean(value)}
          className={value ? styles.switchOn : ''}
          onClick={() => (setter as (next: boolean) => void)(!value)}><i /></button></div>)}</div>
    </Dialog>}
    {ui.panel === 'menu' && <Dialog title="落子之外" eyebrow="YOUR GAME, YOUR PACE"
      onClose={() => ui.setPanel(undefined)}><div className={styles.menu}>
        <button type="button" onClick={() => ui.setPanel('settings')}><Settings2 size={20} />
          <span><b>对局偏好</b><small>坐标、落点提示与落子前确认</small></span><ChevronRight size={16} /></button>
        <button type="button" onClick={() => ui.setPanel('activity')}><History size={20} />
          <span><b>查看棋谱</b><small>回看当前对局的每一步</small></span><ChevronRight size={16} /></button>
        <button type="button" onClick={() => ui.setPanel('rules')}><BookOpen size={20} />
          <span><b>玩法指南</b><small>经典规则、跳过与终局计分</small></span><ChevronRight size={16} /></button>
        <button type="button" className={styles.danger} disabled={ended}
          onClick={() => ui.setPanel('resign')}><Flag size={19} />
          <span><b>结束并认输</b><small>对局会立即结束并由对方获胜</small></span><ChevronRight size={16} /></button>
      </div></Dialog>}
    {ui.panel === 'resign' && <Dialog title="这一局，要在这里停下吗？" eyebrow="END THIS GAME"
      onClose={() => ui.setPanel(undefined)}
      footer={<><ActionButton onClick={() => ui.setPanel(undefined)}>继续思考</ActionButton>
        <ActionButton variant="danger" disabled={!!session.pending}
          onClick={() => {
            if (session.submit('game_resign')) ui.setPanel(undefined);
          }}>确认认输<Flag size={15} /></ActionButton></>}>
      <p className={styles.resign}>认输会立即结束当前对局，并由对方获胜。当前盘面子数会保留在棋谱中。</p>
    </Dialog>}
    {ui.panel === 'zoom' && <Dialog title="把注意力，留在棋盘。" eyebrow="FOCUS MODE"
      wide onClose={() => ui.setPanel(undefined)}><div className={styles.zoomStatus}>
        <Disc side={data.roomData.currentSide} /><strong>{phaseTitle}</strong>
        <span>黑 {data.result?.blackCount ?? data.playerData[blackID]?.discCount ?? 0}
          {' : '}{data.result?.whiteCount ?? data.playerData[whiteID]?.discCount ?? 0} 白</span></div>
      <div className={styles.zoomBoard}>{board(true)}</div>
      <p className={styles.zoomInstruction}>{phaseDescription}</p>
      <div className={styles.zoomActions}><ActionButton onClick={() => ui.setPanel(undefined)}>收起棋盘</ActionButton>
        {actionButton}</div></Dialog>}
  </div>;
}
