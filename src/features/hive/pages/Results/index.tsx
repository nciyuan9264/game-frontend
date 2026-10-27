import {
  ArrowRight,
  Eye,
  History,
  Trophy,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { MiniBoard } from '../../components/Board';
import { Bug } from '../../components/Artwork';
import { sideName } from '../../model/board';
import {
  playerName,
  type GameSnapshot,
} from '../../model/session';
import { useHiveViewport } from '../../hooks/useHiveViewport';
import type { Side } from '../../model/types';

function Pressure({
  side,
  value,
}: {
  side: Side;
  value: number;
}) {
  return <div className="hive-result-pressure-row">
    <span className={side}><Bug kind="queen" size={18} /></span>
    <div><strong>{sideName(side)}蜂后</strong>
      <small>{value === 6 ? '六边已被围住' : `剩余 ${6 - value} 个气口`}</small></div>
    <i className="pressure-dots">{Array.from({ length: 6 }, (_, index) =>
      <b className={index < value ? 'filled' : ''} key={index} />)}</i>
  </div>;
}

export function Results({
  data,
  onViewBoard,
  onRestart,
  restarting = false,
  readOnly = false,
}: {
  data: GameSnapshot;
  onViewBoard: () => void;
  onRestart?: () => Promise<boolean>;
  restarting?: boolean;
  readOnly?: boolean;
}) {
  const { isMobile } = useHiveViewport();
  const result = data.result;
  const draw = result?.draw === true;
  const winnerID = result?.winnerID ?? '';
  const winnerSide = result?.winnerSide
    ?? data.playerData[winnerID]?.side
    ?? 'white';
  const winner = draw
    ? '双方'
    : playerName(winnerID, data.roomData.players);
  const owner = data.ownerID === data.playerId;
  const states = Object.values(data.playerData);
  const whitePressure = states.find(state => state.side === 'white')?.queenPressure ?? 0;
  const blackPressure = states.find(state => state.side === 'black')?.queenPressure ?? 0;

  return <main className="hive-result-page" data-testid="result-page">
    <header className="hive-result-heading">
      <span>THE LAST SHAPE OF THE HIVE</span>
      <div><Trophy size={31} /></div>
      <h1>{draw ? '同归一巢，胜负未分。' : '蜂巢合拢，胜局已定。'}</h1>
      <p>{draw
        ? result?.reason || '双方在同一局面中达成和棋。'
        : `${winner}获胜，${result?.reason || '对方蜂后已被围住。'}`}</p>
      <small>第 {data.roomData.roundNo} 局 · 服务端权威结算</small>
    </header>
    <div className="hive-result-grid">
      {!isMobile && <section className="hive-result-board">
        <header><span>终局蜂巢</span><small>只读快照</small></header>
        <MiniBoard stacks={data.roomData.stacks}
          lastAction={data.roomData.lastAction} />
      </section>}
      <section className="hive-result-summary">
        <span>OUTCOME / FINAL PRESSURE</span>
        <h2>{draw ? '两只蜂后，同时被命运围住。' : `${sideName(winnerSide)}守住了自己的蜂后。`}</h2>
        <Pressure side="white" value={whitePressure} />
        <Pressure side="black" value={blackPressure} />
        <div className="hive-result-facts">
          <div><strong>{result?.turnCount ?? data.roomData.moveLog.length}</strong>
            <small>行动回合</small></div>
          <div><strong>{result?.placedPieceCount ?? data.roomData.stacks.reduce(
            (total, stack) => total + stack.pieces.length,
            0,
          )}</strong><small>入场棋子</small></div>
          <div><strong>{result?.maxStackHeight ?? Math.max(
            0,
            ...data.roomData.stacks.map(stack => stack.pieces.length),
          )}</strong><small>最高叠层</small></div>
        </div>
        <p className="hive-result-reason">{result?.reason
          || '本局结果已由服务端确认。'}</p>
        <ActionButton onClick={onViewBoard}><Eye size={15} />
          {readOnly ? '回到回放棋盘' : '回看终局蜂巢'}</ActionButton>
      </section>
    </div>
    <div className="hive-result-actions">
      <ActionButton onClick={onViewBoard}><History size={16} />查看棋盘</ActionButton>
      {!readOnly && (owner
        ? <ActionButton variant="primary" pending={restarting}
          disabled={!onRestart} onClick={() => void onRestart?.()}>
          再来一局<ArrowRight size={17} /></ActionButton>
        : <ActionButton variant="primary" disabled>
          等待房主再来一局</ActionButton>)}
    </div>
  </main>;
}
