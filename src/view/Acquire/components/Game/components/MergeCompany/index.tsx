import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { useThrottleFn } from 'ahooks';
import { CompanyColor } from '@/const/color';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import Modal from '@/components/Modal';
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
      visible={visible}
      onClose={onCancel}
    >
      <div className={styles.header}>
        <div>
          <h2>处理股票</h2>
          <p className={styles.subTitle}>
            选择处理被并购公司股票的方式
          </p>
        </div>
        <button aria-label="Close modal" onClick={onCancel} className={styles.closeBtn}>
          <X size={22} />
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <Settlement data={data} />
        </div>

        <div className={`${styles.section} ${styles.stockSection}`}>
          <div className={styles.sectionTitle}>股票处理</div>
          <div className={styles.stockTable}>
            <div className={styles.tableHeader}>
              <div>被合并公司</div>
              <div>卖出数量</div>
              <div>兑换数量 (2:1兑换 {mainCompany})</div>
              <div>持有数量</div>
            </div>

            {(Object.keys(data?.tempData?.mergeSettleData ?? {}) as CompanyKey[])?.map((company: CompanyKey) => {
              const playerStock = data?.playerData.stocks[company] ?? 0;
              if (playerStock === 0) return null;

              const stockPrice = data?.roomData.companyInfo[company]?.stockPrice || 0;
              const currentAction = actions[company] || { sellAmount: 0, exchangeAmount: 0 };

              const maxSell = playerStock - Number(currentAction.exchangeAmount ?? 0);
              const maxExchange = Math.min(
                playerStock - Number(currentAction.sellAmount ?? 0),
                (data?.roomData.companyInfo[mainCompany]?.stockTotal || 0) * 2
              );

              const handleSellChange = (delta: number) => {
                const currentValue = Number(currentAction.sellAmount ?? 0);
                let newValue = currentValue + delta;
                if (newValue < 0) newValue = 0;
                if (newValue > maxSell) newValue = maxSell;
                
                setActions(prev => ({
                  ...prev,
                  [company]: {
                    sellAmount: newValue,
                    exchangeAmount: prev[company]?.exchangeAmount ?? 0,
                  },
                }));
              };

              const handleExchangeChange = (delta: number) => {
                const currentValue = Number(currentAction.exchangeAmount ?? 0);
                let newValue = currentValue + delta;
                if (newValue < 0) newValue = 0;
                if (newValue > maxExchange) newValue = maxExchange;
                if (newValue % 2 !== 0) {
                  message.warning('兑换数量必须是偶数');
                  return;
                }
                
                setActions(prev => ({
                  ...prev,
                  [company]: {
                    sellAmount: prev[company]?.sellAmount ?? 0,
                    exchangeAmount: newValue,
                  },
                }));
              };

              return (
                <motion.div
                  key={company}
                  className={styles.stockRow}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={styles.companyInfo}>
                    <div
                      className={styles.logo}
                      style={{ backgroundColor: CompanyColor[company] }}
                    >
                      {company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.companyDetails}>
                      <div className={styles.companyName}
                        style={{ color: CompanyColor[company] }}
                      >
                        {company}
                      </div>
                      <div className={styles.stockPrice}>
                        <span>单价: ${stockPrice}</span>
                        <span>持有数量: {playerStock}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.fieldContainer}>
                    <span className={styles.fieldLabel}>卖出</span>
                    <div className={styles.controls}>
                      <button
                        disabled={currentAction.sellAmount <= 0}
                        onClick={() => handleSellChange(-1)}
                      >
                        -
                      </button>
                      <span className={styles.count}>{currentAction.sellAmount}</span>
                      <button
                        disabled={currentAction.sellAmount >= maxSell}
                        onClick={() => handleSellChange(1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className={styles.fieldContainer}>
                    <span className={styles.fieldLabel}>兑换</span>
                    <div className={styles.controls}>
                      <button
                        disabled={currentAction.exchangeAmount <= 0}
                        onClick={() => handleExchangeChange(-2)}
                      >
                        -
                      </button>
                      <span className={styles.count}>{currentAction.exchangeAmount}</span>
                      <button
                        disabled={currentAction.exchangeAmount >= maxExchange}
                        onClick={() => handleExchangeChange(2)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <motion.button
          className={styles.confirmBtn}
          onClick={debouncedHandleSubmit}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          确定
        </motion.button>
      </div>
    </Modal>
  );
};

export default CompanyStockActionModal;
