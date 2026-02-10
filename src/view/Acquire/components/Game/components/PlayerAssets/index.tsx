import React from 'react';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { CompanyColor } from '@/const/color';
import { GameStatus } from '@/enum/game';

interface PlayerAssetsProps {
  data?: WsRoomSyncData;
  sendMessage: (msg: string) => void;
  setHoveredTile: (tileKey: string | undefined) => void;
  placeTile: (tileKey: string) => void;
  userID: string;
}
const PlayerAssets: React.FC<PlayerAssetsProps> = ({
  data,
  setHoveredTile,
  placeTile,
  userID
}) => {
  const stockList = Object.entries(data?.playerData.stocks || {})
    .filter(([_, count]) => Number(count) > 0);
  return (
    <div className={styles.playerAssets}>
      <div className={`${styles.assetGroup} ${styles['asset-group-money']}`} style={{ flex: '2' }}>
        {/* <span className={styles.assetLabel}>现金</span> */}
        <span className={styles.moneyAmount}>${data?.playerData.info.money}</span>
      </div>

      <div className={`${styles.assetGroup} ${styles['asset-group-stock']}`} style={{ flex: '3' }}>
        {/* <span className={styles.assetLabel}>股票</span> */}
        {stockList.length > 0 ? (
          <div className={styles.stockList}>
            {stockList
              .map(([company, count]) => (
                <div key={company} className={styles["stock-tag"]}>
                  <div className={styles["stock-info"]}>
                    <span className={styles["chip-dot"]} style={{
                      backgroundColor: CompanyColor[company as CompanyKey],
                    }} />
                    <span className={styles["company-name"]}>{company}</span>
                  </div>
                  <div className={styles["stock-count"]}>
                    <span className={styles.label}>{count}股 · 预估</span>
                    <span className={styles.value}>
                      ${((data?.roomData.companyInfo?.[company as CompanyKey]?.stockPrice ?? 0) * Number(count))}
                    </span>
                  </div>
                </div>
              ))}
          </div>) :
          <div className={styles.empty}>
            暂无股票
          </div>
        }
      </div>

      <div className={styles.assetGroup} style={{ flex: '2' }}>
        {/* <span className={styles.assetLabel}>tiles</span> */}
        <div className={styles.tileList}>
          {(data?.playerData.tiles || [])
            .sort((a, b) => {
              const [aRow, aCol] = a.match(/^(\d+)([A-Z])$/)!.slice(1);
              const [bRow, bCol] = b.match(/^(\d+)([A-Z])$/)!.slice(1);
              const rowDiff = Number(aRow) - Number(bRow);
              return rowDiff !== 0 ? rowDiff : aCol.charCodeAt(0) - bCol.charCodeAt(0);
            })
            .map((tileKey) => (
              <span
                className={styles.tile}
                key={tileKey}
                onMouseEnter={() => {
                  data?.roomData.currentPlayer === userID &&
                    data?.roomData.roomInfo.gameStatus === GameStatus.SET_Tile &&
                    setHoveredTile(tileKey)
                }
                }
                onMouseOut={() => data?.roomData.currentPlayer === userID && setHoveredTile(undefined)}
                onClick={() =>
                  data?.roomData.currentPlayer === userID &&
                  data?.roomData.roomInfo.gameStatus === GameStatus.SET_Tile &&
                  placeTile(tileKey)
                }
              >
                {tileKey}
              </span>
            ))}
        </div>
      </div>

      {/* <div className={styles.message}>
        <MessageSender
          onMessageSend={(msg) => {
            console.log("用户发送消息:", msg);
            sendMessage(JSON.stringify({
              type: 'game_play_audio',
              payload: msg,
            }));
          }}
        />
      </div> */}
    </div>
  );
};

export default PlayerAssets;
