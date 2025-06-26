import styles from "./index.module.less";
import Card from "../Card/NormalCard";
import { Empty } from "antd";


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
  const { card, gem, score, reserveCard } = data?.playerData[userID] ?? {};
  const canBuy = (card: SplendorCard) => {
    const userID = data?.playerId;
    if (!userID || userID !== data?.roomData.currentPlayer) return false;

    const required = card.cost; // card.Cost
    const playerGems = {...data?.playerData[userID].gem};
    const playerCard = data?.playerData[userID].card;
    for (const color in playerCard) {
      playerGems[color as CardColorType] = (playerGems[color as CardColorType] || 0) + (playerCard[color as CardColorType] || 0);
    }
    const paidGems: Record<string, number> = {};       // 实际支付的宝石数
    let remainingGold = playerGems?.["Gold"];

    let canBuy = true;
    for (const color in required) {
      const cost = required[color];
      const owned = playerGems[color] || 0;

      if (owned >= cost) {
        paidGems[color] = cost;
      } else {
        const needGold = cost - owned;
        if (remainingGold >= needGold) {
          paidGems[color] = owned;
          paidGems["Gold"] = (paidGems["Gold"] || 0) + needGold;
          remainingGold -= needGold;
        } else {
          canBuy = false;
          break;
        }
      }
    }
    return canBuy;
  }

  return (
    <div className={styles.userDataContainer}>
      <div className={styles.score}>{score}</div>
      <div className={styles.cardGemSection}>
        <div className={styles.cardRow}>
          {cardColors.map((color) => (
            <div key={color} className={styles.cardSlot}>
              <div className={styles.cardColor} style={{
                backgroundColor: GemColor[color].backgroundColor,
                opacity: Number(card?.[color] ?? 0) === 0 ? 0.3 : 1, // ✅ 设置透明度
              }}>
                <div className={styles.cardText}
                  style={{
                    color: GemColor[color].color,
                  }}
                >
                  {`${card?.[color]}`}
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
              className={`${styles.card} ${selectedCard?.id === card.id ? styles.selected : ''} ${canBuy(card) ? styles.canBuy : ''} }`}
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
