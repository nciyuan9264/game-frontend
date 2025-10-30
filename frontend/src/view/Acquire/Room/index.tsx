import { useEffect, useMemo, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import styles from './index.module.less';
import { useParams } from 'react-router-dom';
import Board from './components/Board';
import { Alert, Button, message, Modal } from 'antd';
import CreateCompanyModal from './components/CreateCompany';
import { GameStatus } from '@/enum/game';
import { WsRoomSyncData } from '@/types/room';
import BuyStock from './components/BuyStock';
import CompanyStockActionModal from './components/MergeCompany';
import MergeSelection from './components/MergeSelection';
import WaitingModal from '../../../components/Waiting';
import { wsUrl } from '@/const/env';
import GameEnd from './components/GameEnd';
import CompanyStockInfoModal from './components/StockInfo';
import { getLocalStorageUserID, getLocalStorageUserName } from '@/util/user';
import CompanyInfo from './components/CompanyInfo';
import { useFullHeight } from '@/hooks/useFullHeight';
import { AudioTypeEnum, useAudio } from '@/hooks/useAudio';
import Settlement from './components/Settlement';
import TopBar from './components/TopBar';
import { getMergingModalAvailible, isDataEqual } from './utils/game';
import PlayerAssets from './components/PlayerAssets';
import Board3D from './components/Board3D';
import CompanyInfo3D from './components/CompanyInfo3D';
import TopBar3D from './components/TopBar3D';
import PlayerAssets3D from './components/PlayerAssets3D';
// 在imports中添加
import LiveRanking from './components/LiveRanking';

export default function Room() {
  const { roomID } = useParams(); // 获取 URL 参数中的 roomID
  const userID = getLocalStorageUserID();
  const [createCompanyModalVisible, setCreateCompanyModalVisible] = useState(false);
  const [buyStockModalVisible, setBuyStockModalVisible] = useState(false);
  const [gameEndModalVisible, setGameEndModalVisible] = useState(false);
  const [companyInfoVisible, setCompanyInfoVisible] = useState(false);
  const [mergeCompanyModalVisible, setMergeCompanyModalVisible] = useState(false);
  const [mergeSelectionModalVisible, setMergeSelectionModalVisible] = useState(false);
  const [is3DVersion, setIs3DVersion] = useState(true);
  const [data, setData] = useState<WsRoomSyncData>();
  const [hoveredTile, setHoveredTile] = useState<string | undefined>(undefined);
  const { playAudio } = useAudio();

  const waitingModalContent = useMemo(() => {
    if (data?.roomData.roomInfo.roomStatus === false) {
      return '请等待其他玩家加入';
    }
    if (data?.roomData.roomInfo.gameStatus === GameStatus.MergingSettle && !getMergingModalAvailible(data, userID)) {
      const firstHoders = Object.entries(data?.tempData.mergeSettleData || {}).find(([_, val]) => {
        return val.hoders.length > 0;
      });
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Alert
            message={`请等待 ${getLocalStorageUserName(firstHoders?.[1].hoders[0] ?? '')} 结算`}
            type="info"
            showIcon
          />
          <Settlement data={data} />
        </div>)
    }
    return '';
  }, [data]);

  const { sendMessage, wsRef } = useWebSocket(`${wsUrl}/acquire/ws?roomID=${roomID}&userID=${userID}`, (msg) => {
    const newData: WsRoomSyncData = JSON.parse(msg.data);
    if (newData.type === 'error') {
      message.error(newData.message);
      return;
    }
    if (newData.type === 'audio') {
      const audioType = newData.message;
      if (audioType) {
        playAudio(audioType);
      }
      return;
    }
    if (newData.type === 'sync') {
      console.log('收到数据：', newData);

      // 只有当数据真正发生变化时，才保存上一次的数据
      if (data && !isDataEqual(data, newData)) {
        localStorage.setItem(`room_${roomID}_prevData`, JSON.stringify(data));
        console.log('数据发生变化，保存上一次数据到localStorage');
      }

      setData(newData);

      // ... 其他逻辑保持不变
      if (getMergingModalAvailible(newData, userID)) {
        setMergeCompanyModalVisible(true);
      } else {
        setMergeCompanyModalVisible(false);
      }
      if (userID === newData.roomData.currentPlayer) {
        if (newData.roomData.roomInfo.gameStatus === GameStatus.CREATE_COMPANY) {
          setCreateCompanyModalVisible(true);
        } else {
          setCreateCompanyModalVisible(false);
        }
        if (newData.roomData.roomInfo.gameStatus === GameStatus.BUY_STOCK) {
          setBuyStockModalVisible(true);
        } else {
          setBuyStockModalVisible(false);
        }
        if (newData.roomData.roomInfo.gameStatus === GameStatus.MergingSelection) {
          setMergeSelectionModalVisible(true);
        } else {
          setMergeSelectionModalVisible(false);
        }
      } else {
        setBuyStockModalVisible(false);
        setCreateCompanyModalVisible(false);
        setMergeSelectionModalVisible(false);
      }
    }
  });

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
    return data?.roomData.currentPlayer;
  }, [data?.roomData.currentPlayer])

  useEffect(() => {
    if (currentPlayer === userID) {
      playAudio(AudioTypeEnum.YourTurn);
    }
  }, [currentPlayer, userID]);

  useFullHeight(styles.roomContainer);

  return (
    <>
      <div className={styles.roomContainer}>
        <Button
          className={styles.versionToggleBtn}
          type="primary"
          onClick={() => setIs3DVersion(!is3DVersion)}
        >
          {is3DVersion ? '切换到2D' : '切换到3D'}
        </Button>
        {
          is3DVersion ? (
            <TopBar3D
              data={data}
              wsRef={wsRef}
              setCompanyInfoVisible={setCompanyInfoVisible}
              setGameEndModalVisible={setGameEndModalVisible}
              setCreateCompanyModalVisible={setCreateCompanyModalVisible}
              setBuyStockModalVisible={setBuyStockModalVisible}
              setMergeCompanyModalVisible={setMergeCompanyModalVisible}
              setMergeSelectionModalVisible={setMergeSelectionModalVisible}
            />
          ) : (
            <TopBar
              data={data}
              wsRef={wsRef}
              setCompanyInfoVisible={setCompanyInfoVisible}
              setGameEndModalVisible={setGameEndModalVisible}
              setCreateCompanyModalVisible={setCreateCompanyModalVisible}
              setBuyStockModalVisible={setBuyStockModalVisible}
              setMergeCompanyModalVisible={setMergeCompanyModalVisible}
              setMergeSelectionModalVisible={setMergeSelectionModalVisible}
            />
          )
        }
        <div className={styles.gameBoard}>
          {
            is3DVersion ? (
              <Board3D
                roomID={roomID ?? ''}
                hoveredTile={hoveredTile}
                data={data}
              />
            ) : (
              <Board tilesData={data?.roomData.tiles} hoveredTile={hoveredTile} />
            )
          }
          {
            is3DVersion ? (
              <CompanyInfo3D
                setBuyStockModalVisible={setBuyStockModalVisible}
                setMergeCompanyModalVisible={setMergeCompanyModalVisible}
                data={data}
                userID={userID}
              />
            ) : (
              <CompanyInfo
                setBuyStockModalVisible={setBuyStockModalVisible}
                setMergeCompanyModalVisible={setMergeCompanyModalVisible}
                data={data}
                userID={userID}
              />
            )
          }
        </div>
        <div className={styles.assets}>
          {
            is3DVersion ? (
              <PlayerAssets3D
                data={data}
                sendMessage={sendMessage}
                setHoveredTile={setHoveredTile}
                placeTile={placeTile} />
            ) : (
              <PlayerAssets
                data={data}
                sendMessage={sendMessage}
                setHoveredTile={setHoveredTile}
                placeTile={placeTile} />
            )
          }
        </div>
      </div>
      <WaitingModal content={waitingModalContent} />
      {is3DVersion && (
        <LiveRanking data={data} />
      )}
      <GameEnd
        data={data}
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
        data={data} />
      <MergeSelection
        visible={mergeSelectionModalVisible}
        data={data}
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
        data={data}
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
        company={data?.roomData.companyInfo}
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
