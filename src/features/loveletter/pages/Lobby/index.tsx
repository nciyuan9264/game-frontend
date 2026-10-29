import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Copy, Globe2, Heart, KeyRound, LockKeyhole,
  Mail, Plus, Search, Share2, ShieldCheck, Users, X,
} from 'lucide-react';
import { GameShareContent } from '@/components/GameUI/GameShareContent';
import {
  GameMobileCreateRoomDialog,
  GameMobileLobby,
  GameMobileRoomCard,
  GameMobileShareDialog,
} from '@/components/GameUI/GamePublicMobile';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { getProfile } from '@/features/game-core/api/auth';
import { useClipboardCopy } from '@/features/game-core/hooks/useClipboardCopy';
import { useLatestAsyncAction } from '@/features/game-core/hooks/useLatestAsyncAction';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import { roomOwnerProfile } from '@/features/game-core/model/room';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { createLoveLetterRoom, lookupLoveLetterRoom } from '../../api/room';
import { AppShell, PlayerAvatar } from '../../components/AppShell';
import { Seal } from '../../components/Card';
import { Dialog } from '../../components/Dialog';
import { LoveLetterLoading } from '../../components/LoadingState';
import { useLoveLetterLobby } from '../../hooks/useLoveLetterLobby';
import {
  LOVELETTER_PUBLIC_URL,
  roomEntry,
} from '../../model/adapters';
import type {
  LobbyFilter,
  LoveLetterRoom,
  Visibility,
} from '../../model/types';
import hero from '../../assets/hero.webp';
const filters: Array<{ value: LobbyFilter; label: string }> = [
  { value: 'all', label: '全部房间' },
  { value: 'joinable', label: '可加入' },
  { value: 'playing', label: '对局中' },
];

function RoomCard({
  room,
  userID,
  onEnter,
}: {
  room: LoveLetterRoom;
  userID: string;
  onEnter: (room: LoveLetterRoom) => void;
}) {
  const entry = roomEntry(room, { userID });
  const owner = roomOwnerProfile(room);
  return <article className="ll-room-card">
    <header><span><i />{room.status === 'match' ? '等待入席' : '正在传信'}</span>
      <b>#{room.roomID}</b>{room.visibility === 'private' && <LockKeyhole size={13} />}</header>
    <div className="ll-room-main"><Seal /><div><h3>{owner.name} 的玫瑰庭院</h3>
      <p>{room.roomPlayer.length} 位执笔人 · {
        room.visibility === 'private' ? '私密' : '公开'}</p></div></div>
    <div className="ll-room-players">{room.roomPlayer.slice(0, 6).map(player =>
      <PlayerAvatar key={player.playerID} name={player.displayName ?? player.playerID}
        avatar={player.avatar} ai={player.ai} size={31} />)}
      <strong>{room.roomPlayer.length}<small> / 6</small></strong></div>
    <footer><span>{room.status === 'match'
      ? '人齐准备后即可启封'
      : `第 ${room.currentRound && room.currentRound > 0
        ? room.currentRound
        : room.nextRoundNo ?? 1} 轮`}</span>
      <ActionButton disabled={!entry.allowed}
        variant={entry.allowed ? 'secondary' : 'quiet'}
        onClick={() => onEnter(room)}>{entry.label}{
          entry.allowed && <ArrowRight size={15} />}</ActionButton></footer>
  </article>;
}

