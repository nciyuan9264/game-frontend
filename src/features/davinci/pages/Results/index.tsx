import { Trophy } from 'lucide-react';
import {
  GameFinalResult,
  GameFinalResultActions,
} from '@/components/GameUI/GameFinalResult';
import { PlayerAvatar } from '../../components/AppShell';
import type { DavinciSession } from '../../hooks/useDavinciSession';
import { playerLabel, playerName, type GameSnapshot } from '../../model/session';
import { winner } from '../../model/selectors';
import styles from './index.module.less';

export function Results({
  session,
  data,
  onViewBoard,
  onLeave,
  onRestart,
  restarting = false,
}: {
  session: DavinciSession;
  data: GameSnapshot;
  onViewBoard: () => void;
  onLeave: () => void;
  onRestart?: () => Promise<boolean>;
  restarting?: boolean;
}) {
  const winnerID = winner(data);
  const won = winnerID === data.playerId;
  const owner = data.ownerID === data.playerId;
  const players = Object.entries(data.roomData.players);
  const duration = data.turnNumber || 1;

  return <GameFinalResult
    className={styles.results}
    mobileInset="self"
    heroClassName={styles.hero}
    standingsClassName={styles.duel}
    summaryClassName={styles.facts}
    actionsClassName={styles.actions}
    hero={<><span className={`${styles.emblem} ${won ? styles.win : styles.loss}`}><Trophy size={29} /></span>
    <small>CIPHER RESOLVED · {data.roomID}</small>
    <h1>{won ? '你破解了这组密码。' : '对手先一步揭开了答案。'}</h1>
    <p>{won ? '你的序列仍有暗牌保留，判断与收手都恰到好处。' : '所有牌已经公开，可以回看终局牌面并准备下一场。'}</p>
    </>}
    standings={players.map(([id, player]) => <article key={id} className={id === winnerID ? styles.champion : ''}>
      <PlayerAvatar name={playerName(id, data.roomData.players)} avatar={player.avatar} ai={player.ai} size={58} />
      <div><small>{id === winnerID ? 'WINNER' : 'CHALLENGER'}</small><h2>{playerLabel(id, data.roomData.players)}</h2>
        <span>{id === data.playerId ? '你' : player.ai ? 'AI 对手' : '对手'}</span></div>
      {id === winnerID && <Trophy size={18} />}
    </article>)}
    summary={<><span><b>{duration}</b><small>回合</small></span><span><b>{26 - Object.keys(data.roomData.boardCards).length}</b><small>已抽牌</small></span><span><b>{players.length}</b><small>玩家</small></span></>}
    actions={<GameFinalResultActions mode="live"
      onViewBoard={onViewBoard} viewBoardLabel="查看终局牌面"
      onLeave={onLeave} canRestart={owner} onRestart={onRestart}
      restartPending={restarting} restartDisabled={!!session.pending} />}
  />;
}
