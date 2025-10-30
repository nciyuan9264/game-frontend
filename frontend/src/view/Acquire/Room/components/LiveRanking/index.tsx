import React, { useState, useEffect, useMemo } from 'react';
import { WsRoomSyncData } from '@/types/room';
import { getLocalStorageUserName } from '@/util/user';
import styles from './index.module.less';
import { AnimatePresence, motion } from 'framer-motion';
import { Typography } from 'antd';

const { Text } = Typography;

interface LiveRankingProps {
  data?: WsRoomSyncData;
  mockMode?: boolean; // 添加mock模式
}

// Mock数据
const mockPlayers = [
  { playerId: 'player1', name: '张三', score: 1250 },
  { playerId: 'player2', name: '李四', score: 1180 },
  { playerId: 'player3', name: '王五', score: 1050 },
  { playerId: 'player4', name: '赵六', score: 980 },
];

const LiveRanking: React.FC<LiveRankingProps> = ({ data, mockMode = false }) => {
  const [mockData, setMockData] = useState(mockPlayers);
  const [animationInterval, setAnimationInterval] = useState<NodeJS.Timeout | null>(null);

  // Mock数据动画逻辑
  useEffect(() => {
    if (mockMode) {
      const interval = setInterval(() => {
        setMockData(prev => {
          const newData = [...prev];
          // 随机改变某个玩家的分数
          const randomIndex = Math.floor(Math.random() * newData.length);
          const scoreChange = Math.floor(Math.random() * 200) - 100; // -100 到 +100
          newData[randomIndex].score = Math.max(0, newData[randomIndex].score + scoreChange);

          // 重新排序
          return newData.sort((a, b) => b.score - a.score);
        });
      }, 3000); // 每3秒变化一次

      setAnimationInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [mockMode]);

  // 计算当前排名
  const currentRankings = useMemo(() => {
    if (mockMode) {
      return mockData.map((player, index) => ({
        ...player,
        rank: index + 1
      }));
    }

    if (!data?.result) return [];

    return Object.entries(data.result)
      .sort(([, scoreA], [, scoreB]) => Number(scoreB) - Number(scoreA))
      .map(([playerId, score], index) => ({
        playerId,
        name: getLocalStorageUserName(playerId),
        score: Number(score),
        rank: index + 1
      }));
  }, [data?.result, mockData, mockMode]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [animationInterval]);

  if (currentRankings.length === 0) return null;

  return (
    <div className={styles.liveRanking}>

      <AnimatePresence>
        {currentRankings.map((player, _) => {
          return (
            <motion.div
              key={player.playerId}
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                layout: { duration: 0.8 }
              }}
              className={styles.rankItem}
            >
              {/* 排名圆圈 */}
              <div className={`${styles.rankCircle} ${styles[`rank${player.rank}`]}`}>
                <span className={styles.rankNumber}>{player.rank}</span>
              </div>

              {/* 玩家信息 */}
              <div className={styles.playerInfo}>
                <motion.div
                  className={styles.playerDetails}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <div className={styles.playerContent}>
                    <Text
                      className={styles.playerName}
                      ellipsis={{ tooltip: true }}
                    >
                      {player.name}
                    </Text>
                    <motion.span
                      className={styles.playerScore}
                      key={player.score} // 分数变化时重新动画
                      initial={{ scale: 1.2, color: '#00ff88' }}
                      animate={{ scale: 1, color: '#00ff88' }}
                      transition={{ duration: 0.3 }}
                    >
                      ${player.score}
                    </motion.span>
                  </div>
                  <motion.div
                    className={styles.connectLine}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  ></motion.div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default LiveRanking;