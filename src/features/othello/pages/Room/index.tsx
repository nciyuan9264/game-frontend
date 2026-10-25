import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Globe,
  Info,
  Lock,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { PlayerAvatar } from '../../components/AppShell';
import { Dialog } from '../../components/Dialog';
import type { OthelloSession } from '../../hooks/useOthelloSession';
import { useOthelloViewport } from '../../hooks/useOthelloViewport';
import { othelloRoomInviteURL } from '../../model/adapters';
import { playerName, type MatchSnapshot } from '../../model/session';
import type { Visibility } from '../../model/types';
import { RoomDesktop } from './RoomDesktop';
import { RoomMobile } from './RoomMobile';
import styles from './index.module.less';

export function Room({
  session,
  data,
  onLeave,
}: {
  session: OthelloSession;
  data: MatchSnapshot;
  onLeave: () => void;
}) {
  const { isMobile } = useOthelloViewport();
  const [panel, setPanel] = useState<
    'invite' | 'settings' | 'remove' | 'start'
  >();
  const [target, setTarget] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(data.visibility);
  const [copyMessage, setCopyMessage] = useState('');
  const enabled = session.connection.status === 'connected' && !session.pending;
  const owner = data.playerID === data.ownerID;
  const players = Object.entries(data.players);
  const inviteURL = othelloRoomInviteURL(data.roomID);
  const close = () => setPanel(undefined);
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
    } catch {
      setCopyMessage('复制未成功，请稍后重试');
    }
  };
  const roomProps = {
    data,
    enabled,
    pending: !!session.pending,
    onAddAI: (seatIndex?: number) => {
      session.submit(
        'match_add_ai',
        typeof seatIndex === 'number' ? { seatIndex } : {},
      );
    },
    onRemove: (playerID: string) => {
      setTarget(playerID);
      setPanel('remove');
    },
    onReady: () => {
      session.submit('match_ready', {
        ready: !data.players[data.playerID]?.ready,
      });
    },
    onStart: () => setPanel('start' as const),
    onInvite: () => {
      setCopyMessage('');
      setPanel('invite' as const);
    },
    onSettings: () => {
      setVisibility(data.visibility);
      setPanel('settings' as const);
    },
  };

  return <div className={styles.page}>
    <header className={styles.heading}><div className={styles.headingIdentity}>
      <button type="button" className={styles.backButton}
        aria-label="离开当前房间" onClick={onLeave}><ArrowLeft size={19} /></button>
      <div><small>A TABLE FOR TWO · 房间号</small>
        <h1>{data.roomID}<span>准备中</span></h1></div></div>
      <div><ActionButton onClick={roomProps.onSettings}><Info size={15} />
        {owner ? '棋室设置' : '棋室信息'}</ActionButton>
        <ActionButton variant="primary" onClick={roomProps.onInvite}>
          <UserPlus size={15} />邀请对手</ActionButton></div></header>
    {isMobile
      ? <RoomMobile {...roomProps} />
      : <RoomDesktop {...roomProps} />}

    {panel === 'invite' && <Dialog title="给对面留一个位置"
      eyebrow="INVITE TO THE QUIET ROOM" onClose={close}
      footer={<><ActionButton onClick={() =>
        void copy(data.roomID, '房间号已复制')}>
        <Copy size={15} />复制房间号</ActionButton>
      <ActionButton variant="primary" onClick={() =>
        void copy(inviteURL, '邀请链接已复制')}>
        <Copy size={15} />复制邀请链接</ActionButton></>}>
      <div className={styles.invitePlayers}>{players.map(([id, player]) =>
        <PlayerAvatar key={id} name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={44} />)}</div>
      <p className={`${styles.dialogText} ${styles.center}`}>
        分享完整链接，对手登录后会直接进入棋室 {data.roomID}。</p>
      <div className={styles.inviteCode}><span>ROOM NUMBER</span>
        <input aria-label="分享房间号" value={data.roomID} readOnly
          onClick={event => event.currentTarget.select()} />
        <small>经典黑白棋 · {players.length} / 2 人 · {
          data.visibility === 'private' ? '私密' : '公开'}</small></div>
      <div className={styles.dialogHint}><ShieldCheck size={15} />
        <span>{copyMessage || '邀请链接不包含身份信息。'}</span></div>
    </Dialog>}

    {panel === 'settings' && <Dialog
      title={owner ? '棋室设置' : '棋室信息'} eyebrow="ROOM VISIBILITY"
      onClose={close}
      footer={owner
        ? <><ActionButton onClick={close}>取消</ActionButton>
          <ActionButton variant="primary" disabled={!enabled}
            onClick={() => {
              if (session.submit('room_update_settings', { visibility })) {
                close();
              }
            }}>保存设置</ActionButton></>
        : <ActionButton variant="primary" onClick={close}>知道了</ActionButton>}>
      <div className={styles.settings}>{(['public', 'private'] as const)
        .map(value => <button type="button" key={value}
          disabled={!owner || !enabled} aria-pressed={visibility === value}
          onClick={() => setVisibility(value)}>
          {value === 'public' ? <Globe size={21} /> : <Lock size={21} />}
          <span><b>{value === 'public' ? '公开棋室' : '私密棋室'}</b>
            <small>{value === 'public'
              ? '展示在大厅'
              : '通过完整房间号加入'}</small></span>
          {visibility === value && <Check size={14} />}</button>)}</div>
    </Dialog>}

    {panel === 'remove' && <Dialog title="让这个席位空出来？"
      eyebrow="REMOVE PLAYER" onClose={close}
      footer={<><ActionButton onClick={close}>取消</ActionButton>
        <ActionButton variant="danger" disabled={!enabled}
          onClick={() => {
            if (session.submit('match_remove_player', { playerID: target })) {
              close();
            }
          }}>确认移除</ActionButton></>}>
      <p className={styles.dialogText}>
        {playerName(target, data.players)} 将离开当前棋室。</p>
    </Dialog>}

    {panel === 'start' && <Dialog title="让第一枚黑子落下？"
      eyebrow="BEGIN THE QUIET MATCH" onClose={close}
      footer={<><ActionButton onClick={close}>再等一下</ActionButton>
        <ActionButton variant="primary" disabled={!enabled}
          onClick={() => {
            if (session.submit('match_begin')) close();
          }}>确认开局<ArrowRight size={16} /></ActionButton></>}>
      <div className={styles.startPlayers}>{players.map(([id, player]) =>
        <span key={id}><PlayerAvatar name={playerName(id, data.players)}
          avatar={player.avatar} ai={player.ai} size={52} />
          <b>{playerName(id, data.players)}</b>
          <small><Check size={12} />
            {player.ready ? '准备就绪' : '尚未准备'}</small></span>)}</div>
      <p className={styles.startCopy}>标准中心四子开局，黑方先行。每回合 60 秒，
        超时由服务端自动代下；双方均无合法落点时按盘面实际子数结算。</p>
    </Dialog>}
  </div>;
}
