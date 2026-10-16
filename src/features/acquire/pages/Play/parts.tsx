import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, BarChart3, Check, CircleHelp, Clock, History, ShieldCheck } from 'lucide-react';
import { ActionButton } from '../../components/ActionButton';
import { AnimatedValue } from '../../components/AnimatedValue';
import { PlayerAvatar } from '../../components/AppShell';
import { CompanyGlyph } from '../../components/CompanyGlyph';
import type { AcquireInteraction } from '../../hooks/useAcquireInteraction';
import { canPlace, tilePreview } from '../../model/selectors';
import { endGameState, money, playerName, type GameSnapshot, type DisplaySnapshot } from '../../model/session';
import { companyColors, companyKeys, type Company } from '../../model/types';
import styles from './index.module.less';

export function Deadline({ deadline }: { deadline?: string | null }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!deadline) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  if (!deadline) return null;
  const remaining = Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000));
  if (!Number.isFinite(remaining)) return null;
  return <span className={styles.deadline} role="timer" aria-label={remaining ? `本阶段剩余 ${remaining} 秒` : '本阶段计时结束'}>
    <Clock size={13} />{remaining ? `${remaining}s` : '等待推进'}
  </span>;
}

export function EndVoteControl({ data, enabled, pending, onToggle, onHelp }: {
  data: GameSnapshot;
  enabled: boolean;
  pending: boolean;
  onToggle: (allow: boolean) => void;
  onHelp: () => void;
}) {
  const endGame = endGameState(data);
  if (!endGame.eligible || data.roomData.gameStatus === 'end') return null;
  const allowed = !!endGame.votes[data.playerId];
  return <div className={styles.endVoteControl} role="group" aria-label="终局确认">
    <span><b>终局确认</b><small>{pending ? '确认中' : allowed ? '已允许' : '继续对局'}</small></span>
    <button type="button" className={`${styles.endVoteSwitch} ${allowed ? styles.endVoteSwitchOn : ''}`}
      role="switch" aria-label="允许结束游戏" aria-checked={allowed} disabled={!enabled || pending}
      onClick={() => onToggle(!allowed)}><i /></button>
    <button type="button" className={styles.endVoteHelp} aria-label="查看终局规则" title="查看终局规则"
      onClick={onHelp}><CircleHelp size={15} /></button>
  </div>;
}

