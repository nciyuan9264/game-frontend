import { ArrowRight, Eye, Trophy } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { PlayerAvatar } from '../../components/AppShell';
import { Disc } from '../../components/Artwork';
import { playerName, type GameSnapshot } from '../../model/session';
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
  const owner = data.ownerID === data.playerId;
  const draw = data.result?.draw ?? !winnerID;
  const winner = winnerID ? playerName(winnerID, data.roomData.players) : '';
  const blackCount = data.result?.blackCount
    ?? data.playerData[data.roomData.blackPlayerID]?.discCount
    ?? 0;
  const whiteCount = data.result?.whiteCount
    ?? data.playerData[data.roomData.whitePlayerID]?.discCount
    ?? 0;
  const total = Math.max(1, blackCount + whiteCount);
  const players = [
    { id: data.roomData.blackPlayerID, side: 'black' as const, count: blackCount },
    { id: data.roomData.whitePlayerID, side: 'white' as const, count: whiteCount },
  ];

  return <div className={styles.page}>
    <header><span>THE FINAL CHAPTER</span>
      <h1>{draw ? '棋逢对手，平局收场。' : '黑白落定，胜负已分。'}</h1>
      <p>{data.result?.reason || '对局已经由服务端完成结算。'}</p></header>
    <section className={styles.result}>
      <div className={styles.seal}><span /><Trophy size={37} /><span /></div>
      <span className={styles.eyebrow}>{draw ? 'A PERFECT BALANCE' : 'WELL PLAYED'}</span>
      <h2>{draw ? '黑白之间，未分高下。' : `${winner}，赢得这一局。`}</h2>
      <div className={styles.score}>{players.map(player => {
        const record = data.roomData.players[player.id];
        return <article key={player.side} className={player.id === winnerID ? styles.winner : ''}>
          <Disc side={player.side} />
          <PlayerAvatar name={playerName(player.id, data.roomData.players)}
            avatar={record?.avatar} ai={record?.ai} size={45} />
          <div><strong>{playerName(player.id, data.roomData.players)}</strong>
            <small>{player.side === 'black' ? '黑方 · 先手' : '白方 · 后手'}</small></div>
          <b>{player.count}<small>子</small></b>
        </article>;
      })}</div>
      <div className={styles.ratio}><i style={{ width: `${blackCount / total * 100}%` }} /></div>
      <p className={styles.scoreNote}>终局实际子数 · 空格不补计分</p>
      <p className={styles.caption}>下一次翻转，仍有新的可能。<br />
        <small>第 {data.roomData.roundNo} 局 · 权威结算</small></p>
    </section>
    <footer><ActionButton onClick={onViewBoard}><Eye size={15} />
      {readOnly ? '回到回放棋盘' : '回到棋盘'}</ActionButton>
      {!readOnly && (owner
        ? <ActionButton variant="primary" pending={restarting} disabled={!onRestart}
          onClick={() => void onRestart?.()}>
          再来一局<ArrowRight size={16} /></ActionButton>
        : <ActionButton variant="primary" disabled>等待房主再来一局</ActionButton>)}</footer>
  </div>;
}
