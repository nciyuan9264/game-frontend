import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, Check, Clock, Coins, Layers, LoaderCircle, Lock, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { AnimatedValue } from '../../components/AnimatedValue';
import { PlayerAvatar } from '../../components/AppShell';
import { CompanyGlyph } from '../../components/CompanyGlyph';
import { ResponsiveDialog } from '../../components/ResponsiveDialog';
import { Feedback } from '@/components/GameUI/Panel';
import type { AcquireInteraction } from '../../hooks/useAcquireInteraction';
import type { AcquireSession } from '../../hooks/useAcquireSession';
import { buyPreview, mergeCompanies, mergePreview, mergeSettlementPlayer, pendingMergePlayers, settledMergeCompanies } from '../../model/selectors';
import { money, playerName, type GameSnapshot } from '../../model/session';
import { companyColors, companyKeys, type Company } from '../../model/types';
import styles from './index.module.less';

const companyChineseNames: Record<Company, string> = {
  American: '美洲', Continental: '洲际', Festival: '嘉年华', Imperial: '帝国',
  Sackson: '萨克森', Tower: '高塔', Worldwide: '环球',
};

function Counter({ value, onChange, label, disabled, canAdd }: { value: number; onChange: (value: number) => void; label: string; disabled: boolean; canAdd: boolean }) {
  return <div className={styles.counter}><button disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} aria-label={`减少${label}`}>−</button><output aria-label={label}>{value}</output>
    <button disabled={disabled || !canAdd} onClick={() => onChange(value + 1)} aria-label={`增加${label}`}>+</button></div>;
}
function MergerOverview({ data, sources }: { data: GameSnapshot; sources: Company[] }) {
  const survivor = data.tempData.merge_main_company_temp as Company;
  return <div className={styles.mergerOverview}>
    <div className={styles.mergerSources}>{sources.map(company => <div key={company} style={{ color: companyColors[company] }}>
      <CompanyGlyph company={company} size={38} /><span><b>{company}</b><small>被并公司</small><em>当前股价 {money(data.roomData.companyInfo[company].stockPrice)} / 股</em></span>
    </div>)}</div>
    <span className={styles.mergerArrow}><ArrowRight size={24} /><small>并入</small></span>
    <div className={styles.mergerSurvivor} style={{ color: companyColors[survivor] }}>
      <CompanyGlyph company={survivor} size={38} /><span><b>{survivor}</b><small>存续公司</small><em>当前股价 {money(data.roomData.companyInfo[survivor].stockPrice)} / 股</em></span>
    </div>
  </div>;
}
function MergerDividends({ data, sources }: { data: GameSnapshot; sources: Company[] }) {
  const playerOrder = data.roomData.playerOrder ?? Object.keys(data.roomData.players);
  const order = new Map(playerOrder.map((playerID, index) => [playerID, index]));
  return <section className={styles.dividendSummary} aria-label="股东奖励明细">
    <header><span><Coins size={17} /><b>股东奖励</b></span><small>已自动到账</small></header>
    <div>{sources.map(company => {
      const dividends = data.tempData.mergeSettleData?.[company]?.dividends ?? {};
      const recipients = Object.entries(dividends).filter(([, amount]) => amount > 0)
        .sort(([left], [right]) => {
          const leftIndex = order.get(left), rightIndex = order.get(right);
          if (leftIndex != null || rightIndex != null) return (leftIndex ?? Number.MAX_SAFE_INTEGER) - (rightIndex ?? Number.MAX_SAFE_INTEGER);
          return left.localeCompare(right);
        });
      return <div className={styles.dividendCompany} key={company}>
        <span className={styles.dividendCompanyName} style={{ color: companyColors[company] }}>
          <CompanyGlyph company={company} size={22} /><b>{company}</b>
        </span>
        {recipients.length ? <div className={styles.dividendRecipients}>{recipients.map(([playerID, amount]) => {
          const player = data.roomData.players[playerID];
          return <span key={playerID}>
            <PlayerAvatar name={playerName(playerID, data.roomData.players)} avatar={player?.avatar} ai={player?.ai} size={27} />
            <b>{playerName(playerID, data.roomData.players)}</b><strong>+{money(amount)}</strong>
          </span>;
        })}</div> : <small className={styles.noDividend}>无人持股，无奖励</small>}
      </div>;
    })}</div>
  </section>;
}
export function TradeDialog({ interaction, session }: { interaction: AcquireInteraction; session: AcquireSession }) {
  const { data, panel, draft, enabled } = interaction;
  if (!data || !panel) return null;
  const buying = buyPreview(data, draft.buy), merging = mergePreview(data, draft.merge);
  const error = session.feedback && <Feedback error>{session.feedback}</Feedback>;
  const hint = (children: ReactNode) => <div className={styles.dialogHint}><ShieldCheck size={16} /><span>{children}</span></div>;
  if (panel === 'buy') {
    const active = companyKeys.filter(key => data.roomData.companyInfo[key].tiles > 0);
    return <ResponsiveDialog title="把眼光，投进下一座城。" eyebrow="BUY SHARES / UP TO 3 PER TURN" onClose={interaction.close}
    footer={<><div className={styles.total}><span>本次买入<strong><AnimatedValue value={buying.cost} formatter={money} /></strong></span><span>购买后余额<strong><AnimatedValue value={buying.balance} formatter={money} /></strong></span><span>已选<strong><AnimatedValue value={buying.count} /><small> / 3 股</small></strong></span></div><div className={styles.footerActions}>
      <ActionButton disabled={!enabled} onClick={() => interaction.submitBuy(true)}>本轮不买</ActionButton>
      <ActionButton variant="primary" data-click-sound="stock-buy" disabled={!enabled || !buying.valid || !buying.count} pending={!!session.pending} onClick={() => interaction.submitBuy()}>确认购买<ArrowRight size={16} /></ActionButton></div></>}>
    <div className={styles.wallet}><span><Wallet size={17} />可用现金</span><b><AnimatedValue value={data.playerData.money} formatter={money} /></b></div>
    <div className={styles.stockShop}>{active.map(key => {
      const company = data.roomData.companyInfo[key], value = draft.buy[key] ?? 0;
      return <div className={styles.row} key={key}><div><span className={styles.companyLabel} style={{ color: companyColors[key] }}><CompanyGlyph company={key} size={26} /><b>{key}</b></span><small>库存 {company.stockTotal} · 已持有 {data.playerData.stocks[key] ?? 0}</small></div>
        <span className={styles.price}><b><AnimatedValue value={company.stockPrice} formatter={money} /></b><small>/ 股</small></span>
        <Counter value={value} disabled={!enabled} label={`${key} 买入股数`} canAdd={buyPreview(data, { ...draft.buy, [key]: value + 1 }).valid} onChange={amount => interaction.changeBuy(key, amount)} /></div>;
    })}</div>{active.length < companyKeys.length && <p className={styles.unavailable}><Lock size={12} />{companyKeys.length - active.length} 家公司尚未成立，暂不可买入。</p>}
    {hint('价格按当前公司规模计算；每回合最多 3 股，可分配到不同公司。')}{!buying.valid && <Feedback error>现金或库存已变化，请调整选择。</Feedback>}{error}
  </ResponsiveDialog>;
  }
  if (panel === 'merge-wait') {
    const sources = companyKeys.filter(key => !!data.tempData.mergeSettleData?.[key]);
    const settledSources = settledMergeCompanies(data);
    const pendingPlayers = pendingMergePlayers(data);
    const pendingSet = new Set(pendingPlayers);
    const currentPlayerID = mergeSettlementPlayer(data);
    const completedSet = new Set(companyKeys.flatMap(key => Object.keys(data.tempData.mergeSettleData?.[key]?.settled ?? {})));
    const waitingForTurn = pendingSet.has(data.playerId);
    const completed = completedSet.has(data.playerId);
    const currentPlayerName = currentPlayerID
      ? playerName(currentPlayerID, data.roomData.players)
      : '其他股东';
    const participantIDs = (data.roomData.playerOrder ?? Object.keys(data.roomData.players))
      .filter(playerID => pendingSet.has(playerID) || completedSet.has(playerID));
    const receipt = settledSources.reduce((total, key) => {
      const result = data.tempData.mergeSettleData[key]?.settled?.[data.playerId];
      if (!result) return total;
      total.sold += result.sellAmount;
      total.exchanged += result.exchangeAmount / 2;
      total.retained += result.holdingBefore - result.sellAmount - result.exchangeAmount;
      total.revenue += result.sellAmount * data.roomData.companyInfo[key].stockPrice;
      return total;
    }, { sold: 0, exchanged: 0, retained: 0, revenue: 0 });
    return <ResponsiveDialog title={waitingForTurn ? `等待 ${currentPlayerName} 完成处理。`
      : completed ? '你的选择已确认，等待其他股东。' : `并购结算进行中，当前由 ${currentPlayerName} 处理。`} eyebrow="MERGER / PROCESSING" onClose={interaction.close}
      footer={<><span className={styles.waitFooter}><LoaderCircle size={15} />等待 {currentPlayerName}</span><ActionButton onClick={interaction.close}>返回棋盘</ActionButton></>}>
      <div className={styles.submitted}><span>{completed ? <Check size={27} /> : <Clock size={27} />}</span><h3>{waitingForTurn ? '尚未轮到你' : completed ? '股票处理已提交' : '并购结算清单'}</h3>
        <p>{sources.join(' + ')} → {data.tempData.merge_main_company_temp}</p></div>
      <MergerDividends data={data} sources={sources} />
      {completed && <div className={styles.mergeReceipt}><span><small>卖出旧股</small><b>{receipt.sold} 股</b><em>+{money(receipt.revenue)}</em></span>
        <span><small>兑换新股</small><b>{receipt.exchanged} 股</b><em>使用 {receipt.exchanged * 2} 股旧股</em></span>
        <span><small>保留旧股</small><b>{receipt.retained} 股</b><em>等待未来机会</em></span></div>}
      <div className={styles.settlementPlayers}>{participantIDs.map(playerID => {
        const player = data.roomData.players[playerID], pending = pendingSet.has(playerID);
        const active = pending && playerID === currentPlayerID;
        return <div key={playerID}><PlayerAvatar name={playerName(playerID, data.roomData.players)} avatar={player?.avatar} ai={player?.ai} size={35} />
          <span>{playerName(playerID, data.roomData.players)}</span><b className={active ? styles.pendingSettlement : ''}>
            {active ? <><LoaderCircle size={13} />处理中</> : pending ? <><Clock size={13} />等待中</> : <><Check size={13} />已完成</>}</b></div>;
      })}</div>
      {hint(waitingForTurn ? '股东按座位顺序依次处理股票；轮到你时系统会自动打开操作面板。'
        : completed ? `你已完成 ${settledSources.length} 家被并公司的股票处理。全部股东提交后，对局将自动进入下一阶段。`
          : '结算清单会实时更新；只有当前股东可以提交股票处理方案。')}
    </ResponsiveDialog>;
  }
  if (panel === 'merge') {
    const sources = mergeCompanies(data);
    const allSources = companyKeys.filter(key => !!data.tempData.mergeSettleData?.[key]);
    return <ResponsiveDialog title={allSources.length > 1 ? '多家公司，一次新的机会。' : '两家公司，一次新的机会。'} eyebrow="MERGER / SHAREHOLDER ACTION" onClose={interaction.close} className={styles.mergeDialog}
    footer={<><div className={styles.total}><span>处理后现金<strong><AnimatedValue value={data.playerData.money + merging.revenue} formatter={money} /></strong></span><span>新增 {data.tempData.merge_main_company_temp}<strong><AnimatedValue value={merging.groups} /><small> 股</small></strong></span><span>保留旧股<strong><AnimatedValue value={merging.retained} /><small> 股</small></strong></span></div><div className={styles.footerActions}>
      <ActionButton onClick={interaction.close}>稍后处理</ActionButton><ActionButton variant="primary" disabled={!enabled || !merging.valid} pending={!!session.pending} onClick={interaction.submitMerge}>确认股票处理<Check size={16} /></ActionButton></div></>}>
    <MergerOverview data={data} sources={allSources} />
    {hint(`每 2 股旧股兑换 1 股 ${data.tempData.merge_main_company_temp}。未卖出或兑换的股票继续保留。`)}
    <MergerDividends data={data} sources={allSources} />
    {sources.map(key => {
      const value = draft.merge[key] ?? { sell: 0, groups: 0 }, held = data.playerData.stocks[key] ?? 0;
      const canAdd = (field: 'sell' | 'groups') => mergePreview(data, { ...draft.merge, [key]: { ...value, [field]: value[field] + 1 } }).valid;
      const retained = held - value.sell - value.groups * 2;
      return <section className={styles.mergeCompany} key={key}>
        <div className={styles.mergerHoldings}><span>持有 {key}<b>{held} 股</b></span><span>锁定股价<b>{money(data.roomData.companyInfo[key].stockPrice)} / 股</b></span></div>
        <div className={styles.allocationHeading}><h3>决定 {key} 股票的去向</h3></div>
        <div className={styles.allocation}><div><span className={styles.allocationIcon}><Wallet size={18} /></span><div><strong>卖出</strong><small>{money(data.roomData.companyInfo[key].stockPrice)} / 股，变为现金</small></div><Counter value={value.sell} label={`${key} 卖出`} disabled={!enabled} canAdd={canAdd('sell')} onChange={amount => interaction.changeMerge(key, 'sell', amount)} /></div>
          <div><span className={styles.allocationIcon}><TrendingUp size={18} /></span><div><strong>兑换 <em>2 : 1</em></strong><small>2 股旧股 → 1 股 {data.tempData.merge_main_company_temp}</small></div><Counter value={value.groups} label={`${key} 兑换组数`} disabled={!enabled} canAdd={canAdd('groups')} onChange={amount => interaction.changeMerge(key, 'groups', amount)} /></div>
          <div className={styles.retain}><span className={styles.allocationIcon}><Layers size={18} /></span><div><strong>保留</strong><small>等待公司再次成立</small></div><span><b>{retained}</b> 股</span></div></div>
        <div className={styles.allocationTotal}><span>{value.sell} 股卖出 + {value.groups * 2} 股兑换 + {retained} 股保留</span><b>= {held} 股</b></div>
      </section>;
    })}{hint(`可供兑换：${merging.stock} 股 ${data.tempData.merge_main_company_temp}。分红已包含在当前现金中。`)}
    {!merging.valid && <Feedback error>存续公司库存或持股已变化，请减少卖出／兑换数量。</Feedback>}{error}
  </ResponsiveDialog>;
  }
  if (panel === 'found') {
    const selected = draft.company;
    const available = companyKeys.filter(key => data.roomData.companyInfo[key].tiles === 0);
    const canAward = !!selected && data.roomData.companyInfo[selected].stockTotal > 0;
    const placedTile = data.tempData.last_tile_key || draft.tile || '—';
    return <ResponsiveDialog wide title="这片地，值得一家新公司。" eyebrow="FOUND A NEW COMPANY"
      className={styles.foundDialog} onClose={interaction.close}
      footer={<><span className={styles.foundSummary}>{selected ? `${selected} · 创始奖励 ${canAward ? 1 : 0} 股` : '选择一家尚未成立的公司'}</span>
        <ActionButton onClick={interaction.close}>稍后选择</ActionButton>
        <ActionButton variant="primary" data-click-sound="create-company" disabled={!enabled || !selected} pending={!!session.pending} onClick={interaction.submitCompany}>
          确认创建公司<ArrowRight size={16} />
        </ActionButton></>}>
      <div className={styles.foundIntro}><span>{placedTile}</span><div><h3>独立地块已经相连。</h3><p>选择公司的名字与标识，开启这一段城市版图。</p></div></div>
      <div className={styles.foundCompanies}>{companyKeys.map(key => {
        const company = data.roomData.companyInfo[key];
        const established = company.tiles > 0;
        const isSelected = selected === key;
        return <button type="button" key={key} aria-label={`创建 ${key}`} aria-pressed={isSelected}
          disabled={!enabled || established} className={`${isSelected ? styles.foundSelected : ''} ${established ? styles.foundUnavailable : ''}`}
          style={{ '--co': companyColors[key] } as CSSProperties} onClick={() => interaction.selectCompany(key)}>
          <CompanyGlyph company={key} size={40} /><strong>{key}</strong><span>{companyChineseNames[key]}</span>
          <small>{established ? `已成立 · ${company.tiles} 块地` : '可创建'}</small>{isSelected && <Check size={16} />}
        </button>;
      })}</div>
      {hint(selected
        ? `${selected} 即将成立。${canAward ? '你将获得 1 股创始奖励，不消耗现金。' : '公司库存为零，本次不发放创始奖励。'}`
        : `目前有 ${available.length} 家公司可创建。已成立的公司不能重复创建。`)}
      {error}
    </ResponsiveDialog>;
  }
  const choices = companyKeys.filter(key => data.tempData.merge_selection_temp.mainCompany.includes(key));
  const selected = draft.company && choices.includes(draft.company) ? draft.company : undefined;
  return <ResponsiveDialog title="一样大的版图，由你决定未来。"
    eyebrow="CHOOSE THE SURVIVING COMPANY" onClose={interaction.close}
    footer={<><ActionButton onClick={interaction.close}>稍后选择</ActionButton>
      <ActionButton variant="primary" disabled={!enabled || !selected} pending={!!session.pending} onClick={interaction.submitSurvivor}>
        确认存续公司<ArrowRight size={16} />
      </ActionButton></>}>
    <p className={styles.survivorDescription}>多家公司的规模相同。作为本次合并的发起者，选择一家存续，其他公司进入股东结算。</p>
    <div className={styles.survivorChoices}>{choices.map(key => {
      const isSelected = selected === key;
      return <button type="button" key={key} aria-label={`保留 ${key}`} aria-pressed={isSelected} disabled={!enabled}
        className={isSelected ? styles.survivorSelected : ''} style={{ '--co': companyColors[key] } as CSSProperties}
        onClick={() => interaction.selectCompany(key)}>
        <span><CompanyGlyph company={key} size={38} /><b>{key}</b></span>
        <strong>{data.roomData.companyInfo[key].tiles} 块地</strong><small>作为存续公司</small>
        {isSelected && <Check size={16} />}
      </button>;
    })}</div>
    {hint('这一步只决定公司存续，不会跳过其他股东的奖励和股票处理。')}{error}
  </ResponsiveDialog>;
}
