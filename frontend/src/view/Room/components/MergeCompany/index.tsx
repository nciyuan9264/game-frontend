import React, { useState, useEffect } from 'react';
import { Modal, Button, InputNumber, Row, Col, message } from 'antd';
import { CompanyKey, WsRoomSyncData } from '@/types/room';

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
  const [totalCost, setTotalCost] = useState(0);

  // 每次 visible 或 data.roomData.merge_other_companies_temp 变化时，初始化 actions
  useEffect(() => {
    if (visible ) {
      const initial: Record<CompanyKey, { sellAmount: number; exchangeAmount: number }> = {} as any;
      Object.keys(data?.tempData.mergeSettleData ?? {}).forEach(company => {
        initial[company as CompanyKey] = { sellAmount: 0, exchangeAmount: 0 };
      });
      setActions(initial);
      setTotalCost(0);
    }
  }, [visible, data?.tempData]);
  
  const mainCompany = data?.tempData?.merge_main_company_temp;
  if (!mainCompany) return null;
  const handleSellChange = (company: CompanyKey, value: number | null) => {
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
  };

  const handleExchangeChange = (company: CompanyKey, value: number | null) => {
    const amount = value ?? 0;
    const maxAvailable = data?.playerData.stocks[company] || 0;
    const currentSell = actions[company]?.sellAmount || 0;


    const mainStockTotal = data?.roomData.companyInfo[mainCompany]?.stockTotal || 0;
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
  };

  const handleSubmit = () => {
    const result = Object.entries(actions).map(([company, { sellAmount, exchangeAmount }]) => ({
      company,
      sellAmount,
      exchangeAmount,
    }));
    onOk(result);
  };
  const mainStockPrice = data?.roomData.companyInfo[mainCompany]?.stockPrice || 0;

  return (
    <Modal
      title="请选择要处理被并购公司股票的方式"
      open={visible}
      onCancel={onCancel}
      closable={false}
      footer={
        <Button
          type="primary"
          onClick={handleSubmit}
        >
          确定 (总花费: {totalCost})
        </Button>
      }
      centered
      maskClosable={false}
      width={800}
    >
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>被合并公司</Col>
          <Col span={6}>卖出数量</Col>
          <Col span={6}>兑换数量 (2:1兑换{mainCompany})</Col>
          <Col span={4}>持有数量</Col>
        </Row>
      </div>

      {(Object.keys(data?.tempData?.mergeSettleData ?? {}) as CompanyKey[])?.map((company: CompanyKey) => {
        const playerStock = data?.playerData.stocks[company] ?? 0;
        if (playerStock === 0) return null;

        const stockPrice = data?.roomData.companyInfo[company]?.stockPrice || 0;
        const currentAction = actions[company] || { sellAmount: 0, exchangeAmount: 0 };

        // 计算最大可卖出和最大可兑换数量
        const maxSell = playerStock - currentAction.exchangeAmount;
        const maxExchange = Math.min(
          playerStock - currentAction.sellAmount,
          (data?.roomData.companyInfo[mainCompany]?.stockTotal || 0) * 2
        );

        return (
          <Row key={company} gutter={16} style={{ marginBottom: 12 }}>
            <Col span={8}>
              {company} (单价: {stockPrice})
            </Col>
            <Col span={6}>
              <InputNumber
                min={0}
                max={maxSell}
                value={currentAction.sellAmount}
                onChange={(value) => handleSellChange(company as CompanyKey, value)}
              />
              <span style={{ marginLeft: 8 }}>总价: {currentAction.sellAmount * stockPrice}</span>
            </Col>
            <Col span={6}>
              <InputNumber
                min={0}
                max={maxExchange}
                step={2}
                value={currentAction.exchangeAmount}
                onChange={(value) => handleExchangeChange(company as CompanyKey, value)}
              />
            </Col>
            <Col span={4}>{playerStock}</Col>
          </Row>
        );
      })}
    </Modal>
  );
};

export default CompanyStockActionModal;
