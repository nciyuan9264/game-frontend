import type { CSSProperties } from 'react';
import type { Disc as DiscValue, Side } from '../../model/types';
import styles from './index.module.less';

export function Disc({
  side,
  className = '',
}: {
  side: Side;
  className?: string;
}) {
  return <span
    className={`${styles.disc} ${styles[side]} ${className}`}
    aria-hidden="true"
  ><span><i /><i /></span></span>;
}

export function BrandMark({
  size = 34,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return <span
    className={`${styles.brandMark} ${className}`}
    style={{ '--mark-size': `${size}px` } as CSSProperties}
    aria-hidden="true"
  ><i /><i /></span>;
}

export function Brand({ small = false }: { small?: boolean }) {
  return <span className={`${styles.brand} ${small ? styles.small : ''}`}>
    <BrandMark size={small ? 23 : 35} />
    <span><strong>OTHELLO</strong><small>黑 白 棋</small></span>
  </span>;
}

export function MiniBoard({
  board,
  last,
  className = '',
}: {
  board: DiscValue[];
  last?: number;
  className?: string;
}) {
  return <span className={`${styles.miniBoard} ${className}`} aria-hidden="true">
    {board.map((cell, index) => <i
      key={index}
      className={index === last ? styles.last : ''}
    >{cell && <Disc side={cell} />}</i>)}
  </span>;
}

const opening: DiscValue[] = Array.from({ length: 64 }, () => '');
opening[27] = 'white';
opening[28] = 'black';
opening[35] = 'black';
opening[36] = 'white';

export function OthelloStillLife() {
  return <span className={styles.stillLife} aria-label="经典黑白棋开局">
    <span className={styles.stillBoard}><MiniBoard board={opening} /></span>
    <span className={`${styles.floatingDisc} ${styles.floatingBlack}`}>
      <Disc side="black" />
    </span>
    <span className={`${styles.floatingDisc} ${styles.floatingWhite}`}>
      <Disc side="white" />
    </span>
    <small>TWO COLOURS.<br />ENDLESS POSSIBILITIES.</small>
  </span>;
}
