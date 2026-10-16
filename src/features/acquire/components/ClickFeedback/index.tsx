import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { playAcquireSound, type AcquireSound } from '../../hooks/useAcquireAudio';
import styles from './index.module.less';

const BURST_TTL = 760;

const TAB_SELECTOR = [
  '[role="tab"]',
  '[data-click-sound="tab"]',
].join(',');

const BUTTON_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="switch"]',
  '[data-click-sound="button"]',
].join(',');

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

function explicitSound(target: Element): AcquireSound | undefined {
  const value = target.closest('[data-click-sound]')?.getAttribute('data-click-sound');
  if (value === 'button') return 'button-click';
  if (value === 'tab') return 'tab-click';
  if (value === 'ui') return 'ui-click';
  return undefined;
}

function resolveClickSound(target: EventTarget | null): AcquireSound | undefined {
  if (!(target instanceof Element)) return 'ui-click';
  if (target.closest('[data-click-sound="false"], :disabled, [aria-disabled="true"]')) return undefined;
  const explicit = explicitSound(target);
  if (explicit) return explicit;
  if (target.closest(TAB_SELECTOR)) return 'tab-click';
  if (target.closest(BUTTON_SELECTOR)) return 'button-click';
  return 'ui-click';
}

function createParticles(seed: number): Particle[] {
  const colors = ['#f1d48b', '#8fb2b5', '#fff1b8'];
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

export function ClickFeedback() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const handleClick = (event: Event) => {
      if (!(event instanceof MouseEvent)) return;
      if (event.detail === 0 || event.button !== 0) return;
      const sound = resolveClickSound(event.target);
      if (sound) playAcquireSound(sound);
      if (sound !== 'ui-click') return;
      const id = ++sequenceRef.current;
      const rect = rootRef.current?.getBoundingClientRect();
      const x = rect ? event.clientX - rect.left : event.clientX;
      const y = rect ? event.clientY - rect.top : event.clientY;
      setBursts(current => [
        ...current.slice(-5),
        { id, x, y, particles: createParticles(id) },
      ]);
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
  }, []);

  return <div ref={rootRef} className={styles.layer} aria-hidden="true">
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
