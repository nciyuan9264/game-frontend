import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import {
  Minus,
  Move,
  Plus,
  Scan,
} from 'lucide-react';
import {
  PIECE_INFO,
  addHex,
  hexKey,
  neighbors,
  sameHex,
  stackMap,
  topPiece,
} from '../../model/board';
import type {
  ActionEntry,
  Hex,
  MoveOption,
  PieceKind,
  Side,
  Stack,
} from '../../model/types';
import { Tile } from '../Artwork';

const RADIUS = 39;
const point = (value: Hex) => ({
  x: value.q * RADIUS * 1.5,
  y: Math.sqrt(3) * RADIUS * (value.r + value.q / 2),
});

export function Board({
  stacks,
  options = [],
  selectedPieceID,
  pending,
  previewKind,
  previewSide,
  lastAction,
  interactive = false,
  coordinates = false,
  showMoves = true,
  readOnly = false,
  controls = true,
  small = false,
  testPrefix = '',
  onCell,
}: {
  stacks: Stack[];
  options?: MoveOption[];
  selectedPieceID?: string;
  pending?: Hex;
  previewKind?: PieceKind;
  previewSide?: Side;
  lastAction?: ActionEntry;
  interactive?: boolean;
  coordinates?: boolean;
  showMoves?: boolean;
  readOnly?: boolean;
  controls?: boolean;
  small?: boolean;
  testPrefix?: string;
  onCell?: (position: Hex) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef(new Map<string, HTMLButtonElement>());
  const dragRef = useRef<{
    x: number;
    y: number;
    pan: { x: number; y: number };
    pointerID: number;
  }>();
  const [box, setBox] = useState({ width: 640, height: 400 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [focus, setFocus] = useState('0,0');
  const board = useMemo(() => stackMap(stacks), [stacks]);
  const compact = box.width < 500 && !readOnly;

  useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const read = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width && rect.height) {
        setBox({ width: rect.width, height: rect.height });
      }
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { cells, center, span } = useMemo(() => {
    const values = new Map<string, Hex>();
    for (const stack of stacks) {
      values.set(hexKey(stack.position), stack.position);
      if (!readOnly) {
        neighbors(stack.position).forEach(position =>
          values.set(hexKey(position), position));
      }
    }
    options.forEach(option => values.set(hexKey(option.to), option.to));
    if (!values.size) values.set('0,0', { q: 0, r: 0 });
    const cells = [...values.values()].sort((left, right) => {
      const leftPoint = point(left);
      const rightPoint = point(right);
      return leftPoint.y - rightPoint.y || leftPoint.x - rightPoint.x;
    });
    const used = readOnly
      ? cells
      : cells.filter(position =>
        board[hexKey(position)]
        || options.some(option => sameHex(option.to, position)));
    const points = (used.length ? used : cells).map(point);
    const paddingX = RADIUS + (compact ? 6 : 18);
    const paddingY = RADIUS + (compact ? 6 : 26);
    const minX = Math.min(...points.map(value => value.x)) - paddingX;
    const maxX = Math.max(...points.map(value => value.x)) + paddingX;
    const minY = Math.min(...points.map(value => value.y)) - paddingY;
    const maxY = Math.max(...points.map(value => value.y)) + paddingY;
    return {
      cells,
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      span: {
        width: Math.max(maxX - minX, 260),
        height: Math.max(maxY - minY, 220),
      },
    };
  }, [board, compact, options, readOnly, stacks]);

  const fit = Math.min(
    (box.width - 30) / span.width,
    (box.height - (controls ? compact ? 52 : 60 : 22)) / span.height,
    small ? .98 : box.width < 500 ? .88 : 1.13,
  );
  const scale = Math.max(.18, fit) * zoom;
  const selectedOption = pending
    ? options.find(option => sameHex(option.to, pending))
    : undefined;
  const path = selectedOption?.path ?? [];
  const presentFocus = cells.some(position => hexKey(position) === focus);
  const last = lastAction?.to;

  const onKeyDown = (event: KeyboardEvent, position: Hex) => {
    const directions: Record<string, Hex> = {
      ArrowRight: { q: 1, r: 0 },
      ArrowDown: { q: 0, r: 1 },
      ArrowLeft: { q: -1, r: 0 },
      ArrowUp: { q: 0, r: -1 },
      q: { q: -1, r: 1 },
      e: { q: 1, r: -1 },
    };
    let target: string | undefined;
    if (directions[event.key]) {
      event.preventDefault();
      target = hexKey(addHex(position, directions[event.key]));
    } else if (event.key === 'Home') {
      event.preventDefault();
      target = hexKey(options[0]?.to ?? cells[0]);
    }
    if (target && buttonsRef.current.has(target)) {
      setFocus(target);
      buttonsRef.current.get(target)?.focus();
    }
  };

  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (readOnly || (event.target as HTMLElement).closest('button')) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      pan,
      pointerID: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setPan({
      x: drag.pan.x + event.clientX - drag.x,
      y: drag.pan.y + event.clientY - drag.y,
    });
  };
  const endPan = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = undefined;
  };

  return <div ref={rootRef}
    className={`hive-board ${readOnly ? 'read-only' : ''} ${small ? 'small-board' : ''}`}
    role="group"
    aria-label={readOnly ? '棋局快照' : '无边界六边形棋盘'}
    onPointerDown={startPan} onPointerMove={movePan}
    onPointerUp={endPan} onPointerCancel={endPan}>
    {controls && <div className="board-tools">
      <span className="board-drag-tip"><Move size={12} />拖动空白处移动棋盘</span>
      <div>
        <button type="button" aria-label="缩小棋盘" title="缩小棋盘"
          disabled={zoom <= .7}
          onClick={() => setZoom(value => Math.max(.65, value - .22))}>
          <Minus size={17} />
        </button>
        <button type="button" aria-label="放大棋盘" title="放大棋盘"
          disabled={zoom >= 2}
          onClick={() => setZoom(value => Math.min(2.1, value + .22))}>
          <Plus size={17} />
        </button>
        <button type="button" aria-label="居中适配" title="居中适配"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}><Scan size={17} /></button>
      </div>
    </div>}
    <div className="hive-stage" style={{
      transform: `translate(${box.width / 2 + pan.x}px, ${box.height / 2 + pan.y + (controls ? 10 : 0)}px) scale(${scale}) translate(${-center.x}px, ${-center.y}px)`,
    }}>
      {path.length > 1 && <svg className="move-route" aria-hidden="true">
        <polyline points={path.map(value => {
          const position = point(value);
          return `${position.x},${position.y}`;
        }).join(' ')} />
      </svg>}
      {cells.map((position, index) => {
        const key = hexKey(position);
        const stack = board[key];
        const piece = topPiece(stack);
        const pixel = point(position);
        const legal = options.some(option => sameHex(option.to, position));
        const chosen = sameHex(pending, position);
        const selected = piece?.pieceID === selectedPieceID;
        const layers = stack?.pieces.length ?? 0;
        const name = piece
          ? `${piece.side === 'white' ? '白方' : '黑方'}${PIECE_INFO[piece.kind].name}${piece.number}，坐标 ${key}${layers > 1 ? `，${layers} 层` : ''}`
          : `落点 ${key}`;
        const body = piece
          ? <><Tile side={piece.side} kind={piece.kind} layers={layers}
              selected={selected || chosen} mark={sameHex(last, position)} />
            {chosen && previewKind === 'beetle' && <span className="stack-preview">
              <Tile side={previewSide} kind="beetle" layers={layers + 1}
                ghost selected />
            </span>}</>
          : chosen
            ? <Tile side={previewSide} kind={previewKind} ghost selected />
            : <span className={`empty-hex ${legal && showMoves ? 'legal-hex' : ''}`}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <polygon points="97,50 73.5,90.7 26.5,90.7 3,50 26.5,9.3 73.5,9.3" />
              </svg><i />
            </span>;
        const style = {
          left: pixel.x - RADIUS,
          top: pixel.y - RADIUS,
          width: RADIUS * 2,
          height: RADIUS * 2,
        };
        return readOnly
          ? <div key={key} className="hive-cell readonly-cell" style={style}>
            {body}
          </div>
          : <button key={key} type="button"
            ref={element => {
              if (element) buttonsRef.current.set(key, element);
              else buttonsRef.current.delete(key);
            }}
            className={`hive-cell ${piece ? 'occupied' : 'empty'} ${selected ? 'selected' : ''} ${chosen ? 'pending' : ''} ${legal ? 'legal' : ''}`}
            style={style}
            data-testid={`${testPrefix}cell-${key}`}
            data-click-sound="false"
            aria-label={name} title={name}
            disabled={!interactive && !piece}
            tabIndex={presentFocus ? focus === key ? 0 : -1 : index === 0 ? 0 : -1}
            onFocus={() => setFocus(key)}
            onKeyDown={event => onKeyDown(event, position)}
            onClick={() => {
              setFocus(key);
              if (interactive) onCell?.(position);
            }}>{body}{coordinates &&
              <span className="coord-label">{key}</span>}</button>;
      })}
      {path.length > 2 && previewKind === 'spider' &&
        <svg className="route-numbers" aria-hidden="true">
          {path.slice(1).map((position, index) => {
            const value = point(position);
            return <g key={hexKey(position)}
              transform={`translate(${value.x + 18}, ${value.y - 18})`}>
              <circle r="9" /><text y="3.5" textAnchor="middle">{index + 1}</text>
            </g>;
          })}
        </svg>}
    </div>
    {!stacks.length && !pending && <div className="empty-board-note">
      <strong>从一枚棋子，长成一片蜂巢。</strong>
      <span>{readOnly ? '这是棋局的起点' : '选择虫子，再点击中央落点'}</span>
    </div>}
    {!readOnly && <div className="board-caption">
      <span><i />{pending
        ? '虚影仅为预览，确认后落子'
        : options.length
          ? `${options.length} 个合法落点`
          : '棋子相连，就是棋盘'}</span>
      <span>HIVE / 方寸棋室</span>
    </div>}
  </div>;
}

export function MiniBoard(props: Pick<
  Parameters<typeof Board>[0],
  'stacks' | 'lastAction'
>) {
  return <Board {...props} readOnly controls={false} small />;
}
