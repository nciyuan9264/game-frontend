import { Modal } from "antd";

export const useGameOperate = (sendMessage: (message: string) => void) => {

  const placeTile = (tileKey: string) =>
    Modal.confirm({
      title: '确认操作',
      content: (
        <div>
          你确定要放置这个 tile 吗？
          <div style={{ fontWeight: 'bold', marginTop: 8 }}>{tileKey}</div>
        </div>
      ),
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        sendMessage(
          JSON.stringify({
            type: 'game_place_tile',
            payload: { tileKey },
          })
        );
      },
    });

  return { placeTile }
}



