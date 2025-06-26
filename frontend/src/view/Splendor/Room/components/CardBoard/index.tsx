import NobleCard from "../Card/NobleCard";
import NormalCard from "../Card/NormalCard";
import { CardColorType } from "../UserData";
import styles from "./index.module.less";

export default function CardBoard({ data, selectedCard, setSelectedCard }: { data?: SplendorWsRoomSyncData, sendMessage: (msg: string) => void, selectedCard?: SplendorCard, setSelectedCard: React.Dispatch<React.SetStateAction<SplendorCard | undefined>> }) {
  const nobleCards = [...(data?.roomData.nobles || [])].sort((a, b) => a.id > b.id ? 1 : -1); // ✅ 排序
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
    <>
      <div className={styles["game-board"]}>
        <div className={styles["noble-row"]}>
          {nobleCards.map((noble: SplendorNoble, index) => (
            <div key={noble.id} className={styles["noble-card"]}>
              <NobleCard noble={noble} style={{
                backgroundImage: `url('/noble/noble${index + 1}.jpg')`,
              }} />
            </div>
          ))}
        </div>

        {/* 卡牌展示：三行，每行四列 */}
        <div className={styles["card-rows"]}>
          {[3, 2, 1].map((level) => {
            const cards = [...(data?.roomData.card[level] || [])].sort((a, b) => a.id - b.id); // ✅ 排序

            return (
              <div key={level} className={styles["card-row"]}>
                {cards?.map((card: SplendorCard) => (
                  <div
                    key={card.id}
                    className={`${styles["card-item"]} ${selectedCard?.id === card.id ? styles.selected : ''} ${canBuy(card) ? styles.canBuy : ''}`}
                    onClick={() => {
                      setSelectedCard(card);
                    }}
                  >
                    <NormalCard
                      card={card}
                      style={{
                        backgroundImage: `url('/splendorCard/card${card.bonus}1.jpg')`,
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </>
  );
}

{/* <div className={styles["card-overlay"]}>
                      <div
                        className={styles["card-action-top"]}
                        onClick={() => {
                          sendMessage(JSON.stringify({
                            type: 'buy_card',
                            payload: card.id,
                          }));
                        }}
                      >
                        🛒 购买
                      </div>
                      <div
                        className={styles["card-action-bottom"]}
                        onClick={() => {
                          sendMessage(JSON.stringify({
                            type: 'preserve_card',
                            payload: card.id,
                          }));
                        }}
                      >
                        📌 预定
                      </div>
                    </div> */}
