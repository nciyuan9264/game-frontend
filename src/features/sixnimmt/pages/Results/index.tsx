import {
  ArrowLeft,
  ArrowRight,
  Eye,
  History,
  Trophy,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Bull, PlayerAvatar } from '../../components/AppShell';
import { BullScore, NumberCard } from '../../components/Card';
import { playerName, type GameSnapshot } from '../../model/session';

export function Results({
  data,
  onExit,
  onReview,
  onNextRound,
  onRematch,
  enabled,
  countdown,
  rematchPending,
}: {
  data: GameSnapshot;
  onExit: () => void;
  onReview: () => void;
  onNextRound: () => void;
  onRematch: () => void;
  enabled: boolean;
  countdown: string;
  rematchPending: boolean;
}) {
  const final = data.roomData.gameStatus === 'end';
  const result = data.result;
  const round = data.roomData.roundResult;
  const owner = data.ownerID === data.playerId;
  const total = (id: string) => result?.totalPenalties[id]
    ?? round?.totalPenalties[id]
    ?? data.playerData[id]?.totalPenalty
    ?? 0;
  const ranked = [...data.roomData.playerOrder].sort((a, b) =>
    total(a) - total(b)
      || (data.roomData.players[a]?.seatIndex ?? 0)
      - (data.roomData.players[b]?.seatIndex ?? 0));
  const winners = final ? result?.winnerIDs ?? [] : ranked.filter(id =>
    total(id) === total(ranked[0]));
  const won = winners.includes(data.playerId);

  return <div className="sn-results">
    <header><button type="button" aria-label="返回大厅" onClick={onExit}>
      <ArrowLeft size={19} /></button>
      <span>ROUND {String(data.roomData.roundNo).padStart(2, '0')}
        {' / '}{final ? 'FINAL SCORE' : 'ROUND COMPLETE'}</span>
      <button type="button" onClick={onReview}>
        <Eye size={15} />查看终局牌桌</button>
    </header>
    <section className="sn-result-hero"><div><Bull size={42} /><Trophy size={30} /></div>
      <small>{final ? 'LESS BULL. MORE BRAGGING RIGHTS.' : 'TEN CARDS ARE DONE'}</small>
      <h1>{final
        ? won ? '收得少，才是真的牛。' : '这一桌，牛头有了归处。'
        : '这一局，先记在记分板上。'}</h1>
      <p>{winners.map(id => playerName(id, data.roomData.players)).join('、')}
        {winners.length > 1 ? ' 并列领先' : final ? ' 赢得本场' : ' 本局牛头最少'}。</p>
      {final && <span><Trophy size={14} />完整局结束后达到 66 分阈值，比赛结束</span>}
    </section>

    <div className="sn-result-layout"><section className="sn-result-board">
      <header><h2>{final ? '最终记分板' : '累计记分板'}</h2>
        <small><Bull size={12} />牛头越少越好</small></header>
      <div className="sn-score-head"><span>排名 / 玩家</span>
        <span>本局牛头</span><span>累计牛头</span></div>
      {ranked.map((id, index) => {
        const player = data.roomData.players[id];
        const rank = result?.finalRanks[id]
          ?? 1 + ranked.filter(other => total(other) < total(id)).length;
        const roundPenalty = round?.roundPenalties[id]
          ?? data.playerData[id]?.roundPenalty
          ?? 0;
        return <article key={id}
          className={id === data.playerId ? 'self' : ''}>
          <span>{String(rank ?? index + 1).padStart(2, '0')}</span>
          <PlayerAvatar name={playerName(id, data.roomData.players)}
            avatar={player?.avatar} ai={player?.ai} size={38} />
          <div><b>{playerName(id, data.roomData.players)}</b>
            <small>{winners.includes(id) ? final ? '本场胜者' : '本局领先'
              : `第 ${rank} 名`}</small></div>
          <strong>+{roundPenalty}</strong>
          <BullScore value={total(id)} />
        </article>;
      })}</section>
      <aside className="sn-result-detail"><span className="sn-eyebrow">YOUR LITTLE HERD</span>
        <h2>你的收牛小结。</h2>
        <div><span><b>{data.playerData[data.playerId]?.takenCount ?? 0}</b>
          <small>收取卡牌</small></span>
          <span><b>{round?.roundPenalties[data.playerId]
            ?? data.playerData[data.playerId]?.roundPenalty
            ?? 0}</b><small>本局牛头</small></span></div>
        <div className="sn-result-cards">{[23, 25, 30, 44, 55].map(value =>
          <NumberCard key={value} value={value} compact />)}</div>
        <p>分数来自收取牌上的牛头总数，不是牌面数字，也不是收牌张数。</p>
      </aside></div>

    <footer className="sn-result-actions">
      <ActionButton onClick={onExit}><History size={15} />回到大厅</ActionButton>
      {!final && owner && <ActionButton variant="primary" disabled={!enabled}
        onClick={onNextRound}>继续下一局<ArrowRight size={16} /></ActionButton>}
      {!final && !owner && <span>等待房主继续{countdown && ` · ${countdown}`}</span>}
      {final && owner && <ActionButton variant="primary" pending={rematchPending}
        onClick={onRematch}>再来一场<ArrowRight size={16} /></ActionButton>}
      {final && !owner && <span>本场已经结束</span>}
    </footer>
  </div>;
}
