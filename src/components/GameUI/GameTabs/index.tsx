import {
  useRef,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

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

  const selectAt = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
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

  return <div className={className} role="tablist" aria-label={ariaLabel}>
    {items.map((item, index) => {
      const selected = item.value === value;
      const props = getItemProps?.(item, index);
      const buttonClassName = [
        itemClassName,
        props?.className,
        selected ? activeClassName : '',
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
        onClick={() => onChange(item.value)}
        onKeyDown={event => handleKeyDown(event, index)}
      >
        {renderItem ? renderItem(item, selected, index) : item.label}
      </button>;
    })}
    {trailing}
  </div>;
}
