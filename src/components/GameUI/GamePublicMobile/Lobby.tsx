import type { ReactNode } from 'react';
import {
  ArrowRight,
  Building2,
  KeyRound,
  Plus,
  Search,
  Share2,
} from 'lucide-react';
import { ActionButton } from '../ActionButton';
import { GameTabs } from '../GameTabs';
import { Eyebrow } from '../Panel';
import type { GamePublicFact } from './types';
import styles from './index.module.less';

export interface GameMobileLobbyProps<TRoom, TFilter extends string> {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  media: ReactNode;
  caption?: ReactNode;
  facts: readonly GamePublicFact[];
  factsContent?: ReactNode;
  browserEyebrow: ReactNode;
  browserTitle: ReactNode;
  roomCount: ReactNode;
  filters: readonly { value: TFilter; label: ReactNode }[];
  filter: TFilter;
  onFilterChange: (value: TFilter) => void;
  query: string;
  onQueryChange: (value: string) => void;
  rooms: readonly TRoom[];
  renderRoom: (room: TRoom) => ReactNode;
  onCreate: () => void;
  onShare: () => void;
  joinCode: string;
  onJoinCodeChange: (value: string) => void;
  onJoin: () => void;
  joinTitle?: ReactNode;
  joinDescription?: ReactNode;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  error?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function GameMobileLobby<TRoom, TFilter extends string>({
  eyebrow,
  title,
  description,
  media,
  caption,
  facts,
  factsContent,
  browserEyebrow,
  browserTitle,
  roomCount,
  filters,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  rooms,
  renderRoom,
  onCreate,
  onShare,
  joinCode,
  onJoinCodeChange,
  onJoin,
  joinTitle = '朋友已经开好房间？',
  joinDescription = '输入完整房间号，找到朋友的桌。',
  emptyTitle = '还没有等待中的房间',
  emptyDescription = '创建房间，邀请朋友或添加公平 AI 开始。',
  error,
  footer,
  className = '',
}: GameMobileLobbyProps<TRoom, TFilter>) {
  return <div className={`${styles.mobileOnly} ${styles.lobby} ${className}`}
    data-game-public-mobile="lobby">
    <section className={styles.lobbyHero} data-game-mobile-lobby-hero>
      <div className={styles.heroMedia}>{media}</div>
      <div className={styles.heroShade} />
      <div className={styles.heroCopy}><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1>
        <p>{description}</p><div className={styles.heroActions}>
          <ActionButton variant="primary" onClick={onCreate}>
            <Plus size={17} />创建房间<ArrowRight size={16} />
          </ActionButton>
          <ActionButton onClick={onShare}>
            <Share2 size={16} />分享游戏
          </ActionButton>
        </div></div>
      {caption && <span className={styles.heroCaption}>{caption}</span>}
    </section>
    {factsContent ?? <div className={styles.lobbyFacts}
      data-game-mobile-lobby-facts>
      {facts.map((fact, index) => <span key={index}>{fact.icon}
        <b>{fact.value}</b><small>{fact.label}</small></span>)}
    </div>}
    <section className={styles.lobbyBrowser} data-game-mobile-lobby-browser>
      <header><div><Eyebrow>{browserEyebrow}</Eyebrow><h2>{browserTitle}</h2></div>
        <span>{roomCount}</span></header>
      <div className={styles.lobbyFilters}>
        <GameTabs items={filters} value={filter} onChange={onFilterChange}
          ariaLabel="房间状态" className={styles.lobbyTabs}
          activeClassName={styles.activeTab} />
        <label className={styles.lobbySearch}><Search size={16} />
          <input aria-label="搜索房间号或房主" placeholder="搜索房间号 / 房主"
            value={query} onChange={event => onQueryChange(event.target.value)} />
        </label>
      </div>
      {error}
      {rooms.length
        ? <div className={styles.lobbyCards}>{rooms.map(renderRoom)}</div>
        : <div className={styles.lobbyEmpty}><Building2 size={34} />
          <h3>{emptyTitle}</h3><p>{emptyDescription}</p></div>}
    </section>
    <section className={styles.joinCard} data-game-mobile-lobby-join>
      <h3><KeyRound size={18} />{joinTitle}</h3>
      {joinDescription && <p>{joinDescription}</p>}
      <form onSubmit={event => { event.preventDefault(); onJoin(); }}>
        <input aria-label="查找房间号" placeholder="输入完整房间号"
          value={joinCode} onChange={event => onJoinCodeChange(event.target.value)}
          autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        <button type="submit" disabled={!joinCode.trim()} aria-label="查找房间">
          <ArrowRight size={19} />
        </button>
      </form>
    </section>
    {footer && <footer className={styles.lobbyFooter}>{footer}</footer>}
  </div>;
}
