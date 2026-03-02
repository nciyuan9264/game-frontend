import React from 'react';
import { Button, Modal } from 'antd';
import { WsRoomSyncData } from '@/types/room';
import { backendName2FrontendName } from '@/util/user';
interface GameEndProps {
  visible: boolean;
  setGameEndModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  data?: WsRoomSyncData;
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

  const isOwner = data?.ownerID === userID;
  return (
    <Modal
      title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold' }}>🏁 游戏结算</div>}
      open={visible}
      closable={false}
      maskClosable={false}
      footer={
        <>
          <Button
            type="default"
            onClick={() => {
              setGameEndModalVisible(false);
            }}
          >
            关闭弹窗
          </Button>
          {isOwner && <Button
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
                    type: 'game_restart_game',
                  }));
                },
              })
            }}
          >
            再来一局
          </Button>
          }
        </>
      }
      onCancel={() => setGameEndModalVisible(false)}
      centered
      width={800}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', color: '#666', fontSize: 14, padding: '8px 16px', backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          {isOwner ? '游戏已结束，请查看您的排名。确认玩家无异议后可点击再来一局按钮。' : '游戏已结束，请查看您的排名。请等待房主开启下一局游戏。'}
        </div>
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
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''} 第{index + 1}名：<strong>{backendName2FrontendName(player)}</strong>
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
