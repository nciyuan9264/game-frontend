import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Globe,
  Lock,
  Plus,
  Settings2,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { ActionButton } from '../ActionButton';
import { GameMobileSeatGrid } from './SeatGrid';
import type {
  GameMobileRoomFact,
  GameMobileRoomPlayer,
  GameMobileRoomSummary,
} from './types';
import styles from './index.module.less';

export interface GameMobileRoomProps {
  roomID: string;
  title?: ReactNode;
  kicker: ReactNode;
  statusLabel?: ReactNode;
  visibility: 'public' | 'private';
  gameLabel: ReactNode;
  players: readonly GameMobileRoomPlayer[];
  seats: readonly (GameMobileRoomPlayer | undefined)[];
  facts: readonly GameMobileRoomFact[];
  summary: readonly GameMobileRoomSummary[];
  summaryTitle: ReactNode;
  summaryEyebrow?: ReactNode;
  authorityHint: ReactNode;
  readinessTitle: ReactNode;
  readinessDescription: ReactNode;
  ownerActionLabel?: ReactNode;
  memberReadyLabel?: ReactNode;
  memberCancelReadyLabel?: ReactNode;
  owner: boolean;
  enabled: boolean;
  pending?: boolean;
  canStart: boolean;
  denseSeats?: boolean;
  media?: ReactNode;
  extension?: ReactNode;
  renderAvatar: (player: GameMobileRoomPlayer, size: number) => ReactNode;
  renderSeatDecoration?: (player: GameMobileRoomPlayer, index: number) => ReactNode;
  onLeave: () => void;
  onSettings: () => void;
  onInvite: () => void;
  onAddAI: (seatIndex?: number) => void;
  onRemove: (playerID: string) => void;
  onReady: () => void;
  onStart: () => void;
  classNames?: {
    table?: string;
    summary?: string;
    dock?: string;
    seatGrid?: string;
    seat?: string;
  };
}

export function GameMobileRoom({
  roomID,
  title = roomID,
  kicker,
  statusLabel = '准备中',
  visibility,
  gameLabel,
  players,
  seats,
  facts,
  summary,
  summaryTitle,
  summaryEyebrow = 'BEFORE THE FIRST MOVE',
  authorityHint,
  readinessTitle,
  readinessDescription,
  ownerActionLabel = '开始对局',
  memberReadyLabel = '我准备好了',
  memberCancelReadyLabel = '取消准备',
  owner,
  enabled,
  pending,
  canStart,
  denseSeats,
  media,
  extension,
  renderAvatar,
  renderSeatDecoration,
  onLeave,
  onSettings,
  onInvite,
  onAddAI,
  onRemove,
  onReady,
  onStart,
  classNames,
}: GameMobileRoomProps) {
  const readyCount = players.filter(player => player.ready && (player.online || player.ai)).length;
  const aiCount = players.filter(player => player.ai).length;
  const selfReady = players.find(player => player.self)?.ready;

  return <div className={styles.mobileOnly} data-game-room-mobile>
    <header className={styles.heading} data-game-room-heading>
      <div className={styles.headingIdentity} data-game-room-heading-identity>
        <button type="button" className={styles.backButton}
          data-game-room-heading-back aria-label="离开当前房间" onClick={onLeave}>
          <ArrowLeft size={19} />
        </button>
        <div data-game-room-heading-copy><small data-game-room-heading-kicker>
          {kicker}</small><h1 data-game-room-heading-title>{title}
            <span>{statusLabel}</span></h1></div>
      </div>
      <div className={styles.headingActions} data-game-room-heading-actions>
        {owner && <ActionButton onClick={onSettings}>
          <Settings2 size={15} />房间设置</ActionButton>}
        <ActionButton variant="primary" onClick={onInvite}>
          <UserPlus size={15} />邀请好友</ActionButton>
      </div>
    </header>
    <div className={styles.roomContent}>
      <section className={`${styles.tablePanel} ${classNames?.table ?? ''}`}
        data-game-mobile-room-table>
        <header><span><Users size={15} />{gameLabel}<i />
          {players.length} / {seats.length} 人</span>
          <div className={styles.preparation}><span className={styles.done}>
            <Check size={11} />入座</span><i /><span className={styles.active}>
              02 准备</span><i /><span>03 开局</span></div>
        </header>
        <div className={styles.tableStage} data-game-mobile-room-stage>
          {media && <div className={styles.tableMedia}
            data-game-mobile-room-media>{media}</div>}
          <GameMobileSeatGrid seats={seats} owner={owner} enabled={enabled}
            dense={denseSeats} renderAvatar={renderAvatar}
            renderDecoration={renderSeatDecoration}
            className={classNames?.seatGrid}
            seatClassName={classNames?.seat}
            onAddAI={seatIndex => onAddAI(seatIndex)} onInvite={onInvite}
            onRemove={onRemove} />
          {extension}
        </div>
        <footer>{facts.map((fact, index) => <span key={index}>{fact.icon}
          <small>{fact.label}</small><b>{fact.value}</b></span>)}</footer>
      </section>
      <aside className={`${styles.summary} ${classNames?.summary ?? ''}`}
        data-game-mobile-room-summary>
        <small>{summaryEyebrow}</small><h2>{summaryTitle}</h2>
        <div className={styles.visibility}>
          {visibility === 'private' ? <Lock size={22} /> : <Globe size={22} />}
          <span><b>{visibility === 'private' ? '私密房间' : '公开房间'}</b>
            <p>{visibility === 'private'
              ? '凭完整房间号或邀请链接加入'
              : '其他玩家可以从大厅找到这张桌'}</p></span>
        </div>
        <dl>{summary.map((item, index) => <div key={index}>
          <dt>{item.label}</dt><dd>{item.value}</dd></div>)}
          <div><dt>人机玩家</dt><dd>{aiCount} 位</dd></div>
          <div><dt>已准备</dt><dd>{readyCount} / {players.length} 人</dd></div>
        </dl>
        {owner && <ActionButton disabled={!enabled || players.length >= seats.length}
          onClick={() => onAddAI()}><Bot size={15} />
          {players.length >= seats.length ? '席位已满' : '添加人机'}
          <Plus size={13} /></ActionButton>}
        <div className={styles.authorityHint}><ShieldCheck size={17} />
          <span>{authorityHint}</span></div>
      </aside>
    </div>
    <footer className={`${styles.startBar} ${classNames?.dock ?? ''}`}
      data-game-mobile-room-dock>
      <div><span className={`${styles.readinessIcon} ${canStart ? styles.readyIcon : ''}`}>
        {canStart ? <Check size={17} /> : <Users size={17} />}</span>
        <span><strong>{readinessTitle}</strong>
          <small>{readinessDescription}</small></span></div>
      <ActionButton variant="primary" pending={pending}
        disabled={!enabled || owner && !canStart}
        onClick={owner ? onStart : onReady}>
        {owner
          ? ownerActionLabel
          : selfReady ? memberCancelReadyLabel : memberReadyLabel}
        <ArrowRight size={16} />
      </ActionButton>
    </footer>
  </div>;
}
