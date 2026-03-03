import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import { useThrottleFn } from 'ahooks';
import { CompanyColor } from '@/const/color';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import Modal from '@/components/Modal';

import styles from './index.module.less';

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
  const companyOptions = data?.tempData.merge_selection_temp.mainCompany || ['American', 'Continental'];

  useEffect(() => {
    setMainCompany(undefined);
  }, [visible]);

  const { run: debouncedHandleSubmit } = useThrottleFn(() => {
    if (!mainCompany) {
      message.error('请选择要留下的公司');
      return;
    }
    onOk(mainCompany);
  }, { wait: 1000 });

  if (!data) return null;

  return (
    <Modal
      visible={visible}
      onClose={() => onCancel?.()}
    >
      <div className={styles.header}>
        <div>
          <h2>选择公司</h2>
          <p className={styles.subTitle}>
            选择要保留的公司
          </p>
        </div>
        <button aria-label="Close modal" onClick={() => onCancel?.()} className={styles.closeBtn}>
          <X size={22} />
        </button>
      </div>

      <div className={styles.list}>
        {companyOptions.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>暂无可选公司</p>
        ) : (
          companyOptions.map((company) => {
            const isSelected = mainCompany === company;
            return (
              <motion.div
                key={company}
                layout
                className={`${styles.row} ${isSelected ? styles.selected : ''}`}
                style={
                  isSelected
                    ? {
                        borderColor: CompanyColor[company as CompanyKey],
                        backgroundColor: `${CompanyColor[company as CompanyKey]}33`,
                      }
                    : undefined
                }
                onClick={() => setMainCompany(company as CompanyKey)}
              >
                <div className={styles.left}>
                  <div
                    className={styles.logo}
                    style={{ backgroundColor: CompanyColor[company as CompanyKey] }}
                  >
                    {company.slice(0, 2).toUpperCase()}
                  </div>

                  <div className={styles.info}>
                    <div className={styles.title}>
                      <span
                        style={
                          isSelected
                            ? { color: CompanyColor[company as CompanyKey] }
                            : undefined
                        }
                      >
                        {company}
                      </span>
                    </div>
                    <div className={styles.meta}>
                      待合并
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className={styles.footer}>
        <motion.button
          className={styles.confirmBtn}
          onClick={debouncedHandleSubmit}
          disabled={!mainCompany}
          whileHover={mainCompany ? { scale: 1.02 } : {}}
          whileTap={mainCompany ? { scale: 0.95 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          确认选择
        </motion.button>
      </div>
    </Modal>
  );
};

export default MergeSelection;
