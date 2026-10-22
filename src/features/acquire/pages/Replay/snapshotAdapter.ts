import type { Snapshot } from '@/features/game-core/model/history';
import type {
  DisplaySnapshot,
  GameSnapshot,
} from '../../model/session';
import type {
  AcquirePlayer,
  Company,
} from '../../model/types';
import { GameStatus } from '@/enum/game';

type CompanyKey = Company | 'Blank';

/**
 * 把后端 Snapshot 适配为前端组件可消费的 WsRoomSyncData。
 * viewerID：当前观看者（一般是登录用户）。从 snapshot.playersData[viewerID] 取私有视角。
 */
export function snapshotToWsRoomSyncData(
  snap: Snapshot,
  viewerID: string
): DisplaySnapshot {
  const viewerData = snap.playersData?.[viewerID];

  const companyInfo = Object.entries(snap.roomData.companyInfo || {}).reduce(
    (acc, [name, c]) => {
      acc[name as Company] = {
        name: c.name,
        stockPrice: c.stockPrice,
        stockTotal: c.stockTotal,
        tiles: c.tiles,
      };
      return acc;
    },
    {} as GameSnapshot['roomData']['companyInfo']
  );

  const tiles = Object.entries(snap.roomData.tiles || {}).reduce(
    (acc, [id, t]) => {
      acc[id] = {
        id,
        belong: (t.belong || '') as CompanyKey,
      };
      return acc;
    },
    {} as GameSnapshot['roomData']['tiles']
  );

  const players = Object.entries(snap.roomData.players || {}).reduce(
    (acc, [pid, p]) => {
      acc[pid] = {
        playerID: p.playerID,
        online: p.online,
        ai: p.ai,
        ready: true,
      };
      return acc;
    },
    {} as Record<string, AcquirePlayer>
  );

  const stocks = (viewerData?.stocks ?? {}) as Record<CompanyKey, number>;
  const replayEndGame = snap.roomData.endGame;
  let endCondition: '' | 'company_size' | 'all_companies_safe' = '';
  if (
    replayEndGame?.condition === 'company_size'
    || replayEndGame?.condition === 'all_companies_safe'
  ) {
    endCondition = replayEndGame.condition;
  }
  const endGame = replayEndGame
    ? {
        ...replayEndGame,
        condition: endCondition,
      }
    : {
        eligible: false,
        condition: '' as const,
        company: '',
        tileCount: 0,
        votes: {},
      };

  return {
    playerId: viewerID,
    playerData: {
      money: viewerData?.money ?? 0,
      stocks,
      tiles: viewerData?.tiles ?? [],
    },
    roomData: {
      companyInfo,
      currentPlayer: snap.roomData.currentPlayer,
      gameStatus: (snap.roomData.gameStatus as unknown) as GameStatus,
      tiles,
      players,
      endGame,
    },
    result: snap.result,
  };
}
