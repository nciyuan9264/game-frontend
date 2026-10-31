import { Flag, Trophy } from 'lucide-react';
import { playerDisplayLabel } from '@/features/game-core/model/room';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import { score, type Game, type Side } from '../../model';
import { Crest } from '../../visuals';
import styles from './index.module.less';

export function Results({
  game,
  onViewBoard,
  onLeave,
  canRestart,
  onRestart,
  restartPending = false,
}: {
  game: Game;
  onViewBoard: () => void;
  onLeave: () => void;
  canRestart: boolean;
  onRestart?: () => void;
  restartPending?: boolean;
}) {
  const winner = game.winner ?? 0;
  const won = game.winner === game.selfSide;
  const sides: Side[] = [0, 1];

  return <GameFinalResult
    className={styles.page}
    testId="warchest-results"
    mobileInset="self"
    heroClassName={styles.hero}
    standingsClassName={styles.standings}
    summaryClassName={styles.summary}
    actionsClassName={styles.actions}
    hero={<>
      <span className={styles.emblem}><Crest side={winner} size={78} /><Trophy size={26} /></span>
      <small>{won ? 'VICTORY · THE FIELD IS YOURS' : 'A BATTLE WELL FOUGHT'}</small>
      <h1>{won ? '六面旗帜，见证你的远见。' : '战局已定，下次再战。'}</h1>
      <p>最后一枚控制标记落下，对局立即结束。</p>
      <strong>{score(game, 0)} <i>:</i> {score(game, 1)}</strong>
    </>}
    standings={<>
      <header><small>FINAL STANDINGS</small><h2>两面战旗，最后的阵线</h2></header>
      {sides.sort((left, right) => Number(right === winner) - Number(left === winner))
        .map((side, index) => {
          const player = game.players[side];
          return <article key={side} className={side === winner ? styles.winner : ''}>
            <span className={styles.rank}>{String(index + 1).padStart(2, '0')}</span>
            <Crest side={side} size={42} />
            <div><strong>{playerDisplayLabel(player, player.playerID)}</strong>
              <small>{side === 0 ? '橡木军团' : '赤隼军团'} · {player.playerID === game.players[game.selfSide].playerID ? '你' : '对手'}</small></div>
            <b>{score(game, side)}<small> / 6</small></b>
          </article>;
        })}
    </>}
    summary={<>
      <small>THE FIELD IN NUMBERS</small><h2>这一战，如何落定？</h2>
      <div className={styles.facts}>
        <span><b>{game.round}</b><small>结束轮次</small></span>
        <span><b>{game.actions}</b><small>本次行动</small></span>
        <span><b>6</b><small>获胜据点</small></span>
      </div>
      <p><Flag size={14} />控局，而非歼灭。率先放完六枚控制标记即胜。</p>
    </>}
    actions={<GameFinalResultActions mode="live"
      onViewBoard={onViewBoard} viewBoardLabel="回到终局棋盘"
      onLeave={onLeave} canRestart={canRestart} onRestart={onRestart}
      restartPending={restartPending} />}
  />;
}
