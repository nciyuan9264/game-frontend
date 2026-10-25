import { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Download,
  Flag,
  Footprints,
  Info,
  Layers,
  Plane,
  Search,
  X,
} from 'lucide-react';
import { getProfile } from '@/features/game-core/api/auth';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { AppShell } from '../../components/AppShell';
import {
  CardFace,
  Eyebrow,
  Modal,
  pad,
} from '../../components/Visual';
import {
  card,
  deckCsv,
  DECK,
  DECK_SOURCE,
  DECK_SOURCE_PAGE,
} from '../../model/deck';
import type { Card } from '../../model/types';

type Group = 'all' | 'opening' | 'low' | 'mid' | 'high';

const groups: Array<{ id: Group; title: string }> = [
  { id: 'all', title: '全部 43 张' },
  { id: 'opening', title: '起始牌' },
  { id: 'low', title: 'Ⅰ · 04–14' },
  { id: 'mid', title: 'Ⅱ · 15–28' },
  { id: 'high', title: 'Ⅲ · 29–41' },
];

const cardGroup = (value: Card): Exclude<Group, 'all'> =>
  [0, 1, 2, 3, 42].includes(value.number)
    ? 'opening'
    : value.number <= 14 ? 'low'
      : value.number <= 28 ? 'mid' : 'high';

const groupName = (value: Card) => ({
  opening: '起点 / 初始手牌',
  low: 'Ⅰ · 04–14',
  mid: 'Ⅱ · 15–28',
  high: 'Ⅲ · 29–41',
})[cardGroup(value)];

