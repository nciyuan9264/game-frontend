import React from 'react';
import styles from './index.module.less';
import SmallCard from '../Card/SmallCard';
import { CardColorType } from '../UserData';
import RoundCard from '../Card/RoundCard';
import { backendName2FrontendName } from '@/util/user';
;

interface PlayerDataProps {
  data?: SplendorWsRoomSyncData;
  userID: string;
}

const PlayerData: React.FC<PlayerDataProps> = ({ data, userID }) => {
  if (!data) return null;

  return (
    <div className={styles.playerDataContainer}>
      {Object.entries(data.playerData).map(([playerId, info]) => {
        if (playerId === userID) return null; // 跳过当前玩家的信息
        const playerData = info as SplendorPlayerData; // 添加类型断言
        const cardCount: Record<CardColorType, number> = {
          Black: 0,
          Blue: 0,
          Green: 0,
          Red: 0,
          White: 0,
        };
        playerData.normalCard.forEach((item) =>{
          if (!cardCount[item.bonus as CardColorType]) {
            cardCount[item.bonus as CardColorType] = 1;
          }else{
            cardCount[item.bonus as CardColorType] += 1;
          }
        })
        return (
          <div key={playerId} className={styles.playerCard}>
            <div className={styles.header}>
              {backendName2FrontendName(playerId)}
            </div>

            <div className={styles.section}>
              <span className={styles.title}>卡牌：</span>
              {Object.entries(cardCount ?? {}).filter(([color, _]) => color !== "Gold").map(([color, count]) => (
                <div key={color} className={styles["noble-item"]}>
                  <SmallCard key={color} cost={count as number} color={color as CardColorType} />
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <span className={styles.title}>宝石：</span>
              {Object.entries(playerData.gem ?? {}).sort(([colorA], [colorB]) => {
                if (colorA === "Gold") return 1;
                if (colorB === "Gold") return -1;
                return 0;
              }).map(([color, count]) => (
                <div key={color} className={styles["cost-item"]}>
                  <RoundCard key={color} cost={count as number} color={color as CardColorType} />
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <span className={styles.title}>分数：</span>
              <span>{playerData.score}</span>
            </div>

            <div className={styles.section}>
              <span className={styles.title}>预购：</span>
              {`${playerData.reserveCard.length ?? 0}`}
            </div>
          </div>
        )
      })}
    </div>
  );
};
export default PlayerData;
