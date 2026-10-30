import { useId, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CELLS,
  CELL_MAP,
  LOCATIONS,
  UNITS,
  adjacent,
  cellLabel,
  maneuverOf,
  type Game,
  type Piece,
  type Plan,
} from '../model';
import { UnitGlyph } from '../visuals';

const R = 44;
export function point(key: string) {
  const cell = CELL_MAP[key];
  return { x: 280 + cell.q * R * 1.5, y: 298 + (cell.r + cell.q / 2) * R * Math.sqrt(3) };
}
const hexPoints = (x: number, y: number, radius = R - 1) =>
  Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    return `${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`;
  }).join(' ');

function Terrain({ x, y, kind }: { x: number; y: number; kind: number }) {
  return <g transform={`translate(${x - 14},${y - 13})`} stroke="currentColor"
    strokeWidth="1.2" fill="none" opacity=".44">
    {kind % 3 === 0 ? <path d="M2 25V8h4V3h4v5h8V3h4v5h4v17H2Zm9 0V15h6v10M1 12h26M6 17h2m12 0h2" />
      : kind % 3 === 1 ? <path d="m0 25 11-20 11 20M7 13l4 3 4-3m3 3 5-10 9 19M-2 25h34" />
        : <path d="m1 20 6-12 6 12H1Zm14 0 6-16 8 16H15ZM7 20v6m14-6v6M-1 26h30" />}
  </g>;
}

function Face({ piece, prefix }: { piece: Piece; prefix: string }) {
  return <>{piece.n > 1 && <><circle cy="6" r="25.5"
    fill={piece.side === 0 ? '#203e30' : '#763f32'} stroke="#ad9263" strokeWidth="1.7" />
    <path d="M-22 15a25 25 0 0 0 44 0" fill="none" stroke="#dbc18d" strokeWidth="1.2" /></>}
    <circle r="25" fill={`url(#${prefix}-coin-${piece.side})`} stroke="#c9aa70" strokeWidth="2.3" />
    <circle r="21" fill="none" stroke="#f3dfaa" strokeOpacity=".58" strokeWidth=".7" />
    <path d="M-19-12A23 23 0 0 1 12-20" fill="none" stroke="#ffedc5"
      strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
    <g transform="translate(-14 -14)" color="#f5e8c9"><UnitGlyph type={piece.type} size={28} /></g>
    {piece.n > 1 && <g className="unit-stack-count"><circle cx="20" cy="19" r="9"
      fill="#f8edcf" stroke="#a58a55" /><text x="20" y="22.6" textAnchor="middle"
        fill="#314b3c" fontSize="11" fontWeight="700">{piece.n}</text></g>}</>;
}

function TacticalPath({ plan, game, prefix }: { plan: Plan; game: Game; prefix: string }) {
  const move = plan.from && plan.to && plan.to !== plan.from
    ? [plan.from, ...(plan.path?.length ? plan.path : [plan.to])]
    : [];
  const aim = plan.target && plan.from ? [plan.to || plan.from, plan.target] : [];
  const follow = plan.after && plan.from ? [plan.to || plan.from, plan.after] : [];
  const line = (keys: string[]) => keys.map(key => {
    const value = point(key);
    return `${value.x},${value.y}`;
  }).join(' ');
  const end = plan.after || plan.to;
  const original = plan.from ? game.board[plan.from] : undefined;
  const ghost = original ?? {
    id: 'preview', cell: end ?? '', type: plan.type, side: plan.side, n: 1,
  };
  return <g className="tactical-preview" pointerEvents="none">
    {plan.source && plan.source !== plan.from && plan.from
      && <polyline points={line([plan.source, plan.from])} className="command-link" />}
    {move.length > 1 && <><polyline points={line(move)} className="route-shadow" />
      <polyline points={line(move)} className="preview-route" markerEnd={`url(#${prefix}-arrow)`} /></>}
    {aim.length > 1 && <><polyline points={line(aim)} className="aim-shadow" />
      <polyline points={line(aim)} className="preview-aim" markerEnd={`url(#${prefix}-attack-arrow)`} /></>}
    {follow.length > 1 && <polyline points={line(follow)} className="preview-follow"
      markerEnd={`url(#${prefix}-arrow)`} />}
    {end && end !== plan.from && !game.board[end] && (() => {
      const value = point(end);
      return <g transform={`translate(${value.x} ${value.y})`} className="destination-ghost">
        <circle r="31" className="destination-ring" /><g opacity=".42"><Face piece={ghost} prefix={prefix} /></g>
      </g>;
    })()}
    {plan.target && (() => {
      const value = point(plan.target);
      return <g transform={`translate(${value.x} ${value.y})`}><circle r="31" className="attack-reticle" />
        <path d="M-36 0h8M28 0h8M0-36v8M0 28v8" className="reticle-ticks" /></g>;
    })()}
    {maneuverOf(plan) === 'control' && plan.to && (() => {
      const value = point(plan.to);
      return <g transform={`translate(${value.x} ${value.y - 45})`}><rect x="-31" y="-10"
        width="62" height="20" rx="4" fill="#57754d" /><text y="4" textAnchor="middle"
          fill="#fff4d5" fontSize="9">控制据点 +1</text></g>;
    })()}
  </g>;
}

