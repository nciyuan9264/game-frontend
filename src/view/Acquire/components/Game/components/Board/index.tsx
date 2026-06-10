import { TileData, WsRoomSyncData } from '@/types/AcquireRoom';
import styles from './index.module.less';
import { CompanyColor } from '@/const/color';
import { GameStatus } from '@/enum/game';
import { FC } from 'react';
import classNames from 'classnames';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import { AudioTypeEnum, useAudio } from '@/hooks/useAudio';


interface IBoardProps {
  tilesData?: Record<string, TileData>;
  hoveredTile?: string;
  wsRoomSyncData?: WsRoomSyncData;
  setHoveredTile: (tileID: string | undefined) => void;
  placeTile: (tileID: string) => void;
  readonly?: boolean;
};

const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const columns = Array.from({ length: 12 }, (_, i) => `${i + 1}`);

export const Board: FC<IBoardProps> = ({ tilesData, hoveredTile, setHoveredTile, wsRoomSyncData, placeTile, readonly }) => {
  const playerTiles = wsRoomSyncData?.playerData.tiles;
  const { isFinePointer } = useInteractionMode();
  const { playAudio } = useAudio();

  return (
    <div className={styles['board']}>
      <div className={styles['board__shell']}>
        <div className={styles['board__grid']}>
          {rows.map(row =>
            columns.map(col => {
              const id = `${col}${row}`;
              const tile = tilesData?.[id];
              const shouldBlink =
                !readonly &&
                wsRoomSyncData?.roomData.currentPlayer === wsRoomSyncData?.playerId &&
                playerTiles?.includes(id) && wsRoomSyncData?.roomData.gameStatus === GameStatus.SET_Tile;
              return (
                <button
                  key={id}
                  className={classNames(
                    styles['board__cell'],
                    {
                      [styles['board__cell--blink']]: shouldBlink,
                      [styles['board__cell--placeable']]: shouldBlink,
                    }
                  )}
                  aria-label={shouldBlink ? `放置地块 ${id}` : `地块 ${id}`}
                  onClick={() => {
                    if (shouldBlink) {
                      if (!isFinePointer) {
                        playAudio(AudioTypeEnum.HoverButton);
                      }
                      placeTile(id)
                    }
                  }}
                  onMouseEnter={() => {
                    if (isFinePointer && shouldBlink) {
                      setHoveredTile(id);
                      playAudio(AudioTypeEnum.HoverButton);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isFinePointer && shouldBlink) {
                      setHoveredTile(undefined);
                    }
                  }}
                  style={{
                    background: tile?.belong ? CompanyColor[tile?.belong] : hoveredTile === id ? 'linear-gradient(135deg, #0b3a3f, #00b3a6)' : 'radial-gradient(circle at 30% 10%, rgba(255, 255, 255, 0.02), transparent 55%), linear-gradient(135deg, rgba(2, 6, 23, 0.8), rgba(11, 18, 32, 0.96))',
                    backgroundColor: tile?.belong ? CompanyColor[tile?.belong] : hoveredTile === id ? 'rgba(45, 212, 191, 0.95)' : 'unset',
                    cursor: shouldBlink ? 'pointer' : 'default',
                    color: tile?.belong ? '#fff' : 'var(--color-text-soft)',
                    border: tile?.belong ? 'unset' : '1px solid rgba(31, 41, 55, 0.8)',
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
