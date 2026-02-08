import styles from './index.module.less'
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Button } from '../../../../../../components/Button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from 'antd';
import { WsMatchSyncData } from '@/types/room';

export interface IHeaderProps {
  isHostView: boolean
  wsRef: React.RefObject<WebSocket>
  currentPlayerData?: WsMatchSyncData['room']['players'][0]
  isAllReady?: boolean
  sendMessage: (message: string) => void
}

export const Header = ({
  isHostView,
  wsRef,
  currentPlayerData,
  isAllReady,
  sendMessage,
}: IHeaderProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomID = searchParams.get('roomID');

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <Button content="" icon={<ArrowLeftOutlined />} onClick={() => {
          Modal.confirm({
            title: '确认操作',
            content: '你确定要离开房间吗？',
            okText: '确认',
            cancelText: '取消',
            onOk: () => {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
              }
              setTimeout(() => {
                navigate('/game/acquire');
              }, 200);
            }
          })
        }} />
        <div className={styles.content}>
          <div className={styles.titleRow}>房间准备</div>
          <div className={styles.id}>{roomID}</div>
        </div>
      </div>
      <div className={styles.right}>
        {
          isHostView ?
            <Button
              disabled={!isAllReady}
              content={'开始游戏'}
              icon={<CheckCircleOutlined />}
              style={{
                backgroundColor: isAllReady ? 'rgba(34, 197, 167, 0.18)' : 'transparent',
                color: isAllReady ? '#00b3a6' : '#94a3b8',
                borderColor: isAllReady ? '#00b3a6' : '#94a3b8',
              }}
              onClick={() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  sendMessage(JSON.stringify({
                    type: 'match_begin',
                  }));
                }
              }}
            />
            :
            <Button
              content={currentPlayerData?.ready ? '取消准备' : '准备'}
              icon={<CheckCircleOutlined />}
              style={{
                backgroundColor: currentPlayerData?.ready ? 'rgba(245, 158, 11, 0.26)' : 'rgba(34, 197, 167, 0.18)',
                color: currentPlayerData?.ready ? '#f59e0b' : '#00b3a6',
                borderColor: currentPlayerData?.ready ? '#f59e0b' : '#00b3a6',
              }}
              onClick={() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  sendMessage(JSON.stringify({
                    type: 'match_ready',
                    payload: !currentPlayerData?.ready,
                  }));
                }
              }}
            />
        }
      </div>
    </div>
  )
}