export default function CardLibrary() {
  const profile = useAsyncResource(getProfile);
  const [group, setGroup] = useState<Group>('all');
  const [sprint, setSprint] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number>();
  const [exported, setExported] = useState(false);
  const filtered = DECK.filter(value =>
    (group === 'all' || cardGroup(value) === group)
    && (sprint === 'all'
      || (sprint === 'none'
        ? [0, 42].includes(value.number)
        : value.sprint === Number(sprint)))
    && (!query.trim() || value.number === Number(query)));
  const entry = selected == null ? undefined : card(selected);
  const clear = () => {
    setGroup('all');
    setSprint('all');
    setQuery('');
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([deckCsv()], {
      type: 'text/csv;charset=utf-8',
    }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'fugitive-base-deck-0-42.csv';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
  };

  return <AppShell title="地点牌库" profile={profile.data}>
    <main className="page-content library-page" aria-hidden={selected != null}>
      <div className="page-heading split-heading"><div>
        <Eyebrow>EVERY NUMBER TELLS A STORY</Eyebrow>
        <h1>地点牌库<span className="heading-count">43</span></h1>
        <p>从 00 到 42，每一张牌的去向，都有迹可循。</p></div>
        <button className="button secondary" type="button" onClick={download}>
          <Download size={15} />导出完整 CSV</button>
      </div>
      <div className="data-verification"><CheckCircle2 size={17} />
        <span><b>43 张基础牌数值已核对</b>
          <small>依据 Fowers 官方数字试玩 · 卡面为原创插画</small></span>
        <a href={DECK_SOURCE_PAGE} target="_blank" rel="noreferrer">
          来源<ArrowUpRight size={14} /></a>
      </div>
      <div className="catalog-layout"><section className="catalog-main">
        <div className="catalog-mobile-key"><span><Footprints size={13} />
          奇数 +1 · 偶数 +2</span><small>00、42 不可冲刺</small></div>
        <div className="catalog-toolbar"><div className="tabs">
          {groups.map(item => <button type="button" key={item.id}
            aria-pressed={group === item.id}
            className={group === item.id ? 'active' : ''}
            onClick={() => setGroup(item.id)}>{item.title}</button>)}
        </div><label className="search-field"><Search size={15} />
          <input aria-label="搜索牌号" inputMode="numeric" placeholder="搜索牌号"
            value={query} onChange={event =>
              setQuery(event.target.value.replace(/\D/g, '').slice(0, 2))} />
          {query && <button type="button" aria-label="清空牌号"
            onClick={() => setQuery('')}><X size={13} /></button>}
        </label></div>
        <div className="catalog-subbar"><div className="filter-chips">
          {[
            { id: 'all', title: '全部冲刺值' },
            { id: '1', title: '+1 脚印' },
            { id: '2', title: '+2 脚印' },
            { id: 'none', title: '起点 / 终点' },
          ].map(item => <button type="button" key={item.id}
            className={sprint === item.id ? 'active' : ''}
            aria-pressed={sprint === item.id}
            onClick={() => setSprint(item.id)}>{item.title}</button>)}
        </div><span aria-live="polite">{filtered.length} / 43 张</span></div>
        <div className="catalog-grid">{filtered.map(value =>
          <button type="button" key={value.number} className="catalog-entry"
            aria-label={`查看牌库 ${value.number} 号`}
            onClick={() => setSelected(value.number)}>
            <CardFace card={value} compact /><span>
              {value.number === 0 ? <><Flag size={10} />固定起点</>
                : value.number === 42 ? <><Plane size={11} />逃脱终点</>
                  : <><Footprints size={10} />冲刺 +{value.sprint}</>}
            </span>
          </button>)}</div>
        {!filtered.length && <div className="empty-state catalog-empty">
          <Search size={30} /><h3>没有符合条件的地点牌。</h3>
          <p>牌号范围为 0–42，试试其他号码或清除筛选。</p>
          <button className="button secondary" type="button" onClick={clear}>
            重置牌库筛选</button>
        </div>}
        <div className="catalog-caption"><Layers size={13} />
          数字与脚印均为实时文本，点击任意牌查看归属与用途。</div>
      </section>
      <aside className="catalog-aside">
        <section className="dark-panel deck-key"><Eyebrow>THE COMPLETE BASE DECK</Eyebrow>
          <h3>记住这个规律。</h3>
          <div className="sprint-key"><span><Footprints size={18} /><b>+1</b></span>
            <div><b>奇数地点牌</b><small>01、03、05 … 41</small></div><em>21 张</em></div>
          <div className="sprint-key"><span><Footprints size={18} /><b>+2</b></span>
            <div><b>偶数地点牌</b><small>02、04、06 … 40</small></div><em>20 张</em></div>
          <div className="special-key"><Flag size={15} /><span>
            <b>00 是固定起点</b><small>不在手牌中，不能用于冲刺。</small></span></div>
          <div className="special-key"><Plane size={15} /><span>
            <b>42 是逃脱终点</b><small>起始持有，但不能用于冲刺。</small></span></div>
        </section>
        <section className="dark-panel source-panel">
          <div className="section-title"><h3><CheckCircle2 size={15} />数据核对记录</h3>
            <span>43 / 43</span></div>
          <p>核对发行方数字试玩中的冲刺计算及终点限制，逐张保存为完整编号表。</p>
          <a href={DECK_SOURCE} target="_blank" rel="noreferrer">
            查看公开数值依据<ArrowUpRight size={13} /></a>
          <p className="source-version">Fowers demo · v0.09.0<br />二版基础 · 不含 Shift</p>
          <div className="notice"><Info size={14} />
            <span>这里是基础地点牌的数值库，不是官方美术资源或扩展牌库。</span></div>
        </section>
      </aside></div>
      {exported && <div className="export-confirm" role="status"><Check size={14} />
        已发起导出：43 张牌，含冲刺值、分组与来源。
        <button type="button" aria-label="关闭导出提示"
          onClick={() => setExported(false)}><X size={13} /></button></div>}
    </main>

    {entry && <Modal title={`${pad(entry.number)} 号地点牌`}
      kicker="CARD DOSSIER / VERIFIED BASE DATA" className="card-dossier"
      onClose={() => setSelected(undefined)}
      footer={<button className="button primary" type="button"
        onClick={() => setSelected(undefined)}>返回牌库<Check size={15} /></button>}>
      <div className="dossier-top"><CardFace card={entry} /><div>
        <span className="verified-chip"><CheckCircle2 size={12} />数值已核对</span>
        <h3>{entry.number === 0 ? '追逐从这里开始'
          : entry.number === 42 ? '城市的另一端' : '一张牌，两种可能'}</h3>
        <dl><div><dt>编号</dt><dd>{pad(entry.number)} / 42</dd></div>
          <div><dt>归属</dt><dd>{groupName(entry)}</dd></div>
          <div><dt>冲刺点数</dt><dd>{[0, 42].includes(entry.number)
            ? '不可用作冲刺' : `+${entry.sprint} 脚印`}</dd></div></dl>
      </div></div>
      <p>{entry.number === 0
        ? '0 号开局正面朝上，固定为路线起点；不是可打出的手牌。'
        : entry.number === 42
          ? '42 号由逃亡者起始持有。合法抵达时检查最终追缉条件，不得用于冲刺。'
          : `可作为更大的下一处藏身点，也可以压在新地点下，提供 +${entry.sprint} 冲刺。`}
      </p>
    </Modal>}
  </AppShell>;
}
