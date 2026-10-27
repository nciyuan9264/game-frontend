import { ArrowRight, Check, Eye, Trophy } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { MiniBoard } from '../../components/Board';
import { Stone } from '../../components/Artwork';
import { direction, sideName } from '../../model/board';
import { playerName, type GameSnapshot } from '../../model/session';
import { useHexViewport } from '../../hooks/useHexViewport';

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
  const { isMobile } = useHexViewport();
  const winnerID = data.result?.winnerID ?? '';
  const winnerSide = data.result?.winnerSide
    ?? data.playerData[winnerID]?.side
    ?? 'red';
  const winner = playerName(winnerID, data.roomData.players);
  const owner = data.ownerID === data.playerId;
  const resigned = data.result?.reason.includes('认输') ?? false;
  const stats = [
    [data.result?.turnCount ?? data.roomData.moveLog.length, '行动手数'],
    [data.result?.pathLength ?? data.roomData.winningPath.length, '获胜路径'],
    [winnerSide === 'red'
      ? data.result?.redStoneCount ?? 0
      : data.result?.tealStoneCount ?? 0, '胜方棋子'],
  ] as const;

  return <main className="collection-content result-page" data-testid="result-page">
    <div className="result-eyebrow"><span className="eyebrow"><i />
      A CONNECTION, COMPLETE</span>
      <span className="quiet-badge">第 {data.roomData.roundNo} 局 · 权威结算</span></div>
    <div className="result-grid"><section className="result-certificate">
      <div className="result-emblem"><i /><Trophy size={33} /><i /></div>
      <h1>{resigned ? '此局，落定。' : '两岸，终于相连。'}</h1>
      <p>{winner}获胜，{resigned ? '对手选择结束本局。' : direction(winnerSide)}</p>
      <div className="winner-display"><Stone side={winnerSide} /><div>
        <small>{sideName(winnerSide)} · {direction(winnerSide)}</small>
        <strong>{winner}</strong><span>{resigned ? '对手认输' : '完整连接'}
          <Check size={14} /></span></div></div>
      <p className="result-reason">{data.result?.reason || '结果已由服务端确认。'}</p>
      <div className="result-stats">{stats.map(([value, label]) =>
        <div key={label}><b>{value}</b><span>{label}</span></div>)}</div>
      <div className="result-quote">连接不必笔直，抵达自有方向。
        <small>胜负只取决于是否连通自己的两岸。</small></div>
      <div className="page-actions"><div className="page-buttons">
        <ActionButton onClick={onViewBoard}><Eye size={15} />
          {readOnly ? '回到回放棋盘' : '查看终局棋盘'}</ActionButton>
        {!readOnly && (owner
          ? <ActionButton variant="primary" pending={restarting}
            disabled={!onRestart} onClick={() => void onRestart?.()}>
            再来一局<ArrowRight size={17} /></ActionButton>
          : <ActionButton variant="primary" disabled>等待房主再来一局</ActionButton>)}
      </div></div>
    </section>
      {!isMobile && <aside className="final-position">
        <span className="eyebrow"><i />THE LAST CONNECTION</span>
        <div className="final-board-title"><h2>这一局最后的模样</h2><span>只读快照</span></div>
        <MiniBoard board={data.roomData.board} currentSide={winnerSide}
          winningPath={data.roomData.winningPath}
          lastAction={data.roomData.lastAction} />
        <h3>房间 {data.roomID}</h3><p>经典 11 × 11 · 第 {data.roomData.roundNo} 局</p>
        <ActionButton onClick={onViewBoard}>查看终局棋盘<ArrowRight size={16} /></ActionButton>
      </aside>}
    </div>
  </main>;
}
