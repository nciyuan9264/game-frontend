import type { MutableRefObject } from 'react';

export interface SessionSnapshotBase {
  schemaVersion: number;
  type: 'MATCH_SYNC' | 'ROOM_SYNC';
  roomID: string;
  matchID: string;
  seq: number;
  phaseVersion: number;
  turnNumber: number;
}

export interface SessionServerMessageBase {
  schemaVersion: number;
  type: string;
  roomID: string;
  matchID: string;
  seq: number;
  commandID?: string;
  accepted?: boolean;
  code?: string;
  errorCode?: string;
  message?: string;
}

export interface SessionPendingCommand<
  TSnapshot extends SessionSnapshotBase,
  TCommandType extends string,
  TPayload,
> {
  commandID: string;
  type: TCommandType;
  payload: TPayload;
  before: TSnapshot;
  epoch: number;
}

export interface SessionConnection {
  status: string;
  epoch: MutableRefObject<number>;
  send: (message: unknown) => boolean;
  retry: () => void;
}
