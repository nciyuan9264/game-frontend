import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  Backpack,
  Check,
  Crown,
  Flag,
  Layers,
  MoveUpRight,
  Plus,
  SkipForward,
  Swords,
  type LucideIcon,
} from 'lucide-react';
import {
  ACTION_NAMES,
  UNITS,
  score,
  type Action,
  type CoinData,
  type Game,
  type Side,
} from '../model';
import { Coin, Crest } from '../visuals';

export const ACTION_ICONS: Record<Action, LucideIcon> = {
  deploy: Flag,
  bolster: Layers,
  move: MoveUpRight,
  attack: Swords,
  control: Flag,
  tactic: ArrowUpRight,
  recruit: Plus,
  initiative: Crown,
  pass: SkipForward,
  finish: Check,
  defend: Layers,
};
export const ACTION_HINTS: Record<Action, string> = {
  deploy: '选择服务端高亮的合法部署格。',
  bolster: '把同兵种指令叠到已部署单位上。',
  move: '选择服务端给出的相邻空格。',
  attack: '选择服务端给出的合法敌军。',
  control: '控制当前单位脚下的据点。',
  tactic: '按兵种能力选择合法路线或目标。',
  recruit: '从补给招募一枚币到弃置区。',
  initiative: '背面弃置指令，下轮获得先手。',
  pass: '背面弃置一枚指令并跳过本次行动。',
  finish: '结束这次可选追加调遣。',
  defend: '选择皇家卫队的损失来源。',
};
export const ACTION_GROUPS: Action[][] = [
  ['deploy', 'bolster'],
  ['move', 'attack', 'control', 'tactic'],
  ['recruit', 'initiative', 'pass'],
];

export function RollingNumber({ value }: { value: number }) {
  return <span className="rolling-number" style={{ minWidth: `${String(value).length}ch` }}>
    <span className="game-sr-only">{value}</span><AnimatePresence initial={false} mode="popLayout">
      <motion.span aria-hidden="true" key={value} initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}
        transition={{ duration: .2 }}>{value}</motion.span></AnimatePresence></span>;
}

export function CommandAction({
  action,
  active,
  enabled,
  reason,
  onChoose,
  compact = false,
}: {
  action: Action;
  active: boolean;
  enabled: boolean;
  reason: string;
  onChoose: (action: Action) => void;
  compact?: boolean;
}) {
  const Icon = ACTION_ICONS[action];
  return <span className={`action-tip-wrap ${active ? 'chosen' : ''}`} data-tip={reason}>
    <motion.button className={`action-button ${active ? 'active' : ''}`} disabled={!enabled}
      type="button" aria-label={`行动：${ACTION_NAMES[action]}`} aria-description={reason}
      data-click-sound="game-select"
      onClick={() => onChoose(action)} whileHover={enabled ? { y: -2 } : undefined}
      whileTap={enabled ? { scale: .94, y: 1 } : undefined}>
      <Icon size={compact ? 18 : 19} strokeWidth={active ? 2 : 1.7} />
      <span>{ACTION_NAMES[action]}</span>{active && <motion.i className="action-active-dot" layoutId="warchest-command" />}
    </motion.button>
  </span>;
}

export function FactionPanel({
  game,
  side,
  onBag,
  onPile,
  revealHand = false,
}: {
  game: Game;
  side: Side;
  onBag: () => void;
  onPile: () => void;
  revealHand?: boolean;
}) {
  const army = game.players[side];
  const mine = side === game.selfSide;
  const count = score(game, side);
  return <section data-faction={side} className={`faction-panel side-${side} ${game.turn === side && game.phase !== 'end' ? 'taking-turn' : ''}`}>
    <div className="faction-top"><Crest side={side} size={47} /><div>
      <small>{army.name}{mine ? ' · 你' : army.ai ? ' · 公平 AI' : ''}</small>
      <h3>{side === 0 ? '橡木军团' : '赤隼军团'}</h3></div>
      {game.initiative === side && <motion.span layoutId="initiative-standard"
        title="持有先手标记" className="initiative-mini"><Crown size={16} /></motion.span>}</div>
    <div className="faction-score"><span>控制据点</span><strong><RollingNumber value={count} /><small>/ 6</small></strong></div>
    <div className="control-dots" aria-label={`${count} 个已控制据点`}>
      {Array.from({ length: 6 }, (_, index) => <span key={index} className={index < count ? 'filled' : ''}>
        <span><Flag size={12} /></span></span>)}</div>
    <div className="faction-piles"><button type="button" data-pile={`bag-${side}`} onClick={onBag}>
      <Backpack size={15} />袋中 <b><RollingNumber value={army.bagCount} /></b></button>
      <button type="button" data-pile={`discard-${side}`} onClick={onPile}>
        <Layers size={15} />弃置 <b><RollingNumber value={army.discard.length} /></b></button></div>
    {!mine && <div className="hidden-hand" aria-label={`对手手中有 ${army.handCount} 枚隐藏指令币`}>
      {Array.from({ length: 3 }, (_, index) => {
        const coin = army.hand[index];
        return <span key={index} data-enemy-slot={index}
          className={index >= army.handCount ? 'used' : ''}>{index < army.handCount
            ? <Coin type={revealHand && coin?.type ? coin.type : 'royal'} side={side}
              size={29} back={!revealHand || !coin?.type} /> : <i />}</span>;
      })}
      <small>{revealHand ? '全知回放 · 手牌公开' : '手牌仅对手可见'}</small></div>}
  </section>;
}

function CommandCoin({
  coin,
  index,
  side,
  selected,
  enabled,
  onSelect,
}: {
  coin: CoinData;
  index: number;
  side: Side;
  selected: boolean;
  enabled: boolean;
  onSelect: (coinID: string) => void;
}) {
  const type = coin.type ?? 'royal';
  return <motion.button layout="position" data-hand-slot={index} data-testid={`hand-${index}`}
    type="button" aria-label={`选择${UNITS[type].name}指令 ${index + 1}`} aria-pressed={selected}
    data-click-sound="game-select"
    className={`hand-coin ${selected && enabled ? 'selected' : ''}`} disabled={!enabled}
    onClick={() => onSelect(coin.id)} initial={{ opacity: 0, y: 12, rotateY: 50 }}
    animate={{ opacity: 1, y: selected && enabled ? -5 : 0, rotateY: 0 }}
    exit={{ opacity: 0, y: -12, scale: .85 }} whileHover={enabled ? { y: -8 } : undefined}>
    <Coin type={type} side={side} size={54} /><span>{UNITS[type].name}</span>
    <kbd className="hand-key">{index + 1}</kbd>{selected && enabled && <i><Check size={10} /></i>}
  </motion.button>;
}

export function HandCoins({
  game,
  selected,
  enabled,
  onSelect,
}: {
  game: Game;
  selected?: string;
  enabled: boolean;
  onSelect: (coinID: string) => void;
}) {
  const army = game.players[game.selfSide];
  return <AnimatePresence initial={false} mode="popLayout">
    {army.hand.map((coin, index) => <CommandCoin key={coin.id} coin={coin} index={index}
      side={game.selfSide} selected={selected === coin.id} enabled={enabled}
      onSelect={onSelect} />)}
    {Array.from({ length: Math.max(0, 3 - army.hand.length) }, (_, offset) => offset + army.hand.length)
      .map(index => <motion.div layout="position" key={`empty-${index}`} data-hand-slot={index}
        className="empty-coin-slot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span /><small>{game.phase === 'end' ? '已结束' : '已使用'}</small></motion.div>)}
  </AnimatePresence>;
}
