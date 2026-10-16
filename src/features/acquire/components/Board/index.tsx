import { Fragment, type CSSProperties } from 'react';
import { tilePreview } from '../../model/selectors';
import type { DisplaySnapshot } from '../../model/session';
import { companyColors, companyKeys, type Company } from '../../model/types';
import { AcquireMark } from '../AppShell';
import { CompanyGlyph } from '../CompanyGlyph';
import styles from './index.module.less';

type Props = { data: DisplaySnapshot; selected?: string; zoom?: boolean; onInspect?: (message: string) => void } & (
  { mode: 'live'; canSelect: boolean; onSelect: (tile: string) => void } | { mode: 'replay' }
);
const rows = 'ABCDEFGHI'.split('');
export function Board(props: Props) {
  const { data, selected, zoom } = props;
  const hand = data.playerData.tiles ?? [];
  const firstCompanyTile = Object.fromEntries(companyKeys.map(company => [
    company,
    rows.flatMap(row => Array.from({ length: 12 }, (_, index) => `${index + 1}${row}`))
      .find(key => data.roomData.tiles[key]?.belong === company),
  ])) as Partial<Record<Company, string>>;
  const renderCell = (key: string) => {
      const tile = data.roomData.tiles[key], owned = !!tile?.belong, inHand = props.mode === 'live' && hand.includes(key);
      const color = tile?.belong && tile.belong !== 'Blank' ? companyColors[tile.belong] : undefined;
      const preview = props.mode === 'live' && inHand && !owned ? tilePreview(data, key) : undefined;
      const selectable = props.mode === 'live' && props.canSelect && !!preview?.valid;
      const landmark = tile?.belong && tile.belong !== 'Blank' && firstCompanyTile[tile.belong] === key;
      const description = color ? tile?.belong : owned ? '独立地块' : '空地';
      const interactive = selectable || !!props.onInspect;
      const inert = !interactive;
      return <button type="button" key={key} className={`${styles.cell} ${owned ? styles.occupied : ''} ${tile?.belong === 'Blank' ? styles.neutral : ''} ${inHand && !owned ? styles.hand : ''} ${selectable ? styles.playable : ''} ${selected === key ? styles.selected : ''}`}
        style={color ? { '--co': color } as CSSProperties : undefined}
        aria-label={`地块 ${key}${inHand ? '，我的手牌' : `，${description}`}`}
        aria-pressed={selectable ? selected === key : undefined}
        aria-disabled={inert ? true : undefined}
        data-click-sound={selectable ? 'false' : undefined}
        tabIndex={inert ? -1 : undefined}
        onClick={() => {
          if (inert) return;
          if (props.mode === 'live' && selectable) props.onSelect(key);
          else props.onInspect?.(`${key} · ${description}`);
        }}>
        <span>{key}</span>{landmark && <CompanyGlyph company={tile.belong as Company} size={24} />}<i />
      </button>;
  };
  return <div className={`${styles.scroller} ${zoom ? styles.zoom : ''}`}><div className={styles.board}>
    <div className={styles.grid} role="group" aria-label="12 列 9 行，共 108 块地">
      <span className={`${styles.axis} ${styles.corner}`} />
      {Array.from({ length: 12 }, (_, index) => <span className={styles.axis} key={`column-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>)}
      {rows.map(row => <Fragment key={row}><span className={styles.axis}>{row}</span>
        {Array.from({ length: 12 }, (_, index) => renderCell(`${index + 1}${row}`))}
      </Fragment>)}
    </div>
    <div className={styles.engraving}><span>108 PARCELS · 7 COMPANIES</span><AcquireMark /><span>BUILD. MERGE. ACQUIRE.</span></div>
  </div></div>;
}
