import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Footprints,
  History,
  Info,
  Layers,
  LockKeyhole,
  MapPin,
  NotebookPen,
  Plus,
  Route,
  Search,
  Shield,
  Target,
  TriangleAlert,
} from 'lucide-react';
import {
  GameMobileTopbar,
  GameMobileTopbarCountdown,
} from '@/components/GameUI/GameMobileTopbar';
import {
  Brand,
  CardBack,
  CardFace,
  Eyebrow,
  Modal,
  Portrait,
  SourceLinks,
  pad,
  roleName,
} from '../../components/Visual';
import { formatActionLog } from '../../model/actionLog';
import type { FugitiveSession } from '../../hooks/useFugitiveSession';
import {
  canReach,
  isMyTurn,
  knownNumbers,
  lastPrivateHideout,
  selfRole,
} from '../../model/selectors';
import {
  playerLabel,
  type GameSnapshot,
} from '../../model/session';
import type {
  Role,
  RouteCard,
} from '../../model/types';
import { Results } from '../Results';

type Panel =
  | 'choose'
  | 'move'
  | 'hand'
  | 'notebook'
  | 'confirm-search'
  | 'pass'
  | 'history'
  | 'rules'
  | 'detail'
  | 'player'
  | undefined;

function useCountdown(deadline?: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  if (!deadline) return '';
  const remaining = Math.max(0, new Date(deadline).getTime() - now);
  return `${Math.ceil(remaining / 1000)}s`;
}

function routeCardForViewer(
  routeCard: RouteCard,
  role: Role,
  peek: boolean,
  revealAll: boolean,
) {
  if (revealAll || routeCard.revealed || role === 'fugitive' && peek) {
    return routeCard.card;
  }
  return undefined;
}

