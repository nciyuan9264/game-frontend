import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { GameType } from '@/hooks/useGameType';
import { startNextGameMatch } from '../api/room';

export function useStartNextMatch(gameType: GameType, roomID: string) {
  const sequence = useRef(0);
  const pendingRef = useRef(false);
  const [matchID, setMatchID] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    sequence.current++;
    pendingRef.current = false;
    setMatchID('');
    setPending(false);
    setError('');
    return () => {
      sequence.current++;
      pendingRef.current = false;
    };
  }, [gameType, roomID]);

  const start = useCallback(async () => {
    if (!roomID || pendingRef.current) return false;
    const requestID = ++sequence.current;
    pendingRef.current = true;
    setPending(true);
    setError('');
    try {
      const result = await startNextGameMatch(gameType, roomID);
      if (requestID !== sequence.current) return false;
      setMatchID(result.matchID);
      return true;
    } catch (reason) {
      if (requestID === sequence.current) {
        setError(reason instanceof Error ? reason.message : '下一局创建失败，请重试');
      }
      return false;
    } finally {
      if (requestID === sequence.current) {
        pendingRef.current = false;
        setPending(false);
      }
    }
  }, [gameType, roomID]);

  return { matchID, pending, error, start };
}
