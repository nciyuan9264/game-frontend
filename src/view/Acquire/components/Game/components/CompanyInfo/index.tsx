import React, { useEffect, useRef, useState } from 'react';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { CompanyColor } from '@/const/color';

interface CompanyInfoProps {
  setBuyStockModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setMergeCompanyModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  data?: WsRoomSyncData;
  userID: string;
}

interface CompanyDelta {
  [key: string]: {
    stockPrice: number;
    stockTotal: number;
    tiles: number;
  };
}

const CompanyInfo: React.FC<CompanyInfoProps> = ({
  data,
}) => {
  const prevDataRef = useRef<WsRoomSyncData>();
  const [deltas, setDeltas] = useState<CompanyDelta>({});
  useEffect(() => {
    if (!data) return;
    const prev = prevDataRef.current;
    const delta: CompanyDelta = {};

    if (prev) {
      const companies = data.roomData.companyInfo;
      for (const name in companies) {
        const prevCompany = prev.roomData.companyInfo[name as CompanyKey];
        const currCompany = companies[name as CompanyKey];
        if (!prevCompany) continue;

        delta[name] = {
          stockPrice: currCompany.stockPrice - prevCompany.stockPrice,
          stockTotal: currCompany.stockTotal - prevCompany.stockTotal,
          tiles: currCompany.tiles - prevCompany.tiles,
        };
      }
      if (!Object.entries(delta).map(([_, v]) => v).every(v => v.stockPrice === 0 && v.stockTotal === 0 && v.tiles === 0)) {
        setDeltas(delta);
      }
    }

    prevDataRef.current = data;
  }, [data?.roomData.currentPlayer]);

  if (!data) return null;

  return (
    <div className={styles.companyInfo}>
      {Object.values(data.roomData.companyInfo).map((company) => {
        // const companyDelta = deltas[company.name] || { stockPrice: 0, stockTotal: 0, tiles: 0 };
        const renderValue = (value: number) => {
          // let className = '';
          // if (diff > 0) className = `${styles.increase} ${styles.flash}`;
          // if (diff < 0) className = `${styles.decrease} ${styles.flash}`;

          return (
            <div className={styles.value}>
              {value}
              {/* {diff !== 0 && (
                <span className={className}>
                  &nbsp;{diff > 0 ? `+${diff}` : diff}
                </span>
              )} */}
            </div>
          );
        };
        return (
          <div className={styles.company} key={company.name} style={{
            boxShadow: `
              0 0 0 1.5px ${CompanyColor[company.name as CompanyKey]}AA,
              0 0 10px 2px ${CompanyColor[company.name as CompanyKey]}66
            `,
          }}>
            <div className={styles.left}>
              <div className={styles.dot} style={{ backgroundColor: CompanyColor[company.name as CompanyKey] }} />
              <div className={styles.companyName}>{company.name}</div>
            </div>
            <div className={styles.right}>
              <div className={styles.bottom}>
                <div className={styles.top}>股价 {renderValue(company.stockPrice)}</div>
                <div className={styles.bottomvValue}>剩余{renderValue(company.stockTotal)}股</div>
                <div className={styles.bottomvValue}>土地{renderValue(company.tiles)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CompanyInfo;
