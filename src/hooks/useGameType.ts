import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export type GameType = 'acquire' | 'splendor' | 'davinci';
export enum GameTypeEnum {
  Acquire = 'acquire',
  Splendor = 'splendor',
  Davinci = 'davinci',
}

const gameTypes: GameType[] = [
  GameTypeEnum.Acquire,
  GameTypeEnum.Splendor,
  GameTypeEnum.Davinci,
];

export const useGameType = () => {
  const [gameType, setGameType] = useState<GameType>('acquire');
  const location = useLocation();

  // 使用useMemo缓存路径解析结果，避免不必要的计算
  const currentGameType = useMemo<GameType>(() => {
    const pathname = location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    const matchedGameType = parts.find((part): part is GameType =>
      gameTypes.includes(part as GameType)
    );
    if (matchedGameType) {
      return matchedGameType;
    }
    return GameTypeEnum.Acquire; // 默认返回acquire
  }, [location.pathname]);

  // 当解析出的游戏类型变化时，更新状态
  useEffect(() => {
    setGameType(currentGameType);
  }, [currentGameType]);

  return gameType;
};
