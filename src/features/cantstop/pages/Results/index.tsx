import {
  ArrowLeft,
  Eye,
  Trophy,
} from 'lucide-react';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import { Bull, PlayerAvatar } from '../../components/AppShell';
import {
  claimedCount,
  formatColumns,
  savedStepCount,
} from '../../model/board';
import { playerLabel, playerName, type GameSnapshot } from '../../model/session';

export function Results({
  data,
  onExit,
  onReview,
  onRematch,
  enabled,
  rematchPending,
}: {
  data: GameSnapshot;
  onExit: () => void;
  onReview: () => void;
  onRematch: () => void;
  enabled: boolean;
  rematchPending: boolean;
}) {
  const owner = data.ownerID === data.playerId;
  const winnerID = data.result?.winnerID ?? data.roomData.playerOrder[0];
  const won = winnerID === data.playerId;
  const ranked = [...data.roomData.playerOrder].sort((a, b) =>
    claimedCount(data, b) - claimedCount(data, a)
      || savedStepCount(data.playerData[b]) - savedStepCount(data.playerData[a])
      || (data.roomData.players[a]?.seatIndex ?? 0)
        - (data.roomData.players[b]?.seatIndex ?? 0));

  return <div className="cs-results">
    <header data-game-result-topbar><button type="button" aria-label="返回大厅" onClick={onExit}>
      <ArrowLeft size={19} /></button>
      <span>FINAL SUMMIT · TURN {data.result?.turnCount ?? data.roomData.turnNumber}</span>
      <button type="button" onClick={onReview}>
        <Eye size={15} />查看终局棋盘</button>
    </header>
    <GameFinalResult
      mobileInset="self"
      heroClassName="cs-result-hero"
      contentClassName="cs-result-layout"
      standingsClassName="cs-result-board"
      summaryClassName="cs-result-detail"
      actionsClassName="cs-result-actions"
      hero={<><div><Bull size={42} /><Trophy size={30} /></div>
      <small>THREE SUMMITS. ONE GREAT ADVENTURE.</small>
      <h1>{won ? '这一次，山顶属于你。' : '这一次，有人先登顶。'}</h1>
      <p>{playerLabel(winnerID, data.roomData.players)} 率先占领三条路线。</p>
      <span><Trophy size={14} />{data.result?.reason ?? '占领三条路线，比赛结束。'}</span>
    </>}
      standings={<><header><h2>最终登顶榜</h2>
        <small><Bull size={12} />占领路线越多越好</small></header>
      <div className="cs-score-head"><span>排名 / 玩家</span>
        <span>登顶路线</span><span>保存步数</span></div>
      {ranked.map((id, index) => {
        const player = data.roomData.players[id];
        return <article key={id}
          className={id === data.playerId ? 'self' : ''}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <PlayerAvatar name={playerName(id, data.roomData.players)}
            avatar={player?.avatar} ai={player?.ai} size={38} />
          <div><b>{playerLabel(id, data.roomData.players)}</b>
            <small>{id === winnerID ? '本局登顶者' : `第 ${index + 1} 名`}</small></div>
          <strong>{claimedCount(data, id)} / 3</strong>
          <span className="cs-route-score">{savedStepCount(data.playerData[id])}</span>
        </article>;
      })}</>}
      summary={<><span className="cs-eyebrow">YOUR CLIMB</span>
        <h2>你的山路小结。</h2>
        <div><span><b>{claimedCount(data, data.playerId)}</b>
          <small>占领路线</small></span>
          <span><b>{savedStepCount(data.playerData[data.playerId])}</b>
            <small>保存步数</small></span></div>
        <div className="cs-summit-badges">{(data.result?.claimedColumns ?? [])
          .map(column => <span key={column}><Bull size={18} /><b>{column}</b>
            <small>已封列</small></span>)}</div>
        <p>获胜路线：{formatColumns(data.result?.claimedColumns ?? [])}。失手次数由服务端记录在历史结果中。</p>
      </>}
      actions={<GameFinalResultActions mode="live"
        onViewBoard={onReview} viewBoardLabel="查看终局棋盘"
        onLeave={onExit} canRestart={owner} onRestart={onRematch}
        restartLabel="再来一场" restartPending={rematchPending}
        restartDisabled={!enabled} />}
    />
  </div>;
}
