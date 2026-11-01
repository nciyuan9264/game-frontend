import { useEffect, useMemo, useState } from 'react';
import type { GameSnapshot } from '../model/session';
import type { ForSaleSession } from './useForSaleSession';

export const useForSaleInteraction = (
  session: ForSaleSession,
  data: GameSnapshot,
) => {
  const [bid, setBid] = useState(data.roomData.highestBid + 1);
  const [property, setProperty] = useState<number>();
  const self = data.playerData[data.playerId];
  useEffect(() => {
    setBid(data.roomData.highestBid + 1);
  }, [
    data.matchID,
    data.roomData.currentPlayer,
    data.roomData.gameStatus,
    data.roomData.highestBid,
  ]);
  useEffect(() => {
    setProperty(undefined);
  }, [
    data.matchID,
    data.roomData.gameStatus,
    data.roomData.round,
    self?.locked,
  ]);
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
