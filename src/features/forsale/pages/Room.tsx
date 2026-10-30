import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Clock3,
  Coins,
  Copy,
  Crown,
  Gavel,
  Globe2,
  LockKeyhole,
  Plus,
  Settings2,
  Share2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  StandardGameMobileRoom,
  StandardGameMobileRoomDialogs,
} from '@/components/GameUI/GameRoomMobile';
import { ResponsiveDialog } from '@/components/GameUI/ResponsiveDialog';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import { orderGameRoomSeats } from '@/features/game-core/model/room';
import { forSaleRoomInviteURL } from '../model/adapters';
import {
  playerLabel,
  playerName,
  type MatchSnapshot,
} from '../model/session';
import {
  roundsFor,
  startingCoins,
  type Visibility,
} from '../model/types';
import type { ForSaleSession } from '../hooks/useForSaleSession';
import { PlayerAvatar } from '../components/GamePieces';

type Panel = 'settings' | 'invite' | 'remove' | 'start' | undefined;

export const Room = ({
  session,
  data,
  onLeave,
}: {
  session: ForSaleSession;
  data: MatchSnapshot;
  onLeave: () => void;
}) => {
  const { isMobile } = useMobileViewport();
  const [panel, setPanel] = useState<Panel>();
  const [target, setTarget] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(data.visibility);
  const [copyMessage, setCopyMessage] = useState('');
  const enabled = session.connection.status === 'connected' && !session.pending;
  const owner = data.playerID === data.ownerID;
  const players = Object.entries(data.players);
  const seats = useMemo(() => orderGameRoomSeats(
    data.players,
    data.playerOrder,
    data.maxPlayers,
  ).map(id => id ? [id, data.players[id]] as const : undefined), [
    data.maxPlayers,
    data.playerOrder,
    data.players,
  ]);
  const allReady = players.length >= 3
    && players.every(([, player]) => player.ready && (player.online || player.ai));
  const readyCount = players.filter(([, player]) =>
    player.ready && (player.online || player.ai),
  ).length;
  const count = Math.max(3, players.length);
  const readinessTitle = owner
    ? allReady
      ? '所有买家已准备，可以开拍。'
      : players.length < 3
        ? '再来几位，就能开拍。'
        : '等待所有真人准备。'
    : data.players[data.playerID]?.ready
      ? '你已准备，等待房主开拍。'
      : '准备好后，告诉房主你已就绪。';
  const close = () => setPanel(undefined);
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
    } catch {
      setCopyMessage('复制未成功，请选中房间号手动复制');
    }
  };
  const getPlayerName = (playerID: string) =>
    playerName(playerID, data.players);
  const renderMobileAvatar = (
    player: { name: string; avatar?: string; ai: boolean },
    size: number,
  ) => <PlayerAvatar name={player.name} avatar={player.avatar}
    ai={player.ai} size={size} />;

  if (isMobile) {
    return <div className="fs-room-page">
      <StandardGameMobileRoom
        data={data}
        minPlayers={3}
        enabled={enabled}
        pending={!!session.pending}
        getPlayerName={getPlayerName}
        getPlayerRole={(id, player) => id === data.ownerID
          ? '房主'
          : player.ai ? '公平 AI' : '买家'}
        renderAvatar={renderMobileAvatar}
        copy={{
          kicker: 'THE SUNDAY AUCTION · 房间号',
          gameLabel: '经典拍卖',
          facts: [
            { icon: <Coins />, label: '起始金币', value: `${startingCoins(count)} 枚` },
            { icon: <Clock3 />, label: '阶段轮数', value: `${roundsFor(count)} + ${roundsFor(count)}` },
            { icon: <ShieldCheck />, label: '操作时限', value: '60 秒' },
          ],
          summary: [
            { label: '玩法', value: '经典拍卖' },
            { label: '房间范围', value: data.visibility === 'private'
              ? '私密多人房间' : '公开多人房间' },
            { label: '起始金币', value: `${startingCoins(count)} 枚` },
            { label: '已入座', value: `${players.length} / 6 人` },
          ],
          summaryEyebrow: 'BEFORE THE FIRST BID',
          summaryTitle: '邻居都到了，就等一声落槌。',
          ownerHint: '实际开局人数决定金币、移除牌和每阶段轮数。真人与 AI 使用同一权威规则。',
          memberHint: '准备好后等待房主开拍。隐藏资产按席位隔离。',
          waitingTitle: players.length < 3
            ? '再来几位，就能开拍。'
            : '等待所有真人准备。',
          readyTitle: '所有买家已准备，可以开拍。',
          ownerDescription: '你是房主，由你开启这一局。',
          memberReadyDescription: '你已准备，等待房主开拍。',
          memberWaitingDescription: '准备好后，告诉房主你已就绪。',
          ownerActionLabel: '开始拍卖',
        }}
        media={<Gavel size={92} />}
        classNames={{
          table: 'fs-room-table',
          seatGrid: 'fs-seat-grid',
          seat: 'fs-seat',
        }}
        onLeave={onLeave}
        onSettings={() => {
          setVisibility(data.visibility);
          setPanel('settings');
        }}
        onInvite={() => {
          setCopyMessage('');
          setPanel('invite');
        }}
        onAddAI={seatIndex => session.submit(
          'match_add_ai',
          typeof seatIndex === 'number' ? { seatIndex } : {},
        )}
        onRemove={playerID => {
          setTarget(playerID);
          setPanel('remove');
        }}
        onReady={() => session.submit('match_ready', {
          ready: !data.players[data.playerID]?.ready,
        })}
        onStart={() => setPanel('start')}
      />
      <StandardGameMobileRoomDialogs
        panel={panel}
        data={data}
        targetID={target}
        visibility={visibility}
        copyMessage={copyMessage}
        enabled={enabled}
        getPlayerName={getPlayerName}
        renderAvatar={renderMobileAvatar}
        inviteTitle="给朋友，留一个好位置。"
        settingsHint="人数、规则和时限固定，开局后不能修改公开范围。"
        startTitle="合伙人齐了，开场吧。"
        startFacts={[
          { icon: <Users />, label: '本场人数', value: `${players.length} 人` },
          { icon: <Coins />, label: '起始金币', value: `${startingCoins(players.length)} 枚` },
          { icon: <Clock3 />, label: '操作时限', value: '60 秒' },
        ]}
        startHint="确认后由服务端洗牌并随机决定首位买家。"
        themeClassName="forsale-root"
        onVisibilityChange={setVisibility}
        onCopyRoomID={() => void copy(data.roomID, '房间号已复制')}
        onCopyInviteURL={() => void copy(
          forSaleRoomInviteURL(data.roomID),
          '邀请链接已复制',
        )}
        onSaveSettings={() => {
          if (session.submit('room_update_settings', { visibility })) close();
        }}
        onConfirmRemove={() => {
          if (session.submit('match_remove_player', { playerID: target })) close();
        }}
        onConfirmStart={() => {
          if (session.submit('match_begin')) close();
        }}
        onClose={close}
      />
    </div>;
  }

  return <div className="fs-room-page"><header className="fs-room-heading" data-game-room-heading>
    <div data-game-room-heading-identity><button type="button" data-game-room-heading-back aria-label="离开当前房间" onClick={onLeave}>
      <ArrowLeft size={19} /></button><span data-game-room-heading-copy><small data-game-room-heading-kicker>THE SUNDAY AUCTION · 房间号</small>
      <h1 data-game-room-heading-title>{data.roomID}<em>准备中</em></h1><p data-game-room-heading-meta>{
        data.visibility === 'private' ? '私密拍卖桌' : '公开拍卖桌'} · 新版经典规则</p>
    </span></div><nav data-game-room-heading-actions>{owner && <ActionButton onClick={() => {
      setVisibility(data.visibility);
      setPanel('settings');
    }}><Settings2 size={16} />房间设置</ActionButton>}
      <ActionButton variant="primary" onClick={() => {
        setCopyMessage('');
        setPanel('invite');
      }}><Share2 size={16} />邀请好友</ActionButton></nav></header>

    <div className="fs-room-layout">
      <section className="fs-room-table">
        <header><span><Users size={16} />经典拍卖<i />{players.length} / 6 人</span>
          <div className="fs-room-preparation"><span className="done">
            <Check size={12} />入座</span><i /><span className="active">02 准备</span>
            <i /><span>03 开拍</span></div></header>
        <div className="fs-room-stage">
          <div className="fs-room-orbit" />
          <div className="fs-room-orbit second" />
          <section className="fs-seat-grid">{seats.map((entry, index) => {
            if (!entry) {
              return <button className="fs-seat empty" type="button"
                data-game-room-seat-index={index} key={index} disabled={!owner || !enabled}
                aria-label={`在席位 ${index + 1} 添加人机`}
                onClick={() => session.submit('match_add_ai', { seatIndex: index })}>
                <span>SEAT {String(index + 1).padStart(2, '0')}</span>
                <i>{owner ? <Bot size={24} /> : <Plus size={24} />}</i>
                <h3>{owner ? '添加公平 AI' : '等待买家'}</h3>
                <p>{owner ? '点击入座 · 自动准备' : '邀请好友加入'}</p></button>;
            }
            const [id, player] = entry;
            const self = id === data.playerID;
            return <article className={`fs-seat ${self ? 'self' : ''}`}
              data-game-room-seat-index={index} data-game-room-player-id={id} key={id}>
              <span>SEAT {String(index + 1).padStart(2, '0')}</span>
              <PlayerAvatar name={playerName(id, data.players)} avatar={player.avatar}
                ai={player.ai} size={58} />
              <h3>{playerLabel(id, data.players)}
                {id === data.ownerID && <Crown size={12} />}
                {self && <em>你</em>}</h3>
              <b className={player.ready ? 'ready' : ''}>{
                player.ready ? <Check size={13} /> : <Clock3 size={13} />}
                {player.ready ? '准备就绪' : player.online ? '等待准备' : '暂时离线'}
                {player.ai && ' · 人机'}</b>
              {owner && id !== data.ownerID && <button type="button"
                className="fs-seat-remove" disabled={!enabled}
                aria-label={`移除 ${playerLabel(id, data.players)}`}
                onClick={() => { setTarget(id); setPanel('remove'); }}>
                <X size={14} /></button>}</article>;
          })}</section>
        </div>
        <footer><span><Coins size={16} /><small>起始金币</small>
          <b>{startingCoins(count)} 枚</b></span>
          <span><Clock3 size={16} /><small>阶段轮数</small>
            <b>{roundsFor(count)} + {roundsFor(count)}</b></span>
          <span><ShieldCheck size={16} /><small>已准备</small>
            <b>{readyCount} / {players.length}</b></span></footer>
      </section>

      <aside className="fs-room-facts">
        <span className="fs-eyebrow">BEFORE THE FIRST BID</span>
        <h2>邻居都到了，就等一声落槌。</h2>
        <div className="fs-room-visibility">{
          data.visibility === 'private' ? <LockKeyhole size={23} /> : <Globe2 size={23} />}
          <span><b>{data.visibility === 'private' ? '凭房间号加入' : '公开多人房间'}</b>
            <p>{data.visibility === 'private'
              ? '请直接分享房间号或邀请链接。'
              : '其他玩家可以从大厅找到这张桌。'}</p></span></div>
        <dl><div><dt>玩法</dt><dd>经典拍卖</dd></div>
          <div><dt>已入座</dt><dd>{players.length} / 6 人</dd></div>
          <div><dt>起始金币</dt><dd>{startingCoins(count)} 枚</dd></div>
          <div><dt>操作时限</dt><dd>60 秒</dd></div></dl>
        <div className="fs-room-note"><ShieldCheck size={18} /><span>
          <b>至少 3 人，全部准备后开始</b>
          <p>实际开局人数决定金币、移除牌和每阶段轮数。真人与 AI 使用同一权威规则。</p>
        </span></div>
      </aside>
    </div>

    <footer className="fs-ready-dock"><div className="fs-ready-copy">
      <span className={allReady ? 'ready' : ''}>{
        allReady ? <Check size={18} /> : <Gavel size={18} />}</span>
      <span><b>{readinessTitle}</b><small>{owner
        ? '你是房主，由你开启这一局。'
        : '确认准备后，由房主开始拍卖。'}</small></span></div>
      <div className="fs-ready-actions">{owner
        ? <ActionButton variant="primary" pending={!!session.pending}
          disabled={!enabled || !allReady}
          onClick={() => setPanel('start')}>开始拍卖<ArrowRight size={17} /></ActionButton>
        : <ActionButton variant="primary" pending={!!session.pending} disabled={!enabled}
          onClick={() => session.submit('match_ready', {
            ready: !data.players[data.playerID]?.ready,
          })}>{data.players[data.playerID]?.ready ? '取消准备' : '我准备好了'}
          <Check size={16} /></ActionButton>}</div></footer>

    {panel === 'invite' && <ResponsiveDialog title="给朋友，留一个好位置。"
      eyebrow="BETTER AROUND ONE TABLE" onClose={close}
      footer={<><ActionButton onClick={() =>
        void copy(data.roomID, '房间号已复制')}><Copy size={15} />复制房间号</ActionButton>
        <ActionButton variant="primary" onClick={() =>
          void copy(forSaleRoomInviteURL(data.roomID), '邀请链接已复制')}>
          <Copy size={15} />复制邀请链接</ActionButton></>}>
      <div className="fs-invite"><div>{players.map(([id, player]) =>
        <PlayerAvatar key={id} name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={42} />)}
        {players.length < 6 && <i><Plus size={19} /></i>}</div>
        <p>房间 {data.roomID} 还有 {6 - players.length} 个席位。</p>
        <input aria-label="邀请房间号" value={data.roomID} readOnly
          onFocus={event => event.currentTarget.select()} />
        <small>{copyMessage || '分享完整房间号或邀请链接。'}</small></div>
    </ResponsiveDialog>}

    {owner && panel === 'settings' && <ResponsiveDialog title="房间设置"
      eyebrow="ROOM VISIBILITY" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="primary" disabled={!enabled} onClick={() => {
          if (session.submit('room_update_settings', { visibility })) close();
        }}>保存设置<Check size={15} /></ActionButton></>}>
      <div className="fs-dialog-copy"><p>人数、规则和时限固定，只需决定房间如何被找到。</p>
        <div className="fs-choice-grid">{(['public', 'private'] as const).map(value =>
          <button type="button" key={value} aria-pressed={visibility === value}
            onClick={() => setVisibility(value)}>
            {value === 'public' ? <Globe2 size={23} /> : <LockKeyhole size={23} />}
            <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
              <small>{value === 'public' ? '展示在大厅' : '凭房间号加入'}</small></span>
            {visibility === value && <Check size={15} />}</button>)}</div></div>
    </ResponsiveDialog>}

    {panel === 'remove' && <ResponsiveDialog title="让这个席位空出来？"
      eyebrow="REMOVE PLAYER" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="danger" disabled={!enabled} onClick={() => {
          if (session.submit('match_remove_player', { playerID: target })) close();
        }}>确认移除</ActionButton></>}>
      <p>{playerLabel(target, data.players)} 将离开当前房间。</p>
    </ResponsiveDialog>}

    {panel === 'start' && <ResponsiveDialog title="合伙人齐了，开场吧。"
      eyebrow="READY FOR THE FIRST BID" onClose={close}
      footer={<><ActionButton onClick={close}>再等一下</ActionButton>
        <ActionButton variant="primary" disabled={!enabled || !allReady}
          onClick={() => { if (session.submit('match_begin')) close(); }}>
          确认开局<ArrowRight size={16} /></ActionButton></>}>
      <div className="fs-start-dialog"><div>{players.map(([id, player]) =>
        <span key={id}><PlayerAvatar name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={45} />
          <b>{playerLabel(id, data.players)}</b><small><Check size={11} />已准备</small></span>)}</div>
        <dl><span><Users size={17} /><small>本场人数</small><b>{players.length} 人</b></span>
          <span><Coins size={17} /><small>起始金币</small>
            <b>{startingCoins(players.length)} 枚</b></span>
          <span><Clock3 size={17} /><small>操作时限</small><b>60 秒</b></span></dl>
        <p><ShieldCheck size={14} />确认后由服务端洗牌并随机决定首位买家。</p></div>
    </ResponsiveDialog>}
  </div>;
};
