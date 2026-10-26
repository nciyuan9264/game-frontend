import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  BrickWall,
  ChevronRight,
  Clock3,
  Flag,
  Footprints,
  History,
  Info,
  Maximize2,
  MoreHorizontal,
  RotateCw,
  Route,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import TurnCountdown from '@/components/TurnCountdown';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Board } from '../../components/Board';
import { PlayerAvatar } from '../../components/AppShell';
import {
  Brand,
  Pawn,
  WallRack,
} from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { WallPicker } from '../../components/WallPicker';
import type { QuoridorSession } from '../../hooks/useQuoridorSession';
import { useQuoridorPlayUI } from '../../hooks/useQuoridorPlayUI';
import { useQuoridorViewport } from '../../hooks/useQuoridorViewport';
import {
  actionLabel,
  colorName,
  coordinate,
  sideName,
  targetRow,
  wallLabel,
} from '../../model/board';
import {
  currentSide as selectCurrentSide,
  isLegalMove,
  phaseCopy,
  playerForSide,
  wallSelectionCopy,
} from '../../model/selectors';
import {
  playerName,
  type GameSnapshot,
} from '../../model/session';
import type {
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
  const self = playerID === data.playerId;
  return <div className={`player-card ${side} ${active ? 'active' : ''}`}>
    <Pawn side={side} />
    <div className="player-info">
      <strong>{playerName(playerID, data.roomData.players)}
        {self && <em>你</em>}
        <span className="mobile-turn-label">
          {active ? '正在行动' : '等待对方'}
        </span>
      </strong>
      <small>{colorName(side)} · 向{side === 'south' ? '北' : '南'}
        抵达第 {targetRow(side) + 1} 行{player?.ai ? ' · AI' : ''}</small>
    </div>
    <div className="player-stock">
      <span>{active ? '正在行动' : '剩余围墙'}</span>
      <strong>{state?.wallsRemaining ?? data.roomData.wallStock[side]}
        <small>/ 10</small></strong>
      <WallRack
        count={state?.wallsRemaining ?? data.roomData.wallStock[side]}
        side={side}
        small
      />
    </div>
    {active && <i className="active-line" />}
  </div>;
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
    return <p className="journal-empty">第一步，还在你的思考里。</p>;
  }
  return <ol>
    {visible.map(entry => <li key={entry.id}>
      <small>{String(entry.id).padStart(2, '0')}</small>
      <Pawn side={entry.side} />
      <span>{actionLabel(entry)}</span>
    </li>)}
  </ol>;
}

const guideSections = [
  ['目标与回合', '双方从底边中央出发，各持十道围墙。每回合移动棋子或放置一道围墙，先到对边任意一格者获胜。'],
  ['围墙规则', '一墙横跨两格，可以横放或竖放，但不能重叠、交叉，也不能封死任一方到达目标行的全部通路。'],
  ['相遇与跳跃', '棋子迎面相邻且背后无墙时，可以直线跳过；背后被墙或边界阻挡时，才可从侧面斜向绕行。'],
  ['胜负判定', '抵达目标行后立即结束。余墙数量和双方行动次数不参与胜负比较；认输则由对手获胜。'],
] as const;

function plainButton(
  content: ReactNode,
  {
    disabled,
    label,
    onClick,
  }: {
    disabled?: boolean;
    label: string;
    onClick?: () => void;
  },
) {
  return <button
    type="button"
    className="button primary"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
  >{content}</button>;
}

