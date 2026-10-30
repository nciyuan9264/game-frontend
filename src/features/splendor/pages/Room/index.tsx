import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bot, Check, Clock, Copy, Globe, Info, Lock,
  Plus, Settings2, ShieldCheck, Sparkles, UserPlus, Users, X,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import {
  StandardGameMobileRoom,
  StandardGameMobileRoomDialogs,
} from '@/components/GameUI/GameRoomMobile';
import { useMobileViewport } from '@/features/game-core/hooks/useMobileViewport';
import { orderGameRoomSeats } from '@/features/game-core/model/room';
import { PlayerAvatar } from '../../components/AppShell';
import { Dialog } from '../../components/Dialog';
import type { SplendorSession } from '../../hooks/useSplendorSession';
import { playerName, type MatchSnapshot } from '../../model/session';
import { splendorRoomInviteURL } from '../../model/adapters';
import type { Visibility } from '../../model/types';
import styles from './index.module.less';

export function Room({ session, data, onLeave }: {
  session: SplendorSession;
  data: MatchSnapshot;
  onLeave: () => void;
}) {
  const { isMobile } = useMobileViewport();
  const [panel, setPanel] = useState<'invite' | 'settings' | 'remove' | 'start'>();
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
  const allReady = players.length >= 2 && players.every(([, player]) => player.online && player.ready);
  const readyCount = players.filter(([, player]) => player.online && player.ready).length;
  const aiCount = players.filter(([, player]) => player.ai).length;
  const inviteURL = splendorRoomInviteURL(data.roomID);
  const copy = async (value: string, message: string) => {
    try { await navigator.clipboard.writeText(value); setCopyMessage(message); }
    catch { setCopyMessage('复制未成功，请稍后重试'); }
  };
  const close = () => setPanel(undefined);
  const getPlayerName = (playerID: string) =>
    playerName(playerID, data.players);
  const renderMobileAvatar = (
    player: {
      name: string;
      avatar?: string;
      ai: boolean;
    },
    size: number,
  ) => <PlayerAvatar name={player.name} avatar={player.avatar}
    ai={player.ai} size={size} />;
  const saveSettings = () => {
    if (session.submit('room_update_settings', { visibility })) close();
  };
  const confirmRemove = () => {
    if (session.submit('match_remove_player', { playerID: target })) close();
  };
  const confirmStart = () => {
    if (session.submit('match_begin')) close();
  };

  if (isMobile) {
    return <div className={styles.page}>
      <StandardGameMobileRoom
        data={data}
        minPlayers={2}
        enabled={enabled}
        pending={!!session.pending}
        getPlayerName={getPlayerName}
        getPlayerRole={(playerID, player) => playerID === data.ownerID
          ? '展会主人'
          : player.ai ? 'AI 收藏家' : '受邀收藏家'}
        renderAvatar={renderMobileAvatar}
        copy={{
          kicker: 'JEWEL SALON · 房间号',
          gameLabel: '经典对局',
          facts: [
            { icon: <Sparkles />, label: '宝石池', value: '5 色 + 黄金' },
            { icon: <Clock />, label: '回合时限', value: '60 秒' },
            { icon: <ShieldCheck />, label: '终局', value: '15 声望' },
          ],
          summary: [
            { label: '玩法', value: '经典对局' },
            { label: '已入座', value: `${players.length} / ${data.maxPlayers} 人` },
          ],
          summaryTitle: '人齐了，就揭幕。',
          ownerHint: '人机添加后自动准备。邀请朋友入座，或直接补上人机，由你开启对局。',
          memberHint: '准备好后告诉房主。只有房主可以添加人机、管理席位和开始对局。',
          readyTitle: '收藏家已经就绪，可以揭幕。',
          ownerDescription: '你是房主，由你开启这场珠宝展。',
          memberReadyDescription: '你已准备，等待房主开始。',
          memberWaitingDescription: '确认准备后，房主即可开始。',
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
        inviteTitle="邀请收藏家入席"
        settingsHint="开局后不能修改房间设置。"
        startTitle="让珠宝展正式揭幕？"
        startFacts={[
          { icon: <Sparkles />, label: '宝石池', value: '5 色 + 黄金' },
          { icon: <Clock />, label: '回合时限', value: '60 秒' },
          { icon: <ShieldCheck />, label: '终局', value: '15 声望' },
        ]}
        startHint="每回合选择拿宝石、购买发展卡或预留卡牌。任一玩家达到 15 声望后进入最后一轮。"
        onVisibilityChange={setVisibility}
        onCopyRoomID={() => void copy(data.roomID, '房间号已复制')}
        onCopyInviteURL={() => void copy(inviteURL, '邀请链接已复制')}
        onSaveSettings={saveSettings}
        onConfirmRemove={confirmRemove}
        onConfirmStart={confirmStart}
        onClose={close}
      />
    </div>;
  }

  return <div className={styles.page}>
    <header className={styles.heading} data-game-room-heading><div className={styles.headingIdentity} data-game-room-heading-identity><button type="button" className={styles.backButton} data-game-room-heading-back aria-label="离开房间" onClick={onLeave}><ArrowLeft size={18} /></button>
      <span data-game-room-heading-copy><small data-game-room-heading-kicker>JEWEL SALON · 房间号</small><h1 data-game-room-heading-title>{data.roomID}<em>准备中</em></h1></span></div>
      <div data-game-room-heading-actions>{owner && <ActionButton onClick={() => { setVisibility(data.visibility); setPanel('settings'); }}><Settings2 size={15} />房间设置</ActionButton>}
        <ActionButton variant="primary" onClick={() => { setCopyMessage(''); setPanel('invite'); }}><UserPlus size={15} />邀请好友</ActionButton></div></header>
    <div className={styles.roomLayout}><section className={styles.tablePanel}>
      <header className={styles.tableTitle}><span><Users size={16} />经典对局<i />{players.length} / {data.maxPlayers} 人</span>
        <div className={styles.preparation}><span className={styles.done}><Check size={12} />入座</span><i /><span className={styles.active}>02 准备</span><i /><span>03 开局</span></div></header>
      <div className={styles.tableStage}><div className={styles.orbit} /><div className={`${styles.orbit} ${styles.orbitSecond}`} />
        <div className={styles.seats}>{seats.map((entry, index) => {
        const playerID = entry?.[0] ?? '';
        const player = entry?.[1];
        const empty = !player;
        const canAdd = owner && empty && enabled;
        const canRemove = owner && !!player && playerID !== data.ownerID && enabled;
        return <article key={index} className={`${styles.seat} ${empty ? styles.emptySeat : ''}`}
          data-game-room-seat-index={index} data-game-room-player-id={playerID || undefined}>
          <span className={styles.seatNumber}>0{index + 1}</span>
          {player ? <PlayerAvatar name={playerName(playerID, data.players)} avatar={player.avatar} ai={player.ai} size={62} />
            : <button type="button" aria-label={`在席位 ${index + 1} 添加人机`} disabled={!canAdd}
              onClick={() => session.submit('match_add_ai', { seatIndex: index })}><Plus size={23} /></button>}
          <div><small>{playerID === data.ownerID ? '展会主人' : empty ? '等待入座' : player?.ai ? 'AI 收藏家' : '受邀收藏家'}</small>
            <h2>{player ? playerName(playerID, data.players) : '空席位'}</h2>
            <span className={player?.ready ? styles.ready : styles.waiting}>{player?.ready ? <Check size={12} /> : <Clock size={12} />}
              {player?.ready ? '准备就绪' : empty ? '可添加人机' : player?.online ? '等待准备' : '暂时离线'}</span></div>
          {canRemove && <button type="button" className={styles.remove} aria-label={`移除 ${playerName(playerID, data.players)}`}
            onClick={() => { setTarget(playerID); setPanel('remove'); }}><X size={16} /></button>}
        </article>;
      })}</div><div className={styles.coordinates}><span>SPLENDOR / CLASSIC</span><span>THE JEWEL SALON</span></div></div>
      <footer className={styles.tableFacts}><span><GemFact /><small>宝石池</small><b>5 色 + 黄金</b></span><span><Clock size={16} /><small>回合时限</small><b>60 秒</b></span><span><ShieldCheck size={16} /><small>已准备</small><b>{readyCount} / {players.length}</b></span></footer>
    </section><aside className={styles.facts}><small>BEFORE THE FIRST MOVE</small><h2>人齐了，就揭幕。</h2>
      <div className={styles.visibility}>{data.visibility === 'private' ? <Lock size={23} /> : <Globe size={23} />}<span>
        <b>{data.visibility === 'private' ? '私密房间' : '公开房间'}</b><p>{data.visibility === 'private' ? '登录玩家凭完整房间号加入' : '其他玩家可从大厅找到这间展厅'}</p></span></div>
      <dl><div><dt>玩法</dt><dd>经典对局</dd></div><div><dt>已入座</dt><dd>{players.length} / {data.maxPlayers} 人</dd></div>
        <div><dt>已准备</dt><dd>{readyCount} / {players.length} 人</dd></div><div><dt>人机玩家</dt><dd>{aiCount} 位</dd></div></dl>
      {owner && <ActionButton disabled={!enabled || players.length >= data.maxPlayers} onClick={() => session.submit('match_add_ai', {})}><Bot size={16} />{players.length >= data.maxPlayers ? '席位已满' : '添加人机'}<Plus size={14} /></ActionButton>}
      <div className={styles.startNote}><ShieldCheck size={18} /><div><strong>至少 2 人，全部准备后开始</strong><p>{owner
        ? '人机添加后自动准备。邀请朋友入座，或直接补上人机，由你开启对局。'
        : '准备好后告诉房主。只有房主可以添加人机、管理席位和开始对局。'}</p></div></div>
    </aside></div>
    <footer className={styles.actionBar}><div><small>{owner ? '房主控制' : '你的状态'}</small>
      <strong>{owner ? allReady ? '收藏家已经就绪，可以揭幕。' : '至少需要两位玩家，并等待所有人准备。'
        : data.players[data.playerID]?.ready ? '你已准备，等待房主开局。' : '确认准备后，房主即可开始。'}</strong></div>
      {owner ? <ActionButton variant="primary" disabled={!enabled || !allReady} onClick={() => setPanel('start')}>开始对局<ArrowRight size={16} /></ActionButton>
        : <ActionButton variant={data.players[data.playerID]?.ready ? 'secondary' : 'primary'} disabled={!enabled}
          onClick={() => session.submit('match_ready', { ready: !data.players[data.playerID]?.ready })}>{data.players[data.playerID]?.ready ? '取消准备' : '准备就绪'}<Check size={15} /></ActionButton>}
    </footer>

    {panel === 'invite' && <Dialog title="邀请收藏家入席" eyebrow="INVITE TO THE JEWEL SALON" onClose={close}
      footer={<><ActionButton onClick={() => void copy(data.roomID, '房间号已复制')}><Copy size={15} />复制房间号</ActionButton><ActionButton variant="primary" onClick={() => void copy(inviteURL, '邀请链接已复制')}><Copy size={15} />复制邀请链接</ActionButton></>}>
      <div className={styles.invite}><div>{players.map(([id, player]) => <PlayerAvatar key={id} name={playerName(id, data.players)} avatar={player.avatar} ai={player.ai} size={47} />)}{players.length < data.maxPlayers && <span><Plus size={20} /></span>}</div>
        <p>房间 {data.roomID} 还有 {data.maxPlayers - players.length} 个席位。分享完整链接，朋友登录后会直接进入本房间。</p>
        <label>ROOM NUMBER<input aria-label="分享房间号" value={data.roomID} readOnly onClick={event => event.currentTarget.select()} /></label>
        <small><ShieldCheck size={14} />{copyMessage || '邀请链接不包含身份信息，玩家身份由服务端验证。'}</small></div>
    </Dialog>}
    {owner && panel === 'settings' && <Dialog title="房间设置" eyebrow="SALON VISIBILITY" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton><ActionButton variant="primary" disabled={!enabled} onClick={() => { if (session.submit('room_update_settings', { visibility })) close(); }}>保存设置</ActionButton></>}>
      <div className={styles.settings}><p>选择这间展厅如何被其他玩家找到。</p><div>{(['public', 'private'] as const).map(value => <button key={value} type="button" disabled={!enabled} aria-pressed={visibility === value} onClick={() => setVisibility(value)}>
        {value === 'public' ? <Globe size={21} /> : <Lock size={21} />}<b>{value === 'public' ? '公开房间' : '私密房间'}</b><small>{value === 'public' ? '显示在大厅' : '通过完整房间号加入'}</small>{visibility === value && <Check size={14} />}</button>)}</div>
        <span><Info size={14} />开局后不能修改房间设置。</span></div>
    </Dialog>}
    {panel === 'remove' && <Dialog title="让这个席位空出来？" eyebrow="REMOVE COLLECTOR" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton><ActionButton variant="danger" disabled={!enabled} onClick={() => { if (session.submit('match_remove_player', { playerID: target })) close(); }}>确认移除</ActionButton></>}>
      <p className={styles.dialogText}>{playerName(target, data.players)} 将离开当前房间。你可以重新邀请朋友或添加人机。</p>
    </Dialog>}
    {panel === 'start' && <Dialog title="让珠宝展正式揭幕？" eyebrow="OPEN THE EXHIBITION" onClose={close}
      footer={<><ActionButton onClick={close}>再等一下</ActionButton><ActionButton variant="primary" disabled={!enabled} onClick={() => { if (session.submit('match_begin')) close(); }}>确认开局<ArrowRight size={16} /></ActionButton></>}>
      <div className={styles.startPlayers}>{players.map(([id, player]) => <span key={id}><PlayerAvatar name={playerName(id, data.players)} avatar={player.avatar} ai={player.ai} size={50} /><b>{playerName(id, data.players)}</b><small><Check size={12} />准备就绪</small></span>)}</div>
      <div className={styles.startHint}><Sparkles size={19} /><p>每回合选择拿宝石、购买发展卡或预留卡牌。任一玩家达到 15 声望后进入最后一轮。</p></div>
    </Dialog>}
  </div>;
}

function GemFact() {
  return <Sparkles size={16} />;
}
