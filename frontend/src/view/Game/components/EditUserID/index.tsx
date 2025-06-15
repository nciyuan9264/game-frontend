import { setLocalStorageUserID } from '@/util/user';
import { Input, Modal, message } from 'antd';
import { useEffect, useState, } from 'react';

const EditUserID = ({
  visible,
  setVisible,
  setUserID,
}: {
  visible: boolean,
  setVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setUserID: React.Dispatch<React.SetStateAction<string>>,
}) => {
  const [inputUserID, setInputUserID] = useState('');
  useEffect(() => {
    if (!visible) {
      setInputUserID('');
    }
  }, [visible]);
  return (
    <Modal
      open={visible}
      title="请输入用户名"
      closable={true}
      maskClosable={false}
      okText="确认"
      cancelText="取消"
      onOk={() => {
        const isValid = /^[a-zA-Z]+$/.test(inputUserID.trim());
        if (!isValid) {
          message.error('用户名必须为英文字符且不包含空格');
          return;
        }
        const name = setLocalStorageUserID(inputUserID.trim());
        setUserID(name);
        setVisible(false);
      }}
      onCancel={() => {
        setVisible(false);
      }}
    >
      <Input
        maxLength={20}
        style={{ width: '100%', padding: 8, fontSize: 16 }}
        value={inputUserID}
        onChange={(v) => setInputUserID(v.target.value)}
        placeholder="请输入用户名（仅英文、无空格、最大长度为20）"
      />
    </Modal>

  );
};

export default EditUserID;
