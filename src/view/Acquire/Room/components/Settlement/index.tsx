import React from 'react';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { getLocalStorageUserName } from '@/util/user';
import { CompanyColor } from '@/const/color';
import { CompanyTag } from '@/components/CompanyTag';
interface SettlementProps {
  data?: WsRoomSyncData;
}
const Settlement: React.FC<SettlementProps> = ({
  data,
}) => {
  const mainCompany = data?.tempData?.merge_main_company_temp;
  return (
    <div className={styles.settlementContainer}>
      <div className={styles.sectionTitle}>破产清算：被<CompanyTag company={mainCompany as CompanyKey} />合并的公司：</div>
      <div className={styles.companyList}>
        {
          Object.entries(data?.tempData?.mergeSettleData ?? {}).map(([company, value]) => {
            const companyName = company as CompanyKey;
            const dividends = value.dividends;
            return (
              <div key={company} className={styles.companyCard} style={{ borderLeft: `4px solid ${CompanyColor[companyName]}` }}>
                <CompanyTag company={companyName as CompanyKey} />
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
  );
};

export default Settlement;
