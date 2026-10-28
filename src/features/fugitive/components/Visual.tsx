import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import {
  ArrowUpRight,
  Flag,
  Footprints,
  Plane,
  Route,
  X,
} from 'lucide-react';
import { DECK_SOURCE_PAGE } from '../model/deck';
import type { Card, Role } from '../model/types';

export const ART = {
  hero: 'https://cdn-tos-cn.bytedance.net/obj/tiktok-web-ai-cn/ff3c115f3fd61a4ca2ec4c415d748e87d6930984e6d2ed4878157b5d387b70c3.webp',
  scenes: 'https://cdn-tos-cn.bytedance.net/obj/tiktok-web-ai-cn/de49b943ca6b19142d1b803bcb1f9a523b68332eb6f53ae350efc71db74ed9de.webp',
  people: 'https://cdn-tos-cn.bytedance.net/obj/tiktok-web-ai-cn/fd29d16b16cb252ced810f35d192b0557fb81d556bef3905109fff9974e0d92a.webp',
};

export const roleName = (role: Role) =>
  role === 'fugitive' ? '逃亡者' : '追捕者';
export const pad = (value: number) => String(value).padStart(2, '0');

export function Brand({ small = false }: { small?: boolean }) {
  return <div className={`brand ${small ? 'brand-small' : ''}`} data-game-brand>
    <span className="brand-mark"><Route size={21} /></span>
    <span><b>FUGITIVE</b><small>逃 亡 者</small></span>
  </div>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

export function Scene({
  index = 0,
  className = '',
}: {
  index?: number;
  className?: string;
}) {
  return <span className={`scene-art ${className}`} aria-hidden="true">
    <span style={{
      backgroundImage: `url(${ART.scenes})`,
      backgroundPosition: `${index % 3 * 50}% ${Math.floor(index / 3) % 2 * 100}%`,
    }} />
  </span>;
}

export function Portrait({
  role = 'fugitive',
  className = '',
}: {
  role?: Role;
  className?: string;
}) {
  return <span className={`portrait portrait-${role} ${className}`} aria-hidden="true">
    <img src={ART.people} alt="" />
  </span>;
}

export function Modal({
  title,
  kicker = 'FUGITIVE / FIELD NOTES',
  children,
  footer,
  onClose,
  className = '',
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() =>
      element.current?.querySelector<HTMLElement>(
        'button,input,select,[tabindex="0"]',
      )?.focus(), 50);
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const items = Array.from(element.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]),input:not([disabled]),select,a[href],[tabindex="0"]',
      ) ?? []);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handler);
      previous?.focus();
    };
  }, [onClose]);
  return <div className="modal-backdrop"
    onClick={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
    <div className={`modal ${className}`} role="dialog" aria-modal="true"
      aria-label={title} ref={element}>
      <div className="sheet-handle" />
      <header className="modal-head"><div><Eyebrow>{kicker}</Eyebrow>
        <h2>{title}</h2></div>
        <button className="icon-button" aria-label="关闭弹窗"
          onClick={onClose}><X size={21} /></button></header>
      <div className="modal-body">{children}</div>
      {footer && <footer className="modal-foot">{footer}</footer>}
    </div>
  </div>;
}

const locations = [
  '消防后巷',
  '午夜餐馆',
  '河岸铁桥',
  '中央车站',
  '旧港仓库',
  '城外机场',
];

export function CardFace({
  card,
  compact = false,
  selected = false,
  onClick,
  disabled = false,
  tag = '',
}: {
  card: Card;
  compact?: boolean;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  tag?: string;
}) {
  const index = card.number === 42
    ? 5
    : card.number === 0
      ? 0
      : Math.floor(card.number / 7) % 5;
  const content = <><div className="card-corner">
    <strong>{pad(card.number)}</strong>
    {card.number === 42
      ? <Plane size={17} />
      : card.number === 0
        ? <Flag size={15} />
        : <span><Footprints size={13} />+{card.sprint}</span>}
  </div><Scene index={index} /><div className="card-location">
    <span>{locations[index]}</span>
    <small>{card.number === 42
      ? 'ESCAPE'
      : card.number === 0 ? 'START' : 'HIDEOUT'}</small>
  </div>{tag && <span className="card-tag">{tag}</span>}</>;
  const className = `playing-card ${compact ? 'compact-card' : ''} `
    + `${selected ? 'selected' : ''} `
    + `${card.number === 42 ? 'escape-card' : ''}`;
  return onClick
    ? <button className={className} disabled={disabled}
        aria-label={`选择地点 ${card.number}`} onClick={onClick}>{content}</button>
    : <div className={className}>{content}</div>;
}

export function CardBack() {
  return <div className="card-back"><div className="back-inner">
    <span className="back-brand">FUGITIVE</span>
    <Route size={35} strokeWidth={1} /><b>?</b>
    <span className="back-caption">未 知 地 点</span>
  </div></div>;
}

export function SourceLinks() {
  return <div className="source-links"><span>二版基础规则 · 不含 Shift</span>
    <a href="https://www.fowers.games/products/fugitive" target="_blank"
      rel="noreferrer">发行方介绍 <ArrowUpRight size={13} /></a>
    <a href={DECK_SOURCE_PAGE} target="_blank" rel="noreferrer">
      Fowers 数字试玩 <ArrowUpRight size={13} /></a>
  </div>;
}
