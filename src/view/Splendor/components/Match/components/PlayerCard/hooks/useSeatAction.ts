import { useMemo } from 'react';

import { SplendorWsMatchSyncData } from '@/types/SplendorRoom';
import { Seat } from '../../../types';

import type { ConfirmOptions } from '@/components/ConfirmDialog/useConfirmDialog';

export type SeatAction = 'none' | 'add_ai' | 'remove_player';

interface UseSeatActionParams {
  data: Seat;
  userID: string;
  wsMatchSyncData?: SplendorWsMatchSyncData;
  uiState: 'idle' | 'adding' | 'success';
  sendMessage: (message: string) => void;
  onAddAISuccess: () => void;
  onAddAIStart: () => void;
  canAddAI: boolean;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export function useSeatAction({
  data,
  userID,
  wsMatchSyncData,
  uiState,
  sendMessage,
  onAddAIStart,
  canAddAI,
  confirm,
}: UseSeatActionParams) {
  const isOwner = wsMatchSyncData?.playerID === wsMatchSyncData?.ownerID;

  /** 当前允许的行为 */
  const action: SeatAction = useMemo(() => {
    if (!isOwner) return 'none';
    if (uiState !== 'idle') return 'none';

    if (!data.label && canAddAI) return 'add_ai';
    if (data.label && data.label !== userID) return 'remove_player';

    return 'none';
  }, [isOwner, uiState, data.label, userID, canAddAI]);

  const canOperate = action !== 'none';

  const handleClick = async () => {
    if (!canOperate) return;

    if (action === 'remove_player') {
      const ok = await confirm({
        title: '确认操作',
        content: '你确定要移除玩家吗？',
        okText: '确认',
        cancelText: '取消',
        danger: true,
      });
      if (!ok) return;
      sendMessage(
        JSON.stringify({
          type: 'match_remove_player',
          payload: { playerID: data.label },
        })
      );
      return;
    }

    if (action === 'add_ai') {
      onAddAIStart();
      sendMessage(
        JSON.stringify({
          type: 'match_add_ai',
        })
      );
    }
  };

  return {
    action,
    canOperate,
    isAddAI: action === 'add_ai',
    isRemove: action === 'remove_player',
    handleClick,
  };
}
