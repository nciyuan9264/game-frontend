import styles from './index.module.less';
import GemToken from '../GemToken';
import { GemColor, cardColors } from '../../../utils/game';
import { SplendorNormalCard } from '@/types/SplendorRoom';

interface NormalCardProps {
  card: SplendorNormalCard;
  size?: 'sm' | 'md';
}

/** 纯 CSS 发展卡：渐变卡面（按 bonus 取色）+ 右上分数 + 底部成本徽章 */
const NormalCard = ({ card, size = 'md' }: NormalCardProps) => {
  const visual = GemColor[card.bonus];
  return (
    <div
      className={`${styles.card} ${styles[size]}`}
      style={{
        background: `linear-gradient(150deg, ${visual.dark} 0%, ${visual.main} 60%, ${visual.light} 130%)`,
      }}
    >
      <div className={styles.topRow}>
        {card.points > 0 && <span className={styles.points}>{card.points}</span>}
      </div>
      <div className={styles.costList}>
        {cardColors.map((color) => {
          const cost = card.cost?.[color] ?? 0;
          if (!cost) return null;
          return (
            <GemToken
              key={color}
              count={cost}
              color={color}
              size={size === 'sm' ? 'sm' : 'md'}
              className={styles.costGem}
            />
          );
        })}
      </div>
    </div>
  );
};

export default NormalCard;
