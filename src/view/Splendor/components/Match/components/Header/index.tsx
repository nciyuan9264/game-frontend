import styles from './index.module.less';
import { ArrowLeftOutlined, CheckCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SplendorPlayerInfo } from '@/types/SplendorRoom';
import { useConfirmDialog } from '@/components/ConfirmDialog/useConfirmDialog';

export interface IHeaderProps {
  isHostView: boolean;
  wsRef: React.RefObject<WebSocket>;
  currentPlayerData?: SplendorPlayerInfo;
  isAllReady?: boolean;
  sendMessage: (message: string) => void;
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
  const { confirm, ConfirmDialogHolder } = useConfirmDialog();

  return (
    <>
      <div className={styles.header}>
        <div className={styles.left}>
          <Button
            content=""
            icon={<ArrowLeftOutlined />}
            style={{ height: '2rem' }}
            onClick={async () => {
              const ok = await confirm({
                title: '确认操作',
                content: '你确定要离开房间吗？',
                okText: '确认',
                cancelText: '取消',
                danger: true,
              });
              if (!ok) return;
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
              }
              setTimeout(() => {
                navigate('/game/splendor');
              }, 200);
            }}
          />
          <div className={styles.content}>
            <div className={styles.titleRow}>璀璨宝石 · 房间准备</div>
            <div className={styles.id}>{roomID}</div>
          </div>
        </div>
        <div className={styles.right}>
          {isHostView && (
            <Button
              style={{ height: '2rem' }}
              content={'添加人机'}
              icon={<PlusCircleOutlined />}
              onClick={() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  sendMessage(
                    JSON.stringify({
                      type: 'match_add_ai',
                    })
                  );
                }
              }}
            />
          )}
          {isHostView ? (
            <Button
              style={{ height: '2rem' }}
              customType="primary"
              disabled={!isAllReady}
              content={'开始游戏'}
              icon={<CheckCircleOutlined />}
              onClick={() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  sendMessage(
                    JSON.stringify({
                      type: 'match_begin',
                    })
                  );
                }
              }}
            />
          ) : (
            <Button
              content={currentPlayerData?.ready ? '取消准备' : '准备'}
              icon={<CheckCircleOutlined />}
              style={{
                backgroundColor: currentPlayerData?.ready ? 'rgba(245, 158, 11, 0.26)' : 'rgba(168, 85, 247, 0.22)',
                color: currentPlayerData?.ready ? '#f59e0b' : '#c4b5fd',
                borderColor: currentPlayerData?.ready ? '#f59e0b' : '#a855f7',
                height: '2rem',
              }}
              onClick={() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  sendMessage(
                    JSON.stringify({
                      type: 'match_ready',
                      payload: {
                        ready: !currentPlayerData?.ready,
                      },
                    })
                  );
                }
              }}
            />
          )}
        </div>
      </div>
      {ConfirmDialogHolder}
    </>
  );
};
