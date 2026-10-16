import { useCallback, useEffect, useRef, useState } from 'react';
import { acquireWsUrl } from '@/const/env';
import { confirmsCommand } from '../model/selectors';
import { phaseKey, playerName, type CommandPayload, type CommandType, type PendingCommand, type ServerMessage, type Snapshot } from '../model/session';
import { useAcquireConnection } from './useAcquireConnection';

export function useAcquireSession(roomID: string) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const latest = useRef<Snapshot>();
  const snapshotEpoch = useRef<number>();
  const [pending, setPending] = useState<PendingCommand>();
  const pendingRef = useRef<PendingCommand>();
  const [feedback, setFeedback] = useState('');
  const [activity, setActivity] = useState<string[]>([]);
  const requestSequence = useRef(0);
  const readyKey = useRef('');
  const clearPending = useCallback(() => { pendingRef.current = undefined; setPending(undefined); }, []);
  const receive = useCallback((message: ServerMessage, epoch: number) => {
    if (message.type === 'error') {
      setFeedback(message.message || '操作未完成，请根据当前状态重试');
      if (!message.requestId || message.requestId === pendingRef.current?.id) clearPending();
      return;
    }
    if (message.type === 'command_result') {
      if (message.requestId === pendingRef.current?.id && pendingRef.current?.type === 'game_ready') clearPending();
      return;
    }
    if (message.type !== 'MATCH_SYNC' && message.type !== 'ROOM_SYNC') return;
    if (message.roomID !== roomID) return;
    const previous = latest.current;
    if (previous && message.phaseVersion < previous.phaseVersion) return;
    const command = pendingRef.current;
    if (command && confirmsCommand(command, message)) { clearPending(); setFeedback(''); }
    else if (command && epoch !== command.epoch) {
      clearPending(); setFeedback('已恢复最新状态，请核对后继续操作');
    }
    if (snapshotEpoch.current === epoch && previous?.type === 'ROOM_SYNC' && message.type === 'ROOM_SYNC') {
      const changes: string[] = [];
      const placed = Object.keys(message.roomData.tiles).find(key => !previous.roomData.tiles[key]?.belong && message.roomData.tiles[key].belong);
      if (placed) changes.push(`${playerName(previous.roomData.currentPlayer, message.roomData.players)} 落地 ${placed}`);
      for (const [name, company] of Object.entries(message.roomData.companyInfo)) {
        if (company.tiles > 0 && !previous.roomData.companyInfo[name as keyof typeof previous.roomData.companyInfo]?.tiles)
          changes.push(`${name} 成立`);
      }
      if (message.roomData.gameStatus === 'end' && previous.roomData.gameStatus !== 'end') changes.push('对局结束，结算已生成');
      if (changes.length) setActivity(items => [...changes.reverse(), ...items].slice(0, 8));
    } else if (message.type === 'MATCH_SYNC') setActivity([]);
    snapshotEpoch.current = epoch;
    latest.current = message; setSnapshot(message);
  }, [clearPending, roomID]);
  const connection = useAcquireConnection(roomID ? `${acquireWsUrl}/ws?roomID=${encodeURIComponent(roomID)}` : '', receive);
  const { epoch, send, retry } = connection;
  const submit = useCallback((type: CommandType, payload: CommandPayload = {}) => {
    const before = latest.current;
    if (!before || pendingRef.current) return false;
    const id = `${epoch.current}-${++requestSequence.current}`;
    const command = { id, type, payload, before, epoch: epoch.current };
    if (!send({ type, payload, requestId: id, phaseVersion: before.phaseVersion })) {
      setFeedback('连接尚未恢复，请稍候'); return false;
    }
    pendingRef.current = command; setPending(command); setFeedback('');
    return true;
  }, [epoch, send]);
  const waitingKey = snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus === 'waiting'
    ? `${phaseKey(snapshot)}:${connection.epoch.current}` : '';
  useEffect(() => {
    if (waitingKey && connection.status === 'connected' && readyKey.current !== waitingKey) {
      if (submit('game_ready')) readyKey.current = waitingKey;
    }
  }, [waitingKey, connection.status, pending, submit]);
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      if (pendingRef.current?.id === pending.id) {
        setFeedback('确认超时，正在重新同步对局');
        retry();
      }
    }, 12000);
    return () => clearTimeout(timer);
  }, [pending, retry]);
  return { snapshot, pending, feedback, activity, connection, submit, setFeedback };
}
export type AcquireSession = ReturnType<typeof useAcquireSession>;
