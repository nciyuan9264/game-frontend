export enum Role {
  Host = 'host',
  Player = 'player',
  Empty = 'empty',
}

// 视角角色，仅包含房主 / 普通玩家
export type ViewRole = Role.Host | Role.Player;

export interface Seat {
  id: string;
  label: string;
  role: Role;
  isReady: boolean;
}

export interface RoomCounts {
  occupied: number;
  ready: number;
  capacity: number;
}