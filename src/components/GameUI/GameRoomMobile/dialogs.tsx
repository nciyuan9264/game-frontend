import type { ReactNode } from 'react';
import { ArrowRight, Check, Copy, Globe, Lock, Plus, ShieldCheck } from 'lucide-react';
import { ActionButton } from '../ActionButton';
import { ResponsiveDialog } from '../ResponsiveDialog';
import type { GameMobileRoomFact, GameMobileRoomPlayer } from './types';
import styles from './index.module.less';

interface BaseDialogProps {
  onClose: () => void;
  themeClassName?: string;
}

export interface GameMobileRoomInviteDialogProps extends BaseDialogProps {
  title?: string;
  roomID: string;
  playerCount: number;
  maxPlayers: number;
  visibility: 'public' | 'private';
  players: readonly GameMobileRoomPlayer[];
  renderAvatar: (player: GameMobileRoomPlayer, size: number) => ReactNode;
  copyMessage?: ReactNode;
  onCopyRoomID: () => void;
  onCopyInviteURL: () => void;
}

export function GameMobileRoomInviteDialog({
  title = '给朋友，留一个好位置。',
  roomID,
  playerCount,
  maxPlayers,
  visibility,
  players,
  renderAvatar,
  copyMessage,
  onCopyRoomID,
  onCopyInviteURL,
  onClose,
  themeClassName,
}: GameMobileRoomInviteDialogProps) {
  return <ResponsiveDialog title={title} eyebrow="INVITE TO THE TABLE"
    onClose={onClose} themeClassName={themeClassName}
    footer={<><ActionButton onClick={onCopyRoomID}><Copy size={15} />
      复制房间号</ActionButton><ActionButton variant="primary"
        onClick={onCopyInviteURL}><Copy size={15} />复制邀请链接</ActionButton></>}>
    <div className={styles.invitePlayers}>{players.map(player =>
      <span key={player.id}>{renderAvatar(player, 44)}</span>)}
      {playerCount < maxPlayers && <i><Plus size={20} /></i>}
    </div>
    <p className={styles.dialogDescription}>房间 {roomID} 还有
      {' '}{maxPlayers - playerCount} 个席位。可以分享房间号，也可以直接发送邀请链接。</p>
    <div className={styles.inviteCode}><small>ROOM NUMBER</small>
      <input aria-label="分享房间号" value={roomID} readOnly
        onClick={event => event.currentTarget.select()} />
      <span>{playerCount} / {maxPlayers} 人 ·
        {visibility === 'private' ? ' 私密' : ' 公开'}</span></div>
    <div className={styles.dialogHint}><ShieldCheck size={15} /><span>
      {copyMessage || (visibility === 'private'
        ? '私密房间请分享完整房间号或邀请链接。'
        : '朋友可以从大厅、房间号或邀请链接加入。')}</span></div>
  </ResponsiveDialog>;
}

export interface GameMobileRoomSettingsDialogProps extends BaseDialogProps {
  roomID: string;
  visibility: 'public' | 'private';
  onVisibilityChange: (value: 'public' | 'private') => void;
  fields?: ReactNode;
  hint: ReactNode;
  enabled: boolean;
  onSave: () => void;
}

export function GameMobileRoomSettingsDialog({
  roomID,
  visibility,
  onVisibilityChange,
  fields,
  hint,
  enabled,
  onSave,
  onClose,
  themeClassName,
}: GameMobileRoomSettingsDialogProps) {
  return <ResponsiveDialog title="房间设置" eyebrow="ROOM SETTINGS"
    onClose={onClose} themeClassName={themeClassName}
    footer={<><ActionButton onClick={onClose}>取消</ActionButton>
      <ActionButton variant="primary" disabled={!enabled} onClick={onSave}>
        保存设置<ArrowRight size={15} /></ActionButton></>}>
    <div className={styles.settingsForm}>{fields}
      <div className={styles.roomCode}><span>房间号</span><b>{roomID}</b></div>
      <div className={styles.settingsChoices}>{(['public', 'private'] as const)
        .map(value => <button type="button" key={value}
          aria-pressed={visibility === value}
          onClick={() => onVisibilityChange(value)}>
          {value === 'public' ? <Globe size={21} /> : <Lock size={21} />}
          <span><b>{value === 'public' ? '公开房间' : '私密房间'}</b>
            <small>{value === 'public' ? '显示在大厅' : '通过房间号加入'}</small></span>
          {visibility === value && <Check size={14} />}
        </button>)}</div>
      <div className={styles.dialogHint}><ShieldCheck size={15} />
        <span>{hint}</span></div>
    </div>
  </ResponsiveDialog>;
}

export interface GameMobileRoomRemoveDialogProps extends BaseDialogProps {
  playerName: ReactNode;
  enabled: boolean;
  onConfirm: () => void;
}

export function GameMobileRoomRemoveDialog({
  playerName,
  enabled,
  onConfirm,
  onClose,
  themeClassName,
}: GameMobileRoomRemoveDialogProps) {
  return <ResponsiveDialog title="让这个席位空出来？"
    eyebrow="REMOVE PLAYER" onClose={onClose} themeClassName={themeClassName}
    footer={<><ActionButton onClick={onClose}>取消</ActionButton>
      <ActionButton variant="danger" disabled={!enabled} onClick={onConfirm}>
        确认移除</ActionButton></>}>
    <p className={styles.dialogDescription}>{playerName} 将离开房间。
      你可以邀请朋友或添加人机补位。</p>
    <div className={styles.dialogHint}><ShieldCheck size={15} />
      <span>只有房主可以管理席位，开局后不能移除玩家。</span></div>
  </ResponsiveDialog>;
}

export interface GameMobileRoomStartDialogProps extends BaseDialogProps {
  title?: string;
  players: readonly GameMobileRoomPlayer[];
  renderAvatar: (player: GameMobileRoomPlayer, size: number) => ReactNode;
  facts: readonly GameMobileRoomFact[];
  hint: ReactNode;
  enabled: boolean;
  onConfirm: () => void;
}

export function GameMobileRoomStartDialog({
  title = '人齐了，开场吧。',
  players,
  renderAvatar,
  facts,
  hint,
  enabled,
  onConfirm,
  onClose,
  themeClassName,
}: GameMobileRoomStartDialogProps) {
  return <ResponsiveDialog title={title} eyebrow="READY FOR THE FIRST MOVE"
    onClose={onClose} themeClassName={themeClassName}
    footer={<><ActionButton onClick={onClose}>再等一下</ActionButton>
      <ActionButton variant="primary" disabled={!enabled} onClick={onConfirm}>
        确认开局<ArrowRight size={15} /></ActionButton></>}>
    <div className={styles.startPlayers}>{players.map(player =>
      <span key={player.id}>{renderAvatar(player, 50)}<b>{player.name}</b>
        <small><Check size={12} />{player.ready ? '准备就绪' : '尚未准备'}</small>
      </span>)}</div>
    <div className={styles.startFacts}>{facts.map((fact, index) =>
      <span key={index}>{fact.icon}<small>{fact.label}</small>
        <b>{fact.value}</b></span>)}</div>
    <div className={styles.dialogHint}><ShieldCheck size={15} />
      <span>{hint}</span></div>
  </ResponsiveDialog>;
}
