import React, { useState } from 'react';
import { Modal, Button, Radio } from 'antd';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import { CompanyColor } from '@/const/color';
import { useDebounceFn } from 'ahooks';

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
}) => {
  const [mainCompany, setMainCompany] = useState<CompanyKey | undefined>();

  const { run: debouncedHandleSubmit } = useDebounceFn(() => {
    if (!mainCompany) {
      Modal.error({
        title: '请选择要留下的公司',
      });
      return;
    }
    onOk(mainCompany);
  }, { wait: 1000 });
  const companyOptions = data?.tempData.merge_selection_temp.mainCompany || [];
  return (
    <Modal
      title="请选择要留下的公司"
      open={visible}
      closable={false}
      footer={
        <Button type="primary" onClick={debouncedHandleSubmit}>确定</Button>
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
            <Radio.Button key={company} value={company} style={{background: CompanyColor[company as CompanyKey]}}>
              {company}
            </Radio.Button>
          ))}
        </Radio.Group>
      )}
    </Modal>
  );
};

export default MergeSelection;
