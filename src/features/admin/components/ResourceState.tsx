import { AlertTriangle, RefreshCw } from 'lucide-react';
import styles from '../index.module.less';

export function LoadingState() {
  return (
    <div className={styles.loadingState} aria-label="正在加载数据" aria-busy="true">
      <span />
      <span />
      <span />
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className={styles.errorState}>
      <AlertTriangle size={22} />
      <span>{message || '数据暂时无法载入'}</span>
      <button type="button" onClick={retry}>
        <RefreshCw size={16} />
        重试
      </button>
    </div>
  );
}
