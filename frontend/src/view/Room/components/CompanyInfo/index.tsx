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
      setDeltas(delta);
    }

    prevDataRef.current = data;
  }, [data?.roomData.companyInfo]);

  if (!data) return null;

  return (
    <div className={styles.companyInfo}>
      <div className={styles.header}>
        <div className={styles.title}>市场信息</div>
      </div>
      <table className={styles.marketTable}>
        <thead>
          <tr>
            <th>公司</th>
            <th>股价</th>
            <th>剩余股票</th>
            <th>土地数</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(data.roomData.companyInfo).map((company) => {
            const companyDelta = deltas[company.name] || { stockPrice: 0, stockTotal: 0, tiles: 0 };

            const renderValue = (value: number, diff: number) => {
              let className = '';
              if (diff > 0) className = `${styles.increase} ${styles.flash}`;
              if (diff < 0) className = `${styles.decrease} ${styles.flash}`;

              return (
                <div className={styles.value}>
                  {value}
                  {diff !== 0 && (
                    <span className={className}>
                      &nbsp;{diff > 0 ? `+${diff}` : diff}
                    </span>
                  )}
                </div>
              );
            };


            return (
              <tr key={company.name}>
                <td
                  className={styles.companyName}
                  style={{ backgroundColor: CompanyColor[company.name as CompanyKey] }}
                >
                  {company.name}
                </td>
                <td>{renderValue(company.stockPrice, companyDelta.stockPrice)}</td>
                <td>{renderValue(company.stockTotal, companyDelta.stockTotal)}</td>
                <td>{renderValue(company.tiles, companyDelta.tiles)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyInfo;
