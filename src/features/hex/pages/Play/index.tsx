import {
  ArrowLeft, ArrowLeftRight, BookOpen, Check, Flag, History,
  Maximize2, MoreHorizontal, ShieldCheck, Trophy, X,
} from 'lucide-react';
import TurnCountdown from '@/components/TurnCountdown';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GameMobileTopbar } from '@/components/GameUI/GameMobileTopbar';
import { Board } from '../../components/Board';
import { PlayerAvatar } from '../../components/AppShell';
import { Stone } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import type { HexSession } from '../../hooks/useHexSession';
import { useHexPlayUI } from '../../hooks/useHexPlayUI';
import { useHexViewport } from '../../hooks/useHexViewport';
import { actionLabel, coordinate, direction, sideName } from '../../model/board';
import { currentSide, isLegalMove, phaseCopy, playerForSide } from '../../model/selectors';
import { playerName, type GameSnapshot } from '../../model/session';
import type { Cell, Side } from '../../model/types';
import { Results } from '../Results';

function PlayerCard({ data, side }: { data: GameSnapshot; side: Side }) {
  const playerID = playerForSide(data, side);
  const active = data.roomData.currentPlayer === playerID
    && data.roomData.gameStatus === 'playing';
  return <div className={`player-card ${side} ${active ? 'active' : ''}`}>
    <Stone side={side} /><div className="player-info"><strong>
      {playerName(playerID, data.roomData.players)}
      {playerID === data.playerId && <em>你</em>}
    </strong><small>{sideName(side)} · {direction(side)}
      {data.roomData.players[playerID]?.ai ? ' · AI' : ''}</small></div>
    <div className="player-stock"><span>{active ? '正在行动' : '已落棋子'}</span>
      <strong>{data.playerData[playerID]?.stoneCount ?? 0}<small> 子</small></strong></div>
    {active && <i className="active-line" />}
  </div>;
}

function Journal({ data, full = false }: { data: GameSnapshot; full?: boolean }) {
  const values = [...data.roomData.moveLog].reverse();
  const entries = full ? values : values.slice(0, 4);
  if (!entries.length) return <p className="journal-empty">棋路，从第一子开始。</p>;
  return <ol>{entries.map(entry => <li key={entry.id}>
    <small>{String(entry.id).padStart(2, '0')}</small>
    <Stone side={entry.side} /><span>{actionLabel(entry)}</span>
  </li>)}</ol>;
}

const rules = [
  ['连接两岸', '陶红连接南北，湖绿连接东西；最先形成连续同色路径的一方获胜。'],
  ['六向相邻', '只有共享边的六个方向相邻，路径可以转弯，角点接近不算连接。'],
  ['交换规则', '首子后，第二位玩家可接手首子的颜色和目标边；首子留在原位。'],
  ['落子与胜负', '每回合在一个空格落子，棋子不移动、不移除，Hex 没有平局。'],
] as const;

