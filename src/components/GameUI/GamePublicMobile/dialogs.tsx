import type { FormEvent, ReactNode } from 'react';
import { Check, Copy, Globe, Lock, ShieldCheck } from 'lucide-react';
import { useClipboardCopy } from '@/features/game-core/hooks/useClipboardCopy';
import { ActionButton } from '../ActionButton';
import { GameShareContent } from '../GameShareContent';
import { ProjectContact } from '../ProjectContact';
import { ResponsiveDialog } from '../ResponsiveDialog';
import styles from './index.module.less';

export type GameVisibility = 'public' | 'private';

export interface GameMobileCreateRoomDialogProps {
  title?: string;
  eyebrow?: string;
  description: ReactNode;
  visibility: GameVisibility;
  onVisibilityChange: (visibility: GameVisibility) => void;
  hint: ReactNode;
  fields?: ReactNode;
  facts?: ReactNode;
  error?: ReactNode;
  pending?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  themeClassName?: string;
}

export function GameMobileCreateRoomDialog({
  title = '创建房间',
  eyebrow = 'CREATE YOUR NEXT TABLE',
  description,
  visibility,
  onVisibilityChange,
  hint,
  fields,
  facts,
  error,
  pending,
  disabled,
  onClose,
  onSubmit,
  themeClassName,
}: GameMobileCreateRoomDialogProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return <ResponsiveDialog title={title} eyebrow={eyebrow} onClose={onClose}
    themeClassName={themeClassName}
    footer={<><ActionButton onClick={onClose} disabled={pending}>取消</ActionButton>
      <ActionButton variant="primary" type="submit" form="game-mobile-create-room"
        pending={pending} disabled={disabled}>创建并入座</ActionButton></>}>
    <form id="game-mobile-create-room" className={styles.createForm}
      onSubmit={submit}>
      <p>{description}</p>{fields}
      <div className={styles.visibilityLabel}>房间公开范围</div>
      <div className={styles.visibilityChoices} role="group"
        aria-label="房间公开范围">
        {(['public', 'private'] as const).map(value => <button type="button"
          key={value} aria-pressed={visibility === value}
          onClick={() => onVisibilityChange(value)}>
          {value === 'public' ? <Globe size={21} /> : <Lock size={21} />}
          <strong>{value === 'public' ? '公开房间' : '私密房间'}</strong>
          <small>{value === 'public'
            ? '显示在大厅，其他玩家可加入'
            : '通过完整房间号或邀请链接加入'}</small>
          {visibility === value && <Check size={14} />}
        </button>)}
      </div>
      {facts}
      <div className={styles.dialogHint}><ShieldCheck size={15} />
        <span>{hint}</span></div>
      {error}
    </form>
  </ResponsiveDialog>;
}

export interface GameMobileShareDialogProps {
  gameName: string;
  url: string;
  color: string;
  background: string;
  onClose: () => void;
  themeClassName?: string;
}

export function GameMobileShareDialog({
  gameName,
  url,
  color,
  background,
  onClose,
  themeClassName,
}: GameMobileShareDialogProps) {
  const clipboard = useClipboardCopy();
  const copied = clipboard.copiedValue === url;
  return <ResponsiveDialog title={`分享 ${gameName}`}
    eyebrow="INVITE SOMEONE TO THE TABLE" onClose={onClose}
    themeClassName={themeClassName}
    className={styles.shareDialog}
    footer={<><ActionButton onClick={onClose}>关闭</ActionButton>
      <ActionButton variant="primary" onClick={() => void clipboard.copy(url)}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? '链接已复制' : '复制游戏链接'}
      </ActionButton></>}>
    <GameShareContent url={url} color={color} background={background}
      classes={{
        root: styles.shareContent,
        qr: styles.shareQr,
        address: styles.shareAddress,
        hint: styles.shareHint,
      }} />
  </ResponsiveDialog>;
}

export interface GameMobileAboutDialogProps {
  gameName: string;
  avatar: ReactNode;
  onClose: () => void;
  themeClassName?: string;
}

export function GameMobileAboutDialog({
  gameName,
  avatar,
  onClose,
  themeClassName,
}: GameMobileAboutDialogProps) {
  return <ResponsiveDialog title={`关于 ${gameName} Online`}
    eyebrow="ABOUT & CONTACT" onClose={onClose}
    themeClassName={themeClassName}
    footer={<ActionButton onClick={onClose}>知道了</ActionButton>}>
    <ProjectContact gameName={gameName} avatar={avatar}
      classes={{
        intro: styles.aboutIntro,
        links: styles.aboutLinks,
        legal: styles.aboutLegal,
      }} />
  </ResponsiveDialog>;
}
