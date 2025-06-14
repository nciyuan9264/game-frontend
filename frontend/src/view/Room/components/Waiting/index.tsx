

import React  from 'react';
import { Modal  } from 'antd';

interface WaitingModalProps {
  content: string;
}

const WaitingModal: React.FC<WaitingModalProps> = ({
  content,
}) => {

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
      {content}
    </Modal>
  );
};

export default WaitingModal;
