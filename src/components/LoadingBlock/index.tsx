import { Spin } from "antd";
import styles from './index.module.less';

export const LoadingBlock = ({ content = '正在加载游戏房间列表，请稍候...' }: { content?: string }) => {
  return (
    <div
      className={styles['loading-block']}>
      <Spin
        size="large"
        style={{ marginBottom: 20 }}
      />
      <div style={{ color: '#ffffff', fontSize: 16, marginTop: 16 }}>
        {content || '正在加载游戏房间列表，请稍候...'}
      </div>
    </div>
  )
}