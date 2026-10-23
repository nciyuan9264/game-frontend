import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Bookmark, Check, Coins, Crown, Eye,
  History, Info, Layers, ShieldCheck, X,
} from 'lucide-react';
import TurnCountdown from '@/components/TurnCountdown';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { PlayerAvatar } from '../../components/AppShell';
import { GemIcon } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import {
  DeckBack, DevelopmentCardView, NobleTile, TokenControl,
} from '../../components/GamePieces';
import { ActivityDialog } from '../../dialogs/Activity';
import { CardActionDialog } from '../../dialogs/CardAction';
import { CollectionDialog } from '../../dialogs/Collection';
import { NobleDetailDialog } from '../../dialogs/NobleDetail';
import { ReturnTokensDialog } from '../../dialogs/ReturnTokens';
import type { SplendorSession } from '../../hooks/useSplendorSession';
import { useSplendorPlayUI } from '../../hooks/useSplendorPlayUI';
import {
  boardCards, boardNobles, canBuyCard, canPass, canReserve, deckCount, discounts,
  gemSelectionValid, overflowCount, phaseCopy, tokenTotal, walletAfterReserve,
  walletAfterTake,
} from '../../model/selectors';
import { playerName, type GameSnapshot } from '../../model/session';
import {
  cardColors, gemColors,
  type GemTakePayload, type ReserveCardPayload,
} from '../../model/types';
import { Results } from '../Results';
import styles from './index.module.less';

const rules = [
  ['拿取宝石', '拿三种不同色各一枚，或某色库存至少四枚时拿同色两枚。超过十枚时精确退还多出的筹码。'],
  ['购买发展卡', '永久折扣抵扣原价，同色筹码优先支付，黄金自动补足。已预留的卡也可以购买。'],
  ['公开预留', '从公开市场预留一张卡，黄金有库存时获得一枚。最多预留三张，不提供牌堆盲抽。'],
  ['终局判定', '达到十五点后完成当前轮。最高声望获胜；同分时发展卡更少者优先。'],
] as const;

