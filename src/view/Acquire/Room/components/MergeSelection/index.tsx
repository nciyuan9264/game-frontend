import React, { useState } from 'react';
import { Modal, Button, Radio } from 'antd';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import { useThrottleFn } from 'ahooks';
import { CompanyTag } from '@/components/CompanyTag';

interface CompanyStockActionModalProps {
  visible: boolean;
  data?: WsRoomSyncData;
  onOk: (val: CompanyKey) => void;
  onCancel?: () => void;
}

const MergeSelection: React.FC<CompanyStockActionModalProps> = ({
  visible,
  data,
  onOk,
  onCancel,
}) => {
  const [mainCompany, setMainCompany] = useState<CompanyKey | undefined>();
  const companyOptions = data?.tempData.merge_selection_temp.mainCompany || [];

  const { run: debouncedHandleSubmit } = useThrottleFn(() => {
    if (!mainCompany) {
      Modal.error({
        title: '请选择要留下的公司',
      });
      return;
    }
    onOk(mainCompany);
  }, { wait: 1000 });

  return (
    <Modal
      title="请选择要留下的公司"
      open={visible}
      closable={true}
      footer={
        <Button type="primary" onClick={debouncedHandleSubmit}>确定</Button>
      }
      centered
      maskClosable={true}
      onCancel={onCancel}
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
            <Radio key={company} value={company} >
              <CompanyTag company={company as CompanyKey} />
            </Radio>
          ))}
        </Radio.Group>
      )}
    </Modal>
  );
};

export default MergeSelection;
