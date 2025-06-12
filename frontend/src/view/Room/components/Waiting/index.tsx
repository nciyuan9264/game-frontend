

import React  from 'react';
import { Modal  } from 'antd';

interface WaitingModalProps {
  visible: boolean;
}

const WaitingModal: React.FC<WaitingModalProps> = ({
  visible,
}) => {

  return (
    <Modal
      title=""
      open={visible}
      closable={false}
      footer={null}
      centered
      maskClosable={false}
      width={800}
    >
      请等待其他玩家加入
    </Modal>
  );
};

export default WaitingModal;
