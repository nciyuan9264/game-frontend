import { Spin } from "antd";

export const LoadingBlock = ({content = '正在加载游戏房间列表，请稍候...'}: {content?: string}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: window.innerHeight,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Spin
        tip="加载中..."
        size="large"
        style={{ marginBottom: 20 }}
      />
      <div style={{ color: '#ffffff', fontSize: 16, marginTop: 16 }}>
        {content || '正在加载游戏房间列表，请稍候...'}
      </div>
    </div>
  )
}