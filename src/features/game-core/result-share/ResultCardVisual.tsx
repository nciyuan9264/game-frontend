import type { ResultCardTheme } from './themes';
import styles from './ResultCardVisual.module.less';

function GameEmblem({ design }: { design: ResultCardTheme }) {
  switch (design.emblem) {
    case 'acquire':
      return <svg viewBox="0 0 120 120">
        <path d="M18 98V55h22v43M48 98V27h25v71M81 98V43h21v55M12 98h96" />
        <path d="M55 39h11M55 50h11M55 61h11M55 72h11" />
      </svg>;
    case 'splendor':
      return <svg viewBox="0 0 120 120">
        <path d="m60 13 34 25-13 51-21 18-21-18-13-51Z" />
        <path d="m26 38 34 69 34-69M39 89l21-76 21 76M26 38h68" />
      </svg>;
    case 'forsale':
      return <svg viewBox="0 0 120 120">
        <path d="M20 98h80M29 98V50l31-25 31 25v48M47 98V70h26v28" />
        <path d="M79 25h22v31M15 34h31" />
      </svg>;
    case 'davinci':
      return <svg viewBox="0 0 120 120">
        <rect x="17" y="19" width="86" height="82" rx="3" />
        <path d="M34 39h12v12H34zM54 39h12v12H54zM74 39h12v12H74zM34 59h12v12H34zM54 59h12v12H54zM74 59h12v12H74z" />
        <path d="M35 84h50M60 76v16" />
      </svg>;
    case 'fugitive':
      return <svg viewBox="0 0 120 120">
        <path d="M17 89c15-27 23-4 38-27s24-2 48-35" />
        <circle cx="18" cy="89" r="7" />
        <circle cx="103" cy="27" r="7" />
        <path d="m73 35 8-12 8 12M35 74l8 12 8-12" />
      </svg>;
    case 'loveletter':
      return <svg viewBox="0 0 120 120">
        <path d="M14 35h92v58H14zM14 35l46 35 46-35M14 93l34-34M106 93 72 59" />
        <circle cx="60" cy="70" r="12" />
        <path d="m55 70 4 4 8-9" />
      </svg>;
    case 'sixnimmt':
      return <svg viewBox="0 0 120 120">
        <path d="M31 36 18 18M89 36l13-18M34 39c7-11 45-11 52 0 9 15 9 43-3 55-9 9-37 9-46 0-12-12-12-40-3-55Z" />
        <circle cx="45" cy="58" r="4" />
        <circle cx="75" cy="58" r="4" />
        <path d="M43 78c8 7 26 7 34 0M60 72v14" />
      </svg>;
    case 'cantstop':
      return <svg viewBox="0 0 120 120">
        <path d="m16 94 26-49 16 25 16-40 30 64Z" />
        <path d="M26 94c12-12 21-15 32-24 10-8 12-19 16-40" />
        <circle cx="26" cy="94" r="5" />
        <circle cx="74" cy="30" r="5" />
      </svg>;
    case 'warchest':
      return <svg viewBox="0 0 120 120">
        <path d="m60 12 39 13v31c0 25-17 41-39 52-22-11-39-27-39-52V25Z" />
        <path d="M60 27v62M36 48h48M41 75l19 14 19-14" />
      </svg>;
    case 'yinsh':
      return <svg viewBox="0 0 120 120">
        <circle cx="44" cy="64" r="29" />
        <circle cx="77" cy="52" r="29" />
        <circle cx="44" cy="64" r="17" />
        <circle cx="77" cy="52" r="17" />
      </svg>;
    case 'othello':
      return <svg viewBox="0 0 120 120">
        <circle cx="45" cy="60" r="31" />
        <path d="M45 29a31 31 0 0 1 0 62Z" />
        <circle cx="82" cy="78" r="16" />
      </svg>;
    case 'hex':
      return <svg viewBox="0 0 120 120">
        <path d="m60 12 36 21v42L60 108 24 87V45Z" />
        <path d="m24 45 36 21 36-21M60 66v42M42 34l36 21M42 76l36 21" />
      </svg>;
    case 'quoridor':
      return <svg viewBox="0 0 120 120">
        <path d="M20 18v84h80V18M41 18v63h39V39H59v21M20 81h21" />
        <circle cx="31" cy="32" r="8" />
        <circle cx="88" cy="90" r="8" />
      </svg>;
    case 'onitama':
      return <svg viewBox="0 0 120 120">
        <path d="M18 27c23 7 61 7 84 0M27 44h66M34 36v69M86 36v69M27 68h66M52 43v25M68 43v25M27 104h20M73 104h20" />
      </svg>;
    case 'hive':
      return <svg viewBox="0 0 120 120">
        <path d="m60 9 42 24v54l-42 24-42-24V33Z" />
        <path d="m60 28 18 10v21L60 69 42 59V38ZM42 59 24 70v17l18 10 18-10V69M78 59l18 11v17L78 97 60 87" />
      </svg>;
  }
}

export function ResultCardVisual({
  design,
  className = '',
}: {
  design: ResultCardTheme;
  className?: string;
}) {
  return <figure
    className={`${styles.visual} ${className}`}
    data-result-motif={design.motif}
    aria-hidden="true"
  >
    {design.artwork && <span
      className={`${styles.artwork} ${styles[design.artwork.treatment]}`}
    >
      <img
        src={design.artwork.src}
        alt=""
        style={{ objectPosition: design.artwork.position }}
        data-result-artwork
        onError={event => {
          event.currentTarget.hidden = true;
        }}
      />
    </span>}
    <span className={styles.emblem}>
      <GameEmblem design={design} />
    </span>
  </figure>;
}
