import { Crown } from 'lucide-react';
import { formatRole, formatScore } from './format';
import type { ResultCardModel, ResultCardPlayer } from './model';
import type { ResultCardTheme } from './themes';
import styles from './ResultStandings.module.less';

export type ResultStandingsDensity = 'duel' | 'relaxed' | 'compact';

export function resultStandingsDensity(
  playerCount: number,
): ResultStandingsDensity {
  if (playerCount === 2) return 'duel';
  if (playerCount <= 6) return 'relaxed';
  return 'compact';
}

function initial(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? '?';
}

function stateLabel(player: ResultCardPlayer): string {
  if (player.isWinner && player.isSelf) return '我的冠军';
  if (player.isWinner) return '冠军';
  if (player.isSelf) return '我的战绩';
  if (player.isAI) return 'AI';
  return '';
}

function PlayerBadge({ player }: { player: ResultCardPlayer }) {
  return <span className={styles.badge}>
    {initial(player.displayName)}
    {player.isAI && <small>AI</small>}
  </span>;
}

function DuelPlayer({
  model,
  player,
  design,
}: {
  model: ResultCardModel;
  player: ResultCardPlayer;
  design: ResultCardTheme;
}) {
  const role = formatRole(player, design);
  return <div
    className={[
      styles.duelPlayer,
      player.isWinner ? styles.winner : '',
      player.isSelf ? styles.self : '',
    ].filter(Boolean).join(' ')}
  >
    <span className={styles.duelRank}>
      {player.finalRank == null ? '—' : `0${player.finalRank}`.slice(-2)}
    </span>
    <PlayerBadge player={player} />
    <strong className={styles.duelName}>{player.displayName}</strong>
    <span className={styles.duelRole}>
      {stateLabel(player) || role || '参赛玩家'}
    </span>
    <b className={styles.duelScore}>
      {formatScore(model.gameType, player.finalScore)}
    </b>
    <small className={styles.duelScoreLabel}>{design.scoreLabel}</small>
    {player.isWinner && <Crown className={styles.crown} size={18} />}
  </div>;
}

function RankingRow({
  model,
  player,
  design,
}: {
  model: ResultCardModel;
  player: ResultCardPlayer;
  design: ResultCardTheme;
}) {
  const role = formatRole(player, design);
  const status = stateLabel(player);
  return <div
    className={[
      styles.row,
      player.isWinner ? styles.winner : '',
      player.isSelf ? styles.self : '',
    ].filter(Boolean).join(' ')}
  >
    <b className={styles.rank}>
      {player.finalRank == null
        ? '—'
        : String(player.finalRank).padStart(2, '0')}
    </b>
    <PlayerBadge player={player} />
    <span className={styles.name}>
      <strong>{player.displayName}</strong>
      <small>{role ?? (player.isAI ? 'AI 玩家' : '参赛玩家')}</small>
    </span>
    <span className={styles.state}>
      {player.isWinner && <Crown size={10} />}
      {status}
    </span>
    <span className={styles.score}>
      <b>{formatScore(model.gameType, player.finalScore)}</b>
      <small>{design.scoreLabel}</small>
    </span>
  </div>;
}

export function ResultStandings({
  model,
  design,
  density = resultStandingsDensity(model.players.length),
  className = '',
}: {
  model: ResultCardModel;
  design: ResultCardTheme;
  density?: ResultStandingsDensity;
  className?: string;
}) {
  return <section
    className={`${styles.standings} ${styles[density]} ${className}`}
    data-result-standings={density}
  >
    <header className={styles.header}>
      <div><small>FINAL STANDINGS</small><h2>最终排名</h2></div>
      <span>{model.players.length} 位玩家</span>
    </header>
    {density === 'duel'
      ? <div className={styles.duelGrid}>
        <DuelPlayer model={model} player={model.players[0]} design={design} />
        <span className={styles.versus}>VS</span>
        <DuelPlayer model={model} player={model.players[1]} design={design} />
      </div>
      : <div className={styles.list}>
        {model.players.map((player, index) => <RankingRow
          key={`${player.seatIndex}-${index}`}
          model={model}
          player={player}
          design={design}
        />)}
      </div>}
  </section>;
}
