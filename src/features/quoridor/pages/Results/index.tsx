import {
  Check,
  History,
  Trophy,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import {
  MiniBoard,
} from '../../components/Board';
import { PlayerAvatar } from '../../components/AppShell';
import { Pawn } from '../../components/Artwork';
import {
  colorName,
  sideName,
  targetRow,
} from '../../model/board';
import {
  playerLabel,
  playerName,
  type GameSnapshot,
} from '../../model/session';
import { useQuoridorViewport } from '../../hooks/useQuoridorViewport';
import { playerForSide } from '../../model/selectors';
import type { Side } from '../../model/types';

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
  const { isMobile } = useQuoridorViewport();
  const winnerID = data.result?.winnerID ?? '';
  const winnerSide = data.result?.winnerSide
    ?? data.playerData[winnerID]?.side
    ?? 'south';
  const winner = playerLabel(winnerID, data.roomData.players);
  const owner = data.ownerID === data.playerId;
  const resigned = data.result?.reason.includes('认输') ?? false;
  const stats = [
    [data.result?.turnCount ?? data.roomData.moveLog.length, '行动回合'],
    [data.result?.placedWallCount ?? data.roomData.walls.length, '盘上围墙'],
    [data.roomData.wallStock[winnerSide], '胜方余墙'],
  ] as const;

  return <GameFinalResult
    className="collection-content result-page"
    testId="result-page"
    mobileInset="self"
    heroClassName="result-certificate"
    contentClassName="result-grid"
    standingsClassName="final-position"
    summaryClassName="result-summary"
    actionsClassName="result-actions"
    hero={<>
        <span className="eyebrow"><i />THE OTHER SIDE OF THE JOURNEY</span>
        <div className="result-emblem"><i /><Trophy size={33} /><i /></div>
        <h1>{resigned ? '这一程，落定于此。' : '先一步，抵达彼岸。'}</h1>
        <p>{winner}获胜，{resigned
          ? '对手选择结束本局。'
          : '走到了自己的目标行。'}</p>
        <div className="winner-display">
          <Pawn side={winnerSide} />
          <div><small>{colorName(winnerSide)} · {sideName(winnerSide)}</small>
            <strong>{winner}</strong>
            <span>{resigned
              ? '对手认输'
              : `第 ${targetRow(winnerSide) + 1} 行 · 成功抵达`}
              <Check size={14} /></span></div>
        </div>
        <p className="result-reason">
          {data.result?.reason || '本局结果已由服务端确认。'}
        </p>
      </>}
    standings={!isMobile ? <>
        <span className="eyebrow"><i />THE LAST POSITION</span>
        <div className="final-board-title"><h2>这一局最后的模样</h2>
          <span>只读快照</span></div>
        <MiniBoard
          pawns={data.roomData.pawns}
          walls={data.roomData.walls}
          currentSide={winnerSide as Side}
          referencePaths={data.roomData.referencePaths}
          lastAction={data.roomData.lastAction}
        />
        <h3>房间 {data.roomID}</h3>
        <p>经典双人 · 第 {data.roomData.roundNo} 局</p>
        <ActionButton onClick={onViewBoard}><History size={16} />
          查看终局棋盘</ActionButton>
        <small>终局位置、围墙库存与结果均来自同一份权威快照。</small>
      </> : <div className="result-player-list">{(['south', 'north'] as Side[]).map(side => {
        const id = playerForSide(data, side);
        const player = data.roomData.players[id];
        return <article key={side} className={id === winnerID ? 'winner' : ''}>
          <PlayerAvatar name={playerName(id, data.roomData.players)}
            avatar={player?.avatar} ai={player?.ai} size={42} />
          <div><strong>{playerLabel(id, data.roomData.players)}</strong>
            <small>{colorName(side)} · {sideName(side)}</small></div>
          <b>{id === winnerID ? '胜' : '负'}</b>
        </article>;
      })}</div>}
    summary={<><span className="eyebrow"><i />THE JOURNEY IN NUMBERS</span>
      <div className="result-stats">{stats.map(([value, label]) =>
        <div key={label}><b>{value}</b><span>{label}</span></div>)}</div>
      <div className="result-quote">有墙的地方，也有路。
        <small>胜负取决于抵达顺序，不取决于余墙数量。</small></div></>}
    actions={readOnly
      ? <GameFinalResultActions mode="replay" onViewBoard={onViewBoard}
          viewBoardLabel="回到回放棋盘" />
      : <GameFinalResultActions mode="live" onViewBoard={onViewBoard}
          viewBoardLabel="回看棋盘" onLeave={onLeave ?? onViewBoard}
          canRestart={owner} onRestart={onRestart}
          restartPending={restarting} />}
  />;
}