export default function Lobby() {
  const { isMobile } = useMobileViewport();
  const navigate = useNavigate();
  const lobby = useLoveLetterLobby();
  const profile = useAsyncResource(getProfile);
  const action = useLatestAsyncAction();
  const clipboard = useClipboardCopy();
  const [panel, setPanel] = useState<'create' | 'join' | 'share'>();
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [code, setCode] = useState('');
  const [found, setFound] = useState<LoveLetterRoom>();
  const userID = profile.data?.id ?? '';
  const identity = { userID };

  const enter = (room: LoveLetterRoom) => {
    if (roomEntry(room, identity).allowed) {
      navigate(`/game/loveletter/match?roomID=${encodeURIComponent(room.roomID)}`);
    }
  };
  const create = async () => {
    try {
      const room = await action.run(signal =>
        createLoveLetterRoom(visibility, signal));
      navigate(`/game/loveletter/match?roomID=${encodeURIComponent(room.roomID)}`);
    } catch { /* Shared action owns feedback. */ }
  };
  const find = async () => {
    if (!code.trim()) return;
    setFound(undefined);
    setPanel('join');
    try {
      setFound(await action.run(signal =>
        lookupLoveLetterRoom(code.trim(), signal)));
    } catch { /* Shared action owns feedback. */ }
  };
  const close = () => {
    if (action.pending) return;
    setPanel(undefined);
    setFound(undefined);
    action.reset();
    clipboard.reset();
  };
  const initialLoading = !lobby.hasLoaded && !lobby.error
    || profile.loading && !profile.data;
  const renderMobileRoom = (room: LoveLetterRoom) => {
    const entry = roomEntry(room, identity);
    const ownerProfile = roomOwnerProfile(room);
    return <GameMobileRoomCard key={room.roomID}
      roomID={room.roomID}
      title={`${ownerProfile.name} 的玫瑰庭院`}
      ownerName={ownerProfile.name}
      ownerAvatar={<PlayerAvatar name={ownerProfile.name}
        avatar={ownerProfile.avatar} size={32} />}
      playerCount={room.roomPlayer.length}
      maxPlayers={room.maxPlayers}
      status={room.status === 'match' ? '等待入席' : '正在传信'}
      meta={room.status === 'match'
        ? '21 张牌新版 · 等待启封'
        : `第 ${room.currentRound || room.nextRoundNo || 1} 轮`}
      privateRoom={room.visibility === 'private'}
      actionLabel={entry.label}
      actionDisabled={!entry.allowed}
      onEnter={() => enter(room)}
    />;
  };

  if (isMobile) {
    return <AppShell title="游戏大厅" profile={profile.data}>
      {initialLoading
        ? <LoveLetterLoading />
        : <GameMobileLobby
          eyebrow="A LETTER. A LITTLE INTRIGUE."
          title={<>一封密信，<br />几分心计。</>}
          description="摸一张，打出一张。在猜测与试探之间，让心意抵达终点。"
          media={<img src={hero} alt="信件、玫瑰与宫廷角色" />}
          caption="PALM LETTER / THE QUIET COURT"
          facts={[
            { icon: <Users />, value: '2–6', label: '位玩家' },
            { icon: <Mail />, value: '21', label: '张角色牌' },
            { icon: <Heart />, value: '6 / 5 / 4 / 3', label: '好感目标' },
          ]}
          browserEyebrow="FIND YOUR COURT"
          browserTitle="找到房间，一起传信。"
          roomCount={`${lobby.rooms.length} 个可见房间`}
          filters={filters}
          filter={lobby.filter}
          onFilterChange={lobby.setFilter}
          query={lobby.query}
          onQueryChange={lobby.setQuery}
          rooms={lobby.filteredRooms}
          renderRoom={renderMobileRoom}
          onCreate={() => {
            setVisibility('public');
            action.reset();
            setPanel('create');
          }}
          onShare={() => setPanel('share')}
          joinCode={code}
          onJoinCodeChange={value => {
            setCode(value);
            setFound(undefined);
            action.reset();
          }}
          onJoin={() => void find()}
          joinDescription="输入完整房间号，找到朋友的庭院。"
          error={lobby.error && <Feedback error>{lobby.error}
            <ActionButton onClick={lobby.refresh}>重试</ActionButton>
          </Feedback>}
        />}
      {panel === 'create' && <GameMobileCreateRoomDialog
        title="开启一封新的密信"
        eyebrow="CREATE YOUR NEXT COURT"
        description="选择房间公开范围。实际开局人数决定本场好感目标。"
        visibility={visibility} onVisibilityChange={setVisibility}
        hint="21 张牌官方新版 · 2–6 人 · 60 秒阶段时限"
        error={action.error && <Feedback error>{action.error}</Feedback>}
        pending={action.pending} disabled={!profile.data}
        themeClassName="loveletter-root"
        onClose={close} onSubmit={() => void create()} />}
      {panel === 'share' && <GameMobileShareDialog gameName="掌心密信"
        url={LOVELETTER_PUBLIC_URL} color="#793b48" background="#f7f0e5"
        themeClassName="loveletter-root" onClose={close} />}
      {panel === 'join' && <Dialog title="通过房间号加入"
        eyebrow="FIND YOUR FRIENDS' COURT" onClose={close}
        footer={<ActionButton variant="primary" pending={action.pending}
          disabled={!code.trim() || !!found && !roomEntry(found, identity).allowed}
          onClick={() => found ? enter(found) : void find()}>
          {found ? roomEntry(found, identity).label : '查找房间'}
          <ArrowRight size={16} />
        </ActionButton>}>
        {action.error && <Feedback error>{action.error}</Feedback>}
        {found && renderMobileRoom(found)}
      </Dialog>}
    </AppShell>;
  }

  return <AppShell title="游戏大厅" profile={profile.data}>
    {initialLoading ? <LoveLetterLoading /> : <div className="ll-lobby">
      <section className="ll-hero">
        <img src={hero} alt="信件、玫瑰与宫廷角色" />
        <div><span className="ll-eyebrow">A LETTER. A LITTLE INTRIGUE.</span>
          <h1>一封密信，<br />几分心计。</h1>
          <p>摸一张，打出一张。<br />在猜测与试探之间，让心意抵达终点。</p>
          <div><ActionButton variant="primary" disabled={!profile.data}
            onClick={() => { setVisibility('public'); action.reset(); setPanel('create'); }}>
            <Plus size={17} />创建房间<ArrowRight size={16} /></ActionButton>
            <ActionButton onClick={() => setPanel('share')}>
              <Share2 size={16} />分享游戏</ActionButton></div>
        </div><small>PALM LETTER / THE QUIET COURT</small>
      </section>
      <div className="ll-facts"><span><Users size={16} /><b>2–6</b> 位玩家</span>
        <span><Mail size={16} /><b>21</b> 张角色牌</span>
        <span><Heart size={16} /><b>6 / 5 / 4 / 3</b> 好感目标</span>
        <Link to="/game/loveletter/guide">第一次来？读懂玩法 <ArrowRight size={15} /></Link></div>

      <div className="ll-lobby-layout"><section className="ll-room-browser">
        <header><div><span className="ll-eyebrow">FIND YOUR COURT</span>
          <h2>找到房间，一起传信。</h2></div><span>{lobby.rooms.length} 个可见房间</span></header>
        <div className="ll-room-tools"><div>{filters.map(item =>
          <button type="button" key={item.value}
            className={lobby.filter === item.value ? 'active' : ''}
            onClick={() => lobby.setFilter(item.value)}>{item.label}</button>)}</div>
          <label><Search size={15} /><input aria-label="搜索房间"
            placeholder="搜索房间号 / 房主" value={lobby.query}
            onChange={event => lobby.setQuery(event.target.value)} />
            {lobby.query && <button type="button" aria-label="清空搜索"
              onClick={() => lobby.setQuery('')}><X size={14} /></button>}</label></div>
        {lobby.error && <Feedback error>{lobby.error}
          <ActionButton onClick={lobby.refresh}>重试</ActionButton></Feedback>}
        <div className="ll-room-grid">{lobby.filteredRooms.map(room =>
          <RoomCard key={room.roomID} room={room}
            userID={userID} onEnter={enter} />)}</div>
        {!lobby.error && !lobby.filteredRooms.length && <div className="ll-empty">
          <Mail size={32} /><h3>这座庭院，等你拆开第一封信。</h3>
          <p>点击上方创建房间，邀请朋友或添加人机开始。</p></div>}
      </section>
      <aside className="ll-lobby-side"><section className="ll-join-card"><KeyRound size={20} /><h3>朋友已经开好房间？</h3>
        <p>输入完整房间号，找到朋友的庭院。</p>
        <form onSubmit={event => { event.preventDefault(); void find(); }}>
          <input aria-label="查找房间号" placeholder="输入完整房间号"
            value={code} onChange={event => { setCode(event.target.value); setFound(undefined); }} />
          <button aria-label="查找房间" disabled={!code.trim()}><ArrowRight size={18} /></button>
        </form></section></aside></div>
    </div>}

    {panel === 'create' && <Dialog title="开启一封新的密信"
      eyebrow="CREATE YOUR NEXT COURT" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="primary" pending={action.pending}
          onClick={() => void create()}>创建并入座<ArrowRight size={16} /></ActionButton></>}>
      <div className="ll-dialog-copy"><p>选择房间公开范围。实际开局人数决定本场好感目标。</p>
        <div className="ll-choice-grid">{(['public', 'private'] as const).map(value =>
          <button type="button" key={value} aria-pressed={visibility === value}
            onClick={() => setVisibility(value)}>
            {value === 'public' ? <Globe2 size={23} /> : <LockKeyhole size={23} />}
            <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
              <small>{value === 'public' ? '显示在大厅' : '凭完整房间号加入'}</small></span>
            {visibility === value && <Check size={15} />}</button>)}</div>
        <div className="ll-hint"><ShieldCheck size={16} />21 张牌官方新版 · 2–6 人 · 60 秒阶段时限</div>
        {action.error && <Feedback error>{action.error}</Feedback>}</div>
    </Dialog>}

    {panel === 'join' && <Dialog title="通过房间号加入"
      eyebrow="FIND YOUR FRIENDS' COURT" onClose={close}
      footer={<ActionButton variant="primary" pending={action.pending}
        disabled={!code.trim() || !!found && !roomEntry(found, identity).allowed}
        onClick={() => found ? enter(found) : void find()}>
        {found ? roomEntry(found, identity).label : '查找房间'}<ArrowRight size={16} /></ActionButton>}>
      <div className="ll-dialog-copy"><label>房间号<input aria-label="房间号"
        value={code} onChange={event => { setCode(event.target.value); setFound(undefined); }}
        placeholder="输入完整房间号" /></label>
        {action.error && <Feedback error>{action.error}</Feedback>}
        {found && <RoomCard room={found} userID={userID} onEnter={enter} />}</div>
    </Dialog>}

    {panel === 'share' && <Dialog title="分享掌心密信"
      eyebrow="INVITE SOMEONE TO THE COURT" onClose={close}
      footer={<><ActionButton onClick={close}>关闭</ActionButton>
        <ActionButton variant="primary"
          onClick={() => void clipboard.copy(LOVELETTER_PUBLIC_URL)}>
          {clipboard.copiedValue === LOVELETTER_PUBLIC_URL
            ? <Check size={16} /> : <Copy size={16} />}
          {clipboard.copiedValue === LOVELETTER_PUBLIC_URL ? '链接已复制' : '复制游戏链接'}
        </ActionButton></>}>
      <GameShareContent url={LOVELETTER_PUBLIC_URL}
        color="#793b48" background="#f7f0e5"
        classes={{
          root: 'll-share',
          qr: 'll-share-qr',
          address: 'll-share-address',
          hint: 'll-share-hint',
        }} />
    </Dialog>}
  </AppShell>;
}