export function Play({
  session, data, onLeave, onStartNextMatch, startNextMatchPending = false,
}: {
  session: HexSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch?: () => Promise<boolean>;
  startNextMatchPending?: boolean;
}) {
  const ui = useHexPlayUI(data);
  const { isMobile } = useHexViewport();
  const ended = data.roomData.gameStatus === 'end';
  const side = currentSide(data);
  const myTurn = data.roomData.currentPlayer === data.playerId;
  const connected = session.connection.status === 'connected';
  const interactive = !ended && myTurn && connected && !session.pending;
  const [, phaseDescription] = phaseCopy(data);
  const selectedLegal = !!ui.selected && isLegalMove(data, ui.selected);

  const commit = (cell: Cell) => {
    if (interactive && isLegalMove(data, cell)
      && session.submit('game_place_stone', { cell })) ui.clearSelection();
  };
  const select = (cell: Cell) => {
    if (!interactive || !isLegalMove(data, cell)) return;
    if (isMobile) ui.setSelected(cell);
    else commit(cell);
  };
  const board = (readOnly = false, prefix = '') => <Board
    board={data.roomData.board} currentSide={side}
    legalMoves={readOnly ? [] : data.roomData.legalMoves}
    winningPath={data.roomData.winningPath}
    lastAction={data.roomData.lastAction}
    selected={readOnly ? undefined : ui.selected}
    hovered={readOnly ? undefined : ui.hovered}
    interactive={!readOnly && interactive}
    coordinates={ui.showCoordinates} testPrefix={prefix}
    onSelect={readOnly ? undefined : select}
    onHover={readOnly ? undefined : ui.setHovered}
  />;

  if (ended && ui.showResults) {
    return <Results data={data} onViewBoard={() => ui.setShowResults(false)}
      onRestart={onStartNextMatch} restarting={startNextMatchPending} />;
  }
  const status = session.pending ? '等待服务端确认'
    : !connected ? '等待连接恢复'
      : !myTurn ? phaseDescription
        : ui.selected ? `预选 ${coordinate(ui.selected)}`
          : isMobile ? '轻点空格预选' : '点击空格直接落子';

  return <div className="playing-page" data-testid="game-page">
    <GameMobileTopbar
      onBack={onLeave}
      backLabel="返回大厅"
      kicker={`HEX · 第 ${data.roomData.roundNo} 局`}
      title={data.roomID}
      status={!ended && data.roomData.turnDeadline
        ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
        : ended ? '已结束' : '--'}
      actions={<>
        <button type="button" className="header-help" aria-label="玩法指南"
          title="玩法指南" onClick={() => ui.setPanel('rules')}>
          <BookOpen size={19} /><span data-game-mobile-action-label>玩法指南</span></button>
        {!ended && <button type="button" className="icon-button"
          aria-label="打开对局菜单" title="打开对局菜单"
          onClick={() => ui.setPanel('menu')}><MoreHorizontal size={23} /></button>}
        {ended && <button type="button" className="header-help"
          aria-label="返回终局结算" title="返回终局结算"
          onClick={() => ui.setShowResults(true)}>
          <Trophy size={17} /><span data-game-mobile-action-label>结算</span></button>}
      </>}
    />
    <div className="top-shell" data-game-desktop-topbar><header className="app-header">
      <button className="icon-button back-button" aria-label="返回大厅"
        onClick={onLeave}><ArrowLeft size={20} /></button>
      <div className="header-context match-context"><strong>{data.roomID}</strong>
        <small>Hex · 第 {data.roomData.roundNo} 局 · 60 秒回合</small></div>
      <span className="header-space" /><span className="local-tag"><i />服务端权威</span>
      <button className="header-help" aria-label="玩法指南"
        onClick={() => ui.setPanel('rules')}><BookOpen size={19} /><span>玩法指南</span></button>
      {!ended && <button className="icon-button" aria-label="打开对局菜单"
        onClick={() => ui.setPanel('menu')}><MoreHorizontal size={23} /></button>}
      {ended ? <button className="header-help" onClick={() => ui.setShowResults(true)}>
        <Trophy size={17} /><span>结算</span></button>
        : <span className="header-context turn-context"><strong>
          {data.roomData.turnDeadline
            ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} /> : '--'}
        </strong><small>本回合剩余</small></span>}
      <span className="header-user"><PlayerAvatar
        name={playerName(data.playerId, data.roomData.players)}
        avatar={data.roomData.players[data.playerId]?.avatar}
        ai={data.roomData.players[data.playerId]?.ai} size={32} /></span>
    </header></div>

    <main className="game-main"><div className="game-head"><div>
      <span className="eyebrow"><i />THE ART OF CONNECTION</span>
      <h1>落子之间，两岸相连。</h1></div></div>
      <div className="game-grid"><section className="board-column">
        <div className="desktop-matchup"><PlayerCard data={data} side="red" />
          <div className="versus"><span>×</span><small>先连两岸者胜</small></div>
          <PlayerCard data={data} side="teal" /></div>
        <div className="mobile-player"><PlayerCard data={data}
          side={data.playerData[data.playerId]?.side === 'red' ? 'teal' : 'red'} /></div>
        <div className="arena"><div className="arena-header">
          <span><i />11 × 11 经典棋盘 · 第 {data.roomData.moveLog.length + 1} 手</span>
          <div><button aria-label="切换坐标"
            onClick={() => ui.setShowCoordinates(value => !value)}>坐标</button>
            <button aria-label="放大棋盘" onClick={() => ui.setPanel('zoom')}>
              <Maximize2 size={16} /></button></div></div>
          <div className="board-stage">{board()}</div>
          <div className="board-legend"><span>陶红 · 南北</span>
            <span>湖绿 · 东西</span><span>◎ 上一手</span></div></div>
        {data.roomData.swapAvailable && myTurn && <div className="swap-callout">
          <ArrowLeftRight size={18} /><span><b>后手的选择</b>
            <small>正常落子，或交换颜色与目标边。</small></span>
          <button onClick={() => ui.setPanel('swap')}>了解并交换</button></div>}
        <div className="mobile-player self"><PlayerCard data={data}
          side={data.playerData[data.playerId]?.side ?? 'red'} /></div>
        <div className="board-footnote"><ShieldCheck size={14} />
          <span>落点、交换与胜负均由服务端验证</span></div>
      </section><aside className="game-sidebar">
        <section className="action-panel"><div className="turn-heading">
          <Stone side={side} /><div><h2>{myTurn ? '轮到你了' : '等待对手'}</h2>
            <p>{status}</p></div></div>
          <button className="button primary" disabled={!selectedLegal}
            data-click-sound="game-place"
            onClick={() => ui.selected && commit(ui.selected)}>
            {ui.selected ? `确认落子 ${coordinate(ui.selected)}` : '请选择空格'}<Check size={17} />
          </button></section>
        <section className="strategy-card"><h3>看见相邻，<br />也看见远方。</h3>
          <p>连接不必是一条直线，每一枚子都在为下一步铺路。</p></section>
        <section className="journal-card"><div><h3>行棋记录</h3>
          <button onClick={() => ui.setPanel('activity')}>全部<History size={14} /></button></div>
          <Journal data={data} /></section>
      </aside></div>
    </main>

    {!ended && <div className="mobile-game-dock" data-testid="hex-mobile-dock">
      <button type="button" className="dock-undo" aria-label="取消选择"
        disabled={!ui.selected} onClick={ui.clearSelection}><X size={18} /></button>
      <ActionButton variant="primary" disabled={!selectedLegal || !interactive}
        data-click-sound="game-place"
        onClick={() => ui.selected && commit(ui.selected)}>
        {ui.selected ? `确认落子 ${coordinate(ui.selected)}` : status}
        {selectedLegal && <Check size={17} />}
      </ActionButton></div>}
    {ui.panel === 'activity' && <Dialog title="行棋记录" eyebrow="THE PATH SO FAR"
      onClose={() => ui.setPanel(undefined)}><Journal data={data} full /></Dialog>}
    {ui.panel === 'rules' && <Dialog title="玩法指南" eyebrow="A SMALL GUIDE TO HEX"
      onClose={() => ui.setPanel(undefined)}><div className="checks-list">
        {rules.map(([title, copy]) => <section key={title}>
          <h3>{title}</h3><p>{copy}</p></section>)}
      </div></Dialog>}
    {ui.panel === 'menu' && <Dialog title="这一局，慢慢来" eyebrow="A QUIET MOMENT"
      onClose={() => ui.setPanel(undefined)}><div className="menu-list">
        <button onClick={() => ui.setPanel('activity')}>
          <History size={18} /><span>行棋记录</span></button>
        <button onClick={() => ui.setPanel('rules')}>
          <BookOpen size={18} /><span>玩法指南</span></button>
        <button onClick={onLeave}><ArrowLeft size={18} /><span>离开对局</span></button>
        <button className="danger" onClick={() => ui.setPanel('resign')}>
          <Flag size={18} /><span>认输</span></button>
      </div></Dialog>}
    {ui.panel === 'resign' && <Dialog title="确定结束这一局吗？" eyebrow="RESIGN"
      onClose={() => ui.setPanel(undefined)}
      footer={<><ActionButton onClick={() => ui.setPanel(undefined)}>继续对局</ActionButton>
        <ActionButton variant="danger" disabled={!interactive}
          onClick={() => session.submit('game_resign') && ui.setPanel(undefined)}>
          确认认输</ActionButton></>}>
      <p className="dialog-paragraph">当前棋盘和行棋记录会进入正式棋谱。</p>
    </Dialog>}
    {ui.panel === 'swap' && <Dialog title="交换颜色，也交换目标" eyebrow="THE FAIR CHOICE"
      onClose={() => ui.setPanel(undefined)}
      footer={<><ActionButton onClick={() => ui.setPanel(undefined)}>保留湖绿</ActionButton>
        <ActionButton variant="primary" disabled={!interactive}
          onClick={() => session.submit('game_swap') && ui.setPanel(undefined)}>
          确认交换<ArrowLeftRight size={16} /></ActionButton></>}>
      <p className="dialog-paragraph">
        首子留在原处。你接手陶红与南北目标，对方改执湖绿并继续下一手。
      </p>
    </Dialog>}
    {ui.panel === 'zoom' && <Dialog title="专注棋盘" eyebrow="FOCUS ON THE CONNECTION"
      wide onClose={() => ui.setPanel(undefined)}>
      <div className="focus-board">{board(false, 'zoom-')}</div></Dialog>}
  </div>;
}
