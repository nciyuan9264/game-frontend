import { useRef, useState, type KeyboardEvent } from 'react';
import { Disc } from '../Artwork';
import {
  BOARD_CELLS,
  BOARD_SIZE,
  column,
  coordinate,
  row,
} from '../../model/board';
import type {
  Disc as DiscValue,
  LegalMove,
  MoveEntry,
  Side,
} from '../../model/types';
import styles from './index.module.less';

export function Board({
  board,
  currentSide,
  legalMoves,
  preview,
  lastData,
  interactive,
  coordinates,
  hints,
  onCell,
  onHover,
  testPrefix = 'cell',
}: {
  board: DiscValue[];
  currentSide: Side;
  legalMoves: LegalMove[];
  preview?: LegalMove;
  lastData?: MoveEntry;
  interactive: boolean;
  coordinates: boolean;
  hints: boolean;
  onCell: (index: number) => void;
  onHover: (index?: number) => void;
  testPrefix?: string;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusIndex, setFocusIndex] = useState(19);
  const moveByIndex = new Map(legalMoves.map(move => [move.index, move]));
  const previewFlips = new Set(preview?.flips ?? []);
  const recentlyFlipped = new Set(lastData?.flips ?? []);

  const moveFocus = (event: KeyboardEvent, index: number) => {
    const currentRow = row(index);
    const currentColumn = column(index);
    const next = event.key === 'ArrowLeft'
      ? currentRow * BOARD_SIZE + Math.max(0, currentColumn - 1)
      : event.key === 'ArrowRight'
        ? currentRow * BOARD_SIZE + Math.min(BOARD_SIZE - 1, currentColumn + 1)
        : event.key === 'ArrowUp'
          ? Math.max(0, currentRow - 1) * BOARD_SIZE + currentColumn
          : event.key === 'ArrowDown'
            ? Math.min(BOARD_SIZE - 1, currentRow + 1) * BOARD_SIZE + currentColumn
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? BOARD_CELLS.length - 1
                : undefined;
    if (next == null) return;
    event.preventDefault();
    setFocusIndex(next);
    buttons.current[next]?.focus();
  };

  return <div className={`${styles.frame} ${coordinates ? '' : styles.withoutCoordinates}`}>
    <div className={styles.coordinateBoard}>
      <div className={`${styles.coordinates} ${styles.top}`}>
        {'ABCDEFGH'.split('').map((label, index) =>
          <span key={label} className={preview && column(preview.index) === index ? styles.highlight : ''}>{label}</span>)}
      </div>
      <div className={`${styles.coordinates} ${styles.left}`}>
        {Array.from({ length: BOARD_SIZE }, (_, index) =>
          <span key={index} className={preview && row(preview.index) === index ? styles.highlight : ''}>{index + 1}</span>)}
      </div>
      <div className={styles.grid} role="group"
        aria-label="黑白棋棋盘，8 行 8 列。方向键移动，回车落子。">
        {preview && <svg viewBox="0 0 800 800" className={styles.previewLines} aria-hidden="true">
          {preview.lines.map((line, index) => {
            const end = line[line.length - 1];
            return <line
              key={`${end}-${index}`}
              x1={column(preview.index) * 100 + 50}
              y1={row(preview.index) * 100 + 50}
              x2={column(end) * 100 + 50}
              y2={row(end) * 100 + 50}
            />;
          })}
        </svg>}
        {BOARD_CELLS.map(index => {
          const cell = board[index] ?? '';
          const move = moveByIndex.get(index);
          const target = preview?.index === index;
          const affected = previewFlips.has(index);
          const last = lastData?.kind === 'move' && lastData.index === index;
          const label = `${coordinate(index)}，${cell
            ? `${cell === 'black' ? '黑' : '白'}子`
            : move
              ? `可落子，翻转 ${move.flips.length} 枚`
              : '不可落子'}`;
          return <button
            key={index}
            ref={element => { buttons.current[index] = element; }}
            type="button"
            className={[
              styles.cell,
              move && interactive ? styles.legal : '',
              target ? styles.target : '',
              affected ? styles.wouldFlip : '',
              last ? styles.lastMove : '',
              recentlyFlipped.has(index) ? styles.justFlipped : '',
            ].filter(Boolean).join(' ')}
            aria-label={label}
            data-testid={`${testPrefix}-${coordinate(index)}`}
            tabIndex={interactive && focusIndex === index ? 0 : -1}
            onClick={() => move && interactive && onCell(index)}
            onPointerEnter={event => {
              if (event.pointerType === 'mouse' && interactive) {
                onHover(move ? index : undefined);
              }
            }}
            onPointerLeave={() => onHover(undefined)}
            onFocus={() => {
              setFocusIndex(index);
              if (interactive) onHover(move ? index : undefined);
            }}
            onBlur={() => onHover(undefined)}
            onKeyDown={event => moveFocus(event, index)}
          >
            {cell
              ? <Disc side={cell} className={styles.boardDisc} />
              : target
                ? <Disc side={currentSide} className={`${styles.boardDisc} ${styles.ghostDisc}`} />
                : move && hints && interactive
                  ? <span className={styles.legalDot} />
                  : null}
            {last && cell && <span className={styles.lastMark} />}
            {affected && <span className={styles.flipOutline} />}
            {target && <><span className={styles.targetCorners} />
              <span className={styles.flipBadge}>{preview.flips.length}</span></>}
          </button>;
        })}
      </div>
      <div className={`${styles.coordinates} ${styles.right}`}>
        {Array.from({ length: BOARD_SIZE }, (_, index) => <span key={index}>{index + 1}</span>)}
      </div>
      <div className={`${styles.coordinates} ${styles.bottom}`}>
        {'ABCDEFGH'.split('').map(label => <span key={label}>{label}</span>)}
      </div>
    </div>
  </div>;
}
