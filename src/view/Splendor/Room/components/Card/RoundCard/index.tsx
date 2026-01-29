import { GemColorType, GemColor } from "../../UserData";
import styles from "./index.module.less";

export default function RoundCard({ cost, color, real = false }: { cost?: number, color: GemColorType, real?: boolean }) {
  return (
    <div className={styles["round-card"]} style={{
      color: real ? "white" : GemColor[color]?.color,
      backgroundImage: real ? `url(/splendorCard/real${color}.jpg)` : 'unset',
      backgroundColor: real ? 'unset' : GemColor[color]?.backgroundColor,
      WebkitTextStroke: real ? '2px rgba(0, 0, 0, 0.5)' : 'unset',
      textShadow: real ? '1px 1px 2px rgba(0, 0, 0, 0.7), -1px -1px 2px rgba(0, 0, 0, 0.4)' : 'unset',
    }}>
      {cost === undefined ? '' : cost}
    </div>
  );
}
