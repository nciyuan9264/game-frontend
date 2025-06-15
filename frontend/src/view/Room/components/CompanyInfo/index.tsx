import React from 'react';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { CompanyColor } from '@/const/color';

interface CompanyInfoProps {
  setBuyStockModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setMergeCompanyModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  data?: WsRoomSyncData;
  userID: string;
}
const CompanyInfo: React.FC<CompanyInfoProps> = ({
  data,
}) => {
  if (!data) return null;
  return (
    <div className={styles.companyInfo}>
      <div className={styles.header}>
        <div className={styles.title}>市场信息</div>
        <div className={styles.buttons}>
        </div>
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
          {Object.values(data?.roomData.companyInfo || {}).map((company) => (
            <tr key={company.name}>
              <td className={`${styles.companyName}`}
                style={{
                  backgroundColor: CompanyColor[company.name as CompanyKey]
                }}
              >{company.name}</td>
              <td>${company.stockPrice}</td>
              <td>{company.stockTotal}</td>
              <td>{company.tiles}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyInfo;