export function Play({
  session,
  data,
  onLeave,
  onStartNextMatch,
  startNextMatchPending = false,
}: {
  session: SplendorSession;
  data: GameSnapshot;
  onLeave: () => void;
  onStartNextMatch?: () => Promise<boolean>;
  startNextMatchPending?: boolean;
}) {
  const ui = useSplendorPlayUI(data);
  const [showResults, setShowResults] = useState(data.roomData.gameStatus === 'end');
  const playable = data.roomData.gameStatus === 'playing' || data.roomData.gameStatus === 'last_turn';
  const myTurn = data.roomData.currentPlayer === data.playerId;
  const interactive = playable && myTurn && !session.pending && session.connection.status === 'connected';
  const me = data.playerData[data.playerId];
  const cards = useMemo(() => boardCards(data), [data]);
  const nobles = useMemo(() => boardNobles(data), [data]);
  const reserved = me?.reserveCard ?? [];
  const allPlayerCards = Object.values(data.playerData).flatMap(player =>
    [...player.normalCard, ...player.reserveCard]);
  const selectedCard = [...cards, ...allPlayerCards].find(card => card.id === ui.selectedCardID);
  const selectedFromReserve = !!selectedCard && reserved.some(card => card.id === selectedCard.id);
  const selectedOwned = !!selectedCard && Object.values(data.playerData)
    .some(player => player.normalCard.some(card => card.id === selectedCard.id));
  const selectedGemCount = Object.values(ui.selectedGems).reduce((sum, count) => sum + (count ?? 0), 0);
  const gemsValid = gemSelectionValid(data, data.playerId, ui.selectedGems);
  const [, phaseDescription] = phaseCopy(data);
  const playerIDs = data.roomData.playerOrder?.length
    ? data.roomData.playerOrder
    : Object.keys(data.roomData.players);
  const myDiscounts = discounts(me);
  const selectedPlayerID = ui.selectedPlayerID ?? data.playerId;
  const selectedPlayer = data.playerData[selectedPlayerID];
  const selectedPlayerInfo = data.roomData.players[selectedPlayerID];
  const selectedNoble = nobles.find(noble => noble.id === ui.selectedNobleID)
    ?? Object.values(data.playerData).flatMap(player => player.nobleCard).find(noble => noble.id === ui.selectedNobleID);
  const availableColors = cardColors.filter(color => (data.roomData.gems[color] ?? 0) > 0).length;
  const selectionGoal = Math.min(3, availableColors);
  const selectionLocked = selectedGemCount >= selectionGoal || Object.values(ui.selectedGems).some(count => count === 2);
  const [roundTitle, roundDescription] = data.roomData.gameStatus === 'end'
    ? ['已结束', '本局已经结算']
    : data.roomData.gameStatus === 'last_turn'
      ? ['最后一轮', `${playerName(data.roomData.currentPlayer, data.roomData.players)} 正在行动`]
      : [`第 ${Math.max(1, data.turnNumber)} 轮`, `${playerName(data.roomData.currentPlayer, data.roomData.players)} 正在行动`];

  useEffect(() => {
    if (data.roomData.gameStatus === 'end') setShowResults(true);
  }, [data.roomData.gameStatus]);

  if (!me) return null;
  if (data.roomData.gameStatus === 'end' && showResults) {
    return <Results session={session} data={data} onViewBoard={() => setShowResults(false)} onLeave={onLeave}
      onRestart={onStartNextMatch} restarting={startNextMatchPending} />;
  }

  const closeCard = () => {
    ui.closePanel();
    ui.setSelectedCardID(undefined);
  };
  const submitTake = () => {
    if (!interactive || !gemsValid) return;
    const take = { ...ui.selectedGems };
    const wallet = walletAfterTake(me, take);
    if (overflowCount(wallet)) {
      ui.prepareReturn({ kind: 'take', take });
      return;
    }
    const payload: GemTakePayload = { take };
    if (session.submit('game_get_gem', payload)) ui.resetAction();
  };
  const submitReserve = () => {
    if (!selectedCard || selectedOwned || !interactive || !canReserve(data, data.playerId)) return;
    const wallet = walletAfterReserve(me, (data.roomData.gems.Gold ?? 0) > 0);
    if (overflowCount(wallet)) {
      ui.prepareReturn({ kind: 'reserve', cardID: selectedCard.id });
      return;
    }
    const payload: ReserveCardPayload = { cardID: selectedCard.id };
    if (session.submit('game_preserve_card', payload)) ui.resetAction();
  };
  const submitBuy = () => {
    if (selectedCard && !selectedOwned && interactive && canBuyCard(data, data.playerId, selectedCard)
      && session.submit('game_buy_card', selectedCard.id)) ui.resetAction();
  };
  const confirmReturn = () => {
    if (!ui.pendingAction) return;
    const submitted = ui.pendingAction.kind === 'take'
      ? session.submit('game_get_gem', {
        take: ui.pendingAction.take ?? {},
        returns: ui.returns,
      } satisfies GemTakePayload)
      : session.submit('game_preserve_card', {
        cardID: ui.pendingAction.cardID ?? 0,
        returns: ui.returns,
      } satisfies ReserveCardPayload);
    if (submitted) ui.resetAction();
  };
  const cancelReturn = () => {
    const reserve = ui.pendingAction?.kind === 'reserve';
    const cardID = ui.pendingAction?.cardID;
    ui.setPendingAction(undefined);
    ui.setReturns({});
    if (reserve && cardID) ui.openCard(cardID);
    else ui.closePanel();
  };
  const takeWallet = ui.pendingAction?.kind === 'take'
    ? walletAfterTake(me, ui.pendingAction.take ?? {})
    : walletAfterReserve(me, (data.roomData.gems.Gold ?? 0) > 0);
  const canSkip = interactive && canPass(data, data.playerId);
  const actionButton = canSkip && !selectedGemCount
    ? <ActionButton variant="primary" onClick={() => session.submit('game_get_gem', {})}>跳过回合</ActionButton>
    : <ActionButton variant="primary" disabled={!interactive || !gemsValid} onClick={submitTake}>
      {interactive ? selectedGemCount ? `确认拿取 ${selectedGemCount} 枚` : '请先选择宝石' : '等待当前玩家'}
      <ArrowRight size={16} /></ActionButton>;

  const bank = <div className={styles.bankTokens}>{gemColors.map(color => {
    const count = data.roomData.gems[color] ?? 0;
    const selected = color === 'Gold' ? 0 : ui.selectedGems[color] ?? 0;
    const disabled = color === 'Gold' || !interactive || !count
      || (!selected && selectionLocked);
    return <TokenControl key={color} color={color} count={count} selected={selected}
      disabled={disabled} blocked={!disabled && !selected && selectionLocked}
      onClick={() => color !== 'Gold' && ui.toggleGem(color)} />;
  })}</div>;

  return <div className={styles.play}>
    <header className={styles.topbar}><button type="button" aria-label="离开对局" onClick={onLeave}><ArrowLeft size={21} /></button>
      <div className={styles.brand}><GemIcon color="Red" size={25} /><span><b>SPLENDOR</b><small>璀 璨 宝 石 · 商 会</small></span></div>
      <span className={styles.divider} /><div className={styles.roomName}><strong>{data.roomID}</strong>
        <small>{playerIDs.length} 人 · {roundTitle} · {roundDescription}</small></div>
      <span className={styles.spacer} />
      {data.roomData.gameStatus === 'end' && <ActionButton onClick={() => setShowResults(true)}><Eye size={15} />查看结算</ActionButton>}
      <button type="button" aria-label="商会动态" onClick={() => ui.openPanel('activity')}><History size={18} /></button>
      <button type="button" aria-label="对局规则" onClick={() => ui.openPanel('rules')}><BookOpen size={19} /></button>
      <span className={styles.timer}>{data.roomData.turnDeadline && playable
        ? <TurnCountdown bare secondsOnly deadline={data.roomData.turnDeadline} />
        : <b>--</b>}</span>
    </header>
    <span className={styles.live} role="status" aria-live="polite">{roundDescription}。{phaseDescription}</span>
    <main className={styles.content}>
      <section className={styles.players} aria-label="玩家概览" data-player-count={playerIDs.length}>
        {playerIDs.map(id => {
          const player = data.roomData.players[id];
          const state = data.playerData[id];
          const current = id === data.roomData.currentPlayer;
          const bonus = discounts(state);
          return <button type="button" key={id} className={current ? styles.currentPlayer : ''}
            onClick={() => ui.openCollection(id)} aria-current={current || undefined}>
            <PlayerAvatar name={playerName(id, data.roomData.players)} avatar={player?.avatar} ai={player?.ai} size={34} />
            <div className={styles.playerInfo}><strong>{playerName(id, data.roomData.players)}
              {id === data.playerId && <em>你</em>}</strong>
              <span><Layers size={11} />{state?.normalCard.length ?? 0}<i /> <Coins size={11} />{tokenTotal(state)}
                <i /> <Bookmark size={11} />{state?.reserveCard.length ?? 0}</span></div>
            <div className={styles.playerScore}><b>{state?.score ?? 0}</b><small>声望</small></div>
            <div className={styles.publicResources}><span><i>宝石</i><i>折扣</i><i>筹码</i></span>
              {gemColors.map(color => <span key={color}><GemIcon color={color} size={18} />
                <b>{color === 'Gold' ? '—' : bonus[color]}</b><i>{state?.gem[color] ?? 0}</i></span>)}</div>
            {current && <i className={styles.currentLine} />}
          </button>;
        })}
      </section>

      <div className={styles.layout}><section className={styles.market}>
        <div className={styles.nobleArea}><header><Crown size={14} /><span>贵族的青睐</span>
          <small>只计算永久折扣 · 自动结算</small></header>
          <div>{nobles.map(noble => <NobleTile key={noble.id} noble={noble}
            progress={myDiscounts} compact onClick={() => ui.openNoble(noble.id)} />)}</div></div>
        <div className={styles.marketArea}><header><span><Layers size={14} />发展卡市场</span>
          <small>{interactive ? <><Check size={13} />绿色标记 · 可购买</> : '当前牌桌只读'}</small></header>
          <div className={styles.cardRows}>{([3, 2, 1] as const).map(level => <div className={styles.cardRow} key={level}>
            <DeckBack level={level} count={deckCount(data, level)} />
            {cards.filter(card => card.level === level).map(card => <DevelopmentCardView key={card.id}
              card={card} affordable={interactive && canBuyCard(data, data.playerId, card)}
              selected={ui.selectedCardID === card.id} onClick={() => ui.openCard(card.id)} />)}
          </div>)}</div>
          <footer><span>S P L E N D O R</span><span>每次购买，都让下一次更轻松。</span><span>THE GILDED HOUR</span></footer>
        </div>
      </section>

      <aside className={styles.sidebar}><section className={styles.bankPanel}><header><h3>宝石银行</h3><span>选择 · 再确认</span></header>
        {bank}<p className={styles.bankHint}><Info size={13} />{!interactive ? '当前牌桌只读，请等待你的回合'
          : selectedGemCount ? `已选择 ${selectedGemCount} 枚${tokenTotal(me) + selectedGemCount > 10 ? `，需退还 ${tokenTotal(me) + selectedGemCount - 10} 枚` : ''}`
            : `选择 ${selectionGoal} 种不同颜色，或库存至少四枚时拿同色两枚`}</p>
        <div className={styles.selection}><span>{selectedGemCount ? `已选 ${selectedGemCount} / ${selectionGoal} 枚` : '选择你需要的宝石'}</span>
          <button type="button" disabled={!selectedGemCount || !interactive} onClick={() => ui.setSelectedGems({})}>清空</button></div>
        {actionButton}</section>
        <section className={styles.collectionPanel}><header><h3>我的预留</h3>
          <button type="button" onClick={() => ui.openCollection(data.playerId)}>详情 <ArrowRight size={14} /></button></header>
          <div className={styles.reserveSummary}><span><Bookmark size={13} />预留 <b>{reserved.length}/3</b></span>
            <span>筹码 <b>{tokenTotal(me)}/10</b></span></div>
          <div className={styles.reservedMini}>{reserved.map(card => <button type="button" key={card.id} onClick={() => ui.openCard(card.id)}>
            <DevelopmentCardView card={card} density="mini" affordable={interactive && canBuyCard(data, data.playerId, card)} />
          </button>)}{!reserved.length && <p>看中的卡，可以先留在手里。</p>}</div></section>
        <section className={styles.activity}><header><h3><History size={14} />最新动态</h3>
          <button type="button" onClick={() => ui.openPanel('activity')}>全部</button></header>
          <p>{ui.activities[0]?.text || '本次连接还没有新的动作记录。'}</p></section>
      </aside></div>
    </main>

    <div className={styles.mobileDock}><section><div><h3>宝石银行</h3><small>{selectedGemCount
      ? `已选 ${selectedGemCount} 枚${tokenTotal(me) + selectedGemCount > 10 ? ` · 需退 ${tokenTotal(me) + selectedGemCount - 10} 枚` : ''}`
      : interactive ? '直接选择宝石，再确认拿取' : '当前牌桌只读'}</small></div>{bank}</section>
      <div className={styles.mobileWalletHead}><button type="button" onClick={() => ui.openCollection(data.playerId)}>我的资源</button>
        <span>筹码 <b>{tokenTotal(me)} / 10</b></span>
        <button type="button" onClick={() => ui.openCollection(data.playerId)}><Bookmark size={12} />预留 {reserved.length}/3</button></div>
      <div className={styles.mobileWallet}>{gemColors.map(color => <span key={color}><GemIcon color={color} size={19} />
        <b>{me.gem[color] ?? 0}</b><small>{color === 'Gold' ? '百搭' : `折扣 ${myDiscounts[color]}`}</small></span>)}</div>
      <div className={styles.mobileActions}>{selectedGemCount > 0 && <ActionButton onClick={() => ui.setSelectedGems({})}><X size={14} />清空</ActionButton>}
        {actionButton}</div></div>

    {ui.panel?.type === 'card' && selectedCard && <CardActionDialog card={selectedCard} player={me}
      goldAvailable={(data.roomData.gems.Gold ?? 0) > 0} fromReserve={selectedFromReserve}
      interactive={interactive && !selectedOwned} reserveAllowed={canReserve(data, data.playerId)}
      onClose={closeCard} onBuy={submitBuy} onReserve={submitReserve} />}
    {ui.panel?.type === 'return' && ui.pendingAction && <ReturnTokensDialog wallet={takeWallet}
      returns={ui.returns} onChange={ui.setReturns} onCancel={cancelReturn} onConfirm={confirmReturn} />}
    {ui.panel?.type === 'collection' && selectedPlayer && <CollectionDialog
      name={playerName(selectedPlayerID, data.roomData.players)} avatar={selectedPlayerInfo?.avatar}
      ai={selectedPlayerInfo?.ai} player={selectedPlayer} isSelf={selectedPlayerID === data.playerId}
      onClose={() => ui.closePanel()} onCard={ui.openCard} onNoble={ui.openNoble} />}
    {ui.panel?.type === 'noble' && selectedNoble && <NobleDetailDialog noble={selectedNoble} player={me}
      onClose={() => ui.closePanel()} />}
    {ui.panel?.type === 'activity' && <ActivityDialog entries={ui.activities} onClose={() => ui.closePanel()} />}
    {ui.panel?.type === 'rules' && <Dialog title="每回合，只做一个选择" eyebrow="CLASSIC SPLENDOR"
      onClose={() => ui.closePanel()} footer={<ActionButton variant="primary" onClick={() => ui.closePanel()}>知道了</ActionButton>}>
      <div className={styles.rules}>{rules.map(([title, text], index) => <article key={title}>
        <span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
      <p className={styles.ruleNotice}><ShieldCheck size={16} />身份、回合、支付与终局全部由服务端校验。</p>
    </Dialog>}
  </div>;
}
