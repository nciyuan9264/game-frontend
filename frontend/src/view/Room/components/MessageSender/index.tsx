import React, { useState, useRef, useEffect } from 'react';
import { Popover, Button, message } from 'antd';
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
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelect = (msg: string) => {
    if (cooldown > 0) {
      message.warning('10秒内只能发送一次消息哦～');
      return;
    }

    onMessageSend(msg);
    setVisible(false);
    setCooldown(10); // 启动冷却倒计时

    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
      open={visible}
      onOpenChange={setVisible}
    >
      <Button
        size="large"
        shape="circle"
        icon={cooldown <= 0 && <MessageOutlined />}
        className={styles.messageButton}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `${cooldown}s` : null}
      </Button>
    </Popover>
  );
};

export default MessageSender;
