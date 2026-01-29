import { GemColor, CardColorType } from "../../UserData";
import styles from "./index.module.less";

export default function SmallCard({ cost, color }: { cost: number, color: CardColorType }) {
  return (
    <div className={styles["small-card"]} style={{
      color: GemColor[color]?.color,
      backgroundColor: GemColor[color]?.backgroundColor,
    }}>
      {cost}
    </div>
  );
}
