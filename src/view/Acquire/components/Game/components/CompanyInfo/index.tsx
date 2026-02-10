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
  const [_, setDeltas] = useState<CompanyDelta>({});
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

  const stockList = Object.entries(data?.playerData.stocks || {})
    .filter(([_, count]) => Number(count) > 0);

  if (!data) return null;

  return (
    <div className={styles.companyInfo} style={{ display: Object.values(data.roomData.companyInfo).some(company => company.tiles) ? 'flex' : 'none' }}>
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

        const stockCount = stockList.find(([name]) => name === company.name)?.[1] || 0;
        return (
          <div className={`${styles.company} ${!company.tiles ? styles.noTiles : ''}`} key={company.name}
            style={{
              boxShadow: company.tiles ? `
              0 0 0 1.5px ${CompanyColor[company.name as CompanyKey]}AA,
              0 0 10px 2px ${CompanyColor[company.name as CompanyKey]}66
            ` : 'unset',
            }}>
            <div className={styles.left}>
              <div className={styles.dot} style={{ backgroundColor: company.tiles ? CompanyColor[company.name as CompanyKey] : 'unset' }} />
              <div className={styles.companyName} style={{ color: company.tiles ? CompanyColor[company.name as CompanyKey] : 'unset' }}>{company.name}</div>
            </div>
            <div className={styles.right}>
              <div className={styles.bottom}>
                <div className={styles.bottomvValue}>股价 {renderValue(company.stockPrice)}</div>
                <div className={styles.bottomvValue}>剩余{renderValue(company.stockTotal)}股</div>
                <div className={`${styles.bottomvValue} ${styles.tilesInfo}`}>土地{renderValue(company.tiles)}</div>
                <div className={`${styles.bottomvValue} ${styles.stockInfo}`}>持仓{renderValue(stockCount)} 股</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CompanyInfo;
