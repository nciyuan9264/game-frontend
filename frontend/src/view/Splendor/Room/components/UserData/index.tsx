import styles from "./index.module.less";
import Card from "../Card/NormalCard";
import { Empty } from "antd";
import { canBuy } from "../CardBoard";


export type CardColorType = "Black" | "Blue" | "Green" | "Red" | "White";
export type GemColorType = "Black" | "Blue" | "Green" | "Red" | "White" | "Gold";


// 2. 颜色常量：使用 as const 保留字面量类型
export const GemColor: Record<GemColorType, { color: string, backgroundColor: string, innerColor: string }> = {
  Black: {
    color: "#fff",
    backgroundColor: "#000",
    innerColor: "#fff3d6"
  },
  Blue: {
    color: "#fff",
    backgroundColor: "#00f",
    innerColor: "#d8f4ff"
  },
  Green: {
    color: "#fff",
    backgroundColor: "#068212",
    innerColor: "#d5fee8"
  },
  Red: {
    color: "#fff",
    backgroundColor: "#d40808",
    innerColor: "#ffdada"

  },
  White: {
    color: "#000",
    backgroundColor: "#fff",
    innerColor: "#fff"

  },
  Gold: {
    color: "#fff",
    backgroundColor: "#fc0",
    innerColor: "#fff"
  },
};

// 3. gem 用到的颜色数组（不包含 gold）
export const gemColors: GemColorType[] = ["Black", "Blue", "Green", "Red", "White", "Gold"];
export const cardColors: CardColorType[] = ["Black", "Blue", "Green", "Red", "White"];

const UserData = ({ data, userID, selectedCard, setSelectedCard }: { data?: SplendorWsRoomSyncData, userID: string, selectedCard?: SplendorCard, setSelectedCard: React.Dispatch<React.SetStateAction<SplendorCard | undefined>> }) => {
  const { normalCard, gem, score, reserveCard } = data?.playerData[userID] ?? {};
  const cardCount: Record<CardColorType, number> = {
    Black: 0,
    Blue: 0,
    Green: 0,
    Red: 0,
    White: 0,
  };
  normalCard?.forEach((item: SplendorCard) =>{
    if (!cardCount[item.bonus as CardColorType]) {
      cardCount[item.bonus as CardColorType] = 1;
    }else{
      cardCount[item.bonus as CardColorType] += 1;
    }
  })

  return (
    <div className={styles.userDataContainer}>
      <div className={styles.score}>{score}</div>
      <div className={styles.cardGemSection}>
        <div className={styles.cardRow}>
          {cardColors.map((color) => (
            <div key={color} className={styles.cardSlot}>
              <div className={styles.cardColor} style={{
                backgroundColor: GemColor[color].backgroundColor,
                opacity: Number(cardCount?.[color] ?? 0) === 0 ? 0.3 : 1, // ✅ 设置透明度
              }}>
                <div className={styles.cardText}
                  style={{
                    color: GemColor[color].color,
                  }}
                >
                  {`${cardCount?.[color]}`}
                </div>
              </div>
              <div
                className={styles.gem}
                style={{
                  backgroundColor: color,
                  color: GemColor[color].color,
                  opacity: Number(gem?.[color] ?? 0) === 0 ? 0.1 : 1, // ✅ 设置透明度

                }}
              >
                {gem?.[color]}
              </div>
            </div>
          ))}
          {/* gold gem 超出显示 */}
          <div className={styles.cardSlot}>
            <div className={styles.cardColorPlaceholder}></div>
            <div
              className={styles.gem}
              style={{ backgroundColor: "gold", color: "#000" }}
            >
              {gem?.["Gold"]}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：预留卡牌 */}
      <div className={styles.reserveSection}>
        {Array(3).fill(1)?.map((_, index) => {
          const card = reserveCard?.[index] ?? {};
          return card.id ? (
            <div
              key={card.id}
              className={`${styles.card} ${selectedCard?.id === card.id ? styles.selected : ''} ${canBuy(data, card) ? styles.canBuy : ''} }`}
              onClick={() => {
                setSelectedCard(card);
              }}
            >
              <Card
                card={card}
                style={{
                  backgroundImage: `url('/splendorCard/card${card.bonus}1.jpg')`,
                  cursor: 'pointer',
                }} />
            </div>
          ) : (
            <div key={card.id} className={styles.cardEmpty}>
              <Empty description='' />
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default UserData;
