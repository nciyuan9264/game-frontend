import React from 'react';
import { Modal } from 'antd';
import { WsRoomSyncData } from '@/types/room';

interface GameEndProps {
  visible: boolean;
  setGameEndModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  data?: WsRoomSyncData;
}

const GameEnd: React.FC<GameEndProps> = ({
  visible,
  setGameEndModalVisible,
  data,
}) => {


  return (
    <Modal
      title="🏁 游戏结算"
      open={visible}
      closable={false}
      footer={
        null
      }
      onCancel={() => setGameEndModalVisible(false)}
      centered
      maskClosable={true}
      width={800}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {
          Object.entries(data?.result ?? {})
            .sort(([, scoreA], [, scoreB]) => Number(scoreB) - Number(scoreA)) // 排序
            .map(([player, score], index) => {
              const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32']; // 金 银 铜
              const bgColor = rankColors[index] || '#f0f2f5';

              return (
                <div
                  key={player}
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
                    🏅 第{index + 1}名：<strong>{player}</strong>
                  </span>
                  <span>总资产：${score}</span>
                </div>
              );
            })
        }
      </div>
    </Modal>

  );
};

export default GameEnd;
