import { CardColorType } from "../../UserData";
import styles from "../index.module.less";
import SmallCard from "../SmallCard";

export default function NobleCard({ noble, style }: { noble: SplendorNoble, style?: React.CSSProperties }) {
  return (
    <div className={styles["noble-card"]} style={style}>
      <div className={styles["noble-points"]}>{noble.points}</div>
      <div className={styles["noble-cost"]}>
        {Object.entries(noble.cost).map(([color, count]) => (
          <div key={color} className={styles["noble-item"]}>
            <SmallCard color={color as CardColorType} cost={count as number} />
          </div>
        ))}
      </div>
    </div>
  );
}
