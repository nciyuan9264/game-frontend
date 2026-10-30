import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Flag,
  Globe2,
  Info,
  LockKeyhole,
  Plus,
  Settings2,
  ShieldCheck,
  Shuffle,
  Swords,
  UserPlus,
} from 'lucide-react';
import { playerDisplayName } from '@/features/game-core/model/room';
import {
  StandardGameMobileRoom,
  StandardGameMobileRoomDialogs,
} from '@/components/GameUI/GameRoomMobile';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import { orderGameRoomSeats } from '@/features/game-core/model/room';
import { warChestRoomInviteURL } from '../../adapters';
import type { WarChestSession } from '../../hooks/useWarChestSession';
import type { MatchSnapshot } from '../../session';
import { matchCanStart, setupModeName } from '../../selectors';
import type { SetupMode, Visibility } from '../../types';
import { UNITS, type UnitId } from '../../model';
import { Coin, Crest, Eyebrow, HERO, Modal, TroopArt } from '../../visuals';
import { PlayerAvatar } from '../../components/Shell';

const modes: Array<{
  id: SetupMode;
  title: string;
  copy: string;
  icon: typeof Swords;
}> = [
  { id: 'recommended', title: '官方首局推荐', copy: '固定经典八兵种，橡木先手', icon: Check },
  { id: 'random', title: '随机编成', copy: '从 16 兵种随机分配双方各四种', icon: Shuffle },
  { id: 'draft', title: '官方轮抽', copy: '公开八兵种，按 1-2-2-2-1 选择', icon: Swords },
];

const isUnitId = (value: string): value is UnitId =>
  Object.prototype.hasOwnProperty.call(UNITS, value);

function Lineup({
  title,
  units,
  side,
}: {
  title: string;
  units: string[];
  side: 0 | 1;
}) {
  return <section className="warchest-lineup"><h3><Crest side={side} size={31} />{title}</h3>
    <div className="lineup-cards">{units.map(value => {
      const type = isUnitId(value) ? value : undefined;
      const unit = type ? UNITS[type] : undefined;
      return <div key={value}>{type
        ? <><TroopArt type={type} /><Coin type={type} side={side} size={34} /></>
        : <div className="troop-art royal-art"><Swords size={72} /></div>}
        <h3>{unit?.name ?? value}</h3><span>{unit?.role ?? '未知兵种'}</span>
        <small>2 枚入袋 / {(unit?.total ?? 2) - 2} 枚补给</small></div>;
    })}</div></section>;
}

