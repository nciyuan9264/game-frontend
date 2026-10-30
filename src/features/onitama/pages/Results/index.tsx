import {
  ArrowRight,
  Eye,
  History,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
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
    ? '一招定局，\n石之道成。'
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

  return <main className="result-page" data-testid="result-page">
    <div className="result-topline">
      <span className="eyebrow">THE PATH COMPLETED</span>
      <span>御神乐棋 / 房间 {data.roomID}</span>
    </div>
    <div className="result-composition">
      <section className="result-copy">
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
        <div className="result-stats">{stats.map(([value, label]) =>
          <div key={label}><b>{value}</b><span>{label}</span></div>)}</div>
        <div className="result-actions">
          <ActionButton onClick={onViewBoard}><Eye size={16} />
            {readOnly ? '回到回放棋盘' : '回看终局棋盘'}</ActionButton>
          {!readOnly && (owner
            ? <ActionButton variant="primary" pending={restarting}
              disabled={!onRestart} onClick={() => void onRestart?.()}>
              再来一局<ArrowRight size={16} /></ActionButton>
            : <ActionButton variant="primary" disabled>
              等待房主再来一局</ActionButton>)}
        </div>
      </section>

      {!isMobile && <aside className="result-art">
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
      </aside>}
    </div>
  </main>;
}
