import { Trophy } from 'lucide-react';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import { PlayerAvatar } from '../../components/AppShell';
import { RingIcon } from '../../components/Artwork';
import { playerLabel, playerName, type GameSnapshot } from '../../model/session';
import styles from './index.module.less';

export function Results({
  data,
  onViewBoard,
  onLeave,
  onRestart,
  restarting = false,
  readOnly = false,
}: {
  data: GameSnapshot;
  onViewBoard: () => void;
  onLeave?: () => void;
  onRestart?: () => Promise<boolean>;
  restarting?: boolean;
  readOnly?: boolean;
}) {
  const winnerID = data.result?.winnerID ?? '';
  const owner = data.ownerID === data.playerId;
  const draw = !winnerID;
  const winner = winnerID ? playerLabel(winnerID, data.roomData.players) : '';
  return <GameFinalResult
    className={styles.page}
    mobileInset="self"
    heroClassName={styles.hero}
    standingsClassName={styles.result}
    summaryClassName={styles.summary}
    actionsClassName={styles.actions}
    hero={<><span>THE FINAL CHAPTER</span><h1>
    {draw ? '棋逢对手，平局收场。' : '这一局，落定。'}
  </h1><p>{data.result?.reason || '对局已经由服务端完成结算。'}</p></>}
    standings={<><div className={styles.seal}><Trophy size={36} />
      <div>{[0, 1, 2].map(index => <RingIcon key={index}
        side={winnerID ? data.playerData[winnerID]?.side : 'white'}
        filled={!draw && index < (data.playerData[winnerID]?.ringsRemoved ?? 0)} />)}</div></div>
      <h2>{draw ? '黑白之间，未分高下' : `${winner}，赢得这一局。`}</h2>
      <div className={styles.score}>{data.roomData.playerOrder.map(id => {
        const state = data.playerData[id];
        return <article key={id} className={id === winnerID ? styles.winner : ''}>
          <PlayerAvatar name={playerName(id, data.roomData.players)}
            avatar={data.roomData.players[id]?.avatar} ai={data.roomData.players[id]?.ai} size={52} />
          <div><strong>{playerLabel(id, data.roomData.players)}</strong><small>{state?.side === 'white' ? '白方 · 先手' : '黑方'}</small></div>
          <b>{state?.ringsRemoved ?? 0}<small> 环</small></b>
        </article>;
      })}</div>
      <p className={styles.caption}>少一枚圆环，多一种可能。</p></>}
    summary={<><span>HOW THE RINGS FELL</span>
      <h3>{draw ? '双方未分高下' : `${winner}率先移除三枚圆环`}</h3>
      <p>{data.result?.reason || '对局已经由服务端完成结算。'}</p></>}
    actions={readOnly
      ? <GameFinalResultActions mode="replay" onViewBoard={onViewBoard}
          viewBoardLabel="回到回放棋盘" />
      : <GameFinalResultActions mode="live" onViewBoard={onViewBoard}
          viewBoardLabel="回到棋盘" onLeave={onLeave ?? onViewBoard}
          canRestart={owner} onRestart={onRestart}
          restartPending={restarting} />}
  />;
}
