import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import styles from './index.module.less';

const PRESS_FEEDBACK_MS = 140;

export interface GameTabItem<TValue extends string | number> {
  value: TValue;
  label: ReactNode;
  disabled?: boolean;
}

interface GameTabsProps<TValue extends string | number> {
  items: readonly GameTabItem<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel: string;
  className?: string;
  activeClassName?: string;
  itemClassName?: string;
  trailing?: ReactNode;
  renderItem?: (
    item: GameTabItem<TValue>,
    selected: boolean,
    index: number
  ) => ReactNode;
  getItemProps?: (
    item: GameTabItem<TValue>,
    index: number
  ) => Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'role'>
    & Record<`data-${string}`, string | number | undefined>;
}

export function GameTabs<TValue extends string | number>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
  activeClassName,
  itemClassName,
  trailing,
  renderItem,
  getItemProps,
}: GameTabsProps<TValue>) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const pressTimerRef = useRef<number>();
  const [pressedValue, setPressedValue] = useState<TValue>();

  useEffect(() => () => {
    if (pressTimerRef.current !== undefined) {
      window.clearTimeout(pressTimerRef.current);
    }
  }, []);

  const showPressedFeedback = (nextValue: TValue) => {
    if (pressTimerRef.current !== undefined) {
      window.clearTimeout(pressTimerRef.current);
    }
    setPressedValue(nextValue);
    pressTimerRef.current = window.setTimeout(() => {
      setPressedValue(undefined);
      pressTimerRef.current = undefined;
    }, PRESS_FEEDBACK_MS);
  };

  const selectAt = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    showPressedFeedback(item.value);
    onChange(item.value);
    buttonsRef.current[index]?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    const enabledIndexes = items
      .map((item, index) => item.disabled ? -1 : index)
      .filter(index => index >= 0);
    if (!enabledIndexes.length) return;

    const enabledPosition = enabledIndexes.indexOf(currentIndex);
    let nextIndex: number | undefined;
    if (event.key === 'Home') nextIndex = enabledIndexes[0];
    if (event.key === 'End') nextIndex = enabledIndexes[enabledIndexes.length - 1];
    if (event.key === 'ArrowRight') {
      nextIndex = enabledIndexes[(enabledPosition + 1) % enabledIndexes.length];
    }
    if (event.key === 'ArrowLeft') {
      nextIndex = enabledIndexes[
        (enabledPosition - 1 + enabledIndexes.length) % enabledIndexes.length
      ];
    }
    if (nextIndex === undefined) return;
    event.preventDefault();
    selectAt(nextIndex);
  };

  return <div
    className={[styles.list, className].filter(Boolean).join(' ')}
    role="tablist"
    aria-label={ariaLabel}
    data-game-tabs-pressing={pressedValue !== undefined ? 'true' : undefined}
  >
    {items.map((item, index) => {
      const selected = item.value === value;
      const props = getItemProps?.(item, index);
      const buttonClassName = [
        styles.item,
        itemClassName,
        props?.className,
        selected ? activeClassName : '',
        pressedValue === item.value ? styles.pressed : '',
      ].filter(Boolean).join(' ');

      return <button
        {...props}
        key={item.value}
        ref={element => { buttonsRef.current[index] = element; }}
        type="button"
        role="tab"
        aria-selected={selected}
        tabIndex={selected ? 0 : -1}
        disabled={item.disabled}
        className={buttonClassName || undefined}
        data-game-tab-pressed={pressedValue === item.value ? 'true' : undefined}
        onClick={() => {
          showPressedFeedback(item.value);
          onChange(item.value);
        }}
        onKeyDown={event => handleKeyDown(event, index)}
      >
        {renderItem ? renderItem(item, selected, index) : item.label}
      </button>;
    })}
    {trailing}
  </div>;
}
