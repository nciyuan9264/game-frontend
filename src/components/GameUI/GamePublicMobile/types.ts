import type { ReactNode } from 'react';

export interface GamePublicFact {
  icon?: ReactNode;
  label: ReactNode;
  value?: ReactNode;
}

export interface GameMobileRankingEntry {
  id: string;
  displayName: string;
  avatar?: string;
  totalGames: number;
  metric: ReactNode;
  metricLabel: string;
}

export interface GameMobileProfileStat {
  label: ReactNode;
  value: ReactNode;
}

export interface GameMobileHistoryItem {
  id: string;
  title: ReactNode;
  detail: ReactNode;
  accessory?: ReactNode;
  href?: string;
  onClick?: () => void;
}
