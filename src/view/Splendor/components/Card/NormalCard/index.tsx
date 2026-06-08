import { CardColorType } from '../../UserData';
import styles from '../index.module.less';
import SmallCard from '../SmallCard';

export default function NormalCard({
  card,
  style,
}: {
  card: SplendorCard;
  style?: React.CSSProperties;
}) {
  return (
    <div className={styles.card} style={style}>
      <div className={styles['card-mask']} />
      <div className={styles['card-point']}>
        {card.points ? card.points : ''}
      </div>
      <div
        className={styles['card-color']}
        style={{
          backgroundImage: `url('/splendorCard/real${card.bonus}.jpg')`,
        }}
      />
      <div className={styles['card-cost']}>
        {Object.entries(card.cost ?? {}).map(([color, count]) =>
          (count as number) > 0 ? (
            <div key={color} className={styles['cost-item']}>
              <SmallCard
                color={color as CardColorType}
                cost={count as number}
              />
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
