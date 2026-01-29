import { Modal, Tabs, Radio } from "antd";
import styles from './index.module.less';

export default function CreateRoomModal({
  createRoomVisible,
  setCreateRoomVisible,
  playerCount,
  setPlayerCount,
  tabKey,
  setTabKey,
  debouncedHandleOk,
  aiCount,
  setAiCount,
}: {
  createRoomVisible: boolean;
  setCreateRoomVisible: (visible: boolean) => void;
  playerCount: number;
  setPlayerCount: (count: number) => void;
  tabKey: string;
  setTabKey: (key: string) => void;
  debouncedHandleOk: () => void;
  aiCount: number;
  setAiCount: (count: number) => void;
}) {

  return (
    <Modal
      title="选择对战模式"
      open={createRoomVisible}
      onOk={debouncedHandleOk}
      onCancel={() => {
        setPlayerCount(2);
        setCreateRoomVisible(false);
        setTabKey('user');
      }}
      okText="创建"
      cancelText="取消"
      centered
      className={styles.modal}
      styles={{
        body: { textAlign: 'center', minHeight: '150px', paddingTop: '20px' },
      }}
    >
      <Tabs
        centered
        activeKey={tabKey}
        onChange={(key) => {
          if (key === 'ai') {
            setPlayerCount(2);
          }
          setTabKey(key)
        }}
        items={[
          { key: 'user', label: '用户对战' },
          { key: 'ai', label: '人机对战' },
        ]}
      />

      {tabKey === 'user' ? (
        <Radio.Group
          onChange={(e) => setPlayerCount(e.target.value)}
          value={playerCount}
          size="large"
        >
          {[2, 3, 4, 5, 6].map((num) => (
            <Radio.Button key={num} value={num} className={styles.radio}>
              {num} 人
            </Radio.Button>
          ))}
        </Radio.Group>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>请选择总人数</div>
            <Radio.Group
              onChange={(e) => {
                const newPlayerCount = e.target.value;
                setPlayerCount(newPlayerCount);
                // 🧠 限制 AI 数量不超过总人数
                if (aiCount > newPlayerCount) {
                  setAiCount(newPlayerCount);
                }
              }}
              value={playerCount}
              size="large"
            >
              {[2, 3, 4, 5, 6].map((num) => (
                <Radio.Button key={num} value={num} className={styles.radio}>
                  {num} 人
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          <div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>请选择人机数量</div>
            <Radio.Group
              onChange={(e) => setAiCount(e.target.value)}
              value={aiCount}
              size="large"
            >
              {Array.from({ length: playerCount - 1 }, (_, i) => i + 1).map((num) => (
                <Radio.Button key={num} value={num} className={styles.radio}>
                  {num} 个
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        </>
      )}
    </Modal>
  )
}