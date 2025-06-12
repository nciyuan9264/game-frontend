import React, { useState } from 'react';
import { Modal, Button, Radio } from 'antd';
import { CompanyKey, WsRoomSyncData } from '@/types/room';

interface CompanyStockActionModalProps {
  visible: boolean;
  data?: WsRoomSyncData;
  onOk: (val: CompanyKey) => void;
  // onCancel?: () => void;
}

const MergeSelection: React.FC<CompanyStockActionModalProps> = ({
  visible,
  data,
  onOk,
  // onCancel,
}) => {
  const [mainCompany, setMainCompany] = useState<CompanyKey | undefined>();

  const handleSubmit = () => {
    if (!mainCompany) {
      Modal.error({
        title: '请选择要留下的公司',
      });
      return;
    }
    onOk(mainCompany);
  };

  const companyOptions = data?.roomData.merge_selection_temp.mainCompany || [];

  return (
    <Modal
      title="请选择要留下的公司"
      open={visible}
      closable={false}
      footer={
        <Button type="primary" onClick={handleSubmit}>
          确定
        </Button>
      }
      centered
      maskClosable={false}
      width={800}
    >
      {companyOptions.length === 0 ? (
        <p>暂无可选公司</p>
      ) : (
        <Radio.Group
          value={mainCompany}
          onChange={(e) => setMainCompany(e.target.value)}
        >
          {companyOptions.map((company) => (
            <Radio.Button key={company} value={company}>
              {company}
            </Radio.Button>
          ))}
        </Radio.Group>
      )}
    </Modal>
  );
};

export default MergeSelection;
