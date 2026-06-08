import { ClockCircleOutlined } from '@ant-design/icons';
import { FC, useEffect, useMemo, useState } from 'react';
import styles from './index.module.less';

interface TurnCountdownProps {
  /** 当前阶段结束时间（ISO 字符串），缺失时不渲染 */
  deadline?: string;
  className?: string;
  /** 去掉 chip 外壳样式，便于嵌入其它容器 */
  bare?: boolean;
  /** 仅显示秒数（不显示 mm:ss） */
  secondsOnly?: boolean;
}

const TurnCountdown: FC<TurnCountdownProps> = ({ deadline, className, bare, secondsOnly }) => {
  const deadlineTs = useMemo(() => {
    if (!deadline) return 0;
    const t = new Date(deadline).getTime();
    return Number.isFinite(t) ? t : 0;
  }, [deadline]);

  const [remain, setRemain] = useState<number>(() =>
    deadlineTs ? Math.max(0, deadlineTs - Date.now()) : 0,
  );

  useEffect(() => {
    if (!deadlineTs) {
      setRemain(0);
      return;
    }
    setRemain(Math.max(0, deadlineTs - Date.now()));
    const id = setInterval(() => {
      const r = Math.max(0, deadlineTs - Date.now());
      setRemain(r);
      if (r <= 0) {
        clearInterval(id);
      }
    }, 250);
    return () => clearInterval(id);
  }, [deadlineTs]);

  if (!deadline || !deadlineTs) return null;

  const sec = Math.ceil(remain / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  const isUrgent = sec <= 10;

  return (
    <div
      className={[
        styles.countdown,
        bare ? styles.bare : '',
        isUrgent ? styles.urgent : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {!bare && <ClockCircleOutlined className={styles.icon} />}
      <span className={styles.time}>
        {secondsOnly ? `${sec}s` : `${mm}:${ss}`}
      </span>
    </div>
  );
};

export default TurnCountdown;
