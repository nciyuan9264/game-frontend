import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import {
  datePresets,
  validateDateRange,
  type AnalyticsDatePresetKey,
  type DateRange,
} from '../hooks/useOverviewDateRange';
import styles from '../index.module.less';

interface DateRangePickerProps {
  value: DateRange;
  today: string;
  allowAllTime?: boolean;
  activePreset: AnalyticsDatePresetKey | 'custom';
  loading: boolean;
  onSelectPreset: (preset: AnalyticsDatePresetKey) => void;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({
  value,
  today,
  allowAllTime = false,
  activePreset,
  loading,
  onSelectPreset,
  onChange,
}: DateRangePickerProps) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setDraft(value);
      setMessage('');
    }
    setOpen(current => !current);
  };

  const choosePreset = (preset: AnalyticsDatePresetKey) => {
    onSelectPreset(preset);
    setOpen(false);
  };

  const apply = () => {
    const error = validateDateRange(draft, today);
    setMessage(error);
    if (error) return;
    onChange(draft);
    setOpen(false);
  };

  const presets = allowAllTime
    ? [{ key: 'all_time' as const, label: '全部时间' }, ...datePresets]
    : datePresets;
  const rangeLabel = activePreset === 'all_time'
    ? '全部时间'
    : [value.start, value.end].join(' 至 ');

  return (
    <div className={styles.dateRangePicker} ref={root}>
      <button
        type="button"
        className={styles.dateRangeTrigger}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={'选择数据日期范围，当前 ' + rangeLabel}
      >
        <CalendarDays size={16} aria-hidden="true" />
        <span>{rangeLabel}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open && (
        <div className={styles.dateRangePopover} role="dialog" aria-label="选择数据日期范围">
          <div className={styles.datePresetGrid} aria-label="快捷日期范围">
            {presets.map(option => (
              <button
                type="button"
                key={option.key}
                data-full-width={option.key === 'all_time' || undefined}
                onClick={() => choosePreset(option.key)}
                aria-pressed={activePreset === option.key}
              >
                <span>{option.label}</span>
                {activePreset === option.key && <Check size={13} aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div className={styles.dateRangeInputs}>
            <label>
              <span>开始日期</span>
              <input
                type="date"
                value={draft.start}
                max={today}
                onChange={event => setDraft(current => ({ ...current, start: event.target.value }))}
              />
            </label>
            <label>
              <span>结束日期</span>
              <input
                type="date"
                value={draft.end}
                max={today}
                onChange={event => setDraft(current => ({ ...current, end: event.target.value }))}
              />
            </label>
          </div>

          {message && <p className={styles.dateRangeError} role="alert">{message}</p>}

          <footer className={styles.dateRangeActions}>
            <button type="button" onClick={() => setOpen(false)}>取消</button>
            <button type="button" onClick={apply} disabled={loading}>应用范围</button>
          </footer>
        </div>
      )}
    </div>
  );
}
