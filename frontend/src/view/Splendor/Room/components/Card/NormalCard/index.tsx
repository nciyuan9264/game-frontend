import { CardColorType } from "../../UserData";
import styles from "../index.module.less";
import RoundCard from "../RoundCard";

export default function Card({ card, style }: { card: SplendorCard, style?: React.CSSProperties }) {
  return (
    <div className={styles.card}
      style={{
        ...style,
      }}>
      <div className={styles["card-mask"]} />
      {card.points !== 0 && <div className={styles["card-point"]}>{`${card.points}`}</div>}
      <div className={styles["card-color"]} style={{
        backgroundImage: `url(/gem/${card.bonus}.png)`,
      }} />
      <div className={styles["card-cost"]}>
        {Object.entries(card.cost ?? {}).map(([color, count]) => (
          <div key={color} className={styles["cost-item"]}>
            <RoundCard cost={count as number} color={color as CardColorType} />
          </div>
        ))}
      </div>
    </div>
  );
}
