import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, message } from 'antd';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import CustomInputNumber from '../../../../../components/CustomInputer';
import { useThrottleFn } from 'ahooks';
import { getLocalStorageUserName } from '@/util/user';
import { CompanyColor } from '@/const/color';
import { CompanyTag } from '@/components/CompanyTag';
import Settlement from '../Settlement';
interface CompanyStockActionModalProps {
  visible: boolean;
  data?: WsRoomSyncData;
  onOk: (actions: Array<{
    company: string;
    sellAmount: number;
    exchangeAmount: number;
  }>) => void;
  onCancel: () => void;
}
const CompanyStockActionModal: React.FC<CompanyStockActionModalProps> = ({
  visible,
  data,
  onOk,
  onCancel,
}) => {
  const [actions, setActions] = useState<Record<CompanyKey, { sellAmount: number; exchangeAmount: number }>>({} as any);

  useEffect(() => {
    if (!visible) {
      const initial: Record<CompanyKey, { sellAmount: number; exchangeAmount: number }> = {} as any;
      Object.keys(data?.tempData.mergeSettleData ?? {}).forEach(company => {
        initial[company as CompanyKey] = { sellAmount: 0, exchangeAmount: 0 };
      });
      setActions(initial);
    }
  }, [visible, data?.tempData]);

  const mainCompany = data?.tempData?.merge_main_company_temp;

  const { run: debouncedHandleSellChange } = useThrottleFn((company: CompanyKey, value: number | null) => {
    const amount = value ?? 0;
    const maxAvailable = data?.playerData.stocks[company] || 0;
    const currentExchange = actions[company]?.exchangeAmount || 0;

    if (amount + currentExchange > maxAvailable) {
      message.warning(`不能超过持有的${maxAvailable}股`);
      return;
    }

    setActions(prev => ({
      ...prev,
      [company]: {
        ...prev[company],
        sellAmount: amount,
      },
    }));
  }, { wait: 0 });

  const { run: debouncedHandleExchangeChange } = useThrottleFn((company: CompanyKey, value: number | null) => {
    const amount = value ?? 0;
    const maxAvailable = data?.playerData.stocks[company] || 0;
    const currentSell = actions[company]?.sellAmount || 0;


    const mainStockTotal = mainCompany ? data?.roomData.companyInfo[mainCompany]?.stockTotal || 0 : 0;
    if (amount % 2 !== 0) {
      message.warning('兑换数量必须是偶数');
      return;
    }

    if (amount + currentSell > maxAvailable) {
      message.warning(`不能超过持有的${maxAvailable}股`);
      return;
    }

    if (amount / 2 > mainStockTotal) {
      message.warning(`主公司股票不足，最多可兑换${mainStockTotal * 2}股`);
      return;
    }

    setActions(prev => ({
      ...prev,
      [company]: {
        ...prev[company],
        exchangeAmount: amount,
      },
    }));
  }, { wait: 0 });

  const { run: debouncedHandleSubmit } = useThrottleFn(() => {
    const result = Object.entries(actions).map(([company, { sellAmount, exchangeAmount }]) => ({
      company,
      sellAmount,
      exchangeAmount,
    }));
    onOk(result);
  }, { wait: 1000 });

  if (!mainCompany) return null;
  return (
    <Modal
      title="请选择处理被并购公司股票的方式"
      open={visible}
      onCancel={onCancel}
      closable={true}
      footer={
        <Button type="primary" onClick={debouncedHandleSubmit}>
          确定
        </Button>
      }
      centered
      maskClosable={true}
      width={860}
      className={styles.settlementModal}
    >
      {/* ✅ 破产清算板块 */}
      <Settlement data={data} />

      {/* ✅ 股票操作表头 */}
      <div className={styles.sectionTitle} style={{ marginTop: 32 }}>股票处理</div>
      <Row className={styles.tableHeader}>
        <Col span={8}>被合并公司</Col>
        <Col span={5}>卖出数量</Col>
        <Col span={8}>兑换数量 (2:1兑换 <CompanyTag company={mainCompany as CompanyKey} />)</Col>
        <Col span={3}>持有数量</Col>
      </Row>

      {/* ✅ 每家公司股票操作 */}
      {
        (Object.keys(data?.tempData?.mergeSettleData ?? {}) as CompanyKey[])?.map((company: CompanyKey) => {
          const playerStock = data?.playerData.stocks[company] ?? 0;
          if (playerStock === 0) return null;

          const stockPrice = data?.roomData.companyInfo[company]?.stockPrice || 0;
          const currentAction = actions[company] || { sellAmount: 0, exchangeAmount: 0 };

          const maxSell = playerStock - Number(currentAction.exchangeAmount ?? 0);
          const maxExchange = Math.min(
            playerStock - Number(currentAction.sellAmount ?? 0),
            (data?.roomData.companyInfo[mainCompany]?.stockTotal || 0) * 2
          );

          return (
            <Row key={company} className={styles.stockRow} gutter={16}>
              <Col span={8}>
                <CompanyTag company={company as CompanyKey} />（单价: ${stockPrice}）
              </Col>
              <Col span={5}>
                <CustomInputNumber
                  min={0}
                  max={maxSell}
                  value={Number(currentAction.sellAmount ?? 0)}
                  onChange={(value) => debouncedHandleSellChange(company as CompanyKey, value)}
                />
              </Col>
              <Col span={8}>
                <CustomInputNumber
                  min={0}
                  max={maxExchange}
                  step={2}
                  value={Number(currentAction.exchangeAmount ?? 0)}
                  onChange={(value) => debouncedHandleExchangeChange(company as CompanyKey, value)}
                />
              </Col>
              <Col span={3}><strong>{playerStock}</strong></Col>
            </Row>
          );
        })
      }
    </Modal>
  );
};

export default CompanyStockActionModal;
