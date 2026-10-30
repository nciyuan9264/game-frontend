import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Copy,
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
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import { orderGameRoomSeats } from '@/features/game-core/model/room';
import { sixNimmtRoomInviteURL } from '../../model/adapters';
import { playerLabel, playerName, type MatchSnapshot } from '../../model/session';
import type { SixNimmtSession } from '../../hooks/useSixNimmtSession';
import type { Visibility } from '../../model/types';
import { Bull, PlayerAvatar } from '../../components/AppShell';
import { NumberCard } from '../../components/Card';
import { Dialog } from '../../components/Dialog';

type Panel = 'settings' | 'invite' | 'remove' | 'start' | undefined;

export function Room({
  session,
  data,
  onLeave,
}: {
  session: SixNimmtSession;
  data: MatchSnapshot;
  onLeave: () => void;
}) {
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
  const allReady = players.length >= 2
    && players.every(([, player]) => player.ready && (player.online || player.ai));
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
    return <div className="sn-room-page">
      <StandardGameMobileRoom
        data={data}
        minPlayers={2}
        denseSeats
        enabled={enabled}
        pending={!!session.pending}
        getPlayerName={getPlayerName}
        getPlayerRole={(id, player) => id === data.ownerID
          ? '房主'
          : player.ai ? '公平 AI' : '牧场玩家'}
        renderAvatar={renderMobileAvatar}
        copy={{
          kicker: 'THE PLAYFUL TABLE · 房间号',
          gameLabel: '经典 66 分制',
          facts: [
            { icon: <Users />, label: '人数', value: '2–10 人' },
            { icon: <Bull />, label: '终局阈值', value: '66 牛头' },
            { icon: <Clock3 />, label: '阶段时限', value: '60 秒' },
          ],
          summary: [
            { label: '规则', value: '经典 66 分制' },
            { label: '牌组', value: '1–104 · 每人 10 张' },
            { label: '已入座', value: `${players.length} / 10 人` },
          ],
          summaryEyebrow: 'BEFORE THE FIRST CARD',
          summaryTitle: '伙伴就位，就差你了。',
          ownerHint: '所有人同时暗选，服务端隔离隐藏选择。邀请朋友或添加公平 AI 后，由你发牌。',
          memberHint: '准备好后等待房主发牌。其他玩家锁定前看不到你的牌。',
          readyTitle: '所有在座玩家已准备，可以发牌。',
          ownerDescription: '你是房主，由你开启这一局。',
          memberReadyDescription: '你已准备，等待房主发牌。',
          memberWaitingDescription: '确认准备后，由房主开始对局。',
        }}
        media={<Bull size={92} />}
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
        inviteTitle="给朋友，留一张牌桌。"
        settingsHint="经典规则、10 个席位和 60 秒时限固定。"
        startTitle="现在开始发牌？"
        startFacts={[
          { icon: <Users />, label: '本场人数', value: `${players.length} 人` },
          { icon: <Bull />, label: '终局阈值', value: '66 牛头' },
          { icon: <Clock3 />, label: '阶段时限', value: '60 秒' },
        ]}
        startHint="确认后由服务端洗牌，每人获得 10 张唯一数字牌。"
        themeClassName="sixnimmt-root"
        onVisibilityChange={setVisibility}
        onCopyRoomID={() => void copy(data.roomID, '房间号已复制')}
        onCopyInviteURL={() => void copy(
          sixNimmtRoomInviteURL(data.roomID),
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

  return <div className="sn-room-page">
    <header className="sn-room-heading" data-game-room-heading><div data-game-room-heading-identity>
      <button type="button" data-game-room-heading-back aria-label="离开当前房间" onClick={onLeave}>
        <ArrowLeft size={19} /></button>
      <span data-game-room-heading-copy><small data-game-room-heading-kicker>THE PLAYFUL TABLE · 房间号</small>
        <h1 data-game-room-heading-title>{data.roomID}<em>准备中</em></h1>
        <p data-game-room-heading-meta>{data.visibility === 'private' ? '私密牌桌' : '公开牌桌'} · 经典 66 分制</p></span>
    </div><nav data-game-room-heading-actions>{owner && <ActionButton onClick={() => {
      setVisibility(data.visibility);
      setPanel('settings');
    }}><Settings2 size={16} />房间设置</ActionButton>}
      <ActionButton variant="primary" onClick={() => {
        setCopyMessage('');
        setPanel('invite');
      }}><Share2 size={16} />邀请好友</ActionButton></nav>
    </header>

    <section className="sn-room-banner"><div>
      <span className="sn-eyebrow">EVERYONE AT THE TABLE</span>
      <h2>伙伴就位，就差你了。</h2>
      <p>所有人同时暗选一张；服务端负责洗牌、入列、计分与超时托管。</p>
    </div><Bull size={112} /><span><Users size={15} />{players.length} / 10 已入座</span></section>

    <section className="sn-seat-grid">{seats.map((entry, index) => {
      if (!entry) {
        return <button className="sn-seat sn-seat-empty" type="button"
          data-game-room-seat-index={index} key={index} disabled={!owner || !enabled}
          aria-label={`添加人机到席位 ${index + 1}`}
          onClick={() => session.submit('match_add_ai', { seatIndex: index })}>
          <span>SEAT {String(index + 1).padStart(2, '0')}</span>
          <i><Plus size={20} /></i><h3>留一个位置</h3>
          <p>{owner ? '点击添加公平 AI' : '等待房主安排席位'}</p>
        </button>;
      }
      const [id, player] = entry;
      const self = id === data.playerID;
      return <article className={`sn-seat ${self ? 'self' : ''}`}
        data-game-room-seat-index={index} data-game-room-player-id={id} key={id}>
        <span>SEAT {String(index + 1).padStart(2, '0')}</span>
        <PlayerAvatar name={playerName(id, data.players)} avatar={player.avatar}
          ai={player.ai} size={48} />
        <small>{id === data.ownerID ? '房主' : player.ai ? '公平 AI' : '牧场玩家'}</small>
        <h3>{playerLabel(id, data.players)}{self && <em>你</em>}</h3>
        <b className={player.ready ? 'ready' : ''}>
          {player.ready ? <Check size={12} /> : <Clock3 size={12} />}
          {player.ready ? '准备就绪' : player.online ? '等待准备' : '暂时离线'}</b>
        {owner && id !== data.ownerID && <button type="button"
          className="sn-seat-remove" disabled={!enabled}
          aria-label={`移除 ${playerLabel(id, data.players)}`}
          onClick={() => { setTarget(id); setPanel('remove'); }}>
          <X size={14} /></button>}
      </article>;
    })}</section>

    <section className="sn-room-summary"><div>
      {data.visibility === 'private' ? <LockKeyhole size={21} /> : <Globe2 size={21} />}
      <span><b>{data.visibility === 'private' ? '凭房间号加入' : '公开多人牌桌'}</b>
        <small>{data.visibility === 'private'
          ? '不会展示在公开大厅，请直接分享邀请链接。'
          : '其他玩家可以从大厅找到并加入。'}</small></span></div>
      <dl><div><dt>人数</dt><dd>2–10 人</dd></div>
        <div><dt>规则</dt><dd>经典 66 分制</dd></div>
        <div><dt>阶段时限</dt><dd>60 秒</dd></div>
        <div><dt>牌组</dt><dd>1–104 · 每人 10 张</dd></div></dl>
      <p><ShieldCheck size={14} />AI 只读取自己的手牌和公开牌列；所有隐藏选择由服务端隔离。</p>
    </section>

    <footer className="sn-ready-dock"><p><Bull size={15} />{owner
      ? allReady ? '所有在座玩家已准备，可以发牌。' : '至少 2 人，并等待所有真人准备。'
      : data.players[data.playerID]?.ready ? '你已准备，等待房主发牌。' : '确认准备后，由房主开始对局。'}</p>
      {owner
        ? <ActionButton variant="primary" disabled={!enabled || !allReady}
          aria-label="开始对局" onClick={() => setPanel('start')}>
          开始对局<ArrowRight size={17} /></ActionButton>
        : <ActionButton variant="primary" disabled={!enabled}
          onClick={() => session.submit('match_ready', {
            ready: !data.players[data.playerID]?.ready,
          })}>{data.players[data.playerID]?.ready ? '已准备 · 取消准备' : '我准备好了'}
          {data.players[data.playerID]?.ready ? <Check size={17} /> : <ArrowRight size={17} />}
        </ActionButton>}
      <button type="button" onClick={onLeave}>离开房间</button>
    </footer>

    {panel === 'invite' && <Dialog title="给朋友，留一张牌桌。"
      eyebrow="INVITE SOMEONE TO THE TABLE" onClose={close}
      footer={<><ActionButton onClick={() =>
        void copy(data.roomID, '房间号已复制')}><Copy size={15} />复制房间号</ActionButton>
        <ActionButton variant="primary" onClick={() =>
          void copy(sixNimmtRoomInviteURL(data.roomID), '邀请链接已复制')}>
          <Copy size={15} />复制邀请链接</ActionButton></>}>
      <div className="sn-invite"><div>{players.map(([id, player]) =>
        <PlayerAvatar key={id} name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={40} />)}
        {players.length < 10 && <i><Plus size={18} /></i>}</div>
        <p>房间 {data.roomID} 还有 {10 - players.length} 个席位。</p>
        <input aria-label="邀请房间号" value={data.roomID} readOnly
          onFocus={event => event.currentTarget.select()} />
        <small>{copyMessage || (data.visibility === 'private'
          ? '私密房间请分享完整房间号或邀请链接。'
          : '朋友也可以从在线大厅找到这张牌桌。')}</small></div>
    </Dialog>}

    {owner && panel === 'settings' && <Dialog title="房间设置"
      eyebrow="ROOM VISIBILITY" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="primary" disabled={!enabled} onClick={() => {
          if (session.submit('room_update_settings', { visibility })) close();
        }}>保存设置<Check size={15} /></ActionButton></>}>
      <div className="sn-dialog-copy"><p>经典规则、10 个席位和 60 秒时限固定，只需决定房间如何被找到。</p>
        <div className="sn-choice-grid">{(['public', 'private'] as const).map(value =>
          <button type="button" key={value}
            aria-pressed={visibility === value}
            onClick={() => setVisibility(value)}>
            {value === 'public' ? <Globe2 size={23} /> : <LockKeyhole size={23} />}
            <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
              <small>{value === 'public' ? '展示在在线大厅' : '凭完整房间号加入'}</small></span>
            {visibility === value && <Check size={15} />}</button>)}</div>
      </div>
    </Dialog>}

    {panel === 'remove' && <Dialog title="让这个席位空出来？"
      eyebrow="REMOVE PLAYER" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="danger" disabled={!enabled} onClick={() => {
          if (session.submit('match_remove_player', { playerID: target })) close();
        }}>确认移除</ActionButton></>}>
      <div className="sn-remove-copy"><Bull size={48} />
        <p>{playerLabel(target, data.players)} 将离开当前房间。之后仍可邀请朋友或添加公平 AI。</p></div>
    </Dialog>}

    {panel === 'start' && <Dialog title="现在开始发牌？"
      eyebrow="READY FOR THE FIRST CARD" onClose={close}
      footer={<><ActionButton onClick={close}>再等一下</ActionButton>
        <ActionButton variant="primary" disabled={!enabled || !allReady}
          onClick={() => {
            if (session.submit('match_begin')) close();
          }}>确认开局<ArrowRight size={16} /></ActionButton></>}>
      <div className="sn-start-dialog"><div>{players.map(([id, player]) =>
        <span key={id}><PlayerAvatar name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={42} />
          <b>{playerLabel(id, data.players)}</b><small><Check size={11} />已准备</small></span>)}</div>
        <dl><span><Users size={17} /><small>本场人数</small><b>{players.length} 人</b></span>
          <span><Bull size={17} /><small>终局阈值</small><b>66 牛头</b></span>
          <span><Clock3 size={17} /><small>阶段时限</small><b>60 秒</b></span></dl>
        <div className="sn-start-cards">{[24, 55, 88].map(value =>
          <NumberCard key={value} value={value} compact />)}</div>
        <p><ShieldCheck size={14} />确认后由服务端洗牌，每人获得 10 张唯一数字牌。</p></div>
    </Dialog>}
  </div>;
}
