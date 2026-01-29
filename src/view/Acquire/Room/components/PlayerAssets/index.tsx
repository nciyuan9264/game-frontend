import React from 'react';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { CompanyColor } from '@/const/color';
import { Tag } from 'antd';
import { GameStatus } from '@/enum/game';
import { getLocalStorageUserID } from '@/util/user';
import MessageSender from '@/view/Splendor/Room/components/MessageSender';

interface PlayerAssetsProps {
  data?: WsRoomSyncData;
  sendMessage: (msg: string) => void;
  setHoveredTile: (tileKey: string | undefined) => void;
  placeTile: (tileKey: string) => void;
}
const PlayerAssets: React.FC<PlayerAssetsProps> = ({
  data,
  sendMessage,
  setHoveredTile,
  placeTile,
}) => {
  const userID = getLocalStorageUserID();

  return (
    <div className={styles.playerAssets}>
      <div className={styles.assetGroup}>
        <span className={styles.assetLabel}>💰 现金：</span>
        <span className={styles.moneyAmount}>${data?.playerData.info.money}</span>
      </div>

      <div className={styles.assetGroup}>
        <span className={styles.assetLabel}>📈 股票：</span>
        <div className={styles.stockList}>
          {Object.entries(data?.playerData.stocks || {})
            .filter(([_, count]) => Number(count) > 0)
            .map(([company, count]) => (
              <Tag
                key={company}
                color={CompanyColor[company as CompanyKey]}
                className={styles.stockTag}
              >
                <b>{company}</b> × {count}
              </Tag>
            ))}
        </div>
      </div>

      <div className={styles.assetGroup}>
        <span className={styles.assetLabel}>🧱 Tiles：</span>
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
                onMouseEnter={() =>
                  data?.roomData.currentPlayer === userID &&
                  data?.roomData.roomInfo.gameStatus === GameStatus.SET_Tile &&
                  setHoveredTile(tileKey)
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

      <div className={styles.message}>
        <MessageSender
          onMessageSend={(msg) => {
            console.log("用户发送消息:", msg);
            sendMessage(JSON.stringify({
              type: 'play_audio',
              payload: msg,
            }));
          }}
        />
      </div>
    </div>
  );
};

export default PlayerAssets;
