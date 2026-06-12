import styles from './index.module.less';
import { GemColor } from '../../../utils/game';
import { GemColorType } from '@/types/SplendorRoom';

export type GemTokenSize = 'sm' | 'md' | 'lg';

interface GemTokenProps {
  color: GemColorType;
  /** 显示的数字（库存/数量）；undefined 时不显示数字 */
  count?: number;
  size?: GemTokenSize;
  className?: string;
}

/** 纯 CSS 圆形宝石 token：径向渐变 + 高光 */
const GemToken = ({ color, count, size = 'md', className }: GemTokenProps) => {
  const visual = GemColor[color];
  return (
    <div
      className={`${styles.gemToken} ${styles[size]} ${className || ''}`}
      style={{
        background: `radial-gradient(circle at 32% 28%, ${visual.light}, ${visual.main} 52%, ${visual.dark})`,
        color: visual.text,
        boxShadow: `inset 0 0 6px rgba(255,255,255,0.45), 0 2px 6px rgba(0,0,0,0.45)`,
      }}
    >
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </div>
  );
};

export default GemToken;
