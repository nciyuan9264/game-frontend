import { SplendorGameStatus } from "@/enum/game";
import NobleCard from "../Card/NobleCard";
import NormalCard from "../Card/NormalCard";
import { CardColorType } from "../UserData";
import styles from "./index.module.less";
import { Button } from "antd";
import { canPreserve } from "../GemSelect";

export const canBuy = (data?: SplendorWsRoomSyncData, card?: SplendorCard) => {
  if (!data || !card) return false;
  const userID = data?.playerId;
  if (!userID || userID !== data?.roomData.currentPlayer) return false;

  if (data.roomData.roomInfo.roomStatus !== SplendorGameStatus.PLAYING && data.roomData.roomInfo.roomStatus !== SplendorGameStatus.LAST_TURN) {
    return false;
  }
  const required = card?.cost; // card.Cost
  const playerGems = { ...data?.playerData[userID].gem };
  const playerCard = data?.playerData[userID].normalCard;
  const cardCount: Record<CardColorType, number> = {
    Black: 0,
    Blue: 0,
    Green: 0,
    Red: 0,
    White: 0,
  };
  playerCard.forEach((item: SplendorCard) => {
    if (!cardCount[item.bonus as CardColorType]) {
      cardCount[item.bonus as CardColorType] = 1;
    } else {
      cardCount[item.bonus as CardColorType] += 1;
    }
  })
  for (const color in cardCount) {
    playerGems[color as CardColorType] = (playerGems[color as CardColorType] || 0) + (cardCount[color as CardColorType] || 0);
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
export default function CardBoard({ data, selectedCard, setSelectedCard, sendMessage }: { data?: SplendorWsRoomSyncData, sendMessage: (msg: string) => void, selectedCard?: SplendorCard, setSelectedCard: React.Dispatch<React.SetStateAction<SplendorCard | undefined>> }) {
  const nobleCards = [...(data?.roomData.nobles || [])].sort((a, b) => a.id > b.id ? 1 : -1); // ✅ 排序

  return (
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
                  className={`${styles["card-item"]} ${selectedCard?.id === card.id ? styles.selected : ''} ${canBuy(data, card) ? styles.canBuy : ''}`}
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
      <div className={styles["button-column"]}>
        <Button
          className={styles.button}
          type="primary"
          disabled={!canBuy(data, selectedCard)}
          onClick={() => {
            sendMessage?.(JSON.stringify({
              type: "buy_card",
              payload: selectedCard?.id
            }));
            // Modal.confirm({
            //   title: "确认购买？",
            //   okText: "确认",
            //   cancelText: "取消",
            //   onOk: () => {

            //   }
            // });
          }}>
          购买
        </Button>
        <Button
          className={styles.button}
          type="primary"
          disabled={!canPreserve(data, selectedCard)}
          onClick={() => {
            sendMessage(JSON.stringify({
              type: "preserve_card",
              payload: selectedCard?.id
            }));
            // Modal.confirm({
            //   title: "确认预购？",
            //   okText: "确认",
            //   cancelText: "取消",
            //   onOk: () => {

            //   }
            // });
          }}>
          预购
        </Button>
      </div>
    </div>
  );
}