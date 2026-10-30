import { ArrowRight, Eye, RotateCcw, ShieldCheck, Trophy } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import hero from '../../assets/hero.webp';
import { PlayerAvatar } from '../../components/AppShell';
import { BrandMark, Eyebrow } from '../../components/Artwork';
import type { SplendorSession } from '../../hooks/useSplendorSession';
import { playerLabel, playerName, type GameSnapshot } from '../../model/session';
import { winnerIDs } from '../../model/selectors';
import styles from './index.module.less';

export function Results({ session, data, onViewBoard, onRestart, restarting = false, readOnly = false }: {
  session?: SplendorSession;
  data: GameSnapshot;
  onViewBoard: () => void;
  onRestart?: () => Promise<boolean>;
  restarting?: boolean;
  readOnly?: boolean;
}) {
  const winners = winnerIDs(data);
  const won = winners.includes(data.playerId);
  const owner = data.ownerID === data.playerId;
  const players = Object.entries(data.roomData.players).sort((left, right) => {
    const a = data.result?.[left[0]];
    const b = data.result?.[right[0]];
    return (b?.score ?? 0) - (a?.score ?? 0) || (a?.cards ?? 0) - (b?.cards ?? 0);
  });
  const winnerNames = players.filter(([id]) => winners.includes(id))
    .map(([id]) => playerLabel(id, data.roomData.players)).join('、');
  const topScore = players[0] ? data.result?.[players[0][0]]?.score ?? data.playerData[players[0][0]]?.score ?? 0 : 0;

  return <div className={styles.results} data-testid="splendor-results">
    <header className={styles.topbar} data-game-result-topbar>
      <span className={styles.brand}><BrandMark size={25} /><span><b>SPLENDOR</b><small>璀 璨 宝 石 · 商 会</small></span></span>
      <span className={styles.spacer} /><em>{readOnly ? '只读回放 · 最终结算' : '对局结算'}</em></header>
    <main className={styles.page}><section className={styles.celebration}><img src={hero} alt="暮色中的文艺复兴宝石商港" />
      <i /><div><Eyebrow>THE ART OF PROSPERITY</Eyebrow><Trophy size={48} strokeWidth={1.2} />
        <h1>{won ? '荣耀，属于你的远见。' : '每一次选择，都有回响。'}</h1>
        <p>{winnerNames || '收藏家'} {winners.length > 1 ? '共同赢得' : '赢得'}本次商会</p>
        <strong>{topScore}<small>最终声望</small></strong></div></section>
      <section className={styles.summary}><header><div><Eyebrow>THE FINAL COLLECTION</Eyebrow><h2>这一局的璀璨</h2></div>
        <span>第 {Math.max(1, data.turnNumber)} 轮 · 已完成</span></header>
        <div className={styles.table} data-testid="splendor-results-table">
          <div className={`${styles.row} ${styles.tableHead}`} data-testid="splendor-results-header">
            <span>收藏家</span><span>发展卡</span><span>贵族</span><span>总声望</span></div>
          {players.map(([id, player], index) => {
            const result = data.result?.[id];
            return <div key={id} className={`${styles.row} ${id === data.playerId ? styles.mine : ''}`}>
              <div><b>{String(index + 1).padStart(2, '0')}</b>
                <PlayerAvatar name={playerName(id, data.roomData.players)} avatar={player.avatar} ai={player.ai} size={36} />
                <strong>{playerLabel(id, data.roomData.players)}{id === data.playerId && <small>你</small>}</strong></div>
              <span>{result?.cards ?? data.playerData[id]?.normalCard.length ?? 0}<small>张</small></span>
              <span>{result?.nobles ?? data.playerData[id]?.nobleCard.length ?? 0}<small>位</small></span>
              <b>{result?.score ?? data.playerData[id]?.score ?? 0}</b>
            </div>;
          })}</div>
        <p className={styles.note}><ShieldCheck size={15} />同分时发展卡更少者优先；仍相同则共享胜利。</p>
        <div className={styles.actions} data-testid="splendor-results-actions">
          <ActionButton onClick={onViewBoard}><Eye size={16} />查看终局牌面</ActionButton>
          {!readOnly && owner && session && onRestart && <ActionButton variant="primary"
            disabled={!!session.pending || restarting} onClick={() => { void onRestart(); }}>
            <RotateCcw size={16} />再来一局<ArrowRight size={17} /></ActionButton>}</div>
      </section></main>
  </div>;
}
