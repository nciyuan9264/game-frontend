import {
  Trophy,
} from 'lucide-react';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import { MiniBoard } from '../../components/Board';
import { PlayerAvatar } from '../../components/AppShell';
import { Bug } from '../../components/Artwork';
import { sideName } from '../../model/board';
import {
  playerLabel,
  playerName,
  type GameSnapshot,
} from '../../model/session';
import { useHiveViewport } from '../../hooks/useHiveViewport';
import { playerForSide } from '../../model/selectors';
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
  onLeave,
  onRestart,
  restarting = false,
  readOnly = false,
}: {
  data: GameSnapshot;
  onViewBoard: () => void;
  onLeave?: () => void;
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
    : playerLabel(winnerID, data.roomData.players);
  const owner = data.ownerID === data.playerId;
  const states = Object.values(data.playerData);
  const whitePressure = states.find(state => state.side === 'white')?.queenPressure ?? 0;
  const blackPressure = states.find(state => state.side === 'black')?.queenPressure ?? 0;

  return <GameFinalResult
    className="hive-result-page"
    testId="result-page"
    mobileInset="self"
    heroClassName="hive-result-heading"
    contentClassName="hive-result-grid"
    standingsClassName="hive-result-board"
    summaryClassName="hive-result-summary"
    actionsClassName="hive-result-actions"
    hero={<>
      <span>THE LAST SHAPE OF THE HIVE</span>
      <div><Trophy size={31} /></div>
      <h1>{draw ? '同归一巢，胜负未分。' : '蜂巢合拢，胜局已定。'}</h1>
      <p>{draw
        ? result?.reason || '双方在同一局面中达成和棋。'
        : `${winner}获胜，${result?.reason || '对方蜂后已被围住。'}`}</p>
    </>}
    standings={!isMobile ? <>
        <header><span>终局蜂巢</span><small>只读快照</small></header>
        <MiniBoard stacks={data.roomData.stacks}
          lastAction={data.roomData.lastAction} />
      </> : <div className="hive-result-players">{(['white', 'black'] as Side[]).map(side => {
        const id = playerForSide(data, side);
        const player = data.roomData.players[id];
        return <article key={side} className={!draw && id === winnerID ? 'winner' : ''}>
          <PlayerAvatar name={playerName(id, data.roomData.players)}
            avatar={player?.avatar} ai={player?.ai} size={42} />
          <div><strong>{playerLabel(id, data.roomData.players)}</strong>
            <small>{sideName(side)} · {id === data.playerId ? '你' : '对手'}</small></div>
          <b>{draw ? '和' : id === winnerID ? '胜' : '负'}</b>
        </article>;
      })}</div>}
    summary={<><span>OUTCOME / FINAL PRESSURE</span>
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
    </>}
    actions={readOnly
      ? <GameFinalResultActions mode="replay" onViewBoard={onViewBoard}
          viewBoardLabel="回到回放棋盘" />
      : <GameFinalResultActions mode="live" onViewBoard={onViewBoard}
          viewBoardLabel="回看终局蜂巢" onLeave={onLeave ?? onViewBoard}
          canRestart={owner} onRestart={onRestart}
          restartPending={restarting} />}
  />;
}
