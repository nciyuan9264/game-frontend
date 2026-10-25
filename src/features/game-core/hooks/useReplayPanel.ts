import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';

interface DragState {
  pointerID: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  rect: DOMRect;
  cleanup: () => void;
}

export function useReplayPanel() {
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<DragState>();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [collapsed, setCollapsed] = useState(false);

  const clampPosition = useCallback((
    left: number,
    top: number,
    rect: Pick<DOMRect, 'width' | 'height'>,
  ) => {
    const inset = 8;
    return {
      left: Math.min(
        Math.max(inset, left),
        Math.max(inset, window.innerWidth - rect.width - inset),
      ),
      top: Math.min(
        Math.max(inset, top),
        Math.max(inset, window.innerHeight - rect.height - inset),
      ),
    };
  }, []);

  const applyDragPosition = useCallback((
    state: DragState,
    clientX: number,
    clientY: number,
  ) => {
    const next = clampPosition(
      state.rect.left + clientX - state.startX,
      state.rect.top + clientY - state.startY,
      state.rect,
    );
    setPosition({
      x: state.originX + next.left - state.rect.left,
      y: state.originY + next.top - state.rect.top,
    });
  }, [clampPosition]);

  const beginPointerDrag = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    dragRef.current?.cleanup();
    const pointerID = event.pointerId;
    const move = (moveEvent: globalThis.PointerEvent) => {
      const state = dragRef.current;
      if (!state || state.pointerID !== moveEvent.pointerId) return;
      moveEvent.preventDefault();
      applyDragPosition(state, moveEvent.clientX, moveEvent.clientY);
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    const end = (endEvent: globalThis.PointerEvent) => {
      if (dragRef.current?.pointerID !== endEvent.pointerId) return;
      cleanup();
      dragRef.current = undefined;
    };
    dragRef.current = {
      pointerID,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      rect,
      cleanup,
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }, [applyDragPosition, position.x, position.y]);

  const beginTouchDrag = useCallback((event: ReactTouchEvent<HTMLElement>) => {
    const rect = panelRef.current?.getBoundingClientRect();
    const touch = event.touches[0];
    if (!rect || !touch) return;
    event.preventDefault();
    dragRef.current?.cleanup();
    const identifier = touch.identifier;
    const move = (moveEvent: globalThis.TouchEvent) => {
      const current = Array.from(moveEvent.touches)
        .find(item => item.identifier === identifier);
      const state = dragRef.current;
      if (!current || !state || state.pointerID !== identifier) return;
      moveEvent.preventDefault();
      applyDragPosition(state, current.clientX, current.clientY);
    };
    const cleanup = () => {
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
    };
    const end = (endEvent: globalThis.TouchEvent) => {
      if (!Array.from(endEvent.changedTouches)
        .some(item => item.identifier === identifier)) return;
      endEvent.preventDefault();
      cleanup();
      dragRef.current = undefined;
    };
    dragRef.current = {
      pointerID: identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      originX: position.x,
      originY: position.y,
      rect,
      cleanup,
    };
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end, { passive: false });
    window.addEventListener('touchcancel', end, { passive: false });
  }, [applyDragPosition, position.x, position.y]);

  const moveWithKeyboard = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (![
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
    ].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') {
      setPosition({ x: 0, y: 0 });
      return;
    }
    const rect = panelRef.current?.getBoundingClientRect();
    const dx = event.key === 'ArrowLeft'
      ? -24
      : event.key === 'ArrowRight' ? 24 : 0;
    const dy = event.key === 'ArrowUp'
      ? -24
      : event.key === 'ArrowDown' ? 24 : 0;
    if (!rect?.width || !rect.height) {
      setPosition(current => ({ x: current.x + dx, y: current.y + dy }));
      return;
    }
    const next = clampPosition(rect.left + dx, rect.top + dy, rect);
    setPosition(current => ({
      x: current.x + next.left - rect.left,
      y: current.y + next.top - rect.top,
    }));
  }, [clampPosition]);

  useEffect(() => {
    const resetPosition = () => setPosition({ x: 0, y: 0 });
    window.addEventListener('resize', resetPosition);
    return () => {
      window.removeEventListener('resize', resetPosition);
      dragRef.current?.cleanup();
    };
  }, []);

  const dragHandleProps = {
    draggable: false,
    onDragStart: (event: DragEvent<HTMLElement>) =>
      event.preventDefault(),
    onPointerDown: beginPointerDrag,
    onTouchStart: beginTouchDrag,
    onKeyDown: moveWithKeyboard,
  };

  return {
    panelRef,
    collapsed,
    setCollapsed,
    toggleCollapsed: () => setCollapsed(current => !current),
    positionStyle: {
      '--replay-panel-x': `${position.x}px`,
      '--replay-panel-y': `${position.y}px`,
    } as CSSProperties,
    dragHandleProps,
  };
}
