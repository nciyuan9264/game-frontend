import { FC, useEffect, useState } from 'react';
import styles from './index.module.less';
import { HomeOutlined, UserOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';

import { SplendorWsRoomSyncData, SplendorNormalCard } from '@/types/SplendorRoom';
import { SplendorGameStatus } from '@/enum/game';
import { AudioTypeEnum, useAudio } from '@/hooks/useAudio';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import { useConfirmDialog } from '@/components/ConfirmDialog/useConfirmDialog';
import { Button } from '@/components/Button';
import { backendName2FrontendName } from '@/util/user';
import TurnCountdown from '@/view/Acquire/components/Game/components/TurnCountdown';

import { getGameStatus, isCurrentPlayer, formatLastAction } from './utils/game';
import CardBoard from './components/CardBoard';
import GemSelect from './components/GemSelect';
import GemToken from './components/Card/GemToken';
import PlayerData from './components/PlayerData';
import UserData from './components/UserData';
import GameEnd from './components/GameEnd';
import SplendorRulesModal from './components/Rules';

interface IGameProps {
  sendMessage: (msg: string) => void;
  wsRef: React.RefObject<WebSocket>;
  wsRoomSyncData: SplendorWsRoomSyncData;
  userID: string;
  gameEndModalVisible: boolean;
  setGameEndModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Game: FC<IGameProps> = ({
  sendMessage,
  wsRoomSyncData,
  userID,
  gameEndModalVisible,
  setGameEndModalVisible,
}: IGameProps) => {
  const [searchParams] = useSearchParams();
  const roomID = searchParams.get('roomID');
  const { playAudio } = useAudio();
  const { isFinePointer } = useInteractionMode();
  const { ConfirmDialogHolder } = useConfirmDialog();

  const [selectedCard, setSelectedCard] = useState<SplendorNormalCard | undefined>();
  const [rulesVisible, setRulesVisible] = useState(false);

  const data = wsRoomSyncData;
  const gameStatus = getGameStatus(data);
  const myTurn = isCurrentPlayer(data, userID);
  const isEnded = gameStatus === SplendorGameStatus.END;
  const isLastTurn = gameStatus === SplendorGameStatus.LAST_TURN;
  const lastAction = formatLastAction(data.roomData.lastData);

  // 挂载即告知后端已就绪
  useEffect(() => {
    sendMessage(JSON.stringify({ type: 'game_ready' }));
  }, []);

  // 轮到自己时播放音效
  useEffect(() => {
    if (myTurn) {
      playAudio(AudioTypeEnum.YourTurn);
    }
  }, [data.roomData.currentPlayer, myTurn]);

  // 每次同步清空选中卡
  useEffect(() => {
    setSelectedCard(undefined);
  }, [wsRoomSyncData]);

  const statusContent = () => {
    if (isEnded) return <span className={styles.ended}>游戏已结束</span>;
    if (myTurn) {
      return (
        <span className={styles.yourTurn}>
          你的回合{isLastTurn ? '（最后一回合）' : ''}
        </span>
      );
    }
    return (
      <span className={styles.waiting}>
        请等待
        <span className={styles.playerName}>{backendName2FrontendName(data.roomData.currentPlayer)}</span>
        操作{isLastTurn ? '（最后一回合）' : ''}
      </span>
    );
  };

  return (
    <div className={styles.gameRoot}>
      {/* 顶栏 */}
      <div className={styles.topBar}>
        <div className={styles.header}>
          <div className={styles.left}>
            <span className={styles.scoreBadge}>
              <span className={styles.scoreValue}>{data.playerData[userID]?.score ?? 0}</span>
              <span className={styles.scoreLabel}>分</span>
            </span>
            <Button
              className={styles.rulesButton}
              content="规则说明"
              onClick={() => setRulesVisible(true)}
            />
          </div>
          <div className={styles.status}>{statusContent()}</div>
          <div className={styles.right}>
            {gameStatus && !isEnded && data.roomData.turnDeadline ? (
              <TurnCountdown deadline={data.roomData.turnDeadline} className={styles.countdown} />
            ) : null}
            {isEnded && (
              <Button
                customType="primary"
                onClick={() => setGameEndModalVisible(true)}
                content="结束清算"
              />
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <span className={styles.footerItem}>
              <HomeOutlined /> 房间 {roomID}
            </span>
            <span className={styles.footerItem}>
              <UserOutlined /> 玩家 {backendName2FrontendName(userID)}
            </span>
          </div>
          {lastAction && (
            <span className={styles.lastAction}>
              <span className={styles.lastActionBadge}>{lastAction.badge}</span>
              {lastAction.text}
              {lastAction.gems && (
                <span className={styles.lastActionGems}>
                  {lastAction.gems.map((color, i) => (
                    <GemToken key={i} color={color} size="sm" />
                  ))}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* 主区：牌桌 + 其他玩家 */}
      <div className={styles.board}>
        <div className={styles.cardBoardArea}>
          <CardBoard
            data={data}
            sendMessage={sendMessage}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
            isFinePointer={isFinePointer}
          />
        </div>
        <div className={styles.playerDataArea}>
          <PlayerData data={data} userID={userID} />
        </div>
      </div>

      {/* 宝石池 */}
      <div className={styles.gemSelectArea}>
        <GemSelect data={data} sendMessage={sendMessage} userID={userID} />
      </div>

      {/* 自己资产 + 消息 */}
      <div className={styles.assetsArea}>
        <UserData
          data={data}
          userID={userID}
          selectedCard={selectedCard}
          setSelectedCard={setSelectedCard}
        />
      </div>

      <GameEnd
        data={data}
        visible={gameEndModalVisible}
        setGameEndModalVisible={setGameEndModalVisible}
        sendMessage={sendMessage}
        userID={userID}
      />
      <SplendorRulesModal visible={rulesVisible} setVisible={setRulesVisible} />
      {ConfirmDialogHolder}
    </div>
  );
};
