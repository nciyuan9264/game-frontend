import styles from './index.module.less';
import { CardColorType, gemColors } from '../UserData';
import RoundCard from '../Card/RoundCard';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from 'antd';
import { SplendorGameStatus } from '@/enum/game';

export const canPreserve = (data?: SplendorWsRoomSyncData, selectedCard?: SplendorCard) => {
  const userID = data?.playerId;
  if (!userID || userID !== data?.roomData.currentPlayer) return false;
  if (data.roomData.roomInfo.roomStatus !== SplendorGameStatus.PLAYING) {
    return false;
  }
  if (!selectedCard) return false;
  if (selectedCard.state === 2) return false;

  let totalGem = 0;
  Object.values(data?.playerData[userID].gem || {}).forEach((val) => {
    const value = val as number;
    totalGem += value;
  });

  if (totalGem >= 10) return false;
  const playerReserved = data?.playerData?.[userID]?.reserveCard?.length;
  if (playerReserved === 3) return false;
  if (data?.roomData.gems["Gold"] === 0) return false;
  return true;
}
const GemSelect = ({
  data,
  sendMessage,
  userID
}: {
  data?: SplendorWsRoomSyncData,
  sendMessage: (msg: string) => void,
  userID: string
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

    if (data.roomData.roomInfo.roomStatus !== SplendorGameStatus.PLAYING) {
      return false;
    }

    // 过滤掉 null 或 undefined 的选择
    const filteredGems = selectedGems.filter(Boolean);
    if (filteredGems.length === 0) return false;

    const allGems = data?.roomData.gems;
    const playerGems = data?.playerData[userID].gem;
    const totalGems = Object.values(playerGems as Record<string, number> || {}).reduce(
      (sum: number, count: number) => sum + count,
      0
    );

    if (totalGems + filteredGems.length > 10) return false;

    // 检查是否三颗同色（非法）
    const colorCountMap = filteredGems.reduce((acc, color) => {
      acc[color!] = (acc[color!] || 0) + 1;
      return acc;
    }, {} as Record<CardColorType, number>);

    // ✅ 新增限制：如果拿了3颗，不允许有任何颜色相同
    if (filteredGems.length === 3 && Object.keys(colorCountMap).length !== 3) {
      return false;
    }

    if (isTwoSameColorAndLowSupply(selectedGems, allGems || {})) {
      return false;
    }

    return true;
  };

  return (
    <div className={styles.gemSelector}>
      <div className={styles.left}>
        {selectedGems.map((color, idx) => (
          <div
            className={styles.gemSlot}
            key={idx}
            ref={(el) => (slotRefs.current[idx] = el)}
            onClick={() => handleRemoveGem(idx)}
          >
            {color && <RoundCard color={color} cost={undefined} />}
          </div>
        ))}
      </div>

      {/* 右侧宝石池 */}
      <div className={styles.right}>
        {gemColors.map((color) => (
          <motion.div
            key={color}
            whileTap={userID === data?.roomData.currentPlayer ? { scale: color === "Gold" ? 1 : 0.8 } : {}}
            whileHover={userID === data?.roomData.currentPlayer ? { scale: color === "Gold" || localGems[color as CardColorType] === 0 ? 1 : 1.1, boxShadow: color === "Gold" || localGems[color as CardColorType] === 0 ? "" : "0 0 12px 4px gold" } : {}}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className={styles.gemItem}
            ref={(el) => (gemRefs.current[color] = el)}
            onClick={() => {
              if (userID !== data?.roomData.currentPlayer) return;
              if (color === "Gold") return;
              handleClickGem(color as CardColorType)
            }}
            style={
              userID === data?.roomData.currentPlayer ? {
                cursor: color === "Gold" || localGems[color as CardColorType] === 0 ? "default" : "pointer",
              } : {
              }}
          >
            {localGems[color as CardColorType] > 0 && (
              <>
                {/* <div className={styles.gemBadge}>
                  {localGems[color as CardColorType]}
                </div> */}
                <RoundCard color={color} cost={localGems[color as CardColorType]} />
              </>
            )}
          </motion.div>
        ))}
      </div>

      <Button
        className={styles.cancelButton}
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
        }}
      >
        拿取
      </Button>

      <Button
        className={styles.cancelButton}
        type="primary"
        onClick={() => {
          setSelectedGems([null, null, null]);
        }}>
        取消
      </Button>

      <Button
        className={styles.cancelButton}
        type="primary"
        onClick={() => {
          sendMessage(JSON.stringify({
            type: "get_gem",
            payload: {}
          }));
        }}>
        跳过
      </Button>
    </div>
  );
}

export default GemSelect;