const phaseLabels: Record<string, string> = {
  setTile: '选择落地', createCompany: '创建公司', buyStock: '购买股票',
  mergingSelection: '选择存续公司', mergingSettle: '合并结算', waiting: '等待玩家就绪', end: '对局结束',
};
export function PhaseBanner({ data, interaction, action }: { data: GameSnapshot; interaction: AcquireInteraction; action?: ReactNode }) {
  const mine = canPlace(data) || interaction.autoSkippingBuy || (!!interaction.eligiblePanel && interaction.eligiblePanel !== 'merge-wait');
  const ended = data.roomData.gameStatus === 'end';
  const waitingForMerger = data.roomData.gameStatus === 'mergingSettle' && interaction.eligiblePanel !== 'merge';
  const players = data.roomData.players;
  const playerIDs = data.roomData.playerOrder?.filter(id => players[id]) ?? Object.keys(players);
  const mergingPlayers = new Set(Object.values(data.tempData.mergeSettleData ?? {}).flatMap(settlement => settlement.hoders ?? []));
  const activePlayerID = data.roomData.gameStatus === 'mergingSettle'
    ? (mergingPlayers.has(data.playerId) ? data.playerId : playerIDs.find(id => mergingPlayers.has(id)))
    : data.roomData.currentPlayer;
  const phasePlayerID = activePlayerID && players[activePlayerID] ? activePlayerID : data.playerId;
  const phasePlayer = players[phasePlayerID];
  const step = data.roomData.gameStatus === 'setTile' ? 0
    : ['createCompany', 'mergingSelection', 'mergingSettle'].includes(data.roomData.gameStatus) ? 1 : 2;
  const steps = ['选择落地', '公司处理', '购买股票'];
  const headline = ended ? '城市已定格，对局结束。'
    : waitingForMerger ? '公司正在合并，等待股东完成处理。'
      : interaction.autoSkippingBuy ? '没有可购买的股票，正在跳过。'
      : !mine ? `等待 ${playerName(data.roomData.currentPlayer, data.roomData.players)}`
      : data.roomData.gameStatus === 'setTile' ? '轮到你了，下一块地落在哪里？'
        : data.roomData.gameStatus === 'createCompany' ? '一家公司，等待你命名未来。'
          : data.roomData.gameStatus.startsWith('merging') ? '城市正在重组，处理你的持股。'
            : phaseLabels[data.roomData.gameStatus] ?? '轮到你了';
  const compactTitle = ended ? '对局结束'
    : waitingForMerger ? '等待股东'
      : interaction.autoSkippingBuy ? '自动跳过'
        : !mine ? '等待对手'
          : data.roomData.gameStatus === 'createCompany' ? '创建公司'
            : data.roomData.gameStatus === 'buyStock' ? '购买股票'
              : data.roomData.gameStatus.startsWith('merging') ? '处理合并' : '你的回合';
  const compactHint = ended ? '棋盘只读'
    : waitingForMerger ? '等待处理'
      : interaction.autoSkippingBuy ? '系统处理中'
        : !mine ? '等待行动'
          : data.roomData.gameStatus === 'setTile' ? '点棋盘选地'
            : data.roomData.gameStatus === 'buyStock' ? '每回合最多 3 股' : '完成公司处理';
  return <div className={`${styles.phase} ${mine ? styles.myTurn : ''} ${ended ? styles.neutralPhase : ''}`}><div className={styles.phaseSummary}>
    <span className={styles.phaseIcon} aria-label={phasePlayer ? `当前行动玩家：${playerName(phasePlayerID, players)}` : undefined}>
      {phasePlayer ? <PlayerAvatar name={playerName(phasePlayerID, players)} avatar={phasePlayer.avatar} ai={phasePlayer.ai} size={30} /> : <Clock size={20} />}
    </span><span>
      <strong>{headline}</strong>
      <small>{ended ? '结算已经生成，仍可查看最终棋盘。' : `${data.turnNumber ? `第 ${String(data.turnNumber).padStart(2, '0')} 回合 · ` : ''}${interaction.autoSkippingBuy ? '系统将自动结束购买阶段' : mine ? '轮到你了' : '等待对手完成操作'}`}</small>
    </span>
  </div>
  <div className={styles.mobilePhase} role="status">
    <span className={styles.mobilePhaseAvatar} aria-hidden="true">
      {phasePlayer ? <PlayerAvatar name={playerName(phasePlayerID, players)} avatar={phasePlayer.avatar} ai={phasePlayer.ai} size={30} /> : <Clock size={17} />}
    </span>
    <span className={styles.mobilePhaseCopy}><strong>{compactTitle}</strong>
      <small>{data.turnNumber ? `第 ${String(data.turnNumber).padStart(2, '0')} 回合 · ` : ''}{compactHint}</small>
    </span>
    <span className={styles.mobilePhaseStep}><i>{ended ? <Check size={10} /> : step + 1}</i>{ended ? '已结束' : steps[step]}</span>
  </div>
  {!ended && <div className={styles.phaseSteps}>{steps.map((label, index) =>
    <span className={index === step ? styles.activeStep : index < step ? styles.doneStep : ''} key={label}><i>{index < step ? <Check size={10} /> : index + 1}</i>{label}</span>)}</div>}
  {action && <div className={styles.phaseCommand}>{action}</div>}</div>;
}
export function PhaseAction({ data, interaction, pending, buttonOnly = false }: { data: GameSnapshot; interaction: AcquireInteraction; pending: boolean; buttonOnly?: boolean }) {
  const tile = interaction.draft.tile, placing = canPlace(data);
  const autoSkipping = interaction.autoSkippingBuy;
  const preview = tile ? tilePreview(data, tile) : undefined;
  const labels = { buy: '继续购买股票', merge: '继续处理合并', 'merge-wait': '查看处理进度', found: '选择新公司', survivor: '选择存续公司' };
  const panel = interaction.eligiblePanel;
  const button = <ActionButton variant="primary" pending={pending} disabled={autoSkipping || !interaction.enabled || (placing ? !tile || !preview?.valid : !panel)}
    data-click-sound={placing ? 'false' : undefined} onClick={placing ? interaction.place : interaction.open}>
    {autoSkipping ? '正在跳过购买' : placing ? tile ? `确认落地 ${tile}` : '先选择一块地' : panel ? labels[panel] : '等待回合'}<ArrowRight size={16} />
  </ActionButton>;
  if (buttonOnly) return button;
  return <div className={styles.action}><div><strong>{autoSkipping ? '当前资金无法购买任何股票' : pending ? '正在等待服务端确认…' : placing ? tile ? `${tile} · ${preview?.text}` : '选一块手牌，预览它的位置。' : panel ? labels[panel] : '等待其他玩家行动'}</strong>
    <small>{autoSkipping ? '系统正在自动结束本次购买阶段。' : placing ? '再次点选可取消，确认后才会落地。' : panel ? '关闭面板会保留本阶段的选择。' : '你的手牌与持股仅自己可见。'}</small></div>
    {button}</div>;
}
export function Portfolio({ data }: { data: DisplaySnapshot }) {
  const value = companyKeys.reduce((total, key) => total + (data.playerData.stocks[key] ?? 0) * data.roomData.companyInfo[key].stockPrice, 0);
  return <section className={styles.portfolio}><small>YOUR PORTFOLIO</small><h3>我的持股</h3>
    {companyKeys.filter(key => data.playerData.stocks[key] > 0).map(key => <div key={key}><span style={{ color: companyColors[key] }}><CompanyGlyph company={key} size={16} />{key}</span><b><AnimatedValue value={data.playerData.stocks[key]} /><small>股</small></b></div>)}
    {!companyKeys.some(key => data.playerData.stocks[key] > 0) && <p>还没有持股，落地后可在买股阶段开始投资。</p>}
    <footer><span>持股参考价值</span><b><AnimatedValue value={value} formatter={money} /></b></footer></section>;
}
export function Activity({ items }: { items: string[] }) {
  return <section className={styles.activity}><small>THE STORY SO FAR</small><h3>城市动态</h3>
    {items.length ? <div className={styles.logList}>{items.slice(0, 6).map((text, index) => <div key={`${index}-${text}`}><span className={index === 0 ? styles.activeLog : ''} /><div><small>{index === 0 ? '本回合' : `前 ${index} 步`}</small><p>{text}</p></div></div>)}</div>
      : <p>新变化将在这里记录。</p>}</section>;
}

