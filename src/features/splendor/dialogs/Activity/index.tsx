import { History } from 'lucide-react';
import { Dialog } from '../../components/Dialog';
import type { ActivityEntry } from '../../hooks/useSplendorPlayUI';
import styles from './index.module.less';

export function ActivityDialog({ entries, onClose }: { entries: ActivityEntry[]; onClose: () => void }) {
  return <Dialog title="商会动态" eyebrow="THE TRADE JOURNAL" onClose={onClose}>
    {entries.length ? <div className={styles.list}>{entries.map(entry => <div key={entry.key}>
      <span>{entry.turnNumber}</span><p>{entry.text}</p></div>)}</div>
      : <div className={styles.empty}><History size={30} /><h3>本次连接还没有新的动态</h3>
        <p>完成一次拿取、购买或预留后，记录会出现在这里。</p></div>}
  </Dialog>;
}
