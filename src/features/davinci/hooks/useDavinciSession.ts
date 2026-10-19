import { useCallback, useEffect, useRef, useState } from 'react';
import { davinciWsUrl } from '@/const/env';
import { confirmsCommand } from '../model/selectors';
import type {
  CommandPayload,
  CommandType,
  PendingCommand,
  ServerMessage,
  Snapshot,
} from '../model/session';
import { useDavinciConnection } from './useDavinciConnection';

export function useDavinciSession(roomID: string) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const latest = useRef<Snapshot>();
  const [pending, setPending] = useState<PendingCommand>();
  const pendingRef = useRef<PendingCommand>();
  const [feedback, setFeedback] = useState('');
  const requestSequence = useRef(0);
  const readyKey = useRef('');
  const clearPending = useCallback(() => {
    pendingRef.current = undefined;
    setPending(undefined);
  }, []);

  const receive = useCallback((message: ServerMessage, epoch: number) => {
    if (message.type === 'error') {
      setFeedback(message.message || '操作未完成，请根据当前状态重试');
      if (!message.requestId || message.requestId === pendingRef.current?.id) clearPending();
      return;
    }
    if (message.type === 'command_result') {
      if (message.requestId === pendingRef.current?.id) {
        clearPending();
        setFeedback('');
      }
      return;
    }
    if (message.type !== 'MATCH_SYNC' && message.type !== 'ROOM_SYNC') return;
    if (message.roomID !== roomID) return;
    const previous = latest.current;
    if (previous && message.phaseVersion < previous.phaseVersion) return;
    const command = pendingRef.current;
    if (command && epoch !== command.epoch) {
      clearPending();
      setFeedback('已恢复最新状态，请核对后继续操作');
    } else if (command && confirmsCommand(command, message)) {
      clearPending();
      setFeedback('');
    }
    latest.current = message;
    setSnapshot(message);
  }, [clearPending, roomID]);

  const connection = useDavinciConnection(
    roomID ? `${davinciWsUrl}/ws?roomID=${encodeURIComponent(roomID)}` : '',
    receive,
  );
  const { epoch, send, retry } = connection;
  const submit = useCallback((type: CommandType, payload: CommandPayload = {}) => {
    const before = latest.current;
    if (!before || pendingRef.current) return false;
    const id = `${epoch.current}-${++requestSequence.current}`;
    const command = { id, type, payload, before, epoch: epoch.current };
    if (!send({ type, payload, requestId: id, phaseVersion: before.phaseVersion })) {
      setFeedback('连接尚未恢复，请稍候');
      return false;
    }
    pendingRef.current = command;
    setPending(command);
    setFeedback('');
    return true;
  }, [epoch, send]);

  const waitingKey = snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus === 'waiting'
    ? `${snapshot.roomID}:${snapshot.phaseVersion}:${connection.epoch.current}` : '';
  useEffect(() => {
    if (waitingKey && connection.status === 'connected' && readyKey.current !== waitingKey) {
      if (submit('game_ready')) readyKey.current = waitingKey;
    }
  }, [connection.status, pending, submit, waitingKey]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      if (pendingRef.current?.id === pending.id) {
        setFeedback('确认超时，正在重新同步对局');
        retry();
      }
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [pending, retry]);

  return { snapshot, pending, feedback, connection, submit, setFeedback };
}

export type DavinciSession = ReturnType<typeof useDavinciSession>;
