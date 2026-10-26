import type {
  WarChestActionEntry,
  WarChestLegalAction,
  WarChestPrivateData,
  WarChestReplaySnapshot,
} from '@/api/generated/game-platform';
import type { Game, Plan, Side, UnitId } from './model';
import { ACTION_NAMES, UNITS } from './model';
import type {
  GameSnapshot,
  MatchSnapshot,
  PendingCommand,
  Snapshot,
} from './session';

const side = (value: string): Side => value === 'falcon' ? 1 : 0;
const unit = (value?: string): UnitId | undefined =>
  value && value in UNITS ? value as UnitId : undefined;

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
      case 'room_update_settings':
        return next.visibility === payload?.visibility;
      case 'game_set_setup_mode':
        return next.setup.mode === payload?.mode;
      case 'game_draft_unit':
        return (next.setup.draft?.completedPickCount ?? 0)
          > (before.setup.draft?.completedPickCount ?? 0);
      default:
        return false;
    }
  }
  return next.seq > before.seq;
}

const actionText = (entry: WarChestActionEntry) => {
  if (entry.summary) return entry.summary;
  const type = unit(entry.unitType ?? entry.recruitUnit);
  const name = type ? UNITS[type].name : '指令';
  const label = ACTION_NAMES[entry.action as keyof typeof ACTION_NAMES]
    ?? entry.action;
  return `${name} · ${label}${entry.automatic ? ' · 自动执行' : ''}`;
};

function toPlan(
  value: WarChestLegalAction,
  game: Pick<Game, 'board' | 'players' | 'pending'>,
  playerSide: Side,
): Plan {
  const actor = value.actorUnitID
    ? Object.values(game.board).find(piece => piece.id === value.actorUnitID)
    : undefined;
  const source = value.sourceUnitID
    ? Object.values(game.board).find(piece => piece.id === value.sourceUnitID)
    : undefined;
  const target = value.targetUnitID
    ? Object.values(game.board).find(piece => piece.id === value.targetUnitID)
    : undefined;
  const coin = game.players[playerSide].hand.find(item => item.id === value.coinID);
  const inferred = coin?.type
    ?? actor?.type
    ?? unit(game.pending?.unitType)
    ?? unit(value.recruitUnit)
    ?? 'royal';
  return {
    actionID: value.actionID,
    action: value.action as Plan['action'],
    side: playerSide,
    coinID: value.coinID,
    type: inferred,
    from: value.from,
    to: value.to,
    target: target?.cell,
    targetUnitID: value.targetUnitID,
    path: value.path,
    recruit: unit(value.recruitUnit),
    after: value.after,
    actor: actor?.type,
    actorUnitID: value.actorUnitID,
    source: source?.cell,
    sourceUnitID: value.sourceUnitID,
    order: value.maneuver as Plan['order'],
    free: !value.coinID,
    defense: value.defense as Plan['defense'],
  };
}

interface BattleSource {
  playerId: string;
  playerData: GameSnapshot['playerData'];
  privateData: WarChestPrivateData;
  privateDataByPlayer?: Record<string, WarChestPrivateData>;
  roomData: GameSnapshot['roomData'];
  result?: GameSnapshot['result'];
}

export function toBattleGame(source: BattleSource): Game {
  const board: Game['board'] = {};
  source.roomData.board.forEach(value => {
    const type = unit(value.unitType);
    if (!type) return;
    board[value.cell] = {
      id: value.unitID,
      cell: value.cell,
      type,
      side: side(value.side),
      n: value.coinCount,
    };
  });
  const controls = Object.fromEntries(source.roomData.controls.map(value => [
    value.cell,
    side(value.side),
  ]));
  const players = ([0, 1] as Side[]).map(currentSide => {
    const entry = Object.entries(source.playerData)
      .find(([, value]) => side(value.side) === currentSide);
    const [playerID, state] = entry ?? ['', undefined];
    const profile = source.roomData.players[playerID];
    const own = playerID === source.playerId;
    const visiblePrivate = source.privateDataByPlayer?.[playerID]
      ?? (own ? source.privateData : undefined);
    return {
      playerID,
      name: profile?.displayName || (profile?.ai ? '渡鸦' : `玩家 ${playerID}`),
      ai: profile?.ai ?? false,
      avatar: profile?.avatar,
      bagCount: state?.bagCount ?? 0,
      hand: visiblePrivate ? visiblePrivate.hand.map(value => ({
        id: value.coinID,
        type: unit(value.unitType),
        faceUp: value.faceUp,
      })) : [],
      handCount: state?.handCount ?? 0,
      discard: (state?.discard ?? []).map(value => ({
        id: value.coinID,
        type: unit(value.unitType),
        faceUp: value.faceUp,
      })),
      supply: (state?.supply ?? {}) as Game['players'][number]['supply'],
      lost: (state?.lost ?? {}) as Game['players'][number]['lost'],
      roster: (state?.roster ?? []).map(unit).filter(Boolean) as UnitId[],
    };
  });
  const selfSide = side(source.playerData[source.playerId]?.side ?? 'oak');
  const pending = source.roomData.pending ? {
    kind: source.roomData.pending.kind,
    side: side(source.roomData.pending.side),
    playerID: source.roomData.pending.playerID,
    actorUnitID: source.roomData.pending.actorUnitID,
    sourceUnitID: source.roomData.pending.sourceUnitID,
    targetUnitID: source.roomData.pending.targetUnitID,
    coinID: source.roomData.pending.coinID,
    unitType: unit(source.roomData.pending.unitType),
    remainingUnitIDs: source.roomData.pending.remainingUnitIDs,
    description: source.roomData.pending.description,
  } : undefined;
  const base = {
    board,
    controls,
    players,
    pending,
  };
  return {
    ...base,
    round: source.roomData.roundNo,
    turn: side(source.roomData.currentSide),
    initiative: side(source.roomData.initiativeSide),
    phase: source.roomData.gameStatus === 'end'
      ? 'end'
      : source.roomData.gameStatus === 'pending' ? 'pending' : 'playing',
    winner: source.result ? side(source.result.winnerSide) : null,
    log: source.roomData.activityLog.map(entry => ({
      id: entry.id,
      round: entry.roundNo,
      side: side(entry.side),
      text: actionText(entry),
      automatic: entry.automatic,
    })).reverse(),
    actions: source.result?.actionCount ?? source.roomData.activityLog.length,
    legalActions: source.roomData.legalActions.map(value =>
      toPlan(value, base, selfSide)),
    selfSide,
    currentPlayerID: source.roomData.currentPlayer,
    turnDeadline: source.roomData.turnDeadline,
  };
}

export function replaySource(
  snapshot: WarChestReplaySnapshot,
  viewer: string,
): BattleSource {
  const privateData = snapshot.privateData[viewer]
    ?? Object.values(snapshot.privateData)[0]
    ?? { hand: [], bagCounts: {} };
  return {
    playerId: viewer,
    playerData: snapshot.playersData,
    privateData,
    privateDataByPlayer: snapshot.privateData,
    roomData: snapshot.roomData,
    result: snapshot.result,
  };
}

export const setupModeName = (mode: string) => ({
  recommended: '官方首局推荐',
  random: '随机编成',
  draft: '官方轮抽',
}[mode] ?? mode);

export const matchCanStart = (data: MatchSnapshot) =>
  Object.keys(data.players).length === 2
  && Object.values(data.players).every(player => player.ready)
  && data.setup.complete;
