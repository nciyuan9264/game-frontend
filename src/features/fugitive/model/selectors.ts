import type {
  GameSnapshot,
  PendingCommand,
  Snapshot,
} from './session';
import type { Role } from './types';

export function confirmsCommand(command: PendingCommand, next: Snapshot) {
  const before = command.before;
  if (command.type === 'match_begin') {
    return before.type === 'MATCH_SYNC' && next.type === 'ROOM_SYNC';
  }
  if (next.type === 'MATCH_SYNC' && before.type === 'MATCH_SYNC') {
    const payload = command.payload as Record<string, unknown> | undefined;
    switch (command.type) {
      case 'match_ready':
        return next.players[next.playerID]?.ready === payload?.ready;
      case 'match_add_ai':
        return Object.keys(next.players).some(id =>
          !before.players[id] && next.players[id].ai);
      case 'match_remove_player':
        return !next.players[String(payload?.playerID ?? '')];
      case 'match_select_role':
        return next.players[next.ownerID]?.gameRole === payload?.role;
      case 'room_update_settings':
        return next.visibility === payload?.visibility;
      default:
        return false;
    }
  }
  return next.seq > before.seq;
}

export const roleName = (role?: Role) =>
  role === 'marshal' ? '追捕者' : '逃亡者';

export function selfRole(data: GameSnapshot): Role {
  return data.playerData[data.playerId]?.role ?? 'fugitive';
}

export function isMyTurn(data: GameSnapshot) {
  return data.roomData.currentPlayer === data.playerId;
}

export function isInteractive(data: GameSnapshot) {
  return isMyTurn(data) && [
    'opening',
    'draw',
    'fugitiveAction',
    'marshalSearch',
    'manhunt',
  ].includes(data.roomData.gameStatus);
}

export function knownNumbers(data: GameSnapshot) {
  const known = new Set<number>([0, 42]);
  data.hand.forEach(value => known.add(value.number));
  data.roomData.route.forEach(hideout => {
    if (!hideout.revealed || !hideout.card) return;
    known.add(hideout.card.number);
    hideout.sprints?.forEach(value => known.add(value.number));
  });
  return known;
}

export function lastPrivateHideout(data: GameSnapshot) {
  const visible = data.roomData.route
    .filter(value => value.card)
    .map(value => value.card!.number);
  return visible.length ? Math.max(...visible) : data.roomData.highestRevealed;
}

export function canReach(
  data: GameSnapshot,
  destination: number,
  sprints: number[],
) {
  const last = lastPrivateHideout(data);
  const sprint = sprints.reduce((total, number) =>
    total + (data.hand.find(card => card.number === number)?.sprint ?? 0), 0);
  return destination > last && destination - last <= 3 + sprint;
}
