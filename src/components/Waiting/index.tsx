

import React, { useMemo } from 'react';
import { Alert, Modal } from 'antd';
import { WsRoomSyncData } from '@/types/room';
import { GameStatus } from '@/enum/game';
import { getMergingModalAvailible } from '@/view/Acquire/components/Game/utils/game';
import { backendName2FrontendName } from '@/util/user';
import Settlement from '@/view/Acquire/components/Game/components/Settlement';

interface WaitingModalProps {
  wsRoomSyncData: WsRoomSyncData | undefined;
  userID: string;
}

const WaitingModal: React.FC<WaitingModalProps> = ({
  wsRoomSyncData,
  userID,
}) => {

  const content = useMemo(() => {
      if (wsRoomSyncData?.roomData.roomInfo.roomStatus === GameStatus.END) {
        return '';
      }
      if (wsRoomSyncData?.roomData.roomInfo.roomStatus === false) {
        if (wsRoomSyncData?.roomData.roomInfo.roomStatus === GameStatus.WAITING) {
          return '请等待其他玩家加入';
        }
        const offlinePlayer = Object.entries(wsRoomSyncData?.roomData.players || {}).find(([_, player]) => {
          return !player.online;
        });
        return `请等待掉线玩家${backendName2FrontendName(offlinePlayer?.[0] ?? '')}重连，如果2min未重连将替换为ai玩家进行游戏`;
      }
      if (wsRoomSyncData?.roomData.roomInfo.roomStatus === GameStatus.MergingSettle && !getMergingModalAvailible(wsRoomSyncData, userID)) {
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
    }, [wsRoomSyncData, userID, getMergingModalAvailible, backendName2FrontendName, Settlement]);

  return (
    <Modal
      title=""
      open={content !== ''}
      closable={false}
      footer={null}
      centered
      maskClosable={false}
      width={800}
    >
      <div style={{fontSize: '1.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '10vh'}}>
        {content}
      </div>
    </Modal>
  );
};

export default WaitingModal;
