import type { Snapshot } from '@/types/history';
import type {
  CompanyKey,
  CompanyInfoItem,
  TileData,
  PlayerInfo,
} from '@/types/AcquireRoom';
import type { DisplaySnapshot } from '../../model/session';
import { GameStatus } from '@/enum/game';

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
      acc[name as CompanyKey] = {
        name: c.name,
        stockPrice: c.stockPrice,
        stockTotal: c.stockTotal,
        tiles: c.tiles,
        valuation: '',
      };
      return acc;
    },
    {} as Record<CompanyKey, CompanyInfoItem>
  );

  const tiles = Object.entries(snap.roomData.tiles || {}).reduce(
    (acc, [id, t]) => {
      acc[id] = {
        id,
        belong: (t.belong || '') as CompanyKey,
      };
      return acc;
    },
    {} as Record<string, TileData>
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
    {} as Record<string, PlayerInfo>
  );

  const stocks = (viewerData?.stocks ?? {}) as Record<CompanyKey, number>;

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
      currentStep: '',
      gameStatus: (snap.roomData.gameStatus as unknown) as GameStatus,
      tiles,
      players,
      endGame: snap.roomData.endGame ?? {
        eligible: false, condition: '', company: '', tileCount: 0, votes: {},
      },
    },
    result: snap.result,
  };
}
