import { Trophy } from 'lucide-react';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import { PlayerAvatar } from '../../components/AppShell';
import { Disc } from '../../components/Artwork';
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
  const draw = data.result?.draw ?? !winnerID;
  const winner = winnerID ? playerLabel(winnerID, data.roomData.players) : '';
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

  return <GameFinalResult
    className={styles.page}
    mobileInset="self"
    heroClassName={styles.hero}
    standingsClassName={styles.result}
    summaryClassName={styles.summary}
    actionsClassName={styles.actions}
    hero={<><span>THE FINAL CHAPTER</span>
      <h1>{draw ? '棋逢对手，平局收场。' : '黑白落定，胜负已分。'}</h1>
      <p>下一次翻转，仍有新的可能。</p></>}
    standings={<><div className={styles.seal}><span /><Trophy size={37} /><span /></div>
      <span className={styles.eyebrow}>{draw ? 'A PERFECT BALANCE' : 'WELL PLAYED'}</span>
      <h2>{draw ? '黑白之间，未分高下。' : `${winner}，赢得这一局。`}</h2>
      <div className={styles.score}>{players.map(player => {
        const record = data.roomData.players[player.id];
        return <article key={player.side} className={player.id === winnerID ? styles.winner : ''}>
          <Disc side={player.side} />
          <PlayerAvatar name={playerName(player.id, data.roomData.players)}
            avatar={record?.avatar} ai={record?.ai} size={45} />
          <div><strong>{playerLabel(player.id, data.roomData.players)}</strong>
            <small>{player.side === 'black' ? '黑方 · 先手' : '白方 · 后手'}</small></div>
          <b>{player.count}<small>子</small></b>
        </article>;
      })}</div>
    </>}
    summary={<>
      <div className={styles.ratio}><i style={{ width: `${blackCount / total * 100}%` }} /></div>
      <p className={styles.scoreNote}>黑方 {blackCount} · 白方 {whiteCount}</p>
      <small>终局实际子数 · 空格不补计分</small>
    </>}
    actions={readOnly
      ? <GameFinalResultActions mode="replay" onViewBoard={onViewBoard}
          viewBoardLabel="回到回放棋盘" />
      : <GameFinalResultActions mode="live" onViewBoard={onViewBoard}
          viewBoardLabel="回到棋盘" onLeave={onLeave ?? onViewBoard}
          canRestart={owner} onRestart={onRestart}
          restartPending={restarting} />}
  />;
}