export function Play({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending = false,
}: {
  session: QuoridorSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch?: () => Promise<boolean>;
  startNextMatchPending?: boolean;
}) {
  const ui = useQuoridorPlayUI(data);
  const { isMobile } = useQuoridorViewport();
  const ended = data.roomData.gameStatus === 'end';
  const side = selectCurrentSide(data);
  const myTurn = data.roomData.currentPlayer === data.playerId;
  const connected = session.connection.status === 'connected';
  const interactive = !ended
    && data.roomData.gameStatus === 'playing'
    && myTurn
    && connected
    && !session.pending;
  const [, phaseDescription] = phaseCopy(data);
  const selected = ui.selected;
  const selectedLegal = selected?.kind === 'move'
    ? isLegalMove(data, selected.to)
    : selected?.kind === 'wall'
      ? ui.selectedWallOption?.legal === true
      : false;
  const lastAction = data.roomData.lastAction;

  const commit = (action: PendingAction) => {
    if (!interactive) return;
    const accepted = action.kind === 'move'
      ? session.submit('game_move_pawn', { to: action.to })
      : session.submit('game_place_wall', { wall: action.wall });
    if (accepted) ui.clearSelection();
  };
  const select = (action: PendingAction) => {
    if (!interactive) return;
    if (action.kind === 'move') {
      if (!isLegalMove(data, action.to)) return;
      if (isMobile) ui.selectMove(action.to);
      else commit(action);
      return;
    }
    ui.selectWall(action.wall);
  };
  const confirm = () => {
    if (selected && selectedLegal) commit(selected);
  };
  const primaryAction = selected
    ? plainButton(<>{selected.kind === 'wall' ? '确认放墙' : '确认移动'}
      <ArrowRight size={17} /></>, {
      label: selected.kind === 'wall' ? '确认放墙' : '确认移动',
      disabled: !interactive || !selectedLegal,
      onClick: confirm,
    })
    : plainButton(<>{session.pending
      ? '等待服务端确认'
      : !connected
        ? '等待连接恢复'
        : !myTurn
          ? '等待对手行动'
          : ui.mode === 'wall'
            ? '请先选择墙槽'
            : isMobile
              ? '点选可达位置'
              : '选择棋盘上的可达位置'}
      <Clock3 size={17} /></>, {
      label: '当前行动状态',
      disabled: true,
    });

  const board = (readOnly = false, prefix = '') => <Board
    pawns={data.roomData.pawns}
    walls={data.roomData.walls}
    currentSide={side}
    legalMoves={data.roomData.legalMoves}
    wallOptions={data.roomData.wallOptions}
    referencePaths={data.roomData.referencePaths}
    lastAction={lastAction}
    mode={ui.mode}
    orientation={ui.orientation}
    selected={readOnly ? undefined : ui.selected}
    hovered={readOnly ? undefined : ui.hovered}
    interactive={!readOnly && interactive}
    showMoves
    showPath={!readOnly && ui.showPath}
    coordinates
    testPrefix={prefix}
    onSelect={readOnly ? undefined : select}
    onHover={readOnly ? undefined : ui.setHovered}
    onRotate={readOnly ? undefined : ui.rotate}
    onCancel={readOnly ? undefined : ui.clearSelection}
    onConfirm={readOnly ? undefined : confirm}
  />;

  if (ended && ui.showResults) {
    return <Results
      data={data}
      onViewBoard={() => ui.setShowResults(false)}
      onRestart={onStartNextMatch}
      restarting={startNextMatchPending}
    />;
  }

  const instruction = selected
    ? selected.kind === 'wall'
      ? `${wallLabel(selected.wall)} · ${wallSelectionCopy(ui.selectedWallOption)}`
      : `${coordinate(data.roomData.pawns[side])} → ${coordinate(selected.to)} · 确认后行动`
    : session.pending
      ? '行动已发送，正在等待服务端权威快照。'
      : !connected
        ? '连接暂时中断，棋盘保持只读。'
        : !myTurn
          ? phaseDescription
          : ui.mode === 'wall'
            ? '轻点墙槽交点，预览一段两格长的围墙。'
            : isMobile
              ? '点选服务端标出的可达位置，再确认移动。'
              : '点击服务端标出的可达位置，立即提交移动。';

  return <div
    className={`playing-page ${ui.mode === 'wall' ? 'wall-turn' : ''}`}
    data-testid="game-page"
    data-turns={data.roomData.moveLog.length}
    data-walls={data.roomData.walls.length}
    data-south={coordinate(data.roomData.pawns.south)}
    data-north={coordinate(data.roomData.pawns.north)}
  >
    <div className="top-shell">
      <header className="app-header">
        <button type="button" className="icon-button back-button"
          aria-label="返回大厅" onClick={onLeave}><ArrowLeft size={20} /></button>
        <button type="button" className="brand-button"
          aria-label="步步为营游戏大厅" onClick={onLeave}><Brand /></button>
        <span className="header-divider" />
        <div className="header-context"><strong>{data.roomID}</strong>
          <small>Quoridor · 第 {data.roomData.roundNo} 局 · 60 秒回合</small></div>
        <span className="header-space" />
        <span className="local-tag"><i />服务端权威</span>
        <button type="button" className="icon-button mobile-tool"
          aria-label="查看行棋记录" onClick={() => ui.setPanel('activity')}>
          <History size={20} /></button>
        <button type="button" className="header-help" aria-label="玩法指南"
          onClick={() => ui.setPanel('rules')}><BookOpen size={19} />
          <span>玩法指南</span></button>
        <button type="button" className="icon-button" aria-label="打开对局菜单"
          onClick={() => ui.setPanel('menu')}><MoreHorizontal size={23} /></button>
        {ended
          ? <button type="button" className="header-help"
            onClick={() => ui.setShowResults(true)}>
            <Trophy size={17} /><span>结算</span></button>
          : <span className="header-context">
            <strong>{data.roomData.turnDeadline
              ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
              : '--'}</strong><small>本回合剩余</small></span>}
        <span className="header-user">
          <PlayerAvatar
            name={playerName(data.playerId, data.roomData.players)}
            avatar={data.roomData.players[data.playerId]?.avatar}
            size={32}
          />
        </span>
      </header>
    </div>

    <main className="game-main">
      <div className="game-head">
        <div><span className="eyebrow"><i />THE ART OF FINDING A WAY</span>
          <h1>步步为营，亦步亦远。</h1></div>
        <div><span><Users size={15} />经典双人</span>
          <span><Clock3 size={15} />60 秒回合</span></div>
      </div>
      <div className="game-grid">
        <section className="board-column">
          <div className="desktop-matchup">
            <PlayerCard data={data} side="south" />
            <div className="versus"><span>VS</span><small>先到对边者胜</small></div>
            <PlayerCard data={data} side="north" />
          </div>
          <div className="mobile-player">
            <PlayerCard
              data={data}
              side={data.playerData[data.playerId]?.side === 'south' ? 'north' : 'south'}
            />
          </div>
          <div className="arena">
            <div className="arena-header">
              <span><i />经典棋盘 <em>·</em> 第 {
                data.roomData.moveLog.length + 1
              } 回合</span>
              <div>
                <button type="button" className={ui.showPath ? 'active' : ''}
                  aria-label="切换通路参考" aria-pressed={ui.showPath}
                  onClick={() => ui.setShowPath(value => !value)}>
                  <Route size={15} /><span>通路参考</span></button>
                <button type="button" aria-label="放大棋盘"
                  onClick={() => ui.setPanel('zoom')}>
                  <Maximize2 size={16} /></button>
              </div>
            </div>
            <div className="board-stage">
              <div className="board-edition"><span>Q / 03</span><i />
                <small>THE QUIET<br />COLLECTION</small></div>
              {board()}
              <div className="board-side-note"><strong>81</strong>
                <span>方格之间</span><i />
                <small>EVERY WALL.<br />A NEW WAY.</small></div>
            </div>
            <div className="board-legend">
              <span><i className="legend-dot" />可到达
                <i className="legend-wall" />已放围墙</span>
              <span className="goal-key"><i />{sideName(side)}
                目标：第 {targetRow(side) + 1} 行</span>
              <span>9 × 9 · CLASSIC</span>
            </div>
          </div>
          <div className="mobile-player self">
            <PlayerCard data={data}
              side={data.playerData[data.playerId]?.side ?? 'south'} />
          </div>
          <div className="board-footnote"><ShieldCheck size={14} />
            <span>标准开局 · 每次移动、放墙与通路均由服务端验证</span>
          </div>
        </section>

        <aside className="game-sidebar">
          <section
            className={`action-panel ${selected ? 'has-pending' : ''} ${
              selected && !selectedLegal ? 'invalid' : ''
            }`}
            data-testid={interactive ? 'human-turn' : 'opponent-turn'}
            aria-live="polite"
          >
            <div className="action-eyebrow">
              <span className="eyebrow"><i />{
                myTurn ? 'YOUR NEXT STEP' : 'OPPONENT’S TURN'
              }</span><i className={!myTurn ? 'thinking' : ''} />
            </div>
            <div className="turn-heading"><Pawn side={side} /><div>
              <h2>{myTurn ? '轮到你了' : `${playerName(
                data.roomData.currentPlayer,
                data.roomData.players,
              )}在思考`}</h2>
              <p>{phaseDescription}</p></div></div>
            <div className="action-tabs" aria-label="回合行动">
              <button type="button" className={ui.mode === 'move' ? 'active' : ''}
                aria-label="移动棋子" aria-pressed={ui.mode === 'move'}
                disabled={!interactive} onClick={() => ui.setMode('move')}>
                <Footprints size={17} />移动棋子</button>
              <button type="button" className={ui.mode === 'wall' ? 'active' : ''}
                aria-label="放置围墙" aria-pressed={ui.mode === 'wall'}
                disabled={!interactive || data.roomData.wallStock[side] <= 0}
                onClick={() => ui.setMode('wall')}>
                <BrickWall size={17} />放置围墙
                <small>{data.roomData.wallStock[side]}</small></button>
            </div>
            <div className="mobile-instruction" data-testid="mobile-action-status">
              {instruction}
            </div>
            {ui.mode === 'wall' && <>
              <div className="wall-tools"><span><BrickWall size={15} />
                {ui.orientation === 'h' ? '横向' : '纵向'} · 跨两格</span>
                <button type="button" aria-label="旋转围墙"
                  disabled={!interactive} onClick={ui.rotate}>
                  <RotateCw size={15} />旋转</button></div>
              <div className="phone-wall-bar" aria-label="围墙触控定位">
                <button type="button" className="phone-slot-open"
                  aria-label="精确选择墙槽" disabled={!interactive}
                  onClick={() => ui.setPanel('wall-picker')}>
                  <Maximize2 size={16} /><span>{selected?.kind === 'wall'
                    ? wallLabel(selected.wall)
                    : '精确选位'}</span></button>
                <button type="button" className="phone-rotate"
                  aria-label="旋转围墙" disabled={!interactive} onClick={ui.rotate}>
                  <RotateCw size={17} /><small>{
                    ui.orientation === 'h' ? '横' : '纵'
                  }</small></button>
                <div className="phone-wall-arrows">
                  <button type="button" aria-label="围墙向左微调"
                    disabled={!interactive || selected?.kind !== 'wall'
                      || selected.wall.column === 0}
                    onClick={() => ui.nudgeWall(0, -1)}><ArrowLeft size={17} /></button>
                  <button type="button" aria-label="围墙向上微调"
                    disabled={!interactive || selected?.kind !== 'wall'
                      || selected.wall.row === 0}
                    onClick={() => ui.nudgeWall(-1, 0)}><ArrowUp size={17} /></button>
                  <button type="button" aria-label="围墙向下微调"
                    disabled={!interactive || selected?.kind !== 'wall'
                      || selected.wall.row === 7}
                    onClick={() => ui.nudgeWall(1, 0)}><ArrowDown size={17} /></button>
                  <button type="button" aria-label="围墙向右微调"
                    disabled={!interactive || selected?.kind !== 'wall'
                      || selected.wall.column === 7}
                    onClick={() => ui.nudgeWall(0, 1)}><ArrowRight size={17} /></button>
                </div>
              </div>
            </>}
            <div className="action-summary">
              <div><span>{selected
                ? selected.kind === 'wall' ? '候选墙槽' : '前往位置'
                : '当前位置'}</span>
                <strong>{selected
                  ? selected.kind === 'wall'
                    ? coordinate(selected.wall)
                    : coordinate(selected.to)
                  : coordinate(data.roomData.pawns[side])}</strong></div>
              <i />
              <div><span>{selected?.kind === 'wall'
                ? '确认后余墙' : '剩余围墙'}</span>
                <strong>{Math.max(0, data.roomData.wallStock[side]
                  - (selected?.kind === 'wall' && selectedLegal ? 1 : 0))}
                  <small>道</small></strong></div>
            </div>
            {selected?.kind === 'wall' && <div className="wall-nudge">
              <span>微调位置</span>
              <button type="button" aria-label="围墙向左微调"
                onClick={() => ui.nudgeWall(0, -1)}><ArrowLeft size={15} /></button>
              <button type="button" aria-label="围墙向上微调"
                onClick={() => ui.nudgeWall(-1, 0)}><ArrowUp size={15} /></button>
              <button type="button" aria-label="围墙向下微调"
                onClick={() => ui.nudgeWall(1, 0)}><ArrowDown size={15} /></button>
              <button type="button" aria-label="围墙向右微调"
                onClick={() => ui.nudgeWall(0, 1)}><ArrowRight size={15} /></button>
            </div>}
            <p className={`action-notice ${
              selected && !selectedLegal ? 'error' : ''
            }`} data-testid={selected && !selectedLegal
              ? 'invalid-action' : 'action-description'}>{instruction}</p>
            <div className="desktop-actions">{primaryAction}
              <div className="secondary-actions">
                <button type="button" aria-label="取消选择"
                  disabled={!selected} onClick={ui.clearSelection}>
                  <X size={14} />取消选择</button>
                <button type="button" aria-label="查看行棋记录"
                  onClick={() => ui.setPanel('activity')}>
                  <History size={14} />行棋记录</button>
              </div>
            </div>
          </section>
          <section className="strategy-card">
            <div><span className="eyebrow"><i />THINK BEYOND THE WALL</span>
              <Route size={18} /></div>
            <h3>每一道墙，<br />都在改写路线。</h3>
            <div className="strategy-route"><span /><BrickWall size={23} />
              <span /><ArrowRight size={20} /></div>
            <p>不只是让对手更远。<br />也别忘了，给自己留一条路。</p>
            <button type="button" onClick={() => ui.setPanel('rules')}>
              读懂这一步<ArrowUpRight size={15} /></button>
          </section>
          <section className="journal-card"><div>
            <h3>行棋记录</h3>
            <button type="button" onClick={() => ui.setPanel('activity')}>
              全部<ChevronRight size={12} /></button></div>
            <Journal data={data} />
            <footer><span>已行动 <strong>{data.roomData.moveLog.length}</strong>
              <small>回合</small></span>
              <span>盘上 <strong>{data.roomData.walls.length}</strong>
                <small>道墙</small></span></footer>
          </section>
          {ui.showPath && <p className="route-disclaimer"><Info size={15} />
            虚线路径来自服务端，仅供结构通路参考。</p>}
        </aside>
      </div>
      <div className="game-footer"><Brand small />
        <span>有墙的地方，也有路。</span>
        <span>QUORIDOR · ABSTRACT STRATEGY</span></div>
      <div className="mobile-game-dock"><div>
        <button type="button" className="dock-undo" aria-label="取消选择"
          disabled={!selected} onClick={ui.clearSelection}><X size={21} /></button>
        {primaryAction}
      </div></div>
    </main>

    {ui.panel === 'activity' && <Dialog title="每一步，都有来路。"
      eyebrow="THE GAME JOURNAL" wide onClose={() => ui.setPanel(undefined)}>
      <div className="journal-card"><Journal data={data} full /></div>
    </Dialog>}
    {ui.panel === 'rules' && <Dialog title="规则很短，路可以很长。"
      eyebrow="THE QUORIDOR HANDBOOK" wide onClose={() => ui.setPanel(undefined)}>
      <div className="rules">{guideSections.map(([title, copy], index) =>
        <article key={title}><span>0{index + 1}</span><div>
          <h3>{title}</h3><p>{copy}</p></div></article>)}
        <p><ShieldCheck size={16} />
          客户端只展示服务端确认的合法落点、墙位与参考通路。</p>
      </div>
    </Dialog>}
    {ui.panel === 'menu' && <Dialog title="落步之外。"
      eyebrow="YOUR GAME, YOUR PACE" onClose={() => ui.setPanel(undefined)}>
      <div className="menu">
        <button type="button" onClick={() => ui.setPanel('activity')}>
          <History size={21} /><span><b>行棋记录</b>
            <small>查看本局每一次移动与放墙</small></span>
          <ChevronRight size={16} /></button>
        <button type="button" onClick={() => ui.setPanel('rules')}>
          <BookOpen size={21} /><span><b>玩法指南</b>
            <small>目标、围墙、跳跃与胜负</small></span>
          <ChevronRight size={16} /></button>
        {!ended && <button type="button" className="danger"
          onClick={() => ui.setPanel('resign')}>
          <Flag size={21} /><span><b>结束并认输</b>
            <small>需要再次确认，本局立即结束</small></span>
          <ChevronRight size={16} /></button>}
      </div>
    </Dialog>}
    {ui.panel === 'resign' && <Dialog title="这一程，要在这里停下吗？"
      eyebrow="END THIS JOURNEY" onClose={() => ui.setPanel(undefined)}
      footer={<><ActionButton onClick={() => ui.setPanel(undefined)}>
        继续思考</ActionButton>
      <ActionButton variant="danger" disabled={!interactive}
        onClick={() => {
          if (session.submit('game_resign')) ui.setPanel(undefined);
        }}>确认认输<Flag size={16} /></ActionButton></>}>
      <p className="resign"><Info size={18} />
        确认后，本局将由服务端以你认输结束并写入正式棋谱。</p>
    </Dialog>}
    {ui.panel === 'zoom' && <Dialog title="棋盘全局"
      eyebrow="A QUIET LOOK AT THE BOARD" wide onClose={() => ui.setPanel(undefined)}>
      <div className="focus-board">{board(true, 'zoom-')}</div>
      <p className="focus-note">只读棋盘，不会改变当前对局。</p>
    </Dialog>}
    {ui.panel === 'wall-picker' && <WallPicker
      data={data}
      initial={selected?.kind === 'wall'
        ? selected.wall
        : { row: 3, column: 3, orientation: ui.orientation }}
      onClose={() => ui.setPanel(undefined)}
      onUse={wall => {
        ui.selectWall(wall);
        ui.setPanel(undefined);
      }}
    />}
  </div>;
}
