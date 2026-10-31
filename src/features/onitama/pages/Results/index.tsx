import {
  ArrowRight,
  History,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import { Board } from '../../components/Board';
import {
  Torii,
} from '../../components/Artwork';
import {
  CardArtwork,
  MiniGrid,
} from '../../components/MoveCard';
import { useOnitamaViewport } from '../../hooks/useOnitamaViewport';
import {
  CARDS,
} from '../../model/cards';
import {
  playerForSide,
  resultReasonCopy,
  viewerSide,
} from '../../model/selectors';
import {
  playerLabel,
  type GameSnapshot,
} from '../../model/session';

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
  const { isMobile } = useOnitamaViewport();
  const winnerSide = data.result?.winnerSide ?? 'blue';
  const winnerID = data.result?.winnerID || playerForSide(data, winnerSide);
  const winner = playerLabel(winnerID, data.roomData.players);
  const owner = data.ownerID === data.playerId;
  const reason = data.result?.reason ?? '';
  const last = data.roomData.lastAction;
  const lastCard = last?.cardID ?? 'tiger';
  const viewer = viewerSide(data);
  const title = reason === 'stone'
    ? '一招定局，石之道成。'
    : reason === 'stream'
      ? '山门已至，\n流水无争。'
      : '收起这一式，\n下局再相逢。';
  const reasonName = reason === 'stone'
    ? '擒获宗师'
    : reason === 'stream'
      ? '宗师入门'
      : '对手认输';
  const stats = [
    [data.result?.turnCount ?? data.roomData.moveLog.length, '总步数'],
    [data.result?.winnerPieceCount ?? 0, '胜方余子'],
    [`第 ${data.roomData.roundNo} 局`, '对局轮次'],
  ] as const;
  const playerOrder = data.roomData.playerOrder.length
    ? data.roomData.playerOrder
    : Object.keys(data.roomData.players);

  return <main className="result-page" data-testid="result-page">
    <div className="result-topline">
      <span className="eyebrow">THE PATH COMPLETED</span>
      <span>御神乐棋 / 房间 {data.roomID}</span>
    </div>
    <GameFinalResult
      className="result-composition"
      mobileInset="self"
      heroClassName="result-copy"
      contentClassName="result-side"
      standingsClassName="result-standings"
      summaryClassName="result-summary"
      actionsClassName="result-actions"
      hero={<>
        <div className={`result-seal ${winnerSide}`}>
          <Torii size={48} /><span>胜</span>
        </div>
        <span className="eyebrow">{
          reason === 'stone'
            ? 'WAY OF THE STONE'
            : reason === 'stream'
              ? 'WAY OF THE STREAM'
              : 'A GRACEFUL CONCLUSION'
        }</span>
        <h1>{title}</h1>
        <div className="winner-line">
          <i className={`side-dot ${winnerSide}`} />
          <strong>{winner} 获胜</strong>
          <span>{reasonName}</span>
        </div>
        <p className="result-description">{resultReasonCopy(reason)}</p>
      </>}
      standings={playerOrder.map(id => {
        const playerSide = data.playerData[id]?.side ?? (id === winnerID ? winnerSide : winnerSide === 'blue' ? 'red' : 'blue');
        return <article key={id} className={id === winnerID ? 'winner' : ''}>
          <i className={`side-dot ${playerSide}`} />
          <div><strong>{playerLabel(id, data.roomData.players)}</strong>
            <small>{playerSide === 'blue' ? '蓝方' : '红方'} · {id === data.playerId ? '你' : '对手'}</small></div>
          <b>{id === winnerID ? '胜' : '负'}</b>
        </article>;
      })}
      summary={<><div className="result-mobile-summary">
        <div className="result-stats">{stats.map(([value, label]) =>
          <div key={label}><b>{value}</b><span>{label}</span></div>)}</div>
        <p><span className="eyebrow">THE LAST MOVE</span>
          {last?.kind === 'move' ? `${CARDS[lastCard].name}完成最后一式。` : reasonName}</p>
      </div>
      {!isMobile && <div className="result-art">
        <CardArtwork id={reason === 'stream' ? 'crane' : lastCard} />
        <span className="vertical-quote">一 式 落 定<br />余 韵 犹 在</span>
        <div className="result-last">
          <div><span className="eyebrow">THE LAST MOVE</span>
            <strong>{last?.kind === 'move'
              ? `${CARDS[lastCard].name} · ${last.from ? `${'ABCDE'[last.from.column]}${5 - last.from.row}` : '—'} → ${
                last.to ? `${'ABCDE'[last.to.column]}${5 - last.to.row}` : '—'
              }`
              : last?.kind === 'pass'
                ? `${CARDS[lastCard].name} · 换牌跳过`
                : '认输结束'}</strong>
            <span>终局位置与结果来自同一份权威快照。</span></div>
          <MiniGrid id={lastCard} side={winnerSide} />
        </div>
        <div className="final-board">
          <Board
            pieces={data.roomData.pieces}
            view={viewer}
            lastAction={last}
            small
          />
          <ActionButton onClick={onViewBoard}><History size={15} />
            查看终局棋盘<ArrowRight size={15} /></ActionButton>
        </div>
      </div>}</>}
      actions={readOnly
        ? <GameFinalResultActions mode="replay" onViewBoard={onViewBoard}
            viewBoardLabel="回到回放棋盘" />
        : <GameFinalResultActions mode="live" onViewBoard={onViewBoard}
            viewBoardLabel="回看终局棋盘" onLeave={onLeave ?? onViewBoard}
            canRestart={owner} onRestart={onRestart}
            restartPending={restarting} />}
    />
  </main>;
}
