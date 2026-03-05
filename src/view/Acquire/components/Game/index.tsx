import { FC, lazy, useEffect, useState } from 'react';
import styles from './index.module.less';
import { useParams } from 'react-router-dom';
import { Board } from './components/Board';
import CreateCompanyModal from './components/CreateCompany';
import { WsRoomSyncData } from '@/types/room';
import BuyStock from './components/BuyStock';
import CompanyStockActionModal from './components/MergeCompany';
import MergeSelection from './components/MergeSelection';
import WaitingModal from '../../../../components/Waiting';
import GameEnd from './components/GameEnd';
import CompanyStockInfoModal from './components/StockInfo';
import CompanyInfo from './components/CompanyInfo';
import { AudioTypeEnum, useAudio } from '@/hooks/useAudio';
import TopBar from './components/TopBar';
import PlayerAssets from './components/PlayerAssets';
const Board3D = lazy(() => import('./components/Board3D'));
const CompanyInfo3D = lazy(() => import('./components/CompanyInfo3D'));
const TopBar3D = lazy(() => import('./components/TopBar3D'));
const PlayerAssets3D = lazy(() => import('./components/PlayerAssets3D'));
const LiveRanking = lazy(() => import('./components/LiveRanking'));
import { useGameOperate } from './utils/useGameOperate';

interface IGameProps {
  sendMessage: (msg: string) => void;
  wsRef: React.RefObject<WebSocket>;
  wsRoomSyncData?: WsRoomSyncData;
  userID: string;
  buyStockModalVisible: boolean;
  setBuyStockModalVisible: React.Dispatch<React.SetStateAction<boolean>>
  mergeCompanyModalVisible: boolean;
  setMergeCompanyModalVisible: React.Dispatch<React.SetStateAction<boolean>>
  mergeSelectionModalVisible: boolean;
  setMergeSelectionModalVisible: React.Dispatch<React.SetStateAction<boolean>>
  createCompanyModalVisible: boolean;
  setCreateCompanyModalVisible: React.Dispatch<React.SetStateAction<boolean>>
  gameEndModalVisible: boolean;
  setGameEndModalVisible: React.Dispatch<React.SetStateAction<boolean>>
}

