import { TileData, WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { CompanyColor } from '@/const/color';
import { GameStatus } from '@/enum/game';
import { FC } from 'react';


interface IBoardProps {
  tilesData?: Record<string, TileData>;
  hoveredTile?: string;
  wsRoomSyncData?: WsRoomSyncData;
  setHoveredTile: (tileID: string | undefined) => void;
  placeTile: (tileID: string) => void;
};

const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const columns = Array.from({ length: 12 }, (_, i) => `${i + 1}`);

export const Board: FC<IBoardProps> = ({ tilesData, hoveredTile, setHoveredTile, wsRoomSyncData, placeTile }) => {
  const playerTiles = wsRoomSyncData?.playerData.tiles;

  return (
    <div className={styles['board']}>
      <div className={styles['board__shell']}>
        <div className={styles['board__grid']}>
          {rows.map(row =>
            columns.map(col => {
              const id = `${col}${row}`;
              const tile = tilesData?.[id];
              const shouldBlink =
                wsRoomSyncData?.roomData.currentPlayer === wsRoomSyncData?.playerId &&
                playerTiles?.includes(id) && wsRoomSyncData?.roomData.roomInfo.gameStatus === GameStatus.SET_Tile;
              return (
                <button
                  key={id}
                  className={`${styles['board__cell']} ${shouldBlink ? styles['board__cell--blink'] : ''}`}
                  onClick={() => {
                    if (shouldBlink) {
                      placeTile(id)
                    }
                  }}
                  onMouseEnter={() => {
                    if (shouldBlink) {
                      setHoveredTile(id);
                    }
                  }}
                  onMouseLeave={() => {
                    if (shouldBlink) {
                      setHoveredTile(undefined);
                    }
                  }}
                  style={{
                    background: tile?.belong ? CompanyColor[tile?.belong] : hoveredTile === id ? 'linear-gradient(135deg, #0b3a3f, #00b3a6)' : 'radial-gradient(circle at 30% 10%, rgba(255, 255, 255, 0.02), transparent 55%), linear-gradient(135deg, rgba(2, 6, 23, 0.8), rgba(11, 18, 32, 0.96))',
                    backgroundColor: tile?.belong ? CompanyColor[tile?.belong] : hoveredTile === id ? 'rgba(45, 212, 191, 0.95)' : 'unset',
                    cursor: shouldBlink ? 'pointer' : 'default',
                    color: tile?.belong ? '#fff' : 'var(--color-text-soft)',
                  }}
                >
                  {id}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
