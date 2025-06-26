import React from 'react';
import styles from './index.module.less';
import SmallCard from '../Card/SmallCard';
import { CardColorType } from '../UserData';
import RoundCard from '../Card/RoundCard';
import NormalCard from '../Card/NormalCard';

interface PlayerDataProps {
  data?: SplendorWsRoomSyncData;
  userID: string;
}

const PlayerData: React.FC<PlayerDataProps> = ({ data, userID }) => {
  if (!data) return null;
   
  return (
    <div className={styles.playerDataContainer}>
      {Object.entries(data.playerData).map(([playerId, info]) => {
        const playerData = info as SplendorPlayerData; // 添加类型断言
        return (
          <div key={playerId} className={styles.playerCard}>
            <div className={styles.header}>
              玩家：{playerId}
              {playerId === userID && <span className={styles.selfTag}>（你）</span>}
            </div>

            <div className={styles.section}>
              <span className={styles.title}>卡牌：</span>
              {Object.entries(playerData.card ?? {}).filter(([color, _]) => color !== "Gold").map(([color, count]) => (
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
              <span className={styles.title}>预购卡牌：</span>
              {playerData.reserveCard && playerData.reserveCard.length > 0 ? (
                playerData.reserveCard.map((card: SplendorCard) => (
                  <NormalCard
                    key={card.id}
                    card={card}
                    style={{
                      position: 'absolute',
                      backgroundImage: `url('/splendorCard/card${card.bonus}1.jpg')`,
                      width: '100px',
                      height: '150px',
                      transform: 'scale(0.2)',
                    }}
                  />
                ))
              ) : (
                <span className={styles.empty}>暂无</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
};
export default PlayerData;
