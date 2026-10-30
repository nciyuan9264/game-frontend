import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import {
  coordinate,
  sameCell,
  sideName,
} from '../../model/cards';
import type {
  ActionEntry,
  Cell,
  LegalMove,
  Piece,
  Side,
} from '../../model/types';
import {
  Pawn,
  Torii,
} from '../Artwork';

const naturalOrder = [0, 1, 2, 3, 4];

export function Board({
  pieces,
  view,
  selectedPiece,
  legalMoves = [],
  pendingMove,
  lastAction,
  interactive = false,
  small = false,
  testPrefix = '',
  onCell,
}: {
  pieces: Piece[];
  view: Side;
  selectedPiece?: string;
  legalMoves?: LegalMove[];
  pendingMove?: LegalMove;
  lastAction?: ActionEntry;
  interactive?: boolean;
  small?: boolean;
  testPrefix?: string;
  onCell?: (cell: Cell, piece?: Piece) => void;
}) {
  const rows = view === 'blue' ? naturalOrder : [...naturalOrder].reverse();
  const columns = view === 'blue' ? naturalOrder : [...naturalOrder].reverse();
  const chosen = pieces.find(piece => piece.id === selectedPiece);
  const board = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(12);
  const markerID = `move-head-${useId().replace(/:/g, '')}`;
  const display = (value: number) => view === 'blue' ? value : 4 - value;

  const moveFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -5,
      ArrowDown: 5,
    };
    const offset = offsets[event.key];
    if (offset == null) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(24, index + offset));
    setFocusIndex(next);
    board.current
      ?.querySelector<HTMLButtonElement>(`[data-order="${next}"]`)
      ?.focus();
  };

  return <div
    className={`board-frame ${small ? 'small-board' : ''}`}
    data-testid={`${testPrefix}board`}
    ref={board}
  >
    <div className="board-coords top">
      {columns.map(column => <span key={column}>{'ABCDE'[column]}</span>)}
    </div>
    <div className="board-coords side">
      {rows.map(row => <span key={row}>{5 - row}</span>)}
    </div>
    <div className="board-grid" role="grid" aria-label="御神乐棋 5 乘 5 棋盘">
      {rows.flatMap((row, rowIndex) => columns.map((column, columnIndex) => {
        const order = rowIndex * 5 + columnIndex;
        const cell = { row, column };
        const piece = pieces.find(value => sameCell(value.cell, cell));
        const move = legalMoves.find(value => sameCell(value.to, cell));
        const pending = sameCell(pendingMove?.to, cell);
        const temple = column === 2 && (row === 0 || row === 4);
        const last = lastAction?.kind === 'move'
          && (sameCell(lastAction.from, cell) || sameCell(lastAction.to, cell));
        const label = [
          coordinate(cell),
          move
            ? piece
              ? `可擒获${piece.kind === 'master' ? '宗师' : '弟子'}`
              : move.winning
                ? '可落子并获胜'
                : '可落子'
            : piece
              ? `${sideName(piece.side)}${piece.kind === 'master' ? '宗师' : '弟子'}`
              : temple
                ? `${sideName(row === 0 ? 'red' : 'blue')}山门`
                : '空格',
        ].join(' ');

        return <button
          key={`${row}:${column}`}
          type="button"
          role="gridcell"
          data-order={order}
          data-testid={`${testPrefix}cell-${row}-${column}`}
          tabIndex={interactive && order === focusIndex ? 0 : -1}
          aria-label={label}
          disabled={!interactive}
          data-click-sound="false"
          className={[
            'board-cell',
            (row + column) % 2 ? 'shade' : '',
            temple ? `temple ${row === 0 ? 'red' : 'blue'}` : '',
            selectedPiece && piece?.id === selectedPiece ? 'chosen' : '',
            move ? 'legal' : '',
            pending ? 'pending' : '',
            move?.winning ? 'winning' : '',
            last ? 'last-move' : '',
          ].filter(Boolean).join(' ')}
          onFocus={() => setFocusIndex(order)}
          onKeyDown={event => moveFocus(event, order)}
          onClick={() => interactive && onCell?.(cell, piece)}
        >
          {temple && <span className="temple-mark"><Torii size={42} /></span>}
          {piece && <Pawn piece={piece} />}
          {!piece && pending && chosen && <Pawn piece={chosen} ghost />}
          {move && !piece && !pending && <span className="legal-dot" />}
          {move && piece && <span className="capture-ring" />}
          {temple && !piece && !pending && <span className="temple-text">山门</span>}
          {pending && <span className="destination-tag">
            {move?.winning ? '胜局' : '落点'}
          </span>}
        </button>;
      }))}
      {pendingMove && chosen && <svg
        className="move-arrow"
        viewBox="0 0 500 500"
        aria-hidden="true"
      >
        <defs><marker
          id={markerID}
          markerWidth="7"
          markerHeight="7"
          refX="5"
          refY="3.5"
          orient="auto"
        ><path
          d="M0 0L7 3.5L0 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        /></marker></defs>
        <line
          x1={display(chosen.cell.column) * 100 + 50}
          y1={display(chosen.cell.row) * 100 + 50}
          x2={display(pendingMove.to.column) * 100 + 50}
          y2={display(pendingMove.to.row) * 100 + 50}
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="6 6"
          markerEnd={`url(#${markerID})`}
        />
      </svg>}
    </div>
    <div className="board-corner tl" />
    <div className="board-corner tr" />
    <div className="board-corner bl" />
    <div className="board-corner br" />
  </div>;
}
