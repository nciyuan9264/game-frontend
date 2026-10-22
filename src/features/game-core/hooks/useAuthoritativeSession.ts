import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SessionConnection,
  SessionPendingCommand,
  SessionServerMessageBase,
  SessionSnapshotBase,
} from '../model/session';

interface AcceptedSnapshotContext<TSnapshot extends SessionSnapshotBase> {
  previous?: TSnapshot;
  next: TSnapshot;
  epoch: number;
  previousEpoch?: number;
}

interface UseAuthoritativeSessionOptions<
  TSnapshot extends SessionSnapshotBase,
  TMessage extends SessionServerMessageBase,
  TCommandType extends string,
  TPayload,
  TConnection extends SessionConnection,
> {
  roomID: string;
  url: string;
  useConnection: (
    url: string,
    receive: (message: TMessage, epoch: number) => void
  ) => TConnection;
  confirmsCommand: (
    command: SessionPendingCommand<TSnapshot, TCommandType, TPayload>,
    next: TSnapshot
  ) => boolean;
  createEmptyPayload: () => TPayload;
  getWaitingKey: (snapshot: TSnapshot | undefined, epoch: number) => string;
  readyCommand: TCommandType;
  createCommand: (
    matchID: string,
    commandID: string,
    type: TCommandType,
    payload: TPayload,
  ) => unknown;
  commandResultConfirms?: (
    command: SessionPendingCommand<TSnapshot, TCommandType, TPayload>,
    message: TMessage
  ) => boolean;
  clearFeedbackOnCommandResult?: boolean;
  confirmationOrder?: 'epoch-first' | 'snapshot-first';
  onAcceptedSnapshot?: (context: AcceptedSnapshotContext<TSnapshot>) => void;
  confirmationTimeoutMs?: number;
}

const defaultCommandResultConfirms = <
  TSnapshot extends SessionSnapshotBase,
  TCommandType extends string,
  TPayload,
  TMessage extends SessionServerMessageBase,
>(
  command: SessionPendingCommand<TSnapshot, TCommandType, TPayload>,
  message: TMessage
) => message.commandID === command.commandID;

export function useAuthoritativeSession<
  TSnapshot extends SessionSnapshotBase,
  TMessage extends SessionServerMessageBase,
  TCommandType extends string,
  TPayload,
  TConnection extends SessionConnection,
>({
  roomID,
  url,
  useConnection,
  confirmsCommand,
  createEmptyPayload,
  getWaitingKey,
  readyCommand,
  createCommand,
  commandResultConfirms = defaultCommandResultConfirms,
  clearFeedbackOnCommandResult = true,
  confirmationOrder = 'epoch-first',
  onAcceptedSnapshot,
  confirmationTimeoutMs = 12000,
}: UseAuthoritativeSessionOptions<
  TSnapshot,
  TMessage,
  TCommandType,
  TPayload,
  TConnection
>) {
  const [snapshot, setSnapshot] = useState<TSnapshot>();
  const latestRef = useRef<TSnapshot>();
  const latestEpochRef = useRef<number>();
  const [pending, setPending] = useState<
    SessionPendingCommand<TSnapshot, TCommandType, TPayload>
  >();
  const pendingRef = useRef<
    SessionPendingCommand<TSnapshot, TCommandType, TPayload>
  >();
  const [feedback, setFeedback] = useState('');
  const readyKeyRef = useRef('');

  const clearPending = useCallback(() => {
    pendingRef.current = undefined;
    setPending(undefined);
  }, []);

  const receive = useCallback((message: TMessage, epoch: number) => {
    if (message.type === 'ERROR') {
      setFeedback(message.message || '操作未完成，请根据当前状态重试');
      if (
        !message.commandID
        || message.commandID === pendingRef.current?.commandID
      ) {
        clearPending();
      }
      return;
    }
    if (message.type === 'COMMAND_RESULT') {
      const command = pendingRef.current;
      if (command && commandResultConfirms(command, message)) {
        clearPending();
        if (message.accepted === false) {
          setFeedback(message.message || '操作未完成，请根据当前状态重试');
        } else if (clearFeedbackOnCommandResult) {
          setFeedback('');
        }
      }
      return;
    }
    if (message.type !== 'MATCH_SYNC' && message.type !== 'ROOM_SYNC') return;
    if (message.roomID !== roomID || !Number.isSafeInteger(message.seq)) return;

    const next = message as unknown as TSnapshot;
    const previous = latestRef.current;
    if (
      previous
      && (
        next.matchID !== previous.matchID
        || next.seq < previous.seq
      )
    ) {
      return;
    }

    const command = pendingRef.current;
    const epochChanged = !!command && epoch !== command.epoch;
    const confirmed = !!command && confirmsCommand(command, next);
    const resynchronized = confirmationOrder === 'snapshot-first'
      ? !confirmed && epochChanged
      : epochChanged;
    const acceptedConfirmation = confirmationOrder === 'snapshot-first'
      ? confirmed
      : !epochChanged && confirmed;

    if (resynchronized) {
      clearPending();
      setFeedback('已恢复最新状态，请核对后继续操作');
    } else if (acceptedConfirmation) {
      clearPending();
      setFeedback('');
    }

    onAcceptedSnapshot?.({
      previous,
      next,
      epoch,
      previousEpoch: latestEpochRef.current,
    });
    latestEpochRef.current = epoch;
    latestRef.current = next;
    setSnapshot(next);
  }, [
    clearPending,
    clearFeedbackOnCommandResult,
    commandResultConfirms,
    confirmationOrder,
    confirmsCommand,
    onAcceptedSnapshot,
    roomID,
  ]);

  const connection = useConnection(url, receive);
  const { epoch, retry, send } = connection;

  const submit = useCallback((
    type: TCommandType,
    payload: TPayload = createEmptyPayload()
  ) => {
    const before = latestRef.current;
    if (!before || pendingRef.current) return false;

    const commandID = crypto.randomUUID();
    const command: SessionPendingCommand<TSnapshot, TCommandType, TPayload> = {
      commandID,
      type,
      payload,
      before,
      epoch: epoch.current,
    };
    if (!send(createCommand(
      before.matchID,
      commandID,
      type,
      payload,
    ))) {
      setFeedback('连接尚未恢复，请稍候');
      return false;
    }
    pendingRef.current = command;
    setPending(command);
    setFeedback('');
    return true;
  }, [createCommand, createEmptyPayload, epoch, send]);

  const waitingKey = getWaitingKey(snapshot, connection.epoch.current);
  useEffect(() => {
    if (
      waitingKey
      && connection.status === 'connected'
      && readyKeyRef.current !== waitingKey
    ) {
      if (submit(readyCommand)) readyKeyRef.current = waitingKey;
    }
  }, [connection.status, pending, readyCommand, submit, waitingKey]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      if (pendingRef.current?.commandID === pending.commandID) {
        setFeedback('确认超时，正在重新同步对局');
        retry();
      }
    }, confirmationTimeoutMs);
    return () => window.clearTimeout(timer);
  }, [confirmationTimeoutMs, pending, retry]);

  return {
    snapshot,
    pending,
    feedback,
    connection,
    submit,
    setFeedback,
  };
}