interface Props {
  game: Game;
  targets?: string[];
  selected?: string;
  plan?: Plan | null;
  followups?: string[];
  onCell: (key: string) => void;
  onConfirm?: () => void;
  showCoordinates?: boolean;
  locked?: boolean;
}

export function Board({
  game,
  targets = [],
  selected,
  plan,
  followups = [],
  onCell,
  onConfirm,
  showCoordinates = true,
  locked = false,
}: Props) {
  const prefix = useId().replace(/:/g, '');
  const [hovered, setHovered] = useState<string>();
  const [focusKey, setFocusKey] = useState(selected || '0,0');
  const focus = (key: string, event: KeyboardEvent<SVGGElement>) => {
    if (locked) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.key === 'Enter' && plan
        && [plan.to, plan.target, plan.after].includes(key)) onConfirm?.();
      else onCell(key);
      return;
    }
    const vectors: Record<string, number[]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const vector = vectors[event.key];
    if (!vector) return;
    event.preventDefault();
    const origin = point(key);
    const next = adjacent(key).map(nextKey => {
      const value = point(nextKey);
      const dx = value.x - origin.x;
      const dy = value.y - origin.y;
      return { key: nextKey, value: (dx * vector[0] + dy * vector[1]) / Math.hypot(dx, dy) };
    }).filter(value => value.value > .2).sort((left, right) => right.value - left.value)[0];
    if (next) {
      setFocusKey(next.key);
      event.currentTarget.closest('svg')
        ?.querySelector<SVGGElement>(`[data-cell-key="${next.key}"]`)?.focus();
    }
  };
  return <svg className="hex-board" viewBox="0 0 560 598"
    aria-label="战争之匣双人战场：37 格，10 个据点" data-testid="warchest-board">
    <defs><linearGradient id={`${prefix}-land`} x1="0" y1="0" x2="1" y2="1">
      <stop stopColor="#f4ecd9" /><stop offset="1" stopColor="#e4dac2" /></linearGradient>
      <linearGradient id={`${prefix}-coin-0`} x1="0" y1="0" x2=".8" y2="1">
        <stop stopColor="#66836a" /><stop offset=".52" stopColor="#365b44" /><stop offset="1" stopColor="#233b2d" /></linearGradient>
      <linearGradient id={`${prefix}-coin-1`} x1="0" y1="0" x2=".8" y2="1">
        <stop stopColor="#c58b6b" /><stop offset=".5" stopColor="#a8644e" /><stop offset="1" stopColor="#804433" /></linearGradient>
      <filter id={`${prefix}-shadow`} x="-55%" y="-55%" width="210%" height="220%">
        <feDropShadow dx="0" dy="4" stdDeviation="2.8" floodColor="#3f3627" floodOpacity=".28" /></filter>
      <marker id={`${prefix}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4"
        markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10 3 5Z" fill="#547247" /></marker>
      <marker id={`${prefix}-attack-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4"
        markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10 3 5Z" fill="#a05e46" /></marker></defs>
    <g className="board-decor" fill="none" stroke="currentColor" opacity=".28">
      <path d="M25 215V25h180M535 215V25H355M25 384v189h180m330-189v189H355" />
      <path d="m26 38 13-13m-13 536 13 13M522 25l13 13m-13 535 13-13" />
      <path d="M269 25h22m-11-5v10M269 573h22m-11-5v10" /></g>
    <text x="44" y="58" className="board-corner">N</text>
    {CELLS.map(cell => {
      const { x, y } = point(cell.key);
      const piece = game.board[cell.key];
      const owner = game.controls[cell.key];
      const location = LOCATIONS.includes(cell.key);
      const legal = targets.includes(cell.key);
      const follow = followups.includes(cell.key);
      const picked = [plan?.to, plan?.target, plan?.after].includes(cell.key);
      const label = `${cell.label}${location ? ' 据点' : ''}${piece
        ? ` ${piece.side === 0 ? '橡木' : '赤隼'}军团 ${UNITS[piece.type].name} ${piece.n} 枚` : ''}${legal ? ' 可选目标' : ''}`;
      return <g key={cell.key} role="button" tabIndex={!locked && cell.key === focusKey ? 0 : -1}
        aria-label={label} aria-disabled={locked} data-testid={`hex-${cell.label}`}
        data-click-sound="false"
        data-cell-key={cell.key} className={`hex-cell ${legal ? 'legal' : ''} ${follow ? 'followup' : ''} ${picked ? 'picked' : ''} ${selected === cell.key ? 'selected' : ''} ${plan?.target === cell.key ? 'attack-target' : ''}`}
        onPointerEnter={() => !locked && setHovered(cell.key)} onPointerLeave={() => setHovered(undefined)}
        onFocus={() => { setHovered(cell.key); setFocusKey(cell.key); }} onBlur={() => setHovered(undefined)}
        onClick={event => { if (!locked) { event.currentTarget.focus(); setFocusKey(cell.key); onCell(cell.key); } }}
        onKeyDown={event => focus(cell.key, event)}>
        <polygon className="hex-tile" points={hexPoints(x, y)}
          fill={location ? '#f8f1df' : `url(#${prefix}-land)`} stroke="#c4b999" strokeWidth="1.2" />
        <path className="tile-bevel" d={`M${x - R + 3} ${y + 2}l${(R - 3) / 2} ${(R - 3) * .866}h${R - 3}l${(R - 3) / 2} ${-(R - 3) * .866}`}
          fill="none" stroke="#ad9c76" strokeOpacity=".2" strokeWidth="2" />
        {location && <Terrain x={x} y={y} kind={LOCATIONS.indexOf(cell.key)} />}
        {owner !== undefined && <g transform={`translate(${x} ${y + 26})`}
          className={`location-marker owner-${owner}`}><path d="M-18 0l18-8L18 0 0 8Z"
            fill={owner === 0 ? '#496950' : '#ad6a57'} stroke={owner === 0 ? '#254732' : '#8f4d3f'} />
          <path d="M0-5v9m-4-6 4 3 4-3" stroke="#f2e5c7" fill="none" /></g>}
        {showCoordinates && <text className="hex-coordinate" x={x} y={y - 28} textAnchor="middle">{cell.label}</text>}
        {(legal || follow) && !piece && <g transform={`translate(${x} ${y})`} className="legal-beacon">
          <circle className="target-aura" r="14" fill="none" stroke={follow ? '#b99553' : '#5e8255'} />
          <circle className="target-dot" r={follow ? 4 : 5} fill={follow ? '#be944d' : '#628456'} /></g>}
      </g>;
    })}
    {plan && !locked && <TacticalPath plan={plan} game={game} prefix={prefix} />}
    <g className="unit-layer" pointerEvents="none"><AnimatePresence initial={false}>
      {Object.entries(game.board).map(([key, piece]) => {
        const value = point(key);
        return <motion.g key={piece.id} className="board-unit" data-unit-id={piece.id}
          data-unit-cell={cellLabel(key)} initial={{ opacity: 0, scale: .75 }}
          animate={{ opacity: 1, scale: 1, x: value.x, y: value.y }}
          exit={{ opacity: 0, scale: .6 }} transition={{ duration: .28 }}>
          <ellipse className="coin-ground-shadow" cy="10" rx="25" ry="16" fill="#51482d" opacity=".12" />
          {(selected === key || plan?.actorUnitID === piece.id) && <g className="selection-orbit">
            <circle r="31.5" fill="none" stroke="#a28b51" strokeWidth="1.6" strokeDasharray="17 7 3 7" />
            <path d="M-36 0h4M32 0h4M0-36v4M0 32v4" stroke="#b09352" /></g>}
          <g filter={`url(#${prefix}-shadow)`}><Face piece={piece} prefix={prefix} /></g>
        </motion.g>;
      })}</AnimatePresence></g>
    {hovered && !plan && (() => {
      const piece = game.board[hovered];
      if (!piece) return null;
      const value = point(hovered);
      return <g className="piece-tooltip" transform={`translate(${value.x} ${value.y - 43})`}>
        <rect x="-53" y="-13" width="106" height="23" rx="5" fill="#2d4537" />
        <text y="2" textAnchor="middle" fill="#f7edcf" fontSize="9">
          {cellLabel(hovered)} · {UNITS[piece.type].name} · {piece.n} 枚</text></g>;
    })()}
    <text x="280" y="586" textAnchor="middle" className="board-signature">THE FIELD OF HONOUR</text>
  </svg>;
}
