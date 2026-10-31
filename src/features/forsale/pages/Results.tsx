import {
  Check,
  Coins,
  ReceiptText,
  Trophy,
} from 'lucide-react';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import { ActionButton } from '@/components/GameUI/ActionButton';
import sold from '../assets/sold.webp';
import { PlayerAvatar } from '../components/GamePieces';
import {
  chequeMoney,
} from '../model/types';
import {
  playerLabel,
  playerName,
  type GameSnapshot,
} from '../model/session';

export const Results = ({
  data,
  enabled,
  onReview,
  onExit,
  onRematch,
  rematchPending,
}: {
  data: GameSnapshot;
  enabled: boolean;
  onReview: () => void;
  onExit: () => void;
  onRematch?: () => void;
  rematchPending?: boolean;
}) => {
  const rows = Object.entries(data.result ?? {})
    .sort(([, left], [, right]) => left.rank - right.rank);
  const self = data.result?.[data.playerId];
  const winners = rows.filter(([, result]) => result.winner);
  return <GameFinalResult
    className="fs-results"
    testId="forsale-results"
    mobileInset="self"
    heroClassName="fs-result-hero"
    contentClassName="fs-results-layout"
    standingsClassName="fs-ranking"
    summaryClassName="fs-receipt"
    actionsClassName="fs-result-actions"
    hero={<><div>
      <span className="fs-eyebrow">THE FINAL HAMMER FALLS</span>
      <small>本局已结束 · 服务端结算已锁定</small>
      <h1>{self?.winner
        ? winners.length > 1 ? '好买卖，并肩赢。' : '这一局，你眼光独到。'
        : `${playerLabel(winners[0]?.[0] ?? '', data.roomData.players)}，做成了好买卖。`}</h1>
      <p>房产全部售出，最后一笔财富已经入账。</p>
      <div><span>你的总财富</span><strong>{chequeMoney(self?.total ?? 0)}</strong>
        <b>第 {self?.rank ?? '—'} 名 / {rows.length} 人</b></div></div>
      <img src={sold} alt="成交时刻：钥匙、房屋、金币和支票" />
    </>}
    standings={<><header><span className="fs-eyebrow">FINAL STANDINGS</span>
        <h2>最终财富榜</h2></header>
      <div className="fs-rank-head"><span>买家</span><span>支票</span>
        <span>金币</span><span>总财富</span></div>
      {rows.map(([id, result]) => <article
        className={`${result.winner ? 'winner' : ''} ${
          id === data.playerId ? 'self' : ''}`} key={id}>
        <span>{result.rank === 1 ? <Trophy size={19} />
          : String(result.rank).padStart(2, '0')}</span>
        <PlayerAvatar name={playerName(id, data.roomData.players)}
          avatar={data.roomData.players[id]?.avatar}
          ai={data.roomData.players[id]?.ai} size={38} />
        <b>{playerLabel(id, data.roomData.players)}
          {id === data.playerId && <em>你</em>}</b>
        <span>{chequeMoney(result.chequeTotal)}</span>
        <span>{chequeMoney(result.coins)}</span>
        <strong>{chequeMoney(result.total)}</strong>
      </article>)}
      <p><Check size={14} />总财富相同先比较剩余金币；仍相同则并列获胜。</p>
    </>}
    summary={<><span className="fs-eyebrow">YOUR FINAL RECEIPT</span>
      <ReceiptText size={27} /><h2>你的成交小票</h2>
      <dl><div><dt>支票合计</dt><dd>{chequeMoney(self?.chequeTotal ?? 0)}</dd></div>
        <div><dt>剩余金币</dt><dd>+ {chequeMoney(self?.coins ?? 0)}</dd></div>
        <div><dt>最终财富</dt><dd>{chequeMoney(self?.total ?? 0)}</dd></div></dl>
      <span className="fs-receipt-stamp">SOLD & SETTLED</span>
      <ActionButton onClick={onReview}><Coins size={15} />查看终局牌桌</ActionButton>
    </>}
    actions={<GameFinalResultActions mode="live"
      onViewBoard={onReview} viewBoardLabel="查看终局牌桌"
      onLeave={onExit} canRestart={!!onRematch} onRestart={onRematch}
      restartPending={rematchPending} restartDisabled={!enabled} />}
  />;
};