export const Game: FC<IGameProps> = ({ sendMessage, wsRef, wsRoomSyncData, userID, buyStockModalVisible, setBuyStockModalVisible, mergeCompanyModalVisible, setMergeCompanyModalVisible, mergeSelectionModalVisible, setMergeSelectionModalVisible, createCompanyModalVisible, setCreateCompanyModalVisible, gameEndModalVisible, setGameEndModalVisible }: IGameProps) => {
  const { roomID } = useParams(); // 获取 URL 参数中的 roomID
  const [companyInfoVisible, setCompanyInfoVisible] = useState(false);
  const [is3DVersion, setIs3DVersion] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<string | undefined>(undefined);
  const { playAudio } = useAudio();
  const { placeTile, PlaceTileConfirmModal } = useGameOperate(sendMessage);

  useEffect(() => {
    if (wsRoomSyncData?.roomData.currentPlayer === userID) {
      playAudio(AudioTypeEnum.YourTurn);
    }
  }, [wsRoomSyncData?.roomData.currentPlayer, userID]);

  useEffect(() => {
    sendMessage(JSON.stringify({
      type: 'game_ready',
    }));
  }, [])

  return (
    <>
      <div className={styles['game-container']}>
        {
          is3DVersion ? (
            <TopBar3D
              data={wsRoomSyncData}
              wsRef={wsRef}
              setCompanyInfoVisible={setCompanyInfoVisible}
              setGameEndModalVisible={setGameEndModalVisible}
              setCreateCompanyModalVisible={setCreateCompanyModalVisible}
              setBuyStockModalVisible={setBuyStockModalVisible}
              setMergeCompanyModalVisible={setMergeCompanyModalVisible}
              setMergeSelectionModalVisible={setMergeSelectionModalVisible}
              userID={userID}
              is3DVersion={is3DVersion}
              setIs3DVersion={setIs3DVersion}
            />
          ) : (
            <TopBar
              data={wsRoomSyncData}
              wsRef={wsRef}
              setCompanyInfoVisible={setCompanyInfoVisible}
              setGameEndModalVisible={setGameEndModalVisible}
              setCreateCompanyModalVisible={setCreateCompanyModalVisible}
              setBuyStockModalVisible={setBuyStockModalVisible}
              setMergeCompanyModalVisible={setMergeCompanyModalVisible}
              setMergeSelectionModalVisible={setMergeSelectionModalVisible}
              userID={userID}
              is3DVersion={is3DVersion}
              setIs3DVersion={setIs3DVersion}
            />
          )
        }
        <div className={styles.gameBoard}>
          {
            is3DVersion ? (
              <Board3D
                roomID={roomID ?? ''}
                hoveredTile={hoveredTile}
                data={wsRoomSyncData}
              />
            ) : (
              <Board tilesData={wsRoomSyncData?.roomData.tiles} hoveredTile={hoveredTile} setHoveredTile={setHoveredTile} wsRoomSyncData={wsRoomSyncData} placeTile={placeTile} />
            )
          }
          {
            is3DVersion ? (
              <CompanyInfo3D
                setBuyStockModalVisible={setBuyStockModalVisible}
                setMergeCompanyModalVisible={setMergeCompanyModalVisible}
                data={wsRoomSyncData}
                userID={userID}
              />
            ) : (
              <CompanyInfo
                setBuyStockModalVisible={setBuyStockModalVisible}
                setMergeCompanyModalVisible={setMergeCompanyModalVisible}
                data={wsRoomSyncData}
                userID={userID}
              />
            )
          }
        </div>
        <div className={styles.assets}>
          {
            is3DVersion ? (
              <PlayerAssets3D
                data={wsRoomSyncData}
                sendMessage={sendMessage}
                setHoveredTile={setHoveredTile}
                placeTile={placeTile}
                userID={userID}
              />
            ) : (
              <PlayerAssets
                data={wsRoomSyncData}
                sendMessage={sendMessage}
                setHoveredTile={setHoveredTile}
                placeTile={placeTile}
                userID={userID}
              />
            )
          }
        </div>
      </div>
      <WaitingModal wsRoomSyncData={wsRoomSyncData} userID={userID} />
      {is3DVersion && (
        <LiveRanking data={wsRoomSyncData} />
      )}
      <GameEnd
        data={wsRoomSyncData}
        visible={gameEndModalVisible}
        setGameEndModalVisible={setGameEndModalVisible}
        sendMessage={sendMessage}
        userID={userID}
      />
      {PlaceTileConfirmModal}
      <CompanyStockInfoModal
        visible={companyInfoVisible}
        setCompanyInfoVisible={setCompanyInfoVisible}
      />
      <BuyStock
        visible={buyStockModalVisible}
        setBuyStockModalVisible={setBuyStockModalVisible}
        onSubmit={(stocks) => {
          sendMessage(JSON.stringify({
            type: 'game_buy_stock',
            payload: { stocks },
          }));
          setBuyStockModalVisible(false);
        }}
        data={wsRoomSyncData} />
      <MergeSelection
        visible={mergeSelectionModalVisible}
        data={wsRoomSyncData}
        onOk={(mainCompany) => {
          sendMessage(JSON.stringify({
            type: 'game_merging_selection',
            payload: { mainCompany },
          }));
          setBuyStockModalVisible(false);
        }}
        onCancel={() => {
          setMergeSelectionModalVisible(false);
        }}
      />
      <CompanyStockActionModal
        visible={mergeCompanyModalVisible}
        data={wsRoomSyncData}
        onOk={(actions) => {
          sendMessage(JSON.stringify({
            type: 'game_merging_settle',
            payload: { actions },
          }));
          setMergeCompanyModalVisible(false);
        }}
        onCancel={function (): void {
          setMergeCompanyModalVisible(false);
        }} />
      <CreateCompanyModal
        visible={createCompanyModalVisible}
        company={wsRoomSyncData?.roomData.companyInfo}
        onSelect={(company) => {
          playAudio(AudioTypeEnum.CreateCompany);
          sendMessage(JSON.stringify({
            type: 'game_create_company',
            payload: { company },
          }));
          setCreateCompanyModalVisible(false);
        }}
        onCancel={() => {
          setCreateCompanyModalVisible(false);
        }}
      />
    </>
  );
}
