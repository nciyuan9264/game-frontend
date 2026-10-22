import { ArrowLeft, CircleAlert } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import styles from './index.module.less';

export function SessionExitState({ title, message, onLeave }: { title: string; message: string; onLeave: () => void }) {
  return <div className={styles.exitLayout}>
    <section className={styles.exitState} role="alert" aria-labelledby="acquire-session-exit-title">
      <span className={styles.exitIcon} aria-hidden="true"><CircleAlert size={24} /></span>
      <span className={styles.exitEyebrow}>SESSION CLOSED</span>
      <h1 id="acquire-session-exit-title">{title}</h1>
      <p>{message}</p>
      <div className={styles.exitAction}>
        <ActionButton className={styles.exitButton} variant="primary" onClick={onLeave}>
          <ArrowLeft size={16} />返回大厅
        </ActionButton>
      </div>
    </section>
  </div>;
}