export function Room({
  session,
  data,
  onLeave,
}: {
  session: WarChestSession;
  data: MatchSnapshot;
  onLeave: () => void;
}) {
  const { isMobile } = useMobileViewport();
  const [panel, setPanel] = useState<'invite' | 'settings' | 'remove' | 'start'>();
  const [target, setTarget] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(data.visibility);
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
  const allReady = matchCanStart(data);
  const setup = data.setup;
  const inviteURL = warChestRoomInviteURL(data.roomID);
  const close = () => setPanel(undefined);
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
    } catch {
      setCopyMessage('复制未成功，请选中房间号手动复制');
    }
  };
  const sideOf = (playerID: string) => setup.sides[playerID] === 'falcon' ? 1 : 0;
  const sideName = (playerID: string) => sideOf(playerID) ? '赤隼军团' : '橡木军团';
  const oakID = Object.keys(setup.sides).find(id => setup.sides[id] === 'oak') ?? data.playerOrder[0];
  const falconID = Object.keys(setup.sides).find(id => setup.sides[id] === 'falcon') ?? data.playerOrder[1];
  const draft = setup.draft;
  const draftPool = Array.isArray(draft?.pool) ? draft.pool : [];
  const availableDraftUnits = Array.isArray(draft?.availableUnits) ? draft.availableUnits : [];
  const pickedDraftUnits = Array.isArray(draft?.pickedUnits) ? draft.pickedUnits : [];
  const draftPickerName = draft?.currentPickerID
    ? playerDisplayName(data.players[draft.currentPickerID], draft.currentPickerID)
    : '下一位指挥官';
  const getPlayerName = (playerID: string) =>
    playerDisplayName(data.players[playerID], playerID);
  const renderMobileAvatar = (
    player: { name: string; avatar?: string },
    size: number,
  ) => <PlayerAvatar name={player.name} avatar={player.avatar} size={size} />;

  if (isMobile) {
    const setupExtension = players.length === 2
      ? <div className="warchest-setup"><div className="small-heading">
        <b>选择本局编成方式</b><span className="status-tag">基础版 16</span>
      </div>
        <div className="roster-presets">{modes.map(item =>
          <button key={item.id} type="button"
            className={setup.mode === item.id ? 'active' : ''}
            disabled={!owner || !enabled}
            onClick={() => session.submit('game_set_setup_mode', {
              mode: item.id,
            })}>
            <item.icon size={14} />{item.title}
          </button>)}</div>
        <p className="roster-intro">
          {modes.find(item => item.id === setup.mode)?.copy}
        </p>
        {setup.mode === 'draft' && <section className="warchest-draft">
          {draft && draftPool.length > 0 ? <>
            <div className="draft-status"><Swords size={19} /><div>
              <b>{draft.complete ? '轮抽完成' : `轮到 ${draftPickerName}`}</b>
              <small>{draft.completedPickCount} / 8 已选择 · 本次连续选择 {
                draft.currentPickCount} 种</small>
            </div>{draft.turnDeadline && <span>
              <Clock3 size={13} />90 秒
            </span>}</div>
            <div className="roster-pool">{draftPool.map(value => {
              const type = isUnitId(value) ? value : undefined;
              const picked = pickedDraftUnits.includes(value);
              const available = availableDraftUnits.includes(value);
              return <button key={value} type="button"
                className={picked ? 'occupied' : ''}
                disabled={!enabled || !available
                  || draft.currentPickerID !== data.playerID || !type}
                onClick={() => type && session.submit('game_draft_unit', {
                  unitType: type,
                })}>
                <Coin type={type ?? 'royal'} size={34} /><span>
                  <b>{type ? UNITS[type].name : value}</b>
                  <small>{picked ? '已被选择'
                    : available ? '可选择' : '等待轮次'}</small>
                </span>{picked && <Check size={13} />}
              </button>;
            })}</div>
          </> : <div className="draft-status"><Swords size={19} /><div>
            <b>正在初始化官方轮抽</b>
            <small>轮抽池会随服务端确认状态自动出现</small>
          </div></div>}
        </section>}
        {setup.rosters[oakID]?.length > 0 && <Lineup
          title={`${getPlayerName(oakID)} · 橡木军团`}
          units={setup.rosters[oakID]} side={0} />}
        {setup.rosters[falconID]?.length > 0
          && <div className="opponent-lineup">
            <b>{getPlayerName(falconID)} · 赤隼军团</b>
            <div>{setup.rosters[falconID].map(value => {
              const type = isUnitId(value) ? value : undefined;
              return <span key={value}>
                <Coin type={type ?? 'royal'} side={1} size={31} />
                {type ? UNITS[type].name : value}
              </span>;
            })}</div>
          </div>}
      </div>
      : undefined;
    return <main className="page room-page">
      <StandardGameMobileRoom
        data={data}
        enabled={enabled}
        pending={!!session.pending}
        canStart={allReady}
        getPlayerName={getPlayerName}
        getPlayerRole={id => `${sideName(id)} · ${
          id === data.ownerID ? '房主'
          : data.players[id]?.ai ? '公平 AI' : '挑战者'}`}
        renderAvatar={renderMobileAvatar}
        renderSeatDecoration={player =>
          <Crest side={sideOf(player.id)} size={36} />}
        copy={{
          kicker: 'RAISE YOUR BANNER · 房间号',
          gameLabel: '双人完整基础版',
          facts: [
            { icon: <Flag />, label: '获胜目标', value: '6 个据点' },
            { icon: <Clock3 />, label: '行动', value: '90 秒' },
            { icon: <Swords />, label: '编成', value: setupModeName(setup.mode) },
          ],
          summary: [
            { label: '对局模式', value: '双人完整基础版' },
            { label: '编成方式', value: setupModeName(setup.mode) },
            { label: '初始先手', value: setup.initialPlayerID
              ? getPlayerName(setup.initialPlayerID) : '编成后确定' },
          ],
          summaryEyebrow: 'BEFORE THE FIRST COMMAND',
          summaryTitle: players.length < 2
            ? '沉着就位，准备出征。'
            : setup.complete ? '知己知彼，落子有方。' : '八兵公开，依序选将。',
          ownerHint: '隐藏手牌、军袋顺序与背面弃币按身份隔离。完成编成并等待双方准备。',
          memberHint: '完成编成后确认准备，等待房主投入战场。',
          waitingTitle: players.length < 2
            ? '邀请另一位指挥官入席。'
            : !setup.complete ? '先完成本局编成。' : '等待双方准备。',
          readyTitle: '双方已准备，可以开始交锋。',
          ownerDescription: '你是房主，由你投入战场。',
          memberReadyDescription: '你已准备，等待房主开始。',
          memberWaitingDescription: '完成编成后，告诉房主你已就绪。',
        }}
        media={<img src={HERO} alt="" />}
        extension={setupExtension}
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
        inviteTitle="一场好局，等你入席。"
        settingsHint="战争之匣真人行动固定为 90 秒。"
        startTitle="让第一枚指令落下？"
        startFacts={[
          { icon: <Swords />, label: '编成', value: setupModeName(setup.mode) },
          { icon: <Clock3 />, label: '行动', value: '90 秒' },
          { icon: <Flag />, label: '获胜', value: '控制 6 处' },
        ]}
        startHint="双方军袋将由服务端初始化并自动抽取首轮指令。开局后编成、阵营与先手锁定。"
        themeClassName="warchest-root"
        onVisibilityChange={setVisibility}
        onCopyRoomID={() => void copy(data.roomID, '房间号已复制')}
        onCopyInviteURL={() => void copy(inviteURL, '邀请链接已复制')}
        onSaveSettings={() => {
          if (session.submit('room_update_settings', {
            visibility,
            turnTimeoutSeconds: 90,
          })) {
            close();
          }
        }}
        onConfirmRemove={() => {
          if (session.submit('match_remove_player', { playerID: target })) close();
        }}
        onConfirmStart={() => {
          if (session.submit('match_begin')) close();
        }}
        onClose={close}
      />
    </main>;
  }

  return <main className="page room-page"><div className="section-heading room-heading" data-game-room-heading>
    <div className="room-heading-identity" data-game-room-heading-identity><button className="room-back-button" data-game-room-heading-back type="button"
      aria-label="离开当前房间" onClick={onLeave}><ArrowLeft size={19} /></button>
      <div data-game-room-heading-copy><span data-game-room-heading-kicker><Eyebrow>RAISE YOUR BANNER</Eyebrow></span><h1 data-game-room-heading-title>{data.roomID}<span className="status-tag"><i />备战中</span></h1>
      <div className="room-id" data-game-room-heading-meta><span>房间号 <b>{data.roomID}</b></span>
        <button className="icon-button" type="button" aria-label="复制房间号"
          onClick={() => void copy(data.roomID, '房间号已复制')}><Copy size={14} /></button>
        <span>· {data.visibility === 'private' ? '私密房间' : '公开房间'} · 90 秒行动</span></div></div></div>
    <div className="room-heading-actions" data-game-room-heading-actions>{owner && <button className="button secondary" type="button" onClick={() => { setVisibility(data.visibility); setPanel('settings');
    }}><Settings2 size={16} />房间设置</button>}
      <button className="button primary" type="button" onClick={() => { setCopyMessage(''); setPanel('invite'); }}>
        <UserPlus size={17} />邀请好友</button></div></div>

    <div className="room-stepper"><span className={players.length === 2 ? 'done' : 'active'}>
      <i>{players.length === 2 ? <Check size={13} /> : '01'}</i>就位</span><b />
      <span className={players.length === 2 && !setup.complete ? 'active' : setup.complete ? 'done' : ''}>
        <i>{setup.complete ? <Check size={13} /> : '02'}</i>确认编成</span><b />
      <span className={allReady ? 'active' : ''}><i>03</i>投入战场</span></div>

    <div className="room-layout"><section className="room-main-panel">
      <div className="small-heading"><b>两面旗帜，一场交锋。</b><small>{players.length}/2 已入座</small></div>
      <div className="seats-grid">{seats.map((entry, index) => {
        const playerID = entry?.[0] ?? '';
        const player = entry?.[1];
        if (!player) return <button key={index} className="seat-card empty-seat" type="button"
          aria-label="添加人机对手" disabled={!owner || !enabled}
          onClick={() => session.submit('match_add_ai', { seatIndex: index })}>
          <span className="seat-index">0{index + 1}</span><span className="seat-plus"><Plus size={30} /></span>
          <h3>等待另一面旗帜</h3><p>添加公平 AI，即刻完成编成</p>
          <span>添加人机对手 <ArrowRight size={16} /></span></button>;
        const side = sideOf(playerID);
        const removable = owner && playerID !== data.ownerID && enabled;
        return <article key={playerID} className={`seat-card occupied ${side ? 'falcon' : ''}`}>
          <span className="seat-index">0{index + 1} / {side ? 'FALCON' : 'OAK'}</span>
          <Crest side={side} size={90} /><Eyebrow>{side ? 'THE FALCON LEGION' : 'THE OAK LEGION'}</Eyebrow>
          <h2>{playerDisplayName(player)}{playerID === data.playerID && <small>你</small>}</h2>
          <p>{sideName(playerID)} · {playerID === data.ownerID ? '房主' : player.ai ? '公平 AI' : '挑战者'}</p>
          <span className={`ready-tag ${player.ready ? '' : 'not-ready'}`}>
            {player.ready ? <Check size={14} /> : <Clock3 size={14} />}
            {player.ready ? '准备就绪' : player.online ? '等待准备' : '暂时离线'}</span>
          {removable && <button className="icon-button warchest-seat-remove" type="button"
            aria-label={`移除 ${playerDisplayName(player)}`}
            onClick={() => { setTarget(playerID); setPanel('remove'); }}>×</button>}
        </article>;
      })}</div>
      {players.length < 2 && <div className="room-field-art"><img src={HERO} alt="城堡与行军插画" />
        <span>Every great victory begins with a choice.</span></div>}

      {players.length === 2 && <div className="warchest-setup"><div className="small-heading">
        <b>选择本局编成方式</b><span className="status-tag">基础版 16</span></div>
        <div className="roster-presets">{modes.map(item => <button key={item.id} type="button"
          className={setup.mode === item.id ? 'active' : ''} disabled={!owner || !enabled}
          onClick={() => session.submit('game_set_setup_mode', { mode: item.id })}>
          <item.icon size={14} />{item.title}</button>)}</div>
        <p className="roster-intro">{modes.find(item => item.id === setup.mode)?.copy}</p>
        {setup.mode === 'draft' && <section className="warchest-draft">
          {draft && draftPool.length > 0 ? <>
            <div className="draft-status"><Swords size={19} /><div><b>{draft.complete ? '轮抽完成' : `轮到 ${draftPickerName}`}</b>
            <small>{draft.completedPickCount} / 8 已选择 · 本次连续选择 {draft.currentPickCount} 种</small></div>
            {draft.turnDeadline && <span><Clock3 size={13} />90 秒</span>}</div>
            <div className="roster-pool">{draftPool.map(value => {
              const type = isUnitId(value) ? value : undefined;
              const picked = pickedDraftUnits.includes(value);
              const available = availableDraftUnits.includes(value);
              return <button key={value} type="button" className={picked ? 'occupied' : ''}
                disabled={!enabled || !available || draft.currentPickerID !== data.playerID || !type}
                onClick={() => type && session.submit('game_draft_unit', { unitType: type })}>
                <Coin type={type ?? 'royal'} size={34} /><span><b>{type ? UNITS[type].name : value}</b>
                <small>{picked ? '已被选择' : available ? '可选择' : '等待轮次'}</small></span>
                {picked && <Check size={13} />}</button>;
            })}</div>
          </> : <div className="draft-status"><Swords size={19} /><div><b>正在初始化官方轮抽</b>
            <small>轮抽池会随服务端确认状态自动出现</small></div></div>}
        </section>}
        {setup.rosters[oakID]?.length > 0 && <Lineup title={`${playerDisplayName(data.players[oakID])} · 橡木军团`}
          units={setup.rosters[oakID]} side={0} />}
        {setup.rosters[falconID]?.length > 0 && <div className="opponent-lineup"><b>{playerDisplayName(data.players[falconID])} · 赤隼军团</b>
          <div>{setup.rosters[falconID].map(value => {
            const type = isUnitId(value) ? value : undefined;
            return <span key={value}><Coin type={type ?? 'royal'} side={1} size={31} />
              {type ? UNITS[type].name : value}</span>;
          })}</div></div>}
      </div>}
    </section>

    <aside className="room-summary"><Eyebrow>BEFORE THE FIRST COMMAND</Eyebrow>
      <h2>{players.length < 2 ? '沉着就位，准备出征。' : setup.complete ? '知己知彼，落子有方。' : '八兵公开，依序选将。'}</h2>
      <div className="room-rule-emblem"><Flag size={31} /><div><strong>6</strong><span>个据点，即刻获胜</span></div></div>
      <dl><div><dt>对局模式</dt><dd>双人完整基础版</dd></div>
        <div><dt>房间范围</dt><dd>{data.visibility === 'private' ? '私密房间' : '公开房间'}</dd></div>
        <div><dt>编成方式</dt><dd>{setupModeName(setup.mode)}</dd></div>
        <div><dt>思考时间</dt><dd>固定 90 秒</dd></div>
        <div><dt>初始先手</dt><dd>{setup.initialPlayerID ? playerDisplayName(data.players[setup.initialPlayerID]) : '编成后确定'}</dd></div>
        <div><dt>准备状态</dt><dd>{players.filter(([, player]) => player.ready).length} / {players.length} 人</dd></div></dl>
      <p className="helper"><ShieldCheck size={15} />隐藏手牌、军袋顺序与背面弃币按身份隔离。</p>
      {owner ? <button className="button primary full" type="button" disabled={!enabled || !allReady}
        onClick={() => setPanel('start')}>开始对局 <ArrowRight size={17} /></button>
        : <button className="button primary full" type="button" disabled={!enabled || !setup.complete}
          onClick={() => session.submit('match_ready', { ready: !data.players[data.playerID]?.ready })}>
          {data.players[data.playerID]?.ready ? '已准备 · 取消准备' : '我准备好了'}
          {data.players[data.playerID]?.ready ? <Check size={17} /> : <ArrowRight size={17} />}</button>}
      <small className="room-start-note">{players.length < 2 ? '邀请好友或添加一位公平 AI。'
        : !setup.complete ? '完成官方轮抽后才能准备开局。'
          : allReady ? '双方已准备，可以开始交锋。' : '等待另一位指挥官准备。'}</small>
    </aside></div>

    {panel === 'invite' && <Modal title="一场好局，等你入席。" eyebrow="AN INVITATION"
      onClose={close} footer={<><button className="button secondary" type="button"
        onClick={() => void copy(data.roomID, '房间号已复制')}><Copy size={15} />复制房间号</button>
        <button className="button primary" type="button" onClick={() => void copy(inviteURL, '邀请链接已复制')}>
          <Copy size={15} />复制邀请链接</button></>}>
      <div className="invitation"><Crest size={76} /><h3>{data.roomID}</h3>
        <span>双人完整基础版 · {setupModeName(setup.mode)}</span>
        <input aria-label="邀请房间号" readOnly value={data.roomID} onFocus={event => event.target.select()} />
        <small>房间号</small></div><p className="muted">{copyMessage || '邀请链接不包含玩家身份或隐藏信息。'}</p>
    </Modal>}

    {owner && panel === 'settings' && <Modal title="房间设置" eyebrow="ROOM SETTINGS"
      onClose={close} footer={<><button className="button secondary" type="button" onClick={close}>取消</button>
        <button className="button primary" type="button" disabled={!enabled} onClick={() => {
          if (session.submit('room_update_settings', {
            visibility, turnTimeoutSeconds: 90,
          })) close();
        }}>保存设置 <Check size={15} /></button></>}>
      <div className="field-label">谁可以加入？</div><div className="privacy-options">
        {(['public', 'private'] as const).map(value => <button key={value} type="button"
          className={visibility === value ? 'selected' : ''} onClick={() => setVisibility(value)}>
          {value === 'public' ? <Globe2 size={22} /> : <LockKeyhole size={22} />}
          <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
            <small>{value === 'public' ? '展示在在线大厅' : '凭完整房间号加入'}</small></span>
          {visibility === value && <Check size={17} />}</button>)}</div>
      <div className="info-note"><Clock3 size={17} />战争之匣真人行动固定为 90 秒。</div>
    </Modal>}

    {panel === 'remove' && <Modal title="让这个席位空出来？" eyebrow="REMOVE PLAYER" onClose={close}
      footer={<><button className="button secondary" type="button" onClick={close}>取消</button>
        <button className="button primary" type="button" disabled={!enabled} onClick={() => {
          if (session.submit('match_remove_player', { playerID: target })) close();
        }}>确认移除</button></>}><p>{playerDisplayName(data.players[target])} 将离开当前房间。</p></Modal>}

    {panel === 'start' && <Modal title="让第一枚指令落下？" eyebrow="BEGIN THE CAMPAIGN" onClose={close}
      footer={<><button className="button secondary" type="button" onClick={close}>再等一下</button>
        <button className="button primary" type="button" disabled={!enabled || !allReady} onClick={() => {
          if (session.submit('match_begin')) close();
        }}>确认开局 <ArrowRight size={16} /></button></>}>
      <p>双方军袋将由服务端初始化并自动抽取首轮指令。开局后编成、阵营与先手锁定。</p>
      <div className="info-note"><Info size={17} />{setupModeName(setup.mode)} · 90 秒行动 · 先控制 6 处据点获胜</div>
    </Modal>}
  </main>;
}
