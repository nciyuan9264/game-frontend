import { ArrowRight, Eye, Trophy } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { PlayerAvatar } from '../../components/AppShell';
import { Stone } from '../../components/Artwork';
import { direction, sideName } from '../../model/board';
import { playerLabel, playerName, type GameSnapshot } from '../../model/session';
import styles from './index.module.less';

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
  const winnerID = data.result?.winnerID ?? '';
  const winnerSide = data.result?.winnerSide
    ?? data.playerData[winnerID]?.side
    ?? 'red';
  const winner = playerLabel(winnerID, data.roomData.players);
  const owner = data.ownerID === data.playerId;
  const resigned = data.result?.reason.includes('认输') ?? false;
  const playerOrder = data.roomData.playerOrder.length
    ? data.roomData.playerOrder
    : Object.keys(data.roomData.players);

  return <div className={styles.page} data-testid="result-page"><header>
    <span>THE FINAL CONNECTION</span>
    <h1>{resigned ? '此局，落定。' : '两岸，终于相连。'}</h1>
    <p>{data.result?.reason || '结果已由服务端确认。'}</p>
  </header>
    <section className={styles.result}><div className={styles.seal}>
      <Trophy size={36} /><div><Stone side={winnerSide} />
        <span>{sideName(winnerSide)}</span><Stone side={winnerSide} /></div></div>
      <h2>{winner}，{resigned ? '赢得这一局。' : direction(winnerSide)}</h2>
      <div className={styles.score}>{playerOrder.map(id => {
        const state = data.playerData[id];
        const side = state?.side ?? (id === winnerID ? winnerSide : 'teal');
        return <article key={id} className={id === winnerID ? styles.winner : ''}>
          <PlayerAvatar name={playerName(id, data.roomData.players)}
            avatar={data.roomData.players[id]?.avatar}
            ai={data.roomData.players[id]?.ai} size={52} />
          <div><strong>{playerLabel(id, data.roomData.players)}</strong>
            <small>{sideName(side)} · {direction(side)}</small></div>
          <b>{state?.stoneCount ?? 0}<small> 子</small></b>
        </article>;
      })}</div>
      <p className={styles.caption}>连接不必笔直，抵达自有方向。</p></section>
    <footer><ActionButton onClick={onViewBoard}><Eye size={15} />
      {readOnly ? '回到回放棋盘' : '查看终局棋盘'}</ActionButton>
      {!readOnly && (owner
        ? <ActionButton variant="primary" pending={restarting}
          disabled={!onRestart} onClick={() => void onRestart?.()}>
          再来一局<ArrowRight size={16} /></ActionButton>
        : <ActionButton variant="primary" disabled>
          等待房主再来一局</ActionButton>)}</footer>
  </div>;
}
