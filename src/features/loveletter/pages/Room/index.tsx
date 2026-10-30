import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Clock3, Copy, Globe2, Heart, LockKeyhole,
  Mail, Plus, Settings2, Share2, ShieldCheck, Users, X,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  StandardGameMobileRoom,
  StandardGameMobileRoomDialogs,
} from '@/components/GameUI/GameRoomMobile';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import { orderGameRoomSeats } from '@/features/game-core/model/room';
import { loveLetterRoomInviteURL } from '../../model/adapters';
import { playerLabel, playerName, type MatchSnapshot } from '../../model/session';
import type { LoveLetterSession } from '../../hooks/useLoveLetterSession';
import type { Visibility } from '../../model/types';
import { PlayerAvatar } from '../../components/AppShell';
import { Hearts, Portrait, Seal } from '../../components/Card';
import { Dialog } from '../../components/Dialog';
import { goalFor } from '../../model/roles';

type Panel = 'settings' | 'invite' | 'remove' | 'start' | undefined;

export function Room({
  session,
  data,
  onLeave,
}: {
  session: LoveLetterSession;
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
  const goal = goalFor(players.length);
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
    return <div className="ll-room-page">
      <StandardGameMobileRoom
        data={data}
        minPlayers={2}
        enabled={enabled}
        pending={!!session.pending}
        getPlayerName={getPlayerName}
        getPlayerRole={(id, player) => id === data.ownerID
          ? '房主'
          : player.ai ? '公平 AI' : '执笔人'}
        renderAvatar={renderMobileAvatar}
        copy={{
          kicker: 'THE ROSE COURT · 房间号',
          gameLabel: '21 张牌新版',
          facts: [
            { icon: <Users />, label: '人数', value: '2–6 人' },
            { icon: <Heart />, label: '好感目标', value: `${goal} 枚` },
            { icon: <Clock3 />, label: '阶段时限', value: '60 秒' },
          ],
          summary: [
            { label: '人数', value: '2–6 人' },
            { label: '本场目标', value: `${goal} 枚好感` },
            { label: '牌组', value: '21 张 · 十角色' },
          ],
          summaryEyebrow: 'BEFORE THE FIRST LETTER',
          summaryTitle: '人已入席，信待启封。',
          ownerHint: '实际开局人数决定好感目标。邀请朋友或添加公平 AI 后，由你启封。',
          memberHint: '准备好后等待房主启封。自己的手牌只对当前席位可见。',
          readyTitle: '所有在座玩家已准备，可以启封。',
          ownerDescription: '你是房主，由你开启这一局。',
          memberReadyDescription: '你已准备，等待房主启封。',
          memberWaitingDescription: '确认准备后，由房主开始对局。',
        }}
        media={<Seal />}
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
        inviteTitle="给朋友，留一封密信。"
        settingsHint="实际开局人数决定好感目标，开局后不能修改公开范围。"
        startTitle="让第一封信出发？"
        startFacts={[
          { icon: <Users />, label: '本场人数', value: `${players.length} 人` },
          { icon: <Heart />, label: '好感目标', value: `${goal} 枚` },
          { icon: <Clock3 />, label: '阶段时限', value: '60 秒' },
        ]}
        startHint="确认后由服务端随机首轮先手并完成洗牌。"
        themeClassName="loveletter-root"
        onVisibilityChange={setVisibility}
        onCopyRoomID={() => void copy(data.roomID, '房间号已复制')}
        onCopyInviteURL={() => void copy(
          loveLetterRoomInviteURL(data.roomID),
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

  return <div className="ll-room-page">
    <header className="ll-room-heading" data-game-room-heading><div data-game-room-heading-identity>
      <button type="button" data-game-room-heading-back aria-label="离开当前房间" onClick={onLeave}>
        <ArrowLeft size={19} /></button>
      <span data-game-room-heading-copy><small data-game-room-heading-kicker>THE ROSE COURT · 房间号</small>
        <h1 data-game-room-heading-title>{data.roomID}<em>准备中</em></h1>
        <p data-game-room-heading-meta>{data.visibility === 'private' ? '私密庭院' : '公开庭院'} · 21 张牌官方新版</p></span>
    </div><nav data-game-room-heading-actions>{owner && <ActionButton onClick={() => {
      setVisibility(data.visibility);
      setPanel('settings');
    }}><Settings2 size={16} />房间设置</ActionButton>}
      <ActionButton variant="primary" onClick={() => {
        setCopyMessage('');
        setPanel('invite');
      }}><Share2 size={16} />邀请好友</ActionButton></nav>
    </header>

    <section className="ll-room-banner"><div>
      <span className="ll-eyebrow">GATHER AT THE COURT</span>
      <h2>人已入席，信待启封。</h2>
      <p>每位玩家只看见自己的手牌；服务端负责洗牌、规则与超时托管。</p>
    </div><Seal /><span><Users size={15} />{players.length} / 6 已入座</span></section>

    <section className="ll-seat-grid">{seats.map((entry, index) => {
      if (!entry) {
        return <button className="ll-seat ll-seat-empty" type="button"
          data-game-room-seat-index={index} key={index}
          disabled={!owner || !enabled} aria-label="添加人机"
          onClick={() => session.submit('match_add_ai', { seatIndex: index })}>
          <span>SEAT {String(index + 1).padStart(2, '0')}</span>
          <i><Plus size={24} /></i><h3>留一个位置</h3>
          <p>{owner ? '点击添加公平 AI' : '等待房主安排席位'}</p>
        </button>;
      }
      const [id, player] = entry;
      const self = id === data.playerID;
      return <article className={`ll-seat ${self ? 'self' : ''}`}
        data-game-room-seat-index={index} data-game-room-player-id={id} key={id}>
        <span>SEAT {String(index + 1).padStart(2, '0')}</span>
        <PlayerAvatar name={playerName(id, data.players)} avatar={player.avatar}
          ai={player.ai} size={58} />
        <small>{id === data.ownerID ? '房主' : player.ai ? '公平 AI' : '执笔人'}</small>
        <h3>{playerLabel(id, data.players)}{self && <em>你</em>}</h3>
        <Hearts total={goal} />
        <b className={player.ready ? 'ready' : ''}>
          {player.ready ? <Check size={13} /> : <Clock3 size={13} />}
          {player.ready ? '准备就绪' : player.online ? '等待准备' : '暂时离线'}</b>
        {owner && id !== data.ownerID && <button type="button"
          className="ll-seat-remove" disabled={!enabled}
          aria-label={`移除 ${playerLabel(id, data.players)}`}
          onClick={() => { setTarget(id); setPanel('remove'); }}>
          <X size={14} /></button>}
      </article>;
    })}</section>

    <section className="ll-room-summary"><div>
      {data.visibility === 'private' ? <LockKeyhole size={21} /> : <Globe2 size={21} />}
      <span><b>{data.visibility === 'private' ? '凭房间号加入' : '公开多人房间'}</b>
        <small>{data.visibility === 'private'
          ? '不会展示在公开大厅，请直接分享邀请链接。'
          : '其他玩家可以从大厅找到并加入。'}</small></span></div>
      <dl><div><dt>人数</dt><dd>2–6 人</dd></div>
        <div><dt>本场目标</dt><dd>{players.length >= 2 ? goal : '开局后确定'} 枚好感</dd></div>
        <div><dt>阶段时限</dt><dd>60 秒</dd></div>
        <div><dt>牌组</dt><dd>21 张 · 十角色</dd></div></dl>
      <p><ShieldCheck size={14} />真人与 AI 使用同一权威规则；AI 只读取自己的手牌和公开线索。</p>
    </section>

    <footer className="ll-ready-dock"><p><Mail size={15} />{owner
      ? allReady ? '所有在座玩家已准备，可以启封。' : '至少 2 人，并等待所有真人准备。'
      : data.players[data.playerID]?.ready ? '你已准备，等待房主启封。' : '确认准备后，由房主开始对局。'}</p>
      {owner
        ? <ActionButton variant="primary" disabled={!enabled || !allReady}
          aria-label="开始对局" onClick={() => setPanel('start')}>
          启封，开始对局<ArrowRight size={17} /></ActionButton>
        : <ActionButton variant="primary" disabled={!enabled}
          onClick={() => session.submit('match_ready', {
            ready: !data.players[data.playerID]?.ready,
          })}>{data.players[data.playerID]?.ready ? '已准备 · 取消准备' : '我准备好了'}
          {data.players[data.playerID]?.ready ? <Check size={17} /> : <ArrowRight size={17} />}
        </ActionButton>}
      <button type="button" onClick={onLeave}>离开房间</button>
    </footer>

    {panel === 'invite' && <Dialog title="给朋友，留一封密信。"
      eyebrow="INVITE SOMEONE TO THE COURT" onClose={close}
      footer={<><ActionButton onClick={() =>
        void copy(data.roomID, '房间号已复制')}><Copy size={15} />复制房间号</ActionButton>
        <ActionButton variant="primary" onClick={() =>
          void copy(loveLetterRoomInviteURL(data.roomID), '邀请链接已复制')}>
          <Copy size={15} />复制邀请链接</ActionButton></>}>
      <div className="ll-invite"><div>{players.map(([id, player]) =>
        <PlayerAvatar key={id} name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={42} />)}
        {players.length < 6 && <i><Plus size={19} /></i>}</div>
        <p>房间 {data.roomID} 还有 {6 - players.length} 个席位。</p>
        <input aria-label="邀请房间号" value={data.roomID} readOnly
          onFocus={event => event.currentTarget.select()} />
        <small>{copyMessage || (data.visibility === 'private'
          ? '私密房间请分享完整房间号或邀请链接。'
          : '朋友也可以从在线大厅找到这座庭院。')}</small></div>
    </Dialog>}

    {owner && panel === 'settings' && <Dialog title="房间设置"
      eyebrow="ROOM VISIBILITY" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="primary" disabled={!enabled} onClick={() => {
          if (session.submit('room_update_settings', { visibility })) close();
        }}>保存设置<Check size={15} /></ActionButton></>}>
      <div className="ll-dialog-copy"><p>规则、人数上限和阶段时限固定，只需决定房间如何被找到。</p>
        <div className="ll-choice-grid">{(['public', 'private'] as const).map(value =>
          <button type="button" key={value} aria-pressed={visibility === value}
            onClick={() => setVisibility(value)}>
            {value === 'public' ? <Globe2 size={23} /> : <LockKeyhole size={23} />}
            <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
              <small>{value === 'public' ? '展示在在线大厅' : '凭完整房间号加入'}</small></span>
            {visibility === value && <Check size={15} />}</button>)}</div>
        <div className="ll-hint"><Heart size={15} />实际开局人数决定好感目标。</div>
      </div>
    </Dialog>}

    {panel === 'remove' && <Dialog title="让这个席位空出来？"
      eyebrow="REMOVE PLAYER" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="danger" disabled={!enabled} onClick={() => {
          if (session.submit('match_remove_player', { playerID: target })) close();
        }}>确认移除</ActionButton></>}>
      <div className="ll-remove-copy"><Portrait rank={0} />
        <p>{playerLabel(target, data.players)} 将离开当前房间。之后仍可邀请朋友或添加公平 AI。</p></div>
    </Dialog>}

    {panel === 'start' && <Dialog title="让第一封信出发？"
      eyebrow="READY FOR THE FIRST LETTER" onClose={close}
      footer={<><ActionButton onClick={close}>再等一下</ActionButton>
        <ActionButton variant="primary" disabled={!enabled || !allReady}
          onClick={() => {
            if (session.submit('match_begin')) close();
          }}>确认开局<ArrowRight size={16} /></ActionButton></>}>
      <div className="ll-start-dialog"><div>{players.map(([id, player]) =>
        <span key={id}><PlayerAvatar name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={46} />
          <b>{playerLabel(id, data.players)}</b><small><Check size={11} />已准备</small></span>)}</div>
        <dl><span><Users size={17} /><small>本场人数</small><b>{players.length} 人</b></span>
          <span><Heart size={17} /><small>好感目标</small><b>{goal} 枚</b></span>
          <span><Clock3 size={17} /><small>阶段时限</small><b>60 秒</b></span></dl>
        <p><ShieldCheck size={14} />确认后由服务端随机首轮先手并完成洗牌。</p></div>
    </Dialog>}
  </div>;
}