export function Play({
  session,
  data,
  roomName,
  onLeave,
  onStartNextMatch,
  startNextMatchPending,
  connectionNotice,
}: {
  session: FugitiveSession;
  data: GameSnapshot;
  roomName: string;
  onLeave: () => void;
  onStartNextMatch: () => void;
  startNextMatchPending: boolean;
  connectionNotice?: string;
}) {
  const [panel, setPanel] = useState<Panel>();
  const [selected, setSelected] = useState<number>();
  const [sprints, setSprints] = useState<number[]>([]);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [notes, setNotes] = useState<number[]>([]);
  const [markMode, setMarkMode] = useState(false);
  const [peek, setPeek] = useState(true);
  const [detail, setDetail] = useState(0);
  const [playerRole, setPlayerRole] = useState<Role>('fugitive');
  const [reviewing, setReviewing] = useState(false);
  const routeScroll = useRef<HTMLDivElement>(null);
  const role = selfRole(data);
  const isRunner = role === 'fugitive';
  const phase = data.roomData.gameStatus;
  const revealAll = phase === 'end';
  const myTurn = isMyTurn(data);
  const enabled = session.connection.status === 'connected' && !session.pending;
  const active = enabled && myTurn;
  const canPlanSearch = !isRunner && myTurn
    && ['marshalSearch', 'manhunt'].includes(phase);
  const current = lastPrivateHideout(data);
  const hidden = data.roomData.hiddenHideoutCount;
  const known = knownNumbers(data);
  const countdown = useCountdown(data.roomData.turnDeadline);
  const selectedCard = data.hand.find(value => value.number === selected);
  const detailView = data.roomData.route[detail];
  const detailCard = detailView
    ? routeCardForViewer(detailView, role, peek, revealAll)
    : undefined;
  const logs = [...data.roomData.activityLog].reverse();
  const routeProgress = revealAll || isRunner && peek
    ? current
    : data.roomData.highestRevealed;
  const names = useMemo(() => Object.fromEntries(
    (['fugitive', 'marshal'] as const).map(item => {
      const id = Object.keys(data.playerData).find(playerID =>
        data.playerData[playerID]?.role === item) ?? '';
      return [item, playerLabel(id, data.roomData.players)];
    }),
  ) as Record<Role, string>, [data.playerData, data.roomData.players]);
  const actingRole = data.playerData[data.roomData.currentPlayer]?.role;

  useEffect(() => {
    routeScroll.current?.scrollTo({
      left: routeScroll.current.scrollWidth,
      behavior: 'smooth',
    });
  }, [data.roomData.route.length]);
  useEffect(() => {
    setNumbers([]);
    setMarkMode(false);
  }, [data.seq]);

  if (phase === 'end' && !reviewing) {
    return <Results data={data} roomName={roomName} onExit={onLeave}
      onReview={() => setReviewing(true)}
      onRematch={onStartNextMatch}
      rematchPending={startNextMatchPending} />;
  }

  const choose = (number: number) => {
    if (!active || !isRunner || !['opening', 'fugitiveAction'].includes(phase)) return;
    setSelected(number);
    setSprints([]);
    setPanel('move');
  };
  const submitMove = () => {
    if (selected == null || !canReach(data, selected, sprints)) return;
    if (session.submit('game_play_hideout', {
      hideout: selected,
      sprints,
    })) {
      setPanel(undefined);
      setSelected(undefined);
      setSprints([]);
    }
  };
  const pickNumber = (number: number) => {
    if (isRunner || known.has(number)) return;
    if (markMode) {
      setNotes(currentNotes => currentNotes.includes(number)
        ? currentNotes.filter(value => value !== number)
        : [...currentNotes, number]);
      return;
    }
    if (!canPlanSearch) return;
    const limit = phase === 'manhunt' ? 1 : Math.max(1, hidden);
    setNumbers(currentNumbers => currentNumbers.includes(number)
      ? currentNumbers.filter(value => value !== number)
      : currentNumbers.length < limit
        ? [...currentNumbers, number].sort((left, right) => left - right)
        : currentNumbers);
  };
  const submitSearch = () => {
    if (!active || !canPlanSearch || !numbers.length) return;
    if (session.submit('game_search_hideouts', { numbers })) {
      setNumbers([]);
      setPanel(undefined);
    }
  };
  const stepText = phase === 'end'
    ? '本局追逐已结束 · 正在查看终局牌桌'
    : !myTurn
      ? `${names[actingRole ?? (role === 'fugitive' ? 'marshal' : 'fugitive')]} 正在行动`
      : phase === 'draw'
        ? `选择牌堆，还需抽 ${data.roomData.drawsRemaining} 张`
        : phase === 'opening'
          ? '布置 1–2 处初始藏身点'
          : phase === 'manhunt'
            ? '最终追缉：一次失误，逃亡者就会逃脱'
            : isRunner
              ? '选择新的藏身点，或原地潜伏'
              : '结合已知线索，选择要搜查的号码';

  const deckControls = <div className="deck-row">
    {data.roomData.decks.map(deck => <button
      className={`draw-deck deck-${deck.deckIndex} ${
        active && phase === 'draw' && deck.remaining ? 'can-draw' : ''}`}
      key={deck.deckIndex} type="button"
      disabled={!active || phase !== 'draw' || !deck.remaining}
      aria-label={`从 ${deck.min}–${deck.max} 牌堆抽牌`}
      onClick={() => session.submit('game_draw_card', { deckIndex: deck.deckIndex })}>
      <span className="deck-emblem">{['Ⅰ', 'Ⅱ', 'Ⅲ'][deck.deckIndex]}</span>
      <span className="deck-info"><b>{pad(deck.min)}—{pad(deck.max)}</b>
        <small>{['老城街巷', '城市腹地', '郊外出口'][deck.deckIndex]}</small></span>
      <span className="deck-count"><b>{deck.remaining}</b><small>张剩余</small></span>
    </button>)}
  </div>;

  const notebook = <><div className="notebook-mode">
    <span><LockKeyhole size={12} />仅你可见</span>
    <button type="button" aria-pressed={markMode}
      className={markMode ? 'marked' : ''}
      onClick={() => setMarkMode(value => !value)}>
      <NotebookPen size={14} />{markMode ? '标记模式' : '做标记'}</button>
  </div>
  <div className="number-grid">{Array.from({ length: 41 }, (_, index) => index + 1)
    .map(number => <button type="button" key={number}
      disabled={known.has(number)}
      className={`${known.has(number) ? 'known' : ''} ${
        numbers.includes(number) ? 'number-selected' : ''} ${
        notes.includes(number) ? 'suspect' : ''}`}
      aria-pressed={numbers.includes(number)}
      aria-label={known.has(number)
        ? `号码 ${number}，已知不可选`
        : `${markMode ? '标记' : '搜查'}号码 ${number}`}
      onClick={() => pickNumber(number)}>
      {pad(number)}{numbers.includes(number) && <Check size={10} />}
      <span className="suspect-dot" />
    </button>)}</div>
  <div className="notebook-legend"><span><i className="legend-selected" />待搜查</span>
    <span><i className="legend-known" />已知</span>
    <span><i className="legend-note" />个人标记</span></div>
  <div className={`guess-summary ${numbers.length > 1 ? 'risk' : ''}`}>
    <span>{numbers.length
      ? `已选 ${numbers.map(pad).join(' / ')}`
      : '选择你认为藏身的地点号码'}</span>
    {!!numbers.length && <button type="button" onClick={() => setNumbers([])}>清空</button>}
  </div>
  {numbers.length > 1 && <p className="risk-copy"><TriangleAlert size={14} />
    全部猜中才会翻牌；任一错误，全不揭晓。</p>}</>;

  const primaryAction = isRunner
    ? <button className="button primary full" type="button"
      disabled={!active || !['opening', 'fugitiveAction'].includes(phase)}
      onClick={() => setPanel('choose')}>
      选择藏身点<ArrowRight size={17} /></button>
    : <button className="button green full" type="button"
      disabled={!canPlanSearch}
      onClick={() => setPanel('notebook')}>
      <Search size={17} />{phase === 'manhunt' ? '继续最终追缉' : '打开推理手册'}</button>;

  return <div className={`game-app ${isRunner ? 'runner-game' : 'marshal-game'}`}
    data-testid="fugitive-play">
    <div className="game-underlay" aria-hidden={!!panel}>
      <GameMobileTopbar
        onBack={onLeave}
        backLabel="离开对局"
        kicker={`#${data.roomID} · 第 ${pad(data.roomData.roundNo)} 回合`}
        title={roomName}
        status={phase !== 'end' && myTurn && countdown
          ? <GameMobileTopbarCountdown>{countdown}</GameMobileTopbarCountdown>
          : undefined}
        actions={<>
          <button className="icon-button" type="button" aria-label="追逐记录"
            title="追逐记录"
            onClick={() => setPanel('history')}><History size={19} /></button>
          <button className="icon-button" type="button" aria-label="对局规则"
            title="对局规则"
            onClick={() => setPanel('rules')}><BookOpen size={19} /></button>
        </>}
      />
      <div className="topbar" data-game-desktop-topbar>
        <header className="game-header">
          <button className="icon-button" type="button" aria-label="离开对局"
            onClick={onLeave}><ArrowLeft size={20} /></button>
          <Brand small /><span className="header-line" />
          <div className="game-room"><b>{roomName}</b>
            <small>#{data.roomID} · 第 {pad(data.roomData.roundNo)} 回合</small></div>
          <span className="spacer" />
          {countdown && <span className="pill">{countdown}</span>}
          <button className="icon-button" type="button" aria-label="追逐记录"
            onClick={() => setPanel('history')}><History size={19} /></button>
          <button className="icon-button" type="button" aria-label="对局规则"
            onClick={() => setPanel('rules')}><BookOpen size={19} /></button>
        </header>
      </div>
      {connectionNotice && <div className="toast" role="status">{connectionNotice}</div>}
      {session.feedback && <div className="toast" role="alert">{session.feedback}</div>}
      <main className="game-main">
        <section className="match-strip framework-player-strip" aria-label="玩家概览">
          {(['fugitive', 'marshal'] as const).map(item => {
            const playerID = Object.keys(data.playerData).find(id =>
              data.playerData[id]?.role === item) ?? '';
            const player = data.roomData.players[playerID];
            return <button type="button" key={item}
              className={`player-summary ${role === item ? 'your-player' : ''} ${
                actingRole === item && phase !== 'end' ? 'acting-player' : ''}`}
              onClick={() => { setPlayerRole(item); setPanel('player'); }}>
              <Portrait role={item} className="avatar" /><span>
                <b>{names[item]}{role === item && <em>你</em>}</b>
                <small>{item === 'fugitive'
                  ? <Footprints size={12} /> : <Shield size={12} />}
                  {roleName(item)} · {data.playerData[playerID]?.handCount ?? 0} 张牌
                  {!player?.online && !player?.ai ? ' · 离线' : ''}</small>
              </span><ChevronRight size={13} />
            </button>;
          })}
        </section>

        <div className={`turn-instruction ${phase === 'manhunt' ? 'manhunt-instruction' : ''}`}
          role="status"><span>
            {phase === 'manhunt' ? <Target size={18} />
              : isRunner ? <Footprints size={18} /> : <Search size={18} />}
            <b>{stepText}</b></span>
          <small>{countdown || (phase === 'draw' ? '01 / 补充手牌' : '02 / 采取行动')}</small>
        </div>

        <div className="game-layout"><div className="game-left">
          <section className="route-board" data-testid="fugitive-route">
            <header className="board-heading"><div><Eyebrow>THE ESCAPE ROUTE</Eyebrow>
              <h2>逃亡路线</h2></div>
              <span className="hidden-count">
                {revealAll ? <Eye size={13} /> : <LockKeyhole size={13} />}
                {hidden} 处{revealAll ? '此前未发现' : '未发现'}
              </span>
              {isRunner && !revealAll && <button className="board-peek" type="button"
                aria-label={peek ? '遮住我的暗置牌' : '查看我的暗置牌'}
                onClick={() => setPeek(value => !value)}>
                {peek ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>{peek ? '仅你看见牌面' : '查看暗置牌'}</span>
              </button>}
            </header>
            <div className="route-scale"><div className="scale-line">
              <i style={{ width: `${routeProgress / 42 * 100}%` }} /></div>
              {[0, 14, 28, 42].map(number => <span key={number}><b>{pad(number)}</b>
                <small>{['出发', '老城区', '港口区', '逃脱'][
                  [0, 14, 28, 42].indexOf(number)]}</small></span>)}
              <div className="route-position" style={{
                left: `${Math.max(5, Math.min(93, routeProgress / 42 * 100))}%`,
              }}>{revealAll ? '终局地点' : isRunner && peek ? '你在' : '最新公开'} {
                pad(routeProgress)}</div>
            </div>
            <div className="route-scroll" ref={routeScroll}
              aria-label="按出牌顺序排列的逃亡路线">
              {data.roomData.route.map((item, index) => {
                const visibleCard = routeCardForViewer(item, role, peek, revealAll);
                return <div className={`route-stop ${
                  item.revealed || revealAll ? 'stop-open' : ''}`}
                  key={item.index}>
                  <span className="stop-index">{index === 0 ? '起点' : `第 ${pad(index)} 处`}</span>
                  <button className="route-card-button" type="button"
                    aria-label={visibleCard
                      ? `查看路线地点 ${visibleCard.number}`
                      : `查看第 ${index} 处暗置地点`}
                    onClick={() => { setDetail(index); setPanel('detail'); }}>
                    {visibleCard ? <CardFace card={visibleCard} /> : <CardBack />}
                  </button>
                  <span className={`stop-state ${
                    item.revealed || revealAll ? 'exposed' : ''}`}>
                    {item.revealed
                      ? <><Eye size={11} />{visibleCard?.number === 42 ? '终点已打出' : '已公开'}</>
                      : revealAll
                        ? <><Eye size={11} />终局公开</>
                        : <><LockKeyhole size={11} />暗置{item.sprintCount
                        ? ` · 冲刺 ${item.sprintCount}` : ''}</>}
                  </span>
                </div>;
              })}
              {!revealAll && current !== 42 && <div className="next-stop"><span />
                <div><MapPin size={25} strokeWidth={1.2} /><small>下一处<br />藏身点</small></div>
                <span>TO BE CONTINUED</span></div>}
            </div>
            <footer className="board-footer"><span><Route size={14} />
              {revealAll
                ? '终局已公开所有藏身点与附带冲刺牌。'
                : isRunner
                ? '暗置牌面只对你可见，对方只能看到牌背。'
                : '只显示已公开信息；暗置牌不透露地点。'}</span>
              <small className="route-scroll-hint">左右滑动查看</small><span>00 ─── 42</span>
            </footer>
          </section>

          <section className="supply-panel desktop-supply">
            <div className="section-title"><h3><Layers size={16} />公共牌堆</h3>
              <span>牌堆按号码分段 · 内容朝下</span></div>{deckControls}
          </section>

          <section className="hand-panel">
            <div className="section-title"><h3>
              {isRunner ? <Footprints size={17} /> : <NotebookPen size={17} />}
              {isRunner ? '我的手牌' : '我的线索牌'}
              <span className="count-label">{data.hand.length}</span></h3>
              <button className="text-button" type="button"
                onClick={() => setPanel('hand')}><LockKeyhole size={11} />仅你可见
                <ChevronRight size={12} /></button>
            </div>
            {isRunner
              ? <><div className="hand-scroll">{data.hand.map(item =>
                <CardFace key={item.number} card={item} compact
                  disabled={!active || !['opening', 'fugitiveAction'].includes(phase)
                    || item.number <= current}
                  onClick={() => choose(item.number)}
                  tag={item.number === 42 ? '终点'
                    : item.number <= current ? '可作冲刺'
                      : item.number - current <= 3 ? '可直达' : '需冲刺'} />)}
              </div><p className="hand-hint">直接点选地点牌，随后搭配冲刺；小号牌仍可用于冲刺。</p></>
              : <><div className="evidence-cards">{data.hand.map(item =>
                <div className="evidence-card" key={item.number}>
                  <span>{pad(item.number)}</span><Check size={12} /></div>)}</div>
                <p className="hand-hint">你抽到的牌不可能是暗置地点，已在推理手册中标为已知。</p></>}
          </section>
        </div>

        <aside className="action-sidebar">
          <section className="mission-card">
            <div className="mission-heading"><span className={`role-symbol ${isRunner ? 'orange' : ''}`}>
              {isRunner ? <Footprints size={21} /> : <Shield size={21} />}</span>
              <div><Eyebrow>YOUR MISSION</Eyebrow>
                <h3>{isRunner ? '消失在天亮之前。' : '每个脚印，都是线索。'}</h3></div>
            </div>
            <p>{isRunner
              ? '在所有藏身点被揭晓前，合法打出 42 逃出城市。'
              : '猜出所有尚未公开的藏身点，才能抓到逃亡者。'}</p>
            <div className="mission-divider" />
            {isRunner ? <>
              <div className="current-location"><span>当前地点 <b>{pad(current)}</b></span>
                <span>基础可达 <b>{pad(Math.min(42, current + 1))}—{pad(Math.min(42, current + 3))}</b></span>
              </div>{primaryAction}
              {phase === 'opening' && data.roomData.openingHideoutsPlaced > 0
                && <button className="button quiet full" type="button"
                  disabled={!active}
                  onClick={() => session.submit('game_finish_opening')}>
                  完成初始路线</button>}
              {phase === 'fugitiveAction' && <button className="button quiet full"
                type="button" disabled={!active} onClick={() => setPanel('pass')}>
                原地潜伏 · 补 1 张牌</button>}
              <div className="tip-slip"><Info size={15} />
                <span>多用的冲刺牌可以制造假线索，但也会消耗手牌。</span></div>
            </> : <>
              <div className="section-title notebook-title"><h3>推理手册</h3>
                <button className="icon-button" type="button"
                  onClick={() => setPanel('notebook')}><ArrowUpRight size={15} /></button>
              </div>{notebook}
              <button className="button green full" type="button"
                disabled={!active || !numbers.length || markMode}
                onClick={() => setPanel('confirm-search')}>
                {phase === 'manhunt' ? '确认最终追缉'
                  : numbers.length ? `搜查所选 ${numbers.length} 处` : '先选择搜查号码'}
                <Search size={16} /></button>
            </>}
          </section>
          <section className="journal-panel"><div className="section-title">
            <h3><History size={15} />追逐记录</h3>
            <button className="text-button" type="button"
              onClick={() => setPanel('history')}>全部 <ChevronRight size={14} /></button>
          </div>{logs.slice(0, 2).map(item =>
            <div key={item.id} className="journal-line"><i /><p>
              <b>{names[item.role]}</b>{formatActionLog(
                item, data.roomData.players[item.playerID]?.ai === true,
              )}</p></div>)}</section>
        </aside></div>
        <footer className="game-footnote"><span>FUGITIVE / MIDNIGHT RUN</span>
          <span>服务端权威牌局 · 私密信息按身份投影</span></footer>
      </main>

      <div className="mobile-game-dock framework-game-dock"
        data-testid="fugitive-mobile-dock">
        <section className="dock-supply" aria-label="公共牌堆">
          <div className="dock-bank-heading"><h3>公共牌堆</h3>
            <small>{phase === 'draw' && myTurn
              ? `还需抽 ${data.roomData.drawsRemaining} 张`
              : phase === 'manhunt' ? '最终追缉 · 不再抽牌' : '查看各牌堆余量'}</small>
          </div>{deckControls}
        </section>
        <div className="dock-private-row">
          <button type="button" onClick={() => setPanel('hand')}>
            {isRunner ? <Footprints size={15} /> : <NotebookPen size={15} />}
            {isRunner ? '我的手牌' : '我的线索'}<b>{data.hand.length}</b>
            <ChevronRight size={12} /></button>
          <span>{isRunner ? `当前 ${pad(current)} · 基础 +3` : `尚有 ${hidden} 处未发现`}</span>
        </div>
        <div className="dock-actions">
          {phase === 'end'
            ? <button className="button primary full" type="button"
              onClick={() => setReviewing(false)}>查看结算<ArrowRight size={16} /></button>
            : <>{isRunner && phase === 'fugitiveAction'
              && <button className="button secondary" type="button"
                disabled={!active} onClick={() => setPanel('pass')}>潜伏</button>}
              {primaryAction}</>}
        </div>
      </div>
    </div>

    {panel === 'choose' && isRunner && <Modal title="下一站，你想去哪里？"
      kicker="PLAN YOUR NEXT MOVE" onClose={() => setPanel(undefined)}>
      <p className="muted">当前地点 {pad(current)}。选择更大的地点牌，必要时再加入冲刺。</p>
      <div className="choose-grid">{data.hand.filter(item => item.number > current)
        .map(item => <CardFace key={item.number} card={item} compact
          onClick={() => choose(item.number)}
          tag={item.number - current <= 3 ? '可直达' : '需要冲刺'} />)}</div>
      {!data.hand.some(item => item.number > current)
        && <p className="notice">没有可用的下一地点。普通回合可以选择潜伏补牌。</p>}
    </Modal>}

    {panel === 'move' && selectedCard && <Modal
      title={`前往 ${pad(selectedCard.number)} 号藏身点`}
      kicker="LEAVE NO CERTAINTY BEHIND" className="move-modal"
      onClose={() => setPanel(undefined)}
      footer={<><button className="button secondary" type="button"
        onClick={() => setPanel('choose')}>返回手牌</button>
        <button className="button primary" type="button"
          disabled={!active || !canReach(data, selectedCard.number, sprints)}
          onClick={submitMove}>
          {canReach(data, selectedCard.number, sprints)
            ? selectedCard.number === 42 ? '确认逃出城市' : '确认暗置'
            : '冲刺不足'}<ArrowRight size={16} />
        </button></>}>
      <div className="move-overview"><CardFace card={selectedCard} /><div>
        <Eyebrow>你的下一步</Eyebrow><div className="move-numbers">
          {pad(current)}<ArrowRight size={26} /><strong>{pad(selectedCard.number)}</strong></div>
        <p>需要前进 <b>{selectedCard.number - current}</b> 步</p>
        <div className={`reach-check ${
          canReach(data, selectedCard.number, sprints) ? 'reachable' : ''}`}>
          {canReach(data, selectedCard.number, sprints)
            ? <Check size={17} /> : <TriangleAlert size={17} />}
          <span>基础 3 + 冲刺 {sprints.reduce((sum, number) =>
            sum + (data.hand.find(item => item.number === number)?.sprint ?? 0), 0)}</span>
        </div>
      </div></div>
      <div className="section-title"><h3><Footprints size={16} />选择冲刺牌</h3>
        <span>可选多张 · 可超额使用</span></div>
      <div className="sprint-grid">{data.hand
        .filter(item => item.number !== selectedCard.number && item.number !== 42)
        .map(item => <button type="button" key={item.number}
          aria-pressed={sprints.includes(item.number)}
          className={sprints.includes(item.number) ? 'sprint-selected' : ''}
          onClick={() => setSprints(currentSprints =>
            currentSprints.includes(item.number)
              ? currentSprints.filter(number => number !== item.number)
              : [...currentSprints, item.number])}>
          <b>{pad(item.number)}</b><span><Footprints size={12} />+{item.sprint}</span>
          {sprints.includes(item.number) ? <Check size={17} /> : <Plus size={16} />}
        </button>)}</div>
      <p className="notice"><LockKeyhole size={16} />
        <span>对方只会看到 {sprints.length} 张冲刺牌，不会看到号码和点数。提交后不可撤回。</span></p>
    </Modal>}

    {panel === 'hand' && <Modal title={isRunner ? '我的私密手牌' : '我的私密线索'}
      kicker="YOUR SIDE OF THE TABLE" onClose={() => setPanel(undefined)}>
      <p className="muted">{isRunner
        ? `当前地点 ${pad(current)}；小号牌可用于冲刺，42 不能冲刺。`
        : '你抽到的号码已自动从可搜查地点中排除。此处内容不向对手展示。'}</p>
      <div className="choose-grid hand-detail-grid">{data.hand.map(item =>
        <CardFace key={item.number} card={item} compact
          onClick={isRunner ? () => choose(item.number) : undefined}
          disabled={isRunner && (!active || item.number <= current)}
          tag={isRunner
            ? item.number === 42 ? '终点' : item.number <= current
              ? '可作冲刺' : item.number - current <= 3 ? '可直达' : '需冲刺'
            : '已知排除'} />)}</div>
    </Modal>}

    {panel === 'notebook' && !isRunner && <Modal
      title={phase === 'manhunt' ? '最终追缉' : '你的私密推理手册'}
      kicker={phase === 'manhunt' ? 'ONE MISTAKE. ONE ESCAPE.' : 'CONNECT THE MISSING PIECES'}
      className="notebook-modal" onClose={() => setPanel(undefined)}
      footer={<button className="button green full" type="button"
        disabled={!active || !numbers.length || markMode}
        onClick={() => setPanel('confirm-search')}>
        {phase === 'manhunt' ? '确认这个号码'
          : numbers.length ? `搜查所选 ${numbers.length} 处` : '请选择搜查号码'}
        <Search size={16} /></button>}>
      <p className="muted">{phase === 'manhunt'
        ? '不再抽牌；每次猜一个号码，正确则继续，错误则立即失败。'
        : '已知号码不可选；个人标记只保存在当前页面，不会提交给服务端。'}</p>
      {notebook}
    </Modal>}

    {panel === 'confirm-search' && <Modal
      title={numbers.length > 1 ? '一起搜查，风险也一起承担。' : '锁定这个藏身点？'}
      kicker={phase === 'manhunt' ? 'FINAL MANHUNT' : 'COMMIT YOUR SEARCH'}
      onClose={() => setPanel('notebook')}
      footer={<><button className="button secondary" type="button"
        onClick={() => setPanel('notebook')}>返回修改</button>
        <button className="button green" type="button" disabled={!active}
          onClick={submitSearch}>确认搜查<Search size={16} /></button></>}>
      <div className="search-number-chips">{numbers.map(number =>
        <b key={number}>{pad(number)}</b>)}</div>
      <p>{phase === 'manhunt'
        ? '猜对后继续搜查，猜错则逃亡者立即获胜。'
        : numbers.length > 1
          ? '只有全部号码都是当前暗置地点，才会一起翻开；任意一个错误，本次不翻任何牌。'
          : '如果该号码对应一处暗置藏身点，它和下面的冲刺牌会同时公开。'}</p>
    </Modal>}

    {panel === 'pass' && <Modal title="留在暗处，再等一张好牌。"
      kicker="LAY LOW" onClose={() => setPanel(undefined)}
      footer={<><button className="button secondary" type="button"
        onClick={() => setPanel(undefined)}>继续规划</button>
        <button className="button primary" type="button" disabled={!active}
          onClick={() => {
            if (session.submit('game_lay_low')) setPanel(undefined);
          }}>确认潜伏<ArrowRight size={16} /></button></>}>
      <p>本回合不设置新藏身点。按二版规则，你会从<b>最低号码的非空牌堆</b>额外抽 1 张。</p>
      <p className="notice">潜伏后轮到追捕者。如果所有藏身点被发现，你仍会被捕。</p>
    </Modal>}

    {panel === 'detail' && detailView && <Modal
      title={detailCard
        ? `${pad(detailCard.number)} 号藏身点`
        : '尚未公开的藏身点'}
      kicker="ROUTE DETAIL" onClose={() => setPanel(undefined)}>
      <div className="route-detail-card">
        {detailCard
          ? <CardFace card={detailCard} />
          : <CardBack />}
      </div>
      <p>{detailView.revealed
        ? '该地点已经公开。'
        : revealAll
          ? '该地点在终局结算后公开。'
        : isRunner && peek
          ? '这是你的私密路线。追捕者只能看到牌背。'
          : '该地点号码不可见，只公开顺序及附带冲刺牌数量。'}</p>
      <div className="notice"><Footprints size={17} />
        <span>附带 {detailView.sprintCount} 张冲刺牌
          {detailView.sprints?.length
            ? `：${detailView.sprints.map(item => `${pad(item.number)}（+${item.sprint}）`).join('、')}`
            : ''}</span></div>
    </Modal>}

    {panel === 'player' && <Modal title={`${names[playerRole]} · ${roleName(playerRole)}`}
      kicker={playerRole === role ? 'YOUR PLAYER DETAILS' : 'PUBLIC PLAYER DETAILS'}
      onClose={() => setPanel(undefined)}>
      <div className="game-player-detail"><Portrait role={playerRole} className="avatar" />
        <div><h3>{names[playerRole]}{playerRole === role && <span className="pill">你</span>}</h3>
          <p>{playerRole === 'fugitive'
            ? '规划暗置路线，设法打出 42 逃离。'
            : '猜出所有暗置地点，完成追捕。'}</p></div>
      </div>
      <div className="player-public-stats">
        <span><b>{Object.values(data.playerData).find(value =>
          value.role === playerRole)?.handCount ?? 0}</b>手牌数量</span>
        <span><b>{hidden}</b>未发现地点</span>
        <span><b>{data.roomData.roundNo}</b>当前回合</span>
      </div>
      <p className="notice"><LockKeyhole size={17} /><span>
        {playerRole === role
          ? '这是你的席位，可从牌桌查看自己的私密卡牌。'
          : `只公开数量与身份，不展示${roleName(playerRole)}的手牌或私密信息。`}
      </span></p>
    </Modal>}

    {panel === 'history' && <Modal title="每一步，都留下痕迹。"
      kicker="CHASE LOG" onClose={() => setPanel(undefined)}>
      <p className="muted">只显示公开行动与当前身份自己的私密操作。</p>
      <div className="full-log">{logs.map(item =>
        <div key={item.id}><span>{pad(item.id)}</span><div>
          <b>{names[item.role]}{item.private
            && <small className="private-log-label"><LockKeyhole size={11} />仅你可见</small>}</b>
          <p>{formatActionLog(
            item, data.roomData.players[item.playerID]?.ai === true,
          )}</p></div></div>)}</div>
    </Modal>}

    {panel === 'rules' && <Modal title="一人逃，一人追。"
      kicker="THE RULES OF THE CHASE" onClose={() => setPanel(undefined)}>
      <div className="rule-list">
        <p><b>01 · 逃亡者</b>通常先抽 1 张，再暗置一个更大的地点；差值不超过 3 加冲刺点数。也可潜伏并从最低非空牌堆额外补 1 张。</p>
        <p><b>02 · 追捕者</b>通常先抽 1 张，再猜一个或多个号码。多点搜查必须全部正确，才一起公开地点与冲刺牌。</p>
        <p><b>03 · 胜利</b>所有藏身点被发现，追捕者胜。合法打出 42，逃亡者可逃脱；最高公开地点不超过 29 时先进入最终追缉。</p>
        <p><b>04 · 首回合</b>逃亡者不抽牌，放置 1 或 2 处藏身点；追捕者抽 2 张再搜查。</p>
      </div><SourceLinks />
    </Modal>}
  </div>;
}
