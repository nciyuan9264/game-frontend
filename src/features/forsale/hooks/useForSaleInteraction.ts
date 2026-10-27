import { useEffect, useMemo, useState } from 'react';
import type { GameSnapshot } from '../model/session';
import type { ForSaleSession } from './useForSaleSession';

export const useForSaleInteraction = (
  session: ForSaleSession,
  data: GameSnapshot,
) => {
  const [bid, setBid] = useState(data.roomData.highestBid + 1);
  const [property, setProperty] = useState<number>();
  const key = `${data.matchID}:${data.seq}:${data.roomData.gameStatus}:${
    data.roomData.currentPlayer}`;
  useEffect(() => {
    setBid(data.roomData.highestBid + 1);
    setProperty(undefined);
  }, [key, data.roomData.highestBid]);
  const self = data.playerData[data.playerId];
  const enabled = session.connection.status === 'connected' && !session.pending;
  const canBid = enabled
    && data.roomData.gameStatus === 'auction'
    && data.roomData.currentPlayer === data.playerId
    && Number.isInteger(bid)
    && bid > data.roomData.highestBid
    && bid <= (self?.coins ?? 0) + (self?.bid ?? 0);
  const canLock = enabled
    && data.roomData.gameStatus === 'sellSelect'
    && !self?.locked
    && property != null
    && self?.properties?.includes(property);
  return useMemo(() => ({
    bid,
    setBid,
    property,
    setProperty,
    enabled,
    canBid,
    canLock,
    submitBid: () => canBid && session.submit('game_bid', { amount: bid }),
    lockSale: () => canLock && session.submit('game_lock_sale', { property }),
  }), [bid, canBid, canLock, enabled, property, session]);
};
