import { ArrowRight, ShieldCheck, TrendingUp, Trophy, Wallet } from 'lucide-react';
import { ActionButton } from '../../components/ActionButton';
import { PlayerAvatar } from '../../components/AppShell';
import { CompanyGlyph } from '../../components/CompanyGlyph';
import { money, playerName, type DisplaySnapshot } from '../../model/session';
import { companyColors, companyKeys } from '../../model/types';
import cityArt from '../../assets/city-art.webp';
import styles from './index.module.less';

export function Results({ data, onClose, onRestart, onLeave, enabled }: {
  data: DisplaySnapshot & { roomID?: string }; onClose: () => void; onRestart?: () => void; onLeave?: () => void; enabled: boolean;
}) {
  const rows = Object.entries(data.result ?? {}).sort(([, a], [, b]) => b.total - a.total);
  const selfIndex = rows.findIndex(([id]) => id === data.playerId);
  const self = data.result?.[data.playerId];
  const stockValue = companyKeys.reduce((total, key) =>
    total + (data.playerData.stocks[key] ?? 0) * data.roomData.companyInfo[key].stockPrice, 0);
  const playerAvatar = (id: string) => {
    const player = data.roomData.players[id];
    return player && 'avatar' in player && typeof player.avatar === 'string' ? player.avatar : undefined;
  };
  return <div className={styles.page}>
    <section className={styles.hero}><img src={cityArt} alt="终局后的城市模型" /><div className={styles.heroCopy}>
      <span className={styles.laurel}><Trophy size={34} /></span><small>A CITY WELL PLAYED</small><h1>一城落定，好局未完。</h1>
      <p>经典对局 · 房间 {data.roomID ?? '—'}</p><span>你获得了本局 <b>第 {selfIndex >= 0 ? selfIndex + 1 : '—'} 名</b></span>
    </div></section>
    <div className={styles.layout}><section className={styles.ranking}><header><small>FINAL STANDINGS</small><h2>这一局的城市合伙人</h2></header>
      {rows.map(([id, score], index) => <article key={id} className={`${index === 0 ? styles.winner : ''} ${id === data.playerId ? styles.self : ''}`}>
        <span className={styles.rank}>{String(index + 1).padStart(2, '0')}</span>
        <PlayerAvatar name={playerName(id, data.roomData.players)} avatar={playerAvatar(id)} ai={data.roomData.players[id]?.ai} size={56} />
        <div><strong>{playerName(id, data.roomData.players)}{id === data.playerId && <em>你</em>}</strong><small>{index === 0 ? <><Trophy size={13} />本局领先者</> : '下一座城，再见。'}</small></div>
        <span><small>总资产</small><strong>{money(score.total)}</strong></span>
      </article>)}
      <div className={styles.resultNote}><ShieldCheck size={17} /><span>终局结果已锁定，你仍可以查看棋盘与资产明细。</span></div>
    </section><section className={styles.assets}><small>YOUR FINAL PORTFOLIO</small><h2>你的资产，从哪里来？</h2>
      <div><span><Wallet size={18} />现金余额</span><b>{money(self?.money ?? data.playerData.money)}</b></div>
      <div><span><TrendingUp size={18} />股票变现</span><b>{money(self?.stocks ?? stockValue)}</b></div>
      {companyKeys.filter(key => data.playerData.stocks[key] > 0).map(key => <div className={styles.stock} key={key}>
        <span style={{ color: companyColors[key] }}><CompanyGlyph company={key} size={16} />{key}</span><b>{data.playerData.stocks[key]} 股</b>
      </div>)}
      <footer><span>总资产</span><strong>{money(self?.total ?? data.playerData.money + stockValue)}</strong></footer>
    </section></div>
    <div className={styles.actions}><ActionButton onClick={onClose}>查看终局棋盘</ActionButton>{onLeave && <ActionButton onClick={onLeave}>回到大厅</ActionButton>}
      {onRestart && <ActionButton variant="primary" disabled={!enabled} onClick={onRestart}>再来一局<ArrowRight size={17} /></ActionButton>}</div>
    <p className={styles.disclaimer}>结算结果来自本局服务端快照</p>
  </div>;
}
