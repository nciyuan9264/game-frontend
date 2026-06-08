import type { Snapshot } from '@/types/history';
import type {
  WsRoomSyncData,
  CompanyKey,
  CompanyInfoItem,
  TileData,
  PlayerInfo,
} from '@/types/AcquireRoom';
import { GameStatus } from '@/enum/game';

/**
 * 把后端 Snapshot 适配为前端组件可消费的 WsRoomSyncData。
 * viewerID：当前观看者（一般是登录用户）。从 snapshot.playersData[viewerID] 取私有视角。
 */
export function snapshotToWsRoomSyncData(
  snap: Snapshot,
  viewerID: string,
  ownerID: string = ''
): WsRoomSyncData {
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
    ownerID,
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
    },
    tempData: {
      last_tile_key: '',
      mergeSettleData: {} as any,
      merge_main_company_temp: '' as CompanyKey,
      merge_selection_temp: { mainCompany: [], otherCompany: [] },
    },
    type: 'ROOM_SYNC',
    result: snap.result,
  };
}
