import styles from './index.module.less';
import { CardColorType, gemColors } from '../UserData';
import RoundCard from '../Card/RoundCard';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from 'antd';
const GemSelect = ({
  data,
  sendMessage,
  selectedCard,
}: {
  data?: SplendorWsRoomSyncData,
  sendMessage: (msg: string) => void,
  selectedCard?: SplendorCard,
  setSelectedCard: React.Dispatch<React.SetStateAction<SplendorCard | undefined>>
}) => {
  const [selectedGems, setSelectedGems] = useState<(CardColorType | null)[]>([null, null, null]);
  const [localGems, setLocalGems] = useState<Record<CardColorType, number>>({} as Record<CardColorType, number>);
  useEffect(() => {
    if (data?.roomData?.gems) {
      setLocalGems({ ...data.roomData.gems });
    }
  }, [data?.roomData?.gems]);
  const gemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const handleClickGem = (color: CardColorType) => {
    if (selectedGems.filter(Boolean).length >= 3) return;
    if (localGems[color] <= 0) return;

    const emptyIdx = selectedGems.findIndex((g) => g === null);
    if (emptyIdx === -1) return;

    const updated = [...selectedGems];
    updated[emptyIdx] = color;
    setSelectedGems(updated);

    setLocalGems((prev) => ({
      ...prev,
      [color]: prev[color] - 1,
    }));
  };
  const handleRemoveGem = (index: number) => {
    const color = selectedGems[index];
    if (!color) return;

    const updated = [...selectedGems];
    updated[index] = null;
    setSelectedGems(updated);

    setLocalGems((prev) => ({
      ...prev,
      [color]: prev[color] + 1,
    }));
  };

  function isTwoSameColorAndLowSupply(
    selectedGems: (CardColorType | null)[],
    availableGems: Record<CardColorType, number>
  ): boolean {
    const countMap = selectedGems.filter(Boolean).reduce((acc, color) => {
      acc[color!] = (acc[color!] || 0) + 1;
      return acc;
    }, {} as Record<CardColorType, number>);

    return Object.entries(countMap).some(([color, count]) => {
      return count === 2 && (availableGems[color as CardColorType] ?? 0) <= 3;
    });
  }

  const canGet = () => {
    const userID = data?.playerId;
    if (!userID || userID !== data?.roomData.currentPlayer) return false;
    if(selectedGems.filter(Boolean).length === 0) return false;
    const allGems = data?.roomData.gems;
    const playerGems = data?.playerData[userID].gem;
    const totalGems = Object.values(playerGems as Record<string, number> || {}).reduce((sum: number, count: number) => sum + count, 0);
    if (totalGems + selectedGems.filter(Boolean).length > 10) return false;
    const isTripleSame = Object.values(
      selectedGems.filter(Boolean).reduce((acc, color) => {
        acc[color!] = (acc[color!] || 0) + 1;
        return acc;
      }, {} as Record<CardColorType, number>)
    ).some(count => count === 3);
    if (isTripleSame) return false;
    if (isTwoSameColorAndLowSupply(selectedGems, allGems || {})) {
      return false;
    }
    return true;
  }

  const canPreserve = () => {
    const userID = data?.playerId;
    if (!userID || userID !== data?.roomData.currentPlayer) return false;
    if (!selectedCard) return false;
    if(selectedCard.state === 2) return false;
    const playerReserved = data?.playerData?.[userID]?.reserveCard?.length;
    if (playerReserved === 3) return false;
    if (data?.roomData.gems["Gold"] === 0) return false;
    return true;
  }

  const canBuy = () => {
    const userID = data?.playerId;
    if (!userID || userID !== data?.roomData.currentPlayer) return false;

    if (!selectedCard) return false;

    const required = selectedCard.cost; // card.Cost
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
    <div className={styles.gemSelector}>
      {/* 左边槽位 */}
      <div className={styles.left}>
        {selectedGems.map((color, idx) => (
          <div
            className={styles.gemSlot}
            key={idx}
            ref={(el) => (slotRefs.current[idx] = el)}
            onClick={() => handleRemoveGem(idx)}
          >
            {color && <RoundCard real color={color} cost={undefined} />}
          </div>
        ))}
      </div>

      {/* 右侧宝石池 */}
      <div className={styles.right}>
        {gemColors.map((color) => (
          <motion.div
            key={color}
            whileTap={{ scale: color === "Gold" ? 1 : 0.8 }}
            whileHover={{ scale: color === "Gold" || localGems[color as CardColorType] === 0 ? 1 : 1.1, boxShadow: color === "Gold" || localGems[color as CardColorType] === 0 ? "" : "0 0 12px 4px gold" }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className={styles.gemItem}
            ref={(el) => (gemRefs.current[color] = el)}
            onClick={() => {
              if(data?.playerId !== data?.roomData.currentPlayer) return;
              if (color === "Gold") return;
              handleClickGem(color as CardColorType)
            }}
            style={{
              cursor: color === "Gold" || localGems[color as CardColorType] === 0 ? "default" : "pointer",
            }}
          >
            {localGems[color as CardColorType] > 0 && (
              <>
                <div className={styles.gemBadge}>
                  {localGems[color as CardColorType]}
                </div>
                <RoundCard real color={color} cost={undefined} />
              </>
            )}
          </motion.div>
        ))}
      </div>

      <Button
        className={styles.button}
        type="primary"
        disabled={!canGet()}
        onClick={() => {
          const gemCount: Record<CardColorType, number> = selectedGems
            .filter(Boolean)
            .reduce((acc, color) => {
              const c = color as CardColorType;
              acc[c] = (acc[c] || 0) + 1;
              return acc;
            }, {} as Record<CardColorType, number>);
          sendMessage(JSON.stringify({
            type: "get_gem",
            payload: gemCount
          }));
          setSelectedGems([null, null, null]);
        }}>
        拿取
      </Button>
      <Button
        className={styles.button}
        type="primary"
        disabled={!canBuy()}
        onClick={() => {
          sendMessage(JSON.stringify({
            type: "buy_card",
            payload: selectedCard?.id
          }));
          setSelectedGems([null, null, null]);
        }}>
        购买
      </Button>
      <Button
        className={styles.button}
        type="primary"
        disabled={!canPreserve()}
        onClick={() => {
          sendMessage(JSON.stringify({
            type: "preserve_card",
            payload: selectedCard?.id
          }));
        }}>
        预购
      </Button>
    </div>
  );
}

export default GemSelect;