export function MobileMarket({ data, onCompany, onActivity }: { data: DisplaySnapshot; onCompany: (company: Company) => void; onActivity: () => void }) {
  const activeCount = companyKeys.filter(key => data.roomData.companyInfo[key].tiles > 0).length;
  return <section className={styles.mobileMarket} aria-label="常驻公司行情">
    <header className={styles.mobileMarketHeader}><h2><BarChart3 size={14} />公司行情<small>{activeCount} / 7</small></h2>
      <div><button type="button" onClick={() => onCompany('Tower')}>股价速查</button>
        <button type="button" aria-label="查看对局动态" title="查看对局动态" onClick={onActivity}><History size={14} /></button></div>
    </header>
    <table className={styles.mobileMarketTable} aria-label="公司行情与我的持股">
      <colgroup><col className={styles.marketNameColumn} /><col className={styles.marketSizeColumn} />
        <col className={styles.marketPriceColumn} /><col /><col /></colgroup>
      <thead><tr><th scope="col">公司</th><th scope="col">规模</th><th scope="col">股价</th><th scope="col">库存</th><th scope="col">我持股</th></tr></thead>
      <tbody>{companyKeys.map(key => {
    const company = data.roomData.companyInfo[key];
    const held = data.playerData.stocks[key] ?? 0;
    return <tr key={key} className={`${company.tiles ? '' : styles.inactiveMarketCompany} ${held ? styles.hasMarketHoldings : ''}`}>
      <th scope="row"><span className={styles.compactCompany} style={{ '--co': companyColors[key] } as CSSProperties}>
        <CompanyGlyph company={key} size={14} /><span>{key}</span>{company.tiles >= 11 && <ShieldCheck size={10} aria-label="安全公司" />}
      </span></th>
      <td>{company.tiles || <span aria-label="尚未成立">—</span>}</td>
      <td>{company.tiles ? money(company.stockPrice) : '—'}</td>
      <td><AnimatedValue value={company.stockTotal} /></td>
      <td className={styles.compactHolding}><b><AnimatedValue value={held} /></b></td>
    </tr>;
  })}</tbody></table>
  </section>;
}
