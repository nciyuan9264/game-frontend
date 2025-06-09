import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import styles from './index.module.less';
import { getOrCreateUserId } from '@/util/user';
import { useParams } from 'react-router-dom';
import Board from './components/Board';
import { Button, Modal } from 'antd';
import HotelSelectorModal from './components/CreateCompany';
import { GameStatus } from '@/enum/game';
import { WsRoomSyncData } from '@/types/room';
import BuyStock from './components/BuyStock';

export default function Room() {
  const { roomID } = useParams(); // 获取 URL 参数中的 roomID
  const [createCompanyModalVisible, setCreateCompanyModalVisible] = useState(false);
  const [buyStockModalVisible, setBuyStockModalVisible] = useState(false);
  const [buyStockButtonVisible, setBuyStockButtonVisible] = useState(false);

  const [data, setData] = useState<WsRoomSyncData>();
  const [hoveredTile, setHoveredTile] = useState<string | undefined>(undefined);
  const userId = getOrCreateUserId();

  const { wsRef, sendMessage } = useWebSocket(`ws://192.168.3.6:8000/ws?roomID=${roomID}&userId=${userId}`, (msg) => {
    const data: WsRoomSyncData = JSON.parse(msg.data);
    if (data.type === 'sync') {
      console.log('收到数据：', data);
      setData(data);
      if (userId === data.roomData.currentPlayer) {
        if (data.roomData.roomInfo.status === GameStatus.CREATE_COMPANY) {
          setCreateCompanyModalVisible(true);
        } else {
          setCreateCompanyModalVisible(false);
        }
        if (data.roomData.roomInfo.status === GameStatus.BUY_STOCK) {
          setBuyStockButtonVisible(true);
        } else {
          setBuyStockButtonVisible(false);
        }
      } else {
        setCreateCompanyModalVisible(false);
        setBuyStockButtonVisible(false);
      }
    }
  });

  const handleClickTile = (tile: string) => {
    Modal.confirm({
      title: '确认操作',
      content: (
        <div>
          你确定要选择这个 tile 吗？
          <div style={{ fontWeight: 'bold', marginTop: 8 }}>{tile}</div>
        </div>
      ),
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        sendMessage(JSON.stringify({
          type: 'select_tile',
          payload: tile,
        }));
      },
    });
  };


  return (
    <div className={styles.roomContainer}>
      <div className={styles.topBar}>
        <div>房间号：{roomID}</div>
        <div>当前阶段：{data?.roomData.roomInfo.status}</div>
      </div>

      <Board tilesData={data?.roomData.tiles} hoveredTile={hoveredTile} />
      <BuyStock
        visible={buyStockModalVisible}
        onSubmit={(modalData) => {
          sendMessage(JSON.stringify({
            type: 'buy_stock',
            payload: modalData,
          }));
          setBuyStockModalVisible(false);
        }}
        data={data} />
      <HotelSelectorModal visible={createCompanyModalVisible} company={data?.roomData.companyInfo} onSelect={(company) => {
        sendMessage(JSON.stringify({
          type: 'create_company',
          payload: company,
        }));
      }} />
      <div className={styles.assets}>
        <div className={styles.playerAssets}>
          <h3>你的资产</h3>
          <ul className={styles.playerInfo}>
            <li>现金：${data?.playerData.info.money}</li>
            <li>
              股票：
              <ul className={styles.stockList}>
                {Object.entries(data?.playerData.stocks || {})
                  .filter(([_, count]) => Number(count) > 0)
                  .map(([company, count]) => (
                    <li key={company}>
                      {company} × {count}
                    </li>
                  ))}
              </ul>
            </li>
            <li>
              Tiles：
              <div className={styles.tileList}>
                {(data?.playerData.tiles || []).sort().map((tile: string) => (
                  <span
                    className={styles.tile}
                    key={tile}
                    onMouseEnter={() => { setHoveredTile(tile) }}
                    onMouseOut={() => { setHoveredTile(undefined) }}
                    onClick={() => handleClickTile(tile)}
                  >
                    {tile}
                  </span>
                ))}
              </div>
            </li>
          </ul>
        </div>

        <div className={styles.commonAssets}>
          <div className={styles.header}>
            <div className={styles.title}>市场信息</div>
            <Button
              type="primary"
              className={styles.buyStockBtn}
              disabled={!buyStockButtonVisible}
              onClick={() => {
                setBuyStockModalVisible(true);
              }}
            >
              购买股票
            </Button>
          </div>
          <table className={styles.marketTable}>
            <thead>
              <tr>
                <th>公司</th>
                <th>股价</th>
                <th>剩余股票</th>
                <th>土地数</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(data?.roomData.companyInfo || {}).map((company) => (
                <tr key={company.name}>
                  <td>{company.name}</td>
                  <td>${company.stockPrice}</td>
                  <td>{company.stockTotal}</td>
                  <td>{company.tiles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
