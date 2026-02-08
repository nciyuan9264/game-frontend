import { FC, useEffect, useMemo, useState } from 'react';
import styles from './index.module.less';
import { useParams } from 'react-router-dom';
import { Board } from './components/Board';
import { Alert, Modal } from 'antd';
import CreateCompanyModal from './components/CreateCompany';
import { GameStatus } from '@/enum/game';
import { WsRoomSyncData } from '@/types/room';
import BuyStock from './components/BuyStock';
import CompanyStockActionModal from './components/MergeCompany';
import MergeSelection from './components/MergeSelection';
import WaitingModal from '../../../../components/Waiting';
import GameEnd from './components/GameEnd';
import CompanyStockInfoModal from './components/StockInfo';
import { backendName2FrontendName } from '@/util/user';
import CompanyInfo from './components/CompanyInfo';
import { AudioTypeEnum, useAudio } from '@/hooks/useAudio';
import Settlement from './components/Settlement';
import TopBar from './components/TopBar';
import { getMergingModalAvailible } from './utils/game';
import PlayerAssets from './components/PlayerAssets';
import Board3D from './components/Board3D';
import CompanyInfo3D from './components/CompanyInfo3D';
import TopBar3D from './components/TopBar3D';
import PlayerAssets3D from './components/PlayerAssets3D';
// 在imports中添加
import LiveRanking from './components/LiveRanking';

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
}

export const Game: FC<IGameProps> = ({ sendMessage, wsRef, wsRoomSyncData, userID, buyStockModalVisible, setBuyStockModalVisible, mergeCompanyModalVisible, setMergeCompanyModalVisible, mergeSelectionModalVisible, setMergeSelectionModalVisible, createCompanyModalVisible, setCreateCompanyModalVisible }: IGameProps) => {
  const { roomID } = useParams(); // 获取 URL 参数中的 roomID
  const [gameEndModalVisible, setGameEndModalVisible] = useState(false);
  const [companyInfoVisible, setCompanyInfoVisible] = useState(false);
  const [is3DVersion, setIs3DVersion] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<string | undefined>(undefined);
  const { playAudio } = useAudio();
  const waitingModalContent = useMemo(() => {
    if (wsRoomSyncData?.roomData.roomInfo.roomStatus === false) {
      return '请等待其他玩家加入';
    }
    if (wsRoomSyncData?.roomData.roomInfo.gameStatus === GameStatus.MergingSettle && !getMergingModalAvailible(wsRoomSyncData, userID)) {
      const firstHoders = Object.entries(wsRoomSyncData?.tempData.mergeSettleData || {}).find(([_, val]) => {
        return val.hoders.length > 0;
      });
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Alert
            message={`请等待 ${backendName2FrontendName(firstHoders?.[1].hoders[0] ?? '')} 结算`}
            type="info"
            showIcon
          />
          <Settlement data={wsRoomSyncData} />
        </div>)
    }
    return '';
  }, [wsRoomSyncData]);

  const placeTile = (tileKey: string) => Modal.confirm({
    title: '确认操作',
    content: (
      <div>
        你确定要放置这个 tile 吗？
        <div style={{ fontWeight: 'bold', marginTop: 8 }}>{tileKey}</div>
      </div>
    ),
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      sendMessage(JSON.stringify({
        type: 'place_tile',
        payload: tileKey,
      }));
    },
  });

  const currentPlayer = useMemo(() => {
    return wsRoomSyncData?.roomData.currentPlayer;
  }, [wsRoomSyncData?.roomData.currentPlayer])

  useEffect(() => {
    if (currentPlayer === userID) {
      playAudio(AudioTypeEnum.YourTurn);
    }
  }, [currentPlayer, userID]);

  useEffect(() => {
    sendMessage(JSON.stringify({
      type: 'game_ready',
    }));
  },[])

  return (
    <>
      <div className={styles['game-container']}>
        {/* <Button
          className={styles.versionToggleBtn}
          type="primary"
          onClick={() => setIs3DVersion(!is3DVersion)}
        >
          {is3DVersion ? '切换到2D' : '切换到3D'}
        </Button> */}
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
              <Board tilesData={wsRoomSyncData?.roomData.tiles} hoveredTile={hoveredTile} setHoveredTile={setHoveredTile} wsRoomSyncData={wsRoomSyncData} placeTile={placeTile}/>
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
      <WaitingModal content={waitingModalContent} />
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
      <CompanyStockInfoModal
        visible={companyInfoVisible}
        setCompanyInfoVisible={setCompanyInfoVisible}
      />
      <BuyStock
        visible={buyStockModalVisible}
        setBuyStockModalVisible={setBuyStockModalVisible}
        onSubmit={(modalData) => {
          sendMessage(JSON.stringify({
            type: 'buy_stock',
            payload: modalData,
          }));
          setBuyStockModalVisible(false);
        }}
        data={wsRoomSyncData} />
      <MergeSelection
        visible={mergeSelectionModalVisible}
        data={wsRoomSyncData}
        onOk={(modalData) => {
          sendMessage(JSON.stringify({
            type: 'merging_selection',
            payload: modalData,
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
        onOk={(modalData) => {
          sendMessage(JSON.stringify({
            type: 'merging_settle',
            payload: modalData,
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
            type: 'create_company',
            payload: company,
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
