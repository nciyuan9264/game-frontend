import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, Copy, Globe, Layers, Lock, Plus, Settings2, ShieldCheck, UserPlus, Wallet } from 'lucide-react';
import { ActionButton } from '../../components/ActionButton';
import { PlayerAvatar } from '../../components/AppShell';
import { ResponsiveDialog } from '../../components/ResponsiveDialog';
import { useAcquireViewport } from '../../hooks/useAcquireViewport';
import type { AcquireSession } from '../../hooks/useAcquireSession';
import { playerName, type MatchSnapshot } from '../../model/session';
import type { Visibility } from '../../model/types';
import { RoomDesktop } from './RoomDesktop';
import { RoomMobile } from './RoomMobile';
import styles from './index.module.less';

export function Room({ session, data, onLeave }: { session: AcquireSession; data: MatchSnapshot; onLeave: () => void }) {
  const { isMobile } = useAcquireViewport();
  const [panel, setPanel] = useState<'settings' | 'invite' | 'remove' | 'start'>();
  const [target, setTarget] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(data.visibility);
  const [copyMessage, setCopyMessage] = useState('');
  const enabled = session.connection.status === 'connected' && !session.pending;
  const owner = data.playerID === data.ownerID;
  const props = {
    data, enabled, pending: !!session.pending,
    onAddAI: (seatIndex?: number) => {
      session.submit('match_add_ai', typeof seatIndex === 'number' ? { seatIndex } : {});
    },
    onRemove: (id: string) => { setTarget(id); setPanel('remove'); },
    onReady: () => { session.submit('match_ready', { ready: !data.players[data.playerID]?.ready }); },
    onStart: () => setPanel('start'),
    onInvite: () => { setCopyMessage(''); setPanel('invite'); },
    onSettings: () => { setVisibility(data.visibility); setPanel('settings'); },
  };
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setCopyMessage('已复制'); }
    catch { setCopyMessage('复制未成功，请长按或选中文本手动复制'); }
  };
  const close = () => setPanel(undefined);
  const players = Object.entries(data.players);
  const targetName = playerName(target, data.players);
  const hint = (children: ReactNode) => <div className={styles.dialogHint}><ShieldCheck size={16} /><span>{children}</span></div>;
  return <>
    <div className={styles.heading}><div className={styles.headingIdentity}><button type="button" className={styles.backButton} aria-label="离开当前房间" onClick={onLeave}><ArrowLeft size={19} /></button><div><small>CLASSIC TABLE · 房间号</small><h1>{data.roomID}<span>准备中</span></h1></div></div>
      <div><ActionButton onClick={props.onSettings}><Settings2 size={16} />{owner ? '房间设置' : '房间信息'}</ActionButton>
        <ActionButton variant="primary" onClick={props.onInvite}><UserPlus size={16} />邀请好友</ActionButton></div></div>
    {isMobile ? <RoomMobile {...props} /> : <RoomDesktop {...props} />}
    {panel === 'invite' && <ResponsiveDialog title="给朋友，留一个好位置。" eyebrow="BETTER AROUND ONE TABLE" onClose={close}
      footer={<><ActionButton onClick={close}>完成</ActionButton><ActionButton variant="primary" onClick={() => void copy(data.roomID)}><Copy size={16} />复制房间号</ActionButton></>}>
      <div className={styles.invitePlayers}>{players.map(([id, player]) => <PlayerAvatar key={id} name={playerName(id, data.players)} avatar={player.avatar} ai={player.ai} size={44} />)}
        {players.length < data.maxPlayers && <span className={styles.inviteEmpty}><Plus size={22} /></span>}</div>
      <p className={`${styles.dialogDescription} ${styles.center}`}>房间 {data.roomID} 还有 {data.maxPlayers - players.length} 个席位。<br />分享房间号，朋友就能找到这张桌。</p>
      <div className={styles.inviteCode}><span>ROOM NUMBER</span><input aria-label="分享房间号" value={data.roomID} readOnly onClick={event => event.currentTarget.select()} /><small>经典对局 · {players.length} / {data.maxPlayers} 人 · {data.visibility === 'private' ? '私密' : '公开'}</small></div>
      {hint(copyMessage || (data.visibility === 'private' ? '私密房间仅房主可在大厅看到，请将完整房间号分享给朋友。'
        : '朋友可以在大厅查找房间号并加入。系统不会自动发送外部邀请。'))}
    </ResponsiveDialog>}
    {panel === 'settings' && <ResponsiveDialog title={owner ? '房间设置' : '房间信息'} eyebrow="ROOM VISIBILITY" onClose={close}
      footer={owner ? <><ActionButton onClick={close}>取消</ActionButton><ActionButton variant="primary" type="submit" form="acquire-room-settings" disabled={!enabled}>保存设置<ArrowRight size={16} /></ActionButton></>
        : <ActionButton variant="primary" onClick={close}>知道了</ActionButton>}>
      <form id="acquire-room-settings" className={styles.roomForm} onSubmit={event => { event.preventDefault(); if (session.submit('room_update_settings', { visibility })) close(); }}>
        <p className={styles.dialogDescription}>{owner ? '选择这张桌如何被其他玩家找到。' : '仅房主可以修改公开范围。'}</p>
        <div className={styles.roomCodeSummary}><span>房间号</span><b>{data.roomID}</b></div>
        <div className={styles.dialogField} id="room-visibility-label">房间公开范围</div>
        <div className={styles.accessChoices} role="group" aria-labelledby="room-visibility-label">{(['public', 'private'] as const).map(value =>
          <button type="button" key={value} aria-pressed={value === visibility} disabled={!owner || !enabled} className={value === visibility ? styles.selectedChoice : ''} onClick={() => setVisibility(value)}>
            {value === 'public' ? <Globe size={23} /> : <Lock size={23} />}<strong>{value === 'public' ? '公开房间' : '私密房间'}</strong>
            <small>{value === 'public' ? '显示在大厅，其他玩家可加入' : '仅房主可在大厅看到，其他玩家通过房间号加入'}</small>{value === visibility && <Check size={14} />}
          </button>)}</div>
        {hint(visibility === 'private' ? '仅你会在大厅看到这张桌；将完整房间号分享给朋友即可邀请入座。' : '公开房间可从大厅列表或通过房间号加入。')}
      </form>
    </ResponsiveDialog>}
    {panel === 'start' && <ResponsiveDialog title="合伙人齐了，开场吧。" eyebrow="READY FOR THE FIRST MOVE" onClose={close}
      footer={<><ActionButton onClick={close}>再等一下</ActionButton><ActionButton variant="primary" disabled={!enabled} onClick={() => { if (session.submit('match_begin')) close(); }}>确认开局<ArrowRight size={16} /></ActionButton></>}>
      <div className={styles.startPlayers}>{players.map(([id, player]) => <div key={id}><PlayerAvatar name={playerName(id, data.players)} avatar={player.avatar} ai={player.ai} size={52} /><b>{playerName(id, data.players)}</b><small><Check size={12} />{player.ready ? '准备就绪' : '尚未准备'}</small></div>)}</div>
      <div className={styles.startFacts}><span><Wallet size={18} /><small>每人起始资金</small><b>$6,000</b></span><span><Layers size={18} /><small>初始手牌</small><b>6 块地</b></span><span><Clock size={18} /><small>阶段时限</small><b>20–60 秒</b></span></div>
      {hint('确认后从第 1 回合开始，本局中不能修改房间设置。')}
    </ResponsiveDialog>}
    {panel === 'remove' && <ResponsiveDialog title="让这个席位空出来？" eyebrow="REMOVE PLAYER" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton><ActionButton variant="danger" disabled={!enabled}
        onClick={() => { if (session.submit('match_remove_player', { playerID: target })) close(); }}>确认移除</ActionButton></>}>
      <p className={styles.dialogDescription}>{targetName} 将离开房间。你可以邀请朋友或添加人机补位。</p>
      {hint('只有房主可以管理席位。开局后不能移除玩家。')}
    </ResponsiveDialog>}
  </>;
}
