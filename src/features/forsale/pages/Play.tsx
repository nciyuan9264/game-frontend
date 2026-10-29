import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Coins,
  EyeOff,
  Gavel,
  History,
  Home,
  Layers3,
  LockKeyhole,
  Minus,
  MoreHorizontal,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import sold from '../assets/sold.webp';
import {
  Cheque,
  PlayerAvatar,
  PropertyCard,
} from '../components/GamePieces';
import { useForSaleInteraction } from '../hooks/useForSaleInteraction';
import type { ForSaleSession } from '../hooks/useForSaleSession';
import {
  latestPurchase,
  latestSale,
} from '../model/selectors';
import {
  playerName,
  type GameSnapshot,
} from '../model/session';
import {
  chequeMoney,
  propertyName,
  refund,
} from '../model/types';
import { Results } from './Results';

const useCountdown = (deadline?: string) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  if (!deadline) return '';
  return `${Math.ceil(Math.max(0,
    new Date(deadline).getTime() - now) / 1000)}s`;
};

type Panel = 'pass' | 'assets' | 'rules' | 'log' | 'menu' | undefined;

export const Play = ({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending,
}: {
  session: ForSaleSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch: () => void;
  startNextMatchPending: boolean;
}) => {
  const interaction = useForSaleInteraction(session, data);
  const [panel, setPanel] = useState<Panel>();
  const [reviewing, setReviewing] = useState(false);
  const phase = data.roomData.gameStatus;
  const self = data.playerData[data.playerId];
  const actionDeadline = self?.actionDeadline;
  const countdown = useCountdown(actionDeadline
    ?? data.roomData.transitionDeadline);
  const purchase = latestPurchase(data);
  const sale = latestSale(data);
  const enabled = interaction.enabled;

  if (phase === 'end' && !reviewing) {
    return <Results data={data} enabled={enabled}
      onReview={() => setReviewing(true)}
      onExit={onLeave}
      onRematch={data.ownerID === data.playerId ? onStartNextMatch : undefined}
      rematchPending={startNextMatchPending} />;
  }

  const market = phase === 'buyResult'
    ? purchase?.trades.map(trade => trade.property) ?? []
    : data.roomData.propertyMarket;
  const saleTrades = sale?.trades ?? [];
  const mySale = saleTrades.find(trade => trade.playerID === data.playerId);
  const isAuction = phase === 'auction';
  const myTurn = isAuction && data.roomData.currentPlayer === data.playerId;
  const canPass = enabled && myTurn;
  const maxBid = (self?.coins ?? 0) + (self?.bid ?? 0);

  return <div className="fs-play" data-testid="forsale-play">
    <header className="fs-game-header"><button type="button"
      aria-label="离开对局" onClick={onLeave}><ArrowLeft size={19} /></button>
      <div><small>THE SUNDAY AUCTION · 房间号</small>
        <h1><span className="fs-game-room-id">{data.roomID}</span><span>·</span>
          <span>{data.roomData.playerOrder.length} 人
            <span className="fs-game-mode">经典局</span></span></h1></div>
      <span className="fs-phase-chip">{phase === 'auction' || phase === 'buyResult'
        || phase === 'bridge' ? '01 竞价购房' : '02 暗牌出售'}</span>
      {countdown && <b className="fs-timer">{countdown}</b>}
      <button type="button" aria-label="公开记录" onClick={() => setPanel('log')}>
        <History size={18} /></button>
      <button type="button" aria-label="对局菜单" onClick={() => setPanel('menu')}>
        <MoreHorizontal size={20} /></button></header>
    {reviewing && phase === 'end' && <button type="button"
      className="fs-review-banner" onClick={() => setReviewing(false)}>
      正在查看终局牌桌 · 返回结算<ArrowRight size={14} /></button>}
    {session.feedback && <div className="fs-game-toast" role="alert">
      {session.feedback}</div>}

    <div className="fs-phase-bar"><div><span className={
      phase === 'auction' || phase === 'buyResult' || phase === 'bridge'
        ? 'active' : 'done'}>01 竞价购房</span><ArrowRight size={13} />
      <span className={phase.startsWith('sell') || phase === 'end'
        ? 'active' : ''}>02 暗牌出售</span></div>
      <b>第 {data.roomData.round}<small> / {data.roomData.totalRounds} 轮</small></b>
    </div>

    {phase === 'bridge' ? <section className="fs-bridge"><img src={sold} alt="" />
      <span className="fs-eyebrow">HALFWAY THERE. NOW, SELL SMART.</span>
      <h2>房子买好了。<br /><em>接下来，卖个好价钱。</em></h2>
      <p>你手里有 <b>{self?.propertyCount ?? 0}</b> 处房产，钱包剩 {
        self?.coins ?? 0} 枚金币。金币保留计分。</p>
      <div><span><EyeOff />暗选</span><ArrowRight /><span><LockKeyhole />锁定</span>
        <ArrowRight /><span><Sparkles />揭晓</span></div>
      <ActionButton variant="primary" disabled={!enabled}
        onClick={() => session.submit('game_start_selling')}>
        开始出售房产<ArrowRight size={16} /></ActionButton></section>
      : <main className="fs-table-layout"><section className="fs-board-panel">
        <header className={`fs-turn-banner ${phase.endsWith('Result')
          || phase === 'sellReveal' ? 'settled' : ''}`}><div>
          <small>{phase.startsWith('sell')
            ? 'SELL SMART / 好房等好价' : 'BUY LOW / 看准再出手'}</small>
          <h2>{phase === 'auction'
            ? myTurn ? '轮到你出价，好房值得多少？'
              : `${playerName(data.roomData.currentPlayer,
                data.roomData.players)}正在考虑下一口价…`
            : phase === 'buyResult' ? '一声落槌，房子各有所属。'
              : phase === 'sellSelect' ? '选一处房产，把眼光变成回报。'
                : phase === 'sellLocked' ? '所有暗牌已锁定，一起揭晓。'
                  : phase === 'sellReveal' ? '这笔买卖，尘埃落定。'
                    : '终局牌桌已锁定。'}</h2></div>
          {phase.startsWith('sell') ? <LockKeyhole size={27} /> : <Gavel size={27} />}
        </header>

        <div className="fs-player-strip">{data.roomData.playerOrder.map(id => {
          const value = data.playerData[id];
          return <div key={id} className={
            data.roomData.currentPlayer === id ? 'active' : ''}>
            <PlayerAvatar name={playerName(id, data.roomData.players)}
              avatar={data.roomData.players[id]?.avatar}
              ai={data.roomData.players[id]?.ai} size={25} />
            <b>{id === data.playerId ? '你' : playerName(id, data.roomData.players)}</b>
            <small>{phase.startsWith('sell')
              ? value?.locked ? '已锁定' : '待选择'
              : value?.passed ? `获 ${value.wonProperty ?? '—'} 号`
                : `${value?.bid ?? 0} 枚`}</small></div>;
        })}</div>

        {(phase === 'auction' || phase === 'buyResult' || phase === 'end')
          && <><div className="fs-market-heading"><span><Home size={15} />{
            phase === 'buyResult' ? '本轮房产归属' : '本轮房产'}</span>
            <small>房产数字是等级，不是价格</small></div>
          <div className="fs-property-market" data-count={market.length}>{
            phase === 'buyResult' ? purchase?.trades
              .slice().sort((a, b) => a.property - b.property)
              .map(trade => <div key={trade.playerID}>
                <PropertyCard value={trade.property}
                  badge={trade.playerID === data.playerId ? '你的新房产' : undefined} />
                <span><PlayerAvatar
                  name={playerName(trade.playerID, data.roomData.players)}
                  ai={data.roomData.players[trade.playerID]?.ai} size={20} />
                  <b>{playerName(trade.playerID, data.roomData.players)}</b>
                  <small>实付 {trade.amount} 枚</small></span></div>)
              : market.map((value, index) => <div key={value}>
                <PropertyCard value={value} />
                <small>{index === 0 ? '先退出，拿这张'
                  : index === market.length - 1 ? '最后留场，拿这张'
                    : '等待落槌'}</small></div>)}</div></>}

        {phase.startsWith('sell') && <><div className="fs-market-heading">
          <span><ReceiptText size={15} />本轮支票</span>
          <small>房产等级越高，拿到的支票越高</small></div>
          <div className="fs-cheque-market">{phase === 'sellReveal'
            ? saleTrades.slice().sort((a, b) => a.amount - b.amount)
              .map((trade, index) => <Cheque key={`${trade.playerID}-${index}`}
                value={trade.amount} best={index === saleTrades.length - 1} />)
            : data.roomData.chequeMarket.map((value, index) =>
              <Cheque key={`${value}-${index}`} value={value}
                best={index === data.roomData.chequeMarket.length - 1} />)}</div></>}

        {phase === 'auction' && <section className="fs-bid-console">
          <div><span><Wallet size={18} />可用金币
            <b>{self?.coins ?? 0}<small>枚</small></b></span>
            <p>当前最高 <b>{data.roomData.highestBid}</b>
              <span>你已暂押 <b>{self?.bid ?? 0}</b></span>
              <span>本次补 <b>{interaction.canBid
                ? interaction.bid - (self?.bid ?? 0) : '—'}</b></span></p></div>
          <div className="fs-bid-actions"><span className="fs-stepper">
            <button type="button" aria-label="减少出价"
              disabled={!myTurn || interaction.bid <= data.roomData.highestBid + 1}
              onClick={() => interaction.setBid(Math.max(
                data.roomData.highestBid + 1,
                interaction.bid - 1,
              ))}><Minus size={16} /></button>
            <input type="number" aria-label="总出价金币"
              value={interaction.bid} min={data.roomData.highestBid + 1}
              max={maxBid} disabled={!myTurn}
              onChange={event => interaction.setBid(Number(event.target.value))} />
            <small>枚</small><button type="button" aria-label="增加出价"
              disabled={!myTurn || interaction.bid >= maxBid}
              onClick={() => interaction.setBid(Math.min(maxBid, interaction.bid + 1))}>
              <Plus size={16} /></button></span>
            <ActionButton disabled={!canPass} onClick={() => setPanel('pass')}>
              退出本轮</ActionButton>
            <ActionButton variant="primary" disabled={!interaction.canBid}
              data-click-sound="game-resource" onClick={interaction.submitBid}><Gavel size={16} />
              出价 {interaction.bid} 枚</ActionButton></div>
          <footer>{myTurn ? <>现在退出：拿 <b>{
            data.roomData.propertyMarket[0]} 号</b> · 退 <b>{
            refund(self?.bid ?? 0)} 枚</b> · 实付 <b>{
            (self?.bid ?? 0) - refund(self?.bid ?? 0)} 枚</b></>
            : `等待 ${playerName(data.roomData.currentPlayer,
              data.roomData.players)} 行动…`}</footer>
        </section>}

        {phase === 'buyResult' && <section className="fs-round-outcome">
          <p><Check size={16} />你获得 <b>{self?.wonProperty ?? '—'} 号 · {
            self?.wonProperty ? propertyName(self.wonProperty) : ''}</b>，实际支出 {
            self?.roundCost ?? 0} 枚。</p>
          <ActionButton variant="primary" disabled={!enabled}
            onClick={() => session.submit('game_next_round')}>
            {data.roomData.round < data.roomData.totalRounds
              ? '下一轮拍卖' : '进入出售阶段'}<ArrowRight size={15} /></ActionButton>
        </section>}

        {phase === 'sellSelect' && <section className="fs-sale-select">
          <header><div><h3>这轮，你想卖哪一处？</h3>
            <p><EyeOff size={13} />手牌仅自己可见 · 锁定前可以更换</p></div>
            <span>{self?.propertyCount ?? 0} 张可选</span></header>
          <div className="fs-sale-hand">{self?.properties?.map(value =>
            <PropertyCard key={value} value={value}
              selected={interaction.property === value}
              disabled={!enabled || self.locked}
              onClick={() => interaction.setProperty(
                interaction.property === value ? undefined : value,
              )} />)}</div>
          <footer><span><LockKeyhole size={20} /><b>{
            interaction.property
              ? `已选 ${interaction.property} 号 · ${propertyName(interaction.property)}`
              : '先选一张房产，再锁定'}</b></span>
            <ActionButton variant="primary" disabled={!interaction.canLock}
              data-click-sound="game-confirm"
              onClick={interaction.lockSale}>锁定这张房产</ActionButton></footer>
        </section>}

        {phase === 'sellLocked' && <section className="fs-locked">
          <header><LockKeyhole size={25} /><div><h3>每个人，都做出了选择。</h3>
            <p>{data.roomData.lockedCount} / {data.roomData.playerOrder.length} 已锁定</p>
          </div></header><div>{data.roomData.playerOrder.map(id =>
            <article key={id}><span><Home size={28} /><b>For Sale.</b>
              <small>SEALED PROPERTY</small></span>
              <p><PlayerAvatar name={playerName(id, data.roomData.players)}
                ai={data.roomData.players[id]?.ai} size={22} />{
                id === data.playerId && data.playerData[id]?.lockedProperty
                  ? `你 · ${data.playerData[id].lockedProperty} 号`
                  : playerName(id, data.roomData.players)}</p></article>)}</div>
          <footer><ShieldCheck size={14} />揭晓前不会显示其他玩家的房产。
            <ActionButton variant="primary" disabled={!enabled}
              onClick={() => session.submit('game_reveal_sale')}>
              <Sparkles size={15} />一起揭晓</ActionButton></footer>
        </section>}

        {phase === 'sellReveal' && <section className="fs-reveal">
          <header><span><Check size={13} />成交已入账</span>
            <h3>房产等级，从高到低；支票，各归其主。</h3></header>
          <div>{saleTrades.slice().sort((a, b) => b.property - a.property)
            .map((trade, index) => <article className={
              trade.playerID === data.playerId ? 'self' : ''} key={trade.playerID}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <PlayerAvatar name={playerName(trade.playerID, data.roomData.players)}
                ai={data.roomData.players[trade.playerID]?.ai} size={30} />
              <b>{playerName(trade.playerID, data.roomData.players)}</b>
              <span><Home size={14} />{trade.property} 号</span>
              <ArrowRight size={15} /><strong>{chequeMoney(trade.amount)}</strong>
            </article>)}</div><footer><Coins size={17} />你本轮获得 <b>{
              chequeMoney(mySale?.amount ?? 0)}</b>
            <ActionButton variant="primary" disabled={!enabled}
              onClick={() => session.submit('game_next_round')}>
              {data.roomData.round < data.roomData.totalRounds
                ? '下一轮出售' : '查看最终结算'}<ArrowRight size={15} /></ActionButton></footer>
        </section>}

        <button className="fs-assets-strip" type="button"
          onClick={() => setPanel('assets')}><Layers3 size={19} />
          <span><b>我的房产 · {self?.propertyCount ?? 0} 处</b>
            <small>只有你能查看完整资产</small></span>
          <div>{self?.properties?.slice(-4).map(value =>
            <i key={value}>{value}</i>)}</div><ArrowRight size={15} /></button>
      </section>

      <aside className="fs-sidebar"><section><header><h3>本桌买家</h3>
        <span>{data.roomData.playerOrder.length} 位入席</span></header>
        {data.roomData.playerOrder.map(id => <div key={id}
          className={data.roomData.currentPlayer === id ? 'active' : ''}>
          <PlayerAvatar name={playerName(id, data.roomData.players)}
            avatar={data.roomData.players[id]?.avatar}
            ai={data.roomData.players[id]?.ai} size={34} />
          <span><b>{playerName(id, data.roomData.players)}</b>
            <small>{phase.startsWith('sell')
              ? data.playerData[id]?.locked ? '已锁定' : '正在选择'
              : data.playerData[id]?.passed ? '已获得房产' : '仍在竞价'}</small></span>
          <strong>{phase.startsWith('sell')
            ? <LockKeyhole size={15} /> : `${data.playerData[id]?.bid ?? 0} 枚`}</strong>
        </div>)}</section>
        <section className="fs-wallet"><Wallet size={17} /><span>我的钱包</span>
          <b>{self?.coins ?? 0}<small>枚可用</small></b>
          <p>已收支票 <strong>{chequeMoney(
            self?.cheques?.reduce((sum, value) => sum + value, 0) ?? 0,
          )}</strong></p></section>
        <button type="button" className="fs-help"
          onClick={() => setPanel('rules')}><CircleHelp size={17} />
          忘记规则了？随时看一眼。<ArrowRight size={14} /></button>
      </aside></main>}

    {panel === 'pass' && <ResponsiveDialog
      title="这轮收手，也是一笔好买卖。" onClose={() => setPanel(undefined)}
      footer={<><ActionButton onClick={() => setPanel(undefined)}>再想一下</ActionButton>
        <ActionButton variant="primary" disabled={!canPass} onClick={() => {
          if (session.submit('game_pass')) setPanel(undefined);
        }}>确认退出本轮</ActionButton></>}>
      <div className="fs-pass-preview"><PropertyCard compact
        value={data.roomData.propertyMarket[0]} /><dl>
        <div><dt>已暂押</dt><dd>{self?.bid ?? 0} 枚</dd></div>
        <div><dt>退回钱包</dt><dd>+ {refund(self?.bid ?? 0)} 枚</dd></div>
        <div><dt>实际支出</dt><dd>{
          (self?.bid ?? 0) - refund(self?.bid ?? 0)} 枚</dd></div></dl></div>
      <p className="fs-hint"><CircleHelp size={15} />新版退款向上取整；退出后立即获得最低房产。</p>
    </ResponsiveDialog>}

    {panel === 'assets' && <ResponsiveDialog title="我的房产与资产" wide
      onClose={() => setPanel(undefined)}><div className="fs-asset-summary">
      <p><LockKeyhole size={13} />仅自己可见</p>
      <b>{self?.propertyCount ?? 0} 处房产 · {self?.coins ?? 0} 枚金币 · {
        self?.chequeCount ?? 0} 张支票</b></div>
      <div className="fs-asset-cards">{self?.properties?.map(value =>
        <PropertyCard compact key={value} value={value} />)}</div>
      <div className="fs-asset-cheques">{self?.cheques?.map((value, index) =>
        <Cheque key={`${value}-${index}`} value={value} />)}</div>
    </ResponsiveDialog>}

    {panel === 'rules' && <ResponsiveDialog title="桌边规则卡"
      onClose={() => setPanel(undefined)}><div className="fs-quick-rules">
      <section><b>01</b><div><h3>公开竞价买房</h3>
        <p>加价必须超过最高总价，只补差额。退出拿最低房产，返还已押的一半并向上取整。</p></div></section>
      <section><b>02</b><div><h3>同时暗选卖房</h3>
        <p>每人锁定一张房产，全部锁定后揭晓。最高房产领取最高支票。</p></div></section>
      <p><Coins size={16} />最终财富 = 支票合计 + 剩余金币。</p></div>
    </ResponsiveDialog>}

    {panel === 'log' && <ResponsiveDialog title="本局公开记录"
      onClose={() => setPanel(undefined)}><ol className="fs-log">{
        data.roomData.actionLog.slice().reverse().map(action =>
          <li key={action.id}><span>{String(action.id).padStart(2, '0')}</span>
            <p><b>{playerName(action.playerID, data.roomData.players)}</b>
              {action.kind === 'bid' ? ` 出价 ${action.amount} 枚`
                : action.kind === 'pass' ? ` 退出并获得 ${action.property} 号房产`
                  : action.kind === 'lockSale' ? ' 已锁定暗牌'
                    : action.kind === 'sell' ? ` 出售 ${action.property} 号，获得 ${chequeMoney(action.cheque ?? 0)}`
                      : ' 推进下一阶段'}
              {action.source === 'timeout' && <small>超时托管</small>}
              {action.source === 'ai' && <small>AI 操作</small>}</p></li>)}</ol>
    </ResponsiveDialog>}

    {panel === 'menu' && <ResponsiveDialog title="桌边菜单"
      onClose={() => setPanel(undefined)}><div className="fs-menu">
      <button type="button" onClick={() => setPanel('assets')}>
        <Layers3 />我的资产<ArrowRight /></button>
      <button type="button" onClick={() => setPanel('log')}>
        <History />公开记录<ArrowRight /></button>
      <button type="button" onClick={() => setPanel('rules')}>
        <CircleHelp />桌边规则<ArrowRight /></button>
      <button type="button" onClick={onLeave}>
        <ArrowLeft />离开当前对局<ArrowRight /></button></div>
    </ResponsiveDialog>}
  </div>;
};
