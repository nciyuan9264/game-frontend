import {
  ArrowLeft, ArrowRight, Crown, Eye, Flower2, Heart, History,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import { Hearts, Portrait } from '../../components/Card';
import { playerLabel, type GameSnapshot } from '../../model/session';
import stillLife from '../../assets/still-life.webp';

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
  const round = data.roomData.roundResult;
  const winners = final ? data.result?.winnerIDs ?? [] : round?.winnerIDs ?? [];
  const won = winners.includes(data.playerId);
  const owner = data.ownerID === data.playerId;
  const title = final
    ? won ? '你的信，送到了。' : '一场心意，有了答案。'
    : won ? '这一轮，你的信抵达了。' : '心意有归处，下封再相逢。';

  const topbar = <header data-game-result-topbar><button type="button" aria-label="返回大厅" onClick={onExit}>
      <ArrowLeft size={19} /></button>
      <span>ROUND {String(data.roomData.roundNo).padStart(2, '0')}
        {' / '}{final ? 'THE FINAL LETTER' : 'A LETTER DELIVERED'}</span>
      <button type="button" onClick={onReview}><Eye size={15} />查看终局牌桌</button>
    </header>;
  const hero = <><div><Flower2 /><Crown size={31} /></div>
      <small>{final ? '一场心意，终于有了答案' : '这一轮，尘埃落定'}</small>
      <h1>{title}</h1>
      <p>{winners.map(id => playerLabel(id, data.roomData.players)).join('、')}
        {winners.length > 1 ? ' 共同获胜' : ' 赢得本轮'}。</p>
      {final && <span><Crown size={14} />达到 {data.roomData.goal} 枚好感，赢得本场</span>}
    </>;
  const players = <><header>
        <h2>{final ? '最终心意排行' : '揭开最后的心意'}</h2>
        <small>{final ? '整场好感 · 最终名次' : '轮末手牌 · 好感变化'}</small>
      </header>
      {data.roomData.playerOrder.map((id, index) => {
        const value = data.playerData[id];
        const revealed = round?.revealedHands[id];
        const favor = final
          ? data.result?.favors[id] ?? value?.favors ?? 0
          : round?.favorsAfter[id] ?? value?.favors ?? 0;
        const delta = (round?.favorsAfter[id] ?? favor)
          - (round?.favorsBefore[id] ?? favor);
        const rank = data.result?.finalRanks[id];
        return <article key={id} className={winners.includes(id) ? 'winner' : ''}>
          <span>{String(final ? rank ?? index + 1 : index + 1).padStart(2, '0')}</span>
          <Portrait rank={revealed?.rank ?? index % 10} />
          <div><b>{playerLabel(id, data.roomData.players)}
            {id === data.playerId && <em>你</em>}</b>
            <small>{winners.includes(id) ? final ? '整场胜者' : '本轮胜者'
              : value?.alive ? '留在本轮' : '本轮出局'}</small></div>
          <span className="ll-result-hand">{revealed
            ? <><b>{revealed.rank}</b> · 已公开</>
            : <small>{final ? `第 ${rank ?? '—'} 名` : '已弃牌'}</small>}</span>
          <Hearts value={favor} total={data.roomData.goal} />
          {!final && <strong>{delta > 0 ? `+${delta}` : '—'}</strong>}
        </article>;
      })}</>;
  const letter = <><small>{final ? 'THE LETTER FOUND ITS WAY' : 'THE FAVOR YOU EARNED'}</small>
        <h2>{final ? `${winners.length} 位最终胜者` : won ? '+1 枚好感' : '下一封，继续。'}</h2>
        <p>{round?.spyPlayerID
          ? `${playerLabel(round.spyPlayerID, data.roomData.players)} 通过唯一存活的密探额外获得 1 枚好感。`
          : '本轮没有符合条件的唯一密探奖励。'}</p>
        <span><Heart size={13} />{final
          ? `共完成 ${data.roomData.roundNo} 轮传信`
          : round?.reason === 'last_player' ? '最后一位未出局者获胜' : '最高手牌者获得好感'}</span>
      </>;

  if (final) return <div className="ll-results ll-final-results">
    {topbar}
    <GameFinalResult
      mobileInset="self"
      heroClassName="ll-result-hero"
      contentClassName="ll-result-layout"
      standingsClassName="ll-result-players"
      summaryClassName="ll-result-letter"
      summaryStyle={{ backgroundImage: `url(${stillLife})` }}
      actionsClassName="ll-result-actions"
      hero={hero}
      standings={players}
      summary={letter}
      actions={<GameFinalResultActions mode="live"
        onViewBoard={onReview} viewBoardLabel="查看终局牌桌"
        onLeave={onExit} canRestart={owner} onRestart={onRematch}
        restartPending={rematchPending} restartDisabled={!enabled} />}
    />
  </div>;

  return <div className="ll-results">
    {topbar}
    <section className="ll-result-hero">{hero}</section>
    <div className="ll-result-layout">
      <section className="ll-result-players">{players}</section>
      <aside className="ll-result-letter" style={{ backgroundImage: `url(${stillLife})` }}>{letter}</aside>
    </div>
    <footer className="ll-result-actions">
      <ActionButton onClick={onExit}><History size={15} />回到大厅</ActionButton>
      <ActionButton className="ll-mobile-result-review"
        onClick={onReview}><Eye size={15} />查看终局牌桌</ActionButton>
      {owner && <ActionButton variant="primary" disabled={!enabled}
        onClick={onNextRound}>下一轮，继续传信<ArrowRight size={16} /></ActionButton>}
      {!owner && <span>等待房主继续{countdown && ` · ${countdown}`}</span>}
    </footer>
  </div>;
}
