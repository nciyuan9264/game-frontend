import React, { useState } from 'react';
import { Popover, Button } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import styles from './index.module.less';

interface MessageSenderProps {
  onMessageSend: (text: string) => void;
}

export const PRESET_MESSAGES = [
  {
    message: '快点啊，我等的花都谢了',
    audioType: 'quickily'
  }
];

const MessageSender: React.FC<MessageSenderProps> = ({ onMessageSend }) => {
  const [visible, setVisible] = useState(false);

  const handleSelect = (msg: string) => {
    onMessageSend(msg);
    setVisible(false);
  };

  const content = (
    <div className={styles.popoverContent}>
      {PRESET_MESSAGES.map((item) => (
        <div
          key={item.audioType}
          className={styles.messageItem}
          onClick={() => handleSelect(item.audioType)}
        >
          {item.message}
        </div>
      ))}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="topRight"
      visible={visible}
      onVisibleChange={setVisible}
    >
      <Button
        size='large'
        shape="circle"
        icon={<MessageOutlined />}
        className={styles.messageButton}
      />
    </Popover>
  );
};

export default MessageSender;
