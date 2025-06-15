import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, message } from 'antd';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import CustomInputNumber from '../CustomInputer';
import { useThrottleFn } from 'ahooks';
import { getLocalStorageUserName } from '@/util/user';
import { CompanyColor } from '@/const/color';
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
      title="请选择要处理被并购公司股票的方式"
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
      <div className={styles.settlementContainer}>
        <div className={styles.sectionTitle}>破产清算：被<span style={{color: CompanyColor[mainCompany]}}>{mainCompany}</span>合并的公司：</div>
        <div className={styles.companyList}>
          {
            Object.entries(data?.tempData?.mergeSettleData ?? {}).map(([company, value]) => {
              const companyName = company as CompanyKey;
              const dividends = value.dividends;
              return (
                <div key={company} className={styles.companyCard} style={{borderLeft: `4px solid ${CompanyColor[companyName]}`}}>
                  <div className={styles.companyName} style={{color: CompanyColor[companyName]}}>{companyName}</div>
                  {
                    Object.entries(dividends)
                      .sort(([, a], [, b]) => Number(b) - Number(a)) // 按金额降序排列
                      .map(([key, value]) => (
                        <div key={key} className={styles.dividendRow}>
                          <div className={styles.name}>{getLocalStorageUserName(key)} 获得现金：</div>
                          <div className={styles.amount}>${value}</div>
                        </div>
                      ))
                  }
                </div>
              )
            })
          }
        </div>
      </div>

      {/* ✅ 股票操作表头 */}
      <div className={styles.sectionTitle} style={{ marginTop: 32 }}>股票处理</div>
      <Row className={styles.tableHeader}>
        <Col span={8}>被合并公司</Col>
        <Col span={6}>卖出数量</Col>
        <Col span={6}>兑换数量 (2:1兑换 <span style={{color: CompanyColor[mainCompany]}}>{mainCompany}</span>)</Col>
        <Col span={4}>持有数量</Col>
      </Row>

      {/* ✅ 每家公司股票操作 */}
      {
        (Object.keys(data?.tempData?.mergeSettleData ?? {}) as CompanyKey[])?.map((company: CompanyKey) => {
          const playerStock = data?.playerData.stocks[company] ?? 0;
          if (playerStock === 0) return null;

          const stockPrice = data?.roomData.companyInfo[company]?.stockPrice || 0;
          const currentAction = actions[company] || { sellAmount: 0, exchangeAmount: 0 };

          const maxSell = playerStock - currentAction.exchangeAmount;
          const maxExchange = Math.min(
            playerStock - currentAction.sellAmount,
            (data?.roomData.companyInfo[mainCompany]?.stockTotal || 0) * 2
          );

          return (
            <Row key={company} className={styles.stockRow} gutter={16}>
              <Col span={8}>
                <strong style={{color: CompanyColor[company]}}>{company}</strong>（单价: ${stockPrice}）
              </Col>
              <Col span={6}>
                <CustomInputNumber
                  min={0}
                  max={maxSell}
                  value={currentAction.sellAmount}
                  onChange={(value) => debouncedHandleSellChange(company as CompanyKey, value)}
                />
              </Col>
              <Col span={6}>
                <CustomInputNumber
                  min={0}
                  max={maxExchange}
                  step={2}
                  value={currentAction.exchangeAmount}
                  onChange={(value) => debouncedHandleExchangeChange(company as CompanyKey, value)}
                />
              </Col>
              <Col span={4}><strong>{playerStock}</strong></Col>
            </Row>
          );
        })
      }
    </Modal>

  );
};

export default CompanyStockActionModal;
