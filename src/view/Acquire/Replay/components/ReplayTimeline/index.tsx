import React, { useEffect, useRef, useState } from 'react';
import { motion, useDragControls } from 'motion/react';
import { backendName2FrontendName } from '@/util/user';
import type { EventMeta } from '@/types/history';
import styles from './index.module.less';

interface ReplayTimelineProps {
  events: EventMeta[];
  step: number;
  setStep: (s: number) => void;
  loading?: boolean;
}

const cmdLabelMap: Record<string, string> = {
  game_place_tile: '放牌',
  game_create_company: '建司',
  game_buy_stock: '买股',
  game_merging_selection: '合并选',
  game_merging_settle: '合并结',
  turn_timeout: '超时',
};

const ReplayTimeline: React.FC<ReplayTimelineProps> = ({
  events,
  step,
  setStep,
  loading,
}) => {
  const [minimized, setMinimized] = useState(false);
  const dragControls = useDragControls();
  const total = events.length;

  const goPrev = () => setStep(Math.max(-1, step - 1));
  const goNext = () => setStep(Math.min(total - 1, step + 1));
  const goStart = () => setStep(-1);
  const goEnd = () => setStep(total - 1);

  const activeDotRef = useRef<HTMLButtonElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    activeDotRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [step]);

  // 鼠标滚轮纵向滚动 → 横向滚动 dot 列表
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // 纯纵向滚动才劫持，避免抢走横向触控板手势
      if (e.deltaY === 0) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [minimized]);

  return (
    <div className={styles.wrapper}>
      <motion.div
        className={`${styles.timeline} ${minimized ? styles.timelineMinimized : ''}`}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
      >
      <div
        className={styles.dragHandle}
        onPointerDown={(e) => {
          dragControls.start(e);
        }}
      >
        <div className={styles.dragHandleTitle}>⠿ 时间轴</div>
        <div className={styles.dragHandleActions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setMinimized((v) => !v)}
            title={minimized ? '展开' : '最小化'}
          >
            {minimized ? '▢' : '—'}
          </button>
        </div>
      </div>
      {minimized ? (
        <div className={styles.minimizedBody}>
          <div className={styles.controls}>
            <button type="button" onClick={goPrev} disabled={step <= -1}>
              ‹
            </button>
            <span className={styles.stepInfo}>
              {step + 1} / {total}
              {loading && <span className={styles.loadingDot}>...</span>}
            </span>
            <button type="button" onClick={goNext} disabled={step >= total - 1}>
              ›
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.statusRow}>
            <span>对局回放</span>
            <span className={styles.stepInfo}>
              {step + 1} / {total}
              {loading && <span className={styles.loadingDot}>...</span>}
            </span>
          </div>
          <div className={styles.controls}>
            <button type="button" onClick={goStart} disabled={step === -1}>
              « 初始
            </button>
            <button type="button" onClick={goPrev} disabled={step <= -1}>
              ‹ 上一步
            </button>
            <button type="button" onClick={goNext} disabled={step >= total - 1}>
              下一步 ›
            </button>
            <button
              type="button"
              onClick={goEnd}
              disabled={total === 0 || step === total - 1}
            >
              终局 »
            </button>
          </div>
          <div className={styles.track} ref={trackRef}>
            <div className={styles.trackInner}>
              <button
                type="button"
                ref={step === -1 ? activeDotRef : undefined}
                className={`${styles.dot} ${step === -1 ? styles.dotActive : ''}`}
                onClick={() => setStep(-1)}
                title="初始状态"
              >
                <span className={styles.dotIndex}>0</span>
                <span className={styles.dotLabel}>起</span>
              </button>
              {events.map((e) => {
                const active = step === e.seq;
                return (
                  <button
                    key={e.seq}
                    type="button"
                    ref={active ? activeDotRef : undefined}
                    className={`${styles.dot} ${active ? styles.dotActive : ''}`}
                    onClick={() => setStep(e.seq)}
                    title={`#${e.seq + 1} ${backendName2FrontendName(e.playerID)} - ${e.cmdType}`}
                  >
                    <span className={styles.dotIndex}>{e.seq + 1}</span>
                    <span className={styles.dotLabel}>
                      {cmdLabelMap[e.cmdType] ?? e.cmdType}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
    </div>
  );
};

export default ReplayTimeline;
