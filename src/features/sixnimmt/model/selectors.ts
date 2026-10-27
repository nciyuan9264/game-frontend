import {
  phaseKey,
  selfID,
  type GameSnapshot,
  type PendingCommand,
  type Snapshot,
} from './session';

export const isSelecting = (data?: GameSnapshot) =>
  data?.roomData.gameStatus === 'selecting';

export const isMyRowChoice = (data?: GameSnapshot) =>
  data?.roomData.gameStatus === 'chooseRow'
  && data.roomData.pendingChoice?.playerID === data.playerId;

export function confirmsCommand(
  command: PendingCommand,
  next: Snapshot,
): boolean {
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
}
