import styles from './index.module.less';
import GemToken from '../GemToken';
import { cardColors } from '../../../utils/game';
import { SplendorNoble } from '@/types/SplendorRoom';

interface NobleCardProps {
  noble: SplendorNoble;
  size?: 'sm' | 'md';
}

/** 纯 CSS 贵族卡：金边卡面 + 分数 + 成本徽章 */
const NobleCard = ({ noble, size = 'md' }: NobleCardProps) => {
  return (
    <div className={`${styles.noble} ${styles[size]}`}>
      <div className={styles.points}>{noble.points}</div>
      <div className={styles.crest}>♛</div>
      <div className={styles.costList}>
        {cardColors.map((color) => {
          const cost = noble.cost?.[color] ?? 0;
          if (!cost) return null;
          return <GemToken key={color} count={cost} color={color} size="sm" />;
        })}
      </div>
    </div>
  );
};

export default NobleCard;
