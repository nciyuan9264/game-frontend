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
    <div className={styles.board}>
      <div className={styles["board-shell"]}>
        <div className={styles["box-grid"]}>
          {rows.map(row =>
            columns.map(col => {
              const id = `${col}${row}`;
              const tile = tilesData?.[id];
              const shouldBlink =
                wsRoomSyncData?.roomData.currentPlayer === wsRoomSyncData?.playerId &&
                playerTiles?.includes(id);
              return (
                <button
                  key={id}
                  className={`${styles.cell} ${shouldBlink ? styles.blink : ''}`}
                  onClick={() => {
                    if (shouldBlink) {
                      wsRoomSyncData?.roomData.roomInfo.gameStatus === GameStatus.SET_Tile && placeTile(id)
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
                    background: tile?.belong ? CompanyColor[tile?.belong] : hoveredTile === id ? 'linear-gradient(135deg, #0b3a3f, #00b3a6)' : 'transparent',
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
