import React from 'react';
import classNames from 'classnames';
import { CompanyKey, WsRoomSyncData } from '@/types/AcquireRoom';
import { CompanyColor } from '@/const/color';
import { GameStatus } from '@/enum/game';

import styles from './index.module.less';
import AnimatedNumber from '@/components/AnimatedNumber';
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
  setHoveredTile,
  placeTile,
  userID
}) => {
  const { isFinePointer } = useInteractionMode();
  const stockList = Object.entries(data?.playerData.stocks || {})
    .filter(([_, count]) => Number(count) > 0).sort(([a], [b]) => {
      return (data?.roomData.companyInfo?.[a as CompanyKey]?.stockTotal ?? 0) - (data?.roomData.companyInfo?.[b as CompanyKey]?.stockTotal ?? 0);
    });
  const handleTileKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>, tileKey: string, canPlaceTile: boolean) => {
    if (!canPlaceTile) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    placeTile(tileKey);
  };

  return (
    <div className={styles['player-assets']}>
      <div className={`${styles['player-assets__group']} ${styles['player-assets__group--money']}`} style={{ flex: '2' }}>
        <span className={styles['player-assets__amount']}>$<AnimatedNumber value={data?.playerData.money ?? 0} /></span>
      </div>

      <div className={`${styles['player-assets__group']} ${styles['player-assets__group--stock']}`} style={{ flex: '3' }}>
        {/* <span className={styles.assetLabel}>股票</span> */}
        {stockList.length > 0 ? (
          <div className={styles['player-assets__stock-list']}>
            {stockList
              .map(([company, count]) => (
                <div key={company} className={styles['player-assets__stock-tag']}>
                  <div className={styles['player-assets__stock-info']}>
                    <span className={styles['player-assets__chip-dot']} style={{
                      backgroundColor: CompanyColor[company as CompanyKey],
                    }} />
                    <span className={styles['player-assets__company-name']}>{company}</span>
                  </div>
                  <div className={styles['player-assets__stock-count']}>
                    <span className={styles['player-assets__label']}>{count}股 · 预估</span>
                    <span className={styles['player-assets__value']}>
                      ${((data?.roomData.companyInfo?.[company as CompanyKey]?.stockPrice ?? 0) * Number(count))}
                    </span>
                  </div>
                </div>
              ))}
          </div>) :
          <div className={styles['player-assets__empty']}>
            暂无股票
          </div>
        }
      </div>

      <div className={styles['player-assets__group']} style={{ flex: '2' }}>
        {/* <span className={styles.assetLabel}>tiles</span> */}
        <div className={styles['player-assets__tile-list']}>
          {(data?.playerData.tiles || [])
            .sort((a, b) => {
              const [aRow, aCol] = a.match(/^(\d+)([A-Z])$/)!.slice(1);
              const [bRow, bCol] = b.match(/^(\d+)([A-Z])$/)!.slice(1);
              const rowDiff = Number(aRow) - Number(bRow);
              return rowDiff !== 0 ? rowDiff : aCol.charCodeAt(0) - bCol.charCodeAt(0);
            })
            .map((tileKey) => {
              const canPlaceTile =
                data?.roomData.currentPlayer === userID &&
                data?.roomData.gameStatus === GameStatus.SET_Tile;
              const interactiveProps = canPlaceTile
                ? { role: 'button' as const, tabIndex: 0 }
                : { tabIndex: -1 };

              return (
                <span
                  className={classNames(
                    styles['player-assets__tile'],
                    {
                      [styles['player-assets__tile--clickable']]: canPlaceTile,
                    }
                  )}
                  key={tileKey}
                  {...interactiveProps}
                  aria-label={canPlaceTile ? `放置地块 ${tileKey}` : `地块 ${tileKey}`}
                  onMouseEnter={() => {
                    if (isFinePointer && canPlaceTile) {
                      setHoveredTile(tileKey);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isFinePointer && canPlaceTile) {
                      setHoveredTile(undefined);
                    }
                  }}
                  onClick={() => {
                    if (canPlaceTile) {
                      placeTile(tileKey);
                    }
                  }}
                  onKeyDown={(event) => handleTileKeyDown(event, tileKey, canPlaceTile)}
                >
                  {tileKey}
                </span>
              );
            })}
        </div>
      </div>

      {/* <div className={ Klikstyles.message}>
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
