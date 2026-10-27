import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Footprints,
  Globe2,
  LockKeyhole,
  Plus,
  Settings2,
  Share2,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { playerDisplayName } from '@/features/game-core/model/room';
import {
  fugitiveRoomInviteURL,
} from '../../model/adapters';
import { ProfileMonogram } from '../../components/AppShell';
import type { FugitiveSession } from '../../hooks/useFugitiveSession';
import type { MatchSnapshot } from '../../model/session';
import type {
  FugitiveRoom,
  Role,
  Visibility,
} from '../../model/types';
import {
  Eyebrow,
  Modal,
  roleName,
} from '../../components/Visual';

const otherRole = (role: Role): Role =>
  role === 'fugitive' ? 'marshal' : 'fugitive';

export function Room({
  session,
  data,
  room,
  onLeave,
}: {
  session: FugitiveSession;
  data: MatchSnapshot;
  room?: FugitiveRoom;
  onLeave: () => void;
}) {
  const [panel, setPanel] = useState<
    'settings' | 'invite' | 'remove' | 'start'
  >();
  const [target, setTarget] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(data.visibility);
  const enabled = session.connection.status === 'connected' && !session.pending;
  const owner = data.playerID === data.ownerID;
  const players = Object.entries(data.players);
  const seats = useMemo(() => Array.from({ length: 2 }, (_, index) =>
    players.find(([, player]) => player.seatIndex === index) ?? players[index]),
  [players]);
  const hostRole = data.players[data.ownerID]?.gameRole ?? 'fugitive';
  const selfRole = data.players[data.playerID]?.gameRole
    ?? (owner ? hostRole : otherRole(hostRole));
  const allReady = players.length === 2
    && players.every(([, player]) => (player.online || player.ai) && player.ready);
  const inviteURL = fugitiveRoomInviteURL(data.roomID);
  const roomName = room?.displayName || '午夜追缉';
  const close = () => setPanel(undefined);
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
    } catch {
      setCopyMessage('复制未成功，请选中房间号手动复制');
    }
  };
  const openSettings = () => {
    setVisibility(data.visibility);
    setPanel('settings');
  };

  return <main className="page-content waiting-page framework-waiting">
    <div className="waiting-room-heading">
      <Eyebrow>BEFORE THE CHASE</Eyebrow>
      <h1>{roomName}<span className="pill">准备中</span></h1>
      <p>房间号 <b>{data.roomID}</b><span>·</span>
        {data.visibility === 'private' ? '私密房间' : '公开房间'}</p>
      <div className="waiting-header-actions">
        {owner && <button className="button secondary" type="button" onClick={openSettings}>
          <Settings2 size={17} />房间设置
        </button>}
        <button className="button primary" type="button"
          onClick={() => { setCopyMessage(''); setPanel('invite'); }}>
          <Share2 size={17} />邀请好友</button>
      </div>
    </div>

    <section className="room-seats-panel">
      <div className="section-title"><Eyebrow>FUGITIVE / BASE GAME</Eyebrow>
        <span><Users size={14} />{players.length} / 2 已入座</span></div>
      <div className="room-seat-grid">{seats.map((entry, index) => {
        const playerID = entry?.[0] ?? '';
        const player = entry?.[1];
        const role = player?.gameRole
          ?? (index === data.players[data.ownerID]?.seatIndex
            ? hostRole
            : otherRole(hostRole));
        const self = playerID === data.playerID;
        if (!player) {
          return <button key={index} className="room-seat vacant-seat"
            type="button" aria-label="添加人机对手入座"
            disabled={!owner || !enabled}
            onClick={() => session.submit('match_add_ai', { seatIndex: index })}>
            <span className="seat-number">0{index + 1}</span>
            <span className="seat-plus"><Plus size={25} /></span>
            <h3>为对手留个位置</h3><small>点击添加公平 AI</small>
            <span className="seat-role">{roleName(role)}</span>
          </button>;
        }
        const canRemove = owner && playerID !== data.ownerID && enabled;
        return <article key={index} data-testid="fugitive-room-seat"
          className={`room-seat ${self ? 'self-seat' : ''}`}>
          <span className="seat-number">0{index + 1}</span>
          <ProfileMonogram profile={{
            name: playerDisplayName(player),
            avatar: player.avatar,
          }} className="avatar" />
          <small>{playerID === data.ownerID ? '房主' : player.ai ? '公平 AI' : '挑战者'}</small>
          <h3>{playerDisplayName(player)}{self && <em>你</em>}</h3>
          <span className="seat-role">{role === 'fugitive'
            ? <Footprints size={13} /> : <Shield size={13} />} {roleName(role)}</span>
          <span className={`seat-ready ${player.ready ? '' : 'unready'}`}>
            {player.ready ? <Check size={13} /> : <Clock3 size={13} />}
            {player.ready ? '准备就绪' : player.online ? '等待准备' : '暂时离线'}
          </span>
          {canRemove && <button className="icon-button seat-remove" type="button"
            aria-label={`移除 ${playerDisplayName(player)}`}
            onClick={() => { setTarget(playerID); setPanel('remove'); }}>
            <X size={15} /></button>}
        </article>;
      })}</div>

      {owner
        ? <div className="waiting-role-picker"><span>你的身份</span>
          <div>{(['fugitive', 'marshal'] as const).map(role =>
            <button type="button" key={role} aria-label={`选择${roleName(role)}`}
              aria-pressed={selfRole === role}
              className={selfRole === role ? 'selected' : ''}
              disabled={!enabled}
              onClick={() => session.submit('match_select_role', { role })}>
              {role === 'fugitive' ? <Footprints size={15} /> : <Shield size={15} />}
              {roleName(role)}{selfRole === role && <Check size={13} />}
            </button>)}</div><small>切换身份时，另一席自动获得相反身份。</small>
        </div>
        : <p className="room-seat-note"><LockKeyhole size={14} />
          你已加入{roleName(selfRole)}席位；每局身份由房主选择。</p>}
    </section>

    <section className="room-settings-summary"><div>
      {data.visibility === 'private' ? <LockKeyhole size={21} /> : <Globe2 size={21} />}
      <span><b>{data.visibility === 'private' ? '凭房间号加入' : '公开双人房间'}</b>
        <small>{data.visibility === 'private'
          ? '不显示在大厅列表，仍可从原链接返回。'
          : '显示在在线大厅，等待另一位玩家加入。'}</small></span>
    </div><dl>
      <div><dt>规则</dt><dd>二版基础 · 固定 2 人</dd></div>
      <div><dt>思考时间</dt><dd>固定 120 秒</dd></div>
      <div><dt>身份</dt><dd>{roleName(selfRole)}</dd></div>
      <div><dt>准备状态</dt><dd>{players.filter(([, player]) => player.ready).length} / {players.length} 人</dd></div>
    </dl><p className="room-seat-note">手牌、抽牌号码和暗置路线按身份隔离；开局后身份锁定。</p>
    </section>

    <footer className="room-ready-dock">
      <p><Shield size={15} />{owner
        ? allReady ? '双方已准备，可以开始追逐。' : '需要两席就绪，才能开始追逐。'
        : data.players[data.playerID]?.ready ? '你已准备，等待房主开始。' : '准备好后，由房主开始对局。'}</p>
      {owner
        ? <button className="button primary full" type="button"
          disabled={!enabled || !allReady} onClick={() => setPanel('start')}>
          开始对局<ArrowRight size={17} /></button>
        : <button className="button primary full" type="button" disabled={!enabled}
          onClick={() => session.submit('match_ready', {
            ready: !data.players[data.playerID]?.ready,
          })}>
          {data.players[data.playerID]?.ready ? '已准备 · 取消准备' : '我准备好了'}
          {data.players[data.playerID]?.ready ? <Check size={17} /> : <ArrowRight size={17} />}
        </button>}
      <button className="text-button full" type="button" onClick={onLeave}>离开房间</button>
    </footer>

    {owner && panel === 'settings' && <Modal title="房间设置"
      kicker="MAKE THE NEXT CHASE YOURS" onClose={close}
      footer={<><button className="button secondary" type="button"
        onClick={close}>取消</button><button className="button primary" type="button"
        disabled={!enabled}
        onClick={() => {
          if (session.submit('room_update_settings', { visibility })) close();
        }}>保存设置<Check size={15} /></button></>}>
      <label className="form-label">谁可以加入？</label>
      <div className="privacy-options">{(['public', 'private'] as const).map(value =>
        <button type="button" key={value}
          className={visibility === value ? 'selected' : ''}
          aria-pressed={visibility === value} onClick={() => setVisibility(value)}>
          {value === 'public' ? <Globe2 size={22} /> : <LockKeyhole size={22} />}
          <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
            <small>{value === 'public' ? '展示在在线大厅' : '凭完整房间号加入'}</small></span>
          {visibility === value && <Check size={17} />}
        </button>)}</div>
      <p className="notice"><Shield size={16} />
        <span>房间名称固定为“午夜追缉”，每回合固定 120 秒。</span></p>
    </Modal>}

    {panel === 'invite' && <Modal title="把下一步，留给朋友。"
      kicker="INVITATION TO THE CHASE" onClose={close}
      footer={<><button className="button secondary" type="button"
        onClick={() => void copy(data.roomID, '房间号已复制')}>
        <Copy size={15} />复制房间号</button>
        <button className="button primary" type="button"
          onClick={() => void copy(inviteURL, '邀请链接已复制')}>
          <Copy size={15} />复制邀请链接</button></>}>
      <div className="invitation"><h3>{roomName}</h3>
        <input aria-label="邀请房间号" readOnly value={data.roomID}
          onFocus={event => event.target.select()} />
        <p>2 位玩家 · 二版基础规则</p></div>
      <p className="notice">{copyMessage || '邀请链接不包含玩家身份或私密牌局信息。'}</p>
    </Modal>}

    {panel === 'remove' && <Modal title="让这个席位空出来？"
      kicker="REMOVE PLAYER" onClose={close}
      footer={<><button className="button secondary" type="button"
        onClick={close}>取消</button><button className="button primary" type="button"
        disabled={!enabled}
        onClick={() => {
          if (session.submit('match_remove_player', { playerID: target })) close();
        }}>确认移除</button></>}>
      <p>{playerDisplayName(data.players[target])} 将离开当前房间。</p>
    </Modal>}

    {panel === 'start' && <Modal title="让追逐开始？"
      kicker="BEGIN THE MIDNIGHT RUN" onClose={close}
      footer={<><button className="button secondary" type="button"
        onClick={close}>再等一下</button><button className="button primary" type="button"
        disabled={!enabled || !allReady}
        onClick={() => {
          if (session.submit('match_begin')) close();
        }}>确认开局<ArrowRight size={16} /></button></>}>
      <p>逃亡者先放置 1–2 个藏身点，追捕者随后抽取两张线索并开始搜查。身份与计时将在开局后锁定。</p>
    </Modal>}
  </main>;
}
