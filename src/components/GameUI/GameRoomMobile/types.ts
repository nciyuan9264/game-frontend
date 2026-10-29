import type { ReactNode } from 'react';

export interface GameMobileRoomPlayer {
  id: string;
  name: string;
  avatar?: string;
  ai: boolean;
  online: boolean;
  ready: boolean;
  owner?: boolean;
  self?: boolean;
  role?: ReactNode;
}

export interface GameMobileRoomFact {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
}

export interface GameMobileRoomSummary {
  label: ReactNode;
  value: ReactNode;
}
