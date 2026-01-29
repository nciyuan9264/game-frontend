import React from 'react';
import { Button, Modal } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { backendName2FrontendName } from '@/util/user';

interface GameEndProps {
  visible: boolean;
  setGameEndModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  data?: SplendorWsRoomSyncData;
  sendMessage: (message: string) => void;
  userID: string;
}

const GameEnd: React.FC<GameEndProps> = ({
  visible,
  setGameEndModalVisible,
  data,
  sendMessage,
  userID
}) => {
  const [searchParams] = useSearchParams();
  const roomUserID = searchParams.get('roomUserID');
  return (
    <Modal
      title="🏁 游戏结算"
      open={visible}
      closable={false}
      footer={
        <>
          {roomUserID === userID && <Button
            type="primary"
            onClick={() => {
              setGameEndModalVisible(false);
              Modal.confirm({
                title: '游戏即将重启',
                content: '游戏即将重启，是否确认？',
                okText: '确认',
                cancelText: '取消',
                onOk: () => {
                  sendMessage(JSON.stringify({
                    type: 'restart_game',
                  }));
                },
              })
            }}
          >
            再来一局
          </Button>}
        </>
      }
      onCancel={() => setGameEndModalVisible(false)}
      centered
      maskClosable={true}
      width={800}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {
          Object.entries(data?.playerData ?? {})
            .sort(([, playerA], [, playerB]) => {
              const playerAData = playerA as SplendorPlayerData;
              const playerBData = playerB as SplendorPlayerData;
              if (playerAData.score === playerBData.score) {
                return Number(playerAData.nobleCard.reduce((acc, card) => acc + card.points, 0)) - Number(playerBData.nobleCard.reduce((acc, card) => acc + card.points, 0));
              } else {
                return Number((playerB as SplendorPlayerData).score) - Number((playerA as SplendorPlayerData).score)
              }
            }) // 排序
            .map(([playerID, player], index) => {
              const playerData = player as SplendorPlayerData;
              const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32']; // 金 银 铜
              const bgColor = rankColors[index] || '#f0f2f5';
              const nobleScore = playerData.nobleCard.reduce((acc, card) => acc + card.points, 0);
              return (
                <div
                  key={playerID}
                  style={{
                    padding: '16px 24px',
                    borderRadius: 10,
                    backgroundColor: bgColor,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    fontWeight: index === 0 ? 'bold' : 'normal',
                    fontSize: 16,
                  }}
                >
                  <span>
                    🏅 第{index + 1}名：<strong>{backendName2FrontendName(playerID)}</strong>
                  </span>
                  <span>普通牌：{(playerData as SplendorPlayerData).score - nobleScore}分</span>
                  <span>贵族牌：{nobleScore}分</span>
                  <span>总分：{(playerData as SplendorPlayerData).score}</span>
                </div>
              );
            })
        }
      </div>
    </Modal>
  );
};

export default GameEnd;
