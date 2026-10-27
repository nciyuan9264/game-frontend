import {
  phaseKey,
  selfID,
  type GameSnapshot,
  type PendingCommand,
  type Snapshot,
} from './session';

export const isMyTurn = (data?: GameSnapshot) =>
  !!data
  && data.roomData.gameStatus === 'auction'
  && data.roomData.currentPlayer === data.playerId;

export const confirmsCommand = (
  command: PendingCommand,
  next: Snapshot,
): boolean => {
  const before = command.before;
  if (phaseKey(before) !== phaseKey(next)) return true;
  if (before.type === 'MATCH_SYNC' && next.type === 'MATCH_SYNC') {
    switch (command.type) {
      case 'match_ready':
        return next.players[selfID(next)]?.ready === command.payload.ready;
      case 'room_update_settings':
        return next.visibility === command.payload.visibility;
      case 'match_add_ai':
        return Object.keys(next.players).some(
          id => !before.players[id] && next.players[id].ai,
        );
      case 'match_remove_player':
        return !next.players[String(command.payload.playerID)];
    }
  }
  return false;
};

export const latestPurchase = (data: GameSnapshot) =>
  data.roomData.purchases[data.roomData.purchases.length - 1];

export const latestSale = (data: GameSnapshot) =>
  data.roomData.sales[data.roomData.sales.length - 1];
