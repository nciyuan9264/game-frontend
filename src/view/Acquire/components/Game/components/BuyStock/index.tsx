import { CompanyKey, WsRoomSyncData } from '@/types/room';
import { message } from 'antd';
import { useState, useMemo, useEffect } from 'react';
import { CompanyColor } from '@/const/color';
import { useThrottleFn } from 'ahooks';
import { X } from 'lucide-react';

import styles from './index.module.less';
import { motion } from 'motion/react';
import Modal from '@/components/Modal';
import AnimatedNumber from '@/components/AnimatedNumber';

const BuyStock = ({
  visible,
  setBuyStockModalVisible,
  onSubmit,
  data,
}: {
  visible: boolean,
  setBuyStockModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  onSubmit: (modalData: Record<CompanyKey, number>) => void,
  data?: WsRoomSyncData
}) => {
  const initialSelectedCount = Object.keys(data?.roomData?.companyInfo ?? {}).reduce((acc, key) => {
    acc[key as CompanyKey] = 0;
    return acc;
  }, {} as Record<CompanyKey, number>);

  const [selectedCompany, setSelectedCompany] = useState<Record<CompanyKey, number>>(initialSelectedCount);
  const money = data?.playerData.money ?? 0;

  useEffect(() => {
    if (!visible) {
      setSelectedCompany(initialSelectedCount);
    }
  }, [visible]);

  const totalCost = useMemo(() => {
    return Object.entries(selectedCompany).reduce((sum, [k, count]) => {
      const key = k as CompanyKey; // 添加类型断言
      const price = Number(data?.roomData.companyInfo[key]?.stockPrice ?? 0);
      return sum + price * count;
    }, 0);
  }, [selectedCompany]);

  const handleChange = (key: CompanyKey, value: number | null) => {
    if (!value || value < 0) value = 0;

    // 先更新一个临时的 map 判断总花费是否超限
    const temp: Record<CompanyKey, number> = { ...selectedCompany, [key]: value };
    const tempNumber = Object.entries(temp).reduce((sum, [_, v]) => {
      const value = v as number; // 添加类型断言
      return sum + value;
    }, 0);
    if (tempNumber > 3) {
      message.error("不能超过 3 个");
      return;
    }
    const tempCost = Object.entries(temp).reduce((sum, [k, v]) => {
      const key = k as CompanyKey; // 添加类型断言
      const value = v as number; // 添加类型断言
      const price = Number(data?.roomData.companyInfo[key]?.stockPrice ?? 0);
      return sum + price * value;
    }, 0);

    if (tempCost > money) {
      message.error("超出余额，无法购买");
      return;
    }
    setSelectedCompany(temp);
  };

  const { run: debouncedHandleOk } = useThrottleFn(() => {
    onSubmit(selectedCompany);
  }, { wait: 500 });

  if (!data) return null;

  return (
    <Modal
      visible={visible}
      onClose={() => setBuyStockModalVisible(false)}
    >
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2>购买股票</h2>
          <p className={styles.subTitle}>
            每回合最多购买 3 只股票
          </p>
        </div>
        <button aria-label="Close modal" onClick={() => setBuyStockModalVisible(false)} className={styles.closeBtn}>
          <X size={22} />
        </button>
      </div>

      {/* List */}
      <div className={styles.list}>
        {Object.entries(data.roomData.companyInfo).map(([k, value]) => {
          const key = k as CompanyKey; // 添加类型断言
          const count = selectedCompany[key] ?? 0;
          const isSelected = count > 0;
          const isNoTiles = Number(value.tiles ?? 0) === 0;
          const isMaxed = count >= value.stockTotal;
          const canAfford = totalCost + value.stockPrice <= money;
          const limitReached = Object.values(selectedCompany).reduce((sum, v) => sum + v, 0) >= 3;
          const isDisabled =
            (limitReached || !canAfford || isMaxed || isNoTiles) && count === 0;

          return (
            <motion.div
              key={key}
              layout
              className={`${value.tiles === 0 ? styles.noTiles : ''} ${styles.row} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
              style={
                isSelected
                  ? {
                    borderColor: CompanyColor[key],
                    backgroundColor: `${CompanyColor[key]}33`,
                  }
                  : undefined
              }
            >
              <div className={styles.left}>
                <div
                  className={styles.logo}
                  style={{ backgroundColor: CompanyColor[key] }}
                >
                  {key.slice(0, 2).toUpperCase()}
                </div>

                <div className={styles.info}>
                  <div className={styles.title}>
                    <span
                      className={styles.companyName}
                      style={
                        isSelected
                          ? { color: CompanyColor[key] }
                          : undefined
                      }
                    >
                      {key}
                    </span>
                  </div>
                  <div className={styles.meta}>
                    <span>股票价格: {value.stockPrice}</span>
                    <span
                      className={
                        value.stockTotal < 5
                          ? styles.lowStock
                          : undefined
                      }
                    >
                      股票剩余: {value.stockTotal}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.controls}>
                <button
                  disabled={count === 0}
                  onClick={() => handleChange(key, count - 1)}
                >
                  -
                </button>

                <span className={styles.count}>{count}</span>

                <button
                  disabled={limitReached || !canAfford || isMaxed || isNoTiles}
                  onClick={() => handleChange(key, count + 1)}
                  style={
                    !limitReached && canAfford && !isMaxed && !isNoTiles
                      ? { backgroundColor: CompanyColor[key], color: '#fff' }
                      : undefined
                  }
                >
                  +
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.summary}>
          <div className={styles.totalCost}>
            <AnimatedNumber value={totalCost} /> / <AnimatedNumber value={money} />
          </div>
          <div className={styles.totalCost}>
            {Object.values(selectedCompany).reduce((sum, v) => sum + v, 0)} / 3
          </div>
        </div>

        <motion.button
          className={styles.confirmBtn}
          onClick={debouncedHandleOk}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          确认购买
        </motion.button>
      </div>
    </Modal>
  );
};

export default BuyStock;
