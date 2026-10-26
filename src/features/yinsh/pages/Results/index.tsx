import { ArrowRight, Eye, Trophy } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { PlayerAvatar } from '../../components/AppShell';
import { RingIcon } from '../../components/Artwork';
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
  const draw = !winnerID;
  const winner = winnerID ? playerName(winnerID, data.roomData.players) : '';
  return <div className={styles.page}><header><span>THE FINAL CHAPTER</span><h1>
    {draw ? '棋逢对手，平局收场。' : '这一局，落定。'}
  </h1><p>{data.result?.reason || '对局已经由服务端完成结算。'}</p></header>
    <section className={styles.result}><div className={styles.seal}><Trophy size={36} />
      <div>{[0, 1, 2].map(index => <RingIcon key={index}
        side={winnerID ? data.playerData[winnerID]?.side : 'white'}
        filled={!draw && index < (data.playerData[winnerID]?.ringsRemoved ?? 0)} />)}</div></div>
      <h2>{draw ? '黑白之间，未分高下' : `${winner}，赢得这一局。`}</h2>
      <div className={styles.score}>{data.roomData.playerOrder.map(id => {
        const state = data.playerData[id];
        return <article key={id} className={id === winnerID ? styles.winner : ''}>
          <PlayerAvatar name={playerName(id, data.roomData.players)}
            avatar={data.roomData.players[id]?.avatar} ai={data.roomData.players[id]?.ai} size={52} />
          <div><strong>{playerName(id, data.roomData.players)}</strong><small>{state?.side === 'white' ? '白方 · 先手' : '黑方'}</small></div>
          <b>{state?.ringsRemoved ?? 0}<small> 环</small></b>
        </article>;
      })}</div>
      <p className={styles.caption}>少一枚圆环，多一种可能。<br /><small>第 {data.roomData.roundNo} 局 · 权威结算</small></p></section>
    <footer><ActionButton onClick={onViewBoard}><Eye size={15} />
      {readOnly ? '回到回放棋盘' : '回到棋盘'}</ActionButton>
      {!readOnly && (owner
        ? <ActionButton variant="primary" pending={restarting}
          disabled={!onRestart} onClick={() => void onRestart?.()}>
          再来一局<ArrowRight size={16} /></ActionButton>
        : <ActionButton variant="primary" disabled>
          等待房主再来一局</ActionButton>)}</footer>
  </div>;
}
