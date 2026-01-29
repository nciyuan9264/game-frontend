import { TileData } from '@/types/room';
import styles from './index.module.less';
import { CompanyColor } from '@/const/color';


type Props = {
  tilesData?: Record<string, TileData>;
  hoveredTile?: string;
};

const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const columns = Array.from({ length: 12 }, (_, i) => `${i + 1}`);

export default function Board({ tilesData, hoveredTile }: Props) {
  return (
    <div className={styles.board}>
      {rows.map(row =>
        columns.map(col => {
          const id = `${col}${row}`;
          const tile = tilesData?.[id];
          return (
            <div
              key={id}
              className={styles.cell}
              style={{
                backgroundColor: tile?.belong ? CompanyColor[tile?.belong] : hoveredTile === id ? '#8a6262' :'#e6f2ff',
              }}
            >
              {id}
            </div>
          );
        })
      )}
    </div>
  );
}
