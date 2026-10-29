import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import styles from './index.module.less';

const BURST_TTL = 760;
const TAB_SELECTOR = ['[role="tab"]', '[data-click-sound="tab"]'].join(',');
const BUTTON_SELECTOR = [
  'button', 'a[href]', 'input', 'select', 'textarea', 'summary',
  '[role="button"]', '[role="checkbox"]', '[role="menuitem"]', '[role="option"]',
  '[role="radio"]', '[role="switch"]', '[data-click-sound="button"]',
].join(',');

export type ClickSound = 'ui-click' | 'button-click' | 'tab-click' | string;
export type ClickSoundPlayer = (sound: ClickSound) => void;

interface Particle {
  id: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  color: string;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  particles: Particle[];
}

function explicitSound(target: Element): ClickSound | undefined {
  const value = target.closest('[data-click-sound]')?.getAttribute('data-click-sound');
  if (!value || value === 'false') return undefined;
  if (value === 'button') return 'button-click';
  if (value === 'tab') return 'tab-click';
  if (value === 'ui') return 'ui-click';
  return value;
}

export function resolveClickSound(target: EventTarget | null): ClickSound | undefined {
  if (!(target instanceof Element)) return 'ui-click';
  if (target.closest('[data-click-sound="false"], :disabled, [aria-disabled="true"]')) return undefined;
  const explicit = explicitSound(target);
  if (explicit) return explicit;
  if (target.closest(TAB_SELECTOR)) return 'tab-click';
  if (target.closest(BUTTON_SELECTOR)) return 'button-click';
  return 'ui-click';
}

export function resolveClickEventSound(event: Event): ClickSound | undefined {
  if (!(event instanceof MouseEvent) || event.detail === 0 || event.button !== 0) return undefined;
  return resolveClickSound(event.target);
}

function createParticles(seed: number): Particle[] {
  const colors = [
    'var(--game-feedback-particle-1, #f1d48b)',
    'var(--game-feedback-particle-2, #8fb2b5)',
    'var(--game-feedback-particle-3, #fff1b8)',
  ];
  return Array.from({ length: 5 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 5 + (seed % 7) * 0.04;
    const distance = 14 + index % 2 * 5;
    return {
      id: index,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: 3 + index % 3,
      delay: index * 10,
      color: colors[(seed + index) % colors.length],
    };
  });
}

export interface ClickFeedbackProps {
  scopeRef?: RefObject<HTMLElement>;
  playSound?: boolean;
  soundPlayer?: ClickSoundPlayer;
  className?: string;
}

export function ClickFeedback({
  scopeRef,
  playSound = true,
  soundPlayer,
  className = '',
}: ClickFeedbackProps = {}) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const handleClick = (event: Event) => {
      if (!(event instanceof MouseEvent)) return;
      if (scopeRef && (!(event.target instanceof Node) || !scopeRef.current?.contains(event.target))) return;
      const sound = resolveClickEventSound(event);
      if (!sound) return;
      if (playSound && sound) soundPlayer?.(sound);
      if (sound !== 'ui-click') return;
      if (!scopeRef && event.target instanceof Element && event.target.closest('dialog')) return;
      const id = ++sequenceRef.current;
      const rect = rootRef.current?.getBoundingClientRect();
      const x = rect ? event.clientX - rect.left : event.clientX;
      const y = rect ? event.clientY - rect.top : event.clientY;
      setBursts(current => [...current.slice(-5), { id, x, y, particles: createParticles(id) }]);
      const timer = window.setTimeout(() => {
        setBursts(current => current.filter(item => item.id !== id));
        timersRef.current = timersRef.current.filter(item => item !== timer);
      }, BURST_TTL);
      timersRef.current.push(timer);
    };
    document.addEventListener('click', handleClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      timersRef.current.forEach(timer => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [playSound, scopeRef, soundPlayer]);

  return <div ref={rootRef} className={`${styles.layer} ${className}`} aria-hidden="true">
    {bursts.map(burst => <span key={burst.id} className={styles.burst} style={{
      '--x': `${burst.x}px`,
      '--y': `${burst.y}px`,
    } as CSSProperties}>
      <i className={styles.ring} />
      <i className={styles.flash} />
      {burst.particles.map(item => <i key={item.id} className={styles.particle} style={{
        '--dx': `${item.dx}px`,
        '--dy': `${item.dy}px`,
        '--size': `${item.size}px`,
        '--offset': `${item.size / -2}px`,
        '--delay': `${item.delay}ms`,
        '--color': item.color,
      } as CSSProperties} />)}
    </span>)}
  </div>;
}
