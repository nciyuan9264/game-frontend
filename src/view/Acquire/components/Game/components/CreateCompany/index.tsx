import { useEffect, useState } from "react";
import { message } from "antd";
import { CompanyInfoItem, CompanyKey } from "@/types/room";
import { CompanyColor } from "@/const/color";
import { useThrottleFn } from "ahooks";
import { X } from "lucide-react";
import { motion } from "motion/react";
import Modal from "@/components/Modal";

import styles from "./index.module.less";

const CreateCompanyModal = ({ visible, company, onSelect, onCancel }:
  {
    visible: boolean,
    company?: Record<CompanyKey, CompanyInfoItem>,
    onSelect: (company: string) => void,
    onCancel: () => void,
  }) => {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSelected(undefined);
  }, [visible])

  const { run: debouncedHandleOk } = useThrottleFn(() => {
    if (selected) {
      onSelect(selected);
    } else {
      message.error("请选择要创建的公司");
    }
  }, { wait: 1000 });

  if (!company) return null;
  return (
    <Modal
      visible={visible}
      onClose={onCancel}
    >
      <div className={styles.header}>
        <div>
          <h2>选择公司</h2>
          <p className={styles.subTitle}>
            选择要创建的公司
          </p>
        </div>
        <button aria-label="Close modal" onClick={onCancel} className={styles.closeBtn}>
          <X size={22} />
        </button>
      </div>

      <div className={styles.list}>
        {Object.entries(company).map(([key, value]) => {
          const isDisabled = value.tiles !== 0;
          const isSelected = selected === key;

          return (
            <motion.div
              key={key}
              layout
              className={`${styles.row} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
              style={
                isSelected
                  ? {
                    borderColor: CompanyColor[key as CompanyKey],
                    backgroundColor: `${CompanyColor[key as CompanyKey]}33`,
                  }
                  : undefined
              }
              onClick={() => !isDisabled && setSelected(key)}
            >
              <div className={styles.left}>
                <div
                  className={styles.logo}
                  style={{ backgroundColor: CompanyColor[key as CompanyKey] }}
                >
                  {key.slice(0, 2).toUpperCase()}
                </div>

                <div className={styles.info}>
                  <div className={styles.title}>
                    <span
                      className={styles.companyName}
                      style={
                        isSelected
                          ? { color: CompanyColor[key as CompanyKey] }
                          : undefined
                      }
                    >
                      {value.name}
                    </span>
                  </div>
                  <div className={`${styles.meta} ${isDisabled ? styles.unavailable : styles.available}`}>
                    {isDisabled ? '已创建' : '可创建'}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <motion.button
          className={styles.confirmBtn}
          onClick={debouncedHandleOk}
          disabled={!selected}
          whileHover={selected ? { scale: 1.02 } : {}}
          whileTap={selected ? { scale: 0.95 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          确认创建
        </motion.button>
      </div>
    </Modal>
  );
};

export default CreateCompanyModal;
