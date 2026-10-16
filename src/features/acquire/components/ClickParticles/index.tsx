import { useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from 'react';
import styles from './index.module.less';

const STORAGE_KEY = 'acquire:click-particle-effect';
const CHANGE_EVENT = 'acquire-click-particle-effect-change';
const BURST_TTL = 1280;
const CLICK_SOUND_URL = '/acquire-sounds/ui-click.mp3';
const CLICK_SOUND_VOLUME = 0.36;

const effectOptions = [
  { key: 'glow', label: '光斑' },
  { key: 'magnetic', label: '吸住' },
  { key: 'ripple', label: '圆环' },
] as const;

type EffectKey = typeof effectOptions[number]['key'];

interface Particle {
  id: number;
  className: string;
  dx: number;
  dy: number;
  startX: number;
  startY: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  effect: EffectKey;
  particles: Particle[];
}

interface Props {
  picker?: boolean;
  scope?: 'document' | 'parent';
}

const palette = {
  gold: ['#f3d88e', '#d0ad63', '#fff1b8', '#8fb2b5'],
  glow: ['#f1d48b', '#8fb2b5'],
};

function isEffectKey(value: string | null): value is EffectKey {
  return effectOptions.some(option => option.key === value);
}

function initialEffect(): EffectKey {
  if (typeof window === 'undefined') return 'glow';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return isEffectKey(saved) ? saved : 'glow';
}

function particle(
  id: number,
  className: string,
  dx: number,
  dy: number,
  size: number,
  color: string,
  delay = 0,
  duration = 520,
  rotate = 0,
  startX = 0,
  startY = 0
): Particle {
  return { id, className, dx, dy, startX, startY, size, delay, duration, color, rotate };
}

function radialParticles(seed: number, count: number, distance: number, className: string, colors: string[]) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count + (seed % 11) * 0.035;
    const travel = distance + (index % 4) * 4;
    return particle(
      index,
      className,
      Math.cos(angle) * travel,
      Math.sin(angle) * travel,
      3 + (index % 3),
      colors[(seed + index) % colors.length],
      (index % 3) * 12,
      390 + (index % 4) * 36,
      angle * 180 / Math.PI
    );
  });
}

function createParticles(effect: EffectKey, seed: number): Particle[] {
  switch (effect) {
  case 'ripple':
    return [];
  case 'glow':
    return radialParticles(seed, 4, 13, 'pMist', palette.glow);
  case 'magnetic':
    return radialParticles(seed, 12, 27, 'pMagnet', palette.gold).map(item => ({
      ...item,
      startX: -item.dx,
      startY: -item.dy,
      dx: 0,
      dy: 0,
      duration: 560 + item.id % 3 * 45,
    }));
  default:
    return [];
  }
}

function shouldPlayClickSound(target: EventTarget | null) {
  if (!(target instanceof Element)) return true;
  return !target.closest(':disabled, [aria-disabled="true"]');
}

function playClickSound(audioRef: MutableRefObject<HTMLAudioElement | null>) {
  if (typeof Audio === 'undefined') return;
  const audio = audioRef.current ?? new Audio(CLICK_SOUND_URL);
  audioRef.current = audio;
  audio.preload = 'auto';
  audio.volume = CLICK_SOUND_VOLUME;
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}

export function ClickParticles({ picker = false, scope = 'document' }: Props) {
  const [effect, setEffect] = useState<EffectKey>(initialEffect);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    const handleEffectChange = (event: Event) => {
      const next = event instanceof CustomEvent && typeof event.detail === 'string' ? event.detail : window.localStorage.getItem(STORAGE_KEY);
      if (isEffectKey(next)) setEffect(next);
    };
    window.addEventListener(CHANGE_EVENT, handleEffectChange);
    window.addEventListener('storage', handleEffectChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleEffectChange);
      window.removeEventListener('storage', handleEffectChange);
    };
  }, []);

  useEffect(() => {
    const handleClick = (event: Event) => {
      if (!(event instanceof MouseEvent)) return;
      if (event.detail === 0 || event.button !== 0) return;
      if (event.target instanceof HTMLElement && event.target.closest('[data-click-particle-control="true"]')) return;
      if (scope === 'document' && event.target instanceof HTMLElement && event.target.closest('dialog')) return;
      if (shouldPlayClickSound(event.target)) playClickSound(clickAudioRef);
      const id = ++sequenceRef.current;
      const activeEffect = picker && isEffectKey(effectRef.current) ? effectRef.current : 'glow';
      const rect = rootRef.current?.getBoundingClientRect();
      const x = rect ? event.clientX - rect.left : event.clientX;
      const y = rect ? event.clientY - rect.top : event.clientY;
      setBursts(current => [
        ...current.slice(-5),
        { id, x, y, effect: activeEffect, particles: createParticles(activeEffect, id) },
      ]);
      const timer = window.setTimeout(() => {
        setBursts(current => current.filter(item => item.id !== id));
        timersRef.current = timersRef.current.filter(item => item !== timer);
      }, BURST_TTL);
      timersRef.current.push(timer);
    };

    const target = scope === 'parent' ? rootRef.current?.parentElement : document;
    const listenerOptions: AddEventListenerOptions = { capture: true, passive: true };
    target?.addEventListener('click', handleClick, listenerOptions);
    return () => {
      target?.removeEventListener('click', handleClick, listenerOptions);
      timersRef.current.forEach(timer => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [picker, scope]);

  const chooseEffect = (next: EffectKey) => {
    setEffect(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  };
  const selectedEffect = isEffectKey(effect) ? effect : 'glow';

  return <div ref={rootRef} className={styles.layer} aria-hidden={!picker}>
    {bursts.map(burst => <span key={burst.id} className={`${styles.burst} ${styles[burst.effect]}`} style={{
      '--x': `${burst.x}px`,
      '--y': `${burst.y}px`,
    } as CSSProperties}>
      <i className={styles.ring} />
      <i className={styles.flash} />
      {burst.particles.map(item => <i key={item.id} className={`${styles.particle} ${styles[item.className]}`} style={{
        '--dx': `${item.dx}px`,
        '--dy': `${item.dy}px`,
        '--start-x': `${item.startX}px`,
        '--start-y': `${item.startY}px`,
        '--size': `${item.size}px`,
        '--offset': `${item.size / -2}px`,
        '--delay': `${item.delay}ms`,
        '--duration': `${item.duration}ms`,
        '--color': item.color,
        '--rotate': `${item.rotate}deg`,
      } as CSSProperties} />)}
    </span>)}
    {picker && <div className={styles.controls} data-click-particle-control="true" aria-label="点击反馈效果选择">
      <span>点击反馈</span>
      <div>
        {effectOptions.map(option => <button key={option.key} type="button" aria-pressed={selectedEffect === option.key}
          onClick={() => chooseEffect(option.key)}>{option.label}</button>)}
      </div>
    </div>}
  </div>;
}
