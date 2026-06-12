import React from 'react';
import classNames from 'classnames';
import { CompanyKey, WsRoomSyncData } from '@/types/AcquireRoom';
import styles from './index.module.less';
import { CompanyColor } from '@/const/color';
import { GameStatus } from '@/enum/game';
import MessageSender from '@/view/Splendor/components/Game/components/MessageSender';
import { useInteractionMode } from '@/hooks/useInteractionMode';

interface PlayerAssetsProps {
  data?: WsRoomSyncData;
  sendMessage: (msg: string) => void;
  setHoveredTile: (tileKey: string | undefined) => void;
  placeTile: (tileKey: string) => void;
  userID: string;
}

const PlayerAssets: React.FC<PlayerAssetsProps> = ({
  data,
  sendMessage,
  setHoveredTile,
  placeTile,
  userID
}) => {
  const { isFinePointer } = useInteractionMode();
  const handleTileKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, tileKey: string, canPlaceTile: boolean) => {
    if (!canPlaceTile) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    placeTile(tileKey);
  };

  return (
    <div className={styles.playerAssets}>
      {/* 现金显示 - 顶部中间椭圆形 */}
      <div className={styles.moneyDisplay}>
        <div className={styles.moneyOval}>
          <span className={styles.moneyIcon}>💰</span>
          <span className={styles.moneyAmount}>${data?.playerData.money || 0}</span>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className={styles.mainContent}>
        {/* 股票区域 - 左侧 */}
        <div className={styles.stockSection}>
          <div className={styles.sectionTitle}>📈 股票</div>
          <div className={styles.stockGrid}>
            {Object.entries(data?.playerData.stocks || {})
              .filter(([_, count]) => Number(count) > 0)
              .map(([company, count]) => (
                <div
                  key={company}
                  className={styles.stockCard}
                  style={{
                    backgroundColor: CompanyColor[company as CompanyKey],
                    boxShadow: `0 0 15px ${CompanyColor[company as CompanyKey]}40`
                  }}
                >
                  <div className={styles.stockCompany}>{company}</div>
                  <div className={styles.stockCount}>×{count}</div>
                </div>
              ))}
            {/* 修复逻辑：只有在真的没有股票时才显示 */}
            {Object.entries(data?.playerData.stocks || {})
              .filter(([_, count]) => Number(count) > 0).length === 0 && (
                <div className={styles.emptyState}>暂无股票</div>
              )}
          </div>
        </div>

        {/* Tiles区域 - 右侧 */}
        <div className={styles.tilesSection}>
          <div className={styles.sectionTitle}>🧱 Tiles</div>
          <div className={styles.tilesGrid}>
            {(data?.playerData.tiles || [])
              .sort((a, b) => {
                const [aRow, aCol] = a.match(/^(\d+)([A-Z])$/)!.slice(1);
                const [bRow, bCol] = b.match(/^(\d+)([A-Z])$/)!.slice(1);
                const rowDiff = Number(aRow) - Number(bRow);
                return rowDiff !== 0 ? rowDiff : aCol.charCodeAt(0) - bCol.charCodeAt(0);
              })
              .map((tileKey) => {
                const isCurrentPlayer = data?.roomData.currentPlayer === userID;
                const canPlaceTile = isCurrentPlayer && data?.roomData.gameStatus === GameStatus.SET_Tile;
                const interactiveProps = canPlaceTile
                  ? { role: 'button' as const, tabIndex: 0 }
                  : { tabIndex: -1 };

                return (
                  <div
                    className={classNames(
                      styles.tileCard,
                      {
                        [styles.tileClickable]: canPlaceTile,
                      }
                    )}
                    key={tileKey}
                    {...interactiveProps}
                    aria-label={canPlaceTile ? `放置地块 ${tileKey}` : `地块 ${tileKey}`}
                    onMouseEnter={() => isFinePointer && canPlaceTile && setHoveredTile(tileKey)}
                    onMouseLeave={() => isFinePointer && canPlaceTile && setHoveredTile(undefined)}
                    onClick={() => canPlaceTile && placeTile(tileKey)}
                    onKeyDown={(event) => handleTileKeyDown(event, tileKey, canPlaceTile)}
                  >
                    <span className={styles.tileText}>{tileKey}</span>
                  </div>
                );
              })}
            {(data?.playerData.tiles || []).length === 0 && (
              <div className={styles.emptyState}>暂无Tiles</div>
            )}
          </div>
        </div>
      </div>

      {/* 消息发送器 - 右下角浮动 */}
      <div className={styles.messageSection}>
        <MessageSender
          onMessageSend={(audioType) => {
            console.log("用户发送消息:", audioType);
            sendMessage(JSON.stringify({
              type: 'game_play_audio',
              payload: { audioType },
            }));
          }}
        />
      </div>
    </div>
  );
};

export default PlayerAssets;
